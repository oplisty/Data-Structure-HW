# 01 Introduction 修改审查稿

对应原文件：`paper/sec/1_intro.tex`

## 1. 原文

```latex
\section{Introduction}
\label{sec:intro}

With the rapid development of e-commerce, on-demand local delivery, and smart logistics, urban delivery systems are facing stricter timeliness requirements and more complex operational constraints. Compared with traditional fuel vehicles, new energy logistics vehicles offer advantages such as lower emissions, higher energy efficiency, and policy support, and are becoming an important part of urban delivery. However, they also introduce new challenges, including limited battery capacity, time-consuming charging, and limited charging-station resources with possible congestion, which make vehicle routing and task scheduling more difficult.

In real logistics scenarios, delivery tasks are usually not fully known in advance but arrive dynamically over time. Under constraints such as limited fleet size, vehicle load limits, continuous battery consumption, task deadlines, and charging-station queues, managers must decide in real time which vehicle should serve which task, how to plan routes, when to charge, and whether multiple vehicles should collaborate on the same task. Therefore, this is not simply a shortest-path problem, but a comprehensive problem involving graph search, resource-constrained scheduling, dynamic decision-making, and system simulation. Based on this background, we aim to design and implement a complete system platform to simulate and analyze the performance of different scheduling strategies in new energy logistics scenarios.
\subsection{Dynamic Modeling of Vehicles and Tasks}

In this project, vehicles, tasks, depots, and charging stations are modeled in a unified way at the entity level. Each vehicle includes attributes such as current location, battery level, battery capacity, maximum load capacity, current load, speed, and energy consumption per unit distance. Each task includes information such as release time, deadline, task location, cargo weight, and status. During the simulation, tasks are released dynamically as time progresses, rather than being provided to the scheduler all at once, so that the system can better reflect the online decision-making process in real delivery scenarios.

\subsection{Graph-Based Road Network and Path Planning}

This project uses graphs as the core data structure and models the road network as a weighted graph, where nodes represent road intersections, depots, task points, and charging stations, and edges represent road connections together with their distance or travel cost. For path planning, the system implements Dijkstra’s algorithm as a stable and reliable shortest-path baseline, while A* is introduced to improve goal-directed search efficiency. RRT is also included as an extended experimental algorithm to demonstrate the scalability of the system in path planning. With these algorithms, the system can support shortest-path queries, reachability checking, return-to-depot feasibility checking, and nearest charging station search.

\subsection{Reward and Charging Constraints}
This project implements a task reward calculation and overdue penalty mechanism in the simulation environment, and models each charging station as a resource node with a fixed number of chargers, occupancy status, and a waiting queue. The system not only checks whether a vehicle can complete a task and return to the depot, but also automatically triggers charging-station selection when the battery level is low. In station selection, it considers not only distance, but also queue length and station occupancy, so as to better reflect the practical complexity of new energy logistics delivery.
%-------------------------------------------------------------------------
\subsection{Scheduling, Experiments, and Visualization}
This project implements several heuristic scheduling strategies, including nearest-task-first, maximum-weight-first, and earliest-deadline-first, and supports different scenario settings such as small-scale, medium-scale, and large-scale cases. In addition, the project further explores the use of Q-learning for dynamic scheduling decisions and builds an offline MILP module to solve global plans for small-scale scenarios. Based on these components, the project also provides real-time visualization of the map, tasks, vehicles, charging stations, and statistical indicators through a web frontend, so that the system can be used not only for simulation but also for demonstration and result analysis.
\subsection{Summary}
This project adopts an overall architecture of “simulation engine + algorithm modules + real-time interface + web-based visualization frontend.” At the simulation level, the system maintains the graph-based road network, vehicle states, task states, charging station states, and the logic of time advancement. At each time step, it sequentially performs task release, task expiration checking, scheduling decisions, vehicle movement, battery consumption, charging queue management, and charging completion, forming a complete discrete-time simulation loop. At the algorithm level, path planning and task scheduling are designed as separate modules: path planning handles shortest-path search, target reachability, and energy feasibility analysis, while scheduling strategies determine dispatch actions based on visible tasks, vehicle states, and system constraints. This modular design allows different algorithms to be compared fairly in the same environment and makes future extensions easier.

To address the course requirement for advanced methods, the project further implements two extended approaches. One is a Q-learning-based hyper-heuristic strategy selection method, which learns which low-level heuristic rule should be used in different situations through discrete state encoding. The other is an MILP-based offline solver, which computes globally near-optimal routes and scheduling plans for small-scale cases under full-information settings, and compares them with the performance of online strategies. In addition, the system provides real-time visualization through frontend-backend interaction: the backend updates the environment and records logs, while the frontend displays map nodes, vehicle movements, task-state changes, charging station queues, and statistical indicators. Users can also switch scheduling strategies, replay offline solutions, and perform Q-learning training and inference through the interface, which improves both interactivity and presentation quality.
```

