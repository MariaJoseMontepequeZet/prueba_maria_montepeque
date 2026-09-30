const AppError = require('../utils/AppError');

const MAX_BODY_BYTES = 100 * 1024;

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      req.removeAllListeners('data');
      req.resume();
      reject(AppError.payloadTooLarge('El cuerpo de la solicitud supera 100 KB'));
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

const parseJsonBody = async (req) => {
  const raw = await readBody(req);
  if (!raw.trim()) return undefined;
  if (!(req.headers['content-type'] ?? '').includes('application/json')) {
    throw AppError.unsupportedMediaType('El Content-Type debe ser application/json');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw AppError.badRequest('El cuerpo de la solicitud no es un JSON válido');
  }
};

module.exports = { parseJsonBody };
