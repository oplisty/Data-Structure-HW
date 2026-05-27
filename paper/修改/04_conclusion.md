# 04 Conclusion 修改审查稿

对应原文件：`paper/sec/4_conclusion.tex`

## 1. 原文

```latex
\section{Conclusion}

This paper presents a dynamic collaborative scheduling system for new energy logistics fleets based on graph algorithms and reinforcement learning. The system models the urban road network as a weighted graph and builds a discrete-time simulation framework that jointly considers task deadlines, vehicle capacity, battery constraints, and charging-station competition. Based on this framework, we implement and compare classical path-planning algorithms, fixed heuristic scheduling rules, and a Q-learning-based hyper-heuristic that dynamically selects dispatching rules according to the system state. Experimental results across different scenario scales show that fixed heuristics are effective in small-scale settings but become increasingly limited as task density and resource competition grow, while the Q-learning hyper-heuristic can learn useful rule-selection patterns and provide competitive performance in dynamic environments. The results also indicate that charging strategy design should be considered together with task scheduling, because battery recovery and charging queues directly affect vehicle availability and final scheduling quality. Overall, this work integrates graph algorithms, simulation modeling, heuristic scheduling, reinforcement learning, and exact optimization into a unified experimental platform, providing a practical basis for further research on new energy logistics fleet scheduling and multi-agent coordination.
```

## 2. 原文中文翻译

本文提出了一个基于图算法和强化学习的新能源物流车队动态协同调度系统。系统将城市道路网络建模为加权图，并构建了一个离散时间仿真框架，综合考虑任务截止时间、车辆容量、电池约束和充电站竞争。基于该框架，我们实现并比较了经典路径规划算法、固定启发式调度规则，以及一种基于 Q-learning 的超启发式方法，该方法根据系统状态动态选择调度规则。

不同规模场景下的实验结果表明，固定启发式方法在小规模设置中有效，但随着任务密度和资源竞争增加，其局限性也越来越明显；Q-learning 超启发式方法能够学习有用的规则选择模式，并在动态环境中提供有竞争力的表现。结果还表明，充电策略设计应与任务调度一起考虑，因为电量恢复和充电队列会直接影响车辆可用性和最终调度质量。

总体而言，本文将图算法、仿真建模、启发式调度、强化学习和精确优化整合到一个统一实验平台中，为新能源物流车队调度和多智能体协同的进一步研究提供了实践基础。

## 3. 建议修改稿

```latex
\section{Conclusion}

We deliver a runnable scheduling and visualization system for energy-aware logistics fleets. Instead of focusing on a single algorithm, the implementation connects graph-based routing, online task scheduling, battery and charging simulation, backend control, and frontend visualization into one workflow.

The experiments show that Nearest is a strong fixed baseline in the current settings, because shorter routes also reduce energy consumption and deadline risk. Q-learning can learn useful rule-selection behavior, especially in small and mixed-scale settings, but its medium-scale performance is still unstable. The charging ablation also suggests that station selection matters more when it interacts with adaptive scheduling.

The project also leaves room for data and scenario extension. While the main experiments use controlled random graph scenarios for fair comparison, we also build a Guangzhou Panyu OSM-based road-network extension. This shows that the same simulator can be reused on both synthetic graphs and real urban road topology.

Future work can build on this extensibility. The learning module can be improved with richer state features, function approximation, or deep reinforcement learning methods. The real-map scenario can also be extended with more realistic task demand, vehicle parameters, traffic conditions, and charging-station usage data, so that the platform moves closer to practical logistics simulation.
```

## 4. 修改稿中文翻译

我们完成了一个面向新能源物流车队的可运行调度与可视化系统。它不是围绕单个算法展开，而是把基于图的路径规划、在线任务调度、电量与充电仿真、后端控制和前端可视化连接成一个工作流。

实验表明，在当前设置下 Nearest 是一个很强的固定 baseline，因为较短路线也能降低能耗和 deadline 风险。Q-learning 能学习有用的规则选择行为，尤其是在 small 和 mixed-scale 场景中，但它在 medium-scale 场景下仍不稳定。充电消融实验也说明，当充电站选择和自适应调度发生交互时，它的影响会更明显。

本项目也保留了数据和场景扩展空间。主实验使用可控随机图场景，以便公平比较不同策略；同时，我们也实现了基于广州番禺 OSM 的真实路网扩展。这说明同一套仿真器既可以运行在合成图上，也可以复用到真实城市道路拓扑上。

未来工作可以继续沿着这种扩展性推进。学习模块可以加入更丰富的状态特征、函数近似或深度强化学习方法。真实地图场景也可以进一步加入更真实的任务需求、车辆参数、交通状态和充电站使用数据，使平台更接近实际物流仿真。

## 5. 修改意图

- 把结论从“论文式总结”改成“大作业成果总结”。
- 减少 Conclusion 对仿真流程的重复描述，让它更像成果和发现的收束。
- 减少 `This project / The system / Overall` 这类模板收束，改成更具体的实现口吻。
- 让实验结论更客观，承认 Q-learning 在 medium-scale 下不稳定。
- 弱化 `multi-agent coordination`、`exact optimization` 这类可能引发追问的收尾。
- 将番禺 OSM 内容组织为“数据和仿真管线的可扩展性”，说明 OSM 地理数据可以转换为图结构并复用同一套调度流程。
- 修正“未来加入真实路网数据”的说法：代码已经支持番禺 OSM 真实路网，未来应改成加入更真实的任务、车辆、交通和充电行为数据。
- 最后突出“不是单个算法，而是能跑、能看、能比的系统”。
