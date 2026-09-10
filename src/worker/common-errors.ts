// Rank recent normal-practice mistakes. Targeted practice never changes the source sample.
export const commonErrorsQuery = `WITH recent AS (
  SELECT verb_id, result, answered_at,
    ROW_NUMBER() OVER (PARTITION BY verb_id ORDER BY answered_at DESC, id DESC) AS number
  FROM attempts WHERE learner_id = ? AND practice_mode = 'standard'
) SELECT verb_id, SUM(CASE result WHEN 'wrong' THEN 1.0 WHEN 'typo' THEN 0.5 ELSE 0 END) AS lost_points
FROM recent WHERE number <= 5 GROUP BY verb_id HAVING lost_points >= 1
ORDER BY lost_points DESC, MAX(answered_at) DESC, verb_id LIMIT 20`;
