import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BankingButton } from "@/components/ui/banking-button";
import { Eye, EyeOff, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onLogin: (credentials: { username: string; password: string }) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginAttempts >= 3) {
      toast({
        title: "Conta temporariamente bloqueada",
        description: "Muitas tentativas de login. Tente novamente em 15 minutos.",
        variant: "destructive",
      });
      return;
    }

    if (!username || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha usuário e senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simular autenticação
    setTimeout(() => {
      if (username === "etec" && password === "123456") {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao ETEC Bank",
        });
        onLogin({ username, password });
      } else {
        setLoginAttempts(prev => prev + 1);
        toast({
          title: "Credenciais inválidas",
          description: `Usuário ou senha incorretos. Tentativas restantes: ${3 - (loginAttempts + 1)}`,
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-elevation)] animate-fade-in">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">ETEC Bank</CardTitle>
          <CardDescription className="text-muted-foreground">
            Centro Paula Souza - Acesso Seguro
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Nome de usuário
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading}
                />
                <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  disabled={isLoading}
                />
                <Shield className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginAttempts > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning-foreground">
                  ⚠️ Tentativas de login: {loginAttempts}/3
                </p>
              </div>
            )}
            
            <BankingButton
              type="submit"
              variant="primary"
              size="wide"
              className="w-full"
              disabled={isLoading || loginAttempts >= 3}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </BankingButton>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Use: <strong>etec</strong> / <strong>123456</strong></p>
              <p className="mt-2">Aplicativo seguro ETEC Centro Paula Souza</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};