REVOKE EXECUTE ON FUNCTION public.sugerir_ruas_fefo(uuid, uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.paletes_fora_de_ordem(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sugerir_ruas_fefo(uuid, uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.paletes_fora_de_ordem(uuid) TO authenticated, service_role;