## 2. 原文中文翻译

随着电子商务、即时本地配送和智能物流的快速发展，城市配送系统面临更严格的时效要求和更复杂的运行约束。与传统燃油车相比，新能源物流车具有更低排放、更高能效和政策支持等优势，正在成为城市配送的重要组成部分。然而，它们也带来了新的挑战，包括有限的电池容量、耗时的充电过程，以及有限且可能拥堵的充电站资源，这些都会使车辆路径规划和任务调度更加困难。

在真实物流场景中，配送任务通常不是一开始就全部已知，而是随着时间动态到达。在有限车队规模、车辆载重限制、持续电量消耗、任务截止时间和充电站队列等约束下，管理者必须实时决定哪辆车服务哪个任务、如何规划路线、何时充电，以及多辆车是否需要协同完成同一任务。因此，这并不是一个简单的最短路问题，而是一个涉及图搜索、资源约束调度、动态决策和系统仿真的综合问题。基于这一背景，我们希望设计并实现一个完整的系统平台，用于模拟并分析新能源物流场景下不同调度策略的表现。

在本项目中，车辆、任务、仓库和充电站在实体层面被统一建模。每辆车包含当前位置、电量、电池容量、最大载重、当前载重、速度和单位距离能耗等属性。每个任务包含释放时间、截止时间、任务位置、货物重量和状态等信息。在仿真过程中，任务会随着时间推进动态释放，而不是一次性全部交给调度器，从而更好地反映真实配送场景中的在线决策过程。

本项目使用图作为核心数据结构，将道路网络建模为加权图，其中节点表示道路交叉口、仓库、任务点和充电站，边表示道路连接及其距离或通行代价。对于路径规划，系统实现了 Dijkstra 算法作为稳定可靠的最短路基线，同时引入 A* 以提高面向目标搜索的效率。RRT 也作为扩展实验算法被加入，用于展示系统在路径规划方面的可扩展性。通过这些算法，系统可以支持最短路查询、可达性检查、返回仓库可行性检查和最近充电站搜索。

本项目在仿真环境中实现了任务奖励计算和超时惩罚机制，并将每个充电站建模为具有固定充电桩数量、占用状态和等待队列的资源节点。系统不仅检查车辆是否能完成任务并返回仓库，也会在电量较低时自动触发充电站选择。在充电站选择中，系统不仅考虑距离，也考虑队列长度和站点占用情况，以更好地反映新能源物流配送的实际复杂性。

本项目实现了多种启发式调度策略，包括最近任务优先、最大重量优先和最早截止时间优先，并支持小规模、中规模和大规模等不同场景设置。此外，项目进一步探索了 Q-learning 在动态调度决策中的使用，并构建了离线 MILP 模块，用于在小规模场景下求解全局计划。基于这些组件，项目还通过网页前端提供地图、任务、车辆、充电站和统计指标的实时可视化，使系统不仅能用于仿真，也能用于展示和结果分析。

本项目采用“仿真引擎 + 算法模块 + 实时接口 + 网页可视化前端”的整体架构。在仿真层面，系统维护基于图的道路网络、车辆状态、任务状态、充电站状态和时间推进逻辑。在每个时间步，系统依次执行任务释放、任务过期检查、调度决策、车辆移动、电量消耗、充电队列管理和充电完成，形成完整的离散时间仿真闭环。在算法层面，路径规划和任务调度被设计为独立模块：路径规划负责最短路搜索、目标可达性和电量可行性分析；调度策略则基于可见任务、车辆状态和系统约束决定派车动作。这种模块化设计使不同算法能够在同一环境中公平比较，也便于未来扩展。

为了满足课程对高级方法的要求，项目进一步实现了两种扩展方法。一种是基于 Q-learning 的超启发式策略选择方法，它通过离散状态编码学习在不同情况下应该使用哪种低层启发式规则。另一种是基于 MILP 的离线求解器，它在完整信息设置下为小规模场景计算全局近似最优路径和调度计划，并与在线策略的表现进行比较。此外，系统通过前后端交互提供实时可视化：后端更新环境并记录日志，前端显示地图节点、车辆移动、任务状态变化、充电站队列和统计指标。用户还可以通过界面切换调度策略、回放离线解，以及执行 Q-learning 训练和推理，从而提升系统的交互性和展示质量。

## 3. 建议修改稿

