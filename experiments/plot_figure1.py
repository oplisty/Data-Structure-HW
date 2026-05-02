from __future__ import annotations

import csv
import math
from collections import defaultdict
from pathlib import Path
from statistics import mean, stdev

import matplotlib.pyplot as plt
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
BASELINES_DIR = ROOT / "experiments" / "baselines"
OUTPUT_DIR = ROOT / "experiments" / "figures" / "main"
OUTPUT_PATH = OUTPUT_DIR / "fig_baseline_multi_scale.pdf"

SCALES = ["small", "medium", "large"]
SCHEDULERS = ["nearest", "earliest_deadline", "heaviest"]
SCHEDULER_LABELS = {
    "nearest": "Nearest",
    "earliest_deadline": "EDF",
    "heaviest": "Heaviest",
}

# User-requested palette.
PALETTE = {
    "nearest": "#C5E4E7",
    "earliest_deadline": "#FBF065",
    "heaviest": "#88C6E2",
    "accent_1": "#B58581",
    "accent_2": "#8182BA",
    "accent_3": "#BD4DA3",
}

METRICS = [
    ("final_score", "Final Score", False),
    ("completed_tasks", "Completed Tasks", False),
    ("expired_tasks", "Expired Tasks", True),
    ("total_distance", "Total Distance", True),
]

