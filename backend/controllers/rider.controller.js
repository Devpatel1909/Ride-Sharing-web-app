const Rider = require('../models/rider.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.signup = async (req, res) => {
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
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if rider already exists
    const existingRider = await Rider.findByEmail(email);
    if (existingRider) {
      return res.status(400).json({ message: 'Rider with this email already exists' });
    }

    // Create rider
    const newRider = await Rider.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      profilePhoto,
      licenseNumber,
      vehicle
    });

    // Generate JWT token
    const token = jwt.sign(
      { riderId: newRider.id, email: newRider.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(201).json({
      message: 'Rider created successfully',
      rider: {
        id: newRider.id,
        firstName: newRider.first_name,
        lastName: newRider.last_name,
        email: newRider.email,
        phone: newRider.phone
      },
      token
    });
  } catch (error) {
    console.error('Rider signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find rider
    const rider = await Rider.findByEmail(email);
    if (!rider) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Validate password
    const isValidPassword = await Rider.validatePassword(password, rider.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { riderId: rider.id, email: rider.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.json({
      message: 'Login successful',
      rider: {
        id: rider.id,
        firstName: rider.first_name,
        lastName: rider.last_name,
        email: rider.email,
        phone: rider.phone
      },
      token
    });
  } catch (error) {
    console.error('Rider login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const riderId = req.rider.riderId;
    const rider = await Rider.findById(riderId);

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    const { password_hash: _, ...riderWithoutPassword } = rider;
    res.json({ rider: riderWithoutPassword });
  } catch (error) {
    console.error('Get rider profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};