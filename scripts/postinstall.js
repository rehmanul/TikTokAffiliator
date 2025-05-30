import { execSync } from 'child_process';
import { existsSync } from 'fs';

try {
  execSync('npm run install-chrome', { stdio: 'inherit' });
} catch (err) {
  console.error('Failed to install Chrome:', err);
}

const vitePath = 'node_modules/.bin/vite';
if (existsSync(vitePath)) {
  try {
    execSync('npm run build-only', { stdio: 'inherit' });
  } catch (err) {
    console.error('Build failed:', err);
    process.exitCode = 1;
  }
} else {
  console.log('Skipping build step because dev dependencies are not installed.');
}
