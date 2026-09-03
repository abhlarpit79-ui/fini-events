@echo off
title FINI Events - local demo
cd /d "%~dp0"
echo.
echo  FINI Events - starting local demo in: %CD%
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js is not installed. Download the LTS version from https://nodejs.org and run this file again.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo  First run: installing packages, this takes 1-2 minutes...
  call npm install
  if errorlevel 1 (
    echo  npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
echo.
echo  Opening http://localhost:3000 in your browser (wait ~10 seconds for the first page).
echo  Keep this window open. Press Ctrl+C here to stop the server.
echo.
start "" http://localhost:3000
call npm run demo
pause
