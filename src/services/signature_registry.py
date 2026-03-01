from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class GoldenSignature:
    signature_id: str
    version: int
    mode: str
    context_fingerprint: str
    params: Dict[str, float]
    objectives: Dict[str, float]
    constraints_snapshot: Dict[str, float]
    confidence: float
    approved: bool
    active: bool
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SignatureRegistry:
    def __init__(self, store_path: str) -> None:
        self.store_path = Path(store_path)
        if not self.store_path.exists():
            self._write([])

    def _read(self) -> List[Dict]:
        return json.loads(self.store_path.read_text(encoding="utf-8"))

    def _write(self, data: List[Dict]) -> None:
        self.store_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def list_active(self, mode: Optional[str] = None) -> List[GoldenSignature]:
        records = self._read()
        out = []
        for r in records:
            if r["active"] and (mode is None or r["mode"] == mode):
                out.append(GoldenSignature(**r))
        return out

    def add_signature(self, signature: GoldenSignature) -> None:
        records = self._read()
        records.append(asdict(signature))
        self._write(records)

    def promote(self, signature_id: str, approved_by_human: bool) -> bool:
        records = self._read()
        found = False
        target_mode = None
        for r in records:
            if r["signature_id"] == signature_id:
                found = True
                target_mode = r["mode"]
                r["approved"] = approved_by_human
                r["active"] = approved_by_human

        if not found:
            return False

        if approved_by_human and target_mode is not None:
            for r in records:
                if r["mode"] == target_mode and r["signature_id"] != signature_id:
                    r["active"] = False

        self._write(records)
        return True

    def next_version(self, mode: str) -> int:
        records = self._read()
        versions = [r["version"] for r in records if r["mode"] == mode]
        return (max(versions) + 1) if versions else 1
