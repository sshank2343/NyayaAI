from typing import TypedDict, List
from langchain.schema import Document

class GraphState(TypedDict):
    """
    This dictionary acts as the shared memory for all our agents.
    As each agent finishes its job, it updates this state and passes it to the next agent.
    """
    question : str
    route_decision:str
    documents: List[Document]
    similar_cases: list[dict]
    generation: str