#!/bin/bash
# NEMESIS GM Console — local launcher (serves the Website folder)
cd "$(dirname "$0")"
echo ""
echo "  NEMESIS GM CONSOLE"
echo "  Opening http://localhost:8765/console/"
echo "  (Ctrl+C to stop the server)"
echo ""
( sleep 1 && { open http://localhost:8765/console/ 2>/dev/null || xdg-open http://localhost:8765/console/ 2>/dev/null; } ) &
python3 -m http.server 8765
