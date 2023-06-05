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
import pytest

from camel.agents import TaskPlannerAgent, TaskSpecifyAgent
from camel.configs import ChatGPTConfig
from camel.typing import TaskType
from camel.utils import openai_api_key_required


@pytest.mark.slow
@openai_api_key_required
def test_task_specify_ai_society_agent():
    original_task_prompt = "Improving stage presence and performance skills"
    print(f"Original task prompt:\n{original_task_prompt}\n")
    task_specify_agent = TaskSpecifyAgent(model_config=ChatGPTConfig(
        temperature=1.0))
    specified_task_prompt = task_specify_agent.step(
        original_task_prompt, meta_dict=dict(assistant_role="Musician",
                                             user_role="Student"))
    assert ("{" and "}" not in task_specify_agent.task_specify_prompt)
    print(f"Specified task prompt:\n{specified_task_prompt}\n")


@pytest.mark.slow
@openai_api_key_required
def test_task_specify_code_agent():
    original_task_prompt = "Modeling molecular dynamics"
    print(f"Original task prompt:\n{original_task_prompt}\n")
    task_specify_agent = TaskSpecifyAgent(
        task_type=TaskType.CODE,
        model_config=ChatGPTConfig(temperature=1.0),
    )
    specified_task_prompt = task_specify_agent.step(
        original_task_prompt, meta_dict=dict(domain="Chemistry",
                                             language="Python"))
    assert ("{" and "}" not in task_specify_agent.task_specify_prompt)
    print(f"Specified task prompt:\n{specified_task_prompt}\n")


@pytest.mark.slow
@openai_api_key_required
def test_task_planner_agent():
    original_task_prompt = "Modeling molecular dynamics"
    print(f"Original task prompt:\n{original_task_prompt}\n")
    task_specify_agent = TaskSpecifyAgent(
        task_type=TaskType.CODE,
        model_config=ChatGPTConfig(temperature=1.0),
    )
    specified_task_prompt = task_specify_agent.step(
        original_task_prompt, meta_dict=dict(domain="Chemistry",
                                             language="Python"))
    print(f"Specified task prompt:\n{specified_task_prompt}\n")
    task_planner_agent = TaskPlannerAgent(model_config=ChatGPTConfig(
        temperature=1.0))
    planned_task_prompt = task_planner_agent.step(specified_task_prompt)
    print(f"Planned task prompt:\n{planned_task_prompt}\n")
