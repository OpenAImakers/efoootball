create extension if not exists "pg_net" with schema "public";

drop policy "allowaccess" on "public"."comments";

drop policy "allowinsert" on "public"."comments";

drop policy "Public can view jackpot games" on "public"."jackpot_games";

drop policy "Public can view jackpots" on "public"."jackpots";

drop policy "all" on "public"."match_votes";

drop policy "all" on "public"."matches";

drop policy "all access" on "public"."profiles";

drop policy "allowaccess" on "public"."profiles";

drop policy "access" on "public"."teams";

drop policy "allowaccess" on "public"."teams";

drop policy "allowinsert" on "public"."teams";

drop policy "all" on "public"."tournaments";

revoke delete on table "public"."wallet_transactions" from "anon";

revoke insert on table "public"."wallet_transactions" from "anon";

revoke update on table "public"."wallet_transactions" from "anon";

revoke delete on table "public"."wallet_transactions" from "authenticated";

revoke insert on table "public"."wallet_transactions" from "authenticated";

revoke update on table "public"."wallet_transactions" from "authenticated";

revoke delete on table "public"."withdrawal_requests" from "anon";

revoke insert on table "public"."withdrawal_requests" from "anon";

revoke update on table "public"."withdrawal_requests" from "anon";

revoke delete on table "public"."withdrawal_requests" from "authenticated";

revoke insert on table "public"."withdrawal_requests" from "authenticated";

revoke update on table "public"."withdrawal_requests" from "authenticated";


  create policy "allowaccess"
  on "public"."comments"
  as permissive
  for select
  to anon, service_role, authenticated
using (true);



  create policy "allowinsert"
  on "public"."comments"
  as permissive
  for insert
  to anon, authenticated, service_role
with check (true);



  create policy "Public can view jackpot games"
  on "public"."jackpot_games"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Public can view jackpots"
  on "public"."jackpots"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "all"
  on "public"."match_votes"
  as permissive
  for all
  to authenticated, service_role, anon
using (true)
with check (true);



  create policy "all"
  on "public"."matches"
  as permissive
  for all
  to anon, authenticated, service_role
using (true)
with check (true);



  create policy "all access"
  on "public"."profiles"
  as permissive
  for all
  to anon, authenticated, service_role
using (true)
with check (true);



  create policy "allowaccess"
  on "public"."profiles"
  as permissive
  for select
  to anon, authenticated, service_role
using (true);



  create policy "access"
  on "public"."teams"
  as permissive
  for all
  to anon, authenticated, service_role
using (true);



  create policy "allowaccess"
  on "public"."teams"
  as permissive
  for select
  to anon, authenticated, service_role
using (true);



  create policy "allowinsert"
  on "public"."teams"
  as permissive
  for insert
  to anon, authenticated, service_role
with check (true);



  create policy "all"
  on "public"."tournaments"
  as permissive
  for all
  to anon, authenticated, service_role
using (true)
with check (true);



