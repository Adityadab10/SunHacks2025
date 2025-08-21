from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from .teachers import anil_prompt, kavita_prompt, raghav_prompt, mary_prompt
from typing import TypedDict, List, Literal, Annotated, Optional, Dict, Any, AsyncGenerator
import tempfile
import os
import uuid
import asyncio
from pathlib import Path
import logging

# Load environment variables FIRST
load_dotenv()

# Verify Google API key is loaded
if not os.getenv('GOOGLE_API_KEY'):
    raise ValueError("GOOGLE_API_KEY not found in environment variables. Please check your .env file.")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global storage for vector databases
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

def create_google_llm():
    """Create Google LLM with proper error handling"""
    try:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
        
        llm = ChatGoogleGenerativeAI(
            model='gemini-2.0-flash-exp',  # Updated model
            google_api_key=api_key,
            temperature=0.7
        )
        logger.info("Google LLM initialized successfully")
        return llm
    except Exception as e:
        logger.error(f"Failed to initialize Google LLM: {e}")
        raise

def create_huggingface_embeddings():
    """Create Hugging Face embeddings with proper error handling"""
    try:
        # Using a good sentence transformer model for embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},  # Use 'cuda' if you have GPU
            encode_kwargs={'normalize_embeddings': True}
        )
        logger.info("Hugging Face embeddings initialized successfully")
        return embeddings
    except Exception as e:
        logger.error(f"Failed to initialize Hugging Face embeddings: {e}")
        # Fallback to a different model if the first one fails
        try:
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/paraphrase-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
            logger.info("Hugging Face embeddings initialized with fallback model")
            return embeddings
        except Exception as e2:
            logger.error(f"Failed to initialize fallback embeddings: {e2}")
            raise

def process_pdf(pdf_path: str) -> tuple[Chroma, str]:
    """Process PDF and create vector store"""
    try:
        # Load PDF
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()
        
        if not documents:
            raise ValueError("No content found in PDF")
        
        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        splits = text_splitter.split_documents(documents)
        
        if not splits:
            raise ValueError("No text chunks created from PDF")
        
        # Create embeddings with error handling
        embeddings = create_huggingface_embeddings()
        
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
        
    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
        raise

def initialise_teacher(state: State):
    """Initialize teacher with appropriate prompt and tools"""
    try:
        llm = create_google_llm()
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
        
        # Initialize tools list
        tools = []
        
        # Try to load SerpAPI tools if available
        try:
            if os.getenv('SERPAPI_API_KEY'):
                from langchain_community.agent_toolkits.load_tools import load_tools
                serpapi_tools = load_tools(['serpapi'])
                tools.extend(serpapi_tools)
                logger.info("SerpAPI tools loaded successfully")
            else:
                logger.info("SERPAPI_API_KEY not found, web search will not be available")
        except Exception as e:
            logger.warning(f"Could not load SerpAPI tools: {e}")
        
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
        if tools:
            chain = prompt_template | llm.bind_tools(tools)
        else:
            chain = prompt_template | llm
        
        return {
            "chain": chain,
            "retrieval_tool": tools[-1] if state.get('pdf_there') == 'yes' and tools else None
        }
        
    except Exception as e:
        logger.error(f"Error initializing teacher: {e}")
        raise

def should_continue(state: State):
    """Determine next step based on PDF presence"""
    if state.get('pdf_there') == 'yes' and not state.get('vector_store_id'):
        return "process_pdf"
    else:
        return "chat"

async def process_pdf_async(pdf_path: str) -> tuple[Chroma, str]:
    """Process PDF and create vector store asynchronously"""
    try:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: process_pdf(pdf_path))
    except Exception as e:
        logger.error(f"Error processing PDF async: {e}")
        raise

async def process_pdf_node(state: State):
    """Process PDF and create vector store"""
    try:
        pdf_path = state.get('pdf_path')
        if not pdf_path or not os.path.exists(pdf_path):
            return {
                "messages": [AIMessage(content="Error: PDF file not found or invalid path.")],
                "pdf_there": "no"
            }
        
        vector_store, vector_store_id = await process_pdf_async(pdf_path)
        
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
        
        if not messages:
            return {"messages": [AIMessage(content="I didn't receive any message. Please try again.")]}
        
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
            if hasattr(vector_store, '_persist_directory'):
                import shutil
                persist_dir = vector_store._persist_directory
                if os.path.exists(persist_dir):
                    shutil.rmtree(persist_dir, ignore_errors=True)
            del vector_stores[vector_store_id]
            logger.info(f"Cleaned up vector store {vector_store_id}")
    except Exception as e:
        logger.error(f"Error cleaning up vector store {vector_store_id}: {e}")

