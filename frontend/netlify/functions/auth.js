const serverless = require('serverless-http');
const initialize = require('../../api/server');

module.exports.handler = async (event, context) => {
  const app = await initialize();
  const handler = serverless(app);
  return await handler(event, context);
};
