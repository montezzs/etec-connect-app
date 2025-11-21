import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Dashboard } from "@/components/banking/dashboard";
import { PixSystem } from "@/components/banking/pix-system";
import { VirtualCard } from "@/components/banking/virtual-card";
import { Investments } from "@/components/banking/investments";
import { Notifications } from "@/components/banking/notifications";
import { TransactionHistory } from "@/components/banking/transaction-history";
import { Goals } from "@/components/banking/goals";
import { AdminPanel } from "@/components/banking/admin-panel";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Separate async functions for data fetching (avoid deadlocks in auth callback)
  const fetchUserProfile = async (userId?: string) => {
    const id = userId || user?.id;
    if (!id) return;
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    setProfile(profileData);
  };

  const checkAdminRole = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();
    setIsAdmin(!!roleData);
    
    const isFirstTime = !localStorage.getItem(`user_${userId}_visited`);
    setIsFirstTimeUser(isFirstTime);
    if (isFirstTime) {
      localStorage.setItem(`user_${userId}_visited`, "true");
    }
  };

  const fetchUserTransactions = async (userId: string) => {
    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setAllTransactions(transactionsData || []);
  };

  useEffect(() => {
    // Keep auth callback synchronous to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer all database calls outside the callback using setTimeout
        setTimeout(() => {
          fetchUserProfile(session.user.id);
          checkAdminRole(session.user.id);
          fetchUserTransactions(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsFirstTimeUser(false);
        setAllTransactions([]);
      }
      
      setLoading(false);
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchUserTransactions(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Fetch user transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setAllTransactions(
          data.map((t) => ({
            id: t.id,
            type: t.type === 'send' ? 'expense' : 'income',
            description: t.description || 'Transação',
            amount: t.amount,
            date: new Date(t.created_at || Date.now()).toISOString(),
            category: t.description?.includes("PIX")
              ? "Transferência"
              : t.description?.includes("Supermercado")
              ? "Alimentação"
              : t.description?.includes("Transporte")
              ? "Transporte"
              : "Outros",
          }))
        );
      }
    };

    fetchTransactions();
  }, [user]);

  // Realtime alerts for transactions and goals + balance sync
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('live-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          try {
            const t: any = payload.new;
            console.log('[Realtime] New transaction', t);
            if (t?.type === 'receive') {
              toast({
                title: '💚 PIX recebido',
                description: `Ð$ ${Number(t.amount).toFixed(2)} de ${t.description?.replace('PIX recebido de ', '') || 'desconhecido'}`,
              });
            }
            // Refresh balance
            fetchUserProfile();
          } catch (e) {
            console.error('Realtime transaction handler error', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          try {
            const newProfile: any = payload.new;
            console.log('[Realtime] Profile updated', newProfile);
            setUser(prev => prev ? { ...prev, balance: newProfile.balance || 0 } : null);
          } catch (e) {
            console.error('Realtime profile handler error', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` },
        (payload) => {
          try {
            const oldRow: any = payload.old;
            const newRow: any = payload.new;
            console.log('[Realtime] Goal updated', newRow);
            const crossed = Number(oldRow?.current_amount || 0) < Number(newRow.target_amount) && Number(newRow.current_amount) >= Number(newRow.target_amount);
            const completed = (oldRow?.status !== 'completed') && (newRow?.status === 'completed');
            if (crossed || completed) {
              toast({
                title: 'Meta alcançada!',
                description: `Parabéns! Você atingiu a meta: ${newRow.title}`,
              });
            }
          } catch (e) {
            console.error('Realtime goals handler error', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com segurança",
    });
    navigate("/auth");
  };

  const handleTransaction = async (amount: number, type: 'send' | 'receive', description: string, recipientKey?: string) => {
    if (!user || !profile) return;

    try {
      // Call secure server-side function
      const { data, error } = await supabase.rpc('process_transaction', {
        _amount: amount,
        _type: type,
        _description: description,
        _recipient_key: recipientKey || null
      });

      if (error) {
        toast({
          title: 'Erro na transação',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Update local profile with new balance
      const result = data as { success: boolean; new_balance: number; transaction_id: string };
      setProfile({ ...profile, balance: result.new_balance });

      // Refresh transactions list
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (transactionsData) {
        setAllTransactions(
          transactionsData.map((t) => ({
            id: t.id,
            type: t.type === 'send' ? 'expense' : 'income',
            description: t.description || 'Transação',
            amount: t.amount,
            date: new Date(t.created_at || Date.now()).toISOString(),
            category: t.description?.includes("PIX")
              ? "Transferência"
              : t.description?.includes("Supermercado")
              ? "Alimentação"
              : t.description?.includes("Transporte")
              ? "Transporte"
              : "Outros",
          }))
        );
      }

      toast({
        title: type === 'send' ? 'Transferência enviada' : 'Transferência recebida',
        description: `Ð$ ${amount.toFixed(2)}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro na transação',
        description: error.message || 'Ocorreu um erro ao processar a transação',
        variant: 'destructive',
      });
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-etec-primary via-etec-secondary to-etec-accent">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-etec-primary via-etec-secondary to-etec-accent">
        <div className="text-white text-center">
          <h2 className="text-2xl mb-4">Configurando seu perfil...</h2>
          <p>Por favor, aguarde um momento.</p>
        </div>
      </div>
    );
  }

  if (currentPage === "pix") {
    return (
      <PixSystem
        onBack={() => setCurrentPage("dashboard")}
        userBalance={profile.balance}
        onTransaction={handleTransaction}
        user={profile}
        userId={user.id}
      />
    );
  }

  if (currentPage === "card") {
    return (
      <VirtualCard
        onBack={() => setCurrentPage("dashboard")}
        userBalance={profile.balance}
        userId={user.id}
        username={profile.username}
      />
    );
  }

  if (currentPage === "investments") {
    return (
      <Investments
        onBack={() => setCurrentPage("dashboard")}
        userBalance={profile.balance}
        userId={user.id}
      />
    );
  }

  if (currentPage === "notifications") {
    return (
      <Notifications
        onBack={() => setCurrentPage("dashboard")}
        userId={user.id}
      />
    );
  }

  if (currentPage === "history") {
    return (
      <TransactionHistory
        onBack={() => setCurrentPage("dashboard")}
        transactions={allTransactions}
      />
    );
  }

  if (currentPage === "goals") {
    return (
      <Goals
        onBack={() => setCurrentPage("dashboard")}
        userId={user.id}
        userBalance={profile.balance}
      />
    );
  }

  if (currentPage === "admin") {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar o painel administrativo",
        variant: "destructive",
      });
      setCurrentPage("dashboard");
      return null;
    }
    
    return (
      <AdminPanel onBack={() => setCurrentPage("dashboard")} userId={user.id} />
    );
  }

  return (
    <Dashboard
      user={{ username: profile.username, balance: profile.balance, id: user.id }}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      isFirstTime={isFirstTimeUser}
      transactions={allTransactions}
      isAdmin={isAdmin}
      onTransaction={handleTransaction}
    />
  );
};

export default Index;
