ALTER TABLE events ADD COLUMN IF NOT EXISTS opponent_name TEXT;

ALTER TABLE event_lines DROP CONSTRAINT IF EXISTS event_lines_slot_check;
ALTER TABLE event_lines ADD CONSTRAINT event_lines_slot_check
  CHECK (slot ~ '^(f[1-9]_(lw|c|rw)|d[1-9]_(ld|rd)|g[12]?)$');