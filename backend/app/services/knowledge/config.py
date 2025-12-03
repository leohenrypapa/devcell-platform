from pathlib import Path

# Repo root (../.. from this file)
BASE_DIR = Path(__file__).resolve().parents[2]

# Standardize on lowercase "knowledgebase" for the folder name
KNOWLEDGE_DIR = BASE_DIR / "knowledgebase"

# Chroma persistent path
CHROMA_DIR = BASE_DIR / "chroma_store"
