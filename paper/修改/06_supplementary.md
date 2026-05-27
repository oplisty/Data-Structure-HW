# 06 Supplementary / Evaluation Metrics 修改审查稿

对应原文件：`paper/sec/X_suppl.tex`

## 1. 原文

```latex
\clearpage
\onecolumn
\setcounter{page}{1}
\begin{center}
{\Large\bfseries Dynamic Collaborative Scheduling System for New Energy Logistics Fleets Based on Graph Algorithms and Reinforcement Learning\\[0.5em]}
{\large Supplementary Material}
\end{center}
\vspace{1em}

\section{Evaluation Metrics}
\label{sec:supp_eval_metrics}

This supplementary section provides the mathematical definitions of the evaluation metrics used in the main paper.

\subsection{Task Effectiveness Metrics}

\paragraph{Final Score.}
For each completed task \(\tau_i\), its reward is defined as
\[
\mathrm{Score}(\tau_i)=
\max
\left(
0,
R_0
-
\alpha \cdot
\min
\left(
\frac{d_i}{D_{\mathrm{ref}}},
1
\right)
-
P_{\mathrm{late}}\cdot
\mathbb{I}\left(t_i^{\mathrm{finish}}>d_i^{\mathrm{deadline}}\right)
\right).
\]
Here, \(R_0\) is the base reward, \(d_i\) is the service travel distance of task \(i\), \(D_{\mathrm{ref}}\) is the reference distance used for normalization, \(\alpha\) is the normalized distance-cost weight, and \(P_{\mathrm{late}}\) is the penalty for late completion.

The total final score is computed as
\[
\mathrm{FinalScore}=
\sum_{i\in\mathcal{T}_{\mathrm{completed}}}
\mathrm{Score}(\tau_i)
-
P_{\mathrm{fail}}\cdot
\lvert\mathcal{T}_{\mathrm{expired}}\rvert
+
S_{\mathrm{partial}}.
\]

\paragraph{Completed Tasks.}
Completed Tasks denotes the number of tasks completed by the end of the simulation:
\[
\mathrm{CompletedTasks}=\lvert\mathcal{T}_{\mathrm{completed}}\rvert.
\]

\paragraph{Expired Tasks.}
Expired Tasks denotes the number of tasks that pass their deadlines and remain unfinished by the end of the simulation:
\[
\mathrm{ExpiredTasks}=\lvert\mathcal{T}_{\mathrm{expired}}\rvert.
\]

\paragraph{Total Tardiness.}
Total Tardiness is mainly used for offline MILP result analysis and is defined as
\[
\mathrm{TotalTardiness}
=
\sum_n \max(0,\mathrm{arr}_n-d_n),
\]
where \(\mathrm{arr}_n\) denotes the arrival time at task \(n\), and \(d_n\) is its deadline.

\subsection{Operating Cost Metrics}

\paragraph{Total Distance.}
Total Distance is the sum of travel distances of all vehicles:
\[
\mathrm{TotalDistance}
=
\sum_{v\in\mathcal{V}}\mathrm{dist}_v.
\]

\paragraph{Steps.}
Steps denotes the number of discrete simulation time steps from the initial time to the end of the online simulation.

\paragraph{Makespan.}
Makespan is used for offline MILP result analysis and denotes the maximum completion time after all vehicles finish service and return to the depot:
\[
\mathrm{Makespan}=\max_{v\in\mathcal{V}}T_v^{\mathrm{finish}}.
\]

\paragraph{Charging Burden.}
Charging Burden is measured using two statistics: the number of charging triggers and the average queue load. The number of charging triggers measures how often vehicles enter the charging process, while the average queue load measures congestion caused by competition for charging resources.

\subsection{Training-stage Metrics}

\paragraph{Total Reward.}
Total Reward is the sum of immediate rewards over all decision steps in a single Q-learning training episode:
\[
\mathrm{TotalReward}=
\sum_t r_t.
\]

\paragraph{Eval Score Mean.}
Eval Score Mean is the mean final score obtained by applying the greedy policy over several evaluation episodes after each training round:
\[
\mathrm{EvalScoreMean}
=
\frac{1}{K}\sum_{k=1}^{K}\mathrm{FinalScore}^{(k)}.
\]
This metric measures the stable performance of the learned policy and avoids relying only on a single training trajectory.
```

