const { withTransaction, pool } = require('../config/db');
const AppError = require('../utils/AppError');
const candidateRepository = require('../repositories/candidate.repository');
const vacancyRepository = require('../repositories/vacancy.repository');
const applicationRepository = require('../repositories/application.repository');
const { evaluateApplication } = require('./scoring.service');
const { VACANCY_STATUS, FINAL_STATUSES } = require('../constants/enums');

const INITIAL_STATUS = 'RECEIVED';

const assertNotDuplicated = (blocking) => {
  if (!blocking) return;
  if (blocking.status === 'REJECTED') {
    throw AppError.conflict(`La postulación anterior fue rechazada; puede volver a postularse a partir de ${blocking.availableAt.toISOString()}`);
  }
  throw AppError.conflict(`El candidato ya tiene una postulación en estado ${blocking.status} para esta vacante`);
};

const createApplication = ({ candidateId, vacancyId, source, coverLetter }) =>
  withTransaction(async (connection) => {
    const candidate = await candidateRepository.findByIdForUpdate(connection, candidateId);
    if (!candidate) throw AppError.notFound(`El candidato ${candidateId} no existe`);

    const vacancy = await vacancyRepository.findById(connection, vacancyId);
    if (!vacancy) throw AppError.notFound(`La vacante ${vacancyId} no existe`);
    if (vacancy.status !== VACANCY_STATUS.OPEN) throw AppError.conflict(`La vacante ${vacancyId} no está abierta`);

    assertNotDuplicated(await applicationRepository.findBlockingApplication(connection, candidateId, vacancyId));

    const activeApplicationsInOtherVacancies = await applicationRepository.countActiveInOtherVacancies(connection, candidateId, vacancyId);
    const { score, priority } = evaluateApplication({
      candidateYears: candidate.yearsExperience,
      requiredYears: vacancy.minYearsExperience,
      source,
      coverLetter,
      activeApplicationsInOtherVacancies,
    });

    const id = await applicationRepository.create(connection, {
      candidateId, vacancyId, coverLetter, source, score, priority, status: INITIAL_STATUS,
    });
    return applicationRepository.findById(connection, id);
  });

const listApplications = (filters) => applicationRepository.findAll(filters);

const updateApplicationStatus = async (id, status) => {
  const updated = await applicationRepository.updateStatusIfActive(pool, id, status);
  const application = await applicationRepository.findById(pool, id);
  if (!application) throw AppError.notFound(`La postulación ${id} no existe`);
  if (updated) return application;
  if (FINAL_STATUSES.includes(application.status)) {
    throw AppError.conflict(`La postulación está en estado final ${application.status} y no puede cambiar`);
  }
  throw AppError.conflict(`La postulación ya se encuentra en estado ${status}`);
};

module.exports = { createApplication, listApplications, updateApplicationStatus };
