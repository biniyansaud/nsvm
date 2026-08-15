-- Staff portraits are WebP files. Their former .jpg paths conflict with the
-- server's `X-Content-Type-Options: nosniff` header and can fail to render.
-- Update both supported staff schemas without assuming every optional column
-- exists in the target project.
DO $$
DECLARE
  v_table_name text;
  v_column_name text;
  old_path text;
  new_path text;
BEGIN
  FOREACH v_table_name IN ARRAY ARRAY['school_staff_members', 'secondary_staff_members', 'secondary_department_members']
  LOOP
    CONTINUE WHEN to_regclass(format('public.%I', v_table_name)) IS NULL;

    FOREACH v_column_name IN ARRAY ARRAY['image', 'image_url']
    LOOP
      CONTINUE WHEN NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = v_table_name AND column_name = v_column_name
      );

      FOREACH old_path IN ARRAY ARRAY[
        '/images/staff/harendra-pant.jpg',
        '/images/staff/janaki-saud.jpg',
        '/images/staff/jyoti-joshi-accountant.jpg',
        '/images/staff/niranjana-rawal.jpg',
        '/images/staff/padama-pathak.jpg',
        '/images/staff/principal-AMRAJ-BHATT-SIR.jpg',
        '/images/staff/rewati-joshi-bhatt.jpg',
        '/images/staff/sabina-bhandari.jpg',
        '/images/staff/shila-acharya.jpg',
        '/images/staff/suresh-bhandari.jpg'
      ]
      LOOP
        new_path := replace(old_path, '.jpg', '.webp');
        EXECUTE format(
          'UPDATE public.%I SET %I = replace(%I, $1, $2) WHERE %I LIKE ''%%'' || $1 || ''%%''',
          v_table_name, v_column_name, v_column_name, v_column_name
        ) USING old_path, new_path;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
