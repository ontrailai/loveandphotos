import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvPath = path.join(__dirname, '../public/data/uszips.csv');
const jsonPath = path.join(__dirname, '../public/data/uszips.json');

console.log('Reading CSV file...');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const headers = lines[0].replace(/"/g, '').split(',');

const zipData = [];
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Parse CSV line (handle quoted fields with commas)
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  
  // Create zip object with only needed fields
  const zip = values[0];
  const city = values[3];
  const state = values[4];
  const stateName = values[5];
  const lat = parseFloat(values[1]);
  const lng = parseFloat(values[2]);
  const population = parseInt(values[8]) || 0;
  
  // Skip territories for now (PR, VI, etc.) - optional
  // if (!['PR', 'VI', 'GU', 'AS', 'MP'].includes(state)) {
    zipData.push({
      zip,
      city,
      state,
      stateName,
      lat,
      lng,
      population
    });
  // } else {
  //   skipped++;
  // }
}

console.log(`Processed ${zipData.length} zip codes`);
if (skipped > 0) console.log(`Skipped ${skipped} territory zip codes`);

// Sort by zip code
zipData.sort((a, b) => a.zip.localeCompare(b.zip));

// Write optimized JSON
console.log('Writing JSON file...');
fs.writeFileSync(jsonPath, JSON.stringify(zipData));

// Also create a smaller version for quick loading (top cities only)
const majorCities = zipData
  .filter(z => z.population > 10000)
  .sort((a, b) => b.population - a.population)
  .slice(0, 1000);

const quickJsonPath = path.join(__dirname, '../public/data/uszips-quick.json');
fs.writeFileSync(quickJsonPath, JSON.stringify(majorCities));

console.log(`✅ Conversion complete!`);
console.log(`   - Full database: ${zipData.length} zip codes (${(fs.statSync(jsonPath).size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`   - Quick database: ${majorCities.length} major zip codes (${(fs.statSync(quickJsonPath).size / 1024).toFixed(2)} KB)`);