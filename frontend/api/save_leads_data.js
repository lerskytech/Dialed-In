// Simple script to help save leads data
// Usage: node save_leads_data.js

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Paste your complete JSON leads data below and press Enter twice when done:');
console.log('(The data should start with [ and end with ])');
console.log('');

let jsonData = '';
let emptyLineCount = 0;

rl.on('line', (line) => {
  if (line.trim() === '') {
    emptyLineCount++;
    if (emptyLineCount >= 2) {
      // Try to parse and save the JSON
      try {
        const leadsData = JSON.parse(jsonData);
        fs.writeFileSync('user_leads.json', JSON.stringify(leadsData, null, 2));
        console.log(`\nSuccessfully saved ${leadsData.length} leads to user_leads.json`);
        console.log('You can now run: node import_leads.js');
        rl.close();
      } catch (error) {
        console.error('Error parsing JSON:', error.message);
        console.log('Please check your JSON format and try again.');
        rl.close();
      }
    }
  } else {
    jsonData += line + '\n';
    emptyLineCount = 0;
  }
});

rl.on('close', () => {
  process.exit(0);
});
