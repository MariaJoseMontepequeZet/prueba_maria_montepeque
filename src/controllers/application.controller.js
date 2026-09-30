const applicationService = require('../services/application.service');
const { sendJson } = require('../http/response');

const create = async (req, res) => {
  const application = await applicationService.createApplication(req.validated.body);
  sendJson(res, 201, application, { Location: `/applications/${application.id}` });
};

const list = async (req, res) => {
  const applications = await applicationService.listApplications(req.validated.query);
  sendJson(res, 200, { total: applications.length, data: applications });
};

const updateStatus = async (req, res) => {
  const application = await applicationService.updateApplicationStatus(req.validated.params.id, req.validated.body.status);
  sendJson(res, 200, application);
};

module.exports = { create, list, updateStatus };
