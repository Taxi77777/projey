# =========== Copyright 2023 @ CAMEL-AI.org. All Rights Reserved. ===========
# Licensed under the Apache License, Version 2.0 (the “License”);
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an “AS IS” BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =========== Copyright 2023 @ CAMEL-AI.org. All Rights Reserved. ===========
from __future__ import annotations

import asyncio
import logging
from collections import deque
from typing import Deque, Dict, List, Optional

from colorama import Fore

from camel.agents import BaseAgent, ChatAgent
from camel.configs import ChatGPTConfig
from camel.messages.base import BaseMessage
from camel.models import ModelFactory
from camel.tasks.task import Task, TaskState
from camel.toolkits import MAP_FUNCS, SEARCH_FUNCS, WEATHER_FUNCS
from camel.types import ModelPlatformType, ModelType
from camel.workforce.base import BaseNode
from camel.workforce.role_playing_worker import RolePlayingWorker
from camel.workforce.single_agent_worker import SingleAgentWorker
from camel.workforce.task_channel import TaskChannel
from camel.workforce.utils import (
    check_if_running,
    parse_assign_task_resp,
    parse_create_node_resp,
)
from camel.workforce.worker import Worker
from camel.workforce.workforce_prompt import (
    ASSIGN_TASK_PROMPT,
    CREATE_NODE_PROMPT,
    WF_TASK_DECOMPOSE_PROMPT,
)

logger = logging.getLogger(__name__)


