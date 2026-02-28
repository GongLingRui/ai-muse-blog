import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Loader2,
  Trash2,
  Check,
  CheckCheck,
  Filter,
  Clock,
  User,
  MessageSquare,
  Heart,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type NotificationType = "like" | "comment" | "follow" | "mention" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  link: string | null;
  read: boolean;
  created_at: string;
  actor_id: string | null;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  like: <Heart className="h-5 w-5 text-pink-500" />,
  comment: <MessageSquare className="h-5 w-5 text-blue-500" />,
  follow: <User className="h-5 w-5 text-purple-500" />,
  mention: <MessageSquare className="h-5 w-5 text-orange-500" />,
  system: <Bell className="h-5 w-5 text-gray-500" />,
};

const Notifications = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const response = await api.notifications.list({ unread_only: false }) as {
        success: boolean;
        data: Notification[];
        unread_count: number;
      };

      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.unread_count);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.notifications.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success("全部标记为已读");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("操作失败");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await api.notifications.delete(notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      const deletedNotification = notifications.find((n) => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("删除失败");
    }
  };

  const handleDeleteAllRead = async () => {
    setDeletingAll(true);
    try {
      await api.notifications.deleteAllRead();

      const readNotifications = notifications.filter((n) => n.read);
      setNotifications((prev) => prev.filter((n) => !n.read));

      toast.success(`已删除 ${readNotifications.length} 条通知`);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete all read:", error);
      toast.error("操作失败");
    } finally {
      setDeletingAll(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : !n.read
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                通知中心
              </h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 && `你有 ${unreadCount} 条未读通知`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {filter === "all" ? "全部通知" : "未读"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilter("all")}>
                    全部通知
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("unread")}>
                    未读通知
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  全部已读
                </Button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <Card className="border-border/50 shadow-card">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">加载通知中...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredNotifications.length > 0 ? (
            /* Notifications List */
            <div className="space-y-3">
              {filteredNotifications.map((notification, index) => (
                <div
                  key={`notification-${notification.id}-${index}`}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "group relative p-4 rounded-lg border transition-all cursor-pointer",
                    notification.read
                      ? "bg-card border-border/50 hover:bg-secondary/30"
                      : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "shrink-0 p-2 rounded-full",
                      notification.read ? "bg-secondary/50" : "bg-primary/10"
                    )}>
                      {notificationIcons[notification.type] || notificationIcons.system}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={cn(
                          "font-medium",
                          notification.read ? "text-foreground" : "text-primary"
                        )}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-primary"></span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(notification.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <Card className="border-border/50 shadow-card">
              <CardContent className="py-16">
                <div className="text-center">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {filter === "unread" ? "没有未读通知" : "暂无通知"}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {filter === "unread"
                      ? "太棒了！你已经阅读了所有通知"
                      : "当有新活动时，通知会显示在这里"}
                  </p>
                  {notifications.length > 0 && filter === "unread" && (
                    <Button
                      variant="outline"
                      onClick={() => setFilter("all")}
                    >
                      查看全部通知
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete All Read Button */}
          {notifications.some((n) => n.read) && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除所有已读通知
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除所有已读通知？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除所有已读通知，无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAll}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllRead}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingAll}
            >
              {deletingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                "确认删除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Notifications;
