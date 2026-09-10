ALTER TABLE attempts ADD COLUMN practice_mode TEXT NOT NULL DEFAULT 'standard'
  CHECK (practice_mode IN ('standard', 'errors'));
CREATE INDEX attempts_learner_mode_date ON attempts(learner_id, practice_mode, answered_at DESC, id DESC);
