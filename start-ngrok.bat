@echo off
echo ========================================
echo   Starting ngrok tunnel for Promtly AI
echo ========================================

echo.
echo Checking if ngrok is installed...
ngrok version >nul 2>&1
if errorlevel 1 (
    echo ngrok not found! Installing via npm...
    npm install -g ngrok
)

echo.
echo Starting ngrok tunnel on port 5173...
echo.
echo Your public URL will appear below:
echo ========================================
ngrok http 5173