from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from enum import Enum


class TaskStatus(str, Enum):
    """任务生命周期状态枚举。

    FUTURE   : 任务尚未到达释放时间，不可被调度。
    PENDING  : 任务已释放，等待被分配给车辆。
    ASSIGNED : 任务已分配给一辆或多辆车辆（协同模式下可多辆）。
    COMPLETED: 任务已完成全部配送。
    EXPIRED  : 任务超过截止时间仍未完成，视为过期失效。
    """
    FUTURE = "future"
    PENDING = "pending"
    ASSIGNED = "assigned"
    COMPLETED = "completed"
    EXPIRED = "expired"


class VehicleStatus(str, Enum):
    """车辆运行状态枚举。

    IDLE             : 车辆空闲，可接受新任务分配。
    MOVING_TO_TASK   : 车辆正在前往任务地点途中。
    MOVING_TO_DEPOT  : 车辆正在返回配送站途中。
    MOVING_TO_CHARGE : 车辆正在前往充电站途中。
    WAITING_CHARGE   : 车辆已到达充电站，等待充电桩空闲。
    CHARGING         : 车辆正在充电中。
    """
    IDLE = "idle"
    MOVING_TO_TASK = "moving_to_task"
    MOVING_TO_DEPOT = "moving_to_depot"
    MOVING_TO_CHARGE = "moving_to_charge"
    WAITING_CHARGE = "waiting_charge"
    CHARGING = "charging"


