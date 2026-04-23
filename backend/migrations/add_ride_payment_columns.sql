-- Add payment fields for ride transactions
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS selected_rider_id INT,
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Normalize any older/null data if present
UPDATE rides
SET payment_method = 'cash'
WHERE payment_method IS NULL OR payment_method = '';

UPDATE rides
SET payment_status = CASE
  WHEN status = 'completed' THEN 'completed'
  WHEN status = 'cancelled' THEN 'failed'
  ELSE 'pending'
END
WHERE payment_status IS NULL OR payment_status = '';
