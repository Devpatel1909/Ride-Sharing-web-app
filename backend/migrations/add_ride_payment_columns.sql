-- Add payment columns for Stripe checkout flow
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_failed_reason TEXT;

-- Backfill existing records for safe defaults
UPDATE rides
SET payment_method = COALESCE(payment_method, 'cash'),
    payment_status = COALESCE(payment_status, CASE WHEN status = 'completed' THEN 'completed' ELSE 'pending' END)
WHERE payment_method IS NULL OR payment_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_rides_payment_status ON rides(payment_status);
CREATE INDEX IF NOT EXISTS idx_rides_stripe_session ON rides(stripe_session_id);
