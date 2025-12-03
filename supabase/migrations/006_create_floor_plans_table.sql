-- Create floor_plans table for storing floor plan images and data
CREATE TABLE IF NOT EXISTS floor_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  corpus VARCHAR(100) NOT NULL, -- Building/corpus identifier (e.g., "Корпус 1", "Корпус А")
  section VARCHAR(100), -- Section within the corpus if applicable
  floor INTEGER NOT NULL, -- Floor number (can be negative for underground floors)
  name VARCHAR(255) NOT NULL, -- Display name for the plan
  description TEXT, -- Optional description
  -- Image data (can store either URL or base64)
  image_url TEXT, -- URL to the image if stored externally
  image_data TEXT, -- Base64 encoded image data if stored directly
  image_type VARCHAR(50), -- MIME type (e.g., 'image/png', 'image/jpeg')

  -- Plan metadata
  scale DECIMAL(10, 4) DEFAULT 1.0, -- Scale factor (mm per pixel)
  width INTEGER, -- Plan width in pixels
  height INTEGER, -- Plan height in pixels

  -- Additional configuration
  background_opacity DECIMAL(3, 2) DEFAULT 0.7, -- Opacity for background image (0.0 to 1.0)
  grid_visible BOOLEAN DEFAULT true, -- Show grid overlay

  -- Placed vitrages (JSON array of placed vitrage data)
  placed_vitrages JSONB DEFAULT '[]'::JSONB,

  -- Walls and rooms data (for future use)
  walls JSONB DEFAULT '[]'::JSONB,
  rooms JSONB DEFAULT '[]'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  -- Ensure unique combination of object, corpus, section, and floor
  CONSTRAINT unique_floor_plan UNIQUE(object_id, corpus, section, floor)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_floor_plans_object_id ON floor_plans(object_id);
CREATE INDEX IF NOT EXISTS idx_floor_plans_corpus ON floor_plans(corpus);
CREATE INDEX IF NOT EXISTS idx_floor_plans_floor ON floor_plans(floor);
CREATE INDEX IF NOT EXISTS idx_floor_plans_object_corpus_floor ON floor_plans(object_id, corpus, floor);

-- Enable Row Level Security
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Floor plans are viewable by everyone" ON floor_plans;
DROP POLICY IF EXISTS "Anyone can create floor plans" ON floor_plans;
DROP POLICY IF EXISTS "Anyone can update floor plans" ON floor_plans;
DROP POLICY IF EXISTS "Anyone can delete floor plans" ON floor_plans;

-- Create RLS policies for floor_plans
-- Policy: Anyone can read floor plans
CREATE POLICY "Floor plans are viewable by everyone"
  ON floor_plans
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert floor plans
CREATE POLICY "Anyone can create floor plans"
  ON floor_plans
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can update floor plans
CREATE POLICY "Anyone can update floor plans"
  ON floor_plans
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Anyone can delete floor plans
CREATE POLICY "Anyone can delete floor plans"
  ON floor_plans
  FOR DELETE
  USING (true);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_floor_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_floor_plans_updated_at_trigger ON floor_plans;
CREATE TRIGGER update_floor_plans_updated_at_trigger
  BEFORE UPDATE ON floor_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_floor_plans_updated_at();

-- Add comments for documentation
COMMENT ON TABLE floor_plans IS 'Stores floor plan images and configurations for buildings';
COMMENT ON COLUMN floor_plans.object_id IS 'Reference to the construction object';
COMMENT ON COLUMN floor_plans.corpus IS 'Building/corpus identifier within the object';
COMMENT ON COLUMN floor_plans.section IS 'Optional section within the corpus';
COMMENT ON COLUMN floor_plans.floor IS 'Floor number (negative for underground)';
COMMENT ON COLUMN floor_plans.image_url IS 'External URL for the plan image';
COMMENT ON COLUMN floor_plans.image_data IS 'Base64 encoded image data for direct storage';
COMMENT ON COLUMN floor_plans.scale IS 'Scale factor in mm per pixel';
COMMENT ON COLUMN floor_plans.placed_vitrages IS 'JSON array of vitrages placed on this floor plan';
COMMENT ON COLUMN floor_plans.walls IS 'JSON array of wall definitions';
COMMENT ON COLUMN floor_plans.rooms IS 'JSON array of room definitions';