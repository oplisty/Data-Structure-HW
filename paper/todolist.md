# 大作业 Report 修改清单

## 0. 总体目标：写成系统展示型报告

- [ ] 不要把报告写成正式论文，改成让老师和 TA 快速看懂的项目展示报告。
- [ ] 全文核心 spotlight：
  - **We built a complete simulation and visualization system for energy-aware dynamic logistics scheduling.**
  - 中文理解：**我们做了一个能跑、能看、能比较策略的新能源物流动态调度系统。**
- [ ] 全文围绕三个关键词组织：

| 核心 | 对应内容 |
| --- | --- |
| 能跑 | 离散时间仿真、车辆状态、任务释放、路径规划、充电逻辑 |
| 能看 | 前端地图、车辆移动、任务状态、充电站、实验图表 |
| 能比 | Nearest、EDF、Heaviest、Q-learning、MILP、统一实验指标 |

- [ ] 少堆公式，少铺背景，多用流程图、表格、截图、短段落。
- [ ] 目标是：**一眼有亮点，三分钟懂系统，五分钟信你做出来了。**

## 1. Abstract：改短，突出“做了什么”

- [ ] 摘要改成五句话左右，不要写成 paper abstract。
- [ ] 推荐结构：
  1. 新能源物流调度有电量、充电、任务时限等约束；
  2. 本项目做了一个动态调度仿真系统；
  3. 用图表示路网，用 Dijkstra / A* / RRT 做路径规划和可达性分析；
  4. 实现 Nearest、EDF、Heaviest、Q-learning 策略选择和 MILP 离线参考；
  5. 通过前后端可视化展示车辆、任务、充电站和实验结果。
- [ ] 避免摘要里出现太多偏论文的表述：
  - research-relevant；
  - near-optimal；
  - multi-agent coordination；
  - overly rigorous optimization framework。
- [ ] 可以加入这句作为收束：
  - **The system demonstrates how graph algorithms, heuristic scheduling, reinforcement learning, and visualization can be integrated into a complete course project.**

## 2. Introduction：少背景，多项目目标和功能列表

- [ ] Introduction 压成三个短段。
- [ ] 第一段：问题背景。说明新能源物流车不是普通车辆，因为要考虑：
  - 电量有限；
  - 充电需要时间；
  - 充电站可能排队；
  - 任务有 deadline；
  - 任务动态到达。
- [ ] 第二段：项目目标。直接说明：
  - 本项目不是求解一个静态最短路问题；
  - 而是构建动态仿真系统；
  - 车辆要在任务不断出现的情况下完成任务分配、路径规划、充电决策和结果统计。
- [ ] 第三段：本项目完成内容。用 bullet list，不要写成正式论文 contributions：
  - built a graph-based road network；
  - implemented path planning algorithms；
  - designed several scheduling strategies；
  - added battery and charging constraints；
  - implemented Q-learning-based strategy selection；
  - added offline MILP reference；
  - built frontend visualization。
- [ ] 可以加入这句强调大作业亮点：
  - **The system is designed not only to execute scheduling decisions, but also to visualize the process and compare different strategies under the same environment.**

## 3. System Framework：先讲系统怎么跑

- [ ] 第 2 章建议改名为 **System Framework**。
- [ ] 第 2 章开头加一句导航：
  - **This section explains how the system is organized and how one simulation step is executed.**
- [ ] 新增小节 **2.1 Overall Running Process**。
- [ ] 在小节开头放一个非常直观的流程：
  - **Task Release -> Vehicle State Update -> Feasibility Check -> Scheduling Decision -> Movement / Service / Charging -> Statistics Update**
- [ ] 下面用 6 个编号解释：
  1. 新任务按照 release time 进入系统；
  2. 系统更新车辆位置、电量、载重和状态；
  3. 根据图最短路判断车辆能否到达任务点并返回；
  4. 调度策略选择任务；
  5. 车辆执行移动、服务、返回或充电；
  6. 系统更新得分、完成任务数、过期任务数和充电队列。
