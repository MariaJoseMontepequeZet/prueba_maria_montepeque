const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculateScore, resolvePriority, evaluateApplication } = require('../src/services/scoring.service');

const baseInput = {
  candidateYears: 0,
  requiredYears: 3,
  source: 'OTHER',
  coverLetter: 'Motivated professional',
  activeApplicationsInOtherVacancies: 0,
};

describe('scoring.service', () => {
  it('suma todas las reglas positivas del ejemplo oficial y asigna TOP', () => {
    const result = evaluateApplication({
      ...baseInput,
      candidateYears: 4,
      source: 'REFERRAL',
      coverLetter: 'I have four years of experience building REST APIs with Node.js and SQL databases',
    });
    assert.deepEqual(result, { score: 9, priority: 'TOP' });
  });

  it('detecta palabras clave sin importar mayúsculas y suma una sola vez', () => {
    assert.equal(calculateScore({ ...baseInput, coverLetter: 'NODE, Sql y Api' }), 2);
    assert.equal(calculateScore({ ...baseInput, coverLetter: 'Python developer' }), 0);
  });

  it('suma por carta larga solo si supera 500 caracteres', () => {
    assert.equal(calculateScore({ ...baseInput, coverLetter: 'x'.repeat(500) }), 0);
    assert.equal(calculateScore({ ...baseInput, coverLetter: 'x'.repeat(501) }), 1);
  });

  it('aplica la experiencia cuando es igual al mínimo y distingue la fuente', () => {
    assert.equal(calculateScore({ ...baseInput, candidateYears: 3 }), 4);
    assert.equal(calculateScore({ ...baseInput, source: 'INTERNAL' }), 2);
    assert.equal(calculateScore({ ...baseInput, source: 'JOB_BOARD' }), 0);
  });

  it('penaliza con 3 o más postulaciones activas y nunca retorna negativo', () => {
    assert.equal(calculateScore({ ...baseInput, source: 'REFERRAL', activeApplicationsInOtherVacancies: 2 }), 3);
    assert.equal(calculateScore({ ...baseInput, source: 'REFERRAL', activeApplicationsInOtherVacancies: 3 }), 1);
    assert.equal(calculateScore({ ...baseInput, activeApplicationsInOtherVacancies: 5 }), 0);
  });

  it('resuelve la prioridad en los límites de cada rango', () => {
    const cases = [[0, 'LOW'], [2, 'LOW'], [3, 'MEDIUM'], [4, 'MEDIUM'], [5, 'HIGH'], [6, 'HIGH'], [7, 'TOP'], [12, 'TOP']];
    for (const [score, expected] of cases) assert.equal(resolvePriority(score), expected, `score ${score}`);
  });
});
