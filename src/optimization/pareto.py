from __future__ import annotations

from typing import Iterable, List, Sequence


def dominates(a: Sequence[float], b: Sequence[float]) -> bool:
    not_worse = all(x <= y for x, y in zip(a, b))
    strictly_better = any(x < y for x, y in zip(a, b))
    return not_worse and strictly_better


def non_dominated_indices(vectors: Iterable[Sequence[float]]) -> List[int]:
    vec = list(vectors)
    n = len(vec)
    idx = []
    for i in range(n):
        dominated = False
        for j in range(n):
            if i == j:
                continue
            if dominates(vec[j], vec[i]):
                dominated = True
                break
        if not dominated:
            idx.append(i)
    return idx
