[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1AzP33O8rnMW__7ocWJhVBXjKziJXPtim?usp=sharing)

# CAMEL: Communicative Agents for “Mind” Exploration of Large Scale Language Model Society

## [[Project Website]](https://www.camel-ai.org/) [[Preprint]](https://ghli.org/camel.pdf)

<p align="center">
  <img src='./misc/logo.png' width=800>
</p>

## Overview
The rapid advancement of conversational and chat-based language models has led to remarkable progress in complex task-solving. However, their success heavily relies on human input to guide the conversation, which can be challenging and time-consuming. This paper explores the potential of building scalable techniques to facilitate autonomous cooperation among communicative agents and provide insight into their "cognitive" processes. To address the challenges of achieving autonomous cooperation, we propose a novel communicative agent framework named *role-playing*. Our approach involves using *inception prompting* to guide chat agents toward task completion while maintaining consistency with human intentions. We showcase how role-playing can be used to generate conversational data for studying the behaviors and capabilities of chat agents, providing a valuable resource for investigating conversational language models. Our contributions include introducing a novel communicative agent framework, offering a scalable approach for studying the cooperative behaviors and capabilities of multi-agent systems, and open-sourcing our library to support research on communicative agents and beyond. The GitHub repository of this project is made publicly available on: https://github.com/lightaime/camel.

## Try it yourself
We provide a [![Google Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1AzP33O8rnMW__7ocWJhVBXjKziJXPtim?usp=sharing) demo showcasing a conversation between two ChatGPT agents impersonationg a gamer as a user and a computer programmer as a domain expert collaborating on developing a game using PyGame.

<p align="center">
  <img src='./misc/pipeline.png' width=400>
</p>

## Environment Setup
Install `CAMEL` from source with conda:
```
# create a conda virtual environment
conda create --name camel python=3.10
# actiavte camel conda environment
conda activate camel
# clone github repo
git clone https://github.com/lightaime/camel.git
# change directory into project directory
cd camel
# install camel from source
pre-commit install
pip install -e .
```
## Example
You can find a list of tasks for different set of assistant and user role pairs [here](https://drive.google.com/file/d/194PPaSTBR07m-PzjS-Ty6KlPLdFIPQDd/view?usp=share_link)

Run the `role_playing.py` script.
```
# export your OpenAI API key
export OPENAI_API_KEY=<insert your OpenAI API key>
# You can change the role pair and initial prompt in role_playing.py
python examples/role_playing.py
```
## News
- Initial release of `CAMEL` python library (March 21, 2023)

## Citation
```
@misc{camel,
  author = {Guohao Li, Hasan Abed Al Kader Hammoud, Hani Itani, Dmitrii Khizbullin, Bernard Ghanem},
  title = {CAMEL: Communicative Agents for “Mind” Exploration of Large Scale Language Model Society},
  year = {2023},
  journal={arXiv preprint},
}
```
## Acknowledgement
We would like to thank Haya Hammoud for designing the logo of our project.

## License
Apache License 2.0 

## Contact
For more information please contact [Guohao Li](https://ghli.org/), [Hasan Abed Al Kader Hammoud](https://cemse.kaust.edu.sa/ece/people/person/hasan-abed-al-kader-hammoud), [Hani Itani](https://github.com/HaniItani).
