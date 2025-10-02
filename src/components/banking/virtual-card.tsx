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

interface VirtualCardProps {
  onBack: () => void;
  userBalance: number;
}

export const VirtualCard = ({ onBack, userBalance }: VirtualCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [cardLocked, setCardLocked] = useState(false);
  const [cvv, setCvv] = useState("847");
  const [copied, setCopied] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const cardNumber = "5234 5678 9012 3456";
  const expiryDate = "12/28";
  const cardholderName = "ETEC CENTRO PAULA SOUZA";

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

  const generateNewCvv = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const newCvv = Math.floor(Math.random() * 900 + 100).toString();
      setCvv(newCvv);
      setIsRegenerating(false);
      toast({
        title: "CVV atualizado!",
        description: "Novo código CVV gerado com sucesso",
      });
    }, 1500);
  };

  const toggleCardLock = () => {
    setCardLocked(!cardLocked);
    toast({
      title: cardLocked ? "Cartão desbloqueado" : "Cartão bloqueado",
      description: cardLocked 
        ? "Seu cartão virtual foi desbloqueado para uso" 
        : "Seu cartão virtual foi bloqueado temporariamente",
      variant: cardLocked ? "default" : "destructive",
    });
  };

  useEffect(() => {
    // Gerar novo CVV a cada 24h (simulado com 30s para demo)
    const interval = setInterval(() => {
      const newCvv = Math.floor(Math.random() * 900 + 100).toString();
      setCvv(newCvv);
      toast({
        title: "CVV renovado automaticamente",
        description: "Seu CVV foi atualizado por segurança",
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [toast]);

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