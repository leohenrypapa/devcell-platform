# FAQ: Common DevCell Issues (Demo Environment)

These are the most common questions/issues during demos and onboarding.

## 1. “I can’t log in from another computer”

- Check that the backend is bound to `0.0.0.0` instead of `127.0.0.1`.
- Confirm you are using the correct **IP + port** (e.g. `http://192.168.x.x:9000`).
- Ensure firewall rules allow access on that port.

## 2. “The Knowledge Base returns no documents”

- Verify that `app/knowledgebase/notes` contains markdown/text files.
- Run the **knowledge diagnostics** endpoints if available.
- Re-ingest or restart the backend so embeddings are rebuilt.

## 3. “Tasks look empty”

- For demos, run the **demo seeding script** to create:
  - Multiple users
  - Projects
  - Tasks across different statuses
  - Standup entries and training tasks

## 4. “The LLM feels slow”

- Confirm the GPU is being used (if available).
- Reduce `use_rag` if context is not needed.
