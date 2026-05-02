from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path
from statistics import mean, stdev

import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
BASELINES_DIR = ROOT / "experiments" / "baselines"
QLEARNING_DIR = ROOT / "experiments" / "qlearning"
OUTPUT_DIR = ROOT / "experiments" / "figures" / "main"
OUTPUT_PATH = OUTPUT_DIR / "fig_qlearning_vs_best_baseline.pdf"

SCALES = ["small", "medium"]
BASELINE_SCHEDULERS = ["nearest", "earliest_deadline", "heaviest"]
BASELINE_LABELS = {
    "nearest": "Nearest",
    "earliest_deadline": "EDF",
    "heaviest": "Heaviest",
}
QLEARNING_MODELS = ["small", "medium", "mixed"]
MODEL_LABELS = {
    "small": "Q-HH-Small",
    "medium": "Q-HH-Medium",
    "mixed": "Q-HH-Mixed",
}
MODEL_TARGET_SCALE = {
    "small": "small",
    "medium": "medium",
    "mixed": "small",
}

PALETTE = {
    "baseline": "#88C6E2",
    "baseline_highlight": "#B58581",
    "small": "#C5E4E7",
    "medium": "#FBF065",
    "mixed": "#BD4DA3",
    "mixed_highlight": "#8182BA",
}

METRICS = [
    ("final_score", "Final Score", False),
    ("completed_tasks", "Completed Tasks", False),
    ("expired_tasks", "Expired Tasks", True),
]

plt.rcParams.update(
    {
        "font.family": "serif",
        "font.serif": ["Times New Roman", "Times", "Nimbus Roman", "DejaVu Serif"],
        "mathtext.fontset": "stix",
        "font.size": 11,
        "axes.titlesize": 12,
        "axes.labelsize": 11,
        "xtick.labelsize": 10,
        "ytick.labelsize": 10,
        "legend.fontsize": 10,
        "figure.dpi": 160,
        "savefig.dpi": 320,
    }
)


def _safe_stdev(values: list[float]) -> float:
    if len(values) <= 1:
        return 0.0
    return stdev(values)


def _read_step_summary(step_csv: Path) -> dict[str, float]:
    with step_csv.open("r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise ValueError(f"Empty step log: {step_csv}")
    last = rows[-1]
    return {
        "final_score": float(last["total_score"]),
        "completed_tasks": float(last["completed_tasks"]),
        "expired_tasks": float(last["expired_tasks"]),
    }


def collect_baseline_best() -> dict[str, dict[str, tuple[str, float, float]]]:
    data: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))

    for scale in SCALES:
        for scheduler in BASELINE_SCHEDULERS:
            pattern = f"{scale}_{scheduler}_seed*"
            for run_dir in BASELINES_DIR.glob(pattern):
                inner_dir = run_dir / f"{scale}_{scheduler}"
                step_csv = inner_dir / "step_log.csv"
                if not step_csv.exists():
                    continue
                summary = _read_step_summary(step_csv)
                for metric_name, _, _ in METRICS:
                    data[f"{scale}:{scheduler}"][metric_name].append(summary[metric_name])

    best_summary: dict[str, dict[str, tuple[str, float, float]]] = defaultdict(dict)
    for scale in SCALES:
        scheduler_stats: dict[str, dict[str, tuple[float, float]]] = {}
        for scheduler in BASELINE_SCHEDULERS:
            key = f"{scale}:{scheduler}"
            stats_for_scheduler: dict[str, tuple[float, float]] = {}
            for metric_name, _, _ in METRICS:
                values = data[key][metric_name]
                if not values:
                    raise ValueError(f"Missing baseline values for {scale}/{scheduler}/{metric_name}")
                stats_for_scheduler[metric_name] = (mean(values), _safe_stdev(values))
            scheduler_stats[scheduler] = stats_for_scheduler

        for metric_name, _, lower_is_better in METRICS:
            metric_scores = {scheduler: scheduler_stats[scheduler][metric_name][0] for scheduler in BASELINE_SCHEDULERS}
            if lower_is_better:
                best_scheduler = min(metric_scores, key=metric_scores.get)
            else:
                best_scheduler = max(metric_scores, key=metric_scores.get)
            best_mean, best_std = scheduler_stats[best_scheduler][metric_name]
            best_summary[scale][metric_name] = (best_scheduler, best_mean, best_std)

    return best_summary


def collect_qlearning_summary() -> dict[str, dict[str, tuple[float, float]]]:
    summary: dict[str, dict[str, tuple[float, float]]] = {}
    for model_name in QLEARNING_MODELS:
        eval_csv = QLEARNING_DIR / model_name / "eval_summary.csv"
        if not eval_csv.exists():
            raise FileNotFoundError(f"Missing Q-learning eval summary: {eval_csv}")

        values_by_metric: dict[str, list[float]] = defaultdict(list)
        with eval_csv.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                for metric_name, _, _ in METRICS:
                    values_by_metric[metric_name].append(float(row[metric_name]))

        model_summary: dict[str, tuple[float, float]] = {}
        for metric_name, _, _ in METRICS:
            values = values_by_metric[metric_name]
            if not values:
                raise ValueError(f"Missing Q-learning values for {model_name}/{metric_name}")
            model_summary[metric_name] = (mean(values), _safe_stdev(values))
        summary[model_name] = model_summary

    return summary


