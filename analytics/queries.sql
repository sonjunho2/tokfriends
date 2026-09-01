-- Signups per day
SELECT date_trunc('day', "createdAt") AS day, count(*) AS signups
FROM "User" GROUP BY 1 ORDER BY 1;

-- First friend request to accept conversion within 24h
WITH sent AS (
  SELECT requesterId AS user_id, min(createdAt) AS first_sent
  FROM "Friendship" WHERE status IN ('requested','accepted') GROUP BY 1
), accepted AS (
  SELECT requesterId AS user_id, min(createdAt) AS first_accepted
  FROM "Friendship" WHERE status = 'accepted' GROUP BY 1
)
SELECT
  count(*) FILTER (WHERE accepted.first_accepted IS NOT NULL AND accepted.first_accepted <= sent.first_sent + interval '24 hours')::float
  / greatest(count(*),1) AS first_day_accept_rate
FROM sent LEFT JOIN accepted USING (user_id);

-- D1/D7 retention (approximate cohort)
WITH d0 AS (
  SELECT id AS user_id, date_trunc('day', "createdAt") AS d0 FROM "User"
), d1 AS (
  SELECT "userId" AS user_id, min(date_trunc('day', "createdAt")) AS d1
  FROM "AnalyticsEvent" WHERE event IN ('message_sent','friend_request_sent') GROUP BY 1
), d7 AS (
  SELECT "userId" AS user_id, min(date_trunc('day', "createdAt")) AS d7
  FROM "AnalyticsEvent" WHERE event IN ('message_sent','friend_request_sent') GROUP BY 1
)
SELECT
  d0.d0 AS cohort,
  (SELECT count(*) FROM d0 d WHERE d.d0 = d0.d0) AS installs,
  (SELECT count(*) FROM d0 d JOIN d1 USING (user_id) WHERE d.d0 = d0.d0 AND d1.d1 = d0.d0 + interval '1 day') AS d1_retained,
  (SELECT count(*) FROM d0 d JOIN d7 USING (user_id) WHERE d.d0 = d0.d0 AND d7.d7 = d0.d0 + interval '7 day') AS d7_retained;
