import { useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useUnreadNotificationCount,
} from "@/services/queries";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const NotificationPanel = () => {
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications(1, 10);
  const { data: unreadCount } = useUnreadNotificationCount();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsReadMutation.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return "💬";
      case "like":
        return "❤️";
      case "follow":
        return "👤";
      case "mention":
        return "@";
      case "system":
        return "🔔";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return "bg-background";
    switch (type) {
      case "comment":
        return "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500";
      case "like":
        return "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500";
      case "follow":
        return "bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500";
      case "mention":
        return "bg-purple-50 dark:bg-purple-950/20 border-l-4 border-l-purple-500";
      default:
        return "bg-orange-50 dark:bg-orange-950/20 border-l-4 border-l-orange-500";
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          {unreadCount && unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-primary animate-pulse" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold">通知</span>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              全部已读
            </Button>
          )}
        </DropdownMenuLabel>

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notifications && notifications.data.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.data.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 transition-colors hover:bg-secondary/50",
                    getNotificationColor(notification.type, notification.read)
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          notification.read ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {notification.title}
                      </div>
                      <div
                        className={cn(
                          "text-sm mt-1 line-clamp-2",
                          notification.read ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {notification.content}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-6 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            标记已读
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">暂无通知</p>
            </div>
          )}
        </ScrollArea>

        {notifications && notifications.data.length > 0 && (
          <div className="border-t p-2">
            <Link to="/notifications" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full" size="sm">
                查看全部通知
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationPanel;
