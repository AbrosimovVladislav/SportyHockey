alter table event_lines drop constraint if exists event_lines_slot_check;
alter table event_lines add constraint event_lines_slot_check
  check (slot ~ '^(f[1-9]_(lw|c|rw)|d[1-9]_(ld|rd)|g)$');
