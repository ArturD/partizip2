export const lessonQuery = `WITH timeline AS (
          SELECT *, LAG(answered_at) OVER (ORDER BY answered_at, id) AS previous_at
          FROM attempts WHERE learner_id = ? AND (? = 'all' OR practice_mode = ?)
        ), boundary AS (
          SELECT MAX(answered_at) AS started_at FROM timeline
          WHERE previous_at IS NULL OR julianday(answered_at) >= julianday(previous_at, '+4 hours')
        ), lesson AS (
          SELECT *, ROW_NUMBER() OVER (ORDER BY answered_at, id) AS number,
            AVG(CASE WHEN result = 'correct' THEN 100.0 WHEN result = 'typo' THEN 50.0 ELSE 0 END)
              OVER (ORDER BY answered_at, id ROWS BETWEEN 9 PRECEDING AND CURRENT ROW) AS accuracy
          FROM timeline WHERE answered_at >= (SELECT started_at FROM boundary)
            AND (? = '' OR tier = ?) AND (? = '' OR verb_type = ?)
        ) SELECT number, answered_at, accuracy,
          CASE result WHEN 'correct' THEN 100.0 WHEN 'typo' THEN 50.0 ELSE 0 END AS score
          FROM lesson ORDER BY number DESC`;
