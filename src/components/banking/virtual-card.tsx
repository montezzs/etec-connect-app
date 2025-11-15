import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankingButton } from "@/components/ui/banking-button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CreditCard, 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  Shield,
  RefreshCw,
  Lock,
  Unlock,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VirtualCardProps {
  onBack: () => void;
  userBalance: number;
  userId: string;
  username: string;
}

export const VirtualCard = ({ onBack, userBalance, userId, username }: VirtualCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [cardLocked, setCardLocked] = useState(false);
  const [cvv, setCvv] = useState("");
  const [copied, setCopied] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  const formatCurrency = (value: number) => {
    return `Ð$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({
        title: `${type} copiado!`,
        description: "Informação copiada para a área de transferência",
      });
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a informação",
        variant: "destructive",
      });
    }
  };

  const generateNewCvv = async () => {
    setIsRegenerating(true);
    try {
      const newCvv = Math.floor(Math.random() * 900 + 100).toString();
      const { error } = await supabase
        .from('virtual_cards')
        .update({ cvv: newCvv })
        .eq('user_id', userId);

      if (error) throw error;

      setCvv(newCvv);
      toast({
        title: "CVV atualizado!",
        description: "Novo código CVV gerado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar CVV",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const toggleCardLock = async () => {
    try {
      const newLockState = !cardLocked;
      const { error } = await supabase
        .from('virtual_cards')
        .update({ is_locked: newLockState })
        .eq('user_id', userId);

      if (error) throw error;

      setCardLocked(newLockState);
      toast({
        title: newLockState ? "Cartão bloqueado" : "Cartão desbloqueado",
        description: newLockState 
          ? "Seu cartão virtual foi bloqueado temporariamente"
          : "Seu cartão virtual foi desbloqueado para uso",
        variant: newLockState ? "destructive" : "default",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar estado do cartão",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Load or create user's virtual card
  useEffect(() => {
    const loadCard = async () => {
      try {
        const { data, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setCardNumber(data.card_number);
          setCvv(data.cvv);
          setExpiryDate(data.expiry_date);
          setCardholderName(data.cardholder_name);
          setCardLocked(data.is_locked || false);
        } else {
          // Create new card
          const newCardNumber = `5234 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
          const newCvv = Math.floor(100 + Math.random() * 900).toString();
          const newExpiry = `${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}/${new Date().getFullYear() + 4}`;
          const newName = username.toUpperCase();

          const { error: insertError } = await supabase
            .from('virtual_cards')
            .insert({
              user_id: userId,
              card_number: newCardNumber,
              cvv: newCvv,
              expiry_date: newExpiry,
              cardholder_name: newName,
              is_locked: false
            });

          if (insertError) throw insertError;

          setCardNumber(newCardNumber);
          setCvv(newCvv);
          setExpiryDate(newExpiry);
          setCardholderName(newName);
        }
      } catch (error: any) {
        toast({
          title: "Erro ao carregar cartão",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCard();
  }, [userId, username, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light p-4 text-primary-foreground">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <BankingButton
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </BankingButton>
          <h1 className="text-xl font-bold">Cartão Virtual</h1>
          <BankingButton
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Settings className="w-5 h-5" />
          </BankingButton>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Virtual Card */}
        <div className="animate-fade-in">
          <Card className="relative overflow-hidden shadow-[var(--shadow-elevation)] animate-card-float">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-primary opacity-90" />
            <div className="absolute top-4 right-4">
              <CreditCard className="w-8 h-8 text-primary-foreground/80" />
            </div>
            <div className="absolute top-4 left-4">
              <Shield className="w-6 h-6 text-primary-foreground/80" />
            </div>
            
            <CardContent className="relative p-6 text-primary-foreground">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm opacity-90">Número do cartão</p>
                  <p className="text-xl font-mono tracking-wider">
                    {showDetails ? cardNumber : "•••• •••• •••• 3456"}
                  </p>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <p className="text-xs opacity-90">Titular</p>
                    <p className="text-sm font-semibold">
                      {showDetails ? cardholderName : "••••••••••••••••"}
                    </p>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-xs opacity-90">Válido até</p>
                    <p className="text-sm font-mono">
                      {showDetails ? expiryDate : "••/••"}
                    </p>
                  </div>
                </div>
              </div>
              
              {cardLocked && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm font-medium">Cartão Bloqueado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Card Controls */}
        <Card className="shadow-[var(--shadow-card)] animate-fade-in">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <BankingButton
                variant={showDetails ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex-1"
              >
                {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showDetails ? "Ocultar" : "Mostrar"}
              </BankingButton>
              <BankingButton
                variant={cardLocked ? "danger" : "success"}
                size="sm"
                onClick={toggleCardLock}
                className="flex-1"
              >
                {cardLocked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                {cardLocked ? "Desbloquear" : "Bloquear"}
              </BankingButton>
            </div>
          </CardContent>
        </Card>

        {/* Card Details */}
        <Card className="shadow-[var(--shadow-card)] animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Informações do cartão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Balance */}
            <div className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
              <span className="text-sm font-medium">Limite disponível</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(userBalance)}</span>
            </div>

            {/* CVV */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">CVV Dinâmico</Label>
                <Badge variant="secondary" className="text-xs">
                  Renova automaticamente
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-accent/50 rounded-lg font-mono text-lg tracking-wider">
                  {showDetails ? cvv : "•••"}
                </div>
                <BankingButton
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(cvv, "CVV")}
                  disabled={!showDetails}
                >
                  {copied === "CVV" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </BankingButton>
                <BankingButton
                  variant="outline"
                  size="icon"
                  onClick={generateNewCvv}
                  disabled={isRegenerating}
                >
                  <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                </BankingButton>
              </div>
            </div>

            {/* Copy Actions */}
            {showDetails && (
              <div className="grid grid-cols-2 gap-2">
                <BankingButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(cardNumber.replace(/\s/g, ''), "Número")}
                >
                  {copied === "Número" ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copiar número
                </BankingButton>
                <BankingButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(expiryDate, "Validade")}
                >
                  {copied === "Validade" ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copiar validade
                </BankingButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="shadow-[var(--shadow-card)] animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>CVV dinâmico ativo</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Notificações em tempo real</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Bloqueio instantâneo disponível</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${cardLocked ? 'bg-destructive' : 'bg-success'}`} />
                <span>Status: {cardLocked ? 'Bloqueado' : 'Ativo'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={className}>{children}</label>
);