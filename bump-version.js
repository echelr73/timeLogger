const path = require('path');
const fs = require('fs');

const packageJsonPath = path.resolve(__dirname, 'package.json');
const manifestPath = path.resolve(__dirname, 'public', 'manifest.webmanifest'); // <- carpeta correcta

// --- Leer package.json ---
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let [major, minor, patch] = packageJson.version.split('.').map(Number);

// Incrementar patch
patch += 1;
const newVersion = [major, minor, patch].join('.');
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log(`package.json actualizado a v${newVersion}`);

// Actualizar manifest
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = newVersion;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`public/manifest.webmanifest actualizado a v${newVersion}`);
} else {
  console.warn('No se encontró public/manifest.webmanifest, saltando actualización');
}
