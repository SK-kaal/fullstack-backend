const dotenv = require('dotenv');

dotenv.config();

const parseAllowedOrigins = () => {
  if (!process.env.ALLOWED_ORIGINS) {
    return '*';
  }
  return process.env.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI,
  dbName: process.env.DB_NAME || 'after_school',
  allowedOrigins: parseAllowedOrigins(),
};

if (!config.mongoUri) {
  throw new Error('Missing MONGODB_URI. Set it in your environment variables.');
}

module.exports = config;
