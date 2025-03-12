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

import json
import random
from datetime import datetime
from pathlib import Path
from typing import (
    Any,
    Dict,
    List,
    Optional,
    Sized,
    Union,
)

from datasets import Dataset as HFDataset
from pydantic import BaseModel, Field, ValidationError
from torch.utils.data import Dataset

from camel.agents import ChatAgent
from camel.logger import get_logger
from camel.verifiers import BaseVerifier
from camel.verifiers.models import VerifierInput

logger = get_logger(__name__)


class DataPoint(BaseModel):
    r"""A single data point in the dataset.

    Attributes:
        question (str): The primary question or issue to be addressed.
        rationale (str): Logical reasoning or explanation behind the
            answer.
        final_answer (str): The final answer.
        raw_markdown (Optional[str]): Raw markdown content for generating
            rewards/hints. (default: :obj:`None`)
        difficulty (Optional[str]): Difficulty level of the question.
            (default: :obj:`None`)
        metadata Optional[Dict[str, Any]]: Additional metadata about the data
            point. (default: :obj:`None`)
    """

    question: str = Field(
        ..., description="The primary question or issue to be addressed."
    )
    rationale: str = Field(
        ..., description="Logical reasoning or explanation behind the answer."
    )
    final_answer: str = Field(..., description="The final answer.")
    difficulty: Optional[str] = Field(
        None, description="Difficulty level of the question."
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional metadata about the data point."
    )

    def to_dict(self) -> Dict[str, Any]:
        r"""Convert DataPoint to a dictionary.

        Returns:
            Dict[str, Any]: Dictionary representation of the DataPoint.
        """
        return self.dict()

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DataPoint':
        r"""Create a DataPoint from a dictionary.

        Args:
            data (Dict[str, Any]): Dictionary containing DataPoint fields.

        Returns:
            DataPoint: New DataPoint instance.
        """
        return cls(**data)