# Safe tools condition
def safe_tools_condition(state: State):
    """Safe tools condition that handles cases with no tools"""
    try:
        last_message = state['messages'][-1]
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            return "tools"
        else:
            return END
    except Exception as e:
        logger.error(f"Error in tools_condition: {e}")
        return END

# Initialize tools with error handling
try:
    if os.getenv('SERPAPI_API_KEY'):
        from langchain_community.agent_toolkits.load_tools import load_tools
        tools = load_tools(['serpapi'])
        tool_node = ToolNode(tools)
        has_tools = True
        logger.info("Tools initialized with SerpAPI")
    else:
        tool_node = None
        has_tools = False
        logger.info("No SerpAPI key found, running without web search tools")
except Exception as e:
    logger.warning(f"Could not initialize tools: {e}")
    tool_node = None
    has_tools = False

memory = MemorySaver()

# Build the graph
graph_builder = StateGraph(State)

# Add nodes
graph_builder.add_node("teacher", initialise_teacher)
graph_builder.add_node("process_pdf", process_pdf_node)
graph_builder.add_node("chat", chat)

if has_tools and tool_node:
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

if has_tools and tool_node:
    graph_builder.add_conditional_edges("chat", safe_tools_condition)
    graph_builder.add_edge("tools", "chat")
else:
    graph_builder.add_edge("chat", END)

# Set entry point
graph_builder.set_entry_point("teacher")

# Compile graph
try:
    graph = graph_builder.compile(checkpointer=memory)
    logger.info("Graph compiled successfully")
except Exception as e:
    logger.error(f"Error compiling graph: {e}")
    raise

# API functions
async def stream_graph_updates(user_input: Dict[str, Any], thread_id: str = "default") -> AsyncGenerator[Dict[str, Any], None]:
    """Stream graph updates for API usage"""
    config = {'configurable': {"thread_id": thread_id}}
    
    try:
        initial_state = {
            'messages': user_input.get('messages', []),
            'teacher': user_input.get('teacher', 'Anil Deshmukh'),
            'pdf_there': user_input.get('pdf_there', 'no'),
            'pdf_path': user_input.get('pdf_path'),
        }
        
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

async def chat_with_teacher(message: str, teacher: str = 'Anil Deshmukh', 
                          pdf_path: Optional[str] = None, thread_id: str = "default") -> AsyncGenerator[Dict[str, Any], None]:
    """Main API function for chatting with a teacher"""
    user_input = create_user_input(message, teacher, pdf_path)
    
    async for response in stream_graph_updates(user_input, thread_id):
        yield response

def get_conversation_history(thread_id: str) -> List[Dict[str, Any]]:
    """Get conversation history for a thread"""
    try:
        config = {'configurable': {"thread_id": thread_id}}
        state = graph.get_state(config)
        
        if state and hasattr(state, 'values') and 'messages' in state.values:
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
        
        if state and hasattr(state, 'values') and 'vector_store_id' in state.values:
            cleanup_vector_store(state.values['vector_store_id'])
        
        logger.info(f"Cleaned up conversation {thread_id}")
        
    except Exception as e:
        logger.error(f"Error cleaning up conversation {thread_id}: {e}")

# Test function
async def test_system():
    """Test the system with basic functionality"""
    try:
        print("Testing Google LLM initialization...")
        llm = create_google_llm()
        print("✓ Google LLM initialized successfully")
        
        print("\nTesting basic chat...")
        async for response in chat_with_teacher(
            message="Hello, can you tell me what 2+2 equals?",
            teacher="Anil Deshmukh",
            thread_id="test123"
        ):
            if response.get("content"):
                print(f"Assistant: {response['content']}")
                break
        
        print("✓ Basic chat test completed")
        cleanup_conversation("test123")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        raise

if __name__ == "__main__":
    print("=== Teacher Agent System ===")
    print("Checking environment variables...")
    
    if os.getenv('GOOGLE_API_KEY'):
        print("✓ GOOGLE_API_KEY found")
    else:
        print("✗ GOOGLE_API_KEY not found")
        
    if os.getenv('SERPAPI_API_KEY'):
        print("✓ SERPAPI_API_KEY found")
    else:
        print("! SERPAPI_API_KEY not found (web search disabled)")
    
    print("\n" + graph.get_graph().draw_mermaid())
    
    # Uncomment to run test
    # asyncio.run(test_system())