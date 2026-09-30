const findByIdForUpdate = async (executor, id) => {
  const [rows] = await executor.execute(
    'SELECT id, name, email, years_experience AS yearsExperience FROM candidates WHERE id = ? FOR UPDATE',
    [id],
  );
  return rows[0] ?? null;
};

module.exports = { findByIdForUpdate };
