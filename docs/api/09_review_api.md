# Review API

The Review API provides AI-assisted static code review using the local LLM.  
It powers the **Code Review** page in the DevCell frontend, enabling developers to
submit snippets or full files and receive structured, safe feedback.

All endpoints require authentication.

---

# 🧩 Base URL

```
/api/review
```

---

# 🔐 Permissions Overview

| Operation     | Permission              |
|---------------|--------------------------|
| Submit review | Any authenticated user   |
| Use RAG       | Any authenticated user   |

**No code is persisted** — reviews exist only in the response and frontend state.

---

# 📚 Endpoints

---

## 1. Submit Code for Review

### `POST /api/review`

Runs LLM-driven static analysis on the submitted code.  
Supports optional RAG and prompt shaping.

### Request

```json
{
  "code": "def add(a, b): return a + b",
  "notes": "Check edge cases and readability.",
  "use_rag": false,
  "mode": "code_review"
}
```

#### Fields

| Field     | Type    | Required | Description |
|-----------|---------|----------|-------------|
| `code`    | string  | ✅       | Code snippet to analyze |
| `notes`   | string  | ❌       | Additional instructions for the reviewer persona |
| `use_rag` | boolean | ❌       | Whether to retrieve KB context (defaults to `false`) |
| `mode`    | string  | ❌       | Optional persona; defaults to review persona |

The backend wraps the code in a structured system prompt to control LLM behavior:
- no execution  
- no hallucinating new APIs  
- no unsafe instructions  

---

## Response

```json
{
  "review": "## Summary\nThe function works but lacks type safety...",
  "used_rag": false,
  "sources": []
}
```

If `use_rag = true`, response will include KB excerpt sources.

---

# 🔍 Review Output Structure

The LLM is prompted to produce a standardized markdown structure:

```
## Summary
...

## Strengths
...

## Issues / Risks
...

## Recommendations
...

## Possible Refactor
```python
# improved version...
```
```

The backend validates response formatting and sanitizes output.

---

# ⚠️ Error Responses

| Code | Meaning |
|------|---------|
| `401` | Missing or invalid auth token |
| `422` | Missing `code` field |
| `503` | LLM unavailable or timed out |

---

# 🧪 Example Usage Scenarios

### 1. General Review

```http
POST /api/review
{
  "code": "function foo(x){return x*2;}"
}
```

### 2. Security-Focused Review

```http
POST /api/review
{
  "code": "import os; os.system('rm -rf /')",
  "notes": "Check for unsafe operations",
  "mode": "security"
}
```

### 3. Review with RAG

```http
POST /api/review
{
  "code": "class SessionManager {...}",
  "use_rag": true
}
```

---

# 📚 Related Documents

- Review Module → `../modules/review.md`
- Chat API → `chat_api.md`
- Knowledgebase API → `knowledge_api.md`
- LLM Integration → `../architecture/llm_integration.md`

---

© DevCell Platform Documentation — GitHub OSS Style