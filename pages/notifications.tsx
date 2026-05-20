import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Zap, Trophy, AlertCircle, Info, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const typeIcon: Record<string, any> = {
  xp: Zap,
  badge: Trophy,
  deadline: AlertCircle,
  system: Info,
  group: Users,
};

const typeColor: Record<string, string> = {
  xp: "text-yellow-500",
  badge: "text-purple-500",
  deadline: "text-red-500",
  system: "text-blue-500",
  group: "text-green-500",
};

export default function Notifications() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = unreadOnly ? { unreadOnly: true } : {};
  const { data: notificationsData, isLoading } = useListNotifications(params, { query: { queryKey: getListNotificationsQueryKey(params) } });
  const notifications = (notificationsData as any[]) ?? [];

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = async (id: number) => {
    await markRead.mutateAsync({ notificationId: id });
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ unreadOnly: true }) });
  };

  const handleMarkAll = async () => {
    await markAllRead.mutateAsync({});
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ unreadOnly: true }) });
    toast({ title: "All notifications marked as read" });
  };

  const unreadCount = notifications.filter((n: any) => !n.readAt).length;

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-testid="button-toggle-unread"
              variant="outline"
              size="sm"
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={unreadOnly ? "bg-primary text-primary-foreground border-primary" : ""}
            >
              {unreadOnly ? "All" : "Unread only"}
            </Button>
            {unreadCount > 0 && (
              <Button data-testid="button-mark-all-read" variant="outline" size="sm" onClick={handleMarkAll} disabled={markAllRead.isPending}>
                <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{unreadOnly ? "No unread notifications" : "No notifications yet"}</p>
            <p className="text-sm">You'll be notified about deadlines, XP, and badges</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => {
              const Icon = typeIcon[n.type] ?? Bell;
              const color = typeColor[n.type] ?? "text-muted-foreground";
              const isUnread = !n.readAt;
              return (
                <div
                  key={n.id}
                  data-testid={`notification-${n.id}`}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    isUnread
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                      : "bg-card border-card-border hover:bg-muted/30"
                  }`}
                  onClick={() => isUnread && handleMarkRead(n.id)}
                >
                  <div className={`flex-shrink-0 mt-0.5 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isUnread ? "font-semibold text-foreground" : "text-foreground"}`}>{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {isUnread && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
