from datetime import datetime
from decimal import Decimal
import json
from typing import Any, Set
from uuid import UUID
from fastapi import WebSocket

import re

from fastapi.encoders import jsonable_encoder
from fastapi.websockets import WebSocketState

def snake_to_camel(s: str) -> str:
    return re.sub(r'_([a-z])', lambda m: m.group(1).upper(), s)

def convert_keys_to_camel(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {snake_to_camel(k): convert_keys_to_camel(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_keys_to_camel(i) for i in obj]
    else:
        return obj

def json_safe(obj: Any, exclude: Set[str] = None):
    exclude = exclude or set()

    if isinstance(obj, dict):
        return {
            k: json_safe(v, exclude)
            for k, v in obj.items()
            if k not in exclude
        }

    if isinstance(obj, list):
        return [json_safe(i, exclude) for i in obj]

    if hasattr(obj, "model_dump"):
        return json_safe(obj.model_dump(mode="json", exclude=exclude), exclude)

    if hasattr(obj, "dict"):
        return json_safe(obj.dict(exclude=exclude), exclude)

    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (str, int, float, bool)) or obj is None:
        return obj

    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

async def send_json_safe(websocket: WebSocket | None, data: dict):
    if websocket:
        if websocket.client_state != WebSocketState.CONNECTED:
            print("⚠️ WebSocket already closed, cannot send message.")
            return

        try:
            print(f"[SEND_JSON]: {data}")
            await websocket.send_json(jsonable_encoder(data))
        except Exception as e:
            print(f"❌ Failed to send safe camelCase WS message: {e}")
    else:
        print("⚠️ No websocket to send message to.")
