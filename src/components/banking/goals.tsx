import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankingButton } from "@/components/ui/banking-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Target, Plus, Trash2, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  status: string;
  created_at: string;
}

interface GoalsProps {
  onBack: () => void;
  userId: string;
  userBalance: number;
}

export const Goals = ({ onBack, userId, userBalance }: GoalsProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();
    
    // Realtime subscription
    const channel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${userId}`
        },
        () => fetchGoals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchGoals = async () => {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setGoals(data);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          title,
          description: description || null,
          target_amount: parseFloat(targetAmount),
          deadline: deadline || null,
        });

      if (error) throw error;

      toast({
        title: "Meta criada!",
        description: `Meta "${title}" criada com sucesso`,
      });

      setIsCreating(false);
      setTitle("");
      setDescription("");
      setTargetAmount("");
      setDeadline("");
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

  const handleAddToGoal = async (goalId: string, amount: number) => {
    if (amount > userBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem saldo suficiente para adicionar a esta meta",
        variant: "destructive",
      });
      return;
    }

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      const { error } = await supabase
        .from("goals")
        .update({ 
          current_amount: goal.current_amount + amount,
          status: (goal.current_amount + amount) >= goal.target_amount ? 'completed' : 'active'
        })
        .eq("id", goalId);

      if (error) throw error;

      // Update user balance
      await supabase
        .from("profiles")
        .update({ balance: userBalance - amount })
        .eq("id", userId);

      toast({
        title: "Valor adicionado!",
        description: `Ð$ ${amount.toFixed(2)} adicionados à meta`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      toast({
        title: "Meta excluída",
        description: "Meta removida com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => `Ð$ ${value.toFixed(2).replace('.', ',')}`;
  const calculateProgress = (current: number, target: number) => (current / target) * 100;

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
          <h1 className="text-xl font-bold">Minhas Metas</h1>
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

        {/* Create Goal Button */}
        {!isCreating && (
          <BankingButton
            onClick={() => setIsCreating(true)}
            className="w-full"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Meta
          </BankingButton>
        )}

        {/* Create Goal Form */}
        {isCreating && (
          <Card className="shadow-[var(--shadow-card)] animate-scale-in">
            <CardHeader>
              <CardTitle>Nova Meta Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da meta</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Viagem para praia"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva sua meta..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Valor alvo</Label>
                  <Input
                    id="target"
                    type="number"
                    step="0.01"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Data limite (opcional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
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
                    {isLoading ? "Criando..." : "Criar Meta"}
                  </BankingButton>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {goals.length === 0 ? (
            <Card className="shadow-[var(--shadow-card)]">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma meta cadastrada ainda</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Crie sua primeira meta financeira!
                </p>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
              const progress = calculateProgress(goal.current_amount, goal.target_amount);
              const isCompleted = goal.status === 'completed';
              
              return (
                <Card key={goal.id} className="shadow-[var(--shadow-card)] animate-slide-up hover:shadow-[var(--shadow-elevation)] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{goal.title}</h3>
                          {isCompleted && (
                            <Badge className="bg-success text-success-foreground">
                              Concluída
                            </Badge>
                          )}
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        )}
                      </div>
                      <BankingButton
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </BankingButton>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                        </span>
                      </div>
                      
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {progress.toFixed(0)}%
                          </span>
                          {goal.deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        
                        {!isCompleted && userBalance > 0 && (
                          <BankingButton
                            size="sm"
                            onClick={() => {
                              const amount = prompt("Quanto deseja adicionar a esta meta?");
                              if (amount) handleAddToGoal(goal.id, parseFloat(amount));
                            }}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Adicionar
                          </BankingButton>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
