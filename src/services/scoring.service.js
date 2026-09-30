const { PRIORITIES } = require('../constants/enums');

const RULES = Object.freeze({
  EXPERIENCE_MET: 4,
  REFERRAL: 3,
  INTERNAL: 2,
  KEYWORDS: 2,
  LONG_COVER_LETTER: 1,
  ACTIVE_APPLICATIONS_PENALTY: -2,
});
const KEYWORDS = Object.freeze(['node', 'sql', 'api']);
const LONG_COVER_LETTER_MIN_LENGTH = 500;
const ACTIVE_APPLICATIONS_THRESHOLD = 3;
const SOURCE_POINTS = Object.freeze({ REFERRAL: RULES.REFERRAL, INTERNAL: RULES.INTERNAL });

const containsKeyword = (text) => {
  const normalized = text.toLowerCase();
  return KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const calculateScore = ({ candidateYears, requiredYears, source, coverLetter = '', activeApplicationsInOtherVacancies = 0 }) => {
  let score = 0;
  if (candidateYears >= requiredYears) score += RULES.EXPERIENCE_MET;
  score += SOURCE_POINTS[source] ?? 0;
  if (containsKeyword(coverLetter)) score += RULES.KEYWORDS;
  if (coverLetter.length > LONG_COVER_LETTER_MIN_LENGTH) score += RULES.LONG_COVER_LETTER;
  if (activeApplicationsInOtherVacancies >= ACTIVE_APPLICATIONS_THRESHOLD) score += RULES.ACTIVE_APPLICATIONS_PENALTY;
  return Math.max(0, score);
};

const resolvePriority = (score) => {
  if (score >= 7) return PRIORITIES.TOP;
  if (score >= 5) return PRIORITIES.HIGH;
  if (score >= 3) return PRIORITIES.MEDIUM;
  return PRIORITIES.LOW;
};

const evaluateApplication = (input) => {
  const score = calculateScore(input);
  return { score, priority: resolvePriority(score) };
};

module.exports = { calculateScore, resolvePriority, evaluateApplication, RULES };
