import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BankingButton } from "@/components/ui/banking-button";
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Shield, 
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  X
} from "lucide-react";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface SmartSuggestion {
  id: string;
  type: 'warning' | 'tip' | 'goal' | 'security' | 'achievement';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  icon: any;
}

interface SmartSuggestionsProps {
  userBalance: number;
  transactions: Transaction[];
  username: string;
  onActionClick?: (action: string) => void;
}

export const SmartSuggestions = ({ 
  userBalance, 
  transactions, 
  username,
  onActionClick 
}: SmartSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);

  // Generate contextual suggestions based on user behavior
  const generateSmartSuggestions = (): SmartSuggestion[] => {
    const newSuggestions: SmartSuggestion[] = [];
    
    // Analyze spending patterns
    const recentTransactions = transactions.slice(0, 10);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const categorySpending = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topExpenseCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];

    // High spending warning
    if (totalExpenses > userBalance * 0.7) {
      newSuggestions.push({
        id: 'high-spending',
        type: 'warning',
        title: 'Gastos elevados detectados',
        description: `Você já gastou ${((totalExpenses / userBalance) * 100).toFixed(1)}% do seu saldo. Considere revisar seus gastos.`,
        action: 'Analisar gastos',
        priority: 'high',
        icon: AlertTriangle
      });
    }

    // Category-specific suggestions
    if (topExpenseCategory && topExpenseCategory[1] > userBalance * 0.3) {
      newSuggestions.push({
        id: 'category-optimization',
        type: 'tip',
        title: `Otimize gastos com ${topExpenseCategory[0]}`,
        description: `Esta categoria representa ${((topExpenseCategory[1] / totalExpenses) * 100).toFixed(1)}% dos seus gastos. Que tal definir um limite?`,
        action: 'Configurar limite',
        priority: 'medium',
        icon: TrendingUp
      });
    }

    // Emergency fund suggestion
    if (userBalance < 1000) {
      newSuggestions.push({
        id: 'emergency-fund',
        type: 'goal',
        title: 'Crie sua reserva de emergência',
        description: 'Para estudantes ETEC, recomendamos uma reserva de pelo menos R$ 1.000 para imprevistos.',
        action: 'Criar meta',
        priority: 'high',
        icon: PiggyBank
      });
    }

    // PIX security tip
    const pixTransactions = transactions.filter(t => t.description.includes('PIX'));
    if (pixTransactions.length > 5) {
      newSuggestions.push({
        id: 'pix-security',
        type: 'security',
        title: 'Dica de segurança PIX',
        description: 'Você faz muitas transações PIX. Lembre-se de sempre verificar os dados antes de confirmar.',
        action: 'Ver dicas',
        priority: 'medium',
        icon: Shield
      });
    }

    // Achievement for good financial behavior
    if (userBalance > 2000 && totalExpenses < userBalance * 0.5) {
      newSuggestions.push({
        id: 'good-behavior',
        type: 'achievement',
        title: 'Parabéns! Controle financeiro excelente',
        description: 'Você está mantendo seus gastos baixos e poupando bem. Continue assim!',
        priority: 'low',
        icon: CheckCircle
      });
    }

    // Investment suggestion for stable users
    if (userBalance > 3000 && totalExpenses < userBalance * 0.4) {
      newSuggestions.push({
        id: 'investment-tip',
        type: 'tip',
        title: 'Considere investir seu dinheiro',
        description: 'Com sua estabilidade financeira, que tal começar a investir? Mesmo R$ 100/mês pode fazer diferença.',
        action: 'Simular investimento',
        priority: 'medium',
        icon: TrendingUp
      });
    }

    // Goal completion reminder
    newSuggestions.push({
      id: 'goal-reminder',
      type: 'goal',
      title: 'Meta da viagem ETEC',
      description: 'Faltam R$ 650 para sua meta. Com R$ 100/mês, você consegue em 6 meses!',
      action: 'Ajustar meta',
      priority: 'medium',
      icon: Target
    });

    return newSuggestions.filter(s => !dismissedSuggestions.includes(s.id));
  };

  useEffect(() => {
    const newSuggestions = generateSmartSuggestions();
    setSuggestions(newSuggestions);
  }, [userBalance, transactions, dismissedSuggestions]);

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => [...prev, suggestionId]);
  };

  const handleActionClick = (action: string) => {
    if (onActionClick) {
      onActionClick(action);
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-warning';
      case 'tip': return 'text-primary';
      case 'goal': return 'text-success';
      case 'security': return 'text-destructive';
      case 'achievement': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-xs">Médio</Badge>;
      case 'low': return <Badge variant="outline" className="text-xs">Baixo</Badge>;
      default: return null;
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {suggestions.slice(0, 3).map((suggestion) => (
        <Card key={suggestion.id} className="shadow-[var(--shadow-card)] animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 ${getIconColor(suggestion.type)}`}>
                <suggestion.icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-foreground">{suggestion.title}</h4>
                  {getPriorityBadge(suggestion.priority)}
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {suggestion.description}
                </p>
                
                <div className="flex items-center gap-2">
                  {suggestion.action && (
                    <BankingButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionClick(suggestion.action!)}
                      className="text-xs h-7"
                    >
                      {suggestion.action}
                    </BankingButton>
                  )}
                  
                  <BankingButton
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDismiss(suggestion.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </BankingButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {suggestions.length > 3 && (
        <div className="text-center">
          <BankingButton
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
          >
            Ver mais {suggestions.length - 3} sugestões
          </BankingButton>
        </div>
      )}
    </div>
  );
};