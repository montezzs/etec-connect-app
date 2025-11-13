import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Lightbulb,
  Shield,
  TrendingUp
} from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  message: string;
  suggestion?: string;
  type: 'error' | 'warning' | 'success' | 'info';
}

interface SmartFormValidationProps {
  type: 'pix-key' | 'amount' | 'description' | 'phone' | 'email';
  value: string;
  label: string;
  placeholder: string;
  userBalance?: number;
  recentTransactions?: any[];
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const SmartFormValidation = ({
  type,
  value,
  label,
  placeholder,
  userBalance = 0,
  recentTransactions = [],
  onChange,
  onValidationChange
}: SmartFormValidationProps) => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Advanced validation with contextual intelligence
  const validateInput = (inputValue: string): ValidationResult => {
    // Description is optional, skip empty check
    if (!inputValue.trim() && type !== 'description') {
      return {
        isValid: false,
        message: `${label} é obrigatório`,
        type: 'error'
      };
    }

    switch (type) {
      case 'pix-key':
        return validatePixKey(inputValue);
      case 'amount':
        return validateAmount(inputValue);
      case 'description':
        return validateDescription(inputValue);
      case 'phone':
        return validatePhone(inputValue);
      case 'email':
        return validateEmail(inputValue);
      default:
        return { isValid: true, message: '', type: 'success' };
    }
  };

