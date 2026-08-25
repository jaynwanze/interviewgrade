-- Remove legacy Storage policies that granted the public role unrestricted
-- access to every object across every bucket. Bucket-specific policies remain.

drop policy if exists "anything 1plzjhd_0" on storage.objects;
drop policy if exists "anything 1plzjhd_1" on storage.objects;
drop policy if exists "anything 1plzjhd_2" on storage.objects;
