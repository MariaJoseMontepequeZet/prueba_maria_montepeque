const findById = async (executor, id) => {
  const [rows] = await executor.execute(
    'SELECT id, title, min_years_experience AS minYearsExperience, status FROM vacancies WHERE id = ?',
    [id],
  );
  return rows[0] ?? null;
};

module.exports = { findById };
