from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import (
    health,
    chat,
    knowledge,
    standup,
    projects,
    review,
    dashboard,
    auth,
    tasks,
    training,
)

from app.db import init_db
from app.services.knowledge import index_files_in_knowledgebase
from app.services.user_store import ensure_default_admin  # 👈 NEW import


def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME)

    # -------------------------
    # CORS
    # -------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -------------------------
    # ROUTERS
    # -------------------------
    api_prefix = settings.API_V1_PREFIX
    app.include_router(health.router, prefix=api_prefix)
    app.include_router(chat.router, prefix=api_prefix)
    app.include_router(knowledge.router, prefix=api_prefix)
    app.include_router(standup.router, prefix=api_prefix)
    app.include_router(projects.router, prefix=api_prefix)
    app.include_router(review.router, prefix=api_prefix)
    app.include_router(dashboard.router, prefix=api_prefix)
    app.include_router(auth.router, prefix=api_prefix)
    app.include_router(tasks.router, prefix=api_prefix)
    app.include_router(training.router, prefix=api_prefix)


    # -------------------------
    # STARTUP EVENTS
    # -------------------------
    @app.on_event("startup")
    async def startup_event():
        # Initialize SQLite DB
        init_db()

        # Ensure we always have at least one admin user.
        # If no admin exists, creates: username=admin, password=password
        ensure_default_admin()

        # Initialize RAG system (Chroma + embeddings + file indexing)
        index_files_in_knowledgebase()
        
        print("✔ Knowledgebase indexed and ready.")

    return app


app = create_app()
