from camel.prompts.base import (
    TextPrompt,
    TextPromptDict,
    return_text_prompt,
    wrap_text_prompt_functions,
)


def test_return_text_prompt_decorator():

    @return_text_prompt
    def my_function():
        return "Hello, world!"

    result = my_function()
    assert isinstance(result, TextPrompt)
    assert str(result) == "Hello, world!"


def test_return_text_prompt_decorator_with_tuple():

    @return_text_prompt
    def my_function():
        return ("Hello, {name}!", "Welcome, {name}!")

    result = my_function()
    assert isinstance(result, tuple)
    assert all(isinstance(item, TextPrompt) for item in result)
    assert str(result[0]) == "Hello, {name}!"
    assert str(result[1]) == "Welcome, {name}!"


def test_wrap_text_prompt_functions():
    # Example class for testing
    class MyClass:

        def __init__(self):
            pass

        def my_function(self):
            return "Hello, World!"

        def my_other_function(self):
            return "Goodbye, World!"

    # Decorate the class with the wrapper function
    @wrap_text_prompt_functions
    class MyDecoratedClass(MyClass):
        pass

    # Create an instance of the decorated class
    obj = MyDecoratedClass()

    # Check if the functions are wrapped correctly
    assert isinstance(obj.my_function(), TextPrompt)
    assert isinstance(obj.my_other_function(), TextPrompt)


def test_text_prompt_key_words():
    prompt = TextPrompt('Please enter your name and age: {name}, {age}')
    assert prompt.key_words == {'name', 'age'}

    prompt = prompt.format(name='John')
    assert prompt.key_words == {'age'}

    prompt = prompt.format(age=30)
    assert prompt.key_words == set()


def test_text_prompt_format():
    prompt = TextPrompt('Your name and age are: {name}, {age}')

    name, age = 'John', 30
    assert prompt.format(name=name,
                         age=age) == 'Your name and age are: John, 30'

    # Partial formatting
    assert prompt.format(name=name) == 'Your name and age are: John, {age}'


def test_text_prompt_manipulate():
    prompt1 = TextPrompt('Hello, {name}!')
    prompt2 = TextPrompt('Welcome, {name}!')

    prompt3 = prompt1 + ' ' + prompt2
    assert prompt3 == 'Hello, {name}! Welcome, {name}!'
    assert isinstance(prompt3, TextPrompt)
    assert prompt3.key_words == {'name'}

    prompt4 = TextPrompt(' ').join([prompt1, prompt2])
    assert prompt4 == 'Hello, {name}! Welcome, {name}!'
    assert isinstance(prompt4, TextPrompt)
    assert prompt4.key_words == {'name'}

    prompt5 = prompt4.upper()
    assert prompt5 == 'HELLO, {NAME}! WELCOME, {NAME}!'
    assert isinstance(prompt5, TextPrompt)
    assert prompt5.key_words == {'NAME'}


def test_text_prompt_dict():
    prompt_dict = TextPromptDict()
    prompt_dict['test'] = TextPrompt('test')
    assert prompt_dict['test'] == TextPrompt('test')