@dataclass(slots=True)
class Task:
    """配送任务实体。

    记录单次配送任务的全生命周期信息，支持单车配送与协同配送两种模式。
    协同配送时多辆车共同承担 weight，每辆车分别记录各自派送的货物重量。
    """

    id: int                          # 任务唯一 ID
    release_time: int                # 任务释放时间（仿真步），到达后才可被调度
    deadline: int                    # 任务截止时间（仿真步），超时则过期
    origin_node: int                 # 任务所在路网节点 ID
    weight: float                    # 货物总重量（kg）
    status: TaskStatus = TaskStatus.FUTURE   # 当前任务状态，初始为 FUTURE
    collaborative: bool = False      # 是否为协同任务（需多车共同配送）
    delivered_weight: float = 0.0   # 已配送货物重量（kg），累计值
    assigned_vehicles: dict[int, float] = field(default_factory=dict)      # {车辆ID: 分配货重}，当前在途车辆
    delivered_by_vehicle: dict[int, float] = field(default_factory=dict)   # {车辆ID: 已送货重}，历史记录
    assigned_vehicle: int | None = None          # 单车模式下的负责车辆 ID（协同模式为 None）
    assigned_from_node: int | None = None        # 首次分配时车辆所在节点
    assigned_time: int | None = None             # 首次分配时的仿真步
    assigned_vehicle_distance: float | None = None  # 首次分配时车辆累计行驶距离（用于统计）
    service_distance: float = 0.0   # 本任务产生的总服务行驶距离（km，累计）
    service_duration: int = 0        # 从首次分配到完成/过期的耗时（仿真步）
    complete_time: int | None = None # 任务完成或过期的仿真步

    def mark_released(self) -> None:
        """将任务状态置为 PENDING，表示任务已释放可被调度。"""
        self.status = TaskStatus.PENDING

    def mark_assigned(
        self,
        vehicle_id: int,
        from_node: int,
        time_now: int,
        vehicle_distance: float,
        assigned_load: float | None = None,
        collaborative: bool = False,
    ) -> None:
        """分配车辆到任务（外部调度器调用入口）。

        Args:
            vehicle_id:       被分配的车辆 ID。
            from_node:        车辆当前所在节点。
            time_now:         当前仿真步。
            vehicle_distance: 车辆当前累计行驶距离。
            assigned_load:    本次分配的货重；为 None 时默认使用任务总重量。
            collaborative:    是否以协同模式分配。
        """
        load = self.weight if assigned_load is None else assigned_load
        self.assign_vehicle(
            vehicle_id=vehicle_id,
            assigned_load=load,
            from_node=from_node,
            time_now=time_now,
            vehicle_distance=vehicle_distance,
            collaborative=collaborative,
        )

    @property
    def remaining_weight(self) -> float:
        """剩余待配送货物重量（kg），不小于 0。"""
        return max(0.0, self.weight - self.delivered_weight)

    def assign_vehicle(
        self,
        vehicle_id: int,
        assigned_load: float,
        from_node: int,
        time_now: int,
        vehicle_distance: float,
        collaborative: bool,
    ) -> None:
        """内部方法：将车辆登记到任务，更新首次分配元数据。

        - 若任务已有首次分配记录，则不覆盖 assigned_time 等字段。
        - 协同模式下 assigned_vehicle 置为 None（无单一负责车辆）。
        """
        self.status = TaskStatus.ASSIGNED
        self.collaborative = self.collaborative or collaborative
        self.assigned_vehicles[vehicle_id] = assigned_load
        # 仅记录首次分配的元信息
        if self.assigned_time is None:
            self.assigned_time = time_now
            self.assigned_from_node = from_node
            self.assigned_vehicle_distance = vehicle_distance
        # 协同模式不绑定单一车辆
        if not self.collaborative:
            self.assigned_vehicle = vehicle_id
        else:
            self.assigned_vehicle = None

    def record_delivery(
        self,
        vehicle_id: int,
        delivered_load: float,
        trip_distance: float,
        time_now: int,
    ) -> None:
        """记录一次部分或完整配送结果，更新累计统计字段。

        Args:
            vehicle_id:      完成本次配送的车辆 ID。
            delivered_load:  本次实际送达的货物重量（kg）。
            trip_distance:   本次行程距离（km）。
            time_now:        当前仿真步，用于更新 service_duration。
        """
        if delivered_load > 0:
            self.delivered_weight += delivered_load
            self.delivered_by_vehicle[vehicle_id] = self.delivered_by_vehicle.get(vehicle_id, 0.0) + delivered_load
        self.service_distance += max(0.0, trip_distance)
        self.assigned_vehicles.pop(vehicle_id, None)
        if self.assigned_time is not None:
            self.service_duration = max(0, time_now - self.assigned_time)

    def mark_completed(self, time_now: int, service_distance: float = 0.0) -> None:
        """将任务标记为已完成，并修正统计字段。

        Args:
            time_now:         完成时的仿真步。
            service_distance: 若提供正值，则覆盖当前 service_distance。
        """
        self.status = TaskStatus.COMPLETED
        self.complete_time = time_now
        self.delivered_weight = max(self.delivered_weight, self.weight)
        if service_distance > 0:
            self.service_distance = max(0.0, service_distance)
        if self.assigned_time is not None:
            self.service_duration = max(0, time_now - self.assigned_time)

    def mark_expired(self, time_now: int) -> None:
        """将任务标记为过期（超出 deadline 仍未完成）。"""
        self.status = TaskStatus.EXPIRED
        self.complete_time = time_now


