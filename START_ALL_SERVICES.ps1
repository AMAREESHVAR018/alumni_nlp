# =====================================================================
# START_ALL_SERVICES.ps1
# 
# This script launches all three components of the Alumni Chat System
# in separate terminal windows.
# =====================================================================

$ProjectRoot = $PSScriptRoot

Clear-Host
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "    STARTING ALUMNI CHAT SYSTEM SERVICES" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start NLP Service
Write-Host "[1/3] Starting NLP Service (Port 5001)..." -ForegroundColor Yellow
$nlpCmd = "cd '$ProjectRoot\nlp-service'; if (-not (Test-Path '.venv')) { python -m venv .venv }; & '.\.venv\Scripts\activate.ps1'; pip install -r requirements.txt; python app.py"
Start-Process "powershell.exe" -ArgumentList "-NoExit -Command `"$nlpCmd`""

Start-Sleep -Seconds 2 # Give NLP a moment to initialize

# 2. Start Backend Server
Write-Host "[2/3] Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
$backendCmd = "cd '$ProjectRoot\server'; npm run dev"
Start-Process "powershell.exe" -ArgumentList "-NoExit -Command `"$backendCmd`""

Start-Sleep -Seconds 2 # Give backend a moment to initialize

# 3. Start Frontend App
Write-Host "[3/3] Starting Frontend React App (Port 3000)..." -ForegroundColor Yellow
$frontendCmd = "cd '$ProjectRoot\client'; npm start"
Start-Process "powershell.exe" -ArgumentList "-NoExit -Command `"$frontendCmd`""

Write-Host ""
Write-Host "All services have been launched in separate windows!" -ForegroundColor Green
Write-Host "-----------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Frontend URL: http://localhost:3000" -ForegroundColor White
Write-Host "Backend API:  http://localhost:5000/api" -ForegroundColor White
Write-Host "NLP API:      http://localhost:5001" -ForegroundColor White
Write-Host "-----------------------------------------------------------" -ForegroundColor Cyan
Write-Host "To stop the services, simply close the three opened windows." -ForegroundColor Gray
Write-Host ""