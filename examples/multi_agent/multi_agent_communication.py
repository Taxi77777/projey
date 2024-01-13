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
import html
import json
import re

from colorama import Fore

from camel.agents.deductive_reasoner_agent import DeductiveReasonerAgent
from camel.agents.insight_agent import InsightAgent
from camel.agents.role_assignment_agent import RoleAssignmentAgent
from camel.configs import ChatGPTConfig, FunctionCallingConfig
from camel.functions import MATH_FUNCS, SEARCH_FUNCS
from camel.societies import RolePlaying
from camel.types import ModelType, TaskType


def main(model_type=ModelType.GPT_3_5_TURBO_16K, task_prompt=None,
         context_text=None) -> None:
    # Start the multi-agent communication
    print_and_write_md("========================================",
                       color=Fore.BLACK)
    print_and_write_md("Welcome to CAMEL-AI Society!", color=Fore.RED)
    print_and_write_md("================ INPUT TASK ================",
                       color=Fore.BLACK)
    print_and_write_md(f"Original task prompt:\n{task_prompt}\n",
                       color=Fore.YELLOW)
    print_and_write_md("============== INPUT CONTEXT ==============",
                       color=Fore.BLACK)
    print_and_write_md(f"Context text:\n{context_text}\n", color=Fore.YELLOW)
    print_and_write_md("========================================",
                       color=Fore.BLACK)

    # Model and agent initialization
    model_config = ChatGPTConfig()
    role_assignment_agent = RoleAssignmentAgent(model_type=model_type,
                                                model_config=model_config)
    insight_agent = InsightAgent(model_type=model_type,
                                 model_config=model_config)
    deductive_reasoner_agent = DeductiveReasonerAgent(
        model_type=model_type, model_config=model_config)

    # Generate role with descriptions
    print("Please enter the number of roles you want to generate (#roles >= "
          "3, default number is 4): ")
    num_roles = int(input())
    while num_roles < 3:
        print("The number of roles should be larger or equal to 3, please "
              "enter again: ")
    role_descriptions_dict = \
        role_assignment_agent.run_role_with_description(
            task_prompt=task_prompt, num_roles=num_roles, role_names=None,
            function_list=[*SEARCH_FUNCS])

    # Split the original task into subtasks
    subtasks_with_dependencies_dict = \
        role_assignment_agent.split_tasks(
            task_prompt=task_prompt,
            role_descriptions_dict=role_descriptions_dict,
            num_subtasks=None,
            context_text=context_text)

    # Draw the graph of the subtasks
    oriented_graph = {}
    for subtask_idx, details in subtasks_with_dependencies_dict.items():
        deps = details["dependencies"]
        oriented_graph[subtask_idx] = deps
    # TODO: cycle detection and handling
    role_assignment_agent.draw_subtasks_graph(oriented_graph=oriented_graph)

    # Get the list of subtasks
    subtasks = [
        subtasks_with_dependencies_dict[key]["description"]
        for key in sorted(subtasks_with_dependencies_dict.keys())
    ]

    # Calculate the execution order of the subtasks, based on their
    # dependencies
    parallel_subtask_pipelines = \
        role_assignment_agent.get_task_execution_order(
            subtasks_with_dependencies_dict)

    # Initialize the environment record
    environment_record = {}  # The cache of the system
    if context_text is not None:
        insights = insight_agent.run(context_text=context_text)
        for insight in insights.values():
            if insight["entity_recognition"] is None:
                continue
            tags = tuple(insight["entity_recognition"])
            environment_record[tags] = insight

    # Print a part of the configurations of the multi-agent communication
    # to specific markdown files
    print_and_write_md(
        f"List of {len(role_descriptions_dict)} roles with description:",
        color=Fore.GREEN)
    for role_name in role_descriptions_dict.keys():
        print_and_write_md(
            f"{role_name}:\n" + f"{role_descriptions_dict[role_name]}\n",
            color=Fore.BLUE)
    print_and_write_md(f"List of {len(subtasks)} subtasks:", color=Fore.YELLOW)
    for i, subtask in enumerate(subtasks):
        print_and_write_md(f"Subtask {i + 1}:\n{subtask}", color=Fore.YELLOW)
    for idx, subtask_group in enumerate(parallel_subtask_pipelines, 1):
        print_and_write_md(f"Pipeline {idx}: {', '.join(subtask_group)}",
                           color=Fore.YELLOW)
    print_and_write_md(
        "Dependencies among subtasks: " +
        json.dumps(subtasks_with_dependencies_dict, indent=4), color=Fore.BLUE,
        file_path="dependencies among subtasks")
    print_and_write_md("========================================",
                       color=Fore.BLACK)

    # structured output for user request
    print_and_write_md("================= TASK =======================",
                       color=Fore.RED, file_path="Solution")
    print_and_write_md(f"\n{task_prompt}\n", color=Fore.BLACK,
                       file_path="Solution")
    print_and_write_md("================= REQUIREMENT =======================",
                       color=Fore.RED, file_path="Solution")
    print_and_write_md(f"\n{context_text}\n", color=Fore.BLACK,
                       file_path="Solution")
    print_and_write_md("================= 小说内容 ====================",
                       color=Fore.RED, file_path="Solution")

    # structured output for user request
    print_and_write_md("================= TASK =======================",
                       color=Fore.RED, file_path="Solution")
    print_and_write_md(f"\n{task_prompt}\n", color=Fore.WHITE,
                       file_path="Solution")
    print_and_write_md("================= REQUIREMENT =======================",
                       color=Fore.RED, file_path="Solution")
    print_and_write_md(f"\n{context_text}\n", color=Fore.WHITE,
                       file_path="Solution")
    print_and_write_md("================= TRAVEL BOOKLET ====================",
                       color=Fore.RED, file_path="Solution")

    # Resolve the subtasks in sequence of the pipelines
    for subtask_id in (subtask for pipeline in parallel_subtask_pipelines
                       for subtask in pipeline):
        # Get the description of the subtask
        subtask = \
            subtasks_with_dependencies_dict[subtask_id]["description"]
        subtask_labels = \
            subtasks_with_dependencies_dict[subtask_id]["input_tags"]
        # Get the insights from the environment for the subtask
        insights_for_subtask = get_insights_from_environment(
            subtask_id, subtask, subtask_labels, environment_record,
            deductive_reasoner_agent, role_assignment_agent, insight_agent,
            context_text)

        # Get the role with the highest compatibility score
        # TODO: fix the bug of not enough scores for user/assistant role
        role_compatibility_scores_dict = (
            role_assignment_agent.evaluate_role_compatibility(
                subtask, role_descriptions_dict))

        # Get the top two roles with the highest compatibility scores
        ai_assistant_role = \
            max(role_compatibility_scores_dict,
                key=lambda role:
                role_compatibility_scores_dict[role]["score_assistant"])
        ai_user_role = \
            max(role_compatibility_scores_dict,
                key=lambda role:
                role_compatibility_scores_dict[role]["score_user"])

        ai_assistant_description = role_descriptions_dict[ai_assistant_role]
        ai_user_description = role_descriptions_dict[ai_user_role]

        print_and_write_md("================ SESSION ================",
                           color=Fore.BLACK)
        print_and_write_md(f"{subtask_id}: \n{subtask}\n", color=Fore.YELLOW)
        print_and_write_md(
            f"AI Assistant Role: {ai_assistant_role}\n" +
            f"{ai_assistant_description}\n", color=Fore.GREEN)
        print_and_write_md(
            f"AI User Role: {ai_user_role}\n" + f"{ai_user_description}\n",
            color=Fore.BLUE)

        subtask_content = (
            "- Description of TASK:\n" +
            subtasks_with_dependencies_dict[subtask_id]["description"] +
            "\n- Input of TASK:\n" +
            subtasks_with_dependencies_dict[subtask_id]["input_content"] +
            "\n- Output Standard for the completion of TASK:\n" +
            subtasks_with_dependencies_dict[subtask_id]["output_standard"])
        print_and_write_md(
            f"Task of the role-playing ({subtask_id}):\n"
            f"{subtask_content}\n\n", color=Fore.RED, file_path=subtask_id)

        # You can use the following code to play the role-playing game
        sys_msg_meta_dicts = [
            dict(
                assistant_role=ai_assistant_role, user_role=ai_user_role,
                assistant_description=ai_assistant_description + "\n" +
                insights_for_subtask, user_description=ai_user_description +
                "\n" + insights_for_subtask) for _ in range(2)
        ]  # System message meta data dicts

        function_list = [*MATH_FUNCS, *SEARCH_FUNCS]

        # Assistant model config
        assistant_config = \
            FunctionCallingConfig.from_openai_function_list(
                function_list=function_list,
                kwargs=dict(temperature=0.7),
            )

        # User model config
        user_config = FunctionCallingConfig.from_openai_function_list(
            function_list=function_list,
            kwargs=dict(temperature=0.7),
        )

        assistant_agent_kwargs = dict(
            model_type=ModelType.GPT_4_TURBO,
            model_config=assistant_config,
            function_list=function_list,
        )

        user_agent_kwargs = dict(
            model_type=ModelType.GPT_4_TURBO,
            model_config=user_config,
            function_list=function_list,
        )

        role_play_session = RolePlaying(
            assistant_role_name=ai_assistant_role,
            user_role_name=ai_user_role,
            assistant_agent_kwargs=assistant_agent_kwargs,
            user_agent_kwargs=user_agent_kwargs,
            task_prompt=subtask_content,
            model_type=ModelType.GPT_4_TURBO,
            task_type=TaskType.ROLE_DESCRIPTION,
            with_task_specify=False,
            extend_sys_msg_meta_dicts=sys_msg_meta_dicts,
        )

        actions_record = ("The TASK of the context text is:\n" +
                          f"{subtask}\n")
        chat_history = ""

        # Start the role-playing to complete the subtask
        chat_turn_limit, n = 50, 0
        input_assistant_msg, _ = role_play_session.init_chat()
        while n < chat_turn_limit:
            n += 1
            assistant_response, user_response = role_play_session.step(
                input_assistant_msg)

            print_and_write_md(
                f"AI User: {ai_user_role}\n\n" +
                f"{user_response.msg.content}\n", color=Fore.BLUE,
                file_path=subtask_id)

            # Summarize the user guidance
            instructions = user_response.msg.content.split("Instruction:")[-1]
            instruction = instructions.split("Input:")[0]
            print_and_write_md(f"\n{instruction}\n", color=Fore.RED,
                               file_path="Solution")

            print_and_write_md(
                f"AI Assistant: {ai_assistant_role}\n\n" +
                f"{assistant_response.msg.content}\n", color=Fore.GREEN,
                file_path=subtask_id)

            # Extract the action from the assistant's response
            actions = assistant_response.msg.content.split("Action:")[-1]
            action = actions.split("Next request.")[0]
            if action != "CAMEL_TASK_DONE":
                print_and_write_md(f"\n{action}\n", color=Fore.BLACK,
                                   file_path="Solution")

            actions_record += (f"--- [{n}] ---\n"
                               f"{assistant_response.msg.content}\n")
            user_conversation = user_response.msg.content
            assistant_conversation = assistant_response.msg.content.replace(
                "Solution&Action:\n", "").replace("Next request.",
                                                  "").strip("\n")  # noqa
            transformed_text_with_category = \
                role_assignment_agent.transform_dialogue_into_text(
                    user=ai_user_role, assistant=ai_assistant_role,
                    task_prompt=subtask,
                    user_conversation=user_conversation,
                    assistant_conversation=assistant_conversation)
            if ("ASSISTANCE" in transformed_text_with_category["categories"]
                    or "ANALYSIS"
                    in transformed_text_with_category["categories"]):
                transformed_text = transformed_text_with_category["text"]
                chat_history += (transformed_text + "\n\n")

            print(Fore.BLUE + "AI User:\n"
                  f"{user_response.msg.content}\n")
            print(Fore.GREEN + "AI Assistant:\n"
                  f"{assistant_response.msg.content}\n")

            if assistant_response.terminated:
                print(Fore.GREEN +
                      (f"{ai_assistant_role} terminated. Reason: "
                       f"{assistant_response.info['termination_reasons']}."))
                break
            if user_response.terminated:
                print(Fore.GREEN + (
                    f"{ai_user_role} terminated. "
                    f"Reason: {user_response.info['termination_reasons']}."))
                break

            if "CAMEL_TASK_DONE" in user_response.msg.content or \
                    "CAMEL_TASK_DONE" in assistant_response.msg.content:
                break

            input_assistant_msg = assistant_response.msg

        print_and_write_md(
            f"Output of the {subtask_id}:\n" + f"{chat_history}\n",
            color=Fore.GREEN)

        insights_instruction = ("The CONTEXT TEXT is the steps to resolve " +
                                "the TASK. The INSIGHTs should come solely" +
                                "from the actions/steps.")
        insights = insight_agent.run(context_text=actions_record,
                                     insights_instruction=insights_instruction)
        for insight in insights.values():
            if insight["entity_recognition"] is None:
                continue
            labels_key = tuple(insight["entity_recognition"])
            environment_record[labels_key] = insight
        printable_environment_record = \
            [insight_data for _, insight_data in environment_record.items()]
        print_and_write_md(
            "Environment record:\n" +
            f"{json.dumps(printable_environment_record, indent=4)}",
            color=Fore.CYAN, file_path=f"environment record of {subtask_id}")


