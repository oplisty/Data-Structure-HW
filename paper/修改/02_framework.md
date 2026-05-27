# 02 Framework 修改审查稿

对应原文件：`paper/sec/2_formatting.tex`

## 1. 原文

```latex
\section{Framework}
\label{sec:framework}

\begin{figure*}[t]
  \centering
  \includegraphics[width=\textwidth]{figure/framework.pdf}
  \caption{Overall framework of the dynamic collaborative scheduling system for new energy logistics fleets. The figure illustrates the relationships among the visualization frontend, backend service layer, simulation engine, scheduling strategies, path planning algorithms, and data resources.}
  \label{fig:framework_overview}
\end{figure*}

This paper designs a layered system architecture for the dynamic collaborative scheduling of new energy logistics fleets. Overall, the system can be divided into five core layers from bottom to top: the data resource layer, the algorithm layer, the simulation engine layer, the backend service layer, and the frontend visualization layer. Although each layer is relatively independent, they are connected through unified data interfaces and state transition logic to form a complete closed loop. This layered design has two main advantages. First, it decouples functions such as road modeling, path planning, scheduling decision-making, simulation execution, and interface presentation, thereby reducing overall system complexity. Second, it allows different path planning algorithms, scheduling strategies, and optimization methods to be flexibly replaced and compared within the same framework, which not only meets the implementation requirements of a course project but also supports further research and future extensions.

\subsection{Data Layer}
The data resource layer provides a unified representation of the environment for the whole system and serves as the foundation for subsequent path planning, task scheduling, and state simulation. To satisfy the course requirement of using a graph structure for road representation and routing, this paper first models the urban delivery scenario as a weighted directed graph
\[
G=(V,E,W),
\]
where the node set \(V\) represents road intersections, depots, candidate task locations, and charging stations; the edge set \(E\subseteq V\times V\) represents road connectivity; and the weight function \(W:E\rightarrow \mathbb{R}^{+}\) describes the distance or travel cost of each edge. Based on this representation, the entire logistics environment can be mapped into a discrete graph space, which provides a computable foundation for shortest-path search, reachability analysis, and energy consumption evaluation.

In the implementation, the system denotes the depot as node \(v_d\in V\), the set of charging stations as
\[
S=\{s_1,s_2,\dots,s_m\}\subseteq V,
\]
and generates dynamic tasks from the candidate task node set \(V_T\subseteq V\). For any task \(\tau_i\), it can be represented as the following four-tuple:
\[
\tau_i=(r_i,\, v_i,\, w_i,\, d_i),
\]
where \(r_i\) is the release time of the task, \(v_i\in V_T\) is the task location, \(w_i\) is the cargo weight, and \(d_i\) is the deadline.

Furthermore, the data resource layer maintains the static parameter sets of vehicles and stations. For example, for vehicle \(k\), its state parameters can be defined as
\[
\mathbf{x}_k=(b_k^{\max},\, b_k,\, c_k,\, v_k^{\text{cur}},\, \eta_k),
\]
where \(b_k^{\max}\) and \(b_k\) denote the maximum battery level and current battery level, respectively; \(c_k\) is the load capacity limit; \(v_k^{\text{cur}}\) is the current node location; and \(\eta_k\) is the energy consumption per unit distance.

\subsection{Algorithm Layer}
After the data resource layer completes the formal representation of the environment, the algorithm layer is further responsible for generating executable routing and scheduling decisions on the graph-based road network \(G=(V,E,W)\). In this paper, this layer is divided into two closely coupled basic modules: the path planning module and the task scheduling module.

\subsubsection{Path Planning}
For any vehicle \(k\) and target node \(v\in V\), the goal of the path planning module is to find a feasible path \(P_k(v_k^{\text{cur}}, v)\) on graph \(G\) from the current location \(v_k^{\text{cur}}\) to the target node \(v\). The system implements three path planning baselines: Dijkstra, A*, and RRT. In the new energy delivery scenario, path planning is not only used for travel from the current node to a task node, but also needs to support feasibility checking for returning to the depot after task completion and visiting a charging station when the battery is low. The energy consumption along path \(P\) can be approximately written as
\[
E_k(P)=\eta_k\, C(P).
\]

\subsubsection{Task Scheduling}
After feasible paths are obtained, the scheduling module further determines which task should be assigned to which vehicle. For the currently visible task set \(\mathcal{T}_t\) and the current state \(\mathbf{x}_k\) of vehicle \(k\), a baseline scheduling strategy essentially defines a priority score function \(\phi_k(\tau_i)\) over all candidate tasks. The system implements nearest-task-first, maximum-weight-first, and earliest-deadline-first. Beyond the above baselines, we further implement an online reinforcement learning policy selection module based on Q-learning, as well as an offline global optimization module based on MILP under full information.

\subsection{Simulation Layer}
The simulation engine layer is responsible for transforming the static environment defined in the data resource layer and the scheduling actions produced by the algorithm layer into an executable time-based process. It explicitly models state variables that evolve over time, including task release, vehicle movement, battery consumption, charging queues, and task completion. The simulation engine can be formalized as a state transition process:
\[
\mathcal{S}_{t+1} = \Phi(\mathcal{S}_t, \mathcal{A}_t).
\]

\subsection{Frontend and Backend}
The frontend layer and the backend layer do not directly participate in path planning or scheduling optimization itself. Instead, they are responsible for organizing the states, events, and statistical results inside the simulation engine into external representations that are accessible, replayable, and analyzable. The backend uses FastAPI and WebSocket to expose vehicle positions, task states, charging-station load, accumulated score, and event logs. The frontend visualization module displays the road network, depots, task nodes, charging stations, vehicles, key indicators, policy switching, offline replay, training triggering, and result comparison.
```

