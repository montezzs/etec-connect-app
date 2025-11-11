import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankingButton } from "@/components/ui/banking-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Users, DollarSign, Search, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityMonitor } from "./security-monitor";

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  balance: number;
  created_at: string;
}

interface AdminPanelProps {
  onBack: () => void;
  userId: string;
}

export const AdminPanel = ({ onBack, userId }: AdminPanelProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setUsers(data);
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.rpc('admin_add_balance', {
        target_user_id: selectedUser,
        amount: parseFloat(amount),
        reason: reason
      });

      if (error) throw error;

      toast({
        title: "Saldo adicionado!",
        description: `Ð$ ${amount} adicionados com sucesso`,
      });

      setAmount("");
      setReason("");
      setSelectedUser(null);
      fetchUsers();
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

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Gerenciar Usuários
            </TabsTrigger>
            <TabsTrigger value="security">
              <Activity className="w-4 h-4 mr-2" />
              Monitoramento de Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6 mt-6">
        {/* Stats Card */}
        <Card className="shadow-[var(--shadow-card)] animate-scale-in">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Users */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg">Buscar Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Balance Form */}
        {selectedUser && (
          <Card className="shadow-[var(--shadow-card)] animate-scale-in border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Adicionar Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBalance} className="space-y-4">
                <div className="p-3 bg-accent/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Usuário selecionado:</p>
                  <p className="font-semibold">
                    {users.find(u => u.id === selectedUser)?.username}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor a adicionar</Label>
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
                  <Label htmlFor="reason">Motivo</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Depósito inicial, Bônus, etc."
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <BankingButton
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedUser(null)}
                  >
                    Cancelar
                  </BankingButton>
                  <BankingButton
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? "Adicionando..." : "Adicionar Saldo"}
                  </BankingButton>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg">Usuários do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedUser === user.id
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-accent/50 hover:bg-accent/70'
                  }`}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{user.username}</p>
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground">{user.full_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatCurrency(user.balance)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    {selectedUser === user.id && (
                      <Badge className="bg-primary text-primary-foreground">
                        Selecionado
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecurityMonitor userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
