import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BankingButton } from "@/components/ui/banking-button";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  ArrowRight, 
  CheckCircle, 
  Play,
  BookOpen,
  Zap,
  Target,
  X
} from "lucide-react";

interface ContextualPrompt {
  id: string;
  title: string;
  description: string;
  steps: string[];
  category: 'tutorial' | 'tip' | 'onboarding' | 'feature';
  trigger: string;
  isCompleted?: boolean;
}

interface ContextualPromptsProps {
  currentPage: string;
  userActions: string[];
  isFirstTime?: boolean;
  onPromptComplete?: (promptId: string) => void;
}

export const ContextualPrompts = ({ 
  currentPage, 
  userActions, 
  isFirstTime = false,
  onPromptComplete 
}: ContextualPromptsProps) => {
  const [activePrompt, setActivePrompt] = useState<ContextualPrompt | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedPrompts, setCompletedPrompts] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Define contextual prompts for different scenarios
  const contextualPrompts: ContextualPrompt[] = [
    {
      id: 'dashboard-welcome',
      title: 'Bem-vindo ao seu Banco ETEC!',
      description: 'Vamos fazer um tour rápido pelas principais funcionalidades',
      steps: [
        'Visualize seu saldo e transações recentes',
        'Explore as ações rápidas: PIX, Cartão, Transferências',
        'Acompanhe suas metas de economia',
        'Configure notificações para controle financeiro'
      ],
      category: 'onboarding',
      trigger: 'dashboard-first-visit'
    },
    {
      id: 'pix-tutorial',
      title: 'Como usar o PIX ETEC',
      description: 'Aprenda a fazer transferências instantâneas com segurança',
      steps: [
        'Escolha entre Enviar, Receber ou usar QR Code',
        'Para enviar: digite a chave PIX e valor',
        'Para receber: compartilhe sua chave ou QR Code',
        'Sempre verifique os dados antes de confirmar'
      ],
      category: 'tutorial',
      trigger: 'pix-first-access'
    },
    {
      id: 'spending-analysis',
      title: 'Análise inteligente de gastos',
      description: 'Use nossa IA para entender seus padrões financeiros',
      steps: [
        'Acesse o assistente financeiro no ícone de chat',
        'Pergunte "analisar meus gastos"',
        'Receba insights personalizados sobre suas finanças',
        'Configure alertas baseados nas recomendações'
      ],
      category: 'feature',
      trigger: 'high-spending-detected'
    },
    {
      id: 'security-tips',
      title: 'Dicas de segurança bancária',
      description: 'Proteja suas transações com essas práticas essenciais',
      steps: [
        'Nunca compartilhe sua senha ou dados pessoais',
        'Sempre verifique URLs e certificados de segurança',
        'Configure limites para PIX e transferências',
        'Monitore suas transações regularmente'
      ],
      category: 'tip',
      trigger: 'security-reminder'
    },
    {
      id: 'goal-setting',
      title: 'Configure suas metas financeiras',
      description: 'Planeje seu futuro com metas inteligentes',
      steps: [
        'Defina objetivos específicos e realistas',
        'Estabeleça prazos para suas metas',
        'Configure lembretes automáticos',
        'Acompanhe seu progresso visualmente'
      ],
      category: 'feature',
      trigger: 'stable-balance-detected'
    }
  ];

  // Determine which prompt to show based on context
  const determinePromptToShow = (): ContextualPrompt | null => {
    // First time user onboarding
    if (isFirstTime && currentPage === 'dashboard' && !completedPrompts.includes('dashboard-welcome')) {
      return contextualPrompts.find(p => p.id === 'dashboard-welcome') || null;
    }

    // PIX tutorial on first access
    if (currentPage === 'pix' && !userActions.includes('pix-used') && !completedPrompts.includes('pix-tutorial')) {
      return contextualPrompts.find(p => p.id === 'pix-tutorial') || null;
    }

    // Security tips reminder (shown periodically)
    if (userActions.includes('multiple-transactions') && !completedPrompts.includes('security-tips')) {
      return contextualPrompts.find(p => p.id === 'security-tips') || null;
    }

    // Feature suggestions based on user behavior
    if (userActions.includes('high-balance') && !completedPrompts.includes('goal-setting')) {
      return contextualPrompts.find(p => p.id === 'goal-setting') || null;
    }

    return null;
  };

  useEffect(() => {
    const promptToShow = determinePromptToShow();
    if (promptToShow && !activePrompt) {
      setActivePrompt(promptToShow);
      setCurrentStep(0);
      setIsVisible(true);
    }
  }, [currentPage, userActions, isFirstTime, completedPrompts]);

  const handleNextStep = () => {
    if (activePrompt && currentStep < activePrompt.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompletePrompt();
    }
  };

  const handleCompletePrompt = () => {
    if (activePrompt) {
      setCompletedPrompts(prev => [...prev, activePrompt.id]);
      if (onPromptComplete) {
        onPromptComplete(activePrompt.id);
      }
    }
    handleClosePrompt();
  };

  const handleClosePrompt = () => {
    setIsVisible(false);
    setTimeout(() => {
      setActivePrompt(null);
      setCurrentStep(0);
    }, 300);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tutorial': return BookOpen;
      case 'tip': return Zap;
      case 'onboarding': return Play;
      case 'feature': return Target;
      default: return HelpCircle;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tutorial': return 'text-primary';
      case 'tip': return 'text-warning';
      case 'onboarding': return 'text-success';
      case 'feature': return 'text-secondary-foreground';
      default: return 'text-muted-foreground';
    }
  };

  if (!activePrompt || !isVisible) {
    return null;
  }

  const CategoryIcon = getCategoryIcon(activePrompt.category);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md shadow-[var(--shadow-elevation)] animate-scale-in">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-accent flex items-center justify-center ${getCategoryColor(activePrompt.category)}`}>
                <CategoryIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{activePrompt.title}</h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  {activePrompt.category === 'tutorial' && 'Tutorial'}
                  {activePrompt.category === 'tip' && 'Dica'}
                  {activePrompt.category === 'onboarding' && 'Introdução'}
                  {activePrompt.category === 'feature' && 'Recurso'}
                </Badge>
              </div>
            </div>
            
            <BankingButton
              variant="ghost"
              size="icon"
              onClick={handleClosePrompt}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </BankingButton>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            {activePrompt.description}
          </p>

          <div className="space-y-4">
            <div className="space-y-3">
              {activePrompt.steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    index === currentStep
                      ? 'bg-primary/10 border border-primary/20'
                      : index < currentStep
                      ? 'bg-success/10 border border-success/20'
                      : 'bg-accent/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index < currentStep
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  <p className={`text-sm ${
                    index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                Passo {currentStep + 1} de {activePrompt.steps.length}
              </div>
              
              <div className="flex gap-2">
                <BankingButton
                  variant="outline"
                  size="sm"
                  onClick={handleClosePrompt}
                >
                  Pular
                </BankingButton>
                
                <BankingButton
                  size="sm"
                  onClick={handleNextStep}
                  className="gap-2"
                >
                  {currentStep === activePrompt.steps.length - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Concluir
                    </>
                  ) : (
                    <>
                      Próximo
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </BankingButton>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};