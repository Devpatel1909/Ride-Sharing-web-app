-- PostgreSQL Schema for Neon Database
-- Ride Sharing Application

-- Create custom ENUM types for PostgreSQL
CREATE TYPE ride_status AS ENUM ('pending', 'accepted', 'in-progress', 'completed', 'cancelled');
CREATE TYPE ride_type AS ENUM ('shared', 'personal');
CREATE TYPE notification_type AS ENUM ('ride_request', 'ride_accepted', 'ride_started', 'ride_completed', 'ride_cancelled');

-- Create rides table for tracking all ride requests and completed rides
CREATE TABLE IF NOT EXISTS rides (
  id SERIAL PRIMARY KEY,
  rider_id INT,
  passenger_id INT NOT NULL,
  pickup_location VARCHAR(500) NOT NULL,
  destination VARCHAR(500) NOT NULL,
  distance DECIMAL(10,2) NOT NULL,
  fare DECIMAL(10,2) NOT NULL,
  ride_type ride_type NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  status ride_status DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for rides table
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_rider ON rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_requested_at ON rides(requested_at);

-- Add columns to riders table for availability and location tracking
ALTER TABLE riders 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS current_location VARCHAR(500),
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS total_rides INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;

-- Create ratings table for ride ratings
CREATE TABLE IF NOT EXISTS ride_ratings (
  id SERIAL PRIMARY KEY,
  ride_id INT NOT NULL,
  rider_id INT NOT NULL,
  passenger_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ride_id)
);

-- Create notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT,
  rider_id INT,
  type notification_type,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  ride_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_rider_unread ON notifications(rider_id, is_read);

-- Create function to update rider stats on ride completion
CREATE OR REPLACE FUNCTION update_rider_stats_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE riders 
    SET 
      total_rides = total_rides + 1,
      total_earnings = total_earnings + NEW.fare,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.rider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating rider stats
DROP TRIGGER IF EXISTS trigger_update_rider_stats ON rides;
CREATE TRIGGER trigger_update_rider_stats
AFTER UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION update_rider_stats_on_complete();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps on rides
DROP TRIGGER IF EXISTS trigger_rides_updated_at ON rides;
CREATE TRIGGER trigger_rides_updated_at
BEFORE UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
