#!/bin/bash
# Deprecated: use themes/_modules/layouts/common.sh directly.
# This file redirects to common.sh for backward compatibility (loader.sh).

LAYOUT_DIR="${LAYOUT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/layouts" && pwd)}"
source "$LAYOUT_DIR/common.sh"
