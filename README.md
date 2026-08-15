# dsh-multi-workspace

Multi-workspace sandbox for DeepSeek Harness (DSH).

Automatically grants file-write access to ALL registered workspaces — add a workspace in the UI, write to it immediately, no config needed.

## Problem

By default, DSH file sandbox only allows writes to one workspace directory (the session cwd). Writing to other directories requires sandbox escalation.

## Solution

This plugin reads the live workspace registry on every sandbox policy check and injects every registered workspace path as an additional writable root.

## How it works

Two layers:
1. Wraps sandboxPolicy.resolve() to attach workspace paths
2. Wraps fs.writeText/editText with retry fallback on each workspace root

## Installation

```
dsh plugin --profile web add github:somnusovis/dsh-multi-workspace

# Or from npm (once published)
dsh plugin --profile web add dsh-multi-workspace
```

Restart DSH web service and refresh browser.

## License

MIT