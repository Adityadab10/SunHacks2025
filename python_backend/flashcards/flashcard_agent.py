from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_community.utilities import SerpAPIWrapper
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from typing import TypedDict, List, Literal, Annotated, Optional, Dict, Any, AsyncGenerator
from pdfminer.high_level import extract_text
from pydantic import BaseModel

load_dotenv()

class State(TypedDict):
    messages: Annotated[List, add_messages]
    teacher: Literal['Anil Deshmukh', 'Kavita Iyer', 'Raghav Sharma', 'Mary Fernandes']
    pdf_path: Optional[str]
    result: Dict[str, str]

class FlashCard(BaseModel):
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

def extract_pdf(pdf_path: str):
    text = extract_text(pdf_path)
    return text

async def generate_flashcards(state: State) -> Dict:
    """Direct flashcard generation without streaming"""
    try:
        llm = ChatGoogleGenerativeAI(
            model='gemini-2.0-flash-exp',
            temperature=0.7
        ).with_structured_output(FlashCard)
        
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


# Create a streaming version of the graph
graph_builder_stream = StateGraph(State)
graph_builder_stream.add_node("chat", generate_flashcards)
graph_builder_stream.set_entry_point("chat")
graph_builder_stream.set_finish_point("chat")
graph = graph_builder_stream.compile()

# Add this after your existing graph print
print(graph.get_graph().draw_mermaid())