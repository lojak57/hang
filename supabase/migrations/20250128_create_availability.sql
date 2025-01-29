-- Create the availability table
CREATE TABLE IF NOT EXISTS availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own availability"
    ON availability FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own availability"
    ON availability FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability"
    ON availability FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX availability_user_id_idx ON availability(user_id);
CREATE INDEX availability_date_idx ON availability(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_availability_updated_at
    BEFORE UPDATE ON availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
