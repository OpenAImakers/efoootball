-- Insert an open jackpot with 5 games while respecting all constraints
DO $$
DECLARE
    v_jackpot_id UUID;
BEGIN
    -- 1. Insert the main Jackpot record (status = 'open', game_count = 5)
    INSERT INTO public.jackpots (name, game_count, entry_fee, prize_amount, status, starts_at, closes_at)
    VALUES ('Weekend Mega Jackpot', 5, 50.00, 10000.00, 'open', NOW(), NOW() + INTERVAL '2 days')
    RETURNING id INTO v_jackpot_id;

    -- 2. Insert 5 matches linked to this jackpot
    INSERT INTO public.jackpot_games (jackpot_id, game_number, home_team, away_team, match_time, home_odds, away_odds, draw_odds, status)
    VALUES 
        (v_jackpot_id, 1, 'Arsenal', 'Chelsea', NOW() + INTERVAL '1 day', 2.10, 3.40, 3.20, 'pending'),
        (v_jackpot_id, 2, 'Real Madrid', 'Barcelona', NOW() + INTERVAL '1 day 2 hours', 1.95, 3.70, 3.50, 'pending'),
        (v_jackpot_id, 3, 'Bayern Munich', 'Dortmund', NOW() + INTERVAL '1 day 4 hours', 1.60, 4.50, 4.00, 'pending'),
        (v_jackpot_id, 4, 'AC Milan', 'Inter Milan', NOW() + INTERVAL '1 day 6 hours', 2.80, 2.50, 3.10, 'pending'),
        (v_jackpot_id, 5, 'PSG', 'Marseille', NOW() + INTERVAL '1 day 8 hours', 1.50, 5.00, 4.20, 'pending');
END $$;