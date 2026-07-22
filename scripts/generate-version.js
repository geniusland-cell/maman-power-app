import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Générer un timestamp unique pour chaque build
const version = new Date().getTime().toString();

// Chemin vers le manifest.json
const manifestPath = path.join(__dirname, "../public/manifest.json");

// Lire le manifest actuel
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// Mettre à jour la version
manifest.version = version;

// Écrire le manifest mis à jour
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Version générée: ${version}`);
