CREATE TABLE staff_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, room_id)
);

CREATE INDEX idx_staff_rooms_staff_id ON staff_rooms(staff_id);
CREATE INDEX idx_staff_rooms_room_id ON staff_rooms(room_id);

ALTER TABLE staff_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view their own room assignments"
  ON staff_rooms FOR SELECT
  TO authenticated
  USING (
    staff_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'staff'
    )
  );

CREATE POLICY "Admin can view all room assignments"
  ON staff_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
