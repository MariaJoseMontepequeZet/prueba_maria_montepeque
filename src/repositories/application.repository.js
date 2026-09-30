const { pool } = require('../config/db');
const { REAPPLY_WAITING_DAYS } = require('../constants/enums');

const BASE_SELECT = `
  SELECT a.id, a.cover_letter, a.source, a.score, a.priority, a.status, a.created_at, a.status_updated_at,
         c.id AS candidate_id, c.name AS candidate_name, c.email AS candidate_email,
         v.id AS vacancy_id, v.title AS vacancy_title
  FROM applications a
  INNER JOIN candidates c ON c.id = a.candidate_id
  INNER JOIN vacancies v ON v.id = a.vacancy_id`;

const toApplication = (row) => ({
  id: row.id,
  candidate: { id: row.candidate_id, name: row.candidate_name, email: row.candidate_email },
  vacancy: { id: row.vacancy_id, title: row.vacancy_title },
  coverLetter: row.cover_letter,
  source: row.source,
  score: row.score,
  priority: row.priority,
  status: row.status,
  createdAt: row.created_at,
  statusUpdatedAt: row.status_updated_at,
});

const findAll = async ({ status, vacancyId } = {}) => {
  const conditions = [];
  const params = [];
  if (status) { conditions.push('a.status = ?'); params.push(status); }
  if (vacancyId) { conditions.push('a.vacancy_id = ?'); params.push(vacancyId); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute(`${BASE_SELECT} ${where} ORDER BY a.score DESC, a.created_at ASC, a.id ASC`, params);
  return rows.map(toApplication);
};

const findById = async (executor, id) => {
  const [rows] = await executor.execute(`${BASE_SELECT} WHERE a.id = ?`, [id]);
  return rows[0] ? toApplication(rows[0]) : null;
};

const findBlockingApplication = async (executor, candidateId, vacancyId) => {
  const [rows] = await executor.execute(
    `SELECT id, status, DATE_ADD(status_updated_at, INTERVAL ? DAY) AS availableAt
     FROM applications
     WHERE candidate_id = ? AND vacancy_id = ?
       AND (status IN ('RECEIVED', 'IN_REVIEW', 'HIRED')
            OR (status = 'REJECTED' AND status_updated_at > UTC_TIMESTAMP() - INTERVAL ? DAY))
     ORDER BY FIELD(status, 'HIRED', 'IN_REVIEW', 'RECEIVED', 'REJECTED')
     LIMIT 1`,
    [REAPPLY_WAITING_DAYS, candidateId, vacancyId, REAPPLY_WAITING_DAYS],
  );
  return rows[0] ?? null;
};

const countActiveInOtherVacancies = async (executor, candidateId, vacancyId) => {
  const [rows] = await executor.execute(
    `SELECT COUNT(*) AS total FROM applications
     WHERE candidate_id = ? AND vacancy_id <> ? AND status IN ('RECEIVED', 'IN_REVIEW')`,
    [candidateId, vacancyId],
  );
  return Number(rows[0].total);
};

const create = async (executor, { candidateId, vacancyId, coverLetter, source, score, priority, status }) => {
  const [result] = await executor.execute(
    `INSERT INTO applications (candidate_id, vacancy_id, cover_letter, source, score, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [candidateId, vacancyId, coverLetter, source, score, priority, status],
  );
  return result.insertId;
};

const updateStatusIfActive = async (executor, id, status) => {
  const [result] = await executor.execute(
    `UPDATE applications SET status = ?, status_updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status IN ('RECEIVED', 'IN_REVIEW') AND status <> ?`,
    [status, id, status],
  );
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findById,
  findBlockingApplication,
  countActiveInOtherVacancies,
  create,
  updateStatusIfActive,
};
