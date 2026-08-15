import fs from 'node:fs';
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const nvm = fs.readFileSync('.nvmrc','utf8').trim();
const nodeVersion = fs.readFileSync('.node-version','utf8').trim();
const failures=[];
if (nvm !== '26.5.0') failures.push(`.nvmrc=${nvm}`);
if (nodeVersion !== '26.5.0') failures.push(`.node-version=${nodeVersion}`);
if (pkg.packageManager !== 'pnpm@11.21.0') failures.push(`packageManager=${pkg.packageManager}`);
if (pkg.engines?.node !== '>=24.18.0 <27') failures.push(`engines.node=${pkg.engines?.node}`);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('node-nvm-production-check PASS');