@dataclass(slots=True)
class Vehicle:
    """配送车辆实体（电动车模型）。

    维护车辆的实时状态、行驶路径、电量和任务分配信息。
    仿真每步通过 simulation.py 驱动车辆沿 route 移动并消耗电量。
    """

    # ---- 基本属性（构造时必填）----
    id: int                   # 车辆唯一 ID
    vehicle_type: str         # 车辆类型标识（如 "panyu_ev"）
    current_node: int         # 当前所在路网节点 ID
    battery: float            # 当前剩余电量（kWh）
    battery_capacity: float   # 电池满容量（kWh）
    load_capacity: float      # 最大载货量（kg）
    speed: float              # 行驶速度（km/仿真步）
    energy_per_km: float      # 每公里耗电量（kWh/km）

    # ---- 运行状态 ----
    status: VehicleStatus = VehicleStatus.IDLE  # 当前运行状态
    assigned_task: int | None = None            # 当前分配的任务 ID（无任务时为 None）
    task_load: float = 0.0                      # 本次任务承担的货物重量（kg）
    task_start_distance: float | None = None    # 接任务时的累计行驶距离，用于计算单次行程距离

    # ---- 路径规划 ----
    route: list[int] = field(default_factory=list)  # 当前行驶路径（节点 ID 列表，含起终点）
    route_index: int = 0                             # 当前已完成的路径段索引
    distance_to_next: float = 0.0                   # 当前路段已行驶距离（km）

    # ---- 目标与充电意图 ----
    target_node: int | None = None              # 当前路径的目标节点 ID
    target_station: int | None = None           # 目标充电站 ID（充电相关状态下有效）
    resume_status: VehicleStatus | None = None  # 充电完成后需恢复的状态
    resume_target_node: int | None = None       # 充电完成后需前往的节点

    # ---- 累计统计 ----
    total_distance: float = 0.0  # 仿真全程累计行驶距离（km）
    total_score: float = 0.0     # 仿真全程累计得分

    def is_idle(self) -> bool:
        """判断车辆是否真正空闲（状态为 IDLE 且无已分配任务）。"""
        return self.status == VehicleStatus.IDLE and self.assigned_task is None

    def plan_route(self, route: list[int], target_node: int, status: VehicleStatus) -> None:
        """设置新的行驶路径并切换状态。

        Args:
            route:       完整路径节点列表（至少包含起点和终点）。
            target_node: 路径终点节点 ID。
            status:      切换到的目标运行状态。
        """
        if len(route) < 2:
            raise ValueError("Route must contain at least start and target node")
        self.route = route
        self.route_index = 0
        self.distance_to_next = 0.0
        self.target_node = target_node
        self.status = status

    def assign_task(self, task_id: int, route: list[int], target_node: int, task_load: float) -> None:
        """接受任务分配并规划前往任务地点的路径。

        Args:
            task_id:     任务 ID。
            route:       前往任务地点的完整路径。
            target_node: 任务所在节点 ID。
            task_load:   本次承担的货物重量（kg）。
        """
        self.assigned_task = task_id
        self.task_load = max(0.0, task_load)
        self.task_start_distance = self.total_distance
        self.plan_route(route=route, target_node=target_node, status=VehicleStatus.MOVING_TO_TASK)

    def clear_route(self) -> None:
        """清空当前路径信息（到达目的地或中断行程时调用）。"""
        self.route = []
        self.route_index = 0
        self.distance_to_next = 0.0
        self.target_node = None

    def start_waiting_charge(self, station_id: int) -> None:
        """到达充电站后进入等待充电状态（充电桩被占用时）。"""
        self.clear_route()
        self.target_station = station_id
        self.status = VehicleStatus.WAITING_CHARGE

    def start_charging(self, station_id: int) -> None:
        """获得充电桩，开始充电。"""
        self.target_station = station_id
        self.status = VehicleStatus.CHARGING

    def finish_charging(self) -> None:
        """充电完成，清除充电站记录并恢复为空闲状态。"""
        self.target_station = None
        self.status = VehicleStatus.IDLE

    def set_resume_intent(self, status: VehicleStatus, target_node: int) -> None:
        """在去充电前保存中断状态，充电完成后可据此恢复行程。

        Args:
            status:      充电完成后应恢复的运行状态。
            target_node: 充电完成后应前往的目标节点。
        """
        self.resume_status = status
        self.resume_target_node = target_node

    def clear_resume_intent(self) -> None:
        """清除充电后的恢复意图（已使用或放弃时调用）。"""
        self.resume_status = None
        self.resume_target_node = None

    def clear_task_assignment(self) -> None:
        """清除任务分配记录（任务完成或取消时调用）。"""
        self.assigned_task = None
        self.task_load = 0.0
        self.task_start_distance = None


@dataclass(slots=True)
class ChargingStation:
    id: int
    node_id: int
    num_piles: int
    charge_rate: float

    queue: deque[int] = field(default_factory=deque)
    charging_slots: list[int | None] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.charging_slots:
            self.charging_slots = [None for _ in range(self.num_piles)]

    @property
    def queue_length(self) -> int:
        return len(self.queue)

    @property
    def occupied_piles(self) -> int:
        return sum(1 for v in self.charging_slots if v is not None)

    def enqueue(self, vehicle_id: int) -> None:
        if vehicle_id not in self.queue and vehicle_id not in self.charging_slots:
            self.queue.append(vehicle_id)


@dataclass(slots=True)
class Depot:
    id: int
    node_id: int
