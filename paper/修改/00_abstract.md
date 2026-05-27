# 00 Abstract 修改审查稿

对应原文件：`paper/sec/0_abstract.tex`

## 1. 原文

```latex
\begin{abstract}
   With the rapid growth of urban instant delivery, scheduling for new energy logistics fleets faces increasing challenges from dynamic task arrivals, limited vehicle resources, and complex charging constraints. This paper presents a dynamic collaborative scheduling system based on graph modeling and intelligent decision methods. The urban road network is represented as a weighted graph, and a discrete-time simulation framework is built by considering battery limits, load capacity, task deadlines, and charging station congestion. 
   For path planning and reachability analysis, the system applies Dijkstra, A*, and RRT, while at the scheduling level it implements several heuristic strategies, including nearest-task-first, maximum-weight-first, earliest-deadline-first and Q-learning-based hyper-heuristic. 
   In addition, an offline MILP module under full-information settings is developed for small-scale cases to generate near-optimal solutions and provide a baseline for comparison with online scheduling strategies. 
   The system follows a “simulation engine + backend + visualization frontend” architecture. Experimental show that it can effectively capture the key constraints and operating process of new energy logistics delivery, and that different strategies exhibit clear differences in task completion rate, total reward, path length, and charging load. 
   Overall, this work develops a research-relevant platform for dynamic scheduling of new energy logistics fleets, providing a practical basis for future studies on multi-agent coordination, exact optimization, and more complex urban delivery scenarios.
\end{abstract}
```

## 2. 原文中文翻译

随着城市即时配送的快速增长，新能源物流车队调度面临越来越多挑战，包括动态任务到达、有限车辆资源以及复杂充电约束。本文提出了一个基于图建模和智能决策方法的动态协同调度系统。系统将城市道路网络表示为加权图，并在考虑电池限制、载重能力、任务截止时间和充电站拥堵的基础上，构建了离散时间仿真框架。

在路径规划和可达性分析方面，系统使用 Dijkstra、A* 和 RRT；在调度层面，系统实现了多种启发式策略，包括最近任务优先、最大重量优先、最早截止时间优先，以及基于 Q-learning 的超启发式方法。

此外，系统还为小规模场景开发了一个完整信息条件下的离线 MILP 模块，用于生成近似最优解，并作为在线调度策略的对比基准。

系统采用“仿真引擎 + 后端 + 可视化前端”的架构。实验表明，它能够有效刻画新能源物流配送中的关键约束和运行过程，不同策略在任务完成率、总奖励、路径长度和充电负载方面表现出明显差异。

总体而言，本文开发了一个具有研究价值的新能源物流车队动态调度平台，为未来关于多智能体协同、精确优化以及更复杂城市配送场景的研究提供了实践基础。

## 3. 建议修改稿

```latex
\begin{abstract}
Urban new energy logistics scheduling is more complex than finding the shortest route. In practice, vehicles have to make decisions while tasks keep arriving, battery and load capacity are limited, charging takes time, stations may have queues, and unfinished tasks may miss their deadlines. To study this process, we built a multi-vehicle scheduling simulator and used it to compare different dispatching strategies.

The road network is represented as a weighted graph. Dijkstra and A* are used for shortest-path and feasibility queries, while RRT is kept as an extensible path-planning module. For scheduling, we implement Nearest, EDF, Heaviest, a Q-learning based rule selector, and an offline MILP reference for small-scale full-information cases. The simulator is connected with a backend service and a visualization frontend, so the scheduling process can be executed, observed, and compared.

Experiments on controlled random graph scenarios show that Nearest is a strong fixed baseline, while Q-learning can learn useful rule-selection behavior but is less stable in medium-scale settings. Moreover, we build a processed Guangzhou Panyu OSM road-network scenario to test the same simulator on a real urban map. The focus is a runnable, visible, and comparable scheduling platform rather than a single algorithm.
\end{abstract}
```

## 4. 修改稿中文翻译

城市新能源物流调度比单纯寻找最短路线更复杂。实际运行中，车辆需要在任务不断出现的情况下做决策，同时还要受到电量、载重、充电时间、充电站排队和任务截止时间的限制。为了研究这个过程，我们构建了一个多车辆调度仿真器，并用它比较不同派车策略的表现。

道路网络被表示为加权图。Dijkstra 和 A* 用于最短路和可行性查询，RRT 作为可扩展的路径规划模块保留。调度方面，我们实现了 Nearest、EDF、Heaviest、基于 Q-learning 的规则选择器，以及用于小规模完整信息场景的离线 MILP 参考。仿真器与后端服务和可视化前端连接，因此调度过程可以被执行、观察和比较。

可控随机图场景上的实验表明，Nearest 是很强的固定 baseline；Q-learning 能学习有用的规则选择行为，但在 medium-scale 场景下稳定性不足。此外，我们还构建了处理后的广州番禺 OSM 道路网络场景，用来测试同一套仿真器在真实城市地图上的运行效果。本文重点不是单个算法，而是一个能运行、能观察、能比较的调度平台。

## 5. 修改意图

- 把摘要压缩到 3 段，只保留问题、核心模块、实验发现和番禺 OSM 支持。
- 弱化 `research-relevant`、`near-optimal`、`multi-agent coordination` 这类偏论文且容易被追问的表达。
- 保留 Q-learning 和 MILP，但把它们放回系统的一部分，而不是让它们抢主线。
- 明确实验结论：Nearest 强，Q-learning 有潜力但 medium scale 不稳定，充电策略影响依赖调度方法。
- 减少 `This project / The system / Overall` 这种模板开头，改成更像项目实现口吻的表达。
- 补一句番禺 OSM 支持，但明确主定量对比仍然基于 controlled random graph scenarios，避免误导读者。
- 删除前端/后端每步更新的细节，避免和 Framework 重复。
