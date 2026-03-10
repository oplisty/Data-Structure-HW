from __future__ import annotations

import random

from ..core.config import ScenarioConfig
from ..core.entities import Task


def generate_dynamic_tasks(config: ScenarioConfig, candidate_nodes: list[int]) -> list[Task]:
    random.seed(config.random_seed + 1)

    tasks: list[Task] = []
    for task_id in range(config.num_tasks):
        release_time = random.randint(0, max(0, config.horizon - 1))
        ttl = random.randint(config.task_ttl_min, config.task_ttl_max)
        deadline = release_time + ttl

        tasks.append(
            Task(
                id=task_id,
                release_time=release_time,
                deadline=deadline,
                origin_node=random.choice(candidate_nodes),
                weight=round(random.uniform(1, config.task_max_weight), 2),
            )
        )

    tasks.sort(key=lambda t: t.release_time)
    return tasks
