import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Dashboard } from "@/components/banking/dashboard";
import { PixSystem } from "@/components/banking/pix-system";
import { VirtualCard } from "@/components/banking/virtual-card";
import { Investments } from "@/components/banking/investments";
import { Notifications } from "@/components/banking/notifications";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          setProfile(profileData);
          
          // Check if first time
          const isFirstTime = !localStorage.getItem(`user_${session.user.id}_visited`);
          setIsFirstTimeUser(isFirstTime);
          if (isFirstTime) {
            localStorage.setItem(`user_${session.user.id}_visited`, 'true');
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
            setLoading(false);
          });
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

    // Update balance
    const newBalance = type === 'send' ? profile.balance - amount : profile.balance + amount;
    
    await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", user.id);

    // Create transaction record
    await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type,
        amount,
        description,
        recipient_key: recipientKey,
      });

    // Create notification
    await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        title: type === 'send' ? 'Transferência enviada' : 'Transferência recebida',
        message: `${type === 'send' ? 'Enviou' : 'Recebeu'} Ð$ ${amount.toFixed(2)}`,
        type: 'transaction',
      });

    // Update local state
    setProfile({ ...profile, balance: newBalance });

    toast({
      title: type === 'send' ? 'Transferência enviada' : 'Transferência recebida',
      description: `Ð$ ${amount.toFixed(2)}`,
    });
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

  if (!user || !profile) {
    return null;
  }

  if (currentPage === "pix") {
    return (
      <PixSystem
        onBack={() => setCurrentPage("dashboard")}
        userBalance={profile.balance}
        onTransaction={handleTransaction}
      />
    );
  }

  if (currentPage === "card") {
    return (
      <VirtualCard
        onBack={() => setCurrentPage("dashboard")}
        userBalance={profile.balance}
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

  return (
    <Dashboard
      user={{ username: profile.username, balance: profile.balance }}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      isFirstTime={isFirstTimeUser}
    />
  );
};

export default Index;
