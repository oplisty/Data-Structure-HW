# 03 Experiment 修改审查稿

对应原文件：`paper/sec/3_finalcopy.tex`

## 1. 原文

```latex
\section{Experiment}
\subsection{Experiment Setup}
This section introduces the experimental setup from four aspects: the experimental environment, comparison methods, evaluation metrics, and implementation details. Overall, our goal is to systematically evaluate the differences among heuristic baselines, the Q-learning hyper-heuristic, and the offline MILP method in terms of task completion quality, running cost, and scalability within a unified dynamic new energy logistics scheduling environment.

\subsubsection{Environment Setup}
The environment is built on a graph-based road network and explicitly models a limited number of vehicles, dynamically released tasks, vehicle battery and load constraints, charging-station resources, and task deadlines. Our experiments support three different scales with the following configurations:

\begin{itemize}
    \item \textbf{small:}  includes 5 vehicles, 30 dynamic tasks, 2 charging stations, and 25 road nodes. The map size is \(30\times 30\), and the simulation horizon is 180.
    \item \textbf{medium:}  includes 10 vehicles, 100 dynamic tasks, 4 charging stations, and 60 road nodes. The map size is \(50\times 50\), and the simulation horizon is 300.
    \item \textbf{large:} includes 20 vehicles, 300 dynamic tasks, 8 charging stations, and 120 road nodes. The map size is \(80\times 80\), and the simulation horizon is 480.
\end{itemize}

In addition to the scale factor, charging decisions can significantly affect vehicle availability, task delay, and the overall score. Therefore, the experiments also consider two charging strategies(\text{optimal\_station} and \text{nearest\_station}).

\subsubsection{Evaluation Metric}
To comprehensively evaluate the performance of different methods in the dynamic new energy logistics scenario, we report experimental metrics from two aspects: task effectiveness and operating cost. The definitions of these metrics are given below.

\subsection{Experiment Results}
The focus of this experimental analysis includes the performance differences of fixed heuristic baselines across different problem scales, the advantages of the Q-learning hyper-heuristic over the best baseline, the convergence characteristics of Q-learning during training, and the impact of charging strategy design on overall system performance.

\subsubsection{Baseline Comparison}
Since the three scenarios contain different numbers of tasks, the absolute number of completed tasks should not be compared across scales directly; instead, the score, expired tasks, and distance should be interpreted together within each scale.

Small scale: Nearest achieves the highest average Final Score of 2354.10, with 26.0 completed tasks and 0.4 expired tasks. EDF follows with a score of 2309.03, and Heaviest obtains 2271.05.

Medium scale: Nearest remains the strongest baseline, achieving an average Final Score of 3662.73, with 47.6 completed tasks and 36.6 expired tasks. Heaviest ranks second with a score of 3187.80, while EDF obtains 2805.43.

Large scale: Nearest still obtains the best score among the three heuristics, with 1605.12 and 61.8 completed tasks, followed by Heaviest with 1054.17 and EDF with 525.16.

\subsubsection{Comparison with Q-learning}
We compares the learned Q-learning hyper-heuristic with the strongest fixed baseline under the corresponding evaluation settings.

Small scale: Q-HH-Small achieves a Final Score of 2399.09, with 26.6 completed tasks and 0.6 expired tasks. Q-HH-Mixed obtains a higher Final Score of 2515.96 and 28.2 completed tasks, but with 1.8 expired tasks on average.

Medium scale: Q-HH-Medium achieves an average Final Score of 3050.90, with 42.6 completed tasks and 43.6 expired tasks. Compared with Nearest, the learned policy is less competitive in the final evaluation runs.

Training evidence: The training logs show that Q-HH-Medium reaches a best evaluation score of 4651.62 during training.

\subsubsection{Training Convergence}
We found that Q-learning can improve policy quality during training, but the stability of learning depends strongly on the scenario scale.

Small scale reaches a best evaluation score of 2550.60 at episode 155. Medium scale reaches 4651.62 at episode 230, but its final evaluation score decreases. Mixed scale reaches 4455.95 at episode 237, but final smoothed performance still fluctuates.

\subsubsection{Ablation}
The charging strategy ablation shows different effects for fixed heuristics and Q-learning. For fixed baseline, optimal station and nearest station obtain almost identical results. For Q-learning, optimal station selection achieves an average Final Score of 2935.14, while nearest station selection obtains 2836.04.
```

## 2. 原文中文翻译