## 2. 原文中文翻译

该补充材料部分提供正文中使用的评价指标的数学定义。

在任务有效性指标中，Final Score 表示每个完成任务的得分。原公式中，任务得分由基础奖励、距离成本和迟到惩罚共同决定。这里 \(R_0\) 是基础奖励，\(d_i\) 是任务 \(i\) 的服务行驶距离，\(D_{\mathrm{ref}}\) 是归一化参考距离，\(\alpha\) 是距离成本权重，\(P_{\mathrm{late}}\) 是迟到惩罚。总得分由所有完成任务得分之和、过期任务惩罚和可选协同任务部分得分组成。

Completed Tasks 表示仿真结束时完成的任务数量。Expired Tasks 表示超过截止时间且最终未完成的任务数量。Total Tardiness 主要用于离线 MILP 结果分析，定义为所有任务延迟时间的总和，其中 \(\mathrm{arr}_n\) 表示到达任务 \(n\) 的时间，\(d_n\) 表示任务截止时间。

运行成本指标包括 Total Distance、Steps、Makespan 和 Charging Burden。Total Distance 是所有车辆行驶距离之和。Steps 表示在线仿真从初始时间到结束所经历的离散时间步数。Makespan 用于离线 MILP 分析，表示所有车辆完成服务并返回仓库后的最大完成时间。Charging Burden 使用充电触发次数和平均队列负载两个统计量衡量，前者表示车辆进入充电流程的频率，后者表示充电资源竞争造成的拥堵程度。

训练阶段指标包括 Total Reward 和 Eval Score Mean。Total Reward 是单个 Q-learning 训练 episode 中所有决策步即时奖励的总和。Eval Score Mean 是每轮训练后，用贪心策略在若干评估 episode 上得到的最终得分平均值，用于衡量学习策略的稳定表现，避免只依赖单条训练轨迹。

## 3. 建议修改稿

```latex
\clearpage
\onecolumn
\setcounter{page}{1}
\begin{center}
{\Large\bfseries Dynamic Scheduling System for New Energy Logistics Fleets Based on Graph Algorithms and Reinforcement Learning\\[0.5em]}
{\large Supplementary Material}
\end{center}
\vspace{1em}

\section{Evaluation Metrics}
\label{sec:supp_eval_metrics}

This supplementary section gives the mathematical definitions of the evaluation metrics used in the experiments. The main paper explains the meaning and comparison results of these metrics, while the supplementary material keeps the formulas for reproducibility.

\subsection{Task Effectiveness Metrics}

\paragraph{Final Score.}
For each completed task \(\tau_i\), the task score is defined as
\[
\mathrm{Score}(\tau_i)=
\max
\left(
0,
R_0
-
\alpha \cdot
\min
\left(
\frac{\ell_i}{D_{\mathrm{ref}}},
1
\right)
-
P_{\mathrm{late}}\cdot
\mathbb{I}\left(t_i^{\mathrm{finish}}>D_i\right)
\right).
\]
Here, \(R_0\) is the base reward, \(\ell_i\) is the service travel distance of task \(i\), \(D_{\mathrm{ref}}\) is the reference distance for normalization, \(\alpha\) is the distance-cost weight, \(P_{\mathrm{late}}\) is the late-completion penalty, and \(D_i\) is the deadline of task \(i\).

The total final score is computed as
\[
\mathrm{FinalScore}=
\sum_{i\in\mathcal{T}_{\mathrm{completed}}}
\mathrm{Score}(\tau_i)
-
P_{\mathrm{fail}}\cdot
\lvert\mathcal{T}_{\mathrm{expired}}\rvert
+
S_{\mathrm{partial}}.
\]
Here, \(\mathcal{T}_{\mathrm{completed}}\) is the set of completed tasks, \(\mathcal{T}_{\mathrm{expired}}\) is the set of unfinished expired tasks, and \(S_{\mathrm{partial}}\) denotes optional partial credit.

\paragraph{Completed Tasks.}
Completed Tasks is the number of tasks completed by the end of the simulation:
\[
\mathrm{CompletedTasks}=\lvert\mathcal{T}_{\mathrm{completed}}\rvert.
\]

\paragraph{Expired Tasks.}
Expired Tasks is the number of tasks that pass their deadlines and remain unfinished:
\[
\mathrm{ExpiredTasks}=\lvert\mathcal{T}_{\mathrm{expired}}\rvert.
\]

\paragraph{Total Tardiness.}
Total Tardiness is mainly used for offline MILP result analysis:
\[
\mathrm{TotalTardiness}
=
\sum_i \max(0,t_i^{\mathrm{finish}}-D_i).
\]

\subsection{Operating Cost Metrics}

\paragraph{Total Distance.}
Total Distance is the sum of travel distances of all vehicles:
\[
\mathrm{TotalDistance}
=
\sum_{k\in\mathcal{K}}\mathrm{dist}_k.
\]

\paragraph{Steps.}
Steps denotes the number of discrete simulation time steps from the initial time to the end of online simulation.

\paragraph{Makespan.}
Makespan is used for offline MILP analysis and denotes the maximum completion time after all vehicles finish service and return to the depot:
\[
\mathrm{Makespan}=\max_{k\in\mathcal{K}}T_k^{\mathrm{finish}}.
\]

\paragraph{Charging Burden.}
Charging Burden is measured by the number of charging triggers and the average queue load. The first metric measures how often vehicles enter the charging process, while the second measures congestion at charging stations.

\subsection{Training-stage Metrics}

\paragraph{Total Reward.}
Total Reward is the sum of immediate rewards over all decision steps in one Q-learning training episode:
\[
\mathrm{TotalReward}
=
\sum_t r_t.
\]

\paragraph{Eval Score Mean.}
Eval Score Mean is the mean final score obtained by applying the greedy policy over several evaluation episodes:
\[
\mathrm{EvalScoreMean}
=
\frac{1}{K}\sum_{j=1}^{K}\mathrm{FinalScore}^{(j)}.
\]
This metric measures the stable performance of the learned policy instead of relying on a single training trajectory.
```

