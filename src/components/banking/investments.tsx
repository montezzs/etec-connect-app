import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankingButton } from "@/components/ui/banking-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, DollarSign, Calendar } from "lucide-react";

interface Investment {
  id: string;
  name: string;
  amount: number;
  expected_return: number;
  period_months: number;
  status: string;
  created_at: string;
}

interface InvestmentsProps {
  onBack: () => void;
  userBalance: number;
  userId: string;
}

export const Investments = ({ onBack, userBalance, userId }: InvestmentsProps) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [periodMonths, setPeriodMonths] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvestments();
    
    // Realtime subscription
    const channel = supabase
      .channel('investments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
          filter: `user_id=eq.${userId}`
        },
        () => fetchInvestments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchInvestments = async () => {
    const { data } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setInvestments(data);
  };

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const investmentAmount = parseFloat(amount);
    
    if (investmentAmount > userBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem saldo suficiente para este investimento",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create investment
      const { error: investError } = await supabase
        .from("investments")
        .insert({
          user_id: userId,
          name,
          amount: investmentAmount,
          expected_return: parseFloat(expectedReturn),
          period_months: parseInt(periodMonths),
        });

      if (investError) throw investError;

      // Update balance
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: userBalance - investmentAmount })
        .eq("id", userId);

      if (balanceError) throw balanceError;

      // Create notification
      await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title: "Investimento realizado",
          message: `Você investiu Ð$ ${investmentAmount.toFixed(2)} em ${name}`,
          type: "investment",
        });

      toast({
        title: "Investimento realizado!",
        description: `Ð$ ${investmentAmount.toFixed(2)} investidos com sucesso`,
      });

      setIsCreating(false);
      setName("");
      setAmount("");
      setExpectedReturn("");
      setPeriodMonths("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => `Ð$ ${value.toFixed(2).replace('.', ',')}`;

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
          <h1 className="text-xl font-bold">Investimentos ETEC</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Balance Card */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Saldo disponível</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(userBalance)}</p>
          </CardContent>
        </Card>

        {/* Create Investment Button */}
        {!isCreating && (
          <BankingButton
            onClick={() => setIsCreating(true)}
            className="w-full"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Novo Investimento
          </BankingButton>
        )}

        {/* Create Investment Form */}
        {isCreating && (
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Novo Investimento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateInvestment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do investimento</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Fundo ETEC"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="return">Retorno esperado (%)</Label>
                  <Input
                    id="return"
                    type="number"
                    step="0.01"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                    placeholder="Ex: 12.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Período (meses)</Label>
                  <Input
                    id="period"
                    type="number"
                    value={periodMonths}
                    onChange={(e) => setPeriodMonths(e.target.value)}
                    placeholder="Ex: 12"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <BankingButton
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancelar
                  </BankingButton>
                  <BankingButton
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? "Investindo..." : "Investir"}
                  </BankingButton>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Investments List */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Meus Investimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {investments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum investimento ainda
              </p>
            ) : (
              investments.map((investment) => (
                <div
                  key={investment.id}
                  className="p-4 rounded-lg bg-accent/50 hover:bg-accent/70 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{investment.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {investment.period_months} meses
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatCurrency(investment.amount)}
                      </p>
                      <p className="text-xs text-success flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{investment.expected_return}%
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Retorno esperado: {formatCurrency(investment.amount * (1 + investment.expected_return / 100))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