本节从实验环境、对比方法、评价指标和实现细节四个方面介绍实验设置。总体目标是在统一的动态新能源物流调度环境中，从任务完成质量、运行成本和可扩展性角度，系统评估启发式基线、Q-learning 超启发式方法和离线 MILP 方法之间的差异。

实验环境基于图结构道路网络，并显式建模有限车辆、动态释放任务、车辆电量和载重约束、充电站资源以及任务截止时间。实验支持三种规模：small 包含 5 辆车、30 个动态任务、2 个充电站和 25 个道路节点；medium 包含 10 辆车、100 个动态任务、4 个充电站和 60 个道路节点；large 包含 20 辆车、300 个动态任务、8 个充电站和 120 个道路节点。实验还考虑了 optimal_station 和 nearest_station 两种充电策略。

评价指标分为任务有效性和运行成本两个方面。任务有效性包括完成任务数、过期任务数、总延迟等；运行成本包括总行驶距离、仿真步数、离线 MILP 中的 makespan，以及充电触发次数和平均队列负载。对于 Q-learning，还报告训练阶段的 total reward 和 eval score mean。

实验结果部分分析固定启发式基线在不同规模下的表现差异、Q-learning 相比最佳基线的优势、Q-learning 训练收敛特征，以及充电策略对整体系统性能的影响。

Baseline 对比显示，不同规模任务数不同，因此不能直接跨规模比较完成任务绝对值，而应在每个规模内结合得分、过期任务和距离理解结果。small 场景下三种启发式结果接近，Nearest 得分最高。medium 场景下差距变大，Nearest 仍然最强，EDF 产生最多过期任务。large 场景下过期任务显著增加，但 Nearest 仍是最佳固定启发式。

Q-learning 对比部分显示，small 场景下 Q-HH-Small 略优于最佳固定 baseline，Q-HH-Mixed 得分更高但过期任务也增加。medium 场景下 Q-HH-Medium 最终评估不如 Nearest，说明中等规模对表格型 Q-learning 更具挑战。训练日志中 Q-HH-Medium 曾达到较高评估分数，说明 Q-learning 能发现高质量规则选择策略，但稳定性仍需提升。

训练收敛结果显示，Q-learning 可以在训练中提升策略质量，但稳定性受场景规模影响。small 最稳定，medium 和 mixed 有较高峰值但波动更大。充电消融结果显示，固定基线下两种充电策略几乎没有差异，而 Q-learning 下 optimal station 略优于 nearest station。

## 3. 建议修改稿

