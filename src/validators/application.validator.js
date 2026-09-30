const { SOURCES, APPLICATION_STATUSES } = require('../constants/enums');

const MAX_COVER_LETTER_LENGTH = 5000;

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;
const parseIdParam = (value) => (/^\d+$/.test(value ?? '') ? Number(value) : NaN);
const error = (field, message) => ({ field, message });

const rejectUnknownFields = (body, allowed) => Object.keys(body)
  .filter((key) => !allowed.includes(key))
  .map((key) => error(key, 'Campo no permitido'));

const validateEnum = (value, allowed, field) => (allowed.includes(value)
  ? []
  : [error(field, `${field} debe ser uno de: ${allowed.join(', ')}`)]);

const validateCreateApplication = (body) => {
  if (!isPlainObject(body)) return { errors: [error('body', 'Se requiere un objeto JSON')] };
  const { candidateId, vacancyId, source, coverLetter } = body;
  const errors = rejectUnknownFields(body, ['candidateId', 'vacancyId', 'source', 'coverLetter']);

  if (!isPositiveInteger(candidateId)) errors.push(error('candidateId', 'candidateId es obligatorio y debe ser un entero positivo'));
  if (!isPositiveInteger(vacancyId)) errors.push(error('vacancyId', 'vacancyId es obligatorio y debe ser un entero positivo'));
  errors.push(...validateEnum(source, SOURCES, 'source'));

  const letter = typeof coverLetter === 'string' ? coverLetter.trim() : '';
  if (typeof coverLetter !== 'string') errors.push(error('coverLetter', 'coverLetter es obligatorio y debe ser texto'));
  else if (!letter) errors.push(error('coverLetter', 'coverLetter no puede estar vacío'));
  else if (letter.length > MAX_COVER_LETTER_LENGTH) errors.push(error('coverLetter', `coverLetter no puede superar ${MAX_COVER_LETTER_LENGTH} caracteres`));

  return { errors, data: { candidateId, vacancyId, source, coverLetter: letter } };
};

const validateListQuery = (query) => {
  const errors = [];
  const data = {};
  if (query.status !== undefined) {
    errors.push(...validateEnum(query.status, APPLICATION_STATUSES, 'status'));
    data.status = query.status;
  }
  if (query.vacancyId !== undefined) {
    data.vacancyId = parseIdParam(query.vacancyId);
    if (!isPositiveInteger(data.vacancyId)) errors.push(error('vacancyId', 'vacancyId debe ser un entero positivo'));
  }
  return { errors, data };
};

const validateIdParams = (params) => {
  const id = parseIdParam(params.id);
  return { errors: isPositiveInteger(id) ? [] : [error('id', 'id debe ser un entero positivo')], data: { id } };
};

const validateUpdateStatus = (body) => {
  if (!isPlainObject(body)) return { errors: [error('body', 'Se requiere un objeto JSON')] };
  const errors = [...rejectUnknownFields(body, ['status']), ...validateEnum(body.status, APPLICATION_STATUSES, 'status')];
  return { errors, data: { status: body.status } };
};

module.exports = { validateCreateApplication, validateListQuery, validateIdParams, validateUpdateStatus };
