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
from camel.agents.base import BaseAgent
from camel.agents.chat_agent import ChatAgent, ChatAgentResponse
from camel.agents.critic_agent import CriticAgent
from camel.agents.embodied_agent import EmbodiedAgent
from camel.agents.task_agent import TaskPlannerAgent, TaskSpecifyAgent
from camel.agents.tool_agents.base import BaseToolAgent
from camel.agents.tool_agents.hugging_face_tool_agent import (
    HuggingFaceToolAgent, )

__all__ = [
    'BaseAgent',
    'ChatAgent',
    'ChatAgentResponse',
    'TaskSpecifyAgent',
    'TaskPlannerAgent',
    'CriticAgent',
    'BaseToolAgent',
    'HuggingFaceToolAgent',
    'EmbodiedAgent',
]
