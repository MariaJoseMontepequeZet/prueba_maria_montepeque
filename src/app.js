const http = require('node:http');
const router = require('./routes');
const AppError = require('./utils/AppError');
const { parseJsonBody } = require('./http/request');
const { handleError } = require('./http/errorHandler');

const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'];

const handleRequest = async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const route = router.match(req.method, url.pathname);
    if (!route.handlers) {
      if (route.allowed.length) throw AppError.methodNotAllowed(`Método ${req.method} no permitido en ${url.pathname}`);
      throw AppError.notFound(`Ruta ${req.method} ${url.pathname} no encontrada`);
    }
    req.params = route.params;
    req.query = Object.fromEntries(url.searchParams);
    req.body = METHODS_WITH_BODY.includes(req.method) ? await parseJsonBody(req) : undefined;
    for (const handler of route.handlers) await handler(req, res);
  } catch (error) {
    handleError(error, res);
  }
};

const createServer = () => http.createServer(handleRequest);

module.exports = { createServer };
