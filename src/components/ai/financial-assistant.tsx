import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BankingButton } from "@/components/ui/banking-button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  PiggyBank, 
  CreditCard,
  Target,
  Lightbulb,
  X,
  Minimize2,
  Maximize2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface FinancialAssistantProps {
  userBalance: number;
  transactions: Transaction[];
  username: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const FinancialAssistant = ({ 
  userBalance, 
  transactions, 
  username,
  isOpen,
  onToggle
}: FinancialAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: `Olá, ${username}! Sou seu assistente financeiro da ETEC. Como posso ajudar você hoje?`,
      timestamp: new Date(),
      suggestions: [
        "Analisar meus gastos",
        "Dicas para economizar", 
        "Planejar investimentos",
        "Configurar metas"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Advanced prompting system based on user context
  const generateContextualResponse = (userInput: string): { content: string; suggestions: string[] } => {
    const input = userInput.toLowerCase();
    
    // Analyze spending patterns
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const categorySpending = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];

    // Context-aware responses
    if (input.includes('gasto') || input.includes('analis') || input.includes('despesa')) {
      return {
        content: `📊 **Análise dos seus gastos:**

Seus gastos totais: **R$ ${totalExpenses.toFixed(2)}**
Saldo atual: **R$ ${userBalance.toFixed(2)}**

${topCategory ? `Categoria com mais gastos: **${topCategory[0]}** (R$ ${topCategory[1].toFixed(2)})` : ''}

**Insights personalizados:**
• Você gastou ${((totalExpenses / userBalance) * 100).toFixed(1)}% do seu saldo
• ${totalExpenses > userBalance * 0.7 ? '⚠️ Atenção: seus gastos estão altos!' : '✅ Seus gastos estão controlados'}
• ${transactions.filter(t => t.type === 'expense').length} transações de despesa realizadas`,
        suggestions: [
          "Como reduzir gastos?",
          "Dicas para a categoria " + (topCategory?.[0] || "alimentação"),
          "Criar meta de economia",
          "Analisar tendências"
        ]
      };
    }

    if (input.includes('economiz') || input.includes('poupar') || input.includes('dica')) {
      return {
        content: `💡 **Dicas personalizadas para economizar:**

Com base no seu perfil ETEC, aqui estão minhas sugestões:

🎯 **Dicas específicas para você:**
• Configure alertas para gastos acima de R$ ${(userBalance * 0.1).toFixed(2)}
• ${topCategory ? `Reduza 20% nos gastos com ${topCategory[0]}` : 'Monitore suas categorias de gastos'}
• Use o transporte estudantil da ETEC quando possível

📱 **Recursos do app:**
• Ative notificações de gastos em tempo real
• Configure metas mensais de economia
• Use PIX para evitar taxas bancárias

🏦 **Para estudantes ETEC:**
• Aproveite descontos estudantis
• Considere contas universitárias sem taxa
• Participe de programas de educação financeira`,
        suggestions: [
          "Configurar alertas",
          "Criar meta mensal", 
          "Dicas para estudantes",
          "Planejamento financeiro"
        ]
      };
    }

    if (input.includes('invest') || input.includes('renda') || input.includes('aplicaç')) {
      return {
        content: `📈 **Guia de investimentos para estudantes ETEC:**

**Seu perfil de risco:** Conservador (recomendado para estudantes)

💰 **Opções adequadas para você:**
• **Poupança:** Segura, R$ ${(userBalance * 0.3).toFixed(2)} sugerido
• **CDB:** Rentabilidade melhor que poupança
• **Tesouro Direto:** A partir de R$ 30
• **Fundos DI:** Para emergências

🎓 **Dicas educativas:**
• Comece com 10-15% da sua renda
• Mantenha reserva de emergência
• Estude sobre educação financeira
• Use simuladores antes de investir

⚡ **Próximos passos:**
• Configure uma meta de investimento
• Simule cenários no app
• Acompanhe o mercado financeiro`,
        suggestions: [
          "Simular investimentos",
          "Criar reserva de emergência",
          "Aprender sobre CDB",
          "Calculadora de juros"
        ]
      };
    }

    if (input.includes('meta') || input.includes('objetivo') || input.includes('planeja')) {
      return {
        content: `🎯 **Planejamento de metas financeiras:**

**Sugestão baseada no seu perfil:**
Meta de economia mensal: **R$ ${(userBalance * 0.2).toFixed(2)}**

📋 **Metas recomendadas para estudantes ETEC:**
• **Curto prazo (3 meses):** Reserva de emergência
• **Médio prazo (6-12 meses):** Curso de especialização
• **Longo prazo (2+ anos):** Viagem de formatura

✨ **Como atingir suas metas:**
• Defina valores específicos e prazos
• Configure lembretes automáticos
• Monitore progresso semanalmente
• Comemore conquistas pequenas

🔧 **Ferramentas disponíveis:**
• Simulador de metas no app
• Acompanhamento visual do progresso
• Notificações de marcos importantes`,
        suggestions: [
          "Criar meta de emergência",
          "Meta para viagem ETEC",
          "Curso de especialização",
          "Acompanhar progresso"
        ]
      };
    }

    if (input.includes('pix') || input.includes('transfer') || input.includes('pagamento')) {
      return {
        content: `💸 **Dicas para PIX e transferências:**

**Suas estatísticas PIX:**
• Transações realizadas: ${transactions.filter(t => t.description.includes('PIX')).length}
• Economia em taxas: Aproximadamente R$ 15/mês

🔒 **Segurança em transferências:**
• Sempre confirme dados do destinatário
• Use PIX para pagamentos instantâneos
• Evite transferências em redes públicas
• Configure limites de segurança

⚡ **Recursos avançados:**
• PIX Agendado para contas fixas
• QR Code para vendas
• PIX Cobrança para recebimentos
• Comprovantes automáticos

🎓 **Para estudantes ETEC:**
• Use PIX para dividir contas
• QR Code para trabalhos em grupo
• Transferências entre colegas sem taxa`,
        suggestions: [
          "Configurar limites PIX",
          "Gerar QR Code",
          "PIX Agendado",
          "Histórico de transferências"
        ]
      };
    }

    // Default response with contextual insights
    return {
      content: `🤖 Entendi! Como seu assistente financeiro da ETEC, posso ajudar com várias questões.

**Resumo do seu perfil:**
• Saldo atual: R$ ${userBalance.toFixed(2)}
• Transações recentes: ${transactions.length}
• Status financeiro: ${userBalance > 1000 ? '✅ Estável' : '⚠️ Atenção necessária'}

**O que posso fazer por você:**
📊 Analisar gastos e padrões
💡 Dar dicas personalizadas de economia  
📈 Orientar sobre investimentos seguros
🎯 Ajudar no planejamento financeiro
🔒 Dicas de segurança bancária

Como posso ajudar especificamente?`,
      suggestions: [
        "Analisar meus gastos",
        "Dicas para economizar",
        "Orientação sobre investimentos",
        "Planejamento financeiro"
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const response = generateContextualResponse(inputMessage);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <BankingButton
          onClick={onToggle}
          className="h-14 w-14 rounded-full shadow-[var(--shadow-elevation)] animate-pulse-soft"
          variant="default"
        >
          <MessageCircle className="w-6 h-6" />
        </BankingButton>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 shadow-[var(--shadow-elevation)] animate-slide-in">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary to-primary-light text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Assistente ETEC
            </CardTitle>
            <div className="flex gap-1">
              <BankingButton
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </BankingButton>
              <BankingButton
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="w-3 h-3" />
              </BankingButton>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 p-2 overflow-hidden">
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-2 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'assistant' && (
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] ${message.type === 'user' ? 'order-1' : ''}`}>
                        <div
                          className={`p-2 rounded-lg text-xs ${
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-accent text-accent-foreground'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                        
                        {message.suggestions && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.suggestions.map((suggestion, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {message.type === 'user' && (
                        <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-3 h-3 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                      <div className="bg-accent p-2 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            <div className="p-2 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Digite sua pergunta..."
                  className="text-xs"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isTyping}
                />
                <BankingButton
                  onClick={handleSendMessage}
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  disabled={isTyping || !inputMessage.trim()}
                >
                  <Send className="w-3 h-3" />
                </BankingButton>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};