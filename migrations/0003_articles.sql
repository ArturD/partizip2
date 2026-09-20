CREATE TABLE article_attempts (
 id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, round_id TEXT NOT NULL,
 noun_id TEXT NOT NULL, content_version INTEGER NOT NULL, tier TEXT NOT NULL,
 question TEXT NOT NULL CHECK(question IN ('gender','accusative','dative','genitive')),
 answer TEXT NOT NULL, expected TEXT NOT NULL, correct INTEGER NOT NULL CHECK(correct IN (0,1)),
 answered_at TEXT NOT NULL, practice_mode TEXT NOT NULL DEFAULT 'standard',
 UNIQUE(learner_id, round_id, question)
);
CREATE INDEX article_attempts_learner_date ON article_attempts(learner_id, answered_at);
