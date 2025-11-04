const app = require('./index');
const database = require('./database');

let isDbInitialized = false;

async function initialize() {
  if (!isDbInitialized) {
    await database.initDb();
    isDbInitialized = true;
  }
  return app;
}

module.exports = initialize;
