from __future__ import annotations

from dataclasses import asdict
from hashlib import md5
from typing import Dict

from src.services.signature_registry import GoldenSignature, SignatureRegistry


class ContinuousLearner:
    def __init__(self, registry: SignatureRegistry) -> None:
        self.registry = registry

    @staticmethod
    def _context_fingerprint(context: Dict[str, float]) -> str:
        text = "|".join(f"{k}={context[k]}" for k in sorted(context.keys()))
        return md5(text.encode("utf-8")).hexdigest()

    def propose_signature(
        self,
        mode: str,
        params: Dict[str, float],
        outcomes: Dict[str, float],
        constraints_snapshot: Dict[str, float],
        confidence: float,
        approved: bool = False,
    ) -> GoldenSignature:
        version = self.registry.next_version(mode)
        sig_id = f"{mode}-v{version}"
        context = {
            "material_type": params.get("material_type_id", 0.0),
            "machine_id": params.get("machine_id", 0.0),
            "batch_size": params.get("batch_size", 0.0),
        }
        signature = GoldenSignature(
            signature_id=sig_id,
            version=version,
            mode=mode,
            context_fingerprint=self._context_fingerprint(context),
            params=params,
            objectives=outcomes,
            constraints_snapshot=constraints_snapshot,
            confidence=confidence,
            approved=approved,
            active=approved,
        )
        self.registry.add_signature(signature)
        return signature

    def challenge_and_promote(self, candidate: GoldenSignature, approved_by_human: bool) -> Dict[str, str]:
        promoted = self.registry.promote(candidate.signature_id, approved_by_human)
        return {
            "signature_id": candidate.signature_id,
            "status": "promoted" if promoted and approved_by_human else "pending_or_rejected",
            "approved": str(approved_by_human),
            "payload": str(asdict(candidate)),
        }
