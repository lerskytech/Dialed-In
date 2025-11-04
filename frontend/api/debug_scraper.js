require('dotenv').config();
const { scrapeLeads } = require('./scraper');

(async () => {
  console.log('--- Running Scraper in Debug Mode ---');
  // Using the same test case that was failing
  const city = 'miami';
  const category = 'HVAC';

  const leads = await scrapeLeads(city, category);
  console.log(`Scraping finished. Found ${leads.length} leads.`);

  console.log('--- Debug Scraper Finished ---');
  console.log('Check for a debug.html file in the backend directory.');
})();
