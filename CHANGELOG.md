# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
-

### Changed
-

---

## [0.2.0] - 2025-12-01

### Added
- Knowledgebase document upload endpoint for PDF/TXT/MD including text extraction and vector indexing using Chroma.
- Endpoint to list all indexed knowledge documents with metadata and preview.
- Endpoint to delete documents (removes vectors and optionally removes files in Knowledgebase/).
- Frontend Knowledge page updates:
  - Upload & index documents
  - List indexed docs with previews
  - Delete documents
  - Improved note-adding UI
- Added automatic refresh of document list after upload or delete.

### Changed
- Refactored `knowledge_service.py` to use unified file extraction and indexing utilities.
- Improved RAG query prompt and fallback logic for more reliable responses.
- Cleaned `DeleteDocumentRequest` model to remove inherited `text` field, preventing 422 errors.

---

## [0.1.0] - Initial Release

### Added
- Initial DevCell Platform skeleton: FastAPI backend, React/TS frontend.
- Authentication system (JWT), Admin dashboard, User management.
- Standups module (create, list, summarize via LLM).
- Projects module (CRUD, progress tracking).
- Knowledgebase (initial version) with text-based notes.
- Chat module with API passthrough/LLM support.
- Basic Dashboard with mission overview stats.