## 2. 原文中文翻译

本文为新能源物流车队动态协同调度设计了一个分层系统架构。总体上，系统可以自底向上分为五个核心层：数据资源层、算法层、仿真引擎层、后端服务层和前端可视化层。虽然各层相对独立，但它们通过统一的数据接口和状态转移逻辑连接起来，形成完整闭环。这种分层设计有两个优点：一是解耦道路建模、路径规划、调度决策、仿真执行和界面展示等功能，从而降低系统复杂度；二是允许不同路径规划算法、调度策略和优化方法在同一框架下灵活替换和比较，既满足课程项目实现要求，也支持未来扩展。

数据资源层为整个系统提供统一的环境表示，是后续路径规划、任务调度和状态仿真的基础。为了满足课程中使用图结构表示道路和路径规划的要求，本文首先将城市配送场景建模为加权有向图 \(G=(V,E,W)\)。其中节点集合 \(V\) 表示道路交叉口、仓库、候选任务位置和充电站；边集合 \(E\) 表示道路连通关系；权重函数 \(W\) 描述每条边的距离或通行代价。基于该表示，整个物流环境可以映射到离散图空间中，为最短路搜索、可达性分析和能耗评估提供可计算基础。

在实现中，系统用 \(v_d\) 表示仓库节点，用 \(S\) 表示充电站集合，并从候选任务节点集合 \(V_T\) 中生成动态任务。任意任务 \(\tau_i\) 可以表示为四元组 \((r_i,v_i,w_i,d_i)\)，分别表示任务释放时间、任务位置、货物重量和截止时间。数据层还维护车辆和充电站的静态参数，例如车辆最大电量、当前电量、载重限制、当前位置和单位距离能耗。

算法层负责在图结构道路网络上生成可执行的路径和调度决策。该层包含路径规划模块和任务调度模块。路径规划模块为车辆和目标节点寻找可行路径，系统实现了 Dijkstra、A* 和 RRT。对于新能源配送，路径规划不仅用于从当前位置到任务点，也用于判断完成任务后能否返回仓库，以及低电量时能否到达充电站。路径能耗可以用单位距离能耗乘以路径代价估计。

