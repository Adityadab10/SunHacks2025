from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_community.agent_toolkits.load_tools import load_tools
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from teachers import anil_prompt, kavita_prompt, raghav_prompt, mary_prompt
from typing import TypedDict, List, Literal, Annotated, Optional, Dict, Any, AsyncGenerator
import tempfile
import os
import uuid
import asyncio
from pathlib import Path
import logging

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global storage for vector databases (in production, use Redis or similar)
vector_stores: Dict[str, Chroma] = {}

class State(TypedDict):
    messages: Annotated[List, add_messages]
    teacher: Literal['Anil Deshmukh', 'Kavita Iyer', 'Raghav Sharma', 'Mary Fernandes']
    chain: Any
    pdf_there: Literal['yes', 'no']
    pdf_path: Optional[str]
    vector_store_id: Optional[str]
    retrieval_tool: Optional[Any]

def create_retrieval_tool(vector_store: Chroma, vector_store_id: str):
    """Create a retrieval tool for the vector store"""
    
    @tool
    def retrieve_documents(query: str) -> str:
        """Retrieve relevant documents from the uploaded PDF based on the query.
        Use this when the user asks questions about the uploaded document content."""
        try:
            retriever = vector_store.as_retriever(search_kwargs={"k": 3})
            docs = retriever.get_relevant_documents(query)
            
            if not docs:
                return "No relevant documents found for the query."
            
            context = "\n\n".join([f"Document {i+1}:\n{doc.page_content}" for i, doc in enumerate(docs)])
            return f"Retrieved relevant information:\n\n{context}"
        except Exception as e:
            logger.error(f"Error retrieving documents: {e}")
            return f"Error retrieving documents: {str(e)}"
    
    return retrieve_documents

def process_pdf(pdf_path: str) -> tuple[Chroma, str]:
    """Process PDF and create vector store"""
    try:
        # Load PDF
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()
        
        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        splits = text_splitter.split_documents(documents)
        
        # Create embeddings
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        
        # Create vector store with unique ID
        vector_store_id = str(uuid.uuid4())
        
        # Create temporary directory for Chroma
        temp_dir = tempfile.mkdtemp()
        vector_store = Chroma.from_documents(
            documents=splits,
            embedding=embeddings,
            persist_directory=os.path.join(temp_dir, f"chroma_{vector_store_id}")
        )
        
        # Store globally (in production, use proper storage)
        vector_stores[vector_store_id] = vector_store
        
        logger.info(f"Created vector store {vector_store_id} with {len(splits)} chunks")
        return vector_store, vector_store_id
        
    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
        raise

def initialise_teacher(state: State):
    """Initialize teacher with appropriate prompt and tools"""
    llm = ChatGoogleGenerativeAI(model='gemini-2.5-flash')
    teacher = state['teacher']
    
    # Get teacher prompt
    if teacher == 'Anil Deshmukh':
        prompt = anil_prompt
    elif teacher == 'Kavita Iyer':
        prompt = kavita_prompt
    elif teacher == 'Raghav Sharma':
        prompt = raghav_prompt
    else:
        prompt = mary_prompt
    
    # Load basic tools
    tools = load_tools(['serpapi'])
    
    # Add retrieval tool if PDF is available
    if state.get('pdf_there') == 'yes' and state.get('vector_store_id'):
        vector_store = vector_stores.get(state['vector_store_id'])
        if vector_store:
            retrieval_tool = create_retrieval_tool(vector_store, state['vector_store_id'])
            tools.append(retrieval_tool)
            logger.info(f"Added retrieval tool for vector store {state['vector_store_id']}")
    
    # Create prompt template
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", prompt),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    # Create chain
    chain = prompt_template | llm.bind_tools(tools)
    
    return {
        "chain": chain,
        "retrieval_tool": tools[-1] if state.get('pdf_there') == 'yes' else None
    }

def should_continue(state: State):
    """Determine next step based on PDF presence"""
    if state.get('pdf_there') == 'yes' and not state.get('vector_store_id'):
        return "process_pdf"
    else:
        return "chat"

