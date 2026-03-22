from fastapi import FastAPI, HTTPException , UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
import pdfplumber
import pytesseract
from PIL import Image
import io

load_dotenv()

from agents import GraphState
from agents.router_agent import route_question
from agents.retrieval_agent import retrieve_cases
from agents.synthesis_agent import generate_answer

app = FastAPI(title="Legal Research Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

#  LANGGRAPH WORKFLOW
workflow = StateGraph(GraphState)

workflow.add_node("router", route_question)
workflow.add_node("retriever", retrieve_cases)
workflow.add_node("synthesizer", generate_answer)

# Create a simple fallback node for non-legal questions (e.g., "Hello")
def conversational_fallback(state: GraphState) -> dict:
    return {"generation": "Hello! I am your AI Legal Research Assistant. Please describe the facts of a legal case, or upload a FIR document, and I will find similar precedents for you."}
workflow.add_node("conversational_fallback", conversational_fallback)

workflow.set_entry_point("router")

def decide_next_step(state: GraphState):
    """Reads the router's decision to determine the next node."""
    if state.get("route_decision") == "vector_search":
        return "retriever"
    else:
        return "conversational_fallback"
    
# Conditional edge based on the router's decision
workflow.add_conditional_edges(
    "router",
    decide_next_step,
    {
        "retriever": "retriever",
        "conversational_fallback": "conversational_fallback"
    }
)

# Standard edges for the rest of the pipeline
workflow.add_edge("retriever", "synthesizer")
workflow.add_edge("synthesizer", END)
workflow.add_edge("conversational_fallback", END)

# Compile the graph into an executable pipeline!
ai_pipeline = workflow.compile()



# ==========================================
# 🌐 FASTAPI ENDPOINTS
# ==========================================
# Endpoint 1: Standard Text Search
class QueryRequest(BaseModel):
    text: str

@app.post("/api/search")
async def process_text_query(request: QueryRequest):
    try:
        print(f"📥 Received Text Query: {request.text[:50]}...")
        initial_state = {"question": request.text}
        result = ai_pipeline.invoke(initial_state)
        return {
            "response": result["generation"],
            "similar_cases": result.get("similar_cases", []),
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

# Endpoint 2: Multi-Modal PDF & Image Upload (The Advanced Feature!)
@app.post("/api/upload-and-search")
async def process_file_query(file: UploadFile = File(...)):
    try:
        print(f"📥 Received File: {file.filename}")
        extracted_text = ""
        file_bytes = await file.read()

        # Handle PDFs
        if file.filename.lower().endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text: extracted_text += text + "\n"
        
        # Handle Images
        elif file.filename.lower().endswith((".jpg", ".jpeg", ".png")):
            image = Image.open(io.BytesIO(file_bytes))
            extracted_text = pytesseract.image_to_string(image)
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in file.")

        print("✅ Text extracted! Routing to LangGraph...")
        
        # Pass the extracted text straight into your AI agents
        initial_state = {"question": extracted_text}
        result = ai_pipeline.invoke(initial_state)
        
        return {
            "extracted_preview": extracted_text[:200] + "...", 
            "response": result["generation"],
            "similar_cases": result.get("similar_cases", []),
        }

    except Exception as e:
        print(f"❌ Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health_check():
    return {"status": "AI Engine is live and LangGraph is compiled!"}