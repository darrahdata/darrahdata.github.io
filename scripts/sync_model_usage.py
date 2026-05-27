#!/usr/bin/env python3
import json
import re
import sqlite3
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LOG_DB = Path.home() / ".codex" / "logs_2.sqlite"
OUT = ROOT / "cp_usage" / "usage_data.json"

PRICING = {
    "gpt-5.5": {"input": 5.00, "cached": 0.50, "output": 30.00},
    "gpt-5.4": {"input": 2.50, "cached": 0.25, "output": 15.00},
    "gpt-5.4-mini": {"input": 0.75, "cached": 0.075, "output": 4.50},
    "gpt-5.4-nano": {"input": 0.20, "cached": 0.02, "output": 1.25},
    "gpt-5.3-codex": {"input": 1.75, "cached": 0.175, "output": 14.00},
    "chatgpt-4o-latest": {"input": 5.00, "cached": 0.50, "output": 30.00},
}


def model_key(model):
    return (model or "gpt-5.5").lower().replace("_", "-")


def cost(model, input_tokens, cached_tokens, output_tokens):
    pricing = PRICING.get(model_key(model), PRICING["gpt-5.5"])
    uncached = max(input_tokens - cached_tokens, 0)
    return (
        uncached / 1_000_000 * pricing["input"]
        + cached_tokens / 1_000_000 * pricing["cached"]
        + output_tokens / 1_000_000 * pricing["output"]
    )


def event_from_body(body):
    marker = "websocket event: "
    if marker not in body:
        return None
    payload = body.split(marker, 1)[1].strip()
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def turn_id_from_body(body):
    match = re.search(r"turn_id=([0-9a-f-]+)", body)
    return match.group(1) if match else None


def main():
    if not LOG_DB.exists():
        raise SystemExit(f"Missing Codex log database: {LOG_DB}")

    rows = []
    seen = set()
    con = sqlite3.connect(LOG_DB)
    query = """
        select ts, thread_id, feedback_log_body
        from logs
        where feedback_log_body like '%websocket event: {"type":"response.completed"%'
        order by ts desc
    """

    for ts, thread_id, body in con.execute(query):
        event = event_from_body(body or "")
        if not event or event.get("type") != "response.completed":
            continue

        response = event.get("response") or {}
        response_id = response.get("id")
        if not response_id or response_id in seen:
            continue
        seen.add(response_id)

        usage = response.get("usage") or {}
        input_tokens = int(usage.get("input_tokens") or 0)
        output_tokens = int(usage.get("output_tokens") or 0)
        cached_tokens = int((usage.get("input_tokens_details") or {}).get("cached_tokens") or 0)
        if not input_tokens and not output_tokens:
            continue

        model = response.get("model") or "gpt-5.5"
        date = datetime.fromtimestamp(int(response.get("completed_at") or ts)).strftime("%Y-%m-%d")

        rows.append(
            {
                "id": response_id,
                "threadId": thread_id,
                "turnId": turn_id_from_body(body),
                "date": date,
                "source": "codex",
                "model": model,
                "input": input_tokens,
                "cached": cached_tokens,
                "output": output_tokens,
                "cost": round(cost(model, input_tokens, cached_tokens, output_tokens), 6),
            }
        )

    OUT.write_text(
        json.dumps(
            {
                "generatedAt": datetime.now().isoformat(timespec="seconds"),
                "source": str(LOG_DB),
                "entries": rows,
            },
            indent=2,
        )
        + "\n"
    )
    print(f"Wrote {len(rows)} usage entries to {OUT}")


if __name__ == "__main__":
    main()
