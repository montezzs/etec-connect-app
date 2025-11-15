-- Create virtual_cards table for user-specific cards
CREATE TABLE IF NOT EXISTS public.virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_number TEXT NOT NULL,
  cvv TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  cardholder_name TEXT NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own card"
ON public.virtual_cards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card"
ON public.virtual_cards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card"
ON public.virtual_cards
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_virtual_cards_updated_at
BEFORE UPDATE ON public.virtual_cards
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();