
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

CREATE POLICY "Authenticated read CVs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cvs');
CREATE POLICY "Authenticated upload CVs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cvs');
CREATE POLICY "Authenticated update CVs" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cvs');
CREATE POLICY "Authenticated delete CVs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cvs');
