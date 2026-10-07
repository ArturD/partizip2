CREATE TABLE preterite_attempts (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL,
  verb_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  verb_type TEXT NOT NULL CHECK (verb_type IN ('regular', 'irregular')),
  answer TEXT NOT NULL,
  expected TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('correct', 'typo', 'wrong')),
  answered_at TEXT NOT NULL,
  practice_mode TEXT NOT NULL DEFAULT 'standard' CHECK(practice_mode IN ('standard','errors'))
);
CREATE INDEX preterite_attempts_learner_date ON preterite_attempts(learner_id, answered_at DESC, id DESC);
