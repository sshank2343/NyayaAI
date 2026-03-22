import os
from pathlib import Path
from datasets import load_dataset
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DATASET_ID = "opennyaiorg/InJudgements_dataset"


def _pick(row: dict, *keys: str, default: str = "Unknown") -> str:
    for key in keys:
        value = row.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return default


def _get_split() -> str:
    # Set FULL_DATASET=true in .env to ingest the full train split.
    if os.getenv("FULL_DATASET", "false").strip().lower() == "true":
        return "train"
    # Keep local runs fast unless explicitly overridden.
    sample_size = os.getenv("SAMPLE_SIZE", "50").strip()
    return f"train[:{sample_size}]"


def _row_to_document(row) -> Document | None:
    text = str(row.get("Text") or row.get("judgement_text") or "").strip()
    if not text:
        return None

    case_name = _pick(row, "Titles", "case_name", default="Unknown Case")
    court = _pick(row, "Court_Name", "court_name", default="Unknown Court")
    year = _pick(row, "Year", "year", "Judgment_Year", default="Unknown Year")

    metadata = {
        "case_id": f"{case_name}|{court}|{year}",
        "case_name": case_name,
        "court": court,
        "year": year,
        "court_type": _pick(row, "Court_Type", default="Unknown Court Type"),
        "case_type": _pick(row, "Case_Type", default="Unknown Case Type"),
        "bench": _pick(row, "Bench", "Bench_Name", default="Unknown Bench"),
        "judges": _pick(row, "Judge", "Judges", default="Unknown Judges"),
        "petitioner": _pick(row, "Petitioner", "Petitioners", default="Unknown Petitioner"),
        "respondent": _pick(row, "Respondent", "Respondents", default="Unknown Respondent"),
        "citation": _pick(row, "Citation", "EquivalentCitation", default="Unknown Citation"),
        "decision_date": _pick(row, "Date", "Judgment_Date", default="Unknown Date"),
        "source_url": _pick(row, "Doc_url", "Source_URL", default="Unavailable"),
    }
    return Document(page_content=text, metadata=metadata)

def build_vector_database():
    print("🚀 Step 1: Loading dataset from Hugging Face...")
    split = _get_split()
    hf_token = os.getenv("HF_TOKEN")
    dataset = load_dataset(DATASET_ID, split=split, token=hf_token)

    total_rows = len(dataset)
    batch_size = int(os.getenv("EMBED_BATCH_SIZE", "100"))
    print(f"✅ Loaded {total_rows} cases from '{DATASET_ID}' ({split}).")

    # Initialize the text splitter to chop long judgments into manageable chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    print("🧠 Step 2: Downloading Embedding Model...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    print("💾 Step 3: Chunking + Embedding + Indexing in batches...")
    vector_db = None
    pending_docs = []
    processed = 0
    skipped = 0
    total_chunks = 0

    def flush_batch() -> None:
        nonlocal vector_db, pending_docs, total_chunks
        if not pending_docs:
            return

        split_docs = text_splitter.split_documents(pending_docs)
        total_chunks += len(split_docs)
        if vector_db is None:
            vector_db = FAISS.from_documents(split_docs, embeddings)
        else:
            vector_db.add_documents(split_docs)
        pending_docs = []

    for row in dataset:
        try:
            doc = _row_to_document(row)
            processed += 1
            if doc is None:
                skipped += 1
                continue
            pending_docs.append(doc)
            if len(pending_docs) >= batch_size:
                flush_batch()
                print(f"   Indexed {processed}/{total_rows} cases | chunks so far: {total_chunks}")
        except Exception:
            skipped += 1
            continue

    flush_batch()

    if vector_db is None:
        raise RuntimeError("No valid documents found to index. Check dataset fields and content.")

    print(f"✅ Indexed {processed - skipped} cases into {total_chunks} chunks (skipped {skipped}).")

    # Save the database inside the data_pipeline folder
    save_path = BASE_DIR / "vector_db"
    vector_db.save_local(str(save_path))
    print(f"🎉 Success! Database saved locally at '{save_path}'.")

if __name__ == "__main__":
    build_vector_database()