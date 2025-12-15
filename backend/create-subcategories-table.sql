-- Create subcategories table if it doesn't exist
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- Enable RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to subcategories" ON subcategories;
DROP POLICY IF EXISTS "Allow authenticated users to manage subcategories" ON subcategories;

-- Create RLS policies
CREATE POLICY "Allow public read access to subcategories"
ON subcategories FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow authenticated users to manage subcategories"
ON subcategories FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_subcategories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;
CREATE TRIGGER update_subcategories_updated_at
  BEFORE UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_subcategories_updated_at();
