-- Migration: Add pickup_location column to shipments table
-- This adds the missing pickup_location column that the app is trying to insert

ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS pickup_location TEXT;

-- Optional: Add index for faster queries if needed
-- CREATE INDEX IF NOT EXISTS idx_shipments_pickup_location ON public.shipments(pickup_location);
