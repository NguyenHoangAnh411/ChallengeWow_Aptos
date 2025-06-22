from datetime import datetime
from decimal import Decimal
import json
from typing import Any
from uuid import UUID
from fastapi import WebSocket

import re

def snake_to_camel(s: str) -> str:
    return re.sub(r'_([a-z])', lambda m: m.group(1).upper(), s)

def convert_keys_to_camel(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {snake_to_camel(k): convert_keys_to_camel(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_keys_to_camel(i) for i in obj]
    else:
        return obj

def json_safe(obj: Any):
    if hasattr(obj, "model_dump"):
        return obj.model_dump(mode="json")
    elif hasattr(obj, "dict"):
        return obj.dict()

    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, Decimal):
        return float(obj)

    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

async def send_json_safe(ws: WebSocket, data: dict):
    try:
        serialized = json.loads(json.dumps(data, default=json_safe))

        camel_data = convert_keys_to_camel(serialized)

        await ws.send_json(camel_data)
    except Exception as e:
        print(f"❌ Failed to send safe camelCase WS message: {e}")