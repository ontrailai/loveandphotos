-- Contract signatures table for digital contract signing
-- This migration creates the infrastructure for Love & Photos contract signing feature

-- Create contract_signatures table
CREATE TABLE IF NOT EXISTS public.contract_signatures (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    contract_version text NOT NULL DEFAULT 'LNP-Contract-v1.0',
    contract_hash text NOT NULL,
    event_date text NOT NULL,
    location text NOT NULL,
    package_name text NOT NULL,
    price numeric NOT NULL CHECK (price >= 0),
    signer_full_name text,
    signature_png_base64 text NOT NULL,
    ip_address inet,
    signed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Ensure one signature per booking
    CONSTRAINT unique_booking_signature UNIQUE (booking_id)
);

-- Add contract_signed column to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS contract_signed boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_signatures_booking_id ON public.contract_signatures(booking_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_signed_at ON public.contract_signatures(signed_at);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_version ON public.contract_signatures(contract_version);
CREATE INDEX IF NOT EXISTS idx_bookings_contract_signed ON public.bookings(contract_signed);

-- Enable Row Level Security
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_signatures table
-- Users can only see their own contract signatures
CREATE POLICY "Users can view their own contract signatures"
    ON public.contract_signatures
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = contract_signatures.booking_id
            AND b.customer_id = auth.uid()
        )
    );

-- Users can only create contract signatures for their own bookings
CREATE POLICY "Users can create contract signatures for their bookings"
    ON public.contract_signatures
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id
            AND b.customer_id = auth.uid()
            AND b.contract_signed = false
        )
    );

-- No updates allowed - contract signatures are immutable once created
CREATE POLICY "Contract signatures are immutable"
    ON public.contract_signatures
    FOR UPDATE
    TO authenticated
    USING (false);

-- No deletes allowed - contract signatures are permanent audit records
CREATE POLICY "Contract signatures cannot be deleted"
    ON public.contract_signatures
    FOR DELETE
    TO authenticated
    USING (false);

-- Admin users can view all contract signatures for auditing
CREATE POLICY "Admins can view all contract signatures"
    ON public.contract_signatures
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Create function to automatically update booking.contract_signed when signature is created
CREATE OR REPLACE FUNCTION update_booking_contract_signed()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the booking to mark contract as signed
    UPDATE public.bookings
    SET contract_signed = true,
        updated_at = now()
    WHERE id = NEW.booking_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update booking.contract_signed
DROP TRIGGER IF EXISTS trigger_update_booking_contract_signed ON public.contract_signatures;
CREATE TRIGGER trigger_update_booking_contract_signed
    AFTER INSERT ON public.contract_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_contract_signed();

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.contract_signatures TO authenticated;
GRANT SELECT, UPDATE(contract_signed, updated_at) ON public.bookings TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.contract_signatures IS 'Digital contract signatures for Love & Photos bookings with audit trail';
COMMENT ON COLUMN public.contract_signatures.contract_version IS 'Version identifier for the contract text (e.g., LNP-Contract-v1.0)';
COMMENT ON COLUMN public.contract_signatures.contract_hash IS 'SHA-256 hash of the contract text for integrity verification';
COMMENT ON COLUMN public.contract_signatures.signature_png_base64 IS 'Base64 encoded PNG image of the digital signature';
COMMENT ON COLUMN public.contract_signatures.ip_address IS 'IP address of the signer for audit purposes';
COMMENT ON COLUMN public.bookings.contract_signed IS 'Whether the customer has digitally signed the contract for this booking';