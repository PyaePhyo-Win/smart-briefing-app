import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth import router as auth_router
from api.billing import router as billing_router
from api.chat import router as chat_router
from api.conversations import router as conversations_router
from api.research import router as research_router
from config import settings

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))

app = FastAPI(title="Smart Briefing — Research Agent Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(billing_router)
app.include_router(conversations_router)
app.include_router(research_router)
app.include_router(chat_router)


@app.get("/")
def health_check():
    return {"status": "online", "message": "Smart Briefing Agent Engine"}
