# ========= Copyright 2023-2024 @ CAMEL-AI.org. All Rights Reserved. =========
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ========= Copyright 2023-2024 @ CAMEL-AI.org. All Rights Reserved. =========
# coding: utf-8


"""
A cookbook to generate question-answer pairs
using CAMEL's O1DataGenerator and upload them to HuggingFace.
This script demonstrates the process of:
1. Generating Q&A data using CAMEL's O1DataGenerator
2. Transforming the data into a suitable format
3. Uploading the dataset to HuggingFace
"""


# # o1datagen_uploadtohf with CAMEL

import json
import os
from datetime import datetime

# First we will set the OPENAI_API_KEY that will be used to generate the data.
from getpass import getpass

# ### Set ChatAgent
from camel.agents import ChatAgent

# Use ModelFactory to set up the backend model for agent
from camel.configs import ChatGPTConfig
from camel.datahubs.huggingface import HuggingFaceDatasetManager
from camel.datahubs.models import Record
from camel.models import ModelFactory
from camel.o1datagen.o1datagen import O1DataGenerator
from camel.types import ModelPlatformType, ModelType

openai_api_key = getpass('Enter your OpenAI API key: ')
os.environ["OPENAI_API_KEY"] = openai_api_key


# Create a system message to define agent's default role and behaviors.


sys_msg = 'You are a genius at slow-thinking data and code'


# Define the model, here in this case we use gpt-4o-mini
model = ModelFactory.create(
    model_platform=ModelPlatformType.OPENAI,
    model_type=ModelType.GPT_4O_MINI,
    model_config_dict=ChatGPTConfig().as_dict(),
    # [Optional] the config for model
)


chat_agent = ChatAgent(
    system_message=sys_msg,
    model=model,
    message_window_size=10,
)


# ### Load Q&A data from a JSON file


def load_qa_data(file_path):
    """
    Load question-answer data from a JSON file.

    Args:
        file_path (str): Path to the JSON file containing Q&A data

    Returns:
        dict: Loaded Q&A data from the JSON file
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


# Load JSON data
qa_data = load_qa_data('qa_data.json')


# ### Create an instance of O1DataGenerator


# Create an instance of O1DataGenerator
testo1 = O1DataGenerator(chat_agent, golden_answers=qa_data)


# Record generated answers
generated_answers = {}


# ### Test Q&A


# Test Q&A
for question in qa_data.keys():
    print(f"\nQuestion: {question}")

    # Get AI's thought process and answer
    answer = testo1.get_answer(question)
    generated_answers[question] = answer
    print(f"AI's thought process and answer:\n{answer}")

    # Verify the answer
    is_correct = testo1.verify_answer(question, answer)
    print(
        f"""Answer verification result:
    {'Correct' if is_correct else 'Incorrect'}"""
    )
    print("-" * 50)


# ### Export the generated answers to a JSON file


simplified_output = {
    'timestamp': datetime.now().isoformat(),
    'qa_pairs': generated_answers,
}
simplified_file = (
    f'generated_answers_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
)
with open(simplified_file, 'w', encoding='utf-8') as f:
    json.dump(simplified_output, f, ensure_ascii=False, indent=2)
print(f"The generated answers have been exported to: {simplified_file}")


def transform_qa_format(input_file):
    """
    Transform the Q&A data format to match HuggingFace dataset structure.

    Args:
        input_file (str): Path to the input JSON file
         containing generated Q&A pairs
    Returns:
        tuple: A tuple containing:
            - str: Path to the output transformed file
            - list: List of transformed Q&A pairs
             in the format {instruction, input, output}
    """
    # Read the input JSON file
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # Transform the data
    transformed_data = []
    for question, answer in data['qa_pairs'].items():
        transformed_pair = {
            "instruction": question,
            "input": "",
            "output": answer,
        }
        transformed_data.append(transformed_pair)

    # Generate output filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f'transformed_qa_{timestamp}.json'

    # Write the transformed data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(transformed_data, f, ensure_ascii=False, indent=2)

    return output_file, transformed_data


output_file, transformed_data = transform_qa_format(simplified_file)
print(f"Transformation complete. Output saved to: {output_file}")


def upload_to_huggingface(transformed_data, username, dataset_name=None):
    """
    Upload the transformed Q&A dataset to HuggingFace.
    Args:
        transformed_data (list): List of transformed Q&A pairs
        username (str): HuggingFace username
        dataset_name (str, optional): Name for the dataset.
        If None, a default name with timestamp will be used

    Returns:
        str: URL of the created dataset on HuggingFace
    """
    manager = HuggingFaceDatasetManager()
    if dataset_name is None:
        dataset_name = (
            f"{username}/qa-dataset-{datetime.now().strftime('%Y%m%d')}"
        )
    else:
        dataset_name = f"{username}/{dataset_name}"

    # Create dataset
    print(f"Creating dataset: {dataset_name}")
    dataset_url = manager.create_dataset(name=dataset_name)
    print(f"Dataset created: {dataset_url}")

    # Create dataset card
    print("Creating dataset card...")
    manager.create_dataset_card(
        dataset_name=dataset_name,
        description=(
            "Question-Answer dataset generated by CAMEL O1DataGenerator"
        ),
        license="mit",
        language=["en"],
        size_category="<1MB",
        version="0.1.0",
        tags=["camel", "question-answering"],
        task_categories=["question-answering"],
        authors=[username],
    )
    print("Dataset card created successfully.")

    # Create Record objects with user's key-value pairs directly
    records = []
    for item in transformed_data:
        record = Record(
            **item
        )  # Use the user's key-value pair directly as the field of Record
        records.append(record)

    # Add records
    print("Adding records to the dataset...")
    manager.add_records(dataset_name=dataset_name, records=records)
    print("Records added successfully.")

    return dataset_url


# set your HuggingFace access token
openai_api_key = getpass('Enter your HUGGING_FACE_TOKEN: ')
os.environ["HUGGING_FACE_TOKEN"] = openai_api_key


# Upload to HuggingFace


username = input("Enter your HuggingFace username: ")
dataset_name = input(
    "Enter dataset name (press Enter to use default): "
).strip()
if not dataset_name:
    dataset_name = None


try:
    dataset_url = upload_to_huggingface(
        transformed_data, username, dataset_name
    )
    print("\nData successfully uploaded to HuggingFace!")
    print(f"Dataset URL: {dataset_url}")
except Exception as e:
    print(f"Error uploading to HuggingFace: {e!s}")