```latex
\section{Experiments and Results}
\subsection{Experiment Setup}

For the main quantitative comparison, all strategies are tested on the same controlled random graph settings, task sequences, vehicle configurations, and evaluation metrics. The experiments focus on three questions: which fixed heuristic is the most stable baseline, whether Q-learning can learn useful rule-selection policies, and how charging-station selection affects scheduling performance.

\subsubsection{Environment Setup}
The environment is built on a graph-based road network with dynamic tasks, limited vehicles, battery constraints, load constraints, charging stations, and task deadlines. We test three scenario scales:
\begin{itemize}
    \item \textbf{Small:} 5 vehicles, 30 dynamic tasks, 2 charging stations, 25 road nodes, map size \(30\times 30\), and simulation horizon 180.
    \item \textbf{Medium:} 10 vehicles, 100 dynamic tasks, 4 charging stations, 60 road nodes, map size \(50\times 50\), and simulation horizon 300.
    \item \textbf{Large:} 20 vehicles, 300 dynamic tasks, 8 charging stations, 120 road nodes, map size \(80\times 80\), and simulation horizon 480.
\end{itemize}
We also compare two charging-station selection rules: \texttt{optimal\_station}, which considers both distance and station load, and \texttt{nearest\_station}, which always selects the nearest station.

\subsubsection{Evaluation Metrics}
We report task effectiveness, operating cost, and learning-stage metrics. Task effectiveness is measured by completed tasks, expired tasks, and final score. Operating cost is measured by total distance, simulation steps, makespan for offline planning, and charging burden. For Q-learning, we additionally report total training reward and evaluation score mean, which reflects the performance of the greedy policy after training.

\subsection{Experiment Results}

\subsubsection{Baseline Comparison}
Figure~\ref{fig:baseline_multi_scale} compares Nearest, EDF, and Heaviest under different scenario scales. Since the total number of tasks differs across scales, completed tasks should be interpreted together with final score, expired tasks, and travel distance.

On the small scenario, the three heuristics are almost tied. Nearest obtains the highest average final score of \textbf{2354.10}, with \textbf{26.0} completed tasks and \textbf{0.4} expired tasks. EDF and Heaviest follow with scores of \textbf{2309.03} and \textbf{2271.05}. The gap is small because the task pressure is low and most vehicles can still find feasible tasks quickly.

The medium scenario separates the methods more clearly. Nearest remains the strongest baseline, with a final score of \textbf{3662.73}, \textbf{47.6} completed tasks, and \textbf{36.6} expired tasks. Heaviest ranks second, while EDF produces the weakest result among the three. A likely reason is that EDF focuses only on urgency and may send vehicles to distant tasks, which increases travel cost, battery consumption, and later deadline risk.

The large scenario is the most difficult one. All fixed rules suffer from more expired tasks, but Nearest still achieves the best score among fixed heuristics, followed by Heaviest and EDF. This suggests that distance-aware dispatching is a strong baseline in our simulator: shorter paths reduce energy consumption and leave more time for later tasks.

\subsubsection{Comparison with Q-learning}
Figure~\ref{fig:qlearning_vs_baseline} compares the Q-learning hyper-heuristic with the strongest fixed baseline. In this experiment, Q-learning is evaluated as a rule-selection policy: it does not directly generate routes, but selects a low-level dispatching rule according to the current system state.

On small-scale evaluation, Q-HH-Small achieves a final score of \textbf{2399.09}, slightly higher than the best fixed baseline, while maintaining a similar task completion level. Q-HH-Mixed obtains a higher final score of \textbf{2515.96} and completes \textbf{28.2} tasks on average, but it also increases expired tasks to \textbf{1.8}. This suggests that mixed-scale training can improve task completion and score, but may also introduce more aggressive dispatching behavior.

In the medium-scale evaluation, Q-HH-Medium obtains a final score of \textbf{3050.90}, with \textbf{42.6} completed tasks and \textbf{43.6} expired tasks. This is lower than the Nearest baseline under the same scale. Therefore, the current tabular Q-learning policy is not consistently better than a strong fixed heuristic in more complex environments. The result is reasonable because medium-scale scenarios have denser task arrivals, larger state variation, and stronger coupling between task dispatching and charging decisions.

The training logs still show that Q-HH-Medium once reaches a best evaluation score of \textbf{4651.62}. This means Q-learning can discover high-quality rule-selection behavior, but the learned policy is not stable enough across evaluation seeds. Therefore, Q-learning is better viewed as a promising adaptive strategy rather than a fully dominant method in the current implementation.

\subsubsection{Training Convergence}
Figure~\ref{fig:qlearning_convergence} shows that Q-learning improves policy quality during training, but its stability depends on scenario scale. The small-scale model is the most stable and reaches a best evaluation score of \textbf{2550.60} at episode \textbf{155}. The medium model reaches a higher best score of \textbf{4651.62} at episode \textbf{230}, but later evaluation performance decreases. The mixed-scale model also reaches a strong best score of \textbf{4455.95}, while its smoothed performance fluctuates because the training distribution alternates across different scales.

These results indicate that tabular Q-learning is feasible for adaptive rule selection, but its coarse state representation limits generalization in larger scenarios. Future work can improve this part by using richer state features, function approximation, or deep reinforcement learning methods such as DQN or PPO.

\subsubsection{Charging Strategy Ablation}
Table~\ref{tab:charging_strategy_ablation} compares \texttt{optimal\_station} and \texttt{nearest\_station} in the medium-scale setting. For the fixed Nearest scheduler, the two charging strategies produce almost identical results: both complete \textbf{47.6} tasks, produce \textbf{36.6} expired tasks, and have an average queue load of only \textbf{0.018}. This suggests that charging congestion is not the main bottleneck in the current fixed-baseline runs.

For Q-learning, optimal station selection performs slightly better than nearest station selection. It obtains a final score of \textbf{2935.14}, compared with \textbf{2836.04} under nearest station selection. It also completes slightly more tasks and produces fewer expired tasks. This shows that charging decisions can interact with adaptive scheduling policies, although the effect is still limited under the current queue-load setting.

The experiments lead to three main findings. First, Nearest is a strong fixed baseline because it reduces both travel cost and energy risk. Second, Q-learning can learn useful rule-selection policies, but the current tabular version is not stable enough in medium-scale scenarios. Third, charging strategy design matters more when it interacts with adaptive scheduling, while its effect is small when station queues are light.
```

## 4. 修改稿中文翻译

