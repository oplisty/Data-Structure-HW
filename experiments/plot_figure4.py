from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path
from statistics import mean, stdev

import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
ABLATION_BASELINE_DIR = ROOT / "experiments" / "ablation" / "charging"
ABLATION_Q_DIR = ROOT / "experiments" / "ablation" / "qlearning_charging"
OUTPUT_DIR = ROOT / "experiments" / "figures" / "main"
OUTPUT_PATH = OUTPUT_DIR / "fig_charging_ablation.pdf"

STRATEGIES = ["optimal_station", "nearest_station"]
METHODS = ["baseline", "qlearning"]
METHOD_LABELS = {
    "baseline": "Baseline",
    "qlearning": "Q-learning",
}
STRATEGY_LABELS = {
    "optimal_station": "Optimal station",
    "nearest_station": "Nearest station",
}
SEEDS = [7, 8, 9, 10, 11]

PALETTE = {
    "baseline_optimal": "#88C6E2",
    "baseline_nearest": "#C5E4E7",
    "qlearning_optimal": "#B58581",
    "qlearning_nearest": "#FBF065",
}
HATCHES = {
    "optimal_station": "",
    "nearest_station": "//",
}

METRICS = [
    ("completed_tasks", "Completed Tasks"),
    ("avg_charge_wait", "Avg Charge Wait"),
    ("expired_tasks", "Expired Tasks"),
]

plt.rcParams.update(
    {
        "font.family": "serif",
        "font.serif": ["Times New Roman", "Times", "Nimbus Roman", "DejaVu Serif"],
        "mathtext.fontset": "stix",
        "font.size": 14,
        "axes.titlesize": 15,
        "axes.labelsize": 14,
        "xtick.labelsize": 13,
        "ytick.labelsize": 13,
        "legend.fontsize": 16,
        "figure.dpi": 160,
        "savefig.dpi": 320,
    }
)


def _safe_stdev(values: list[float]) -> float:
    if len(values) <= 1:
        return 0.0
    return stdev(values)


def _read_baseline_step_summary(path: Path) -> dict[str, float]:
    with path.open("r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise ValueError(f"Empty step log: {path}")
    last = rows[-1]
    return {
        "completed_tasks": float(last["completed_tasks"]),
        "expired_tasks": float(last["expired_tasks"]),
    }


def _read_avg_charge_wait(station_csv: Path) -> float:
    with station_csv.open("r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise ValueError(f"Empty station log: {station_csv}")
    queue_lengths = [float(row["queue_length"]) for row in rows]
    return mean(queue_lengths) if queue_lengths else 0.0


def collect_baseline_ablation() -> dict[str, dict[str, tuple[float, float]]]:
    values: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))

    for strategy in STRATEGIES:
        for seed in SEEDS:
            run_dir = ABLATION_BASELINE_DIR / f"{strategy}_seed{seed}" / "medium_nearest"
            step_csv = run_dir / "step_log.csv"
            station_csv = run_dir / "station_log.csv"
            if not step_csv.exists() or not station_csv.exists():
                raise FileNotFoundError(f"Missing ablation baseline files in {run_dir}")

            summary = _read_baseline_step_summary(step_csv)
            summary["avg_charge_wait"] = _read_avg_charge_wait(station_csv)

            for metric_name, _ in METRICS:
                values[strategy][metric_name].append(summary[metric_name])

    summary: dict[str, dict[str, tuple[float, float]]] = {}
    for strategy in STRATEGIES:
        summary[strategy] = {}
        for metric_name, _ in METRICS:
            metric_values = values[strategy][metric_name]
            summary[strategy][metric_name] = (mean(metric_values), _safe_stdev(metric_values))
    return summary


def collect_qlearning_ablation() -> dict[str, dict[str, tuple[float, float]]]:
    summary: dict[str, dict[str, tuple[float, float]]] = {}
    for strategy in STRATEGIES:
        eval_csv = ABLATION_Q_DIR / strategy / "eval_summary.csv"
        if not eval_csv.exists():
            raise FileNotFoundError(f"Missing Q-learning ablation eval summary: {eval_csv}")

        values: dict[str, list[float]] = defaultdict(list)
        with eval_csv.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                values["completed_tasks"].append(float(row["completed_tasks"]))
                values["expired_tasks"].append(float(row["expired_tasks"]))
                values["avg_charge_wait"].append(float(row["steps"]))

        summary[strategy] = {}
        for metric_name, _ in METRICS:
            metric_values = values[metric_name]
            summary[strategy][metric_name] = (mean(metric_values), _safe_stdev(metric_values))
    return summary


