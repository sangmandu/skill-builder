#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$PWD}"

python3 - "$ROOT" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1]).expanduser().resolve()

def exists(*parts):
    return (root.joinpath(*parts)).exists()

def list_dirs(names):
    return [name for name in names if exists(name) and root.joinpath(name).is_dir()]

def list_files(patterns):
    found = []
    for pattern in patterns:
        found.extend(path.relative_to(root).as_posix() for path in root.glob(pattern) if path.is_file())
    return sorted(set(found))[:12]

def package_scripts():
    package = root / "package.json"
    if not package.exists():
        return []
    try:
        data = json.loads(package.read_text())
    except Exception:
        return []
    scripts = data.get("scripts")
    if not isinstance(scripts, dict):
        return []
    return [f"{name}: {cmd}" for name, cmd in sorted(scripts.items())[:12]]

source_dirs = list_dirs(["src", "app", "lib", "server", "client", "components", "pages"])
test_dirs = list_dirs(["test", "tests", "__tests__", "e2e", "spec"])
docs = list_files(["README.md", "docs/**/*.md", "*.md"])
ci = list_files([".github/workflows/*", ".gitlab-ci.yml", "Dockerfile", "docker-compose.yml", "compose.yml"])
scripts = package_scripts()
has_tests = bool(test_dirs or any("test" in item.split(":")[0] for item in scripts))
has_build = any(item.startswith("build:") or item.startswith("build ") or item.startswith("build:") or item.startswith("build") for item in scripts)
has_lint = any(item.startswith("lint") for item in scripts)

print("# Skill Builder First-Run Discovery")
print()
print(f"Project root: `{root}`")
print()
print("## Detected Signals")
print()
print(f"- Source directories: {', '.join(source_dirs) if source_dirs else 'none detected'}")
print(f"- Test directories: {', '.join(test_dirs) if test_dirs else 'none detected'}")
print(f"- Documentation: {', '.join(docs) if docs else 'none detected'}")
print(f"- CI or runtime files: {', '.join(ci) if ci else 'none detected'}")
print(f"- Package scripts: {', '.join(scripts) if scripts else 'none detected'}")
print()
print("## Suggested Starter Workflow")
print()
if has_tests and (has_build or has_lint):
    print("This looks like a code project with repeatable implementation and verification work.")
    print()
    print("Recommended track:")
    print("Specify -> Plan -> Explain Plan -> Implement -> Self Review -> Test -> Commit")
    print()
    print("Recommended workflow data:")
    print("- `data.task_scope` from repository/request inspection")
    print("- `data.plan_summary` from planning")
    print("- `data.verification_summary` from test/build/lint output")
    print("- `data.commit_sha` when committing is part of the workflow")
elif has_tests:
    print("This looks like a project where validation exists, but build/lint automation is not obvious.")
    print()
    print("Recommended track:")
    print("Specify -> Plan -> Implement -> Self Review -> Test -> Commit")
    print()
    print("Recommended workflow data:")
    print("- `data.task_scope`")
    print("- `data.test_plan`")
    print("- `data.verification_summary`")
elif source_dirs:
    print("This looks like a code project without obvious automated verification scripts.")
    print()
    print("Recommended track:")
    print("Specify -> Plan -> Implement -> Self Review -> Commit")
    print()
    print("Recommended workflow data:")
    print("- `data.task_scope`")
    print("- `data.plan_summary`")
    print("- `data.review_notes`")
else:
    print("There is not enough project structure to infer the workflow confidently.")
    print()
    print("Recommended next question:")
    print("What repeated work should this skill automate first?")
print()
print("## Authoring Boundary")
print()
print("Open Skill Builder and create or edit the skill draft. Do not initialize generated workflow state or activate generated hooks during this authoring step.")
PY
