@echo off
REM NEMESIS GM Console — local launcher (serves the Website folder)
cd /d "%~dp0"
echo.
echo   NEMESIS GM CONSOLE
echo   Opening http://localhost:8765/console/
echo   (close this window to stop the server)
echo.
start "" http://localhost:8765/console/
python -m http.server 8765
