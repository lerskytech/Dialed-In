const app = require('../api/index');
const database = require('../api/database');

let isDbInitialized = false;

async function initialize() {
  if (!isDbInitialized) {
    await database.initDb();
    isDbInitialized = true;
  }
  return app;
}

module.exports = initialize;
