# ai_service/agents/synthesis_agent.py

from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

def generate_answer(state: dict) -> dict:
    print("✍️ AGENT: Synthesizer is drafting the final response...")
    question = state["question"]
    documents = state.get("documents", [])
    similar_cases = state.get("similar_cases", [])

    if not documents:
        return {
            "generation": "I'm sorry, my local database is currently empty or I couldn't find any relevant cases.",
            "similar_cases": similar_cases,
        }

    formatted_docs = ""
    for i, doc in enumerate(documents):
        case_name = doc.metadata.get('case_name', 'Unknown Case')
        year = doc.metadata.get('year', 'Unknown Year')
        court = doc.metadata.get('court', 'Unknown Court')
        citation = doc.metadata.get('citation', 'Unknown Citation')
        
        formatted_docs += f"\n--- CASE {i+1} ---\n"
        formatted_docs += f"Source: {case_name} ({year}) | Court: {court} | Citation: {citation}\n"
        formatted_docs += f"Text: {doc.page_content}\n"

    llm = ChatOpenAI(model="gpt-4o", temperature=0)

    prompt = PromptTemplate(
        template="""You are a highly accurate legal assistant for Indian Law.
        Answer the lawyer's query using ONLY the provided Retrieved Cases below.
        
        Rules:
        1. If the answer is not in the Retrieved Cases, state "I do not have enough context to answer this."
        2. DO NOT invent information, facts, or rulings.
        3. You MUST cite your sources. Format citations as [Case Name, Year] at the end of the sentence.

        Lawyer's Query: {question}

        Retrieved Cases: 
        {context}
        
        Final Answer:
        """,
        input_variables=["question", "context"]
    )

    synthesis_chain = prompt | llm | StrOutputParser()
    
    final_answer = synthesis_chain.invoke({
        "question": question,
        "context": formatted_docs
    })

    print("✍️ AGENT: Synthesis complete.")
    return {"generation": final_answer, "similar_cases": similar_cases}