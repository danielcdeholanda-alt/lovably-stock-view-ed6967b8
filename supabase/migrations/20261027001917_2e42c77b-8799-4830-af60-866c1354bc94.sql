DROP POLICY IF EXISTS "Areas visiveis" ON public.areas;
CREATE POLICY "Areas visiveis" ON public.areas FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Ruas visiveis" ON public.ruas;
CREATE POLICY "Ruas visiveis" ON public.ruas FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);