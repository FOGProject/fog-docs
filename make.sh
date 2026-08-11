#!/usr/bin/env bash
# Build/serve the Quartz-based docs site locally on Linux/macOS.
set -euo pipefail

QUARTZ_DIR="$(dirname "$0")/quartz"
MIN_NODE_MAJOR=22
MODE="serve"

for arg in "$@"; do
	case "$arg" in
		--build)
			MODE="build"
			;;
		*)
			echo "Unknown option: $arg" >&2
			echo "Usage: $0 [--build]" >&2
			exit 1
			;;
	esac
done

if ! command -v node >/dev/null 2>&1; then
	echo "Node.js ${MIN_NODE_MAJOR}+ is required but was not found on PATH." >&2
	echo "Install it with your distro's package manager, or via nvm: https://github.com/nvm-sh/nvm" >&2
	exit 1
fi

node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
if [ "$node_major" -lt "$MIN_NODE_MAJOR" ]; then
	echo "Node.js ${MIN_NODE_MAJOR}+ is required, found $(node --version)." >&2
	echo "Update it with your distro's package manager, or via nvm: https://github.com/nvm-sh/nvm" >&2
	exit 1
fi

cd "$QUARTZ_DIR"

needs_install=1
if [ -d node_modules ] && [ node_modules -nt package.json ]; then
	needs_install=0
fi

if [ "$needs_install" -eq 1 ]; then
	npm i
else
	echo "Dependencies already up to date, skipping npm i"
fi

if [ "$MODE" = "build" ]; then
	npm run docs:build
	echo "Static build complete, output in $QUARTZ_DIR/public"
else
	npm run docs:serve
fi
