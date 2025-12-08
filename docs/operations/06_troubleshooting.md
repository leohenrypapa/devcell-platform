# Troubleshooting

## Backend Fails to Start
- Check Python version
- Missing .env variables
- DB file locked → stop other processes

## Frontend Errors
- Clear Vite cache
```
rm -rf node_modules/.vite
```

## LLM Failures
- Port conflict
- Model not pulled
- GPU OOM → switch to CPU or smaller model

## Permissions Issues
- User not in project
- JWT expired

