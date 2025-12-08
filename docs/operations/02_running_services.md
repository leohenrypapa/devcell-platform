# Running Services

## Start Backend
```
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Start Frontend
```
cd frontend
npm run dev
```

## Start Local LLM
### Ollama
```
ollama serve
ollama pull qwen:7b
```

### LM Studio
Run GUI → enable local server mode.

