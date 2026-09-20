// Find the lesson within the selected difficulty before filtering its content.
export const articleLessonQuery = `WITH timeline AS (
 SELECT *, LAG(answered_at) OVER (ORDER BY answered_at, id) previous_at
 FROM article_attempts WHERE learner_id = ? AND difficulty = ?
), boundary AS (
 SELECT MAX(answered_at) started_at FROM timeline
 WHERE previous_at IS NULL OR julianday(answered_at) >= julianday(previous_at, '+4 hours')
)
SELECT question, answered_at, correct * 100 score,
 ROW_NUMBER() OVER (ORDER BY answered_at, id) number
FROM timeline WHERE answered_at >= (SELECT started_at FROM boundary)
 AND (? = '' OR tier = ?) AND (? = '' OR question = ?)
ORDER BY answered_at, id`;