class Workforce(BaseNode):
    r"""A system where multiple workder nodes (agents) cooperate together
    to solve tasks. It can assign tasks to workder nodes and also take
    strategies such as create new worker, decompose tasks, etc. to handle
    situations when the task fails.
    """

    def __init__(
        self,
        description: str,
        children: Optional[List[BaseNode]] = None,
        coordinator_agent_kwargs: Optional[Dict] = None,
        task_agent_kwargs: Optional[Dict] = None,
        new_worker_agent_kwargs: Optional[Dict] = None,
    ) -> None:
        r"""Initialize the workforce.

        Args:
            description (str): Description of the node.
            children (Optional[List[BaseNode]], optional): List of child nodes
                under this node. Each child node can be a worker node or
                another workforce node. Defaults to `None`.
            coordinator_agent_kwargs (Optional[Dict], optional): Keyword
                arguments for the coordinator agent, e.g. `model`, `api_key`,
                `tools`, etc. Defaults to `None`.
            task_agent_kwargs (Optional[Dict], optional): Keyword arguments for
                the task agent, e.g. `model`, `api_key`, `tools`, etc.
                Defaults to `None`.
            new_worker_agent_kwargs (Optional[Dict]): Default keyword arguments
                for the worker agent that will be created during runtime to
                handle failed tasks, e.g. `model`, `api_key`, `tools`, etc.
                Defaults to `None`.
        """
        super().__init__(description)
        self._child_listening_tasks: Deque[asyncio.Task] = deque()
        self._children = children or []
        self.new_worker_agent_kwargs = new_worker_agent_kwargs

        coord_agent_sys_msg = BaseMessage.make_assistant_message(
            role_name="Workforce Manager",
            content="You are coordinating a group of workers. A worker can be "
            "a group of agents or a single agent. Each worker is "
            "created to solve a specific kind of task. Your job "
            "includes assigning tasks to a existing worker, creating "
            "a new worker for a task, etc.",
        )
        self.coordinator_agent = ChatAgent(
            coord_agent_sys_msg, **(coordinator_agent_kwargs or {})
        )

        task_sys_msg = BaseMessage.make_assistant_message(
            role_name="Task Planner",
            content="You are going to compose and decompose tasks.",
        )
        self.task_agent = ChatAgent(task_sys_msg, **(task_agent_kwargs or {}))

        # If there is one, will set by the workforce class wrapping this
        self._task: Optional[Task] = None
        self._pending_tasks: Deque[Task] = deque()

    def __repr__(self):
        return f"Workforce {self.node_id} ({self.description})"

    @check_if_running(False)
    def process_task(self, task: Task) -> Task:
        r"""The main entry point for the workforce to process a task. It will
        start the workforce and all the child nodes under it, process the
        task provided and return the updated task.

        Args:
            task (Task): The task to be processed.
        """
        self.reset()
        self._task = task
        self._pending_tasks.append(task)
        self.set_channel(TaskChannel())

        asyncio.run(self.start())

        return task

    @check_if_running(False)
    def add_single_agent_worker(
        self, description: str, worker: BaseAgent
    ) -> Workforce:
        r"""Add a worker node to the workforce that uses a single agent.

        Args:
            description (str): Description of the worker node.
            worker (BaseAgent): The agent to be added.
        """
        worker_node = SingleAgentWorker(description, worker)
        self._children.append(worker_node)
        return self

    @check_if_running(False)
    def add_role_playing_worker(
        self,
        description: str,
        assistant_role_name: str,
        user_role_name: str,
        assistant_agent_kwargs: Optional[Dict] = None,
        user_agent_kwargs: Optional[Dict] = None,
        chat_turn_limit: int = 3,
    ) -> Workforce:
        r"""Add a worker node to the workforce that uses `RolePlaying` system.

        Args:
            description (str): Description of the node.
            assistant_role_name (str): The role name of the assistant agent.
            user_role_name (str): The role name of the user agent.
            assistant_agent_kwargs (Optional[Dict], optional): The keyword
                arguments to initialize the assistant agent in the role
                playing, like the model name, etc. Defaults to `None`.
            user_agent_kwargs (Optional[Dict], optional): The keyword arguments
                to initialize the user agent in the role playing, like the
                model name, etc. Defaults to `None`.
            chat_turn_limit (int, optional): The maximum number of chat turns
                in the role playing. Defaults to 3.
        """
        worker_node = RolePlayingWorker(
            description,
            assistant_role_name,
            user_role_name,
            assistant_agent_kwargs,
            user_agent_kwargs,
            chat_turn_limit,
        )
        self._children.append(worker_node)
        return self

    @check_if_running(False)
    def reset(self) -> None:
        r"""Reset the workforce and all the child nodes under it. Can only
        be called when the workforce is not running."""
        super().reset()
        self._task = None
        self._pending_tasks.clear()
        self._child_listening_tasks.clear()
        self.coordinator_agent.reset()
        self.task_agent.reset()
        for child in self._children:
            child.reset()

    @check_if_running(False)
    def add_workforce(self, workforce: Workforce) -> Workforce:
        r"""Add a workforce node to the workforce.

        Args:
            workforce (Workforce): The workforce node to be added.
        """
        self._children.append(workforce)
        return self

    @check_if_running(False)
    def set_channel(self, channel: TaskChannel):
        r"""Set the channel for the node and all the child nodes under it."""
        self._channel = channel
        for child in self._children:
            child.set_channel(channel)

    def _get_child_nodes_info(self) -> str:
        r"""Get the information of all the child nodes under this node."""
        return '\n'.join(
            f'{child.node_id}: {child.description}' for child in self._children
        )

    def _find_assignee(
        self,
        task: Task,
        failed_log: Optional[str] = None,
    ) -> str:
        r"""Assigns a task to a child node if capable, otherwise create a
        new worker node.

        Parameters:
            task (Task): The task to be assigned.
            failed_log (Optional[str]): Optional log of a previous failed
                attempt.

        Returns:
            str: ID of the assigned node.
        """
        self.coordinator_agent.reset()
        prompt = ASSIGN_TASK_PROMPT.format(
            content=task.content,
            child_nodes_info=self._get_child_nodes_info(),
        )
        req = BaseMessage.make_user_message(
            role_name="User",
            content=prompt,
        )
        response = self.coordinator_agent.step(req)
        try:
            logger.info(f"Selected node: {response.msg.content}")
            assignee_id = parse_assign_task_resp(response.msg.content)
        except ValueError:
            assignee_id = self._create_worker_node_for_task(task).node_id
        return assignee_id

    async def _post_task(self, task: Task, assignee_id: str) -> None:
        await self._channel.post_task(task, self.node_id, assignee_id)

    async def _post_dependency(self, dependency: Task) -> None:
        await self._channel.post_dependency(dependency, self.node_id)

    def _create_worker_node_for_task(self, task: Task) -> Worker:
        r"""Creates a new worker node for a given task and add it to the
        children list of this node. This is one of the actions that
        the coordinator can take when a task has failed.

        Args:
            task (Task): The task for which the worker node is created.

        Returns:
            Worker: The created worker node.
        """
        prompt = CREATE_NODE_PROMPT.format(
            content=task.content,
            child_nodes_info=self._get_child_nodes_info(),
        )
        req = BaseMessage.make_user_message(
            role_name="User",
            content=prompt,
        )
        response = self.coordinator_agent.step(req)
        new_node_conf = parse_create_node_resp(response.msg.content)

        new_agent = self._create_new_agent(
            new_node_conf.role,
            new_node_conf.sys_msg,
        )

        new_node = SingleAgentWorker(
            description=new_node_conf.description,
            worker=new_agent,
        )
        new_node.set_channel(self._channel)

        print(f"{Fore.CYAN}{new_node} created.{Fore.RESET}")

        self._children.append(new_node)
        self._child_listening_tasks.append(
            asyncio.create_task(new_node.start())
        )
        return new_node

    def _create_new_agent(self, role: str, sys_msg: str) -> ChatAgent:
        worker_sys_msg = BaseMessage.make_assistant_message(
            role_name=role,
            content=sys_msg,
        )

        if self.new_worker_agent_kwargs is not None:
            return ChatAgent(worker_sys_msg, **self.new_worker_agent_kwargs)

        # Default tools for a new agent
        function_list = [
            *SEARCH_FUNCS,
            *WEATHER_FUNCS,
            *MAP_FUNCS,
        ]

        model_config_dict = ChatGPTConfig(
            tools=function_list,
            temperature=0.0,
        ).as_dict()

        model = ModelFactory.create(
            model_platform=ModelPlatformType.OPENAI,
            model_type=ModelType.GPT_3_5_TURBO,
            model_config_dict=model_config_dict,
        )

        return ChatAgent(worker_sys_msg, model=model, tools=function_list)

    async def _get_returned_task(self) -> Task:
        r"""Get the task that's published by this node and just get returned
        from the assignee.
        """
        return await self._channel.get_returned_task_by_publisher(self.node_id)

    async def _post_ready_tasks(self) -> None:
        r"""Send all the pending tasks that have all the dependencies met to
        the channel, or directly return if there is none. For now, we will
        directly send the first task in the pending list because all the tasks
        are linearly dependent."""

        if not self._pending_tasks:
            return

        ready_task = self._pending_tasks[0]

        # If the task has failed previously, just compose and send the task
        # to the channel as a dependency
        if ready_task.state == TaskState.FAILED:
            # TODO: the composing of tasks seems not work very well
            self.task_agent.reset()
            ready_task.compose(self.task_agent)
            # Remove the subtasks from the channel
            for subtask in ready_task.subtasks:
                await self._channel.remove_task(subtask.id)
            # Send the task to the channel as a dependency
            await self._post_dependency(ready_task)
            self._pending_tasks.popleft()
            # Try to send the next task in the pending list
            await self._post_ready_tasks()
        else:
            # Directly post the task to the channel if it's a new one
            # Find a node to assign the task
            assignee_id = self._find_assignee(task=ready_task)
            await self._post_task(ready_task, assignee_id)

    async def _handle_failed_task(self, task: Task) -> bool:
        if task.failure_count >= 3:
            return True
        task.failure_count += 1
        # Remove the failed task from the channel
        await self._channel.remove_task(task.id)
        if task.get_depth() >= 3:
            # Create a new worker node and reassign
            assignee = self._create_worker_node_for_task(task)
            await self._post_task(task, assignee.node_id)
        else:
            decompose_prompt = WF_TASK_DECOMPOSE_PROMPT.format(
                content=task.content,
                child_nodes_info=self._get_child_nodes_info(),
            )
            self.task_agent.reset()
            subtasks = task.decompose(self.task_agent, decompose_prompt)
            task.subtasks = subtasks
            for subtask in subtasks:
                subtask.parent = task
            # Insert packets at the head of the queue
            self._pending_tasks.extendleft(reversed(subtasks))
            await self._post_ready_tasks()
        return False

    async def _handle_completed_task(self, task: Task) -> None:
        # archive the packet, making it into a dependency
        self._pending_tasks.popleft()
        await self._channel.archive_task(task.id)
        await self._post_ready_tasks()

    @check_if_running(False)
    async def _listen_to_channel(self) -> None:
        r"""Continuously listen to the channel, post task to the channel and
        track the status of posted tasks.
        """

        self._running = True
        logger.info(f"Workforce {self.node_id} started.")

        await self._post_ready_tasks()

        while self._task is None or self._pending_tasks:
            returned_task = await self._get_returned_task()
            if returned_task.state == TaskState.DONE:
                await self._handle_completed_task(returned_task)
            elif returned_task.state == TaskState.FAILED:
                halt = await self._handle_failed_task(returned_task)
                if not halt:
                    continue
                print(
                    f"{Fore.RED}Task {returned_task.id} has failed "
                    f"for 3 times, halting the workforce.{Fore.RESET}"
                )
                break
            elif returned_task.state == TaskState.OPEN:
                # TODO: multi-layer workforce
                pass
            else:
                raise ValueError(
                    f"Task {returned_task.id} has an unexpected state."
                )

        # shut down the whole workforce tree
        self.stop()

    @check_if_running(False)
    async def start(self) -> None:
        r"""Start itself and all the child nodes under it."""
        for child in self._children:
            child_listening_task = asyncio.create_task(child.start())
            self._child_listening_tasks.append(child_listening_task)
        await self._listen_to_channel()

    @check_if_running(True)
    def stop(self) -> None:
        r"""Stop all the child nodes under it. The node itself will be stopped
        by its parent node.
        """
        for child in self._children:
            child.stop()
        for child_task in self._child_listening_tasks:
            child_task.cancel()
        self._running = False
