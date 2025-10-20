-- Ensure the handle_new_user trigger exists and is correct
-- This will auto-create profiles when users sign up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with 0 balance
  INSERT INTO public.profiles (id, username, full_name, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    0.00
  );
  
  -- Create user role (default: user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create a secure function to process transactions server-side
CREATE OR REPLACE FUNCTION public.process_transaction(
  _amount numeric,
  _type text,
  _description text,
  _recipient_key text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _current_balance numeric;
  _new_balance numeric;
  _recipient_id uuid;
  _transaction_id uuid;
BEGIN
  -- Get current user
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Validate amount
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'O valor deve ser maior que zero';
  END IF;
  
  IF _amount > 1000000 THEN
    RAISE EXCEPTION 'O valor excede o limite máximo';
  END IF;
  
  -- Validate description length
  IF LENGTH(_description) > 200 THEN
    RAISE EXCEPTION 'A descrição é muito longa';
  END IF;
  
  -- Lock user profile and get current balance
  SELECT balance INTO _current_balance
  FROM public.profiles
  WHERE id = _user_id
  FOR UPDATE;
  
  IF _current_balance IS NULL THEN
    RAISE EXCEPTION 'Perfil do usuário não encontrado';
  END IF;
  
  -- For send transactions, check balance and find recipient
  IF _type = 'send' THEN
    IF _current_balance < _amount THEN
      RAISE EXCEPTION 'Saldo insuficiente';
    END IF;
    
    -- Find recipient by PIX key (username)
    IF _recipient_key IS NOT NULL THEN
      SELECT id INTO _recipient_id
      FROM public.profiles
      WHERE username = _recipient_key;
      
      IF _recipient_id IS NULL THEN
        RAISE EXCEPTION 'Destinatário não encontrado';
      END IF;
      
      IF _recipient_id = _user_id THEN
        RAISE EXCEPTION 'Você não pode enviar dinheiro para si mesmo';
      END IF;
    END IF;
    
    _new_balance := _current_balance - _amount;
  ELSE
    _new_balance := _current_balance + _amount;
  END IF;
  
  -- Update sender balance
  UPDATE public.profiles
  SET balance = _new_balance
  WHERE id = _user_id;
  
  -- If it's a transfer, update recipient balance
  IF _type = 'send' AND _recipient_id IS NOT NULL THEN
    UPDATE public.profiles
    SET balance = balance + _amount
    WHERE id = _recipient_id;
    
    -- Create receive transaction for recipient
    INSERT INTO public.transactions (user_id, type, amount, description, recipient_key)
    VALUES (_recipient_id, 'receive', _amount, 'PIX recebido de ' || (SELECT username FROM profiles WHERE id = _user_id), NULL);
    
    -- Create notification for recipient
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      _recipient_id,
      'Transferência recebida',
      'Você recebeu Ð$ ' || _amount::TEXT || ' de ' || (SELECT username FROM profiles WHERE id = _user_id),
      'transaction'
    );
  END IF;
  
  -- Create transaction record for sender
  INSERT INTO public.transactions (user_id, type, amount, description, recipient_key)
  VALUES (_user_id, _type, _amount, _description, _recipient_key)
  RETURNING id INTO _transaction_id;
  
  -- Create notification for sender
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    _user_id,
    CASE WHEN _type = 'send' THEN 'Transferência enviada' ELSE 'Transferência recebida' END,
    CASE WHEN _type = 'send' THEN 'Enviou Ð$ ' ELSE 'Recebeu Ð$ ' END || _amount::TEXT,
    'transaction'
  );
  
  -- Return success with new balance
  RETURN json_build_object(
    'success', true,
    'new_balance', _new_balance,
    'transaction_id', _transaction_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;