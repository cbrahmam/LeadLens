import json
from datetime import datetime, timezone
from pathlib import Path

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
PIPELINE_FILE = CACHE_DIR / "_pipeline.json"

VALID_STAGES = ["new", "contacted", "replied", "meeting", "closed_won", "closed_lost"]


def _load_pipeline() -> list[dict]:
    if not PIPELINE_FILE.exists():
        return []
    try:
        return json.loads(PIPELINE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, ValueError):
        return []


def _save_pipeline(entries: list[dict]) -> None:
    PIPELINE_FILE.parent.mkdir(parents=True, exist_ok=True)
    PIPELINE_FILE.write_text(json.dumps(entries, indent=2), encoding="utf-8")


def get_all_pipeline_entries() -> list[dict]:
    return _load_pipeline()


def add_to_pipeline(domain: str, company_name: str, stage: str = "new") -> dict:
    entries = _load_pipeline()

    for entry in entries:
        if entry["domain"] == domain:
            return entry

    entry = {
        "domain": domain,
        "company_name": company_name,
        "stage": stage if stage in VALID_STAGES else "new",
        "added_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "notes": "",
        "history": [
            {
                "stage": stage if stage in VALID_STAGES else "new",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }
    entries.append(entry)
    _save_pipeline(entries)
    return entry


def update_pipeline_stage(domain: str, new_stage: str, notes: str | None = None) -> dict | None:
    if new_stage not in VALID_STAGES:
        return None

    entries = _load_pipeline()
    for entry in entries:
        if entry["domain"] == domain:
            entry["stage"] = new_stage
            entry["updated_at"] = datetime.now(timezone.utc).isoformat()
            if notes is not None:
                entry["notes"] = notes
            entry.setdefault("history", []).append({
                "stage": new_stage,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            _save_pipeline(entries)
            return entry

    return None


def remove_from_pipeline(domain: str) -> bool:
    entries = _load_pipeline()
    new_entries = [e for e in entries if e["domain"] != domain]
    if len(new_entries) == len(entries):
        return False
    _save_pipeline(new_entries)
    return True


def get_pipeline_stats() -> dict:
    entries = _load_pipeline()
    counts = {stage: 0 for stage in VALID_STAGES}
    for entry in entries:
        stage = entry.get("stage", "new")
        if stage in counts:
            counts[stage] += 1
    return {"total": len(entries), "by_stage": counts}