任务调度模块在可行路径获得后决定哪辆车执行哪个任务。系统实现了最近任务优先、最大重量优先和最早截止时间优先。除此之外，系统还实现了基于 Q-learning 的在线策略选择模块，以及完整信息下基于 MILP 的离线全局优化模块。

仿真引擎层负责将数据层定义的静态环境和算法层生成的调度动作转化为可执行的时间过程。它显式建模随时间变化的状态变量，包括任务释放、车辆移动、电量消耗、充电队列和任务完成。仿真引擎可以形式化为状态转移过程 \(\mathcal{S}_{t+1} = \Phi(\mathcal{S}_t,\mathcal{A}_t)\)。

前端和后端不直接参与路径规划或调度优化，而是负责将仿真引擎中的状态、事件和统计结果组织成外部可访问、可回放、可分析的形式。后端使用 FastAPI 和 WebSocket 暴露车辆位置、任务状态、充电站负载、累计得分和事件日志。前端可视化模块展示道路网络、仓库、任务节点、充电站、车辆、关键指标、策略切换、离线回放、训练触发和结果比较。

## 3. 建议修改稿

```latex
\section{System Framework}
\label{sec:framework}

\begin{figure*}[t]
  \centering
  \includegraphics[width=\textwidth]{figure/framework.pdf}
  \caption{Overall framework of the dynamic collaborative scheduling system for new energy logistics fleets. The figure illustrates the relationships among the visualization frontend, backend service layer, simulation engine, scheduling strategies, path planning algorithms, and data resources.}
  \label{fig:framework_overview}
\end{figure*}

Figure~\ref{fig:framework_overview} shows how the system runs. Instead of testing each algorithm separately, we put all strategies into the same simulation loop. At each step, the simulator releases tasks, updates vehicle states, checks path and battery feasibility, assigns tasks, executes movement or charging, and records statistics. The main modules behind this loop are graph-based environment data, path planning and scheduling algorithms, the simulation engine, backend services, and frontend visualization.

\subsection{Overall Running Process}

The complete simulation loop can be summarized as
\[
\text{Task Release}
\rightarrow
\text{Vehicle State Update}
\rightarrow
\text{Feasibility Check}
\rightarrow
\text{Scheduling Decision}
\rightarrow
\text{Movement / Service / Charging}
\rightarrow
\text{Statistics Update}.
\]

At each time step, the simulator releases new tasks, updates vehicle states, checks path and battery feasibility, assigns tasks to available vehicles, and then executes movement, service, return, or charging. After execution, it updates completed tasks, expired tasks, score, travel distance, and charging queue statistics.

\subsection{Graph-based Environment Modeling}

The road network is represented as a weighted graph
\[
G=(\mathcal{N},\mathcal{E},W),
\]
where \(\mathcal{N}\) is the set of road nodes, depots, task locations, and charging stations, \(\mathcal{E}\) is the set of road connections, and \(W\) gives the travel distance or cost of each edge. This graph is the basic data structure used by the whole system. It supports shortest-path search, reachability checking, energy consumption estimation, and charging-station selection.

The simulator supports two types of map data. For controlled experiments, we use randomly generated graph scenarios with different numbers of nodes, vehicles, tasks, and charging stations. These scenarios are used for fair comparison among scheduling strategies. Besides random graphs, the codebase also includes a processed Guangzhou Panyu road-network scenario based on Guangdong Province OSM data. We extract the Panyu region as an independent map block and convert the road topology into a weighted graph. In this graph, road points and intersections are treated as nodes, road segments are treated as weighted edges, and charging stations are loaded as resource nodes. In the processed metadata, the Panyu map contains 131,276 nodes, 142,593 edges, and 57 charging stations. This allows the same path-planning, scheduling, backend, and frontend pipeline to run on a real urban road network.

A task \(\tau_i\) is represented by its release time, location, cargo weight, and deadline:
\[
\tau_i=(r_i,n_i,w_i,D_i).
\]
For each vehicle, the system records its current node, battery level, battery capacity, load capacity, speed, and energy consumption rate. Charging stations are modeled as resource nodes with limited chargers, charging rates, occupied chargers, and waiting queues.

\subsection{Path Planning and Scheduling Modules}

The path planning module computes graph paths for vehicle movement and feasibility checking. Dijkstra is used as the stable shortest-path baseline, A* is used for goal-directed search with heuristic guidance, and RRT is kept as an extensible path-planning interface. For a path \(P\), the battery consumption of vehicle \(k\) is estimated by
\[
E_k(P)=\eta_k C(P),
\]
where \(\eta_k\) is the energy consumption per unit distance and \(C(P)\) is the path cost.

After feasible paths are generated, the scheduling module assigns visible tasks to available vehicles. We keep three fixed heuristic baselines for comparison: nearest-task-first selects the task with the smallest path cost, earliest-deadline-first gives priority to urgent tasks, and maximum-weight-first gives priority to tasks with larger cargo weight.

\begin{table}[htbp]
\centering
\caption{Roles of algorithms and strategies in the system.}
\label{tab:algorithm_roles}
\resizebox{\linewidth}{!}{
\begin{tabular}{ll}
\toprule
Algorithm / Strategy & Role in the system \\
\midrule
Dijkstra & shortest-path computation and stable routing baseline \\
A* & goal-directed path search with heuristic acceleration \\
RRT & extensible path-planning interface for future scenarios \\
Nearest & selects the nearest task to reduce distance and energy cost \\
EDF & selects the task with the earliest deadline \\
Heaviest & selects the task with the largest cargo weight \\
Q-learning & selects a suitable dispatching rule under the current state \\
MILP & provides a small-scale offline full-information reference \\
\bottomrule
\end{tabular}}
\end{table}

\subsection{Q-learning Strategy Selection}

For adaptive scheduling, we add a Q-learning based hyper-heuristic. It does not directly control the detailed route of each vehicle. Instead, it selects which dispatching rule should be used under the current system state. The state includes coarse information such as task backlog, deadline urgency, average battery level, idle vehicle ratio, and charging queue load. The action is the choice of a low-level rule such as Nearest, EDF, Heaviest, or a score-based rule. The reward is related to task completion, travel cost, overdue penalty, and charging or waiting cost.

The Q-table is updated by
\[
Q(s_t,a_t)\leftarrow Q(s_t,a_t)+\alpha
\left[
r_t+\gamma\max_{a'}Q(s_{t+1},a')-Q(s_t,a_t)
\right],
\]
where \(\alpha\) is the learning rate, \(\gamma\) is the discount factor, and \(r_t\) is the immediate reward. After training, the learned Q-table is used to select dispatching rules during simulation.

\subsection{Offline MILP Reference}

The MILP module is implemented as an offline reference for small-scale full-information cases. It is not the main online scheduling method, because online tasks arrive dynamically and future task information is usually unavailable. However, MILP helps compare online strategies with a more globally planned solution and shows how the scheduling problem can be formulated from an optimization perspective.

\subsection{Backend and Frontend Visualization}

The backend packages simulation states and exposes them to the frontend through service interfaces. It maintains information such as vehicle positions, task states, charging-station load, accumulated score, and event logs. It also provides controls for starting, pausing, replaying, switching strategies, training Q-learning, and running offline planning.

The frontend visualizes the graph map, depots, vehicles, tasks, charging stations, movement process, queues, and statistics. This makes the system easier to debug and present. More importantly, it turns the scheduling algorithms from isolated code modules into an observable workflow, so that different strategies can be compared visually and quantitatively.
```

