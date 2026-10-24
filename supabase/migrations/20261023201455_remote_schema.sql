


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."challenge_status" AS ENUM (
    'open',
    'accepted',
    'cancelled',
    'completed',
    'disputed'
);


ALTER TYPE "public"."challenge_status" OWNER TO "postgres";


CREATE TYPE "public"."tx_status" AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'CANCELLED',
    'REQUESTED',
    'PAID_OUT',
    'ABANDONED'
);


ALTER TYPE "public"."tx_status" OWNER TO "postgres";


CREATE TYPE "public"."tx_type" AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'PAYMENT',
    'REFUND',
    'ENTRY_FEE',
    'JACKPOT_WIN'
);


ALTER TYPE "public"."tx_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_complete_unplayed_matches"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only run when status is changed to 'finished'
    IF NEW.status = 'finished' AND (OLD.status IS DISTINCT FROM 'finished') THEN
        
        UPDATE public.matches
        SET 
            played = true,
            home_goals = 0,
            away_goals = 0
        WHERE tournament_id = NEW.id 
          AND played = false;

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_complete_unplayed_matches"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_populate_tournament_avatar"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if tournament_avatar is NULL or empty
  IF NEW.tournament_avatar IS NULL OR trim(NEW.tournament_avatar) = '' THEN
    NEW.tournament_avatar := 'https://api.dicebear.com/9.x/initials/png?seed=' || 
                             replace(trim(NEW.name), ' ', '+') || 
                             '&backgroundType=gradientLinear';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_populate_tournament_avatar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_pending_deposit"("p_user_id" "uuid", "p_reference" "text", "p_amount" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_wallet_id wallets.id%type;
begin
  select id into v_wallet_id from wallets where user_id = p_user_id;

  if v_wallet_id is null then
    insert into wallets (user_id, balance, currency)
    values (p_user_id, 0, 'KES')
    returning id into v_wallet_id;
  end if;

  insert into wallet_transactions (wallet_id, amount, type, status, reference, description)
  values (v_wallet_id, p_amount, 'DEPOSIT', 'PENDING', p_reference, 'Paystack deposit');
end;
$$;


