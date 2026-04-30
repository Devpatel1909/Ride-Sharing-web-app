-- Migration: Add shared ride support with ride_passengers junction table
-- This migration adds the ability to link multiple passengers to a single ride

-- Create passenger_status enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'passenger_status') THEN
    CREATE TYPE passenger_status AS ENUM ('pending', 'accepted', 'picked_up', 'dropped_off', 'cancelled');
  END IF;
END
$$;

-- Create ride_passengers table to link multiple passengers to a single ride
CREATE TABLE IF NOT EXISTS ride_passengers (
  id SERIAL PRIMARY KEY,
  ride_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_location VARCHAR(500) NOT NULL,
  dropoff_location VARCHAR(500) NOT NULL,
  pickup_lat FLOAT,
  pickup_lng FLOAT,
  dropoff_lat FLOAT,
  dropoff_lng FLOAT,
  passenger_status passenger_status DEFAULT 'pending',
  fare_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ride_id, passenger_id)
);

-- Create indexes for ride_passengers table
CREATE INDEX IF NOT EXISTS idx_ride_passengers_ride ON ride_passengers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_passenger ON ride_passengers(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_status ON ride_passengers(passenger_status);

-- Add columns to rides table for multi-passenger support if they don't exist
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS max_passengers INT DEFAULT 4,
ADD COLUMN IF NOT EXISTS current_passengers INT DEFAULT 1;

-- Create index on ride status and type for shared ride queries
CREATE INDEX IF NOT EXISTS idx_rides_status_type ON rides(status, ride_type);

-- Create function to update ride_passengers timestamps
CREATE OR REPLACE FUNCTION update_ride_passengers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ride_passengers updated_at
DROP TRIGGER IF EXISTS trigger_ride_passengers_updated_at ON ride_passengers;
CREATE TRIGGER trigger_ride_passengers_updated_at
BEFORE UPDATE ON ride_passengers
FOR EACH ROW
EXECUTE FUNCTION update_ride_passengers_updated_at();

-- Create function to validate max passengers
CREATE OR REPLACE FUNCTION validate_max_passengers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_passengers > NEW.max_passengers THEN
    RAISE EXCEPTION 'Cannot exceed maximum passengers for this ride';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate max passengers
DROP TRIGGER IF EXISTS trigger_validate_max_passengers ON rides;
CREATE TRIGGER trigger_validate_max_passengers
BEFORE UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION validate_max_passengers();
