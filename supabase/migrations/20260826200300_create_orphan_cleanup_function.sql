CREATE OR REPLACE FUNCTION cleanup_orphaned_photos()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  WITH orphaned AS (
    SELECT id, name
    FROM storage.objects
    WHERE bucket_id = 'post-photos'
      AND name LIKE '%/temp/%'
      AND created_at < now() - interval '24 hours'
    LIMIT 100
  ),
  deleted AS (
    DELETE FROM storage.objects
    WHERE id IN (SELECT id FROM orphaned)
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

SELECT cron.schedule('cleanup-orphaned-photos', '0 3 * * *', 'SELECT public.cleanup_orphaned_photos()');
