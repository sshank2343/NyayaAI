from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

def route_question(state: dict)->dict:
    print("🚦 AGENT: Router is analyzing the query...")
    question = state["question"]
    # We use a fast, cheap model (GPT-3.5) just to make a routing decision
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

    prompt = PromptTemplate(
        template="""You are an expert routing agent for a legal research system.
        Analyze the following user input:
        "{question}"
        
        If the user is describing a legal case, asking for precedents, or asking about the law, output the exact word: 'vector_search'
        If the user is just saying hello, asking who you are, or making small talk, output the exact word: 'direct_answer'
        
        Output only the single word. No other text.
        """,
        input_variables=["question"]
    )
    router_chain = prompt | llm | StrOutputParser()
    decision = router_chain.invoke({"question": question})

    print(f"🚦 AGENT: Router decided -> {decision.strip()}")
    return {"route_decision": decision.strip()}
