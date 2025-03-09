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

r"""Example demonstrating the use
of DeepSeek Reasoner model for medical diagnosis.

This example shows how to:
1. Set up a medical diagnosis environment with retry mechanism
2. Use the DeepSeek Reasoner model for diagnosis
3. Extract and verify diagnoses
4. Track and analyze retry performance
5. Generate detailed performance statistics

The model is prompted to provide a diagnosis for medical cases, with the
diagnosis being extracted from boxed text in the response. The extracted
diagnosis is verified against ground truth, with retries for low-quality
responses.

Environment Variables Required:
    DEEPSEEK_API_KEY: API key for DeepSeek platform
    GET_REASONING_CONTENT: Set to "true" to include reasoning content
"""

import asyncio
import os
import uuid

import pandas as pd
from datasets import Dataset as HFDataset

from camel.agents import ChatAgent
from camel.configs import DeepSeekConfig
from camel.datahubs.huggingface import HuggingFaceDatasetManager
from camel.datahubs.models import Record
from camel.datasets.medicine import MedicalDataset, load_json_data
from camel.environments import MedicalEnvironment
from camel.environments.base import Action
from camel.extractors import BoxedTextExtractor
from camel.models import ModelFactory
from camel.types import ModelPlatformType, ModelType
from camel.verifiers import MedicalVerifier


