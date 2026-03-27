import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration: Mapped[str] = mapped_column(String(50))
    mode: Mapped[str] = mapped_column(String(100))
    level: Mapped[str] = mapped_column(String(50))
    icon: Mapped[str] = mapped_column(String(10))
    price: Mapped[str] = mapped_column(String(100))
    badge: Mapped[str | None] = mapped_column(String(50), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=99)
    category: Mapped[str] = mapped_column(String(100))
    next_batch: Mapped[str | None] = mapped_column(String(100), nullable=True)
    curriculum: Mapped[list] = mapped_column(JSONB, default=list)
    curriculum_topics: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    highlights: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    faqs: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=True,
    )