def _beautify_axis(ax: plt.Axes) -> None:
    ax.set_axisbelow(True)
    ax.grid(axis="y", linestyle="--", linewidth=0.8, alpha=0.28)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_alpha(0.35)
    ax.spines["bottom"].set_alpha(0.35)


def plot_figure(
    baseline_best: dict[str, dict[str, tuple[str, float, float]]],
    qlearning_summary: dict[str, dict[str, tuple[float, float]]],
) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    fig, axes = plt.subplots(1, 3, figsize=(15, 5.2), constrained_layout=True)

    x = np.arange(len(SCALES))
    width = 0.18
    method_order = ["baseline", "small", "medium", "mixed"]
    offsets = [-1.5 * width, -0.5 * width, 0.5 * width, 1.5 * width]

    for ax, (metric_name, metric_label, _) in zip(axes, METRICS):
        for idx, method in enumerate(method_order):
            means: list[float] = []
            stds: list[float] = []
            for scale in SCALES:
                if method == "baseline":
                    best_scheduler, best_mean, best_std = baseline_best[scale][metric_name]
                    means.append(best_mean)
                    stds.append(best_std)
                else:
                    target_scale = MODEL_TARGET_SCALE[method]
                    if target_scale != scale:
                        means.append(np.nan)
                        stds.append(0.0)
                    else:
                        model_mean, model_std = qlearning_summary[method][metric_name]
                        means.append(model_mean)
                        stds.append(model_std)

            color = PALETTE[method if method != "baseline" else "baseline"]
            edgecolor = "white"
            linewidth = 0.9
            if method == "baseline":
                color = PALETTE["baseline_highlight"]
                edgecolor = "#4A4A4A"
                linewidth = 1.0
            if method == "mixed":
                edgecolor = "#4A4A4A"
                linewidth = 1.0

            bars = ax.bar(
                x + offsets[idx],
                means,
                width,
                label="Best Baseline" if method == "baseline" else MODEL_LABELS[method],
                color=color,
                edgecolor=edgecolor,
                linewidth=linewidth,
                yerr=stds,
                ecolor="#555555",
                capsize=4,
                error_kw={"elinewidth": 1.0, "capthick": 1.0},
                zorder=3,
            )

            for scale_idx, bar in enumerate(bars):
                if np.isnan(means[scale_idx]):
                    bar.set_facecolor((0, 0, 0, 0))
                    bar.set_edgecolor((0, 0, 0, 0))
                    bar.set_hatch("//")

        ax.set_title(metric_label)
        ax.set_xticks(x)
        ax.set_xticklabels([s.capitalize() for s in SCALES])
        ax.set_xlabel("Evaluation Scale")
        ax.set_ylabel(metric_label)
        _beautify_axis(ax)

        if metric_name == "expired_tasks":
            ax.text(
                1.0,
                1.02,
                "Large-scale Q-learning not available",
                transform=ax.transAxes,
                ha="right",
                va="bottom",
                fontsize=9,
                color="#666666",
            )

    axes[0].text(0.02, 1.02, "(a)", transform=axes[0].transAxes, fontsize=12, fontweight="bold")
    axes[1].text(0.02, 1.02, "(b)", transform=axes[1].transAxes, fontsize=12, fontweight="bold")
    axes[2].text(0.02, 1.02, "(c)", transform=axes[2].transAxes, fontsize=12, fontweight="bold")

    handles = [
        plt.Rectangle((0, 0), 1, 1, facecolor=PALETTE["baseline_highlight"], edgecolor="#4A4A4A"),
        plt.Rectangle((0, 0), 1, 1, facecolor=PALETTE["small"], edgecolor="white"),
        plt.Rectangle((0, 0), 1, 1, facecolor=PALETTE["medium"], edgecolor="white"),
        plt.Rectangle((0, 0), 1, 1, facecolor=PALETTE["mixed"], edgecolor="#4A4A4A"),
    ]
    labels = ["Best Baseline", "Q-HH-Small", "Q-HH-Medium", "Q-HH-Mixed"]
    fig.legend(handles, labels, loc="upper center", ncol=4, frameon=False, bbox_to_anchor=(0.5, 1.04))
    fig.suptitle(
        "Figure 2. Q-learning hyper-heuristic versus the best heuristic baseline",
        fontsize=14,
        fontweight="bold",
        y=1.08,
    )

    fig.savefig(OUTPUT_PATH, bbox_inches="tight")
    return OUTPUT_PATH


def main() -> None:
    baseline_best = collect_baseline_best()
    qlearning_summary = collect_qlearning_summary()
    output_path = plot_figure(baseline_best, qlearning_summary)
    print(f"Saved Figure 2 to: {output_path}")


if __name__ == "__main__":
    main()
