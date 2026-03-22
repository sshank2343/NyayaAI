from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from pathlib import Path


def _safe_value(value, fallback="Unknown"):
    if value is None:
        return fallback
    text = str(value).strip()
    return text if text else fallback


def _case_key(metadata: dict) -> str:
    case_id = metadata.get("case_id")
    if case_id:
        return str(case_id)
    parts = [
        _safe_value(metadata.get("case_name"), "Unknown Case"),
        _safe_value(metadata.get("court"), "Unknown Court"),
        _safe_value(metadata.get("year"), "Unknown Year"),
    ]
    return "|".join(parts)


def _vector_db_candidates() -> list[Path]:
    base_dir = Path(__file__).resolve().parents[1]
    return [
        base_dir / "data_pipeline" / "vector_db",
        base_dir / "data_pipeline" / "vector_db_production",
        base_dir / "data_pipeline" / "vector_db_production" / "vector_db_production",
    ]


def _load_vector_db(embeddings: HuggingFaceEmbeddings) -> FAISS:
    errors = []
    for candidate in _vector_db_candidates():
        try:
            return FAISS.load_local(
                str(candidate),
                embeddings,
                allow_dangerous_deserialization=True,
            )
        except Exception as exc:
            errors.append(f"{candidate}: {exc}")

    details = " | ".join(errors)
    raise FileNotFoundError(f"Unable to load any FAISS index. Details: {details}")

def retrieve_cases(state: dict) -> dict:
    print("🔎 AGENT: Retriever is searching the FAISS database...")
    question = state["question"]

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    try:
        vector_db = _load_vector_db(embeddings)

        # Pull more chunk candidates, then collapse into case-level results.
        scored_docs = vector_db.similarity_search_with_score(question, k=20)

        case_map: dict[str, dict] = {}
        for doc, score in scored_docs:
            meta = doc.metadata or {}
            key = _case_key(meta)
            item = case_map.get(key)

            excerpt = doc.page_content[:900].strip()
            if item is None:
                item = {
                    "best_score": float(score),
                    "best_doc": doc,
                    "case_name": _safe_value(meta.get("case_name"), "Unknown Case"),
                    "year": _safe_value(meta.get("year"), "Unknown Year"),
                    "court": _safe_value(meta.get("court"), "Unknown Court"),
                    "court_type": _safe_value(meta.get("court_type"), "Unknown Court Type"),
                    "case_type": _safe_value(meta.get("case_type"), "Unknown Case Type"),
                    "bench": _safe_value(meta.get("bench"), "Unknown Bench"),
                    "judges": _safe_value(meta.get("judges"), "Unknown Judges"),
                    "petitioner": _safe_value(meta.get("petitioner"), "Unknown Petitioner"),
                    "respondent": _safe_value(meta.get("respondent"), "Unknown Respondent"),
                    "citation": _safe_value(meta.get("citation"), "Unknown Citation"),
                    "decision_date": _safe_value(meta.get("decision_date"), "Unknown Date"),
                    "source_url": _safe_value(meta.get("source_url"), "Unavailable"),
                    "matched_excerpts": [excerpt] if excerpt else [],
                }
                case_map[key] = item
            else:
                if score < item["best_score"]:
                    item["best_score"] = float(score)
                    item["best_doc"] = doc
                if excerpt and excerpt not in item["matched_excerpts"] and len(item["matched_excerpts"]) < 3:
                    item["matched_excerpts"].append(excerpt)

        ranked = sorted(case_map.values(), key=lambda x: x["best_score"])[:5]
        ranked_docs = [c["best_doc"] for c in ranked]

        similar_cases = []
        for idx, c in enumerate(ranked, start=1):
            relevance = 1.0 / (1.0 + c["best_score"])
            similar_cases.append({
                "rank": idx,
                "similarity_score": round(float(relevance), 4),
                "case_name": c["case_name"],
                "year": c["year"],
                "court": c["court"],
                "court_type": c["court_type"],
                "case_type": c["case_type"],
                "bench": c["bench"],
                "judges": c["judges"],
                "petitioner": c["petitioner"],
                "respondent": c["respondent"],
                "citation": c["citation"],
                "decision_date": c["decision_date"],
                "source_url": c["source_url"],
                "matched_excerpts": c["matched_excerpts"],
            })

        print(f"🔎 AGENT: Retrieved {len(similar_cases)} similar solved cases.")
        return {"documents": ranked_docs, "similar_cases": similar_cases}
        
    except Exception as e:
        print(f"❌ Retrieval Error: {e}")
        return {"documents": [], "similar_cases": []}