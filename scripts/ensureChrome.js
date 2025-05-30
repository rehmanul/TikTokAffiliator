import { existsSync } from 'fs';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';

export function ensureChromeInstalled() {
  const chromePath = puppeteer.executablePath();
  if (!existsSync(chromePath)) {
    console.log('Chrome binary not found. Installing Chrome for Puppeteer...');
    execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
  }
}