```latex
\section{Introduction}
\label{sec:intro}

With the growth of e-commerce and instant delivery, urban logistics systems are required to finish more tasks within shorter time windows. New energy logistics vehicles are attractive because of their low emissions and low operating cost, but they also bring additional constraints. A vehicle may not have enough battery to serve a distant task, charging takes time, charging stations may be occupied, and tasks may expire if they are not completed before their deadlines.

The goal of this project is not to solve one static route. Instead, the project focuses on a repeated online decision process: tasks appear over time, vehicles choose feasible actions, and the simulator records how different strategies perform under the same environment.

To make the simulation closer to a real scheduling process, we model more than vehicle positions and path length. Each vehicle keeps its battery level, load capacity, current status, and energy consumption rate. Each task has a release time, location, cargo weight, deadline, and completion state. Charging stations are treated as limited resources with occupied chargers and waiting queues. These details make the scheduler consider not only which task is close, but also whether the vehicle can reach it, finish it before the deadline, and recover battery when needed.

The implemented work can be grouped into three parts:
\begin{itemize}
    \item \textbf{Environment modeling:} graph road network, depot, task nodes, vehicles, battery states, load limits, task deadlines, charging queues, and random scenario generation for different scales.
    \item \textbf{Scheduling algorithms:} Dijkstra and A* are used for path queries, RRT is kept as an extensible planning module, and Nearest/EDF/Heaviest are implemented as fixed baselines. On top of these baselines, we add two advanced modules: a Q-learning based hyper-heuristic for adaptive rule selection, and an MILP offline solver that provides a global-planning reference for small-scale full-information cases.
    \item \textbf{System interface:} backend simulation control, event recording, strategy switching, Q-learning training/inference support, and frontend visualization for vehicles, tasks, charging stations, movement traces, queues, and result comparison.
\end{itemize}
```

## 4. 修改稿中文翻译

随着电商和即时配送的发展，城市物流系统需要在更短的时间窗口内完成更多任务。新能源物流车具有低排放和低运行成本的优势，但也带来了额外约束。车辆可能没有足够电量完成较远任务，充电需要时间，充电站可能被占用，任务如果没有在截止时间前完成就可能过期。

本项目的目标不是求解一条静态路线，而是关注一个反复发生的在线决策过程：任务随着时间出现，车辆选择可行动作，仿真器记录不同策略在同一环境下的表现。

为了让仿真过程更接近真实调度，我们建模的不只是车辆位置和路径长度。每辆车都会记录电量、载重能力、当前状态和单位距离能耗。每个任务包含释放时间、位置、货物重量、截止时间和完成状态。充电站则被视为有限资源，包含已占用充电桩和等待队列。这些细节使调度器不能只考虑哪个任务最近，还需要判断车辆是否能到达任务点、是否能在截止时间前完成，以及是否需要在合适时间补电。

本项目实现的工作可以分为三类。第一是环境建模，包括图结构道路网络、仓库、任务节点、车辆、电量状态、载重限制、任务截止时间、充电队列，以及不同规模随机场景生成。第二是调度算法，Dijkstra 和 A* 用于路径查询，RRT 作为可扩展规划模块保留，Nearest/EDF/Heaviest 作为固定 baseline。在这些 baseline 之上，我们还加入了两个高级模块：基于 Q-learning 的超启发式方法用于自适应规则选择，MILP 离线求解器用于在小规模完整信息场景下提供更偏全局规划的参考结果。第三是系统界面，包括后端仿真控制、事件记录、策略切换、Q-learning 训练/推理支持，以及前端对车辆、任务、充电站、移动轨迹、队列和结果对比的可视化。
## 5. 修改意图

- 大幅压缩 Introduction，减少背景铺垫和重复介绍。
- 删除第二段中的具体 simulation step，把“每一步怎么跑”留给 Framework。
- 删除原文中偏散的多个 subsection，让 Introduction 更像“问题 + 项目目标 + 完成功能”。
- 把重点从“论文贡献”调整为“大作业系统展示”。
- 在项目目标后补充车辆、任务和充电站的建模细节，体现实现工作量，但不展开完整仿真流程。
- 将功能列表改成三组，并细化到随机场景生成、事件记录、Q-learning 训练/推理等实现内容，避免显得过薄。
- 把 Q-learning 超启发式和 MILP 离线求解合并进算法功能组里强调，体现进阶工作量，同时避免重复段落。
- 保留系统亮点：图建模、路径规划、电量/充电约束、在线调度、Q-learning、MILP、前端可视化。
- 避免在引言里过早展开太多算法细节，把详细说明留到 Framework / Method。
