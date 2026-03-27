import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import delete, distinct, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.site_content import SiteContent


async def get_content_by_section(db: AsyncSession, section: str) -> list[SiteContent]:
    result = await db.execute(
        select(SiteContent).where(SiteContent.section == section).order_by(SiteContent.key)
    )
    return list(result.scalars().all())


async def get_content_by_key(db: AsyncSession, section: str, key: str) -> SiteContent | None:
    result = await db.execute(
        select(SiteContent).where(SiteContent.section == section, SiteContent.key == key)
    )
    return result.scalars().first()


async def get_all_sections(db: AsyncSession) -> list[str]:
    result = await db.execute(select(distinct(SiteContent.section)).order_by(SiteContent.section))
    return list(result.scalars().all())


async def upsert_content(
    db: AsyncSession,
    section: str,
    key: str,
    value: str | None = None,
    value_json: Any | None = None,
    content_type: str = "text",
    label: str | None = None,
    description: str | None = None,
) -> SiteContent:
    now = datetime.now(timezone.utc)
    stmt = pg_insert(SiteContent).values(
        id=uuid.uuid4(),
        section=section,
        key=key,
        value=value,
        value_json=value_json,
        content_type=content_type,
        label=label,
        description=description,
        updated_at=now,
    )
    stmt = stmt.on_conflict_do_update(
        constraint="uq_section_key",
        set_={
            "value": stmt.excluded.value,
            "value_json": stmt.excluded.value_json,
            "content_type": stmt.excluded.content_type,
            "label": stmt.excluded.label,
            "description": stmt.excluded.description,
            "updated_at": now,
        },
    )
    await db.execute(stmt)
    await db.commit()
    return await get_content_by_key(db, section, key)  # type: ignore[return-value]


async def bulk_update_content(db: AsyncSession, items: list[dict]) -> list[SiteContent]:
    results: list[SiteContent] = []
    for item in items:
        content = await upsert_content(
            db,
            section=item["section"],
            key=item["key"],
            value=item.get("value"),
            value_json=item.get("value_json"),
            content_type=item.get("content_type", "text"),
        )
        results.append(content)
    return results


async def delete_content(db: AsyncSession, content_id: uuid.UUID) -> None:
    await db.execute(delete(SiteContent).where(SiteContent.id == content_id))
    await db.commit()


async def get_full_site_config(db: AsyncSession) -> dict:
    result = await db.execute(select(SiteContent).order_by(SiteContent.section, SiteContent.key))
    all_content = result.scalars().all()
    config: dict[str, dict[str, Any]] = {}
    for item in all_content:
        section_dict = config.setdefault(item.section, {})
        if item.content_type == "json" and item.value_json is not None:
            section_dict[item.key] = item.value_json
        else:
            section_dict[item.key] = item.value
        # Also store json under key_json for helpers that look for it
        if item.value_json is not None:
            section_dict[f"{item.key}_json"] = item.value_json
    return config