plt.rcParams.update(
    {
        "font.family": "serif",
        "font.serif": ["Times New Roman", "Times", "Nimbus Roman", "DejaVu Serif"],
        "mathtext.fontset": "stix",
        "font.size": 9.5,
        "axes.titlesize": 10.5,
        "axes.labelsize": 10,
        "xtick.labelsize": 9.5,
        "ytick.labelsize": 9.5,
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
    rows: list[dict[str, str]] = []
    with step_csv.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        raise ValueError(f"Empty step log: {step_csv}")

    last = rows[-1]
    return {
        "final_score": float(last["total_score"]),
        "completed_tasks": float(last["completed_tasks"]),
        "expired_tasks": float(last["expired_tasks"]),
    }


def _read_total_distance(vehicle_csv: Path) -> float:
    per_vehicle_max: dict[str, float] = {}
    with vehicle_csv.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            vehicle_id = row["vehicle_id"]
            total_distance = float(row["total_distance"])
            previous = per_vehicle_max.get(vehicle_id)
            if previous is None or total_distance > previous:
                per_vehicle_max[vehicle_id] = total_distance
    if not per_vehicle_max:
        raise ValueError(f"Empty vehicle log: {vehicle_csv}")
    return float(sum(per_vehicle_max.values()))


def collect_baseline_metrics() -> dict[str, dict[str, dict[str, list[float]]]]:
    data: dict[str, dict[str, dict[str, list[float]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))
    )

    for scale in SCALES:
        for scheduler in SCHEDULERS:
            pattern = f"{scale}_{scheduler}_seed*"
            for run_dir in BASELINES_DIR.glob(pattern):
                inner_dir = run_dir / f"{scale}_{scheduler}"
                step_csv = inner_dir / "step_log.csv"
                vehicle_csv = inner_dir / "vehicle_log.csv"
                if not step_csv.exists() or not vehicle_csv.exists():
                    continue

                summary = _read_step_summary(step_csv)
                summary["total_distance"] = _read_total_distance(vehicle_csv)

                for metric_name, _, _ in METRICS:
                    data[scale][scheduler][metric_name].append(summary[metric_name])

    return data


def summarize(data: dict[str, dict[str, dict[str, list[float]]]]) -> dict[str, dict[str, dict[str, tuple[float, float]]]]:
    summary: dict[str, dict[str, dict[str, tuple[float, float]]]] = defaultdict(dict)
    for scale in SCALES:
        for scheduler in SCHEDULERS:
            metric_summary: dict[str, tuple[float, float]] = {}
            metrics = data.get(scale, {}).get(scheduler, {})
            for metric_name, _, _ in METRICS:
                values = metrics.get(metric_name, [])
                if not values:
                    raise ValueError(
                        f"Missing values for scale={scale}, scheduler={scheduler}, metric={metric_name}"
                    )
                metric_summary[metric_name] = (mean(values), _safe_stdev(values))
            summary[scale][scheduler] = metric_summary
    return summary


def _beautify_axis(ax: plt.Axes) -> None:
    ax.set_axisbelow(True)
    ax.grid(axis="y", linestyle="--", linewidth=0.8, alpha=0.28)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_alpha(0.35)
    ax.spines["bottom"].set_alpha(0.35)


def plot_figure(summary: dict[str, dict[str, dict[str, tuple[float, float]]]]) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    fig, axes = plt.subplots(2, 2, figsize=(7.6, 5.8))
    axes = axes.flatten()

    x = np.arange(len(SCALES))
    width = 0.21
    offsets = [-width, 0.0, width]

    for ax, (metric_name, metric_label, lower_is_better) in zip(axes, METRICS):
        values_by_scheduler: list[list[float]] = []
        errors_by_scheduler: list[list[float]] = []
        for scheduler in SCHEDULERS:
            means = [summary[scale][scheduler][metric_name][0] for scale in SCALES]
            stds = [summary[scale][scheduler][metric_name][1] for scale in SCALES]
            values_by_scheduler.append(means)
            errors_by_scheduler.append(stds)

        # Highlight best bar in each scale with requested accent colors.
        best_scheduler_per_scale: list[str] = []
        for scale in SCALES:
            scores = {
                scheduler: summary[scale][scheduler][metric_name][0] for scheduler in SCHEDULERS
            }
            if lower_is_better:
                best_scheduler_per_scale.append(min(scores, key=scores.get))
            else:
                best_scheduler_per_scale.append(max(scores, key=scores.get))

        for idx, scheduler in enumerate(SCHEDULERS):
            means = values_by_scheduler[idx]
            stds = errors_by_scheduler[idx]
            colors = []
            edgecolors = []
            linewidths = []
            for scale_idx, _ in enumerate(SCALES):
                if best_scheduler_per_scale[scale_idx] == scheduler:
                    if scheduler == "nearest":
                        colors.append(PALETTE["accent_1"])
                    elif scheduler == "earliest_deadline":
                        colors.append(PALETTE["accent_2"])
                    else:
                        colors.append(PALETTE["accent_3"])
                    edgecolors.append("#4A4A4A")
                    linewidths.append(1.1)
                else:
                    colors.append(PALETTE[scheduler])
                    edgecolors.append("white")
                    linewidths.append(0.8)

            ax.bar(
                x + offsets[idx],
                means,
                width,
                label=SCHEDULER_LABELS[scheduler],
                color=colors,
                edgecolor=edgecolors,
                linewidth=linewidths,
                yerr=stds,
                ecolor="#555555",
                capsize=2.5,
                error_kw={"elinewidth": 0.8, "capthick": 0.8},
                zorder=3,
            )

        ax.set_title(metric_label, pad=5)
        ax.set_xticks(x)
        ax.set_xticklabels(["Small", "Medium", "Large"])
        ax.set_xlabel("Scale")
        ax.set_ylabel(metric_label)
        _beautify_axis(ax)

    axes[0].text(0.02, 1.01, "(a)", transform=axes[0].transAxes, fontsize=10, fontweight="bold")
    axes[1].text(0.02, 1.01, "(b)", transform=axes[1].transAxes, fontsize=10, fontweight="bold")
    axes[2].text(0.02, 1.01, "(c)", transform=axes[2].transAxes, fontsize=10, fontweight="bold")
    axes[3].text(0.02, 1.01, "(d)", transform=axes[3].transAxes, fontsize=10, fontweight="bold")

    handles, labels = axes[0].get_legend_handles_labels()
    fig.legend(
        handles,
        labels,
        loc="upper center",
        ncol=3,
        frameon=False,
        bbox_to_anchor=(0.5, 1.01),
        columnspacing=1.8,
        handlelength=1.8,
        handletextpad=0.6,
        borderaxespad=0.2,
    )
    fig.subplots_adjust(left=0.1, right=0.995, bottom=0.12, top=0.82, wspace=0.34, hspace=0.42)

    fig.savefig(OUTPUT_PATH, bbox_inches="tight", pad_inches=0.02)
    return OUTPUT_PATH


def main() -> None:
    if not BASELINES_DIR.exists():
        raise FileNotFoundError(f"Baseline directory not found: {BASELINES_DIR}")

    data = collect_baseline_metrics()
    summary = summarize(data)
    output_path = plot_figure(summary)
    print(f"Saved Figure 1 to: {output_path}")


if __name__ == "__main__":
    main()
