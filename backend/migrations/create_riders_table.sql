-- Create riders table for driver/rider authentication and profile
-- This table stores rider (driver) information including vehicle details

CREATE TABLE IF NOT EXISTS riders (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  profile_photo TEXT,
  license_number VARCHAR(50),
  vehicle_plate VARCHAR(20),
  vehicle_color VARCHAR(50),
  vehicle_capacity INTEGER,
  vehicle_type VARCHAR(50),
  vehicle_model VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_riders_email ON riders(email);
CREATE INDEX IF NOT EXISTS idx_riders_license ON riders(license_number);
CREATE INDEX IF NOT EXISTS idx_riders_vehicle_plate ON riders(vehicle_plate);

-- Add comments
COMMENT ON TABLE riders IS 'Stores rider (driver) information including vehicle details';
COMMENT ON COLUMN riders.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN riders.profile_photo IS 'Base64 encoded profile photo or URL';
COMMENT ON COLUMN riders.is_active IS 'Whether the rider account is active';
COMMENT ON COLUMN riders.rating IS 'Average rider rating (1-5)';
COMMENT ON COLUMN riders.total_rides IS 'Total number of completed rides';
