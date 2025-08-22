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
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from .teachers import anil_prompt, kavita_prompt, raghav_prompt, mary_prompt
from typing import TypedDict, List, Literal, Annotated, Optional, Dict, Any, AsyncGenerator
from pdfminer.high_level import extract_text
import os
import asyncio
import logging
from datetime import datetime

# Load environment variables FIRST
load_dotenv()

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global storage for vector databases and conversation contexts
vector_stores: Dict[str, Chroma] = {}
conversation_contexts: Dict[str, Dict[str, Any]] = {}

class State(TypedDict):
    messages: Annotated[List, add_messages]
    teacher: Literal['Anil Deshmukh', 'Kavita Iyer', 'Raghav Sharma', 'Mary Fernandes']
    chain: Any
    pdf_path: Optional[str]

def create_google_llm():
    """Create Google LLM with proper error handling"""
    try:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
        
        llm = ChatGoogleGenerativeAI(
            model='gemini-2.0-flash-exp',
            google_api_key=api_key,
            temperature=0.7
        )
        logger.info("Google LLM initialized successfully")
        return llm
    except Exception as e:
        logger.error(f"Failed to initialize Google LLM: {e}")
        raise


async def process_pdf(pdf_path: str) -> str:
    """Process PDF and return text content"""
    try:
        # Run in thread pool to avoid blocking
        def extract():
            return extract_text(pdf_path)
        
        loop = asyncio.get_running_loop()
        text = await loop.run_in_executor(None, extract)
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        raise

@tool
def search(query: str) -> str:
    """Search for information on the internet."""
    try:
        serpapi = SerpAPIWrapper()
        results = serpapi.run(query)
        return results
    except Exception as e:
        logger.error(f"Search error: {e}")
        return f"Search failed: {str(e)}"

# Initialize tools list
tools = [search]
tool_node = ToolNode(tools)

async def prepare_pdf_rag(pdf_path: str, user_id: str) -> Chroma:
    """Extract PDF text, split into chunks, create/retrieve vector DB, return relevant docs for last query."""
    try:
        # Extract entire text
        text = await process_pdf(pdf_path)

        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = splitter.split_text(text)

        # Prepare vector DB directory path (unique per user for demo simplicity)
        vector_db_dir = f"./vector_db/{user_id}"
        os.makedirs(vector_db_dir, exist_ok=True)

        # Create or load existing Chroma vector store
        if user_id in vector_stores:
            vector_db = vector_stores[user_id]
        else:
            vector_db = Chroma.from_texts(
                chunks,
                embeddings,
                persist_directory=vector_db_dir
            )
            vector_db.persist()
            vector_stores[user_id] = vector_db

        return vector_db

    except Exception as e:
        logger.error(f"Error preparing RAG for PDF: {e}")
        raise

def initialise_teacher(state: State):
    """Initialize teacher with appropriate prompt and tools"""
    try:
        llm = create_google_llm()
        teacher = state['teacher']
        
        # Get teacher prompt
        if teacher == 'Anil Deshmukh':
            system_prompt = anil_prompt
        elif teacher == 'Kavita Iyer':
            system_prompt = kavita_prompt
        elif teacher == 'Raghav Sharma':
            system_prompt = raghav_prompt
        else:
            system_prompt = mary_prompt
        
        # Create a simpler prompt template
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{input}")
        ])
        
        # Create the chain with the new template
        chain = prompt_template | llm.bind_tools(tools)
        
        return {"chain": chain}
        
    except Exception as e:
        logger.error(f"Error initializing teacher: {e}")
        raise

async def chat(state: State, user_id: str = "default"):
    """Modified chat handler with RAG support"""
    try:
        chain = state['chain']
        
        # Get the last message
        last_message = state['messages'][-1].content if state['messages'] else ""
        
        if not last_message:
            return {"messages": [AIMessage(content="I didn't receive any message. Please try again.")]}

        # If PDF provided, use retriever to get relevant chunks
        if state.get('pdf_path'):
            vector_db = await prepare_pdf_rag(state['pdf_path'], user_id)
            relevant_docs = vector_db.similarity_search(last_message, k=3)
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
            
            # Format input with context
            input_text = f"Context from PDF:\n{context}\n\nQuestion: {last_message}"
        else:
            # No PDF, use message directly
            input_text = last_message

        # Invoke chain with simplified input
        try:
            response = await chain.ainvoke({"input": input_text})
            if isinstance(response, str):
                return {"messages": [AIMessage(content=response)]}
            elif isinstance(response, dict) and 'output' in response:
                return {"messages": [AIMessage(content=response['output'])]}
            else:
                return {"messages": [AIMessage(content=str(response))]}
        except Exception as chain_error:
            logger.error(f"Chain invocation error: {chain_error}")
            return {"messages": [AIMessage(content=f"I encountered an error processing your request: {str(chain_error)}")]}

    except Exception as e:
        logger.error(f"Error in chat with RAG: {e}")
        return {"messages": [AIMessage(content=f"Sorry, I encountered an error: {str(e)}")]}

    
memory = MemorySaver()

# Build the graph
graph_builder = StateGraph(State)

# Add nodes
graph_builder.add_node("teacher", initialise_teacher)
graph_builder.add_node("chat", chat)
graph_builder.add_node("tools", tool_node)

graph_builder.add_conditional_edges("chat", tools_condition)
graph_builder.add_edge("teacher", "chat")
graph_builder.add_edge("tools", "chat")

# Set entry point
graph_builder.set_entry_point("teacher")

# Compile graph
try:
    agent = graph_builder.compile(checkpointer=memory)
    logger.info("Graph compiled successfully")
except Exception as e:
    logger.error(f"Error compiling graph: {e}")
    raise