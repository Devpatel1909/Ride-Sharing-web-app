-- Create rides table for tracking all ride requests and completed rides
CREATE TABLE IF NOT EXISTS rides (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rider_id INT,
  passenger_id INT NOT NULL,
  pickup_location VARCHAR(500) NOT NULL,
  destination VARCHAR(500) NOT NULL,
  distance DECIMAL(10,2) NOT NULL,
  fare DECIMAL(10,2) NOT NULL,
  ride_type ENUM('shared', 'personal') NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  payment_status VARCHAR(20) DEFAULT 'completed',
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  payment_completed_at TIMESTAMP NULL,
  payment_failed_reason TEXT,
  status ENUM('pending', 'accepted', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE SET NULL,
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_rider (rider_id),
  INDEX idx_passenger (passenger_id),
  INDEX idx_requested_at (requested_at),
  INDEX idx_payment_status (payment_status),
  INDEX idx_stripe_session (stripe_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add columns to riders table for availability and location tracking
ALTER TABLE riders 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS current_location VARCHAR(500),
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS total_rides INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;

-- Create ratings table for ride ratings
CREATE TABLE IF NOT EXISTS ride_ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ride_id INT NOT NULL,
  rider_id INT NOT NULL,
  passenger_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ride_rating (ride_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  rider_id INT,
  type ENUM('ride_request', 'ride_accepted', 'ride_started', 'ride_completed', 'ride_cancelled'),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  ride_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_rider_unread (rider_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create trigger to update rider stats on ride completion
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_rider_stats_on_complete
AFTER UPDATE ON rides
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' 
     AND OLD.status != 'completed'
     AND (NEW.payment_method = 'cash' OR NEW.payment_status = 'completed') THEN
    UPDATE riders 
    SET 
      total_rides = total_rides + 1,
      total_earnings = total_earnings + NEW.fare
    WHERE id = NEW.rider_id;
  END IF;
END//
DELIMITER ;
