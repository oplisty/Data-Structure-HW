import sys
from pathlib import Path
sys.path.append(str(Path("Engine").resolve()))
from Framework.examples.run_baseline import build_environment
from Framework.examples.run_offline_plan_replay import remap_environment_to_offline_task_ids

env = build_environment("small", scheduler_name="baseline")
remap_environment_to_offline_task_ids(env)
print(len(env.tasks))
