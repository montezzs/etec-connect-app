import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankingButton } from "@/components/ui/banking-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  Filter,
  Download
} from "lucide-react";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface TransactionHistoryProps {
  onBack: () => void;
  transactions: Transaction[];
}

export const TransactionHistory = ({ onBack, transactions }: TransactionHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const formatCurrency = (value: number) => `Ð$ ${value.toFixed(2).replace('.', ',')}`;

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const groupedByDate = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('pt-BR');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light p-4 text-primary-foreground">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <BankingButton
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </BankingButton>
          <h1 className="text-xl font-bold">Histórico de Transações</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Search and Filter */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <BankingButton
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="flex-1"
              >
                <Filter className="w-4 h-4 mr-1" />
                Todas
              </BankingButton>
              <BankingButton
                variant={filterType === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('income')}
                className="flex-1"
              >
                <ArrowDownLeft className="w-4 h-4 mr-1" />
                Receitas
              </BankingButton>
              <BankingButton
                variant={filterType === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('expense')}
                className="flex-1"
              >
                <ArrowUpRight className="w-4 h-4 mr-1" />
                Despesas
              </BankingButton>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-sm font-semibold">{filteredTransactions.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Receitas</p>
                <p className="text-sm font-semibold text-success">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => t.type === 'income')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Despesas</p>
                <p className="text-sm font-semibold text-destructive">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => t.type === 'expense')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-4">
          {Object.entries(groupedByDate).length === 0 ? (
            <Card className="shadow-[var(--shadow-card)]">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByDate).map(([date, dayTransactions]) => (
              <Card key={date} className="shadow-[var(--shadow-card)] animate-slide-up">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {date}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent/70 hover:scale-[1.02] transition-all duration-200"
                    >
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
                          <Badge variant="secondary" className="text-xs mt-1">
                            {transaction.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'income' ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Export Button */}
        {filteredTransactions.length > 0 && (
          <BankingButton
            variant="outline"
            className="w-full"
            onClick={() => {
              // Future: Implement export functionality
              alert("Funcionalidade de exportação em breve!");
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Histórico
          </BankingButton>
        )}
      </div>
    </div>
  );
};
