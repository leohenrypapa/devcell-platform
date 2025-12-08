# Code Review Module

The Code Review module provides AI-assisted static code review using the local
LLM. It analyzes uploaded code snippets or pasted code blocks and returns
improvement suggestions, risk flags, readability notes, and refactoring
guidance.

This module operates locally and works offline—no external API calls. The LLM
endpoint may be Ollama, LM Studio, or a local vLLM server configured in
DevCell.

---

# 🎯 Purpose

The Code Review module enables developers to:

- audit code quality  
- identify potential bugs  
- improve readability  
- receive secure, offline guidance  
- streamline development workflows  
- enhance onboarding by giving juniors expert-level feedback  

LLM-based review is particularly useful for:
- backend/React code  
- Python scripts  
- configuration files  
- infrastructure-as-code documents  

---

# 🧱 Data Model

This module **does not store reviews in the database**.

Reasons:
- prevent sensitive code from persisting  
- keep system lightweight  
- reduce overhead  

Frontend state holds the results transiently.

---

# 🧩 Backend Architecture

Backend review logic exists in:

```

routes/review.py
services/review_service.py
core/llm_client.py

````

---

## 📁 1. Routes (`routes/review.py`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/review` | Submit code for AI review |

Example request:

```json
{
  "code": "def add(a, b): return a+b",
  "notes": "Check for edge cases"
}
````

Route ensures:

* authentication
* non-empty code
* safe forwarding to service

---

## 🧠 2. Service Layer (`review_service.py`)

This layer prepares the structured review prompt and sends it to the LLM.

### Core Responsibilities

#### (1) Prompt Construction

Prompts include:

* instructions to act as a rigorous senior engineer
* guidelines to avoid hallucinating new code unless requested
* request for analysis in multiple categories:

Example breakdown:

```
1. High-Level Summary
2. Readability & Maintainability
3. Potential Bugs & Edge Cases
4. Anti-Patterns / Smells
5. Performance Considerations
6. Security Considerations
7. Suggested Improvements
```

Instructions to the model ensure:

* deterministic output
* safe, non-destructive recommendations
* no execution of arbitrary code

#### (2) LLM Interaction

Call:

```
llm_client.send(messages)
```

Includes:

* system prompt (review persona)
* user code block
* optional developer notes

#### (3) Response Normalization

Ensures output includes:

* markdown formatting
* section headers
* no uncontrolled code execution suggestions

---

# 🖥️ Frontend Architecture

Frontend review logic lives in:

```
src/pages/ReviewPage.tsx
src/components/ReviewInput.tsx
src/components/ReviewOutput.tsx
src/lib/review.ts
```

### ReviewPage

Displays:

* input text box for code
* optional notes field
* “Run Review” button
* output panel with formatted suggestions

### ReviewInput

Supports:

* multi-line code blocks
* auto-resizing
* syntax highlighting (future enhancement)

### ReviewOutput

* formats markdown
* preserves code fences
* highlights suggestion sections
* provides copy-to-clipboard button

### lib/review.ts

Implements:

* `submitCodeReview(code, notes)`
* wrap POST request
* handle errors

---

# 🔎 Sample Review Output Format

The LLM returns structured markdown similar to:

````
## Summary
Your function works but lacks validation.

## Potential Bugs
- No type checking
- No handling for None values

## Security Notes
- Input should be sanitized if exposed to external sources

## Suggested Improvements
```python
def add(a: int, b: int) -> int:
    return a + b
````

```

This is not hardcoded — the LLM generates content using the structured prompt.

---

# 🔐 Permissions

| Action | Allowed |
|--------|---------|
| Submit code for review | Any user |
| View review | Only the user (stored in UI state) |
| Persist code snippets | ❌ Not allowed |
| Admin override | Not needed |

No code is stored on disk or in the DB.

---

# 🛑 Safety Considerations

The service prevents:
- executing code  
- modifying local environment  
- generating harmful instructions  
- hallucinating system commands  

The LLM persona is constrained to:
- static analysis  
- safe refactoring suggestions  
- no exploit development  
- no privileged operations  

---

# 🧩 Integration With Other Modules

### Standups
Users often paste code snippets into standups; they can quickly use the Review module as part of their workflow.

### Training
Training tasks may include reviewing student submissions.

### Chat
Chat module may call the LLM in “developer mode,” but Review module provides a more structured output for formal code feedback.

### Projects (future)
Optional: store per-project code review logs (future enhancement).

---

# 🔮 Future Enhancements

- Inline diff comparison  
- Multi-file project reviews  
- Git integration (review commits)  
- Automatic PR-style feedback summaries  
- Severity scoring (low/medium/high risk)  
- Detecting common bug patterns in Python/JS  
- Review history stored per project (optional)  

---

# 📚 Related Documents

- LLM Integration → `../architecture/llm_integration.md`
- Chat Module → `chat.md`
- Training Module → `training.md`
- API Reference → `../api/review_api.md`
- Permissions → `permissions.md`

---

```

© DevCell Platform Documentation — GitHub OSS Style

```