class StaticDataset(Dataset):
    r"""A static dataset containing a list of datapoints.
    Ensures that all items adhere to the DataPoint schema.
    This dataset complies with the PyTorch dataset
    standard and should be used when its size is fixed at
    runtime.

    This class can initialize from Hugging Face Datasets,
    PyTorch Datasets, JSON file paths, or lists of dictionaries,
    converting them into a consistent internal format.
    """

    def __init__(
        self,
        data: Union[HFDataset, Dataset, Path, List[Dict[str, Any]]],
        seed: int = 42,
        min_samples: int = 1,
        strict: bool = False,
        **kwargs,
    ):
        r"""Initialize the static dataset and validate integrity.

        Args:
            data (Union[HFDataset, Dataset, Path, List[Dict[str, Any]]]):
            Input data, which can be:
                - A Hugging Face Dataset (HFDataset)
                - A PyTorch Dataset (torch.utils.data.Dataset)
                - A Path object representing the path to a JSON file
                - A list of dictionaries with DataPoint-compatible fields
            seed (int): Seed for reproducibility.
                (default: :obj:`42`)
            min_samples (int): Minimum number of samples required.
                (default: :obj:`1`)
            strict (bool): Whether to raise an error on invalid datapoints
                (True) or skip/filter them (False). (default: False)
            **kwargs: Additional dataset parameters.

        Raises:
            TypeError: If the data type is not supported.
            ValueError: If dataset size is less than min_samples or
            if sample validation fails.
            FileNotFoundError: If the JSON file path doesn't exist.
            json.JSONDecodeError: If the JSON file is invalid.
        """

        # Store all parameters in metadata dict for compatibility
        self._metadata = {
            **kwargs,
        }
        self._rng = random.Random(seed)
        self._strict = strict

        # Type checking and conversion into list of dicts to prepare validation
        # and conversion into list of Datapoints. Since Static Dataset should
        # be small, we can load it entirely into memory

        self.data: List[DataPoint] = self._init_data(data)
        self._length = len(self.data)

        if self._length < min_samples:
            raise ValueError(
                "The dataset does not contain enough samples. "
                f"Need {max(0, min_samples)}, got {self._length}"
            )

    def _init_data(
        self, data: Union[HFDataset, Dataset, Path, List[Dict[str, Any]]]
    ) -> List[DataPoint]:
        if isinstance(data, HFDataset):
            raw_data = self._init_from_hf_dataset(data)
        elif isinstance(data, Dataset):
            raw_data = self._init_from_pytorch_dataset(data)
        elif isinstance(data, Path):
            raw_data = self._init_from_json_path(data)
        elif isinstance(data, list):
            raw_data = self._init_from_list(data)
        else:
            raise TypeError("Unsupported data type")

        def create_datapoint(
            item: Dict[str, Any], idx: int
        ) -> Optional[DataPoint]:
            # Add type checks for required fields to make mypy happy
            question = item.get('question')
            if not isinstance(question, str):
                if self._strict:
                    raise ValueError(
                        f"Sample at index {idx} has invalid 'question': "
                        f"expected str, got {type(question)}"
                    )
                else:
                    logger.warning(
                        f"Skipping sample at index {idx}: invalid 'question'"
                    )
                    return None

            rationale = item.get('rationale')
            if not isinstance(rationale, str):
                if self._strict:
                    raise ValueError(
                        f"Sample at index {idx} has invalid 'rationale': "
                        f"expected str, got {type(rationale)}"
                    )
                else:
                    logger.warning(
                        f"Skipping sample at index {idx}: invalid 'rationale'"
                    )
                    return None

            final_answer = item.get('final_answer')
            if not isinstance(final_answer, str):
                if self._strict:
                    raise ValueError(
                        f"Sample at index {idx} has invalid 'final_answer': "
                        f"expected str, got {type(final_answer)}"
                    )
                else:
                    logger.warning(
                        f"Skipping sample at index {idx}: "
                        "invalid 'final_answer'"
                    )
                    return None

            try:
                return DataPoint(
                    question=question,
                    rationale=rationale,
                    final_answer=final_answer,
                    metadata=item.get('metadata'),
                    difficulty=item.get('difficulty'),
                )
            except ValidationError as e:
                if self._strict:
                    raise ValueError(
                        f"Sample at index {idx} validation error: {e}"
                    )
                else:
                    logger.warning(
                        f"Skipping invalid sample at index {idx} "
                        f"due to validation error: {e}"
                    )
                    return None

        unfiltered_data = [
            create_datapoint(item, i) for i, item in enumerate(raw_data)
        ]
        return [dp for dp in unfiltered_data if dp is not None]

    def __len__(self) -> int:
        r"""Return the size of the dataset."""
        return self._length

    def __getitem__(self, idx: int) -> DataPoint:
        r"""Get an item from the dataset.

        Args:
            idx (int): Index of the item to get.

        Returns:
            DataPoint: DataPoint from the dataset with the given index.

        Raises:
            IndexError: If idx is out of bounds.
        """
        if idx < 0 or idx >= self._length:
            raise IndexError(
                f"Index {idx} out of bounds for dataset of size {self._length}"
            )
        return self.data[idx]

    def sample(self) -> DataPoint:
        r"""Sample a random datapoint from the dataset.

        Returns:
            DataPoint: A randomly sampled DataPoint.

        Raises:
            RuntimeError: If the dataset is empty.
        """
        if self._length == 0:
            raise RuntimeError("Dataset is empty, cannot sample.")
        idx = self._rng.randint(0, self._length - 1)
        return self[idx]

    @property
    def metadata(self) -> Dict[str, Any]:
        r"""Get dataset metadata."""
        return self._metadata.copy()

    def _init_from_hf_dataset(self, data: HFDataset) -> List[Dict[str, Any]]:
        return [dict(item) for item in data]

    def _init_from_pytorch_dataset(
        self, data: Dataset
    ) -> List[Dict[str, Any]]:
        if not isinstance(data, Sized):
            raise TypeError(
                f"{type(data).__name__} does not implement `__len__()`."
            )
        raw_data = []

        for i in range(len(data)):
            item = data[i]
            if not isinstance(item, dict):
                raise TypeError(
                    f"Item at index {i} is not a dict: "
                    f"got {type(item).__name__}"
                )
            raw_data.append(dict(item))
        return raw_data

    def _init_from_json_path(self, data: Path) -> List[Dict[str, Any]]:
        if not data.exists():
            raise FileNotFoundError(f"JSON file not found: {data}")
        try:
            logger.debug(f"Loading JSON from {data}")
            with data.open('r', encoding='utf-8') as f:
                loaded_data = json.load(f)
            logger.info(
                f"Successfully loaded {len(loaded_data)} items from {data}"
            )
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in file {data}: {e}")
        if not isinstance(loaded_data, list):
            raise ValueError("JSON file must contain a list of dictionaries")
        for i, item in enumerate(loaded_data):
            if not isinstance(item, dict):
                raise ValueError(
                    f"Expected a dictionary at index {i}, "
                    f"got {type(item).__name__}"
                )
        return loaded_data

    def _init_from_list(
        self, data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                raise ValueError(
                    f"Expected a dictionary at index {i}, "
                    f"got {type(item).__name__}"
                )
        return data


class GenerativeDataset(Dataset):
    r"""A dataset for generating synthetic datapoints using external agents and
    verifiers.

    This class leverages a seed dataset and external components to generate
    new synthetic datapoints on demand.
    """

    def __init__(
        self,
        seed_dataset: StaticDataset,
        verifier: BaseVerifier,
        agent: ChatAgent,
        seed: int = 42,
        **kwargs,
    ):
        r"""Initialize the generative dataset.

        Args:
            seed_dataset (StaticDataset): Validated static dataset to
            use for examples.
            verifier (BaseVerifier): Verifier to validate generated content.
            agent (ChatAgent): Agent to generate new datapoints.
            seed (int): Random seed for reproducibility. (default: :obj:`42`)
            **kwargs: Additional dataset parameters.
        """

        self.seed_dataset = seed_dataset
        self.verifier = verifier
        self.agent = agent

        self.seed = seed
        random.seed(self.seed)

        self._data: List[DataPoint] = []

    def _construct_prompt(self, examples: List[DataPoint]) -> str:
        r"""Construct a prompt for generating new datapoints.

        Args:
            examples (List[DataPoint]): Examples to include in the prompt.

        Returns:
            str: Formatted prompt with examples.
        """
        prompt = (
            "Generate a new datapoint similar to the following examples:\n\n"
        )
        for i, example in enumerate(examples, 1):
            prompt += f"Example {i}:\n"
            prompt += f"Question: {example.question}\n"
            prompt += f"Rationale: {example.rationale}\n"
            prompt += f"Final Answer: {example.final_answer}\n\n"
        prompt += "New datapoint:"
        return prompt

    async def generate_new(self, n: int) -> List[DataPoint]:
        r"""Generates and validates `n` new datapoints through
        few-shot prompting.

        Steps:
            1. Samples examples from the seed dataset.
            2. Constructs a prompt using the selected examples.
            3. Uses an agent to generate a new datapoint.
            4. Verifies the datapoint using a verifier.
            5. Adds valid datapoints to the dataset.

        Args:
            n (int): Number of valid datapoints to generate.

        Returns:
            List[DataPoint]: Successfully generated and validated datapoints.

        Raises:
            TypeError: If the agent's output is not a dictionary.
            KeyError: If required keys are missing from the agent's response.
            AttributeError: If the verifier response lacks expected attributes.
            ValidationError: If a datapoint fails schema validation.

        Notes:
            - Retries on validation failures until `n` valid datapoints exist.
            - Metadata includes a timestamp.
            - This method can be overridden to use any synthetic data gen
            algorithm, as long as it generates `n` valid datapoints,
            returns them as a `List[DataPoint]`, and adds them to `self._data`.
        """

        valid_data_points: List[DataPoint] = []

        while len(valid_data_points) < n:
            try:
                examples = [self.seed_dataset.sample() for _ in range(3)]
                prompt = self._construct_prompt(examples)

                try:
                    agent_output = (
                        self.agent.step(prompt, response_format=DataPoint)
                        .msgs[0]
                        .parsed
                    )
                    if not isinstance(agent_output, dict):
                        raise TypeError("Agent output must be a dictionary")
                    if (
                        "question" not in agent_output
                        or "rationale" not in agent_output
                    ):
                        raise KeyError(
                            "Missing 'question' or 'rationale' in agent output"
                        )
                except (TypeError, KeyError) as e:
                    logger.warning(f"Agent output issue: {e}, retrying...")
                    continue

                rationale = agent_output["rationale"]

                try:
                    verifier_response = await self.verifier.verify(
                        VerifierInput(llm_response=rationale)
                    )
                    if not verifier_response or not verifier_response.result:
                        raise ValueError(
                            "Verifier unsuccessful, "
                            f"response: {verifier_response}"
                        )
                except (ValueError, AttributeError) as e:
                    logger.warning(f"Verifier issue: {e}, retrying...")
                    continue

                try:
                    new_datapoint = DataPoint(
                        question=agent_output["question"],
                        rationale=rationale,
                        final_answer=verifier_response.result,
                        metadata={"created": datetime.now().isoformat()},
                    )
                except ValidationError as e:
                    logger.warning(
                        f"Datapoint validation failed: {e}, retrying..."
                    )
                    continue

                valid_data_points.append(new_datapoint)

            except Exception as e:
                logger.warning(f"Unexpected error: {e}, retrying...")

        self._data.extend(valid_data_points)
        return valid_data_points

    def save_to_jsonl(self, file_path: Union[str, Path]) -> None:
        r"""Saves the dataset to a JSONL (JSON Lines) file.

        Each datapoint is stored as a separate JSON object on a new line.

        Args:
            file_path (Union[str, Path]): Path to save the JSONL file.

        Raises:
            ValueError: If the dataset is empty.
            IOError: If there is an issue writing to the file.

        Notes:
            - Uses `self._data`, which contains the generated datapoints.
            - Overwrites the file if it already exists.
            - Ensures compatibility with large datasets by using JSONL format.
        """
        if not self._data:
            raise ValueError("Dataset is empty. No data to save.")

        file_path = Path(file_path)

        try:
            with file_path.open("w", encoding="utf-8") as f:
                for datapoint in self._data:
                    json.dump(datapoint.to_dict(), f)
                    f.write("\n")  # Ensure each entry is on a new line
            logger.info(f"Dataset saved successfully to {file_path}")
        except IOError as e:
            logger.error(f"Error writing to file {file_path}: {e}")
            raise
