# LLM & RAG System

## Overview
DevCell integrates with a local or remote LLM server and a Chroma vector store.

## Model Requirements
- OpenAI-compatible `/v1/chat/completions`
- Default model: `qwen2.5-7b-instruct`

## Environment Variables
- `LLM_API_BASE`
- `LLM_MODEL`
- `LLM_API_KEY`
- `CHROMA_PERSIST_DIR`
- `CHROMA_COLLECTION`

## RAG Flow
1. Query → Chroma top-k retrieval
2. Build context prompt
3. Send to LLM
4. Return grounded answer

## Prompt Strategy
- Strictly use provided context
- If info missing, LLM must say so
