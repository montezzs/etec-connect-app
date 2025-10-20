import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BankingButton } from "@/components/ui/banking-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SmartFormValidation } from "@/components/ai/smart-form-validation";
import { ContextualPrompts } from "@/components/ai/contextual-prompts";
import { 
  QrCode, 
  Smartphone, 
  DollarSign, 
  ArrowLeft, 
  Copy, 
  Check,
  Scan,
  Send,
  Receipt
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PixSystemProps {
  onBack: () => void;
  userBalance: number;
  onTransaction: (amount: number, type: 'send' | 'receive', description: string, recipientKey?: string) => Promise<void>;
}

export const PixSystem = ({ onBack, userBalance, onTransaction }: PixSystemProps) => {
  const [activeTab, setActiveTab] = useState("send");
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userActions, setUserActions] = useState<string[]>(['pix-first-access']);
  const [isFormValid, setIsFormValid] = useState(false);
  const { toast } = useToast();

  const myPixKey = "etec.user@cps.sp.gov.br";
  const qrCodeData = `00020101021226570014br.gov.bcb.pix2535${myPixKey}52040000530398654041.005802BR5925ETEC CENTRO PAULA SOUZA6009SAO PAULO62070503***6304`;

  const formatCurrency = (value: number) => {
    return `Ð$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const handleCopyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(myPixKey);
      setCopied(true);
      toast({
        title: "Chave PIX copiada!",
        description: "A chave foi copiada para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a chave PIX",
        variant: "destructive",
      });
    }
  };

  const handleSendPix = async () => {
    if (!pixKey || !amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a chave PIX e o valor",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await onTransaction(
        numAmount, 
        'send', 
        description || `PIX para ${pixKey}`,
        pixKey
      );
      
      setPixKey("");
      setAmount("");
      setDescription("");
      
      toast({
        title: "PIX enviado com sucesso!",
        description: `${formatCurrency(numAmount)} transferido via PIX`,
      });
    } catch (error) {
      // Error already handled in onTransaction
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceivePix = async () => {
    // Simular recebimento PIX
    const randomAmount = Math.floor(Math.random() * 500) + 50;
    try {
      await onTransaction(randomAmount, 'receive', "PIX recebido");
      toast({
        title: "PIX recebido!",
        description: `Você recebeu ${formatCurrency(randomAmount)}`,
      });
    } catch (error) {
      // Error already handled
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-success to-success p-4 text-success-foreground">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <BankingButton
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-success-foreground hover:bg-success-foreground/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </BankingButton>
          <h1 className="text-xl font-bold">PIX</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Balance Display */}
        <Card className="mb-6 shadow-[var(--shadow-card)] animate-fade-in">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Saldo disponível</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(userBalance)}</p>
            </div>
          </CardContent>
        </Card>

        {/* PIX Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="send" className="text-xs">Enviar</TabsTrigger>
            <TabsTrigger value="receive" className="text-xs">Receber</TabsTrigger>
            <TabsTrigger value="qrcode" className="text-xs">QR Code</TabsTrigger>
          </TabsList>

          {/* Send PIX */}
          <TabsContent value="send">
            <Card className="shadow-[var(--shadow-card)] animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Enviar PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SmartFormValidation
                  type="pix-key"
                  value={pixKey}
                  label="Chave PIX do destinatário"
                  placeholder="E-mail, CPF, telefone ou chave aleatória"
                  onChange={setPixKey}
                  onValidationChange={(valid) => setIsFormValid(valid && !!amount)}
                />
                
                <SmartFormValidation
                  type="amount"
                  value={amount}
                  label="Valor (Ð$)"
                  placeholder="0,00"
                  userBalance={userBalance}
                  onChange={setAmount}
                  onValidationChange={(valid) => setIsFormValid(valid && !!pixKey)}
                />

                <SmartFormValidation
                  type="description"
                  value={description}
                  label="Descrição (opcional)"
                  placeholder="Descrição da transferência"
                  onChange={setDescription}
                />

                <BankingButton
                  variant="pix"
                  className="w-full"
                  onClick={handleSendPix}
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-success-foreground border-t-transparent rounded-full animate-spin" />
                      Processando PIX...
                    </div>
                  ) : (
                    "Enviar PIX"
                  )}
                </BankingButton>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receive PIX */}
          <TabsContent value="receive">
            <Card className="shadow-[var(--shadow-card)] animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Receber PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="p-6 bg-accent/50 rounded-lg">
                    <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Sua chave PIX:</p>
                    <div className="flex items-center gap-2 justify-center">
                      <Badge variant="secondary" className="text-xs">
                        {myPixKey}
                      </Badge>
                      <BankingButton
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyPixKey}
                        className="h-6 w-6"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </BankingButton>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Compartilhe sua chave PIX para receber transferências
                  </p>

                  <BankingButton
                    variant="outline"
                    onClick={handleReceivePix}
                    className="w-full"
                  >
                    Simular PIX Recebido
                  </BankingButton>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Code */}
          <TabsContent value="qrcode">
            <Card className="shadow-[var(--shadow-card)] animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="w-5 h-5 text-primary" />
                  QR Code PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="p-8 bg-white rounded-lg mx-auto max-w-xs">
                    <div className="w-48 h-48 bg-black/10 rounded-lg flex items-center justify-center mx-auto">
                      <QrCode className="w-32 h-32 text-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">QR Code para recebimento</p>
                    <p className="text-xs text-muted-foreground">
                      Escaneie o código acima para fazer um PIX
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <BankingButton variant="outline" className="flex-1">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Ler QR Code
                    </BankingButton>
                    <BankingButton variant="secondary" className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      Compartilhar
                    </BankingButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contextual Prompts for PIX */}
      <ContextualPrompts
        currentPage="pix"
        userActions={userActions}
        onPromptComplete={(promptId) => setUserActions(prev => [...prev, `completed-${promptId}`])}
      />
    </div>
  );
};