async def process_pdf(pdf_path: str) -> tuple[Chroma, str]:
    """Process PDF and create vector store"""
    try:
        # Run CPU-intensive operations in a thread pool
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: _process_pdf_sync(pdf_path))
    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
        raise

def _process_pdf_sync(pdf_path: str) -> tuple[Chroma, str]:
    """Synchronous part of PDF processing"""
    # Load PDF
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    
    # Split documents
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(documents)
    
    # Create embeddings
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    
    # Create vector store with unique ID
    vector_store_id = str(uuid.uuid4())
    
    # Create temporary directory for Chroma
    temp_dir = tempfile.mkdtemp()
    vector_store = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory=os.path.join(temp_dir, f"chroma_{vector_store_id}")
    )
    
    # Store globally
    vector_stores[vector_store_id] = vector_store
    
    logger.info(f"Created vector store {vector_store_id} with {len(splits)} chunks")
    return vector_store, vector_store_id

async def process_pdf_node(state: State):
    """Process PDF and create vector store"""
    try:
        pdf_path = state.get('pdf_path')
        if not pdf_path or not os.path.exists(pdf_path):
            return {
                "messages": [AIMessage(content="Error: PDF file not found or invalid path.")],
                "pdf_there": "no"
            }
        
        vector_store, vector_store_id = await process_pdf(pdf_path)
        
        return {
            "vector_store_id": vector_store_id,
            "messages": [AIMessage(content="PDF processed successfully! I can now answer questions about the document.")]
        }
        
    except Exception as e:
        logger.error(f"Error in process_pdf_node: {e}")
        return {
            "messages": [AIMessage(content=f"Error processing PDF: {str(e)}")],
            "pdf_there": "no"
        }

def chat(state: State):
    """Handle chat interactions"""
    try:
        chain = state['chain']
        messages = state['messages'][:-1] if len(state['messages']) > 1 else state['messages']
        
        response = chain.invoke({"messages": messages})
        return {"messages": [response]}
        
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        return {"messages": [AIMessage(content=f"Sorry, I encountered an error: {str(e)}")]}

def cleanup_vector_store(vector_store_id: str):
    """Clean up vector store and temporary files"""
    try:
        if vector_store_id in vector_stores:
            vector_store = vector_stores[vector_store_id]
            # Clean up Chroma directory
            if hasattr(vector_store, '_persist_directory'):
                import shutil
                shutil.rmtree(vector_store._persist_directory, ignore_errors=True)
            del vector_stores[vector_store_id]
            logger.info(f"Cleaned up vector store {vector_store_id}")
    except Exception as e:
        logger.error(f"Error cleaning up vector store {vector_store_id}: {e}")

# Create tools for basic functionality
tools = load_tools(['serpapi'])
tool_node = ToolNode(tools)
memory = MemorySaver()

# Build the graph
graph_builder = StateGraph(State)

# Add nodes
graph_builder.add_node("teacher", initialise_teacher)
graph_builder.add_node("process_pdf", process_pdf_node)
graph_builder.add_node("chat", chat)
graph_builder.add_node("tools", tool_node)

# Add edges
graph_builder.add_conditional_edges(
    "teacher",
    should_continue,
    {
        "process_pdf": "process_pdf", 
        "chat": "chat"
    }
)
graph_builder.add_edge("process_pdf", "teacher")
graph_builder.add_conditional_edges("chat", tools_condition)
graph_builder.add_edge("tools", "chat")

# Set entry point
graph_builder.set_entry_point("teacher")

# Compile graph
graph = graph_builder.compile(checkpointer=memory)

