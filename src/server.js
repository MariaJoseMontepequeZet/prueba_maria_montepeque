const { createServer } = require('./app');
const { port } = require('./config/env');
const { pool } = require('./config/db');

const listen = (server) => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(port, resolve);
});

const describeError = (error) => (error.code === 'EADDRINUSE' ? `el puerto ${port} ya está en uso` : error.message);

const start = async () => {
  await pool.query('SELECT 1');
  const server = createServer();
  await listen(server);
  console.log(`API escuchando en http://localhost:${port}`);
  const shutdown = () => server.close(() => pool.end().finally(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start().catch(async (error) => {
  console.error('No se pudo iniciar la aplicación:', describeError(error));
  await pool.end().catch(() => {});
  process.exit(1);
});
