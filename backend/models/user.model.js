const pool = require('../db/Connect_to_sql');
const bcrypt = require('bcryptjs');

exports.findByEmail = async (email) => {
  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

exports.create = async (userData) => {
  try {
    const { fullName, email, phone, password } = userData;

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (full_name, email, phone, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, phone, created_at
    `;
    const values = [fullName, email, phone, passwordHash];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

exports.validatePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

exports.findById = async (id) => {
  try {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by id:', error);
    throw error;
  }
};

// Google OAuth methods
exports.findByGoogleId = async (googleId) => {
  try {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await pool.query(query, [googleId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by Google ID:', error);
    throw error;
  }
};

exports.createFromGoogle = async (userData) => {
  try {
    const { googleId, fullName, email, profilePicture } = userData;

    const query = `
      INSERT INTO users (full_name, email, google_id, profile_picture)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, google_id, profile_picture, created_at
    `;
    const values = [fullName, email, googleId, profilePicture];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user from Google:', error);
    throw error;
  }
};

exports.updateGoogleId = async (userId, googleId) => {
  try {
    const query = `
      UPDATE users 
      SET google_id = $1
      WHERE id = $2
      RETURNING id, full_name, email, google_id, created_at
    `;
    const result = await pool.query(query, [googleId, userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating user Google ID:', error);
    throw error;
  }
};
