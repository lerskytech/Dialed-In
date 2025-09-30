const serverless = require('serverless-http');
const { app } = require('../../../backend/auth.js');

module.exports.handler = serverless(app);
