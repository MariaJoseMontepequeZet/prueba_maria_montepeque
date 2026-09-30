const fs = require('node:fs');
const path = require('node:path');

const ENV_FILE = path.resolve(__dirname, '../../.env');

const loadEnvFile = (file) => {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][\w.]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, value] = match;
    if (process.env[key] === undefined) process.env[key] = value.replace(/^(['"])(.*)\1$/, '$2');
  }
};

loadEnvFile(ENV_FILE);

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);

module.exports = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME,
    connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
  },
});