async def main() -> None:
    r"""Main execution function.

    Sets up the medical diagnosis environment, runs diagnosis attempts with
    retry mechanism, and reports performance statistics.

    The function:
    1. Loads the medical dataset
    2. Configures the DeepSeek model
    3. Sets up the diagnosis environment
    4. Processes multiple medical cases
    5. Handles retries for low-quality diagnoses
    6. Reports detailed performance metrics
    7. Saves and uploads results to
    Hugging Face Hub using CAMEL's dataset manager
    """
    # Load medical dataset
    data_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "datasets",
        "medicine",
        "example_data",
        "RDC.json",
    )

    print(f"Attempting to load data from: {data_path}")

    try:
        raw_data = load_json_data(data_path)
        dataset = MedicalDataset(raw_data)
        await dataset.setup()
        print(f"Dataset size: {len(dataset)}")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return

    # Create DeepSeek Reasoner model with quality-focused configuration
    model = ModelFactory.create(
        model_platform=ModelPlatformType.DEEPSEEK,
        model_type=ModelType.DEEPSEEK_REASONER,
        model_config_dict=DeepSeekConfig(temperature=0.2).as_dict(),
    )

    # Define system message for medical reasoning with retry handling
    reason_agent_system_message = r"""You are a medical expert tasked 
    with diagnosing medical conditions based on case reports and test results.
Analyze the provided information carefully and provide your diagnosis.
Give your final answer within \boxed{} notation.
For example, if your diagnosis is 'Common Cold', 
write your final answer as: \boxed{Common Cold}

If you receive retry feedback:
1. Review the previous attempt's feedback carefully
2. Consider why the previous diagnosis might have been incorrect
3. Pay special attention to any verification feedback provided
4. Provide a more detailed explanation for your new diagnosis
"""

    # Create agent with enhanced reasoning capabilities
    reason_agent = ChatAgent(
        system_message=reason_agent_system_message, model=model
    )

    # Create environment components with quality control parameters
    extractor = BoxedTextExtractor()
    verifier = MedicalVerifier(exact_match=False, case_sensitive=False)
    environment = MedicalEnvironment(
        dataset=dataset,
        verifier=verifier,
        extractor=extractor,
        reward_correct=1.0,
        reward_incorrect=-0.5,
        reward_no_answer=-0.2,
        max_retries=3,
        quality_threshold=0.7,
        retry_delay=1.0,
    )

    # Setup components
    await extractor.setup()
    await verifier.setup()
    await environment.setup()

    try:
        # Process examples with retry mechanism
        num_examples = min(2, len(dataset))
        total_reward = 0.0
        correct_count = 0
        retry_stats = {
            "total_retries": 0,
            "successful_retries": 0,  # Retries that improved the result
            "failed_retries": 0,  # Retries that didn't meet quality threshold
        }
        case_responses = []  # store each cases final respond

        for i in range(num_examples):
            # Initialize new case
            observation = await environment.reset()
            medical_case = observation.question
            ground_truth = environment._current_data_point.final_answer

            print(f"\n\n{'='*80}")
            print(f"Example {i+1}/{num_examples}")
            print(f"{'='*80}")
            print(f"Medical Case:\n{medical_case}")
            print(f"{'='*80}")
            print(f"Ground Truth: {ground_truth}")

            # Process diagnosis with retry mechanism
            initial_reward = None
            best_reward = None
            step_result = None

            while True:
                # Handle retry feedback if available
                if "retry_feedback" in observation.context:
                    retry_feedback = observation.context["retry_feedback"]
                    verification_feedback = retry_feedback[
                        "verification_feedback"
                    ]
                    print(f"\nRetry Attempt #{retry_feedback['retry_count']}")
                    print("Previous attempt:")
                    print(
                        f"  - Reward: {retry_feedback['previous_reward']:.2f}"
                    )
                    print(f"  - Status: {verification_feedback['status']}")
                    print(f"  - Feedback: {verification_feedback['message']}")
                    print(f"  - Expected: {verification_feedback['expected']}")
                    print(f""""Quality threshold: 
                          {retry_feedback['quality_threshold']}""")
                    if retry_feedback['best_reward_so_far'] is not None:
                        print(
                            f"""Best reward so far: 
                            {retry_feedback['best_reward_so_far']:.2f}"""
                        )
                    print(f"{'='*80}")

                # Get model's diagnosis
                response = reason_agent.step(medical_case)
                agent_response = response.msgs[0].content

                print(f"{'='*80}")
                print(f"Agent Response:\n{agent_response}")

                # Process the diagnosis
                action = Action(
                    problem_statement=medical_case,
                    llm_response=agent_response,
                    final_answer=ground_truth,
                )

                # Evaluate the diagnosis
                step_result = await environment.step(action)

                # Track performance metrics
                if initial_reward is None:
                    initial_reward = step_result.reward

                if best_reward is None or step_result.reward > best_reward:
                    best_reward = step_result.reward

                # Display current results
                extracted_diagnosis = await extractor.extract(agent_response)
                print(f"{'='*80}")
                print(f"Extracted Diagnosis: {extracted_diagnosis}")
                print(f"Reward: {step_result.reward}")

                # Update retry statistics
                if step_result.info.get("is_retry", False):
                    retry_stats["total_retries"] += 1
                    if step_result.reward > initial_reward:
                        retry_stats["successful_retries"] += 1
                    elif step_result.reward < environment.quality_threshold:
                        retry_stats["failed_retries"] += 1

                # Check if further retries needed
                if step_result.done or not step_result.info.get(
                    "is_retry", False
                ):
                    break

                # Prepare for next retry
                observation = step_result.observation

            # Update overall statistics
            total_reward += best_reward
            if best_reward >= environment.quality_threshold:
                correct_count += 1

            # Display case results
            print(f"Final reward: {best_reward}")
            if initial_reward != best_reward:
                print(
                    f"""Improvement from retries: 
                    {best_reward - initial_reward:.2f}"""
                )

            case_responses.append(
                {
                    "agent_response": agent_response,
                    "extracted_diagnosis": extracted_diagnosis,
                    "best_reward": best_reward,
                    "initial_reward": initial_reward,
                }
            )

        # Generate comprehensive performance report
        print(f"\n{'='*80}")
        print("Performance Summary:")
        print(f"{'='*80}")
        print(f"Total examples processed: {num_examples}")
        print(
            f"""Correct diagnoses:
              {correct_count}/{num_examples} 
              ({correct_count/num_examples*100:.2f}%)"""
        )
        print(f"Total reward accumulated: {total_reward}")
        print(f"Average reward per case: {total_reward/num_examples:.2f}")
        print("\nRetry Performance Analysis:")
        print(f"Total retry attempts: {retry_stats['total_retries']}")
        print(f"Successful retries: {retry_stats['successful_retries']}")
        print(f"Failed retries: {retry_stats['failed_retries']}")
        if retry_stats['total_retries'] > 0:
            success_rate = (
                retry_stats['successful_retries']
                / retry_stats['total_retries']
                * 100
            )
            print(f"Retry success rate: {success_rate:.2f}%")
        print(f"{'='*80}")

        # Convert results to HuggingFace dataset format
        results_data = []
        for i, datapoint in enumerate(dataset):
            if i < len(case_responses):
                result_entry = {
                    "case_id": i,
                    "medical_case": datapoint.question,
                    "ground_truth": datapoint.final_answer,
                    "model_diagnosis": case_responses[i][
                        "extracted_diagnosis"
                    ],
                    "rationale": case_responses[i]["agent_response"],
                    "final_reward": case_responses[i]["best_reward"],
                    "retry_count": retry_stats["total_retries"],
                    "successful_retries": retry_stats["successful_retries"],
                    "initial_reward": case_responses[i]["initial_reward"],
                    "improvement": (
                        case_responses[i]["best_reward"]
                        - case_responses[i]["initial_reward"]
                    ),
                }
                results_data.append(result_entry)

        # Convert to pandas DataFrame first
        df = pd.DataFrame(results_data)

        # Convert to HuggingFace dataset
        hf_dataset = HFDataset.from_pandas(df)

        # Save locally first
        hf_dataset.save_to_disk("medical_diagnosis_results")

        print(
            "\nDataset saved locally to 'medical_diagnosis_results' directory"
        )

        # Convert results to Records format for HuggingFace upload
        hf_records = []
        for entry in results_data:
            record_id = str(uuid.uuid4())
            hf_records.append(
                Record(
                    id=record_id,
                    case_id=entry["case_id"],
                    medical_case=entry["medical_case"],
                    ground_truth=entry["ground_truth"],
                    model_diagnosis=entry["model_diagnosis"],
                    rationale=entry["rationale"],
                    metadata={
                        "final_reward": float(entry["final_reward"]),
                        "retry_count": int(entry["retry_count"]),
                        "successful_retries": int(entry["successful_retries"]),
                        "initial_reward": float(entry["initial_reward"]),
                        "improvement": float(entry["improvement"]),
                    },
                )
            )

        # Initialize HuggingFace dataset manager
        manager = HuggingFaceDatasetManager()

        # Create dataset and upload records
        repo_id = "zjrwtxtechstudio/medical-diagnosis-results"

        # Create the dataset
        print("\nCreating dataset on HuggingFace Hub...")
        dataset_url = manager.create_dataset(name=repo_id, private=True)
        print(f"Dataset created: {dataset_url}")

        # Create dataset card with metadata
        print("Creating dataset card...")
        manager.create_dataset_card(
            dataset_name=repo_id,
            description="""Medical diagnosis results from 
            DeepSeek Reasoner model with retry mechanism""",
            license="apache-2.0",
            language=["en"],
            size_category="<1MB",
            version="1.0.0",
            tags=["medical", "diagnosis", "deepseek", "camel"],
            task_categories=["text-classification"],
            authors=["camel-ai"],
            content="""
            # Medical Diagnosis Dataset
            
            This dataset contains medical diagnosis results generated 
            using the DeepSeek Reasoner model
            with a retry mechanism for quality improvement. 
            Each record includes:
            
            - Medical case description
            - Ground truth diagnosis
            - Model's diagnosis and reasoning
            - Performance metrics (rewards, retry counts, improvements)
            
            The model uses a quality threshold and 
            retry mechanism to improve diagnosis accuracy.
            """,
        )
        print("Dataset card created successfully.")

        # Upload records
        print("Uploading records to dataset...")
        manager.add_records(dataset_name=repo_id, records=hf_records)
        print("Records uploaded successfully.")

        print(f"\nDataset is now available at: {dataset_url}")

    finally:
        # Cleanup resources
        await extractor.cleanup()
        await verifier.cleanup()
        await environment.teardown()


if __name__ == "__main__":
    asyncio.run(main())
