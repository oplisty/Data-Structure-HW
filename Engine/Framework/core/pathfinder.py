from __future__ import annotations

import heapq
import math
import random
from enum import Enum
from typing import Protocol

from .graph import Graph


class EnergyVehicle(Protocol):
    battery: float
    energy_per_km: float


class PathAlgorithm(Enum):
    DIJKSTRA = "dijkstra"
    ASTAR = "astar"
    RRT = "rrt"


class PathFinder:
    """Shortest path utility supporting Dijkstra, A* and RRT algorithms.

    Default algorithm is Dijkstra (globally optimal, cache-friendly).
    A* is point-to-point optimal with heuristic speedup.
    RRT is a probabilistic planner suitable for feasibility checking.
    """

    def __init__(
        self,
        graph: Graph,
        algorithm: PathAlgorithm = PathAlgorithm.DIJKSTRA,
    ) -> None:
        self.graph = graph
        self.algorithm = algorithm
        self.distance_cache: dict[tuple[int, int], float] = {}
        self.path_cache: dict[tuple[int, int], list[int]] = {}
        self.source_dist_cache: dict[int, dict[int, float]] = {}
        self.source_prev_cache: dict[int, dict[int, int]] = {}

    def clear_cache(self) -> None:
        self.distance_cache.clear()
        self.path_cache.clear()
        self.source_dist_cache.clear()
        self.source_prev_cache.clear()

    def shortest_distance(self, start: int, end: int) -> float:
        key = (start, end)
        if key in self.distance_cache:
            return self.distance_cache[key]

        if self.algorithm == PathAlgorithm.ASTAR:
            path = self._run_astar(start, end)
            if not path:
                value = math.inf
            else:
                value = sum(
                    self.graph.edge_distance(path[i], path[i + 1]) or 0.0
                    for i in range(len(path) - 1)
                )
            self.distance_cache[key] = value
            self.path_cache[key] = path
            return value

        if self.algorithm == PathAlgorithm.RRT:
            path = self._run_rrt(start, end)
            if not path:
                value = math.inf
            else:
                value = sum(
                    self.graph.edge_distance(path[i], path[i + 1]) or 0.0
                    for i in range(len(path) - 1)
                )
            self.distance_cache[key] = value
            self.path_cache[key] = path
            return value

        # Dijkstra（默认）
        dist, _ = self._get_source_shortest_tree(start)
        value = dist.get(end, math.inf)
        self.distance_cache[key] = value
        return value

    def shortest_path(self, start: int, end: int) -> list[int]:
        key = (start, end)
        if key in self.path_cache:
            return self.path_cache[key]

        if self.algorithm == PathAlgorithm.ASTAR:
            path = self._run_astar(start, end)
            dist = sum(
                self.graph.edge_distance(path[i], path[i + 1]) or 0.0
                for i in range(len(path) - 1)
            ) if path else math.inf
            self.path_cache[key] = path
            self.distance_cache[key] = dist
            return path

        if self.algorithm == PathAlgorithm.RRT:
            path = self._run_rrt(start, end)
            dist = sum(
                self.graph.edge_distance(path[i], path[i + 1]) or 0.0
                for i in range(len(path) - 1)
            ) if path else math.inf
            self.path_cache[key] = path
            self.distance_cache[key] = dist
            return path

        # Dijkstra（默认）
        dist_map, prev = self._get_source_shortest_tree(start)
        if end not in dist_map or math.isinf(dist_map[end]):
            self.path_cache[key] = []
            self.distance_cache[key] = math.inf
            return []

        path = [end]
        cur = end
        while cur != start:
            cur = prev[cur]
            path.append(cur)
        path.reverse()

        self.path_cache[key] = path
        self.distance_cache[key] = dist_map[end]
        return path

    def _get_source_shortest_tree(self, start: int) -> tuple[dict[int, float], dict[int, int]]:
        if start not in self.source_dist_cache:
            dist, prev = self._run_dijkstra(start)
            self.source_dist_cache[start] = dist
            self.source_prev_cache[start] = prev
        return self.source_dist_cache[start], self.source_prev_cache[start]

    def can_reach(
        self,
        vehicle: EnergyVehicle,
        start: int,
        end: int,
        safety_margin: float = 0.0,
    ) -> bool:
        distance = self.shortest_distance(start, end)
        if math.isinf(distance):
            return False
        needed = distance * vehicle.energy_per_km + safety_margin
        return vehicle.battery >= needed

    def can_finish_task_and_return(
        self,
        vehicle: EnergyVehicle,
        current_node: int,
        task_node: int,
        depot_node: int,
        safety_margin: float = 0.0,
    ) -> bool:
        d1 = self.shortest_distance(current_node, task_node)
        d2 = self.shortest_distance(task_node, depot_node)
        if math.isinf(d1) or math.isinf(d2):
            return False
        needed = (d1 + d2) * vehicle.energy_per_km + safety_margin
        return vehicle.battery >= needed

    def nearest_reachable_station(
        self,
        vehicle: EnergyVehicle,
        start: int,
        station_node_ids: list[int],
        safety_margin: float = 0.0,
    ) -> int | None:
        best_station: int | None = None
        best_distance = math.inf

        for station_node in station_node_ids:
            distance = self.shortest_distance(start, station_node)
            if math.isinf(distance):
                continue
            needed = distance * vehicle.energy_per_km + safety_margin
            if vehicle.battery >= needed and distance < best_distance:
                best_distance = distance
                best_station = station_node

        return best_station

    # ------------------------------------------------------------------
    # 算法实现
    # ------------------------------------------------------------------

    def _run_dijkstra(self, start: int) -> tuple[dict[int, float], dict[int, int]]:
        """标准 Dijkstra 单源最短路，时间复杂度 O((V+E)logV)。"""
        distances = {node_id: math.inf for node_id in self.graph.nodes}
        previous: dict[int, int] = {}

        if start not in distances:
            return distances, previous

        distances[start] = 0.0
        heap: list[tuple[float, int]] = [(0.0, start)]

        while heap:
            cur_dist, node = heapq.heappop(heap)
            if cur_dist > distances[node]:
                continue

            for edge in self.graph.neighbors(node):
                alt = cur_dist + edge.distance
                if alt < distances[edge.to]:
                    distances[edge.to] = alt
                    previous[edge.to] = node
                    heapq.heappush(heap, (alt, edge.to))

        return distances, previous

    def _run_astar(self, start: int, end: int) -> list[int]:
        """A* 点对点最短路。

        启发函数使用节点间欧氏距离（可容许启发，保证最优性）。
        时间复杂度优于 Dijkstra（有目标导向），适合单次查询。
        """
        if start not in self.graph.nodes or end not in self.graph.nodes:
            return []
        if start == end:
            return [start]

        def heuristic(node: int) -> float:
            return self.graph.euclidean_distance(node, end)

        g_score: dict[int, float] = {start: 0.0}
        # heap: (f = g + h, g, node)
        heap: list[tuple[float, float, int]] = [(heuristic(start), 0.0, start)]
        came_from: dict[int, int] = {}
        closed: set[int] = set()

        while heap:
            f, g, node = heapq.heappop(heap)
            if node in closed:
                continue
            closed.add(node)

            if node == end:
                # 回溯路径
                path = [end]
                cur = end
                while cur != start:
                    cur = came_from[cur]
                    path.append(cur)
                path.reverse()
                return path

            for edge in self.graph.neighbors(node):
                neighbor = edge.to
                if neighbor in closed:
                    continue
                tentative_g = g + edge.distance
                if tentative_g < g_score.get(neighbor, math.inf):
                    g_score[neighbor] = tentative_g
                    came_from[neighbor] = node
                    f_score = tentative_g + heuristic(neighbor)
                    heapq.heappush(heap, (f_score, tentative_g, neighbor))

        return []  # 不可达

    def _run_rrt(
        self,
        start: int,
        end: int,
        max_iter: int = 5000,
        goal_sample_rate: float = 0.15,
        seed: int | None = None,
    ) -> list[int]:
        """RRT（快速随机扩展树）在图上的离散化实现。

        在路网图上，RRT 以节点为采样空间：
        - 每次以 goal_sample_rate 的概率直接采样目标节点，其余随机采样。
        - 从树中找到离采样点欧氏距离最近的节点，沿图中的一条邻居边扩展。
        - 当树到达目标节点时返回路径。

        注意：RRT 是概率完备但非最优的算法，路径质量不如 Dijkstra/A*，
        适合验证连通性或作为对比实验使用。
        """
        if start not in self.graph.nodes or end not in self.graph.nodes:
            return []
        if start == end:
            return [start]

        rng = random.Random(seed)
        node_ids = list(self.graph.nodes.keys())

        # tree: node_id -> parent_node_id
        tree: dict[int, int | None] = {start: None}

        def nearest_in_tree(sample: int) -> int:
            """返回树中与 sample 欧氏距离最近的节点。"""
            best_node = start
            best_dist = math.inf
            sx = self.graph.nodes[sample].x
            sy = self.graph.nodes[sample].y
            for nid in tree:
                n = self.graph.nodes[nid]
                d = math.hypot(n.x - sx, n.y - sy)
                if d < best_dist:
                    best_dist = d
                    best_node = nid
            return best_node

        for _ in range(max_iter):
            # 采样
            if rng.random() < goal_sample_rate:
                sample = end
            else:
                sample = rng.choice(node_ids)

            nearest = nearest_in_tree(sample)

            # 从 nearest 的邻居中找最接近 sample 的节点作为扩展方向
            neighbors = self.graph.neighbors(nearest)
            if not neighbors:
                continue

            sx = self.graph.nodes[sample].x
            sy = self.graph.nodes[sample].y
            best_neighbor: int | None = None
            best_dist = math.inf
            for edge in neighbors:
                nid = edge.to
                if nid in tree:
                    continue
                n = self.graph.nodes[nid]
                d = math.hypot(n.x - sx, n.y - sy)
                if d < best_dist:
                    best_dist = d
                    best_neighbor = nid

            if best_neighbor is None:
                continue

            tree[best_neighbor] = nearest

            if best_neighbor == end:
                # 回溯路径
                path = [end]
                cur: int = end
                while tree[cur] is not None:
                    cur = tree[cur]  # type: ignore[assignment]
                    path.append(cur)
                path.reverse()
                return path

        return []  # 超出最大迭代次数，未找到路径