  const validatePixKey = (key: string): ValidationResult => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(key)) {
      if (key.includes('@cps.sp.gov.br') || key.includes('@etec.sp.gov.br')) {
        return {
          isValid: true,
          message: '✅ Chave PIX ETEC válida',
          suggestion: 'Ótima escolha! Usando sistema ETEC para transferência',
          type: 'success'
        };
      }
      return {
        isValid: true,
        message: '✅ E-mail válido como chave PIX',
        type: 'success'
      };
    }

    // CPF validation (simplified)
    const cpfRegex = /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (cpfRegex.test(key.replace(/\D/g, ''))) {
      return {
        isValid: true,
        message: '✅ CPF válido como chave PIX',
        suggestion: 'Lembre-se: nunca compartilhe seu CPF em locais públicos',
        type: 'success'
      };
    }

    // Phone validation
    const phoneRegex = /^\+?5511\d{8,9}$|^\(11\)\s?\d{4,5}-?\d{4}$/;
    if (phoneRegex.test(key.replace(/\s/g, ''))) {
      return {
        isValid: true,
        message: '✅ Telefone válido como chave PIX',
        type: 'success'
      };
    }

    // Random key validation
    if (key.length >= 32 && /^[a-f0-9-]+$/i.test(key)) {
      return {
        isValid: true,
        message: '✅ Chave aleatória válida',
        suggestion: 'Chaves aleatórias são mais seguras para privacidade',
        type: 'success'
      };
    }

    return {
      isValid: false,
      message: 'Formato de chave PIX inválido',
      suggestion: 'Use: email, CPF, telefone (+5511...) ou chave aleatória',
      type: 'error'
    };
  };

  const validateAmount = (amount: string): ValidationResult => {
    const numAmount = parseFloat(amount.replace(',', '.'));
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return {
        isValid: false,
        message: 'Valor deve ser maior que zero',
        type: 'error'
      };
    }

    if (numAmount > userBalance) {
      return {
        isValid: false,
        message: 'Saldo insuficiente para esta transação',
        suggestion: `Seu saldo atual: R$ ${userBalance.toFixed(2)}`,
        type: 'error'
      };
    }

    // Contextual warnings
    if (numAmount > userBalance * 0.5) {
      return {
        isValid: true,
        message: '⚠️ Transação de valor alto',
        suggestion: 'Você está enviando mais de 50% do seu saldo. Confirme se é necessário.',
        type: 'warning'
      };
    }

    if (numAmount > 1000) {
      return {
        isValid: true,
        message: '🔒 Valor acima de R$ 1.000',
        suggestion: 'Transações altas podem ter limites especiais. Verifique com seu banco.',
        type: 'warning'
      };
    }

    // Smart suggestions based on user patterns
    const avgTransaction = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;
    if (numAmount > avgTransaction * 3) {
      return {
        isValid: true,
        message: '📊 Valor acima da sua média',
        suggestion: `Sua média de transações: R$ ${avgTransaction.toFixed(2)}`,
        type: 'info'
      };
    }

    return {
      isValid: true,
      message: '✅ Valor válido',
      type: 'success'
    };
  };

  const validateDescription = (desc: string): ValidationResult => {
    // Description is optional - return valid if empty
    if (!desc || desc.trim().length === 0) {
      return {
        isValid: true,
        message: '',
        type: 'success'
      };
    }

    if (desc.length > 100) {
      return {
        isValid: false,
        message: 'Descrição muito longa (máx. 100 caracteres)',
        type: 'error'
      };
    }

    if (desc.length < 3) {
      return {
        isValid: true,
        message: 'Descrição muito curta',
        suggestion: 'Adicione mais detalhes para facilitar o controle financeiro',
        type: 'info'
      };
    }

    return {
      isValid: true,
      message: desc.length > 10 ? '✅ Descrição detalhada' : '✅ Descrição válida',
      type: 'success'
    };
  };

  const validatePhone = (phone: string): ValidationResult => {
    const phoneRegex = /^\+?5511\d{8,9}$|^\(11\)\s?\d{4,5}-?\d{4}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return {
        isValid: false,
        message: 'Formato de telefone inválido',
        suggestion: 'Use formato: (11) 99999-9999 ou +5511999999999',
        type: 'error'
      };
    }

    return {
      isValid: true,
      message: '✅ Telefone válido',
      type: 'success'
    };
  };

  const validateEmail = (email: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: 'Formato de email inválido',
        type: 'error'
      };
    }

    if (email.includes('@cps.sp.gov.br') || email.includes('@etec.sp.gov.br')) {
      return {
        isValid: true,
        message: '✅ Email institucional ETEC',
        suggestion: 'Ótimo! Usando email institucional para maior segurança',
        type: 'success'
      };
    }

    return {
      isValid: true,
      message: '✅ Email válido',
      type: 'success'
    };
  };

  // Generate smart suggestions based on input type and context
  const generateSuggestions = (): string[] => {
    switch (type) {
      case 'pix-key':
        return [
          'usuario@etec.sp.gov.br',
          'nome.sobrenome@cps.sp.gov.br',
          '(11) 99999-9999',
          'Chave aleatória'
        ];
      case 'amount':
        const commonAmounts = ['10,00', '25,00', '50,00', '100,00'];
        if (recentTransactions.length > 0) {
          const avgAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;
          commonAmounts.unshift(avgAmount.toFixed(2).replace('.', ','));
        }
        return commonAmounts;
      case 'description':
        return [
          'Almoço universitário',
          'Material escolar',
          'Transporte',
          'Projeto ETEC',
          'Divisão de conta'
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    const result = validateInput(value);
    setValidation(result);
    setSuggestions(generateSuggestions());
    
    if (onValidationChange) {
      onValidationChange(result.isValid);
    }
  }, [value, userBalance, recentTransactions]);

  const getValidationIcon = () => {
    if (!validation) return null;
    
    switch (validation.type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'info': return <Info className="w-4 h-4 text-primary" />;
      default: return null;
    }
  };

  const getValidationColor = () => {
    if (!validation) return '';
    
    switch (validation.type) {
      case 'success': return 'border-success';
      case 'error': return 'border-destructive';
      case 'warning': return 'border-warning';
      case 'info': return 'border-primary';
      default: return '';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={type} className="text-sm font-medium">
        {label}
      </Label>
      
      <div className="relative">
        <Input
          id={type}
          type={type === 'amount' ? 'number' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className={`pr-10 ${getValidationColor()}`}
          step={type === 'amount' ? '0.01' : undefined}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>

      {/* Validation Message */}
      {validation && validation.message && (
        <div className={`flex items-start gap-2 text-xs ${
          validation.type === 'success' ? 'text-success' :
          validation.type === 'error' ? 'text-destructive' :
          validation.type === 'warning' ? 'text-warning' :
          'text-primary'
        }`}>
          {getValidationIcon()}
          <div>
            <p>{validation.message}</p>
            {validation.suggestion && (
              <p className="text-muted-foreground mt-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                {validation.suggestion}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Smart Suggestions */}
      {showSuggestions && suggestions.length > 0 && !value && (
        <Card className="absolute z-10 w-full mt-1 shadow-[var(--shadow-card)]">
          <CardContent className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">Sugestões inteligentes</span>
            </div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onChange(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left p-2 text-xs rounded hover:bg-accent transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};