#!/bin/bash

# Create project directory in Ubuntu home
rm -rf ~/TikTokAffiliator
mkdir -p ~/TikTokAffiliator

# Copy project files
cp -r /mnt/c/Users/HP/Desktop/TikTokAffiliator/* ~/TikTokAffiliator/

# Navigate to project directory
cd ~/TikTokAffiliator

# Install dependencies and start server
npm install && npm run dev
