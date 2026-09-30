const { createRouter } = require('./http/router');
const { sendJson } = require('./http/response');
const validate = require('./http/validate');
const controller = require('./controllers/application.controller');
const validators = require('./validators/application.validator');

const router = createRouter();

router.get('/health', (_req, res) => sendJson(res, 200, { status: 'ok' }));
router.post('/applications', validate({ body: validators.validateCreateApplication }), controller.create);
router.get('/applications', validate({ query: validators.validateListQuery }), controller.list);
router.put(
  '/applications/:id/status',
  validate({ params: validators.validateIdParams, body: validators.validateUpdateStatus }),
  controller.updateStatus,
);

module.exports = router;
