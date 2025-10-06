import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface FinancialStatsProps {
  transactions: Transaction[];
}

export const FinancialStats = ({ transactions }: FinancialStatsProps) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter transactions from current month
  const monthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : "0";

  const formatCurrency = (value: number) => `Ð$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <Card className="shadow-[var(--shadow-card)] animate-slide-up hover:shadow-[var(--shadow-elevation)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Resumo do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Income */}
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs text-muted-foreground">Receitas</span>
            </div>
            <p className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</p>
          </div>

          {/* Expenses */}
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-xs text-muted-foreground">Despesas</span>
            </div>
            <p className="text-lg font-bold text-destructive">{formatCurrency(totalExpense)}</p>
          </div>

          {/* Balance */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 hover:scale-105 transition-transform duration-200 col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Saldo do Mês</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{formatCurrency(balance)}</p>
                <p className="text-xs text-muted-foreground">
                  Taxa de economia: {savingsRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Gastos por Categoria</h4>
          <div className="space-y-2">
            {(() => {
              const categories = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((acc, t) => {
                  acc[t.category] = (acc[t.category] || 0) + t.amount;
                  return acc;
                }, {} as Record<string, number>);

              return Object.entries(categories)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([category, amount]) => {
                  const percentage = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(0) : 0;
                  return (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="font-medium text-foreground w-16 text-right">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