def get_insights_from_environment(subtask_id, subtask, subtask_labels,
                                  environment_record, deductive_reasoner_agent,
                                  role_assignment_agent, insight_agent,
                                  context_text):
    # React to the environment, and get the insights from it
    conditions_and_quality_json = \
        deductive_reasoner_agent.deduce_conditions_and_quality(
            starting_state="None",
            target_state=subtask)

    target_labels = list(
        set(conditions_and_quality_json["labels"]) | set(subtask_labels))
    print(f"Target labels for {subtask_id}:\n{target_labels}")

    labels_sets = [
        list(labels_set) for labels_set in environment_record.keys()
    ]
    print(f"Labels sets for {subtask_id}:\n{labels_sets}")

    _, _, _, labels_retrieved_sets = \
        role_assignment_agent.get_retrieval_index_from_environment(
            labels_sets=labels_sets,
            target_labels=target_labels)
    print_and_write_md(
        "Retrieved labels from the environment:\n" +
        f"{labels_retrieved_sets}", color=Fore.CYAN,
        file_path=f"retrieved labels for {subtask_id}")

    # Retrive the necessaray insights from the environment
    retrieved_insights = [
        environment_record[tuple(label_set)]
        for label_set in labels_retrieved_sets
    ]
    print("Retrieved insights from the environment for "
          f"{subtask_id}:\n"
          f"{json.dumps(retrieved_insights, indent=4)}")

    insights_none_pre_subtask = insight_agent.run(context_text=context_text)
    insights_for_subtask = (
        "\n====== CURRENT STATE =====\n"
        "The snapshot and the context of the TASK is presentd in "
        "the following insights which is close related to The "
        "\"Insctruction\" and the \"Input\":\n" +
        f"{json.dumps(insights_none_pre_subtask, indent=4)}\n")

    insights_for_subtask += "\n".join(
        [json.dumps(insight, indent=4) for insight in retrieved_insights])

    print_and_write_md(
        f"Insights from the context text:\n{insights_for_subtask}",
        color=Fore.GREEN, file_path="insights of context text for "
        f"{subtask_id}")

    return insights_for_subtask


