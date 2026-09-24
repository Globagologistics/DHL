-- Migration: Add missing columns to shipments table
-- Run this in Supabase SQL Editor to fix the pause button error

-- Add stop_timestamp column if it doesn't exist
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS stop_timestamp TIMESTAMP WITH TIME ZONE;

-- Add terminated column for shipment termination feature
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS terminated BOOLEAN DEFAULT FALSE;

-- Add terminate_timestamp to track when shipment was terminated
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS terminate_timestamp TIMESTAMP WITH TIME ZONE;

-- Add progress_bar_paused column for pause/play toggle
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS progress_bar_paused BOOLEAN DEFAULT FALSE;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'shipments'
AND column_name IN ('stop_timestamp', 'terminated', 'terminate_timestamp', 'progress_bar_paused')
ORDER BY column_name;