# Enhanced streaming functions for API usage
async def stream_graph_updates(user_input: Dict[str, Any], thread_id: str = "default") -> AsyncGenerator[Dict[str, Any], None]:
    """
    Stream graph updates for API usage with better error handling and formatting
    """
    config = {'configurable': {"thread_id": thread_id}}
    
    try:
        # Prepare initial state
        initial_state = {
            'messages': user_input.get('messages', []),
            'teacher': user_input.get('teacher', 'Anil Deshmukh'),
            'pdf_there': user_input.get('pdf_there', 'no'),
            'pdf_path': user_input.get('pdf_path'),
        }
        
        # Stream the graph execution
        async for event in graph.astream(initial_state, config=config):
            for node_name, value in event.items():
                response_data = {
                    "node": node_name,
                    "timestamp": asyncio.get_event_loop().time(),
                    "type": "node_update"
                }
                
                if 'messages' in value and value['messages']:
                    last_message = value['messages'][-1]
                    response_data.update({
                        "content": last_message.content,
                        "message_type": type(last_message).__name__
                    })
                
                if 'vector_store_id' in value:
                    response_data["vector_store_id"] = value['vector_store_id']
                
                yield response_data
                
    except Exception as e:
        logger.error(f"Error in stream_graph_updates: {e}")
        yield {
            "type": "error",
            "error": str(e),
            "timestamp": asyncio.get_event_loop().time()
        }

def create_user_input(message: str, teacher: str = 'Anil Deshmukh', pdf_path: Optional[str] = None) -> Dict[str, Any]:
    """Helper function to create properly formatted user input"""
    user_input = {
        'messages': [HumanMessage(content=message)],
        'teacher': teacher,
        'pdf_there': 'yes' if pdf_path else 'no'
    }
    
    if pdf_path:
        user_input['pdf_path'] = pdf_path
    
    return user_input

# API-friendly functions
async def chat_with_teacher(message: str, teacher: str = 'Anil Deshmukh', 
                          pdf_path: Optional[str] = None, thread_id: str = "default") -> AsyncGenerator[Dict[str, Any], None]:
    """
    Main API function for chatting with a teacher
    """
    user_input = create_user_input(message, teacher, pdf_path)
    
    async for response in stream_graph_updates(user_input, thread_id):
        yield response

def get_conversation_history(thread_id: str) -> List[Dict[str, Any]]:
    """Get conversation history for a thread"""
    try:
        config = {'configurable': {"thread_id": thread_id}}
        state = graph.get_state(config)
        
        if state and 'messages' in state.values:
            messages = []
            for msg in state.values['messages']:
                messages.append({
                    "type": type(msg).__name__,
                    "content": msg.content,
                    "timestamp": getattr(msg, 'timestamp', None)
                })
            return messages
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
    
    return []

def cleanup_conversation(thread_id: str):
    """Clean up conversation and associated resources"""
    try:
        config = {'configurable': {"thread_id": thread_id}}
        state = graph.get_state(config)
        
        if state and 'vector_store_id' in state.values:
            cleanup_vector_store(state.values['vector_store_id'])
        
        # Clear conversation from memory (if supported by checkpointer)
        logger.info(f"Cleaned up conversation {thread_id}")
        
    except Exception as e:
        logger.error(f"Error cleaning up conversation {thread_id}: {e}")

# Example usage functions
async def example_usage():
    """Example of how to use the enhanced system"""
    try:
        # Example 1: Chat without PDF
        print("=== Chat without PDF ===")
        async for response in chat_with_teacher(
            message="Hello, can you help me with mathematics?",
            teacher="Anil Deshmukh",
            thread_id="user1"
        ):
            if response.get("content"):
                print(f"Assistant: {response['content']}")
        
        # Example 2: Chat with PDF
        print("\n=== Chat with PDF ===")
        pdf_path = "./MP notes shravani (1).pdf"  # Replace with actual PDF path
        
        if os.path.exists(pdf_path):
            async for response in chat_with_teacher(
                message="What is this document about?",
                teacher="Kavita Iyer",
                pdf_path=pdf_path,
                thread_id="user2"
            ):
                if response.get("content"):
                    print(f"Assistant: {response['content']}")
    except Exception as e:
        logger.error(f"Error in example usage: {e}")
    finally:
        # Clean up
        cleanup_conversation("user1")
        cleanup_conversation("user2")