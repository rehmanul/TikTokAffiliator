import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

const distFile = resolve('dist/index.js');
if (!existsSync(distFile)) {
  console.log('dist/index.js not found, running build...');
  execSync('npm run build-only', { stdio: 'inherit' });
}
await import(pathToFileURL(distFile));