def print_and_write_md(text="", color=Fore.RESET, file_path=None):
    # Print the text in the terminal
    # print(color + text)

    if file_path is None:
        file_path = ("examples/multi_agent/"
                     "tmp_of_multi_agent/multi-agent-output.md")
    else:
        file_path = ("examples/multi_agent/"
                     f"tmp_of_multi_agent/{file_path}.md")
    COLOR_MAP_MD = {
        Fore.BLUE: 'blue',
        Fore.GREEN: 'darkgreen',
        Fore.YELLOW: 'darkorange',
        Fore.RED: 'darkred',
        Fore.BLACK: 'black',
        Fore.RESET: 'reset',
        Fore.CYAN: 'darkcyan',
    }

    # Replace patterns outside of code blocks
    def replace_outside_code_blocks(text, color):
        # Split the text into code blocks and non-code blocks
        blocks = re.split("```", text)

        modified_blocks = []
        for i, block in enumerate(blocks):
            if i % 2 == 0:  # Non-code blocks
                lines = block.split('\n')
                modified_lines = [
                    f"<span style='color: {COLOR_MAP_MD[color]};'>" +
                    f"{line}</span>\n" if line else line for line in lines
                ]
                modified_block = '\n'.join(modified_lines)
                modified_blocks.append(modified_block)
            else:  # Code blocks
                modified_blocks.append(f"\n```{block}```\n")

        return ''.join(modified_blocks)

    escaped_text = html.escape("\n" + text)

    # Replace tabs and newlines outside of code blocks
    md_text = replace_outside_code_blocks(escaped_text, color)

    # Write to the markdown file
    with open(file_path, mode='a', encoding="utf-8") as file:
        file.write(md_text)


