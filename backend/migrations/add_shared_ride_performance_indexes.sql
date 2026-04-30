-- Performance indexes for shared ride read paths
-- These are safe to run independently after the shared-ride schema migration.

-- Speed up repeated lookups for active shared rides ordered by recency.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rides_shared_active_requested_at
  ON rides (requested_at DESC)
  WHERE ride_type = 'shared'
    AND status IN ('pending', 'accepted')
    AND current_passengers < max_passengers;

-- Speed up counting active passengers for a ride.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ride_passengers_active_ride
  ON ride_passengers (ride_id)
  WHERE passenger_status <> 'cancelled';

-- Speed up duplicate-join checks and passenger-scoped lookups.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ride_passengers_active_passenger_ride
  ON ride_passengers (passenger_id, ride_id)
  WHERE passenger_status <> 'cancelled';
