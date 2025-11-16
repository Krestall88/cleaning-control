-- =====================================================
-- Политики доступа для Supabase Storage
-- =====================================================
-- Выполните этот SQL в Supabase SQL Editor
-- https://app.supabase.com/project/lmhvwogsjqefxiwbsdwn/sql

-- 1. Удаляем старые политики (если есть)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role all" ON storage.objects;

-- 2. Политика для загрузки (любой может загружать в bucket uploads)
CREATE POLICY "Allow all uploads to uploads bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads');

-- 3. Политика для чтения (публичный доступ для чтения)
CREATE POLICY "Allow public read from uploads bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

-- 4. Политика для обновления (любой может обновлять в bucket uploads)
CREATE POLICY "Allow all updates to uploads bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

-- 5. Политика для удаления (любой может удалять из bucket uploads)
CREATE POLICY "Allow all deletes from uploads bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'uploads');

-- 6. Убедитесь, что bucket 'uploads' существует и настроен как PUBLIC
-- Это нужно сделать в UI: Storage → uploads → Settings → Public bucket = ON

-- Проверка политик
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
