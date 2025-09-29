import { useState } from "react";
import { LoginForm } from "@/components/banking/login-form";
import { Dashboard } from "@/components/banking/dashboard";
import { PixSystem } from "@/components/banking/pix-system";
import { VirtualCard } from "@/components/banking/virtual-card";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [balance, setBalance] = useState(2834.67);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const { toast } = useToast();

  const handleLogin = (credentials: { username: string; password: string }) => {
    setUser({ username: credentials.username });
    setIsAuthenticated(true);
    setCurrentPage("dashboard");
    // Check if first time user (could be based on localStorage or user data)
    const isFirstTime = !localStorage.getItem(`user_${credentials.username}_visited`);
    setIsFirstTimeUser(isFirstTime);
    if (isFirstTime) {
      localStorage.setItem(`user_${credentials.username}_visited`, 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage("dashboard");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com segurança",
    });
  };

  const handleTransaction = (amount: number, type: 'send' | 'receive', description: string) => {
    if (type === 'send') {
      setBalance(prev => prev - amount);
    } else {
      setBalance(prev => prev + amount);
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (currentPage === "pix") {
    return (
      <PixSystem
        onBack={() => setCurrentPage("dashboard")}
        userBalance={balance}
        onTransaction={handleTransaction}
      />
    );
  }

  if (currentPage === "card") {
    return (
      <VirtualCard
        onBack={() => setCurrentPage("dashboard")}
        userBalance={balance}
      />
    );
  }

  return (
    <Dashboard
      user={user!}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      isFirstTime={isFirstTimeUser}
    />
  );
};

export default Index;
