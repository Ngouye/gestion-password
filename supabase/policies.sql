-- Politiques Row Level Security pour la table des mots de passe.
-- À exécuter dans l'éditeur SQL de Supabase : chaque utilisateur n'accède qu'à ses propres lignes.

alter table public.passwords enable row level security;

drop policy if exists "passwords_select_own" on public.passwords;
drop policy if exists "passwords_insert_own" on public.passwords;
drop policy if exists "passwords_update_own" on public.passwords;
drop policy if exists "passwords_delete_own" on public.passwords;

create policy "passwords_select_own" on public.passwords
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "passwords_insert_own" on public.passwords
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "passwords_update_own" on public.passwords
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "passwords_delete_own" on public.passwords
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Clés de secours : enveloppes chiffrées de la clé de données du coffre.
-- Le serveur ne stocke que des blobs chiffrés ; sans le mot de passe maître
-- ou la clé de secours, ils sont inutilisables.
-- ---------------------------------------------------------------------------

create table if not exists public.vault_keys (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  wrapped_by_password text not null,
  wrapped_by_recovery text not null,
  updated_at timestamptz not null default now()
);

alter table public.vault_keys enable row level security;

drop policy if exists "vault_keys_select_own" on public.vault_keys;
drop policy if exists "vault_keys_insert_own" on public.vault_keys;
drop policy if exists "vault_keys_update_own" on public.vault_keys;

create policy "vault_keys_select_own" on public.vault_keys
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "vault_keys_insert_own" on public.vault_keys
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "vault_keys_update_own" on public.vault_keys
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
