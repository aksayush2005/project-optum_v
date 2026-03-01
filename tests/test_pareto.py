from src.optimization.pareto import dominates, non_dominated_indices


def test_dominates():
    assert dominates((1, 2, 3), (1, 2, 4)) is True
    assert dominates((1, 2, 3), (0, 2, 3)) is False


def test_non_dominated_indices():
    points = [(1, 4), (2, 3), (3, 2), (4, 1), (3, 3)]
    idx = non_dominated_indices(points)
    assert set(idx) == {0, 1, 2, 3}