## 4. 修改稿中文翻译

该补充材料部分给出实验中使用的评价指标的数学定义。正文只解释这些指标的含义和对比结果，而补充材料保留公式，以便结果可复现。

在任务有效性指标中，每个完成任务 \(\tau_i\) 的得分由基础奖励、距离成本和迟到惩罚构成。修改稿中用 \(\ell_i\) 表示任务 \(i\) 的服务行驶距离，用 \(D_i\) 表示任务 \(i\) 的截止时间，从而避免原文中 \(d_i\) 同时表示距离和 deadline 的符号冲突。总得分由完成任务得分之和、过期任务惩罚和可选部分得分组成。

Completed Tasks 表示仿真结束时完成的任务数量。Expired Tasks 表示超过截止时间且仍未完成的任务数量。Total Tardiness 主要用于离线 MILP 结果分析，表示所有任务完成时间超过截止时间的延迟总和。

运行成本指标包括 Total Distance、Steps、Makespan 和 Charging Burden。Total Distance 是所有车辆行驶距离之和，修改稿中用 \(\mathcal{K}\) 表示车辆集合，以避免和图节点集合混淆。Steps 表示在线仿真的离散时间步数。Makespan 表示所有车辆完成服务并返回仓库后的最大完成时间。Charging Burden 由充电触发次数和平均队列负载衡量，前者表示车辆进入充电流程的频率，后者表示充电站拥堵程度。

训练阶段指标包括 Total Reward 和 Eval Score Mean。Total Reward 是一个 Q-learning 训练 episode 中所有即时奖励之和。Eval Score Mean 是使用训练后贪心策略在多个评估 episode 上得到的最终得分平均值，用于衡量学习策略的稳定表现，而不是只依赖单次训练轨迹。

## 5. 修改意图

- 保留 Supplementary 的公式功能，不让复杂指标定义挤占正文篇幅。
- 统一符号：用 \(\ell_i\) 表示距离，用 \(D_i\) 表示 deadline。
- 用 \(\mathcal{K}\) 表示车辆集合，避免和图节点集合 \(V\) 或 \(\mathcal{N}\) 混淆。
- 删除或弱化过细实现参数，让补充材料更清楚地服务实验复现。
