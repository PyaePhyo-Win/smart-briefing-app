from uuid import UUID

import voyageai
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from db.models import Report, ReportChunk

_client = getattr(voyageai, "Client")(api_key=settings.voyage_api_key)


def chunk_text(text: str) -> list[str]:
    normalized = "\n".join(line.rstrip() for line in text.strip().splitlines())
    if not normalized:
        return []

    chunks: list[str] = []
    start = 0
    text_len = len(normalized)
    chunk_size = settings.rag_chunk_size
    overlap = settings.rag_chunk_overlap

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= text_len:
            break
        start = max(end - overlap, start + 1)

    return chunks


def _embed(texts: list[str], input_type: str) -> list[list[float]]:
    if not texts:
        return []
    result = _client.embed(texts=texts, model=settings.voyage_embedding_model, input_type=input_type)
    return [list(embedding) for embedding in result.embeddings]


def index_report_chunks(db: Session, report: Report) -> int:
    chunks = chunk_text(report.polished_content)
    embeddings = _embed(chunks, input_type="document")

    for index, (content, embedding) in enumerate(zip(chunks, embeddings, strict=True)):
        db.add(
            ReportChunk(
                user_id=report.user_id,
                conversation_id=report.conversation_id,
                report_id=report.id,
                chunk_index=index,
                content=content,
                embedding=embedding,
            )
        )
    return len(chunks)


def retrieve_relevant_chunks(db: Session, user_id: UUID, conversation_id: UUID, query: str) -> list[ReportChunk]:
    embeddings = _embed([query], input_type="query")
    if not embeddings:
        return []

    query_embedding = embeddings[0]
    distance = ReportChunk.embedding.cosine_distance(query_embedding)
    return list(
        db.scalars(
            select(ReportChunk)
            .where(ReportChunk.user_id == user_id, ReportChunk.conversation_id == conversation_id)
            .order_by(distance)
            .limit(settings.rag_top_k)
        )
    )