## 4. 修改稿中文翻译

图~\ref{fig:framework_overview} 展示了系统如何运行。我们不是把每个算法分开测试，而是把所有策略放进同一个仿真循环中。每一步中，仿真器释放任务、更新车辆状态、检查路径和电量可行性、分配任务、执行移动或充电，并记录统计信息。支撑这个循环的主要模块包括图结构环境数据、路径规划与调度算法、仿真引擎、后端服务和前端可视化。

完整的仿真循环可以概括为：任务释放、车辆状态更新、可行性检查、调度决策、移动/服务/充电、统计更新。在每个时间步中，仿真器释放新任务、更新车辆状态、检查路径和电量可行性、为可用车辆分配任务，然后执行移动、服务、返回或充电。执行后，系统更新完成任务、过期任务、得分、行驶距离和充电队列统计。

道路网络表示为加权图 \(G=(\mathcal{N},\mathcal{E},W)\)。其中 \(\mathcal{N}\) 是道路节点、仓库、任务位置和充电站集合，\(\mathcal{E}\) 是道路连接集合，\(W\) 表示每条边的距离或代价。该图是整个系统使用的基础数据结构，支持最短路搜索、可达性检查、能耗估计和充电站选择。

仿真器支持两类地图数据。对于可控实验，我们使用随机生成的图场景，并设置不同数量的节点、车辆、任务和充电站，用于公平比较调度策略。除了随机图，代码库还包含一个基于广东省 OSM 数据处理得到的广州番禺道路网络场景。我们将番禺区域提取为独立地图块，并把道路拓扑转换为加权图。在这个图中，道路点和交叉口作为节点，道路片段作为带权边，充电站作为资源节点加载。处理后的元数据中，番禺地图包含 131,276 个节点、142,593 条边和 57 个充电站。这使同一套路径规划、调度、后端和前端流程也可以运行在真实城市道路网络上。

