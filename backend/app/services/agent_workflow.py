from typing import TypedDict
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session
from app.models.entities import AgentDefinition
from app.services.ollama import ollama_service
from app.services.rag import retrieve_chunks


class AgentState(TypedDict, total=False):
    user_input: str
    retrieved_context: str
    output: str
    tool_events: list[dict]


async def build_agent_graph(db: Session, agent: AgentDefinition, user_id: str | None = None):
    async def retrieve_node(state: AgentState) -> AgentState:
        rows = await retrieve_chunks(db, state["user_input"], top_k=4, user_id=user_id)
        context = "\n\n".join(
            f"[{doc.name}, page {chunk.page_number or 'N/A'}] {chunk.text}"
            for chunk, doc, _distance in rows
        )
        events = list(state.get("tool_events", []))
        events.append({
            "name": "knowledge_search",
            "status": "completed",
            "detail": f"Retrieved {len(rows)} relevant chunks.",
            "output": {"chunk_count": len(rows)},
        })
        return {"retrieved_context": context, "tool_events": events}

    async def respond_node(state: AgentState) -> AgentState:
        context = state.get("retrieved_context", "")
        prompt = (
            f"You are {agent.name}. {agent.description}\n"
            "Use the context below where relevant. Be transparent if it is empty or insufficient. "
            "Do not claim that external actions were performed.\n\n"
            f"Context:\n{context or '[No matching knowledge-base excerpts found]'}\n\n"
            f"Task: {state['user_input']}\n\nResponse:"
        )
        output = await ollama_service.generate(prompt, system="You are a careful agent assistant.")
        events = list(state.get("tool_events", []))
        events.append({"name": "generate_response", "status": "completed", "detail": "Generated final response."})
        return {"output": output, "tool_events": events}

    graph = StateGraph(AgentState)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("respond", respond_node)
    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "respond")
    graph.add_edge("respond", END)
    return graph.compile()
