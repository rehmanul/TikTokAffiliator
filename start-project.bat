@echo off
echo Starting TikTok Affiliator setup...

REM Create a fresh copy in Ubuntu home directory
echo Creating fresh copy in Ubuntu...
wsl -e rm -rf ~/TikTokAffiliator
wsl -e mkdir -p ~/TikTokAffiliator
wsl -e cp -r ./* ~/TikTokAffiliator/

REM Navigate to project directory and install dependencies
echo Installing dependencies...
wsl -e bash -ic "cd ~/TikTokAffiliator && npm install"

REM Start the development server
echo Starting development server...
wsl -e bash -ic "cd ~/TikTokAffiliator && npm run dev"

pause
