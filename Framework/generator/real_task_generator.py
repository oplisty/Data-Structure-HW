from __future__ import annotations

import random

from ..core.config import ScenarioConfig
from ..core.entities import Task


def generate_real_tasks(
    config: ScenarioConfig,
    candidate_node_ids: list[int],
    mode: str = "uniform_nodes",
    hotspot_node_ids: list[int] | None = None,
    hotspot_ratio: float = 0.7,
) -> list[Task]:
    """Generate dynamic tasks on real road-network nodes.

    mode:
    - uniform_nodes: uniformly sample from all candidate nodes.
    - hotspot_nodes: sample from hotspot nodes with a given ratio.
    """
    if not candidate_node_ids:
        raise ValueError("candidate_node_ids is empty")

    random.seed(config.random_seed + 11)
    tasks: list[Task] = []

    use_hotspot = mode == "hotspot_nodes" and hotspot_node_ids
    hotspots = hotspot_node_ids or []

    for task_id in range(config.num_tasks):
        release_time = random.randint(0, max(0, config.horizon - 1))
        ttl = random.randint(config.task_ttl_min, config.task_ttl_max)
        deadline = release_time + ttl

        if use_hotspot and random.random() < hotspot_ratio:
            origin_node = random.choice(hotspots)
        else:
            origin_node = random.choice(candidate_node_ids)

        tasks.append(
            Task(
                id=task_id,
                release_time=release_time,
                deadline=deadline,
                origin_node=origin_node,
                weight=round(random.uniform(1, config.task_max_weight), 2),
            )
        )

    tasks.sort(key=lambda x: x.release_time)
    return tasks