- [ ] 这一节要让读者立刻明白：系统不是几个算法拼起来，而是一个真实运行的仿真闭环。

## 4. 算法介绍：改成“它在系统里干什么”

- [ ] 不要长篇介绍算法原理，老师知道 Dijkstra、A*、Q-learning 是什么。
- [ ] 重点说明每个算法/策略在系统中的角色。
- [ ] 建议加一张表：

| 算法 / 策略 | 在系统里的作用 |
| --- | --- |
| Dijkstra | 计算最短路径，作为稳定 baseline |
| A* | 用启发式加速目标点搜索 |
| RRT | 作为扩展路径规划接口，展示系统可扩展性 |
| Nearest | 优先选择最近任务，降低距离和电量消耗 |
| EDF | 优先处理 deadline 最早任务 |
| Heaviest | 优先处理载重较大任务 |
| Q-learning | 根据系统状态选择当前最合适的启发式规则 |
| MILP | 在小规模完整信息场景下提供离线参考 |

- [ ] 复杂算法细节和较长伪代码尽量下放到 Supplementary。
- [ ] 正文保留系统中的用途、输入输出和关键效果。

## 5. Q-learning：按相对专业的论文格式写

- [ ] 明确 Q-learning 在系统中的定位：
  - **In our system, Q-learning does not directly control the detailed route of each vehicle. Instead, it works as a hyper-heuristic selector that chooses which dispatching rule should be used under the current system state.**
- [ ] 这一节可以比其他算法写得更正式一些，因为它是报告的高级方法亮点。
- [ ] 建议按照论文里常见的 RL 结构来写：
  1. **State Space**：系统状态如何编码；
  2. **Action Space**：动作是选择调度规则；
  3. **Reward Design**：奖励如何和任务完成、延迟、距离、充电等待相关；
  4. **Learning Process**：Q-table 如何更新，训练 episode 如何进行；
  5. **Policy Execution**：训练后的策略如何用于仿真调度。
- [ ] 增加一个设计表，帮助读者快速对应实现：

| Element | Design in Our System |
| --- | --- |
| State | backlog level, urgency level, average battery level, idle vehicle ratio, charging queue load |
| Action | choose one heuristic rule: Nearest / EDF / Heaviest / Best-score |
| Reward | task completion reward minus travel cost, overdue penalty, and waiting/charging cost |
| Update | tabular Q-learning update with learning rate, discount factor, and exploration rate |
| Output | learned Q-table for adaptive heuristic selection |

- [ ] 正文保留 Q-learning 更新公式，并解释每一项在本系统中的意义。
- [ ] 训练设置建议写清楚：
  - episode 数；
  - exploration rate / decay；
  - learning rate；
  - discount factor；
  - random seed 或评估场景是否固定。
- [ ] 结论保持客观：
  - Q-learning 在 small / mixed 场景有潜力；
  - medium scale 不稳定；
  - 原因可能是 tabular state 太粗，规模变大后泛化不足。

## 6. MILP：降调，作为离线参考或扩展模块

- [ ] MILP 不要写得太重，避免“模型很正式但实验没跟上”的感觉。
- [ ] 建议表述：
  - **The MILP module is implemented as an offline reference for small-scale full-information cases. It is not the main online scheduling method, but it helps compare online strategies with a more globally planned solution.**
- [ ] 如果没有完整 MILP 实验表，不要反复强调 near-optimal baseline。
- [ ] 复杂 MILP 公式建议放到 Supplementary。
- [ ] 正文只保留：
  - MILP 解决什么小规模问题；
  - 为什么它不能作为主要在线方法；
  - 它如何帮助理解在线策略表现。

## 7. Experiments and Results：自然分析，不要模板化

- [ ] 第 3 章建议改名为 **Experiments and Results**。
- [ ] 章节开头加一句导航：
  - **This section compares different scheduling strategies under small, medium, and large scenarios.**
- [ ] 不要使用太固定的 **Observation / Reason / Limitation** 小框，容易显得模板化。
- [ ] 每组图后写一小段自然分析即可，重点回答两个问题：
  - 结果说明了什么；
  - 为什么会出现这个结果。
