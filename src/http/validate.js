const AppError = require('../utils/AppError');

const validate = (validators) => (req) => {
  req.validated = {};
  const errors = [];
  for (const [key, validator] of Object.entries(validators)) {
    const result = validator(req[key]);
    errors.push(...result.errors);
    req.validated[key] = result.data;
  }
  if (errors.length) throw AppError.badRequest('Datos de entrada inválidos', errors);
};

module.exports = validate;
