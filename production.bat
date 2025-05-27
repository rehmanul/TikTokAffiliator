@echo off
echo TikTok Affiliator - Production Build and Deploy
echo ==========================================
echo.

REM Check if WSL is installed
wsl -l >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Windows Subsystem for Linux (WSL) is not installed.
    echo Please install WSL and Ubuntu from the Microsoft Store first.
    pause
    exit /b 1
)

echo Step 1: Installing production dependencies...
wsl -e bash -c "cd /mnt/c/Users/HP/Desktop/TikTokAffiliator && npm install --production"

echo Step 2: Setting up production environment...
wsl -e bash -c "cd /mnt/c/Users/HP/Desktop/TikTokAffiliator && export NODE_ENV=production"

echo Step 3: Building for production...
wsl -e bash -c "cd /mnt/c/Users/HP/Desktop/TikTokAffiliator && npm run build"

echo Step 4: Starting production server...
wsl -e bash -c "cd /mnt/c/Users/HP/Desktop/TikTokAffiliator && node dist/index.js"

pause