- [ ] Baseline Comparison 可以这样分析：
  - Nearest 在多数设置下更稳定；
  - 原因是距离优先会同时降低行驶成本、电量消耗和 deadline 风险；
  - EDF 只关注 deadline，可能把车辆派到较远任务；
  - Heaviest 会偏向高载重任务，但可能忽略距离和时限。
- [ ] Q-learning Results 可以写得更专业一些：
  - 先说明它作为 hyper-heuristic policy 的实验目的；
  - 再比较训练曲线和最终评估表现；
  - 指出 small / mixed 场景下有一定适应性；
  - 承认 medium 场景不稳定，可能来自 tabular state representation 的表达能力不足；
  - 可以把它和 fixed heuristic 的结果放在一起讨论，而不是孤立展示。
- [ ] Charging Ablation 可以简短分析：
  - fixed baseline 下差异不明显；
  - 当前平均充电队列负载较低，充电不是主要瓶颈；
  - Q-learning 下 optimal station 可能略好，说明学习型调度和充电策略存在耦合。
- [ ] 实验结论必须和数据一致，避免把 Q-learning 夸得太满。

## 8. Conclusion 和 Project Reflection

- [ ] Conclusion 开头加一句：
  - **This project builds a complete simulation and visualization platform for energy-aware logistics scheduling.**
- [ ] 结论按三个部分写：
  1. 系统总结：能跑、能看、能比较；
  2. 实验发现：Nearest 稳，Q-learning 有潜力但不稳定，当前充电不是主要瓶颈；
  3. 不足与未来工作：更细状态表示、DQN/PPO、多智能体强化学习、真实路网数据、更拥堵充电场景。
- [ ] 如果有 **Project Reflection**，写得更像课程收获：
  - 真实调度不是单个算法能解决；
  - 图结构、优先队列、最短路、状态机、调度规则和实验评估需要结合；
  - 前后端可视化能帮助调试和解释算法行为。

## 9. 建议目录微调

- [ ] 原目录不用大改，可以微调成：

```text
Abstract

1. Introduction
   1.1 Background and Motivation
   1.2 Project Goal
   1.3 Main Functions of the System

2. System Framework
   2.1 Overall Running Process
   2.2 Graph-based Environment Modeling
   2.3 Path Planning and Feasibility Checking
   2.4 Online Scheduling Strategies
   2.5 Q-learning Strategy Selection
   2.6 Backend and Frontend Visualization

3. Experiments and Results
   3.1 Experiment Settings
   3.2 Baseline Strategy Comparison
   3.3 Q-learning Results
   3.4 Charging Strategy Ablation
   3.5 Summary of Findings

4. Conclusion

5. Project Reflection

Supplementary Material
```


## 10. 最终修改顺序

1. [ ] 先改 Abstract：短、直接、突出系统完成度；
2. [ ] 改 Introduction：少背景，多项目目标和功能列表；
3. [ ] 第 2 章开头加 **Overall Running Process**；
4. [ ] 把算法介绍改成“算法作用表”；
5. [ ] 按 State / Action / Reward / Learning Process / Policy Execution 重写 Q-learning；
6. [ ] MILP 降调，复杂公式放 Supplementary；
7. [ ] 实验图后写自然分析，尤其把 Q-learning 结果讲专业、讲客观；
8. [ ] Conclusion 改成系统总结 + 实验发现 + 不足；
9. [ ] Project Reflection 写得更像课程收获；
10. [ ] 最后修拼写、图中文字、术语统一。

## 11. 最后检查

- [ ] 全文是否始终服务于“能跑、能看、能比”？
- [ ] 老师是否能在三分钟内看懂系统怎么运行？
- [ ] 每个算法是否都说明了“在系统里干什么”？
- [ ] 实验图后是否有自然、具体、和数据一致的分析？
- [ ] 是否删掉或下放了过重的公式和论文腔表述？
- [ ] 是否没有继续纠结 collaborative 标题问题，而是先把系统展示讲清楚？
