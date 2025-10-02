import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankingButton } from "@/components/ui/banking-button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bell, Check, Trash2, AlertCircle, TrendingUp, DollarSign } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'transaction' | 'investment' | 'security' | 'general';
  read: boolean;
  created_at: string;
}

interface NotificationsProps {
  onBack: () => void;
  userId: string;
}

export const Notifications = ({ onBack, userId }: NotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    
    // Realtime subscription
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Nova notificação!",
              description: payload.new.title,
            });
          }
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setNotifications(data as Notification[]);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    
    toast({
      title: "Notificação removida",
    });
  };

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    
    fetchNotifications();
    toast({
      title: "Todas marcadas como lidas",
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <DollarSign className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      case 'security':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'bg-primary/20 text-primary';
      case 'investment':
        return 'bg-success/20 text-success';
      case 'security':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-accent text-accent-foreground';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <h1 className="text-xl font-bold flex items-center gap-2">
            Notificações
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-primary-foreground text-primary">
                {unreadCount}
              </Badge>
            )}
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Actions */}
        {unreadCount > 0 && (
          <BankingButton
            onClick={markAllAsRead}
            variant="outline"
            className="w-full"
          >
            <Check className="w-4 h-4 mr-2" />
            Marcar todas como lidas
          </BankingButton>
        )}

        {/* Notifications List */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>
              {notifications.length === 0 ? "Nenhuma notificação" : "Todas as notificações"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-muted-foreground">
                  Você não tem notificações
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg transition-all ${
                    notification.read 
                      ? 'bg-accent/30' 
                      : 'bg-accent/70 border-2 border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <BankingButton
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8"
                            >
                              <Check className="w-4 h-4" />
                            </BankingButton>
                          )}
                          <BankingButton
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </BankingButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
