@echo off
echo ========================================
echo   Promtly AI Demo Setup
echo ========================================

echo.
echo Checking if .env.local exists...
if not exist .env.local (
    echo Creating .env.local from template...
    copy .env.example .env.local
    echo.
    echo ВАЖНО: Отредактируйте .env.local и добавьте ваши API ключи!
    echo Минимум нужны:
    echo - OPENAI_API_KEY=sk-your-key
    echo - GOOGLE_GENERATIVE_AI_API_KEY=your-key
    echo.
    pause
)

echo.
echo Starting Docker containers...
docker-compose --profile production up -d

echo.
echo Waiting for application to start...
timeout /t 10

echo.
echo Application should be running on http://localhost:5173
echo.
echo To share with client, run in another terminal:
echo ngrok http 5173
echo.
echo Press any key to open browser...
pause
start http://localhost:5173