ALTER FUNCTION "public"."create_pending_deposit"("p_user_id" "uuid", "p_reference" "text", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_wallet"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."create_profile_wallet"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_jackpot_entry_fee"("p_user_id" "uuid", "p_jackpot_id" "uuid", "p_reference" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_wallet_id       uuid;
  v_balance         numeric;
  v_fee             numeric;
  v_new_balance     numeric;
begin
  -- 1. Lock the wallet row. This serializes concurrent deductions for the same user.
  select id, balance
    into v_wallet_id, v_balance
  from wallets
  where user_id = p_user_id
  for update;

  if not found then
    return 'WALLET_NOT_FOUND';
  end if;

  -- 2. Look up the jackpot's entry fee (server-side source of truth, not client-trusted).
  select entry_fee
    into v_fee
  from jackpots
  where id = p_jackpot_id
    and status = 'open';

  if not found then
    return 'JACKPOT_NOT_OPEN';
  end if;

  -- 3. Balance check.
  if v_balance < v_fee then
    return 'INSUFFICIENT_BALANCE';
  end if;

  -- 4. Deduct atomically.
  update wallets
    set balance = balance - v_fee,
        updated_at = now()
    where id = v_wallet_id
    returning balance into v_new_balance;

  -- 5. Write the ledger row (so it shows in Transaction History).
  insert into wallet_transactions (
    wallet_id,
    amount,
    type,
    status,
    reference,
    description,
    balance_after
  ) values (
    v_wallet_id,
    v_fee,
    'ENTRY_FEE',
    'SUCCESS',
    p_reference,
    'Jackpot entry fee',
    v_new_balance
  );

  return 'SUCCESS';
end;
$$;


ALTER FUNCTION "public"."deduct_jackpot_entry_fee"("p_user_id" "uuid", "p_jackpot_id" "uuid", "p_reference" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."downgrade_if_no_tournaments_left"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  remaining_count integer;
BEGIN
  -- Count remaining tournaments for this creator
  SELECT COUNT(*) INTO remaining_count
  FROM public.tournaments
  WHERE created_by = OLD.created_by;

  -- If zero left and they were admin → downgrade
  IF remaining_count = 0 THEN
    UPDATE public.profiles
    SET role = 'member'
    WHERE id = OLD.created_by
      AND role = 'admin';  -- only touch if they were admin
  END IF;

  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."downgrade_if_no_tournaments_left"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_team_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
declare
  code text;
begin
  loop
    code :=
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      lpad(floor(random() * 1000)::int::text, 3, '0');

    exit when not exists (
      select 1
      from teams
      where team_code = code
    );
  end loop;

  return code;
end;
$$;


ALTER FUNCTION "public"."generate_team_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_standings"("t_id" integer) RETURNS TABLE("rank" bigint, "id" integer, "name" "text", "group_id" integer, "w" integer, "d" integer, "l" integer, "points" integer, "gf" integer, "ga" integer, "gd" integer)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT
    RANK() OVER (
      ORDER BY
        (w * 3 + d) DESC,
        (gf - ga) DESC,
        gf DESC,
        id ASC
    ) AS rank,
    id,
    name,
    group_id,
    w,
    d,
    l,
    (w * 3 + d) AS points,
    gf,
    ga,
    (gf - ga) AS gd
  FROM teams
  WHERE tournament_id = t_id;
$$;


ALTER FUNCTION "public"."get_standings"("t_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_avatar_url"("team_name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    normalized_name text := lower(trim(team_name));
BEGIN
    CASE normalized_name
        WHEN 'arsenal' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t3.png';
        WHEN 'aston villa' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t7.png';
        WHEN 'bournemouth' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t91.png';
        WHEN 'brentford' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t94.png';
        WHEN 'brighton' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t36.png';
        WHEN 'chelsea' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t8.png';
        WHEN 'crystal palace' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t31.png';
        WHEN 'everton' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t11.png';
        WHEN 'fulham' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t54.png';
        WHEN 'ipswich town' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t40.png';
        WHEN 'leicester city' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t13.png';
        WHEN 'liverpool' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t14.png';
        WHEN 'manchester city' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t43.png';
        WHEN 'manchester united' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t1.png';
        WHEN 'newcastle united' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t4.png';
        WHEN 'nottingham forest' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t17.png';
        WHEN 'southampton' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t20.png';
        WHEN 'tottenham hotspur' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t6.png';
        WHEN 'west ham united' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t21.png';
        WHEN 'wolverhampton wanderers' THEN
            RETURN 'https://resources.premierleague.com/premierleague/badges/50/t39.png';
        ELSE
            RETURN 'https://api.dicebear.com/9.x/initials/png?seed=' ||
                   replace(trim(team_name), ' ', '+') ||
                   '&backgroundType=gradientLinear';
    END CASE;
END;
$$;


ALTER FUNCTION "public"."get_team_avatar_url"("team_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_mpesa_deposit"("p_user_id" "uuid", "p_amount" numeric, "p_checkout_request_id" "text", "p_phone" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_wallet_id uuid;
  v_tx_id uuid;
begin
  -- 1. Input Validation
  if p_amount <= 0 then
    raise exception 'Deposit amount must be greater than 0';
  end if;

  -- 2. Get or create user wallet
  select id into v_wallet_id
  from public.wallets
  where user_id = p_user_id;

  if v_wallet_id is null then
    insert into public.wallets (user_id, balance, currency)
    values (p_user_id, 0.00, 'KES')
    returning id into v_wallet_id;
  end if;

  -- 3. Create pending transaction
  insert into public.wallet_transactions (
    wallet_id,
    amount,
    type,
    status,
    checkout_request_id,
    description
  )
  values (
    v_wallet_id,
    p_amount,
    'DEPOSIT'::public.tx_type,
    'PENDING'::public.tx_status,
    p_checkout_request_id,
    concat('M-Pesa STK Push initiated (', coalesce(p_phone, 'N/A'), ')')
  )
  returning id into v_tx_id;

  return jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'wallet_id', v_wallet_id,
    'status', 'PENDING'
  );
exception when others then
  return jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
end;
$$;


ALTER FUNCTION "public"."handle_mpesa_deposit"("p_user_id" "uuid", "p_amount" numeric, "p_checkout_request_id" "text", "p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_league"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Set the creator as admin in profiles
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = NEW.created_by;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_league"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1),
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_post_likes"("post_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE posts
  SET likes = likes + 1
  WHERE id = post_id;
END;
$$;


ALTER FUNCTION "public"."increment_post_likes"("post_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_post_views"("post_id" integer) RETURNS "void"
    LANGUAGE "sql"
    AS $$
    update public.posts
    set views = views + 1
    where id = post_id;
$$;


ALTER FUNCTION "public"."increment_post_views"("post_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."make_creator_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only upgrade if this is truly the first tournament for this user
  IF NOT EXISTS (
    SELECT 1 
    FROM public.tournaments t2 
    WHERE t2.created_by = NEW.created_by 
      AND t2.id != NEW.id  -- exclude the row being inserted right now
  ) THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = NEW.created_by
      AND (role IS NULL OR role != 'admin');  -- avoid redundant updates
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."make_creator_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_withdrawal_paid_out"("p_withdrawal_id" "uuid", "p_payout_reference" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_req withdrawal_requests%rowtype;
begin
  select * into v_req from withdrawal_requests where id = p_withdrawal_id for update;
  if not found then
    raise exception 'withdrawal_not_found';
  end if;

  if v_req.status = 'PAID_OUT' then
    return 'ALREADY_PAID_OUT';
  end if;

  update withdrawal_requests
    set status = 'PAID_OUT', paid_out_at = now(), payout_reference = p_payout_reference
    where id = v_req.id;

  update wallet_transactions
    set status = 'PAID_OUT', updated_at = now()
    where reference = v_req.reference and type = 'WITHDRAWAL';

  return 'PAID_OUT';
end;
$$;


ALTER FUNCTION "public"."mark_withdrawal_paid_out"("p_withdrawal_id" "uuid", "p_payout_reference" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_tournament_creator"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://bkmdutrvxugyrwthmtjb.supabase.co/functions/v1/send-announcement',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        -- Safe authorization injection avoiding cleartext tokens in git history
        'Authorization', (SELECT 'Bearer ' || decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_tournament_creator"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pay_jackpot_winner"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_prize           numeric;
  v_game_count      int;
  v_winner_count    int;
  v_share           numeric;
  v_wallet_id       uuid;
  v_new_balance     numeric;
  v_reference       text;
begin
  -- Only fire on the actual submitted -> winner transition.
  -- (Belt-and-braces: the trigger itself is scoped, but this makes the
  -- function safe to call from anywhere.)
  if new.status <> 'winner' or old.status = 'winner' then
    return new;
  end if;

  -- Pull the prize config from the parent jackpot.
  select game_count, prize_amount
    into v_game_count, v_prize
  from jackpots
  where id = new.jackpot_id;

  -- Nothing to pay if prize is null or zero.
  if v_prize is null or v_prize <= 0 then
    return new;
  end if;

  -- Count how many winners there are for this jackpot.
  -- This is stable at this point: settle_jackpot_if_complete has already
  -- finished writing all winner statuses before any trigger fires.
  select count(*) into v_winner_count
  from jackpot_entries
  where jackpot_id = new.jackpot_id
    and status = 'winner';

  if v_winner_count = 0 then
    return new;
  end if;

  -- Split equally. Round to 2 decimals (KES).
  v_share := round(v_prize / v_winner_count, 2);

  -- Lock and credit the wallet.
  select id into v_wallet_id
  from wallets
  where user_id = new.user_id
  for update;

  if v_wallet_id is null then
    -- No wallet — nothing to credit. Entry stays 'winner' but unpaid.
    -- That's a data problem worth a separate alert; don't crash the trigger.
    raise warning 'pay_jackpot_winner: no wallet for user % (entry %)', new.user_id, new.id;
    return new;
  end if;

  update wallets
  set balance = balance + v_share,
      updated_at = now()
  where id = v_wallet_id
  returning balance into v_new_balance;

  -- Deterministic reference per entry: this is what makes the payment idempotent.
  -- UNIQUE constraint on wallet_transactions.reference + ON CONFLICT DO NOTHING
  -- means a re-fire cannot insert a second payout row.
  v_reference := 'jkp_win_' || new.id::text;

  insert into wallet_transactions (
    wallet_id, amount, type, status, reference, description, balance_after
  ) values (
    v_wallet_id,
    v_share,
    'JACKPOT_WIN',
    'SUCCESS',
    v_reference,
    'Jackpot win — ' || v_game_count || '/' || v_game_count,
    v_new_balance
  )
  on conflict (reference) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."pay_jackpot_winner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."perform_daily_check_in"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_check_in RECORD;
BEGIN
  -- Check if already checked in today
  IF EXISTS (
    SELECT 1 FROM public.check_ins 
    WHERE user_id = p_user_id AND check_in_date = v_today
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Already checked in today!');
  END IF;

  -- Insert check-in record (defaults handle points = 10 and date = CURRENT_DATE)
  INSERT INTO public.check_ins (user_id)
  VALUES (p_user_id)
  RETURNING * INTO v_check_in;

  RETURN json_build_object(
    'success', true, 
    'message', 'Successfully checked in!',
    'check_in', row_to_json(v_check_in)
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'message', 'Already checked in today!');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."perform_daily_check_in"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."place_slip"("p_stake" numeric, "p_potential_win" numeric, "p_picks" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_wallet_id uuid;
  v_balance numeric;
  v_slip_id uuid;
  v_pick jsonb;
  v_invalid_pick text;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_stake is null or p_stake <= 0 then
    raise exception 'INVALID_STAKE';
  end if;

  if p_picks is null or jsonb_array_length(p_picks) = 0 then
    raise exception 'NO_SELECTIONS';
  end if;

  -- Lock the wallet row so concurrent submissions can't both pass the check
  select id, balance
  into v_wallet_id, v_balance
  from public.wallets
  where user_id = v_user_id
  for update;

  if v_wallet_id is null then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  if v_balance < p_stake then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  -- Create slip first (so FK from slip_selections is satisfied)
  insert into public.slips (user_id, stake, potential_win, status)
  values (v_user_id, p_stake, p_potential_win, 'pending')
  returning id into v_slip_id;

  -- Insert picks from JSON array
  for v_pick in select * from jsonb_array_elements(p_picks)
  loop
    insert into public.slip_selections (slip_id, event_id, selection, odds_at_pick)
    values (
      v_slip_id,
      (v_pick->>'event_id')::bigint,
      v_pick->>'selection',
      (v_pick->>'odds_at_pick')::numeric
    );
  end loop;

  -- Deduct stake
  update public.wallets
  set balance = balance - p_stake,
      updated_at = now()
  where id = v_wallet_id;

  return v_slip_id;
end;
$$;


ALTER FUNCTION "public"."place_slip"("p_stake" numeric, "p_potential_win" numeric, "p_picks" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_wallet_transaction_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Only trigger when transaction transitions to SUCCESS
  if (OLD.status != 'SUCCESS' and NEW.status = 'SUCCESS') then
    if (NEW.type = 'DEPOSIT') then
      update public.wallets
      set 
        balance = balance + NEW.amount,
        updated_at = now()
      where id = NEW.wallet_id;
    elsif (NEW.type = 'WITHDRAWAL') then
      update public.wallets
      set 
        balance = balance - NEW.amount,
        updated_at = now()
      where id = NEW.wallet_id;
    end if;
  end if;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."process_wallet_transaction_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_withdrawal"("p_amount" numeric, "p_payout_phone" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_user_id uuid := auth.uid();
  v_amount numeric(12,2);
  v_wallet wallets%rowtype;
  v_id uuid := gen_random_uuid();
  v_reference text;
  v_new_balance numeric;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_amount is null then
    raise exception 'invalid_amount';
  end if;
  v_amount := round(p_amount, 2);

  if v_amount < 500 then
    raise exception 'minimum_withdrawal_is_500';
  end if;

  if p_payout_phone is null or p_payout_phone !~ '^254[17][0-9]{8}$' then
    raise exception 'invalid_phone';
  end if;

  -- Lock the wallet row so two simultaneous requests can't both pass the balance check
  select * into v_wallet from wallets where user_id = v_user_id for update;
  if not found then
    raise exception 'wallet_not_found';
  end if;

  if v_wallet.balance < v_amount then
    raise exception 'insufficient_balance';
  end if;

  update wallets
    set balance = balance - v_amount
    where id = v_wallet.id
    returning balance into v_new_balance;

  v_reference := 'wd_' || replace(v_id::text, '-', '');

  insert into withdrawal_requests (id, user_id, reference, amount, payout_phone, status)
  values (v_id, v_user_id, v_reference, v_amount, p_payout_phone, 'REQUESTED');

  insert into wallet_transactions
    (wallet_id, amount, type, status, reference, description, balance_after)
  values
    (v_wallet.id, v_amount, 'WITHDRAWAL', 'REQUESTED', v_reference, 'Withdrawal request', v_new_balance);

  return v_id;
end;
$_$;


ALTER FUNCTION "public"."request_withdrawal"("p_amount" numeric, "p_payout_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_bulk_welcome_notifications"("p_title" "text" DEFAULT 'Welcome to Rankings Efootball'::"text", "p_message" "text" DEFAULT 'Welcome to rankings efootball your ultimate sportsmanship platform'::"text", "p_batch_size" integer DEFAULT 100) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    r_user record;
    v_total_users integer := 0;
begin
    -- 1. Insert in-app notifications ONLY for users who have an expo_push_token (or change to 'from public.profiles' if you want it for everyone)
    -- As requested, this targets users where expo_push_token is not null
    insert into public.notifications (user_id, title, message, type, route)
    select 
        id, 
        p_title, 
        p_message, 
        'welcome', 
        '/home'
    from public.profiles
    where expo_push_token is not null 
      and trim(expo_push_token) != '';

    get diagnostics v_total_users = row_count;
    raise notice 'In-app notifications created for % users with push tokens.', v_total_users;

    -- 2. Loop through valid tokens in batches for push notifications processing
    for r_user in 
        select id, expo_push_token 
        from public.profiles 
        where expo_push_token is not null 
          and trim(expo_push_token) != ''
    loop
        -- You can plug your batch handling or pg_net call here
        -- e.g., accumulating into batches of p_batch_size
        null; 
    end loop;

    raise notice 'Batch push notification queue processing complete.';
end;
$$;


ALTER FUNCTION "public"."send_bulk_welcome_notifications"("p_title" "text", "p_message" "text", "p_batch_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_default_profile_pic"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  seed_text TEXT;
BEGIN
  -- Check if profile_pic is NULL or empty string
  IF NEW.profile_pic IS NULL OR trim(NEW.profile_pic) = '' THEN
    -- Fallback to username if display_name is missing or empty
    seed_text := COALESCE(NULLIF(trim(NEW.display_name), ''), NEW.username, 'User');

    -- Generate DiceBear initials URL replacing spaces with '+'
    NEW.profile_pic := 'https://api.dicebear.com/9.x/initials/png?seed=' || 
                       replace(seed_text, ' ', '+') || 
                       '&backgroundType=gradientLinear';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_default_profile_pic"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_team_avatar_url"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.avatar_url IS NULL OR trim(NEW.avatar_url) = '' THEN
        NEW.avatar_url := public.get_team_avatar_url(NEW.name);
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_team_avatar_url"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_wallets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_wallets_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."settle_deposit"("p_reference" "text", "p_status" "text", "p_amount" numeric DEFAULT NULL::numeric) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_tx wallet_transactions%rowtype;
  v_balance numeric;
begin
  select * into v_tx
  from wallet_transactions
  where reference = p_reference and type = 'DEPOSIT'
  for update;

  if not found then
    raise exception 'unknown_reference';
  end if;

  -- Already settled: never change, never double-credit
  if v_tx.status = 'SUCCESS' then
    return 'ALREADY_SUCCESS';
  end if;

  if p_status = 'SUCCESS' then
    if p_amount is null or p_amount <> v_tx.amount then
      raise exception 'amount_mismatch';
    end if;

    update wallets
      set balance = balance + v_tx.amount
      where id = v_tx.wallet_id
      returning balance into v_balance;

    update wallet_transactions
      set status = 'SUCCESS', balance_after = v_balance, updated_at = now()
      where id = v_tx.id;

    return 'SUCCESS';
  end if;

  if p_status in ('FAILED', 'ABANDONED') then
    update wallet_transactions
      set status = p_status, updated_at = now()
      where id = v_tx.id;
    return p_status;
  end if;

  return v_tx.status;
end;
$$;


ALTER FUNCTION "public"."settle_deposit"("p_reference" "text", "p_status" "text", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."settle_jackpot"("p_jackpot_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_status text;
  v_game_count integer;
  v_finished_games integer;
  v_updated_entries integer;
begin

  -- Lock jackpot while settling
  select
    status,
    game_count
  into
    v_status,
    v_game_count
  from public.jackpots
  where id = p_jackpot_id
  for update;


  if not found then
    raise exception 'Jackpot not found';
  end if;


  -- Must be closed first
  if v_status <> 'closed' then
    raise exception
      'Jackpot must be closed before it can be settled';
  end if;


  -- Make sure every game has a result
  select count(*)
  into v_finished_games
  from public.jackpot_games
  where jackpot_id = p_jackpot_id
    and status = 'finished'
    and outcome is not null;


  if v_finished_games <> v_game_count then
    raise exception
      'Cannot settle jackpot. % of % games have results',
      v_finished_games,
      v_game_count;
  end if;


  -- Update every selection
  update public.jackpot_selections s
  set is_correct = (
    s.selection = g.outcome
  )
  from public.jackpot_games g
  where s.game_id = g.id
    and g.jackpot_id = p_jackpot_id;


  -- Calculate correct predictions for every entry
  update public.jackpot_entries e
  set
    correct_predictions = (
      select count(*)
      from public.jackpot_selections s
      where s.entry_id = e.id
        and s.is_correct = true
    ),
    status = case
      when (
        select count(*)
        from public.jackpot_selections s
        where s.entry_id = e.id
          and s.is_correct = true
      ) = v_game_count
      then 'winner'
      else 'loser'
    end,
    settled_at = now()
  where e.jackpot_id = p_jackpot_id;


  -- Finally settle the jackpot
  update public.jackpots
  set status = 'settled'
  where id = p_jackpot_id;


  get diagnostics v_updated_entries = row_count;

  return v_updated_entries;

end;
$$;


ALTER FUNCTION "public"."settle_jackpot"("p_jackpot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."settle_jackpot_if_complete"("p_jackpot_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_pending_count    int;
  v_submitted_count  int;
  v_game_count       int;
  v_updated          int;
begin
  -- Only settle when every game is finished with a real outcome.
  select count(*) into v_pending_count
  from jackpot_games
  where jackpot_id = p_jackpot_id
    and (
      status <> 'finished'
      or outcome is null
      or outcome not in ('HOME','DRAW','AWAY')
    );

  if v_pending_count > 0 then
    return 'NOT_ALL_GAMES_FINISHED';
  end if;

  -- Nothing to do if every entry is already classified.
  select count(*) into v_submitted_count
  from jackpot_entries
  where jackpot_id = p_jackpot_id
    and status = 'submitted';

  if v_submitted_count = 0 then
    return 'ALREADY_SETTLED';
  end if;

  -- Load the winning threshold from the jackpot row.
  select game_count into v_game_count
  from jackpots
  where id = p_jackpot_id;

  -- Winners: exactly game_count correct predictions.
  update jackpot_entries
  set status = 'winner',
      settled_at = now()
  where jackpot_id = p_jackpot_id
    and status = 'submitted'
    and correct_predictions = v_game_count;

  get diagnostics v_updated = row_count;
  raise notice 'Marked % entries as winner', v_updated;

  -- Losers: everyone else still submitted.
  update jackpot_entries
  set status = 'loser',
      settled_at = now()
  where jackpot_id = p_jackpot_id
    and status = 'submitted';

  -- Mark the jackpot as settled (guard: only if currently open).
  update jackpots
  set status = 'settled'
  where id = p_jackpot_id
    and status = 'open';

  return 'SETTLED';
end;
$$;


ALTER FUNCTION "public"."settle_jackpot_if_complete"("p_jackpot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_jackpot_entry"("p_jackpot_id" "uuid", "p_selections" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id uuid;
  v_entry_id uuid;
  v_game_count integer;
  v_entry_fee numeric(10,2);
  v_status text;
  v_closes_at timestamptz;
  v_selection_count integer;
begin

  -- Logged-in user
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'You must be logged in to enter this jackpot';
  end if;


  -- Get jackpot information
  select
    game_count,
    entry_fee,
    status,
    closes_at
  into
    v_game_count,
    v_entry_fee,
    v_status,
    v_closes_at
  from public.jackpots
  where id = p_jackpot_id
  for update;


  if not found then
    raise exception 'Jackpot not found';
  end if;


  -- Jackpot must be open
  if v_status <> 'open' then
    raise exception 'This jackpot is not open for entries';
  end if;


  -- Closing time
  if v_closes_at is not null
     and now() >= v_closes_at then
    raise exception 'This jackpot has closed';
  end if;


  -- Count submitted selections
  select count(*)
  into v_selection_count
  from jsonb_array_elements(p_selections);


  -- Must have exactly the number of games
  if v_selection_count <> v_game_count then
    raise exception
      'This jackpot requires exactly % selections',
      v_game_count;
  end if;


  -- Prevent duplicate entry
  if exists (
    select 1
    from public.jackpot_entries
    where jackpot_id = p_jackpot_id
      and user_id = v_user_id
  ) then
    raise exception 'You have already entered this jackpot';
  end if;


  -- Validate every selection belongs to this jackpot
  if exists (
    select 1
    from jsonb_array_elements(p_selections) item
    where not exists (
      select 1
      from public.jackpot_games g
      where g.id = (item->>'game_id')::uuid
        and g.jackpot_id = p_jackpot_id
    )
  ) then
    raise exception 'One or more selections belong to another jackpot';
  end if;


  -- Create entry
  insert into public.jackpot_entries (
    jackpot_id,
    user_id,
    entry_number,
    entry_fee
  )
  values (
    p_jackpot_id,
    v_user_id,
    1,
    v_entry_fee
  )
  returning id into v_entry_id;


  -- Create selections
  insert into public.jackpot_selections (
    entry_id,
    game_id,
    selection
  )
  select
    v_entry_id,
    (item->>'game_id')::uuid,
    upper(item->>'selection')
  from jsonb_array_elements(p_selections) item;


  return v_entry_id;

exception
  when unique_violation then
    raise exception 'You have already entered this jackpot';
end;
$$;


ALTER FUNCTION "public"."submit_jackpot_entry"("p_jackpot_id" "uuid", "p_selections" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_entry_correct_predictions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Fires when is_correct changes on a selection.
  -- Recompute the parent entry's tally.
  update jackpot_entries je
  set correct_predictions = (
    select count(*) filter (where is_correct = true)
    from jackpot_selections
    where entry_id = je.id
  )
  where je.id = coalesce(new.entry_id, old.entry_id);
  return new;
end;
$$;


ALTER FUNCTION "public"."sync_entry_correct_predictions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_jackpot_selection_correctness"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Only fire when a real outcome is present.
  -- NULL / invalid outcomes leave selections untouched.
  if new.outcome is null
     or new.outcome not in ('HOME', 'DRAW', 'AWAY')
  then
    return new;
  end if;

  -- Only fire when the outcome actually changed.
  -- `distinct from` handles NULL-safely (old.outcome may be NULL on first settle).
  if old.outcome is not distinct from new.outcome then
    return new;
  end if;

  -- Evaluate every selection for this game.
  -- We only touch rows that haven't been scored yet (is_correct IS NULL),
  -- so:
  --   • re-fires are no-ops
  --   • already-paid-out rows are never rewritten
  --   • admin corrections of a finished result do NOT retroactively flip history
  update jackpot_selections
  set is_correct = (selection = new.outcome)
  where game_id = new.id
    and is_correct is null;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_jackpot_selection_correctness"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_registration_teams_to_tournament"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    -- Only execute if the tournament_id was changed and is not null
    IF (OLD.tournament_id IS DISTINCT FROM NEW.tournament_id) AND (NEW.tournament_id IS NOT NULL) THEN
        
        -- Insert confirmed teams into the teams table
        INSERT INTO public.teams (name, tournament_id, group_id, w, l, d, ga, gf, profile_id)
        SELECT 
            TRIM(tr.team_name),
            NEW.tournament_id,
            0, -- Default unassigned pool group_id
            0, 0, 0, 0, 0,  -- Initialize stats to 0
            tr.user_id  -- Map user_id from tournament_registrations to profile_id in teams
        FROM public.tournament_registrations tr
        WHERE tr.registration_id = NEW.id 
          AND tr.status = 'confirmed'
        ON CONFLICT (tournament_id, name) DO NOTHING; -- Prevents crash if team already exists

    END IF;
    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."sync_registration_teams_to_tournament"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."try_settle_jackpot"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Only attempt when outcome actually became a real value.
  if new.outcome is not null
     and new.outcome in ('HOME','DRAW','AWAY')
     and old.outcome is distinct from new.outcome
  then
    perform settle_jackpot_if_complete(new.jackpot_id);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."try_settle_jackpot"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."jackpot_games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "jackpot_id" "uuid" NOT NULL,
    "game_number" integer NOT NULL,
    "home_team" "text" NOT NULL,
    "away_team" "text" NOT NULL,
    "match_time" timestamp with time zone,
    "outcome" "text",
    "home_score" integer,
    "away_score" integer,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "home_odds" numeric(10,2),
    "away_odds" numeric(10,2),
    "draw_odds" numeric(10,2),
    CONSTRAINT "jackpot_games_number_check" CHECK (("game_number" >= 1)),
    CONSTRAINT "jackpot_games_odds_check" CHECK (((("home_odds" IS NULL) AND ("away_odds" IS NULL) AND ("draw_odds" IS NULL)) OR (("home_odds" > (0)::numeric) AND ("away_odds" > (0)::numeric) AND ("draw_odds" > (0)::numeric)))),
    CONSTRAINT "jackpot_games_outcome_check" CHECK ((("outcome" IS NULL) OR ("outcome" = ANY (ARRAY['HOME'::"text", 'DRAW'::"text", 'AWAY'::"text"])))),
    CONSTRAINT "jackpot_games_scores_check" CHECK (((("home_score" IS NULL) AND ("away_score" IS NULL)) OR (("home_score" >= 0) AND ("away_score" >= 0)))),
    CONSTRAINT "jackpot_games_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'finished'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."jackpot_games" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_jackpot_game_score"("p_game_id" "uuid", "p_home_score" integer, "p_away_score" integer) RETURNS "public"."jackpot_games"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_game public.jackpot_games;
  v_outcome text;
begin

  -- Validate scores
  if p_home_score < 0 or p_away_score < 0 then
    raise exception 'Scores cannot be negative';
  end if;


  -- Determine outcome
  if p_home_score > p_away_score then
    v_outcome := 'HOME';

  elsif p_home_score < p_away_score then
    v_outcome := 'AWAY';

  else
    v_outcome := 'DRAW';
  end if;


  -- Update the game
  update public.jackpot_games
  set
    home_score = p_home_score,
    away_score = p_away_score,
    outcome = v_outcome,
    status = 'finished'
  where id = p_game_id
  returning * into v_game;


  if not found then
    raise exception 'Jackpot game not found';
  end if;


  return v_game;
end;
$$;


ALTER FUNCTION "public"."update_jackpot_game_score"("p_game_id" "uuid", "p_home_score" integer, "p_away_score" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_role_to_admin_on_first_registration"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  registration_count integer;
BEGIN
  -- Check how many registrations this user already has
  SELECT COUNT(*)
  INTO registration_count
  FROM public.registrations
  WHERE created_by = NEW.created_by;
  
  -- If this is their first registration, make them admin
  IF registration_count = 1 THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = NEW.created_by
      AND role != 'admin';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_role_to_admin_on_first_registration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_team_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN

  IF OLD.played = FALSE AND NEW.played = TRUE THEN

    -- HOME TEAM STATS
    UPDATE teams
    SET
      gf = gf + NEW.home_goals,
      ga = ga + NEW.away_goals,
      w = w + CASE
        WHEN NEW.home_goals > NEW.away_goals THEN 1 ELSE 0
      END,
      l = l + CASE
        WHEN NEW.home_goals < NEW.away_goals THEN 1 ELSE 0
      END,
      d = d + CASE
        WHEN NEW.home_goals = NEW.away_goals THEN 1 ELSE 0
      END
    WHERE id = NEW.home_team_id;


    -- AWAY TEAM STATS
    UPDATE teams
    SET
      gf = gf + NEW.away_goals,
      ga = ga + NEW.home_goals,
      w = w + CASE
        WHEN NEW.away_goals > NEW.home_goals THEN 1 ELSE 0
      END,
      l = l + CASE
        WHEN NEW.away_goals < NEW.home_goals THEN 1 ELSE 0
      END,
      d = d + CASE
        WHEN NEW.away_goals = NEW.home_goals THEN 1 ELSE 0
      END
    WHERE id = NEW.away_team_id;


    -- UPDATE PREDICTION OUTCOMES
    UPDATE match_votes
    SET outcome =
      CASE
        WHEN NEW.home_goals > NEW.away_goals
             AND predicted_winner = 'home'
          THEN 'correct'

        WHEN NEW.away_goals > NEW.home_goals
             AND predicted_winner = 'away'
          THEN 'correct'

        WHEN NEW.home_goals = NEW.away_goals
             AND predicted_winner = 'draw'
          THEN 'correct'

        ELSE 'incorrect'
      END
    WHERE match_id = NEW.id
      AND outcome = 'pending';


    -- RECORD POINTS FOR EVERY PREDICTION
    INSERT INTO prediction_points (
      user_id,
      match_id,
      match_vote_id,
      points
    )
    SELECT
      mv.user_id,
      mv.match_id,
      mv.id,
      CASE
        WHEN mv.outcome = 'correct' THEN 20
        ELSE 0
      END
    FROM match_votes mv
    WHERE mv.match_id = NEW.id
      AND mv.outcome IN ('correct', 'incorrect')
    ON CONFLICT (match_vote_id)
    DO UPDATE SET
      points = EXCLUDED.points;

  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_team_stats"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clan_players" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "player_avatar" "text",
    "age" integer,
    "place" "text",
    "clan_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "gender" "text" DEFAULT 'Male'::"text",
    "w" integer DEFAULT 0 NOT NULL,
    "d" integer DEFAULT 0 NOT NULL,
    "l" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "clan_players_gender_check" CHECK (("gender" = ANY (ARRAY['Male'::"text", 'Female'::"text"])))
);


ALTER TABLE "public"."clan_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clans" (
    "id" bigint NOT NULL,
    "clan_name" "text" NOT NULL,
    "clan_avatar" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "w" integer DEFAULT 0 NOT NULL,
    "d" integer DEFAULT 0 NOT NULL,
    "l" integer DEFAULT 0 NOT NULL,
    "gf" integer DEFAULT 0 NOT NULL,
    "ga" integer DEFAULT 0 NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."clans" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."all_players_leaderboard" WITH ("security_invoker"='on') AS
 SELECT "p"."id",
    "p"."name",
    "p"."gender",
    "c"."clan_name" AS "clan",
    (("p"."w" + "p"."d") + "p"."l") AS "mp",
    "p"."w",
    "p"."l",
    "p"."d",
    (("p"."w" * 3) + ("p"."d" * 1)) AS "points",
    "dense_rank"() OVER (ORDER BY (("p"."w" * 3) + ("p"."d" * 1)) DESC, "p"."w" DESC, "p"."name") AS "rank"
   FROM ("public"."clan_players" "p"
     JOIN "public"."clans" "c" ON (("p"."clan_id" = "c"."id")));


ALTER VIEW "public"."all_players_leaderboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bot_config" (
    "id" integer NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb",
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."bot_config" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."bot_config_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bot_config_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bot_config_id_seq" OWNED BY "public"."bot_config"."id";



CREATE TABLE IF NOT EXISTS "public"."bot_sessions" (
    "id" integer NOT NULL,
    "session_name" "text" NOT NULL,
    "creds" "jsonb" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."bot_sessions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."bot_sessions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bot_sessions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bot_sessions_id_seq" OWNED BY "public"."bot_sessions"."id";



CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" bigint NOT NULL,
    "match_id" integer NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "creator_pick" "text" NOT NULL,
    "challenger_id" "uuid",
    "stake_amount" numeric(10,2) NOT NULL,
    "total_pool" numeric(10,2) GENERATED ALWAYS AS (("stake_amount" * (2)::numeric)) STORED,
    "status" "public"."challenge_status" DEFAULT 'open'::"public"."challenge_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "match_outcome" "text",
    CONSTRAINT "challenges_stake_amount_check" CHECK (("stake_amount" > (0)::numeric)),
    CONSTRAINT "check_different_users" CHECK (("creator_id" <> "challenger_id")),
    CONSTRAINT "check_valid_outcome" CHECK (("match_outcome" = ANY (ARRAY['HOME'::"text", 'AWAY'::"text", 'DRAW'::"text"]))),
    CONSTRAINT "check_valid_predictions" CHECK (("creator_pick" = ANY (ARRAY['HOME'::"text", 'AWAY'::"text", 'DRAW'::"text"])))
);


ALTER TABLE "public"."challenges" OWNER TO "postgres";


ALTER TABLE "public"."challenges" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."challenges_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."chat_history" (
    "id" integer NOT NULL,
    "user_jid" "text",
    "message" "text",
    "response" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."chat_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."chat_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."chat_history_id_seq" OWNED BY "public"."chat_history"."id";



CREATE TABLE IF NOT EXISTS "public"."check_ins" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "points" integer DEFAULT 10 NOT NULL,
    "checked_in_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "check_in_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT "check_ins_points_check" CHECK (("points" = 10))
);


ALTER TABLE "public"."check_ins" OWNER TO "postgres";


ALTER TABLE "public"."check_ins" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."check_ins_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."clan_players" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."clan_players_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."clan_players_profiles" WITH ("security_invoker"='on') AS
 SELECT "p"."id",
    "p"."name",
    "p"."player_avatar",
    "p"."age",
    "p"."place",
    "p"."gender",
    "p"."created_at",
    "p"."user_id",
    "c"."id" AS "clan_id",
    "c"."clan_name" AS "clan"
   FROM ("public"."clan_players" "p"
     JOIN "public"."clans" "c" ON (("p"."clan_id" = "c"."id")));


ALTER VIEW "public"."clan_players_profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."clan_rankings" WITH ("security_invoker"='on') AS
 SELECT "id",
    "clan_name" AS "name",
    "clan_avatar",
    (("w" + "d") + "l") AS "mp",
    "w",
    "d",
    "l",
    ("gf" - "ga") AS "gd",
    (("w" * 3) + ("d" * 1)) AS "points",
    "dense_rank"() OVER (ORDER BY (("w" * 3) + ("d" * 1)) DESC, ("gf" - "ga") DESC, "gf" DESC, "clan_name") AS "rank"
   FROM "public"."clans";


ALTER VIEW "public"."clan_rankings" OWNER TO "postgres";


ALTER TABLE "public"."clans" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."clans_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "images" "text"
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_teams" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."external_teams" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."external_teams_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."external_teams_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."external_teams_id_seq" OWNED BY "public"."external_teams"."id";



CREATE TABLE IF NOT EXISTS "public"."followers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_not_self_follow" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."followers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friendly_match_holds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'held'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friendly_match_holds_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "friendly_match_holds_status_check" CHECK (("status" = ANY (ARRAY['held'::"text", 'released'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."friendly_match_holds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friendly_match_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "opponent_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friendly_match_requests_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "friendly_match_requests_different_players_check" CHECK (("requester_id" <> "opponent_id")),
    CONSTRAINT "friendly_match_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."friendly_match_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friendly_match_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "player_one_id" "uuid" NOT NULL,
    "player_two_id" "uuid" NOT NULL,
    "player_one_score" integer DEFAULT 0 NOT NULL,
    "player_two_score" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friendly_match_scores_different_players_check" CHECK (("player_one_id" <> "player_two_id")),
    CONSTRAINT "friendly_match_scores_player_one_score_check" CHECK (("player_one_score" >= 0)),
    CONSTRAINT "friendly_match_scores_player_two_score_check" CHECK (("player_two_score" >= 0))
);


ALTER TABLE "public"."friendly_match_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_subscribers" (
    "id" bigint NOT NULL,
    "phone_number" "text" NOT NULL,
    "jid" "text" NOT NULL,
    "opted_in" boolean DEFAULT true,
    "opted_in_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "invite_sent" boolean DEFAULT false NOT NULL,
    "label" "text"
);


ALTER TABLE "public"."group_subscribers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."group_subscribers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."group_subscribers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."group_subscribers_id_seq" OWNED BY "public"."group_subscribers"."id";



CREATE TABLE IF NOT EXISTS "public"."jackpot_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "jackpot_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entry_number" integer NOT NULL,
    "entry_fee" numeric(10,2) NOT NULL,
    "correct_predictions" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "settled_at" timestamp with time zone,
    CONSTRAINT "jackpot_entries_correct_predictions_check" CHECK (("correct_predictions" >= 0)),
    CONSTRAINT "jackpot_entries_entry_fee_check" CHECK (("entry_fee" >= (0)::numeric)),
    CONSTRAINT "jackpot_entries_entry_number_check" CHECK (("entry_number" >= 1)),
    CONSTRAINT "jackpot_entries_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'winner'::"text", 'loser'::"text", 'void'::"text"])))
);


ALTER TABLE "public"."jackpot_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jackpot_selections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "game_id" "uuid" NOT NULL,
    "selection" "text" NOT NULL,
    "is_correct" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "jackpot_selections_selection_check" CHECK (("selection" = ANY (ARRAY['HOME'::"text", 'DRAW'::"text", 'AWAY'::"text"])))
);


ALTER TABLE "public"."jackpot_selections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jackpots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "game_count" integer NOT NULL,
    "entry_fee" numeric(10,2) DEFAULT 0 NOT NULL,
    "prize_amount" numeric(12,2),
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "starts_at" timestamp with time zone,
    "closes_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "jackpots_entry_fee_check" CHECK (("entry_fee" >= (0)::numeric)),
    CONSTRAINT "jackpots_game_count_check" CHECK ((("game_count" >= 5) AND ("game_count" <= 10))),
    CONSTRAINT "jackpots_prize_amount_check" CHECK ((("prize_amount" IS NULL) OR ("prize_amount" >= (0)::numeric))),
    CONSTRAINT "jackpots_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'open'::"text", 'closed'::"text", 'settled'::"text"])))
);


ALTER TABLE "public"."jackpots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaderboard" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "passkey" character varying(255),
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean
);


ALTER TABLE "public"."leaderboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leagues" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "organizer" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "avatar_url" "text",
    "passkey" "text",
    "rules" "text",
    "short_intro" "text",
    "country" "text",
    "season" "text"
);


ALTER TABLE "public"."leagues" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."leagues_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."leagues_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."leagues_id_seq" OWNED BY "public"."leagues"."id";



CREATE TABLE IF NOT EXISTS "public"."match_votes" (
    "id" bigint NOT NULL,
    "match_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "predicted_winner" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "outcome" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "match_votes_outcome_check" CHECK (("outcome" = ANY (ARRAY['pending'::"text", 'correct'::"text", 'incorrect'::"text"])))
);


ALTER TABLE "public"."match_votes" OWNER TO "postgres";


ALTER TABLE "public"."match_votes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."match_votes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" integer NOT NULL,
    "home_team_id" integer,
    "away_team_id" integer,
    "home_goals" integer DEFAULT 0 NOT NULL,
    "away_goals" integer DEFAULT 0 NOT NULL,
    "played" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "stage" "text" DEFAULT 'GROUP'::"text" NOT NULL,
    "group_id" integer DEFAULT 1,
    "tournament_id" integer,
    "round" integer,
    "home_possession" integer DEFAULT 50,
    "away_possession" integer DEFAULT 50,
    "home_shots" integer DEFAULT 0,
    "away_shots" integer DEFAULT 0,
    "home_shots_on_target" integer DEFAULT 0,
    "away_shots_on_target" integer DEFAULT 0,
    "home_fouls" integer DEFAULT 0,
    "away_fouls" integer DEFAULT 0,
    "home_offsides" integer DEFAULT 0,
    "away_offsides" integer DEFAULT 0,
    "home_corner_kicks" integer DEFAULT 0,
    "away_corner_kicks" integer DEFAULT 0,
    "home_free_kicks" integer DEFAULT 0,
    "away_free_kicks" integer DEFAULT 0,
    "home_passes" integer DEFAULT 0,
    "away_passes" integer DEFAULT 0,
    "home_successful_passes" integer DEFAULT 0,
    "away_successful_passes" integer DEFAULT 0,
    "home_crosses" integer DEFAULT 0,
    "away_crosses" integer DEFAULT 0,
    "home_interceptions" integer DEFAULT 0,
    "away_interceptions" integer DEFAULT 0,
    "home_tackles" integer DEFAULT 0,
    "away_tackles" integer DEFAULT 0,
    "home_saves" integer DEFAULT 0,
    "away_saves" integer DEFAULT 0,
    "home_ht_goals" integer DEFAULT 0,
    "away_ht_goals" integer DEFAULT 0,
    CONSTRAINT "matches_stage_check" CHECK (("stage" = ANY (ARRAY['GROUP'::"text", 'OPENING_ROUND'::"text", 'WINNERS_BRACKET'::"text", 'LOSERS_BRACKET'::"text", 'GRAND_FINAL'::"text", 'GRAND_FINAL_RESET'::"text", 'QUARTER'::"text", 'SEMI'::"text", 'FINAL'::"text", 'THIRD_PLACE'::"text"])))
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."matches_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."matches_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."matches_id_seq" OWNED BY "public"."matches"."id";



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'general'::"text",
    "route" "text",
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."paystack_transactions" (
    "reference" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'KES'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."paystack_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posted_questions" (
    "id" integer NOT NULL,
    "question_id" bigint NOT NULL,
    "title" "text",
    "link" "text",
    "posted_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."posted_questions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."posted_questions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."posted_questions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."posted_questions_id_seq" OWNED BY "public"."posted_questions"."id";



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" integer NOT NULL,
    "title" character varying(255),
    "summary" "text",
    "image_url" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "views" integer DEFAULT 0 NOT NULL,
    "likes" integer DEFAULT 0 NOT NULL,
    "video_url" "text",
    "media_type" "text",
    CONSTRAINT "check_media_type" CHECK (("media_type" = ANY (ARRAY['image'::"text", 'video'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."posts"."video_url" IS 'URL to the video file if post contains a video';



COMMENT ON COLUMN "public"."posts"."media_type" IS 'Type of media: image or video';



CREATE SEQUENCE IF NOT EXISTS "public"."posts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."posts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."posts_id_seq" OWNED BY "public"."posts"."id";



CREATE TABLE IF NOT EXISTS "public"."prediction_points" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "match_id" integer NOT NULL,
    "match_vote_id" bigint NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "prediction_points_points_check" CHECK (("points" >= 0))
);


ALTER TABLE "public"."prediction_points" OWNER TO "postgres";


ALTER TABLE "public"."prediction_points" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."prediction_points_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "profile_pic" "text",
    "gender" "text",
    "county" "text",
    "expo_push_token" "text",
    "phone" "text",
    CONSTRAINT "profiles_county_check" CHECK (("county" = ANY (ARRAY['Mombasa'::"text", 'Kwale'::"text", 'Kilifi'::"text", 'Tana River'::"text", 'Lamu'::"text", 'Taita-Taveta'::"text", 'Garissa'::"text", 'Wajir'::"text", 'Mandera'::"text", 'Marsabit'::"text", 'Isiolo'::"text", 'Meru'::"text", 'Tharaka-Nithi'::"text", 'Embu'::"text", 'Kitui'::"text", 'Machakos'::"text", 'Makueni'::"text", 'Nyandarua'::"text", 'Nyeri'::"text", 'Kirinyaga'::"text", 'Murang''a'::"text", 'Kiambu'::"text", 'Turkana'::"text", 'West Pokot'::"text", 'Samburu'::"text", 'Trans Nzoia'::"text", 'Uasin Gishu'::"text", 'Elgeyo-Marakwet'::"text", 'Nandi'::"text", 'Baringo'::"text", 'Laikipia'::"text", 'Nakuru'::"text", 'Narok'::"text", 'Kajiado'::"text", 'Kericho'::"text", 'Bomet'::"text", 'Kakamega'::"text", 'Vihiga'::"text", 'Bungoma'::"text", 'Busia'::"text", 'Siaya'::"text", 'Kisumu'::"text", 'Homa Bay'::"text", 'Migori'::"text", 'Kisii'::"text", 'Nyamira'::"text", 'Nairobi'::"text"]))),
    CONSTRAINT "profiles_gender_check" CHECK (("gender" = ANY (ARRAY['Male'::"text", 'Female'::"text"]))),
    CONSTRAINT "profiles_phone_check" CHECK ((("phone" IS NULL) OR ("phone" ~ '^[0-9+\-() ]+$'::"text"))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['member'::"text", 'leaderboard'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tournament_type" "text",
    "max_players" integer,
    "avatar_url" "text",
    "registration_amount" numeric DEFAULT 100 NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "tournament_id" integer,
    CONSTRAINT "registration_amount_min_check" CHECK (("registration_amount" >= (100)::numeric))
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


ALTER TABLE "public"."registrations" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."registrations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."slip_selections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slip_id" "uuid" NOT NULL,
    "event_id" bigint NOT NULL,
    "selection" "text" NOT NULL,
    "odds_at_pick" numeric(8,3),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "slip_selections_selection_check" CHECK (("selection" = ANY (ARRAY['HOME'::"text", 'DRAW'::"text", 'AWAY'::"text"])))
);


ALTER TABLE "public"."slip_selections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stake" numeric(12,2) NOT NULL,
    "potential_win" numeric(12,2),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "settled_at" timestamp with time zone,
    CONSTRAINT "slips_stake_check" CHECK (("stake" > (0)::numeric)),
    CONSTRAINT "slips_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'won'::"text", 'lost'::"text", 'void'::"text"])))
);


ALTER TABLE "public"."slips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "w" integer DEFAULT 0,
    "l" integer DEFAULT 0,
    "d" integer DEFAULT 0,
    "group_id" smallint,
    "ga" integer DEFAULT 0,
    "gf" integer DEFAULT 0,
    "tournament_id" integer NOT NULL,
    "league_id" integer,
    "profile_id" "uuid",
    "team_code" "text" DEFAULT "public"."generate_team_code"(),
    "avatar_url" "text",
    CONSTRAINT "teams_d_check" CHECK (("d" >= 0)),
    CONSTRAINT "teams_ga_check" CHECK (("ga" >= 0)),
    CONSTRAINT "teams_gf_check" CHECK (("gf" >= 0)),
    CONSTRAINT "teams_l_check" CHECK (("l" >= 0)),
    CONSTRAINT "teams_w_check" CHECK (("w" >= 0))
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."teams_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."teams_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."teams_id_seq" OWNED BY "public"."teams"."id";



CREATE TABLE IF NOT EXISTS "public"."tournament_followers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" integer,
    "user_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."tournament_followers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournament_registrations" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "team_name" "text" NOT NULL,
    "username" "text" NOT NULL,
    "whatsapp" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "registration_id" bigint,
    CONSTRAINT "tournament_registrations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'rejected'::"text", 'withdrawn'::"text"]))),
    CONSTRAINT "tournament_registrations_team_name_check" CHECK (("length"("team_name") >= 3)),
    CONSTRAINT "tournament_registrations_username_check" CHECK (("length"("username") >= 3))
);


ALTER TABLE "public"."tournament_registrations" OWNER TO "postgres";


ALTER TABLE "public"."tournament_registrations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tournament_registrations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tournament_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" "text" NOT NULL,
    "tournaments_played" integer DEFAULT 0,
    "w" integer DEFAULT 0,
    "d" integer DEFAULT 0,
    "l" integer DEFAULT 0,
    "goals" integer DEFAULT 0,
    "against" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    "leaderboard_id" "text"
);


ALTER TABLE "public"."tournament_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."tournament_two_view" WITH ("security_invoker"='on') AS
 SELECT "rank"() OVER (ORDER BY (("w" * 3) + "d") DESC, ("gf" - "ga") DESC, "gf" DESC, "id") AS "rank",
    "id",
    "name",
    "group_id",
    "w",
    "d",
    "l",
    (("w" * 3) + "d") AS "points",
    "gf",
    "ga",
    ("gf" - "ga") AS "gd"
   FROM "public"."teams"
  WHERE ("tournament_id" = 2);


ALTER VIEW "public"."tournament_two_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournaments" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "tournament_type" "text" DEFAULT 'single_elimination'::"text",
    "passkey" "text",
    "tournament_avatar" "text",
    "first_place_prize" numeric,
    "second_place_prize" numeric,
    "third_place_prize" numeric,
    "league_id" integer,
    "status" "text" DEFAULT 'live'::"text",
    "is_verified" boolean DEFAULT false NOT NULL,
    CONSTRAINT "check_status" CHECK (("status" = ANY (ARRAY['live'::"text", 'finished'::"text"]))),
    CONSTRAINT "check_tournament_type" CHECK (("tournament_type" = ANY (ARRAY['single_elimination'::"text", 'round_robin_single'::"text", 'round_robin_double'::"text", 'double_elimination'::"text"])))
);


ALTER TABLE "public"."tournaments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."tournaments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tournaments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tournaments_id_seq" OWNED BY "public"."tournaments"."id";



CREATE OR REPLACE VIEW "public"."tournamentstats_view" AS
 SELECT "username",
    "tournaments_played",
    (("w" + "d") + "l") AS "mp",
    "w",
    "d",
    "l",
    "goals",
    "against",
    ("goals" - "against") AS "gd",
        CASE
            WHEN ((("w" + "d") + "l") > 0) THEN "round"(((("w")::numeric / ((("w" + "d") + "l"))::numeric) * (100)::numeric), 2)
            ELSE 0.00
        END AS "points",
    "row_number"() OVER (ORDER BY ((("w" + "d") + "l") > 0) DESC,
        CASE
            WHEN ((("w" + "d") + "l") > 0) THEN (("w")::numeric / ((("w" + "d") + "l"))::numeric)
            ELSE ('-1'::integer)::numeric
        END DESC, ("goals" - "against") DESC, "goals" DESC, "username") AS "rank"
   FROM "public"."tournament_stats";


ALTER VIEW "public"."tournamentstats_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_total_points" AS
 SELECT "p"."id" AS "user_id",
    COALESCE("pred"."total_pred_points", (0)::bigint) AS "prediction_points",
    COALESCE("chk"."total_checkin_points", (0)::bigint) AS "checkin_points",
    (COALESCE("pred"."total_pred_points", (0)::bigint) + COALESCE("chk"."total_checkin_points", (0)::bigint)) AS "total_points"
   FROM (("public"."profiles" "p"
     LEFT JOIN ( SELECT "prediction_points"."user_id",
            "sum"("prediction_points"."points") AS "total_pred_points"
           FROM "public"."prediction_points"
          GROUP BY "prediction_points"."user_id") "pred" ON (("p"."id" = "pred"."user_id")))
     LEFT JOIN ( SELECT "check_ins"."user_id",
            "sum"("check_ins"."points") AS "total_checkin_points"
           FROM "public"."check_ins"
          GROUP BY "check_ins"."user_id") "chk" ON (("p"."id" = "chk"."user_id")));


ALTER VIEW "public"."user_total_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "type" "public"."tx_type" DEFAULT 'DEPOSIT'::"public"."tx_type" NOT NULL,
    "status" "public"."tx_status" DEFAULT 'PENDING'::"public"."tx_status" NOT NULL,
    "reference" character varying(100),
    "checkout_request_id" character varying(255),
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "balance_after" numeric,
    CONSTRAINT "wallet_transactions_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."wallet_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" numeric(12,2) DEFAULT 0.00 NOT NULL,
    "currency" character varying(3) DEFAULT 'KES'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "wallets_balance_check" CHECK (("balance" >= (0)::numeric)),
    CONSTRAINT "wallets_currency_check" CHECK ((("currency")::"text" = 'KES'::"text"))
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawal_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reference" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "payout_phone" "text" NOT NULL,
    "status" "text" DEFAULT 'REQUESTED'::"text" NOT NULL,
    "payout_reference" "text",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "paid_out_at" timestamp with time zone,
    CONSTRAINT "withdrawal_requests_amount_check" CHECK (("amount" >= (500)::numeric)),
    CONSTRAINT "withdrawal_requests_payout_phone_check" CHECK (("payout_phone" ~ '^254[17][0-9]{8}$'::"text")),
    CONSTRAINT "withdrawal_requests_status_check" CHECK (("status" = ANY (ARRAY['REQUESTED'::"text", 'PAID_OUT'::"text"])))
);


ALTER TABLE "public"."withdrawal_requests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bot_config" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bot_config_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bot_sessions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bot_sessions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."chat_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."chat_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."external_teams" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."external_teams_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."group_subscribers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."group_subscribers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."leagues" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."leagues_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."matches" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."matches_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."posted_questions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."posted_questions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."posts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."posts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."teams" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."teams_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tournaments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tournaments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bot_config"
    ADD CONSTRAINT "bot_config_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."bot_config"
    ADD CONSTRAINT "bot_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bot_sessions"
    ADD CONSTRAINT "bot_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bot_sessions"
    ADD CONSTRAINT "bot_sessions_session_name_key" UNIQUE ("session_name");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_history"
    ADD CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."check_ins"
    ADD CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."check_ins"
    ADD CONSTRAINT "check_ins_user_date_unique" UNIQUE ("user_id", "check_in_date");



ALTER TABLE ONLY "public"."clan_players"
    ADD CONSTRAINT "clan_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clans"
    ADD CONSTRAINT "clans_clan_name_key" UNIQUE ("clan_name");



ALTER TABLE ONLY "public"."clans"
    ADD CONSTRAINT "clans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_teams"
    ADD CONSTRAINT "external_teams_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."external_teams"
    ADD CONSTRAINT "external_teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendly_match_holds"
    ADD CONSTRAINT "friendly_match_holds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendly_match_holds"
    ADD CONSTRAINT "friendly_match_holds_unique_request" UNIQUE ("request_id");



ALTER TABLE ONLY "public"."friendly_match_requests"
    ADD CONSTRAINT "friendly_match_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendly_match_scores"
    ADD CONSTRAINT "friendly_match_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendly_match_scores"
    ADD CONSTRAINT "friendly_match_scores_unique_request" UNIQUE ("request_id");



ALTER TABLE ONLY "public"."group_subscribers"
    ADD CONSTRAINT "group_subscribers_jid_key" UNIQUE ("jid");



ALTER TABLE ONLY "public"."group_subscribers"
    ADD CONSTRAINT "group_subscribers_phone_number_key" UNIQUE ("phone_number");



ALTER TABLE ONLY "public"."group_subscribers"
    ADD CONSTRAINT "group_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jackpot_entries"
    ADD CONSTRAINT "jackpot_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jackpot_entries"
    ADD CONSTRAINT "jackpot_entries_unique_entry" UNIQUE ("jackpot_id", "user_id", "entry_number");



ALTER TABLE ONLY "public"."jackpot_games"
    ADD CONSTRAINT "jackpot_games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jackpot_games"
    ADD CONSTRAINT "jackpot_games_unique_number" UNIQUE ("jackpot_id", "game_number");



ALTER TABLE ONLY "public"."jackpot_selections"
    ADD CONSTRAINT "jackpot_selections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jackpot_selections"
    ADD CONSTRAINT "jackpot_selections_unique_game" UNIQUE ("entry_id", "game_id");



ALTER TABLE ONLY "public"."jackpots"
    ADD CONSTRAINT "jackpots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaderboard"
    ADD CONSTRAINT "leaderboard_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match_votes"
    ADD CONSTRAINT "match_votes_match_id_user_id_key" UNIQUE ("match_id", "user_id");



ALTER TABLE ONLY "public"."match_votes"
    ADD CONSTRAINT "match_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."paystack_transactions"
    ADD CONSTRAINT "paystack_transactions_pkey" PRIMARY KEY ("reference");



ALTER TABLE ONLY "public"."posted_questions"
    ADD CONSTRAINT "posted_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posted_questions"
    ADD CONSTRAINT "posted_questions_question_id_key" UNIQUE ("question_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prediction_points"
    ADD CONSTRAINT "prediction_points_match_vote_unique" UNIQUE ("match_vote_id");



ALTER TABLE ONLY "public"."prediction_points"
    ADD CONSTRAINT "prediction_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slip_selections"
    ADD CONSTRAINT "slip_selections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slip_selections"
    ADD CONSTRAINT "slip_selections_unique_pick" UNIQUE ("slip_id", "event_id");



ALTER TABLE ONLY "public"."slips"
    ADD CONSTRAINT "slips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_team_code_key" UNIQUE ("team_code");



ALTER TABLE ONLY "public"."tournament_followers"
    ADD CONSTRAINT "tournament_followers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_followers"
    ADD CONSTRAINT "tournament_followers_tournament_id_user_id_key" UNIQUE ("tournament_id", "user_id");



ALTER TABLE ONLY "public"."tournament_registrations"
    ADD CONSTRAINT "tournament_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_stats"
    ADD CONSTRAINT "tournament_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "unique_follower_following" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "unique_team_per_tournament" UNIQUE ("tournament_id", "name");



ALTER TABLE ONLY "public"."tournament_registrations"
    ADD CONSTRAINT "unique_username_per_registration" UNIQUE ("registration_id", "username");



ALTER TABLE ONLY "public"."tournament_registrations"
    ADD CONSTRAINT "unique_whatsapp_per_registration" UNIQUE ("registration_id", "whatsapp");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_checkout_request_id_key" UNIQUE ("checkout_request_id");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_reference_key" UNIQUE ("reference");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_reference_key" UNIQUE ("reference");



CREATE INDEX "idx_challenges_challenger_search" ON "public"."challenges" USING "btree" ("challenger_id");



CREATE INDEX "idx_challenges_creator_search" ON "public"."challenges" USING "btree" ("creator_id");



CREATE INDEX "idx_challenges_match_lobby" ON "public"."challenges" USING "btree" ("match_id", "status");



CREATE INDEX "idx_chat_history_user_jid" ON "public"."chat_history" USING "btree" ("user_jid");



CREATE INDEX "idx_followers_follower_id" ON "public"."followers" USING "btree" ("follower_id");



CREATE INDEX "idx_followers_following_id" ON "public"."followers" USING "btree" ("following_id");



CREATE INDEX "idx_friendly_match_holds_request_id" ON "public"."friendly_match_holds" USING "btree" ("request_id");



CREATE INDEX "idx_friendly_match_holds_status" ON "public"."friendly_match_holds" USING "btree" ("status");



CREATE INDEX "idx_friendly_match_requests_created_at" ON "public"."friendly_match_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_friendly_match_requests_opponent" ON "public"."friendly_match_requests" USING "btree" ("opponent_id");



CREATE INDEX "idx_friendly_match_requests_requester" ON "public"."friendly_match_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_friendly_match_requests_status" ON "public"."friendly_match_requests" USING "btree" ("status");



CREATE INDEX "idx_friendly_match_scores_player_one" ON "public"."friendly_match_scores" USING "btree" ("player_one_id");



CREATE INDEX "idx_friendly_match_scores_player_two" ON "public"."friendly_match_scores" USING "btree" ("player_two_id");



CREATE INDEX "idx_friendly_match_scores_request_id" ON "public"."friendly_match_scores" USING "btree" ("request_id");



CREATE INDEX "idx_leaderboard_created_by" ON "public"."leaderboard" USING "btree" ("created_by");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_posted_questions_question_id" ON "public"."posted_questions" USING "btree" ("question_id");



CREATE INDEX "idx_posts_media_type" ON "public"."posts" USING "btree" ("media_type");



CREATE INDEX "idx_posts_video_url" ON "public"."posts" USING "btree" ("video_url") WHERE ("video_url" IS NOT NULL);



CREATE INDEX "idx_profiles_expo_push_token" ON "public"."profiles" USING "btree" ("expo_push_token");



CREATE INDEX "idx_slip_selections_event_id" ON "public"."slip_selections" USING "btree" ("event_id");



CREATE INDEX "idx_slip_selections_slip_id" ON "public"."slip_selections" USING "btree" ("slip_id");



CREATE INDEX "idx_slips_pending" ON "public"."slips" USING "btree" ("id") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_slips_status" ON "public"."slips" USING "btree" ("status");



CREATE INDEX "idx_slips_user_id" ON "public"."slips" USING "btree" ("user_id");



CREATE INDEX "idx_wallet_transactions_created_at" ON "public"."wallet_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_wallet_transactions_status" ON "public"."wallet_transactions" USING "btree" ("status");



CREATE INDEX "idx_wallet_transactions_type" ON "public"."wallet_transactions" USING "btree" ("type");



CREATE INDEX "idx_wallet_transactions_wallet_id" ON "public"."wallet_transactions" USING "btree" ("wallet_id");



CREATE INDEX "idx_wallets_user_id" ON "public"."wallets" USING "btree" ("user_id");



CREATE UNIQUE INDEX "jackpot_entries_one_entry_per_user" ON "public"."jackpot_entries" USING "btree" ("jackpot_id", "user_id");



CREATE INDEX "withdrawal_requests_status_idx" ON "public"."withdrawal_requests" USING "btree" ("status", "requested_at");



CREATE INDEX "withdrawal_requests_user_idx" ON "public"."withdrawal_requests" USING "btree" ("user_id", "requested_at" DESC);



CREATE OR REPLACE TRIGGER "match_result_trigger" AFTER UPDATE OF "played" ON "public"."matches" FOR EACH ROW WHEN (("new"."played" = true)) EXECUTE FUNCTION "public"."update_team_stats"();



CREATE OR REPLACE TRIGGER "on_first_registration_make_admin" AFTER INSERT ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_role_to_admin_on_first_registration"();



CREATE OR REPLACE TRIGGER "on_league_created" AFTER INSERT ON "public"."leagues" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_league"();



CREATE OR REPLACE TRIGGER "on_tournament_created" AFTER INSERT ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."notify_tournament_creator"();



CREATE OR REPLACE TRIGGER "set_wallets_updated_at_trigger" BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."set_wallets_updated_at"();



CREATE OR REPLACE TRIGGER "trg_auto_complete_unplayed_matches" AFTER UPDATE OF "status" ON "public"."tournaments" FOR EACH ROW WHEN (("new"."status" = 'finished'::"text")) EXECUTE FUNCTION "public"."auto_complete_unplayed_matches"();



CREATE OR REPLACE TRIGGER "trg_auto_populate_tournament_avatar" BEFORE INSERT OR UPDATE ON "public"."tournaments" FOR EACH ROW EXECUTE FUNCTION "public"."auto_populate_tournament_avatar"();



CREATE OR REPLACE TRIGGER "trg_downgrade_on_last_tournament_delete" AFTER DELETE ON "public"."tournaments" FOR EACH ROW WHEN (("old"."created_by" IS NOT NULL)) EXECUTE FUNCTION "public"."downgrade_if_no_tournaments_left"();



CREATE OR REPLACE TRIGGER "trg_make_creator_admin" AFTER INSERT ON "public"."tournaments" FOR EACH ROW WHEN (("new"."created_by" IS NOT NULL)) EXECUTE FUNCTION "public"."make_creator_admin"();



CREATE OR REPLACE TRIGGER "trg_set_team_avatar_url" BEFORE INSERT OR UPDATE OF "name", "avatar_url" ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."set_team_avatar_url"();



CREATE OR REPLACE TRIGGER "trigger_create_profile_wallet" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_profile_wallet"();



CREATE OR REPLACE TRIGGER "trigger_pay_jackpot_winner" AFTER UPDATE OF "status" ON "public"."jackpot_entries" FOR EACH ROW WHEN ((("old"."status" IS DISTINCT FROM "new"."status") AND ("new"."status" = 'winner'::"text"))) EXECUTE FUNCTION "public"."pay_jackpot_winner"();



CREATE OR REPLACE TRIGGER "trigger_set_default_profile_pic" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_default_profile_pic"();



CREATE OR REPLACE TRIGGER "trigger_settle_jackpot" AFTER UPDATE OF "outcome" ON "public"."jackpot_games" FOR EACH ROW EXECUTE FUNCTION "public"."try_settle_jackpot"();



CREATE OR REPLACE TRIGGER "trigger_sync_entry_correct_predictions" AFTER UPDATE OF "is_correct" ON "public"."jackpot_selections" FOR EACH ROW EXECUTE FUNCTION "public"."sync_entry_correct_predictions"();



CREATE OR REPLACE TRIGGER "trigger_sync_jackpot_selection_correctness" AFTER UPDATE OF "outcome" ON "public"."jackpot_games" FOR EACH ROW EXECUTE FUNCTION "public"."sync_jackpot_selection_correctness"();



CREATE OR REPLACE TRIGGER "trigger_sync_teams_on_tournament_link" AFTER UPDATE OF "tournament_id" ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."sync_registration_teams_to_tournament"();



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_challenger_id_fkey" FOREIGN KEY ("challenger_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."check_ins"
    ADD CONSTRAINT "check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clan_players"
    ADD CONSTRAINT "clan_players_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clan_players"
    ADD CONSTRAINT "clan_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clans"
    ADD CONSTRAINT "clans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "fk_follower" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "fk_following" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "fk_matches_tournament" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_registrations"
    ADD CONSTRAINT "fk_registration" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "fk_teams_profile" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "fk_teams_tournament" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendly_match_holds"
    ADD CONSTRAINT "friendly_match_holds_request_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."friendly_match_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendly_match_requests"
    ADD CONSTRAINT "friendly_match_requests_opponent_fkey" FOREIGN KEY ("opponent_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendly_match_requests"
    ADD CONSTRAINT "friendly_match_requests_requester_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendly_match_scores"
    ADD CONSTRAINT "friendly_match_scores_player_one_fkey" FOREIGN KEY ("player_one_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendly_match_scores"
    ADD CONSTRAINT "friendly_match_scores_player_two_fkey" FOREIGN KEY ("player_two_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendly_match_scores"
    ADD CONSTRAINT "friendly_match_scores_request_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."friendly_match_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jackpot_entries"
    ADD CONSTRAINT "jackpot_entries_jackpot_id_fkey" FOREIGN KEY ("jackpot_id") REFERENCES "public"."jackpots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jackpot_entries"
    ADD CONSTRAINT "jackpot_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jackpot_games"
    ADD CONSTRAINT "jackpot_games_jackpot_id_fkey" FOREIGN KEY ("jackpot_id") REFERENCES "public"."jackpots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jackpot_selections"
    ADD CONSTRAINT "jackpot_selections_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."jackpot_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jackpot_selections"
    ADD CONSTRAINT "jackpot_selections_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."jackpot_games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leaderboard"
    ADD CONSTRAINT "leaderboard_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_votes"
    ADD CONSTRAINT "match_votes_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id");



ALTER TABLE ONLY "public"."match_votes"
    ADD CONSTRAINT "match_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prediction_points"
    ADD CONSTRAINT "prediction_points_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prediction_points"
    ADD CONSTRAINT "prediction_points_match_vote_id_fkey" FOREIGN KEY ("match_vote_id") REFERENCES "public"."match_votes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prediction_points"
    ADD CONSTRAINT "prediction_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prediction_points"
    ADD CONSTRAINT "prediction_points_user_id_profiles_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."slip_selections"
    ADD CONSTRAINT "slip_selections_slip_id_fkey" FOREIGN KEY ("slip_id") REFERENCES "public"."slips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slips"
    ADD CONSTRAINT "slips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_followers"
    ADD CONSTRAINT "tournament_followers_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_followers"
    ADD CONSTRAINT "tournament_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_registrations"
    ADD CONSTRAINT "tournament_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can create jackpot games" ON "public"."jackpot_games" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can create jackpots" ON "public"."jackpots" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can delete jackpot entries" ON "public"."jackpot_entries" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can delete jackpot games" ON "public"."jackpot_games" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can delete jackpot selections" ON "public"."jackpot_selections" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can delete jackpots" ON "public"."jackpots" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update jackpot entries" ON "public"."jackpot_entries" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update jackpot games" ON "public"."jackpot_games" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update jackpot selections" ON "public"."jackpot_selections" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update jackpots" ON "public"."jackpots" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all jackpot entries" ON "public"."jackpot_entries" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all jackpot selections" ON "public"."jackpot_selections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "All" ON "public"."leagues" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public delete from bot_sessions" ON "public"."bot_sessions" FOR DELETE USING (true);



CREATE POLICY "Allow public delete from chat_history" ON "public"."chat_history" FOR DELETE USING (true);



CREATE POLICY "Allow public delete from posted_questions" ON "public"."posted_questions" FOR DELETE USING (true);



CREATE POLICY "Allow public insert to bot_config" ON "public"."bot_config" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert to bot_sessions" ON "public"."bot_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert to chat_history" ON "public"."chat_history" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert to posted_questions" ON "public"."posted_questions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public inserts and updates" ON "public"."group_subscribers" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public read access" ON "public"."registrations" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to bot_config" ON "public"."bot_config" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to bot_sessions" ON "public"."bot_sessions" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to chat_history" ON "public"."chat_history" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to posted_questions" ON "public"."posted_questions" FOR SELECT USING (true);



CREATE POLICY "Allow public update to bot_config" ON "public"."bot_config" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Allow public update to bot_sessions" ON "public"."bot_sessions" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Allow requesters to delete pending requests" ON "public"."friendly_match_requests" FOR DELETE TO "authenticated" USING ((("requester_id" = "auth"."uid"()) AND ("status" = 'pending'::"text")));



CREATE POLICY "Allow users to create friendly requests" ON "public"."friendly_match_requests" FOR INSERT TO "authenticated" WITH CHECK (("requester_id" = "auth"."uid"()));



CREATE POLICY "Allow users to update relevant friendly requests" ON "public"."friendly_match_requests" FOR UPDATE TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("opponent_id" = "auth"."uid"()))) WITH CHECK ((("requester_id" = "auth"."uid"()) OR ("opponent_id" = "auth"."uid"())));



CREATE POLICY "Allow users to view friendly requests" ON "public"."friendly_match_requests" FOR SELECT TO "authenticated" USING ((("status" = 'pending'::"text") OR ("requester_id" = "auth"."uid"()) OR ("opponent_id" = "auth"."uid"())));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."challenges" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for users based on user_id" ON "public"."challenges" FOR INSERT WITH CHECK (true);



CREATE POLICY "Followers are viewable by everyone" ON "public"."followers" FOR SELECT USING (true);



CREATE POLICY "Opponent can respond to friendly match request" ON "public"."friendly_match_requests" FOR UPDATE TO "authenticated" USING ((("opponent_id" = "auth"."uid"()) AND ("status" = 'pending'::"text"))) WITH CHECK ((("opponent_id" = "auth"."uid"()) AND ("status" = ANY (ARRAY['accepted'::"text", 'rejected'::"text"]))));



CREATE POLICY "Participants can view friendly match requests" ON "public"."friendly_match_requests" FOR SELECT TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("opponent_id" = "auth"."uid"())));



CREATE POLICY "Public can view jackpot games" ON "public"."jackpot_games" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can view jackpots" ON "public"."jackpots" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Requester can cancel friendly match request" ON "public"."friendly_match_requests" FOR UPDATE TO "authenticated" USING ((("requester_id" = "auth"."uid"()) AND ("status" = 'pending'::"text"))) WITH CHECK ((("requester_id" = "auth"."uid"()) AND ("status" = 'cancelled'::"text")));



CREATE POLICY "Users can create friendly match requests" ON "public"."friendly_match_requests" FOR INSERT TO "authenticated" WITH CHECK ((("requester_id" = "auth"."uid"()) AND ("requester_id" <> "opponent_id")));



CREATE POLICY "Users can create own jackpot entries" ON "public"."jackpot_entries" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create own jackpot selections" ON "public"."jackpot_selections" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."jackpot_entries" "e"
  WHERE (("e"."id" = "jackpot_selections"."entry_id") AND ("e"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can follow others" ON "public"."followers" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can insert notifications for themselves or system functio" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unfollow" ON "public"."followers" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own jackpot entries" ON "public"."jackpot_entries" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own jackpot selections" ON "public"."jackpot_selections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."jackpot_entries" "e"
  WHERE (("e"."id" = "jackpot_selections"."entry_id") AND ("e"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."wallet_transactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."wallets" "w"
  WHERE (("w"."id" = "wallet_transactions"."wallet_id") AND ("w"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own wallet" ON "public"."wallets" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "access" ON "public"."teams" TO "authenticated", "anon", "service_role" USING (true);



CREATE POLICY "all" ON "public"."bot_sessions" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."challenges" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."check_ins" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."clan_players" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."clans" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."external_teams" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."leaderboard" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."match_votes" TO "authenticated", "anon", "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."matches" TO "authenticated", "anon", "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."posts" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."prediction_points" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."registrations" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."tournament_followers" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."tournament_registrations" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."tournament_stats" TO "authenticated", "anon", "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "all" ON "public"."tournaments" TO "authenticated", "anon", "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "all access" ON "public"."profiles" TO "authenticated", "anon", "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "allowaccess" ON "public"."comments" FOR SELECT TO "authenticated", "anon", "service_role" USING (true);



CREATE POLICY "allowaccess" ON "public"."profiles" FOR SELECT TO "authenticated", "anon", "service_role" USING (true);



CREATE POLICY "allowaccess" ON "public"."teams" FOR SELECT TO "authenticated", "anon", "service_role" USING (true);



CREATE POLICY "allowinsert" ON "public"."comments" FOR INSERT TO "authenticated", "anon", "service_role" WITH CHECK (true);



CREATE POLICY "allowinsert" ON "public"."teams" FOR INSERT TO "authenticated", "anon", "service_role" WITH CHECK (true);



ALTER TABLE "public"."bot_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bot_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."check_ins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clan_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."external_teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friendly_match_holds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friendly_match_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friendly_match_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_subscribers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jackpot_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jackpot_games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jackpot_selections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jackpots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaderboard" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leagues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."paystack_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posted_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prediction_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."slip_selections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "slip_selections_insert_own" ON "public"."slip_selections" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."slips" "s"
  WHERE (("s"."id" = "slip_selections"."slip_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "slip_selections_select_own" ON "public"."slip_selections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."slips" "s"
  WHERE (("s"."id" = "slip_selections"."slip_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."slips" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "slips_insert_own" ON "public"."slips" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "slips_select_own" ON "public"."slips" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournaments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wallet_tx_select_own" ON "public"."wallet_transactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."wallets" "w"
  WHERE (("w"."id" = "wallet_transactions"."wallet_id") AND ("w"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wallets_select_own" ON "public"."wallets" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."withdrawal_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "withdrawals_select_own" ON "public"."withdrawal_requests" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."wallet_transactions";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."auto_complete_unplayed_matches"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_complete_unplayed_matches"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_complete_unplayed_matches"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_populate_tournament_avatar"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_populate_tournament_avatar"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_populate_tournament_avatar"() TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_pending_deposit"("p_user_id" "uuid", "p_reference" "text", "p_amount" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_pending_deposit"("p_user_id" "uuid", "p_reference" "text", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_wallet"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_wallet"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_wallet"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_jackpot_entry_fee"("p_user_id" "uuid", "p_jackpot_id" "uuid", "p_reference" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_jackpot_entry_fee"("p_user_id" "uuid", "p_jackpot_id" "uuid", "p_reference" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_jackpot_entry_fee"("p_user_id" "uuid", "p_jackpot_id" "uuid", "p_reference" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."downgrade_if_no_tournaments_left"() TO "anon";
GRANT ALL ON FUNCTION "public"."downgrade_if_no_tournaments_left"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."downgrade_if_no_tournaments_left"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_team_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_team_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_team_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_standings"("t_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_standings"("t_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_standings"("t_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_avatar_url"("team_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_avatar_url"("team_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_avatar_url"("team_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_mpesa_deposit"("p_user_id" "uuid", "p_amount" numeric, "p_checkout_request_id" "text", "p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_mpesa_deposit"("p_user_id" "uuid", "p_amount" numeric, "p_checkout_request_id" "text", "p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_mpesa_deposit"("p_user_id" "uuid", "p_amount" numeric, "p_checkout_request_id" "text", "p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_league"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_league"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_league"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "postgres";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "anon";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_post_likes"("post_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_post_likes"("post_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_post_likes"("post_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_post_views"("post_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_post_views"("post_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_post_views"("post_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."make_creator_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."make_creator_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."make_creator_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_withdrawal_paid_out"("p_withdrawal_id" "uuid", "p_payout_reference" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_withdrawal_paid_out"("p_withdrawal_id" "uuid", "p_payout_reference" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_tournament_creator"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_tournament_creator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_tournament_creator"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pay_jackpot_winner"() TO "anon";
GRANT ALL ON FUNCTION "public"."pay_jackpot_winner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pay_jackpot_winner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."perform_daily_check_in"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."perform_daily_check_in"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."perform_daily_check_in"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."place_slip"("p_stake" numeric, "p_potential_win" numeric, "p_picks" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."place_slip"("p_stake" numeric, "p_potential_win" numeric, "p_picks" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."place_slip"("p_stake" numeric, "p_potential_win" numeric, "p_picks" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_wallet_transaction_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_wallet_transaction_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_wallet_transaction_status"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."request_withdrawal"("p_amount" numeric, "p_payout_phone" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."request_withdrawal"("p_amount" numeric, "p_payout_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_withdrawal"("p_amount" numeric, "p_payout_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_bulk_welcome_notifications"("p_title" "text", "p_message" "text", "p_batch_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."send_bulk_welcome_notifications"("p_title" "text", "p_message" "text", "p_batch_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_bulk_welcome_notifications"("p_title" "text", "p_message" "text", "p_batch_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_default_profile_pic"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_default_profile_pic"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_default_profile_pic"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_team_avatar_url"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_team_avatar_url"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_team_avatar_url"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_wallets_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_wallets_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_wallets_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."settle_deposit"("p_reference" "text", "p_status" "text", "p_amount" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."settle_deposit"("p_reference" "text", "p_status" "text", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."settle_jackpot"("p_jackpot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."settle_jackpot"("p_jackpot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."settle_jackpot"("p_jackpot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."settle_jackpot_if_complete"("p_jackpot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."settle_jackpot_if_complete"("p_jackpot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."settle_jackpot_if_complete"("p_jackpot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_jackpot_entry"("p_jackpot_id" "uuid", "p_selections" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_jackpot_entry"("p_jackpot_id" "uuid", "p_selections" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_jackpot_entry"("p_jackpot_id" "uuid", "p_selections" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_entry_correct_predictions"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_entry_correct_predictions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_entry_correct_predictions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_jackpot_selection_correctness"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_jackpot_selection_correctness"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_jackpot_selection_correctness"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_registration_teams_to_tournament"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_registration_teams_to_tournament"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_registration_teams_to_tournament"() TO "service_role";



GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."try_settle_jackpot"() TO "anon";
GRANT ALL ON FUNCTION "public"."try_settle_jackpot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."try_settle_jackpot"() TO "service_role";



GRANT ALL ON TABLE "public"."jackpot_games" TO "anon";
GRANT ALL ON TABLE "public"."jackpot_games" TO "authenticated";
GRANT ALL ON TABLE "public"."jackpot_games" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_jackpot_game_score"("p_game_id" "uuid", "p_home_score" integer, "p_away_score" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_jackpot_game_score"("p_game_id" "uuid", "p_home_score" integer, "p_away_score" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_jackpot_game_score"("p_game_id" "uuid", "p_home_score" integer, "p_away_score" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_role_to_admin_on_first_registration"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_role_to_admin_on_first_registration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_role_to_admin_on_first_registration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_team_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_team_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_team_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "service_role";


















GRANT ALL ON TABLE "public"."clan_players" TO "anon";
GRANT ALL ON TABLE "public"."clan_players" TO "authenticated";
GRANT ALL ON TABLE "public"."clan_players" TO "service_role";



GRANT ALL ON TABLE "public"."clans" TO "anon";
GRANT ALL ON TABLE "public"."clans" TO "authenticated";
GRANT ALL ON TABLE "public"."clans" TO "service_role";



GRANT ALL ON TABLE "public"."all_players_leaderboard" TO "anon";
GRANT ALL ON TABLE "public"."all_players_leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."all_players_leaderboard" TO "service_role";



GRANT ALL ON TABLE "public"."bot_config" TO "anon";
GRANT ALL ON TABLE "public"."bot_config" TO "authenticated";
GRANT ALL ON TABLE "public"."bot_config" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bot_config_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bot_config_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bot_config_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bot_sessions" TO "anon";
GRANT ALL ON TABLE "public"."bot_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."bot_sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bot_sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bot_sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bot_sessions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chat_history" TO "anon";
GRANT ALL ON TABLE "public"."chat_history" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."check_ins" TO "anon";
GRANT ALL ON TABLE "public"."check_ins" TO "authenticated";
GRANT ALL ON TABLE "public"."check_ins" TO "service_role";



GRANT ALL ON SEQUENCE "public"."check_ins_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."check_ins_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."check_ins_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."clan_players_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."clan_players_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."clan_players_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."clan_players_profiles" TO "anon";
GRANT ALL ON TABLE "public"."clan_players_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."clan_players_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."clan_rankings" TO "anon";
GRANT ALL ON TABLE "public"."clan_rankings" TO "authenticated";
GRANT ALL ON TABLE "public"."clan_rankings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."clans_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."clans_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."clans_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."external_teams" TO "anon";
GRANT ALL ON TABLE "public"."external_teams" TO "authenticated";
GRANT ALL ON TABLE "public"."external_teams" TO "service_role";



GRANT ALL ON SEQUENCE "public"."external_teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."external_teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."external_teams_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."followers" TO "anon";
GRANT ALL ON TABLE "public"."followers" TO "authenticated";
GRANT ALL ON TABLE "public"."followers" TO "service_role";



GRANT ALL ON TABLE "public"."friendly_match_holds" TO "anon";
GRANT ALL ON TABLE "public"."friendly_match_holds" TO "authenticated";
GRANT ALL ON TABLE "public"."friendly_match_holds" TO "service_role";



GRANT ALL ON TABLE "public"."friendly_match_requests" TO "anon";
GRANT ALL ON TABLE "public"."friendly_match_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."friendly_match_requests" TO "service_role";



GRANT ALL ON TABLE "public"."friendly_match_scores" TO "anon";
GRANT ALL ON TABLE "public"."friendly_match_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."friendly_match_scores" TO "service_role";



GRANT ALL ON TABLE "public"."group_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."group_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."group_subscribers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."group_subscribers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."group_subscribers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."group_subscribers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."jackpot_entries" TO "anon";
GRANT ALL ON TABLE "public"."jackpot_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."jackpot_entries" TO "service_role";



GRANT ALL ON TABLE "public"."jackpot_selections" TO "anon";
GRANT ALL ON TABLE "public"."jackpot_selections" TO "authenticated";
GRANT ALL ON TABLE "public"."jackpot_selections" TO "service_role";



GRANT ALL ON TABLE "public"."jackpots" TO "anon";
GRANT ALL ON TABLE "public"."jackpots" TO "authenticated";
GRANT ALL ON TABLE "public"."jackpots" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard" TO "service_role";



GRANT ALL ON TABLE "public"."leagues" TO "anon";
GRANT ALL ON TABLE "public"."leagues" TO "authenticated";
GRANT ALL ON TABLE "public"."leagues" TO "service_role";



GRANT ALL ON SEQUENCE "public"."leagues_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."leagues_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."leagues_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."match_votes" TO "anon";
GRANT ALL ON TABLE "public"."match_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."match_votes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."match_votes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."match_votes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."match_votes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON SEQUENCE "public"."matches_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."matches_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."matches_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."paystack_transactions" TO "anon";
GRANT ALL ON TABLE "public"."paystack_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."paystack_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."posted_questions" TO "anon";
GRANT ALL ON TABLE "public"."posted_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."posted_questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."posted_questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."posted_questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."posted_questions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."posts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."prediction_points" TO "anon";
GRANT ALL ON TABLE "public"."prediction_points" TO "authenticated";
GRANT ALL ON TABLE "public"."prediction_points" TO "service_role";



GRANT ALL ON SEQUENCE "public"."prediction_points_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."prediction_points_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."prediction_points_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."registrations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."registrations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."registrations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."slip_selections" TO "anon";
GRANT ALL ON TABLE "public"."slip_selections" TO "authenticated";
GRANT ALL ON TABLE "public"."slip_selections" TO "service_role";



GRANT ALL ON TABLE "public"."slips" TO "anon";
GRANT ALL ON TABLE "public"."slips" TO "authenticated";
GRANT ALL ON TABLE "public"."slips" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_followers" TO "anon";
GRANT ALL ON TABLE "public"."tournament_followers" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_followers" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_registrations" TO "anon";
GRANT ALL ON TABLE "public"."tournament_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_registrations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tournament_registrations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tournament_registrations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tournament_registrations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_stats" TO "anon";
GRANT ALL ON TABLE "public"."tournament_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_stats" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_two_view" TO "anon";
GRANT ALL ON TABLE "public"."tournament_two_view" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_two_view" TO "service_role";



GRANT ALL ON TABLE "public"."tournaments" TO "anon";
GRANT ALL ON TABLE "public"."tournaments" TO "authenticated";
GRANT ALL ON TABLE "public"."tournaments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tournaments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tournaments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tournaments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tournamentstats_view" TO "anon";
GRANT ALL ON TABLE "public"."tournamentstats_view" TO "authenticated";
GRANT ALL ON TABLE "public"."tournamentstats_view" TO "service_role";



GRANT ALL ON TABLE "public"."user_total_points" TO "anon";
GRANT ALL ON TABLE "public"."user_total_points" TO "authenticated";
GRANT ALL ON TABLE "public"."user_total_points" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."wallet_transactions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."wallet_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."withdrawal_requests" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."withdrawal_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawal_requests" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