if __name__ == "__main__":
    root_path = "examples/multi_agent/demo_examples/"
    file_names_task_prompt = [
        "task_prompt_trading_bot.txt",
        "task_prompt_authentication.txt",
        "task_prompt_supply_chain.txt",
        "task_prompt_endpoint_implementation.txt",
        "task_prompt_science_fiction.txt",
        "task_prompt_business_novel.txt",
        "task_prompt_experiment.txt",
        "task_prompt_GPT_prediction.txt",
        "task_prompt_event_query.txt",
        "task_prompt_trip_planning.txt",
        "task_prompt_book.txt",
        "task_prompt_character.txt",
    ]
    file_names_context = [
        "context_content_trading_bot.txt",
        "context_content_authentication.txt",
        "context_content_supply_chain.txt",
        "context_content_endpoint_implementation.txt",
        "context_content_science_fiction.txt",
        "context_content_business_novel.txt",
        "context_content_experiment.txt",
        "context_content_GPT_prediction.txt",
        "context_content_event_query.txt",
        "context_content_trip_planning.txt",
        "context_content_book.txt",
        "context_content_character.txt",
    ]

    index = -1
    with open(root_path + file_names_task_prompt[index], mode='r',
              encoding="utf-8") as file:
        task_prompt = file.read()
    with open(root_path + file_names_context[index], mode='r',
              encoding="utf-8") as file:
        context_text = file.read()

    main(task_prompt=task_prompt, context_text=context_text)