对于主定量对比，所有策略都在相同的可控随机图设置、任务序列、车辆配置和评价指标下测试。实验重点关注三个问题：哪种固定启发式是最稳定的 baseline，Q-learning 是否能学到有用的规则选择策略，以及充电站选择如何影响调度表现。

实验环境基于图结构路网，包含动态任务、有限车辆、电量约束、载重约束、充电站和任务截止时间。实验分为 small、medium、large 三种规模。small 包含 5 辆车、30 个任务、2 个充电站、25 个道路节点；medium 包含 10 辆车、100 个任务、4 个充电站、60 个道路节点；large 包含 20 辆车、300 个任务、8 个充电站、120 个道路节点。实验还比较了 `optimal_station` 和 `nearest_station` 两种充电站选择规则。

评价指标包括任务有效性、运行成本和学习阶段指标。任务有效性用完成任务数、过期任务数和最终得分衡量；运行成本用总行驶距离、仿真步数、离线规划中的 makespan 和充电负担衡量；对于 Q-learning，还报告训练总奖励和评估平均分，用于反映训练后贪心策略的表现。

Baseline 对比显示，small 场景下三种启发式几乎打平，Nearest 得分最高，但差距不大，因为任务压力较低，大部分车辆都能较快找到可行任务。medium 场景把方法差异拉开了，Nearest 仍然最强，而 EDF 最弱。可能原因是 EDF 只关注紧急程度，可能把车辆派到较远任务，导致行驶成本、电量消耗和后续 deadline 风险增加。large 场景最困难，任务密度和资源竞争更高，但 Nearest 仍然是固定启发式中最稳定的策略，因为较短路径能减少能耗并为后续任务留下更多时间。

Q-learning 对比中，需要强调它是规则选择策略，而不是直接生成车辆路径。small 场景下，Q-HH-Small 略高于最佳固定 baseline；Q-HH-Mixed 得分更高、完成任务更多，但过期任务也更多，说明 mixed-scale training 可能带来更积极的调度行为。medium 场景下，Q-HH-Medium 的最终评估低于 Nearest，因此当前表格型 Q-learning 并不能在复杂环境中稳定超过强固定启发式。这可能是因为 medium 场景任务更密集、状态变化更大，调度和充电之间的耦合也更强。

训练日志显示，Q-HH-Medium 曾达到较高评估分数，说明 Q-learning 能发现高质量规则选择行为，但该策略在不同评估种子下还不够稳定。因此，在当前实现中，Q-learning 更适合作为一种有潜力的自适应策略，而不是已经完全占优的方法。

训练收敛结果表明，Q-learning 可以在训练中提升策略质量，但稳定性依赖场景规模。small 最稳定；medium 和 mixed 可以达到更高峰值，但后续评估表现会下降或波动。这说明表格型 Q-learning 可以用于自适应规则选择，但粗粒度状态表示限制了它在大规模场景中的泛化能力。未来可以考虑更丰富的状态特征、函数近似，或 DQN/PPO 等深度强化学习方法。

充电策略消融表明，对于固定 Nearest 调度器，两种充电策略几乎没有差异，因为平均队列负载很低，说明充电拥堵不是当前固定 baseline 的主要瓶颈。对于 Q-learning，optimal station 略优于 nearest station，说明充电决策会和自适应调度策略产生交互，但在当前队列负载下影响仍然有限。

实验可以归纳出三个发现：第一，Nearest 是强固定 baseline，因为它同时减少行驶成本和电量风险；第二，Q-learning 能学习有用的规则选择策略，但当前表格版本在 medium 场景中不够稳定；第三，充电策略在与自适应调度结合时更重要，而在充电队列较轻时影响较小。

## 5. 修改意图

- 把章节标题从 `Experiment` 改为 `Experiments and Results`，更自然。
- 修正原文语法问题，例如 `We compares`。
- 不使用模板化的 Observation/Reason/Limitation，而是用自然段分析实验现象。
- 替换连续的 `In the small/medium/large setting`，让实验分析不那么像流水模板。
- 开头明确主定量对比使用 controlled random graph settings，避免和番禺 OSM 支持混淆。
- 保留关键数值，但补充“为什么会这样”的解释。
- Q-learning 部分按更专业的方式写：先说明实验目的，再讨论结果、训练证据和局限。
- 将 “In the report, it is safer...” 这种写作建议口吻改成正式实验结论。
- 结论与数据保持一致，不把 Q-learning 夸得过满。
