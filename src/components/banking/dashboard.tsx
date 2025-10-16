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
  LogOut,
  Shield,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FinancialAssistant } from "@/components/ai/financial-assistant";
import { SmartSuggestions } from "@/components/ai/smart-suggestions";
import { ContextualPrompts } from "@/components/ai/contextual-prompts";
import { FinancialStats } from "@/components/banking/financial-stats";
import { PixSystem } from "./pix-system";
import { TransactionHistory } from "./transaction-history";
import { Blockchain, Transaction as BlockchainTransaction } from "@/blockchain/blockchain";
import { loadBlockchain, saveBlockchain } from "@/blockchain/storage";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface DashboardProps {
  user: { username: string; balance: number };
  onLogout: () => void;
  onNavigate: (page: string) => void;
  isFirstTime?: boolean;
  transactions?: Transaction[];
  isAdmin?: boolean;
}

export const Dashboard = ({ user, onLogout, onNavigate, isFirstTime = false, transactions: externalTransactions, isAdmin = false }: DashboardProps) => {
  const [page, setPage] = useState<"dashboard" | "pix" | "history">("dashboard");
  const [blockchain, setBlockchain] = useState<Blockchain>(new Blockchain());
  const [balance, setBalance] = useState(user.balance);
  const [showBalance, setShowBalance] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [userActions, setUserActions] = useState<string[]>([]);
  const { toast } = useToast();

  // Load blockchain on mount
  useEffect(() => {
    const saved = loadBlockchain();
    if (saved) {
      setBlockchain(saved);
    }
  }, []);

  // Convert blockchain transactions to dashboard format
  const blockchainTransactions: Transaction[] = blockchain.getAllTransactions().map(t => ({
    id: t.id,
    type: t.type === 'receive' ? 'income' : 'expense',
    description: t.description,
    amount: t.amount,
    date: t.date || t.timestamp,
    category: t.category || 'PIX'
  }));

  const transactions = externalTransactions || blockchainTransactions;

  const formatCurrency = (value: number) => {
    return `Ð$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const addTransaction = (amount: number, type: "send" | "receive", description: string) => {
    const tx: BlockchainTransaction = {
      id: crypto.randomUUID(),
      type,
      description,
      amount,
      timestamp: new Date().toISOString(),
      category: "PIX",
    };
    
    const updated = new Blockchain();
    Object.assign(updated, blockchain);
    updated.addTransaction(tx);
    updated.minePendingTransactions();
    saveBlockchain(updated);
    setBlockchain(updated);
    setBalance(prev => type === "receive" ? prev + amount : prev - amount);
  };

  const handleQuickAction = (action: string) => {
    setUserActions(prev => [...prev, action.toLowerCase().replace(' ', '-')]);
    
    switch(action) {
      case 'PIX':
        setPage('pix');
        break;
      case 'Cartão':
        onNavigate('card');
        break;
      case 'Investir':
        onNavigate('investments');
        break;
      case 'Metas':
        onNavigate('goals');
        break;
      default:
        toast({
          title: `${action} selecionado`,
          description: "Funcionalidade em desenvolvimento"
        });
    }
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
  }, [balance, transactions.length]);

  // Handle different pages
  if (page === "pix") {
    return <PixSystem onBack={() => setPage("dashboard")} userBalance={balance} onTransaction={addTransaction} />;
  }

  if (page === "history") {
    return <TransactionHistory onBack={() => setPage("dashboard")} transactions={transactions} />;
  }

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
              onClick={() => onNavigate("notifications")}
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
        <Card className="shadow-[var(--shadow-card)] animate-scale-in hover:shadow-[var(--shadow-elevation)] transition-all duration-300">
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
        <Card className="shadow-[var(--shadow-card)] animate-slide-up hover:shadow-[var(--shadow-elevation)] transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <BankingButton
                variant="pix"
                className="h-16 flex-col hover:scale-105 transition-transform duration-200"
                onClick={() => handleQuickAction("PIX")}
                disabled={balance <= 0}
              >
                <QrCode className="w-6 h-6 mb-1" />
                <span className="text-xs">PIX</span>
              </BankingButton>
              <BankingButton
                variant="outline"
                className="h-16 flex-col hover:scale-105 transition-transform duration-200"
                onClick={() => onNavigate("card")}
              >
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="text-xs">Cartão</span>
              </BankingButton>
              <BankingButton
                variant="secondary"
                className="h-16 flex-col hover:scale-105 transition-transform duration-200"
                onClick={() => handleQuickAction("Investir")}
                disabled={balance <= 0}
              >
                <PiggyBank className="w-6 h-6 mb-1" />
                <span className="text-xs">Investir</span>
              </BankingButton>
              <BankingButton
                variant="secondary"
                className="h-16 flex-col hover:scale-105 transition-transform duration-200"
                onClick={() => handleQuickAction("Metas")}
              >
                <Target className="w-6 h-6 mb-1" />
                <span className="text-xs">Metas</span>
              </BankingButton>
            </div>
            
            {/* Admin Button */}
            {isAdmin && (
              <BankingButton
                variant="default"
                className="w-full mt-3 bg-gradient-to-r from-primary to-primary-light"
                onClick={() => onNavigate("admin")}
              >
                <Shield className="w-5 h-5 mr-2" />
                Painel Administrativo
              </BankingButton>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-[var(--shadow-card)] animate-slide-up hover:shadow-[var(--shadow-elevation)] transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Últimas transações</CardTitle>
              <BankingButton
                variant="ghost"
                size="sm"
                onClick={() => setPage("history")}
              >
                Ver todas
              </BankingButton>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">Nenhuma transação ainda</p>
                <p className="text-sm text-muted-foreground">
                  {balance === 0 
                    ? "Aguardando depósito inicial na sua conta"
                    : "Suas transações aparecerão aqui"}
                </p>
              </div>
            ) : (
              transactions.slice(0, 4).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent/70 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
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
              ))
            )}
          </CardContent>
        </Card>

        {/* Financial Stats - Only show if has transactions */}
        {transactions.length > 0 && <FinancialStats transactions={transactions} />}

        {/* Smart Suggestions - Only show if has transactions */}
        {transactions.length > 0 && (
          <SmartSuggestions
            userBalance={balance}
            transactions={transactions}
            username={user.username}
            onActionClick={handleAssistantAction}
          />
        )}

        {/* Empty State for Zero Balance */}
        {balance === 0 && transactions.length === 0 && (
          <Card className="shadow-[var(--shadow-card)] animate-slide-up">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Bem-vindo ao Banco ETEC!</h3>
              <p className="text-muted-foreground mb-4">
                Sua conta foi criada com sucesso. Aguarde um administrador adicionar saldo inicial para começar a usar os serviços.
              </p>
            </CardContent>
          </Card>
        )}
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
