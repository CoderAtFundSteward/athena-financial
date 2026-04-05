import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'client', 'dist');
const pub = path.join(root, 'public');

if (!fs.existsSync(dist)) {
  console.error('Missing client/dist. Run npm run build:client first.');
  process.exit(1);
}

fs.mkdirSync(pub, { recursive: true });
for (const name of fs.readdirSync(pub)) {
  if (name === '.gitkeep') continue;
  fs.rmSync(path.join(pub, name), { recursive: true, force: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

for (const name of fs.readdirSync(dist)) {
  copyRecursive(path.join(dist, name), path.join(pub, name));
}

console.log('Synced client/dist -> public/ for Vercel static assets.');
