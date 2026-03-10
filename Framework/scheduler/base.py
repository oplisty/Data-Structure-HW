from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..core.simulation import Environment


class SchedulerBase(ABC):
    @abstractmethod
    def select_actions(self, env: Environment) -> list[tuple[int, int]]:
        """Return list of (vehicle_id, task_id) actions for current step."""
        raise NotImplementedError
