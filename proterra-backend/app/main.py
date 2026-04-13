from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routes import leads, projects, contractors, bidding, ai_assistant, dashboard, webhooks

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ProTerra CRM API")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Register routers
app.include_router(leads.router)
app.include_router(projects.router)
app.include_router(contractors.router)
app.include_router(bidding.router)
app.include_router(ai_assistant.router)
app.include_router(dashboard.router)
app.include_router(webhooks.router)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
