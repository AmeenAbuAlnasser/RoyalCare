-- Repair: fix mojibake Arabic and Hebrew text in BOOKING_REQUEST_CREATED notifications.
--
-- Root cause: at creation time the UTF-8 bytes of Arabic/Hebrew strings were
-- interpreted as ISO-8859-1 and stored verbatim, producing sequences like
-- chr(216)+chr(183) ("Ø·") instead of U+0637 ("ط").
--
-- Detection: chr(216)=Ø (U+00D8) and chr(217)=Ù (U+00D9) are the Latin
-- surrogates for the first UTF-8 byte of most Arabic codepoints.
-- chr(215)=× (U+00D7) is the Latin surrogate for the first UTF-8 byte of Hebrew.
--
-- Recovery strategy for BOOKING_REQUEST_CREATED:
--   title  → replace ar/he with the canonical static phrases
--   body   → extract patient name from the clean EN body, rebuild ar/he body
--
-- Idempotent: rows that are already clean are not touched.

UPDATE "Notification"
SET
  title = jsonb_build_object(
    'en', COALESCE(title::jsonb->>'en', 'New Booking Request'),
    'ar', CASE
            WHEN title::jsonb->>'ar' LIKE '%' || chr(216) || '%'
              OR title::jsonb->>'ar' LIKE '%' || chr(217) || '%'
            THEN 'طلب حجز جديد'
            ELSE COALESCE(title::jsonb->>'ar', 'طلب حجز جديد')
          END,
    'he', CASE
            WHEN title::jsonb->>'he' LIKE '%' || chr(215) || '%'
            THEN 'בקשת תור חדשה'
            ELSE COALESCE(title::jsonb->>'he', 'בקשת תור חדשה')
          END
  ),
  body  = jsonb_build_object(
    'en', COALESCE(body::jsonb->>'en', ''),
    'ar', CASE
            WHEN body::jsonb->>'ar' LIKE '%' || chr(216) || '%'
              OR body::jsonb->>'ar' LIKE '%' || chr(217) || '%'
            THEN
              -- Extract patient name: strip trailing " submitted a booking request"
              regexp_replace(
                COALESCE(body::jsonb->>'en', ''),
                '\s*submitted a booking request\s*$',
                '',
                'i'
              ) || ' طلب موعد جديد'
            ELSE COALESCE(body::jsonb->>'ar', '')
          END,
    'he', CASE
            WHEN body::jsonb->>'he' LIKE '%' || chr(215) || '%'
            THEN
              regexp_replace(
                COALESCE(body::jsonb->>'en', ''),
                '\s*submitted a booking request\s*$',
                '',
                'i'
              ) || ' שלח/ה בקשת תור'
            ELSE COALESCE(body::jsonb->>'he', '')
          END
  )
WHERE type = 'BOOKING_REQUEST_CREATED'
  AND (
    title IS NOT NULL
    AND (
      title::jsonb->>'ar' LIKE '%' || chr(216) || '%'
      OR title::jsonb->>'ar' LIKE '%' || chr(217) || '%'
      OR title::jsonb->>'he' LIKE '%' || chr(215) || '%'
    )
    OR body::jsonb->>'ar' LIKE '%' || chr(216) || '%'
    OR body::jsonb->>'ar' LIKE '%' || chr(217) || '%'
    OR body::jsonb->>'he' LIKE '%' || chr(215) || '%'
  );
