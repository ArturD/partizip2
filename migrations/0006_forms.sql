CREATE TABLE form_attempts (
 id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, round_id TEXT NOT NULL,
 verb_id TEXT NOT NULL, tier TEXT NOT NULL, verb_type TEXT NOT NULL,
 form TEXT NOT NULL CHECK(form IN ('preterite','participle')),
 mode TEXT NOT NULL CHECK(mode IN ('recall','learn')),
 practice_mode TEXT NOT NULL CHECK(practice_mode IN ('standard','errors')),
 answer TEXT NOT NULL, expected TEXT NOT NULL,
 result TEXT NOT NULL CHECK(result IN ('correct','typo','wrong')), answered_at TEXT NOT NULL,
 UNIQUE(learner_id, round_id, form)
);
CREATE INDEX form_attempts_history ON form_attempts(learner_id, answered_at);