def _beautify_axis(ax: plt.Axes) -> None:
    ax.set_axisbelow(True)
    ax.grid(axis="y", linestyle="--", linewidth=0.8, alpha=0.28)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_alpha(0.35)
    ax.spines["bottom"].set_alpha(0.35)


def plot_figure(
    baseline_summary: dict[str, dict[str, tuple[float, float]]],
    qlearning_summary: dict[str, dict[str, tuple[float, float]]],
) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    fig, axes = plt.subplots(1, 3, figsize=(16.2, 6.2), constrained_layout=True)

    x = np.arange(len(METHODS))
    width = 0.28
    strategy_offsets = {
        "optimal_station": -width / 2,
        "nearest_station": width / 2,
    }

    method_to_summary = {
        "baseline": baseline_summary,
        "qlearning": qlearning_summary,
    }

    for ax, (metric_name, metric_label) in zip(axes, METRICS):
        for strategy in STRATEGIES:
            means = [method_to_summary[method][strategy][metric_name][0] for method in METHODS]
            stds = [method_to_summary[method][strategy][metric_name][1] for method in METHODS]
            bar_positions = x + strategy_offsets[strategy]

            if strategy == "optimal_station":
                colors = [PALETTE["baseline_optimal"], PALETTE["qlearning_optimal"]]
            else:
                colors = [PALETTE["baseline_nearest"], PALETTE["qlearning_nearest"]]

            bars = ax.bar(
                bar_positions,
                means,
                width,
                color=colors,
                edgecolor="#4A4A4A",
                linewidth=0.9,
                hatch=HATCHES[strategy],
                yerr=stds,
                ecolor="#555555",
                capsize=4,
                error_kw={"elinewidth": 1.0, "capthick": 1.0},
                zorder=3,
            )
            for bar in bars:
                bar.set_alpha(0.95)

        ax.set_title(metric_label, pad=6)
        ax.set_xticks(x)
        ax.set_xticklabels([METHOD_LABELS[m] for m in METHODS])
        ax.set_xlabel("Method")
        ax.set_ylabel(metric_label)
        _beautify_axis(ax)

    axes[0].text(0.02, 1.02, "(a)", transform=axes[0].transAxes, fontsize=12.5, fontweight="bold")
    axes[1].text(0.02, 1.02, "(b)", transform=axes[1].transAxes, fontsize=12.5, fontweight="bold")
    axes[2].text(0.02, 1.02, "(c)", transform=axes[2].transAxes, fontsize=12.5, fontweight="bold")

    handles = [
        plt.Rectangle((0, 0), 1, 1, facecolor="#D9D9D9", edgecolor="#4A4A4A", hatch=""),
        plt.Rectangle((0, 0), 1, 1, facecolor="#D9D9D9", edgecolor="#4A4A4A", hatch="//"),
    ]
    labels = [STRATEGY_LABELS["optimal_station"], STRATEGY_LABELS["nearest_station"]]
    fig.legend(
        handles,
        labels,
        loc="upper center",
        ncol=2,
        frameon=False,
        bbox_to_anchor=(0.5, 1.04),
        columnspacing=2.0,
        handlelength=1.8,
        handletextpad=0.8,
        borderaxespad=0.3,
    )
    fig.suptitle(
        "Figure 4. Charging-strategy ablation under the medium-scale scenario",
        fontsize=14,
        fontweight="bold",
        y=1.08,
    )

    fig.savefig(OUTPUT_PATH, bbox_inches="tight")
    return OUTPUT_PATH


def main() -> None:
    baseline_summary = collect_baseline_ablation()
    qlearning_summary = collect_qlearning_ablation()
    output_path = plot_figure(baseline_summary, qlearning_summary)
    print(f"Saved Figure 4 to: {output_path}")


if __name__ == "__main__":
    main()
