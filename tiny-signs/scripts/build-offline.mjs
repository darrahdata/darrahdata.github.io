import { readFile, writeFile, rename, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await rename('dist/dev.html','dist/index.html');
const html = await readFile('dist/index.html','utf8');
const assets = (await readdir('dist/assets')).map(name => `assets/${name}`);
const version = createHash('sha256').update(html).digest('hex').slice(0,12);
const template = await readFile('scripts/sw-template.js','utf8');
await writeFile('dist/sw.js',template.replace('__SHELL_VERSION__',version).replace('__PRECACHE__',JSON.stringify(['index.html','manifest.webmanifest','icon.svg','credits.html',...assets])));
