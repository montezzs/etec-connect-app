import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankingButton } from "@/components/ui/banking-button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  EyeOff, 
  CreditCard, 
  Send, 
  Receipt, 
  PiggyBank, 
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Target,
  Bell,
  User,
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FinancialAssistant } from "@/components/ai/financial-assistant";
import { SmartSuggestions } from "@/components/ai/smart-suggestions";
import { ContextualPrompts } from "@/components/ai/contextual-prompts";
import heroImage from "@/assets/hero-banking.jpg";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface DashboardProps {
  user: { username: string };
  onLogout: () => void;
  onNavigate: (page: string) => void;
  isFirstTime?: boolean;
}

export const Dashboard = ({ user, onLogout, onNavigate, isFirstTime = false }: DashboardProps) => {
  const [balance, setBalance] = useState(2834.67);
  const [showBalance, setShowBalance] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [userActions, setUserActions] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "income",
      description: "Salário ETEC",
      amount: 3200.00,
      date: "2024-01-15",
      category: "Salário"
    },
    {
      id: "2", 
      type: "expense",
      description: "Supermercado",
      amount: 120.50,
      date: "2024-01-14",
      category: "Alimentação"
    },
    {
      id: "3",
      type: "expense",
      description: "Transporte",
      amount: 45.30,
      date: "2024-01-14",
      category: "Transporte"
    },
    {
      id: "4",
      type: "income",
      description: "PIX Recebido",
      amount: 200.00,
      date: "2024-01-13",
      category: "Transferência"
    }
  ]);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleQuickAction = (action: string) => {
    setUserActions(prev => [...prev, action.toLowerCase().replace(' ', '-')]);
    toast({
      title: `${action} selecionado`,
      description: "Funcionalidade em desenvolvimento",
    });
  };

  const handleAssistantAction = (action: string) => {
    if (action.includes('gastos')) {
      setUserActions(prev => [...prev, 'expense-analysis']);
    } else if (action.includes('meta')) {
      onNavigate('goals');
    } else if (action.includes('investimento')) {
      setUserActions(prev => [...prev, 'investment-interest']);
    }
  };

  const handlePromptComplete = (promptId: string) => {
    setUserActions(prev => [...prev, `prompt-completed-${promptId}`]);
  };

  // Detect user behavior patterns
  useEffect(() => {
    if (balance > 3000) {
      setUserActions(prev => [...prev, 'high-balance']);
    }
    if (transactions.length > 10) {
      setUserActions(prev => [...prev, 'multiple-transactions']);
    }
  }, [balance, transactions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light p-4 text-primary-foreground">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm opacity-90">Olá,</p>
              <p className="font-semibold capitalize">{user.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <BankingButton
              variant="ghost"
              size="icon"
              onClick={() => handleQuickAction("Notificações")}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Bell className="w-5 h-5" />
            </BankingButton>
            <BankingButton
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <LogOut className="w-5 h-5" />
            </BankingButton>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Balance Card */}
        <Card className="shadow-[var(--shadow-card)] animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Saldo disponível</h3>
              <BankingButton
                variant="ghost"
                size="icon"
                onClick={() => setShowBalance(!showBalance)}
                className="h-8 w-8"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </BankingButton>
            </div>
            <p className="text-3xl font-bold text-foreground mb-2">
              {showBalance ? formatCurrency(balance) : "••••••"}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Conta Corrente ETEC
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-[var(--shadow-card)] animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <BankingButton
                variant="pix"
                className="h-16 flex-col"
                onClick={() => onNavigate("pix")}
              >
                <QrCode className="w-6 h-6 mb-1" />
                <span className="text-xs">PIX</span>
              </BankingButton>
              <BankingButton
                variant="outline"
                className="h-16 flex-col"
                onClick={() => onNavigate("card")}
              >
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="text-xs">Cartão</span>
              </BankingButton>
              <BankingButton
                variant="secondary"
                className="h-16 flex-col"
                onClick={() => handleQuickAction("Transferir")}
              >
                <Send className="w-6 h-6 mb-1" />
                <span className="text-xs">Transferir</span>
              </BankingButton>
              <BankingButton
                variant="secondary"
                className="h-16 flex-col"
                onClick={() => handleQuickAction("Investir")}
              >
                <PiggyBank className="w-6 h-6 mb-1" />
                <span className="text-xs">Investir</span>
              </BankingButton>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-[var(--shadow-card)] animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Últimas transações</CardTitle>
              <BankingButton
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction("Ver todas")}
              >
                Ver todas
              </BankingButton>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.slice(0, 4).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {transaction.type === 'income' ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-success' : 'text-destructive'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Smart Suggestions */}
        <SmartSuggestions
          userBalance={balance}
          transactions={transactions}
          username={user.username}
          onActionClick={handleAssistantAction}
        />

        {/* Goals Card */}
        <Card className="shadow-[var(--shadow-card)] animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Meta de economia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Viagem ETEC 2024</span>
                <span className="font-medium">R$ 850 / R$ 1.500</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-primary-light h-2 rounded-full transition-all duration-500"
                  style={{ width: '56.7%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Faltam R$ 650 para atingir sua meta!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant */}
      <FinancialAssistant
        userBalance={balance}
        transactions={transactions}
        username={user.username}
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
      />

      {/* Contextual Prompts */}
      <ContextualPrompts
        currentPage="dashboard"
        userActions={userActions}
        isFirstTime={isFirstTime}
        onPromptComplete={handlePromptComplete}
      />
    </div>
  );
};