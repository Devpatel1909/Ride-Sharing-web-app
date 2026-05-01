-- Allow passenger_id to be NULL for shared rides created by riders
ALTER TABLE rides
ALTER COLUMN passenger_id DROP NOT NULL;
