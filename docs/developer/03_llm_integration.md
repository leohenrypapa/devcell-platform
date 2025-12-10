# LLM Integration (vLLM + Qwen 7B Coder)

The DevCell Platform uses **local-only LLM inference** per ADR-001.  
The default runtime is **vLLM**, and the default model is **Qwen 7B Coder**.

---

# 1. Starting the Local vLLM Server

```bash
python -m vllm.entrypoints.openai.api_server \
  --model models/qwen7b-coder \
  --port 8000
````

Verify:

```bash
curl http://localhost:8000/v1/models
```

---

# 2. Backend LLM Client

`core/llm_client.py` manages:

* prompt formatting
* persona modes
* error handling
* RAG context injection
* fallback modes

---

# 3. Persona Modes

Modes include:

* **assistant** – general help
* **developer** – code explanations
* **analyst** – data reasoning
* **docs** – documentation generation

Backend sets mode via request context.

---

# 4. RAG Integration (ADR-008)

RAG pipeline:

```
User Query
   ↓
Retriever (VectorStore)
   ↓
Context Assembly
   ↓
LLM Generation
   ↓
Response
```

Initialize vector index:

```bash
python backend/app/services/rag_init.py
```

---

# 5. How Frontend Uses LLM

Frontend never calls LLM directly.

Flow:

```
React UI → /api/llm/query → LLM Client → vLLM → result
```

---

# 6. Troubleshooting

### LLM fails to load

* Ensure folder exists: `models/qwen7b-coder/`
* Ensure VRAM is sufficient

### Backend errors: “LLM not reachable”

Check:

```
curl http://localhost:8000/v1/models
```

### Bad outputs / hallucinations

Switch persona or use RAG mode.

---

# Diagram

```
+-------------+      +------------------+      +----------------------+
| Frontend UI | ---> | FastAPI LLM API  | ---> | Local vLLM (Qwen7B)  |
+-------------+      +------------------+      +----------------------+
                               |
                               v
                      +-----------------+
                      | RAG VectorStore |
                      +-----------------+
```