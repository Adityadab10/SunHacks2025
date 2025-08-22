from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages
from dotenv import load_dotenv
from typing import TypedDict, List, Literal, Annotated, Optional, Dict, Any, AsyncGenerator
from pdfminer.high_level import extract_text
from pydantic import BaseModel

load_dotenv()

class Questions(BaseModel):
    question_1: str
    answer_1: str
    question_2: str
    answer_2: str
    question_3: str
    answer_3: str
    question_4: str
    answer_4: str
    question_5: str
    answer_5: str
    question_6: str
    answer_6: str
    question_7: str
    answer_7: str
    question_8: str
    answer_8: str
    question_9: str
    answer_9: str
    question_10: str
    answer_10: str
class State(TypedDict):
    messages: Annotated[List, add_messages]
    teacher: Literal['Anil Deshmukh', 'Kavita Iyer', 'Raghav Sharma', 'Mary Fernandes']
    pdf_path: Optional[str]
    flashcards: Questions
    quiz: Questions
    

def extract_pdf(pdf_path: str):
    text = extract_text(pdf_path)
    return text


async def generate_quiz(state: State):
    """
    Generate a quiz from the provided state.
    """
    try: 
        llm = ChatGoogleGenerativeAI(
            model='gemini-2.0-flash-exp',
            temperature=0.7
        ).with_structured_output(Questions)
        
        # Get content from PDF or message
        content = ""
        if state['pdf_path']:
            content = extract_pdf(state['pdf_path'])
        else:
            content = state['messages'][-1]
    
        print(content)
        # Create a fixed prompt without template variables
        prompt = ChatPromptTemplate.from_messages([
            ("system", """
                You are an expert educator. The user will provide a topic, and you must generate questions on that topic using Bloom’s Taxonomy. 
                Create questions at different cognitive levels: Remember, Understand, Apply, Analyze, Evaluate, and Create. 
                Label each question with its Bloom’s level. Provide 2–3 questions per level. 
                Ensure progression from simple factual recall to higher-order critical thinking and creativity.
            """),
            ("human", "{content}")
        ])
        
        # Execute the chain
        chain = prompt | llm
        result = await chain.ainvoke({"content": content})
        # Return the FlashCard object directly
        flashcard_dict = result.model_dump()
        print(flashcard_dict)
        return {"result": flashcard_dict}

    except Exception as e:
        raise Exception(f"Error generating flashcards: {str(e)}")

async def generate_flashcards(state: State) -> Dict:
    """Direct flashcard generation without streaming"""
    try:
        llm = ChatGoogleGenerativeAI(
            model='gemini-2.0-flash-exp',
            temperature=0.7
        ).with_structured_output(Questions)
        
        # Get content from PDF or message
        content = ""
        if state['pdf_path']:
            content = extract_pdf(state['pdf_path'])
        else:
            content = state['messages'][-1]
        print(content)
        # Create a fixed prompt without template variables
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a flash card generator. Your job is to create 10 question-answer pairs from the provided content.
                Focus on key concepts and important details. Make questions clear and concise."""),
            ("human", "Generate 10 flashcards from this content: {content}")
        ])
        
        # Execute the chain
        chain = prompt | llm
        result = await chain.ainvoke({"content": content})
        # Return the FlashCard object directly
        flashcard_dict = result.model_dump()
        print(flashcard_dict)
        return {"result": flashcard_dict}

    except Exception as e:
        raise Exception(f"Error generating flashcards: {str(e)}")

async def chat(state: State):
    """
    Aggregates quiz and flashcards results after both are generated.
    """
    try:
        return {
            "result": {
                "flashcards": state.get("flashcards"),
                "quiz": state.get("quiz"),
            }
        }
    except Exception as e:
        raise Exception(f"Error in chat aggregation: {str(e)}")

graph_builder = StateGraph(State)
graph_builder.add_node("quiz", generate_quiz)
graph_builder.add_node("flashcards", generate_flashcards)
graph_builder.add_node("chat", chat)
graph_builder.add_edge(START, "quiz")
graph_builder.add_edge(START, "flashcards")
graph_builder.add_edge("quiz", "chat")
graph_builder.add_edge("flashcards", "chat")
graph_builder.set_finish_point("chat")
graph = graph_builder.compile()

print(graph.get_graph().draw_mermaid())