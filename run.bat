@echo off
echo Starting Nutri-Derm Wellness Platform...

:: Start the Python backend in a new command window
echo [~] Starting the Python Backend...
start "NutriScan Backend" cmd /c "cd /d %~dp0 && python backend/app.py"

:: Wait for a couple of seconds to ensure backend is up
timeout /t 3 /nobreak > nul

:: Start the React frontend in a new command window
echo [~] Starting the React Frontend...
start "NutriScan Frontend" cmd /c "cd /d %~dp0\frontend && npm run dev"

echo.
echo ==============================================
echo  Both services have been started successfully!
echo  Check the new terminal windows for the logs.
echo ==============================================
echo.
pause
s