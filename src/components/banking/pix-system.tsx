import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BankingButton } from "@/components/ui/banking-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SmartFormValidation } from "@/components/ai/smart-form-validation";
import { ContextualPrompts } from "@/components/ai/contextual-prompts";
import { QRCodeSVG } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  QrCode, 
  Smartphone, 
  DollarSign, 
  ArrowLeft, 
  Copy, 
  Check,
  Scan,
  Send,
  Receipt,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PixSystemProps {
  onBack: () => void;
  userBalance: number;
  onTransaction: (amount: number, type: 'send' | 'receive', description: string, recipientKey?: string) => Promise<void>;
  user: any;
  userId: string;
}

export const PixSystem = ({ onBack, userBalance, onTransaction, user, userId }: PixSystemProps) => {
  const [activeTab, setActiveTab] = useState("send");
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userActions, setUserActions] = useState<string[]>(['pix-first-access']);
  const [isFormValid, setIsFormValid] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();

  const userPixKey = user?.username || "";
  // Create unique QR code with account details
  const qrCodeData = JSON.stringify({
    pixKey: userPixKey,
    accountId: userId,
    bankName: "Digital Bank",
    accountType: "PIX"
  });

  const formatCurrency = (value: number) => {
    return `Ð$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const handleCopyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(userPixKey);
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

    // Normalize amount (support comma and dot)
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    // Normalize PIX key to expected backend format (username)
    let recipientKey = pixKey.trim();
    if (recipientKey.includes('@')) {
      // Process emails: backend expects username (before @)
      recipientKey = recipientKey.split('@')[0];
    }

    setIsLoading(true);
    try {
      await onTransaction(
        numAmount,
        'send',
        description || `PIX para ${pixKey}`,
        recipientKey
      );

      setPixKey("");
      setAmount("");
      setDescription("");

      toast({
        title: "PIX enviado com sucesso!",
        description: `${formatCurrency(numAmount)} transferido via PIX`,
      });
    } catch (error: any) {
      toast({
        title: "Erro no PIX",
        description: error?.message || "Não foi possível enviar o PIX",
        variant: "destructive",
      });
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

  const handleShareQRCode = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Minha chave PIX',
          text: `Envie PIX para: ${userPixKey}`,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(userPixKey);
        toast({
          title: "Chave copiada!",
          description: "Compartilhe sua chave PIX copiada",
        });
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleOpenScanner = () => {
    setScannerOpen(true);
  };

  const handleCloseScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScannerOpen(false);
  };

  useEffect(() => {
    if (scannerOpen && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scanner.render(
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.pixKey) {
              setPixKey(data.pixKey);
              setActiveTab("send");
              handleCloseScanner();
              toast({
                title: "QR Code lido!",
                description: `Chave PIX: ${data.pixKey}`,
              });
            }
          } catch (e) {
            // If not JSON, treat as plain PIX key
            setPixKey(decodedText);
            setActiveTab("send");
            handleCloseScanner();
            toast({
              title: "QR Code lido!",
              description: `Chave PIX: ${decodedText}`,
            });
          }
        },
        (error) => {
          if (error.includes("NotFoundError") || error.includes("Camera")) {
            handleCloseScanner();
            toast({
              title: "Camera não encontrada.",
              description: "Não foi possível acessar a câmera do dispositivo",
              variant: "destructive",
            });
          }
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [scannerOpen]);

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
                />
                
                <SmartFormValidation
                  type="amount"
                  value={amount}
                  label="Valor (Ð$)"
                  placeholder="0,00"
                  userBalance={userBalance}
                  onChange={setAmount}
                />

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                    Descrição (opcional)
                  </Label>
                  <Input
                    id="description"
                    type="text"
                    placeholder="Almoço, Material escolar, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={100}
                  />
                  {description.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {description.length}/100 caracteres
                    </p>
                  )}
                </div>

                <BankingButton
                  variant="pix"
                  className="w-full"
                  onClick={handleSendPix}
                  disabled={isLoading || !pixKey || !amount}
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
                  <div className="p-6 bg-white rounded-lg">
                    <div className="flex justify-center mb-4">
                      <QRCodeSVG 
                        value={qrCodeData}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Sua chave PIX:</p>
                    <div className="flex items-center gap-2 justify-center">
                      <Badge variant="secondary" className="text-xs">
                        {userPixKey}
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
                    <div className="flex justify-center">
                      <QRCodeSVG 
                        value={qrCodeData}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">QR Code para recebimento</p>
                    <p className="text-xs text-muted-foreground">
                      Escaneie o código acima para fazer um PIX
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <BankingButton variant="outline" className="flex-1" onClick={handleOpenScanner}>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Ler QR Code
                    </BankingButton>
                    <BankingButton variant="secondary" className="flex-1" onClick={handleShareQRCode}>
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

      {/* QR Code Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Escanear QR Code PIX
              <BankingButton
                variant="ghost"
                size="icon"
                onClick={handleCloseScanner}
              >
                <X className="w-4 h-4" />
              </BankingButton>
            </DialogTitle>
          </DialogHeader>
          <div id="qr-reader" className="w-full"></div>
        </DialogContent>
      </Dialog>
    </div>
  );
};