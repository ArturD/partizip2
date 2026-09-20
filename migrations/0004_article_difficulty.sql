ALTER TABLE article_attempts ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'easy' CHECK(difficulty IN ('easy','hard'));
