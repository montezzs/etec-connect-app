-- Add rate limiting for admin actions
CREATE TABLE IF NOT EXISTS public.admin_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  action_count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  UNIQUE(admin_id, action_type)
);

ALTER TABLE public.admin_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can view their own rate limits
CREATE POLICY "Admins can view their own rate limits"
ON public.admin_rate_limits
FOR SELECT
USING (auth.uid() = admin_id);

-- Update admin_add_balance to include rate limiting
CREATE OR REPLACE FUNCTION public.admin_add_balance(target_user_id uuid, amount numeric, reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _current_count integer;
  _window_start timestamptz;
  _max_per_hour integer := 20;
  _max_single_amount numeric := 10000;
  _old_balance numeric;
  _new_balance numeric;
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can add balance';
  END IF;
  
  -- Validate amount
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  IF amount > _max_single_amount THEN
    RAISE EXCEPTION 'Amount exceeds maximum allowed (Ð$ %)', _max_single_amount;
  END IF;
  
  -- Check rate limit (20 per hour)
  SELECT action_count, window_start INTO _current_count, _window_start
  FROM public.admin_rate_limits
  WHERE admin_id = auth.uid()
    AND action_type = 'add_balance'
    AND window_start > now() - interval '1 hour';
  
  IF _current_count >= _max_per_hour THEN
    RAISE EXCEPTION 'Rate limit exceeded. Maximum % balance additions per hour. Try again later.', _max_per_hour;
  END IF;
  
  -- Get old balance
  SELECT balance INTO _old_balance
  FROM public.profiles
  WHERE id = target_user_id;
  
  -- Update balance
  UPDATE public.profiles
  SET balance = balance + amount
  WHERE id = target_user_id
  RETURNING balance INTO _new_balance;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (target_user_id, 'income', amount, 'Depósito administrativo: ' || reason);
  
  -- Create notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    target_user_id,
    'Depósito recebido',
    'Você recebeu Ð$ ' || amount::TEXT || ' - ' || reason,
    'admin'
  );
  
  -- Log audit event
  PERFORM public.log_audit_event(
    'admin_add_balance',
    'profiles',
    target_user_id,
    jsonb_build_object('balance', _old_balance),
    jsonb_build_object('balance', _new_balance, 'amount_added', amount, 'reason', reason)
  );
  
  -- Update rate limit counter
  INSERT INTO public.admin_rate_limits (admin_id, action_type, action_count, window_start)
  VALUES (auth.uid(), 'add_balance', 1, now())
  ON CONFLICT (admin_id, action_type)
  DO UPDATE SET
    action_count = CASE
      WHEN public.admin_rate_limits.window_start < now() - interval '1 hour'
      THEN 1
      ELSE public.admin_rate_limits.action_count + 1
    END,
    window_start = CASE
      WHEN public.admin_rate_limits.window_start < now() - interval '1 hour'
      THEN now()
      ELSE public.admin_rate_limits.window_start
    END;
END;
$function$;