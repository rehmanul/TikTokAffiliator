@echo off
echo Starting TikTok Affiliator in Ubuntu...

REM Create a fresh copy in Ubuntu home directory
wsl -e rm -rf ~/TikTokAffiliator
wsl -e mkdir -p ~/TikTokAffiliator
wsl -e cp -r ./* ~/TikTokAffiliator/

REM Navigate to project directory and install dependencies
wsl -e bash -ic "cd ~/TikTokAffiliator && npm install && npm run dev"

pause
