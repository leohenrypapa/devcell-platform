# LLM Integration Architecture

DevCell provides a unified and modular interface for interacting with Large
Language Models (LLMs). These models power several core features of the
platform:

- Standup summaries
- SITREP generation
- Knowledgebase embeddings
- RAG search queries
- General chat interface
- Code review
- Training roadmap transformations

This document describes how DevCell integrates with LLMs at the architectural
level, including configuration, client workflows, and module interactions.

---

# 🧠 Design Principles

1. **Local-First**  
   DevCell must operate using fully local LLM endpoints (e.g., Ollama, LM
   Studio, local vLLM). No cloud dependency is required.

2. **Unified LLM Client**  
   All LLM calls go through a single lightweight client with a consistent API.

3. **Module Independence**  
   Each feature module (Standups, KB, Review, Training, Chat) uses LLMs
   independently via shared utilities.

4. **Structured Prompts**  
   Prompts are clean, consistent, and abstracted away from business logic.

---

# 🧩 LLM Client (core/llm_client.py)

The LLM client provides a simple interface:

```

async def send(messages: list[dict], *, temperature=0.3, max_tokens=4096)

````

### **Message Format**
Standard OpenAI-style messages:

```json
[
  { "role": "system", "content": "...instructions..." },
  { "role": "user", "content": "...prompt..." }
]
````

### **Responsibilities**

* Construct request payload
* Send HTTP request to the configured endpoint
* Handle timeouts and connection errors
* Return the parsed response content

### **Configuration**

Defined in `core/config.py`:

```
LLM_BASE_URL = "http://localhost:8001"
LLM_MODEL = "qwen2-7b"
```

Can be modified for:

* LM Studio
* Ollama
* Custom vLLM deployments
* Remote endpoints (if allowed)

---

# 🔌 Where LLMs Are Used

DevCell uses LLMs in a structured and modular fashion.

## **1. Standup Summaries**

File: `services/standup_service.py`
LLM generates daily summaries based on Y/T/B entries.

Prompt includes:

* yesterday / today / blockers
* user metadata (display name)
* optional reminders or blockers formatting

Used for:

* Dashboard display
* SITREP inclusion

---

## **2. SITREP Generation**

File: `services/dashboard_service.py`

The SITREP pipeline gathers:

* today's standup (if present)
* active tasks
* recent items
* any provided instructions

LLM produces a structured report, typically including:

* Key accomplishments
* Current operations
* Risks and blockers
* Upcoming priorities

This replaces manual briefing writing.

---

## **3. Knowledgebase Embeddings**

Files:

* `knowledgebase/embedder.py`
* `knowledgebase/indexer.py`
* `knowledgebase/query.py`

### Workflow:

1. User uploads a document
2. File stored locally (`knowledgebase/documents.py`)
3. Embedding request sent to LLM
4. Vector stored in ChromaDB
5. Query pipeline uses embeddings for semantic search

Supported formats:

* `.txt`
* `.md`
* `.pdf` (if extracted to text beforehand)

---

## **4. RAG Query Pipeline**

File: `knowledgebase/rag.py`

### Steps:

1. Convert query → embedding
2. Find similar chunks via Chroma
3. Build context block
4. Craft RAG prompt for LLM
5. Return answer + references

Used in:

* KB Search page
* Chat contextual queries
* SITREP enrichment

---

## **5. Code Review Service**

File: `services/review_service.py`

Provides AI-driven code reviews:

* style issues
* readability
* potential bugs
* improvement suggestions

Prompt includes:

* inline comments
* summary of improvements
* risk warnings

Frontend displays:

* collapsed suggestions
* inline diffs (optional future feature)

---

## **6. Chat Module**

Routes: `routes/chat.py`

General LLM interface for:

* Q&A
* support tasks
* RAG-enhanced queries
* debugging assistance

System prompt varies based on:

* persona (general assistant / analyst / developer)
* context (knowledgebase / tasks / training)

---

## **7. Training Module**

File: `services/training_service.py`

LLM helps process training roadmap metadata:

* transform bullet lists
* extract tasks
* rephrase objectives
* generate seed tasks

This automates operator onboarding workflows.

---

# 🔧 Prompt Engineering Architecture

Prompts are constructed inside service modules, not routes or stores.

### Core properties:

* consistent structure
* reproducible outputs
* easy to adjust per module
* minimal hallucination risk

Examples:

* Standup summary prompt uses Y/T/B + objectives
* KB RAG prompt injects retrieved context
* Review prompt highlights code with fences
* SITREP prompt includes structured sections

This ensures each module owns its own LLM behavior.

---

# 📦 Error Handling & Safety

LLM errors are always caught and wrapped in predictable exceptions:

* timeout
* unreachable model
* malformed response
* failure to embed

Fallback behaviors:

* return placeholder text
* skip AI features
* return empty results

Core principle: **platform functions must not break even if the LLM is down.**

---

# 📊 Performance Considerations

* Embedding and SITREP generation use **async I/O**
* ChromaDB lookups are cheap compared to LLM calls
* Token limits depend on model (configurable)
* Summaries and RAG use shorter prompts for performance
* Review service supports large-code truncation

---

# 🔮 Future LLM Features (Roadmap)

### **Planned**

* Background worker (Celery or async tasks) for embeddings
* Multiple model configurations per module
* Chain-of-thought suppression for deterministic outputs
* Fine-tuned models for standups + SITREPs
* Configurable tools (calculator, knowledge retriever, task-generator)

### **Possible**

* LLM Agent mode for:

  * automated documentation generation
  * codebase exploration
  * workflow automation
* Real-time LLM streaming

---

# 📚 Related Documents

* Backend Architecture → `architecture/backend.md`
* Data Model → `architecture/data_model.md`
* Knowledgebase Module → `modules/knowledge.md`
* Code Review Module → `modules/review.md`
* Training Module → `modules/training.md`
* Chat Module → `modules/chat.md`

---

```
© DevCell Platform Documentation — GitHub OSS Style
```