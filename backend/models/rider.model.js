const pool = require('../db/Connect_to_sql');
const bcrypt = require('bcryptjs');

exports.findByEmail = async (email) => {
  try {
    const query = 'SELECT * FROM riders WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding rider by email:', error);
    throw error;
  }
};

exports.create = async (riderData) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      profilePhoto,
      licenseNumber,
      vehicle
    } = riderData;

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO riders (
        first_name, last_name, email, phone, password_hash,
        profile_photo, license_number, vehicle_plate, vehicle_color,
        vehicle_capacity, vehicle_type, vehicle_model
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, first_name, last_name, email, phone, created_at
    `;
    const values = [
      firstName, lastName, email, phone, passwordHash,
      profilePhoto, licenseNumber, vehicle.plate, vehicle.color,
      parseInt(vehicle.capacity), vehicle.type, vehicle.model
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating rider:', error);
    throw error;
  }
};

exports.validatePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

exports.findById = async (id) => {
  try {
    const query = 'SELECT * FROM riders WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding rider by id:', error);
    throw error;
  }
};