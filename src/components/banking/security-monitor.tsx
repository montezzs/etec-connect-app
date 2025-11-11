import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Shield, Activity, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Anomaly {
  id: string;
  transaction_id: string | null;
  user_id: string;
  anomaly_type: string;
  severity: string;
  description: string;
  metadata: any;
  resolved: boolean;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  admin_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
}

interface SecurityMonitorProps {
  userId: string;
}

export const SecurityMonitor = ({ userId }: SecurityMonitorProps) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
    
    // Set up real-time monitoring for anomalies
    const anomalyChannel = supabase
      .channel('security-anomalies')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transaction_anomalies',
          filter: `severity=eq.critical,severity=eq.high`
        },
        (payload) => {
          console.log('🚨 New security anomaly detected:', payload);
          setAnomalies(prev => [payload.new as Anomaly, ...prev]);
          
          // Show browser notification for critical anomalies
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 Anomalia de Segurança Detectada', {
              body: (payload.new as Anomaly).description,
              icon: '/favicon.ico'
            });
          }
        }
      )
      .subscribe();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(anomalyChannel);
    };
  }, [userId]);

  const fetchSecurityData = async () => {
    setIsLoading(true);
    
    // Fetch anomalies
    const { data: anomalyData } = await supabase
      .from('transaction_anomalies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (anomalyData) setAnomalies(anomalyData);

    // Fetch audit logs
    const { data: auditData } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (auditData) setAuditLogs(auditData);

    setIsLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Activity className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const unresolvedAnomalies = anomalies.filter(a => !a.resolved);
  const criticalAnomalies = unresolvedAnomalies.filter(a => a.severity === 'critical');
  const highAnomalies = unresolvedAnomalies.filter(a => a.severity === 'high');

  return (
    <div className="space-y-6">
      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Críticas</p>
                <p className="text-2xl font-bold text-destructive">{criticalAnomalies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alta Prioridade</p>
                <p className="text-2xl font-bold text-orange-500">{highAnomalies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Não Resolvidas</p>
                <p className="text-2xl font-bold text-foreground">{unresolvedAnomalies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalAnomalies.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>🚨 Anomalias Críticas Detectadas</AlertTitle>
          <AlertDescription>
            {criticalAnomalies.length} anomalia(s) crítica(s) requer(em) atenção imediata. 
            Revise abaixo e tome ações corretivas.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for Anomalies and Audit Logs */}
      <Card className="shadow-[var(--shadow-card)]">
        <Tabs defaultValue="anomalies" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="anomalies">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Anomalias ({anomalies.length})
              </TabsTrigger>
              <TabsTrigger value="audit">
                <Activity className="w-4 h-4 mr-2" />
                Logs de Auditoria ({auditLogs.length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="anomalies" className="mt-0">
              <ScrollArea className="h-[500px] pr-4">
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : anomalies.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Nenhuma anomalia detectada. Sistema operando normalmente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {anomalies.map((anomaly) => (
                      <div
                        key={anomaly.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          anomaly.severity === 'critical'
                            ? 'bg-destructive/10 border-destructive'
                            : anomaly.severity === 'high'
                            ? 'bg-orange-500/10 border-orange-500'
                            : 'bg-accent/50 border-accent'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(anomaly.severity)}
                            <Badge variant={getSeverityColor(anomaly.severity)}>
                              {anomaly.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {anomaly.anomaly_type.replace('_', ' ')}
                            </Badge>
                            {anomaly.resolved && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                                Resolvido
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(anomaly.created_at)}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{anomaly.description}</p>
                        {anomaly.metadata && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              Ver detalhes técnicos
                            </summary>
                            <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                              {JSON.stringify(anomaly.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="audit" className="mt-0">
              <ScrollArea className="h-[500px] pr-4">
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    Nenhum log de auditoria disponível.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-lg bg-accent/50 hover:bg-accent/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            <Badge variant="outline">{log.action}</Badge>
                            {log.table_name && (
                              <Badge variant="secondary">{log.table_name}</Badge>
                            )}
                            {log.admin_id && (
                              <Badge variant="default" className="bg-primary/20">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        
                        {(log.old_values || log.new_values) && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              Ver alterações
                            </summary>
                            <div className="mt-2 space-y-2">
                              {log.old_values && (
                                <div>
                                  <p className="font-semibold mb-1">Valores anteriores:</p>
                                  <pre className="p-2 bg-background rounded text-xs overflow-x-auto">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div>
                                  <p className="font-semibold mb-1">Novos valores:</p>
                                  <pre className="p-2 bg-background rounded text-xs overflow-x-auto">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};
