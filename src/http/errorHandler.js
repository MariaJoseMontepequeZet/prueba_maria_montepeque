const AppError = require('../utils/AppError');
const { sendJson } = require('./response');

const handleError = (error, res) => {
  if (error instanceof AppError) {
    return sendJson(res, error.statusCode, { error: error.message, ...(error.details && { details: error.details }) });
  }
  console.error(error);
  return sendJson(res, 500, { error: 'Error interno del servidor' });
};

module.exports = { handleError };
