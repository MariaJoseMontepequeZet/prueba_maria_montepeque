const mysql = require('mysql2/promise');
const { db } = require('./env');

const pool = mysql.createPool({ ...db, waitForConnections: true, timezone: 'Z' });

pool.pool.on('connection', (connection) => connection.query("SET time_zone = '+00:00'"));

const withTransaction = async (work) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { pool, withTransaction };