路径规划模块为车辆移动和可行性检查计算图路径。Dijkstra 用作稳定的最短路基线，A* 用于带启发式引导的目标搜索，RRT 作为未来场景的可扩展路径规划接口。对于路径 \(P\)，车辆 \(k\) 的电量消耗由 \(E_k(P)=\eta_k C(P)\) 估计。可行路径生成后，调度模块为可见任务和可用车辆进行分配。系统实现了三个固定启发式基线：Nearest 选择路径代价最小的任务，EDF 优先选择最紧急任务，Heaviest 优先选择货物重量较大的任务。

为了支持自适应调度，我们加入了基于 Q-learning 的超启发式方法。它不直接控制每辆车的具体路线，而是在当前系统状态下选择应该使用哪种调度规则。状态包括任务积压、deadline 紧急程度、平均电量、空闲车辆比例和充电队列负载等粗粒度信息。动作是选择某个低层规则，例如 Nearest、EDF、Heaviest 或基于得分的规则。奖励与任务完成、行驶成本、超时惩罚以及充电/等待成本有关。训练完成后，学习得到的 Q-table 会在仿真中用于选择调度规则。

MILP 模块作为小规模完整信息场景下的离线参考。它不是主要在线调度方法，因为在线任务动态到达，未来任务信息通常不可知。但 MILP 可以帮助将在线策略与更全局的规划解进行比较，并展示该调度问题如何从优化角度建模。

后端负责打包仿真状态并通过服务接口暴露给前端。它维护车辆位置、任务状态、充电站负载、累计得分和事件日志等信息，并提供开始、暂停、回放、策略切换、Q-learning 训练和离线规划等控制。前端则可视化图地图、仓库、车辆、任务、充电站、移动过程、队列和统计数据。这样，调度算法不再只是孤立代码模块，而变成了可以观察、展示和比较的工作流。

## 5. 修改意图

- 把 section 标题从 `Framework` 改为更清楚的 `System Framework`。
- 保留原有框架图、图片引用和伪代码内容不变，只调整周围文字说明和章节组织。
- 在开头加入图和流程导向的说明，避免 `This section explains...` 这种模板导航句。
- 压缩 Overall Running Process 的解释段，避免和 Introduction 重复。
- 减少过重公式，把图建模、可行性、电量和调度逻辑讲得更直接。
- 在 Graph-based Environment Modeling 中补充随机图和番禺 OSM 图两类地图来源，明确番禺属于真实路网支持，不是主实验小节。
- 加入“算法/策略在系统中的作用”表格，降低阅读成本。
- Q-learning 保留较专业的公式和 state/action/reward 解释，突出它是 hyper-heuristic selector。
- MILP 降调为 small-scale offline reference，避免显得主线过重。
