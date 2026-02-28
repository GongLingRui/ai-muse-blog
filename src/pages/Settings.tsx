import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Bell,
  Globe,
  MapPin,
  Linkedin,
  Github,
  Twitter,
  Link2,
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const Settings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Avatar upload
  const fileInputRef = useState<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setWebsite(user.website || "");
      setTwitter(user.twitter_username || "");
      setGithub(user.github_username || "");
      setLinkedin(user.linkedin_url || "");
      setEmailNotifications(user.notification_preferences?.email ?? true);
      setPushNotifications(user.notification_preferences?.push ?? false);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.users.updateMe({
        full_name: fullName,
        bio,
        location,
        website,
        twitter_username: twitter,
        github_username: github,
        linkedin_url: linkedin,
      });

      // Update local user state
      updateUser({
        ...user,
        full_name: fullName,
        bio,
        location,
        website,
        twitter_username: twitter,
        github_username: github,
        linkedin_url: linkedin,
      });

      toast.success("个人资料已更新");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("更新失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await api.users.updateMe({
        notification_preferences: {
          email: emailNotifications,
          push: pushNotifications,
        },
      });

      updateUser({
        ...user,
        notification_preferences: {
          email: emailNotifications,
          push: pushNotifications,
        },
      });

      toast.success("通知设置已更新");
    } catch (error) {
      console.error("Failed to update notifications:", error);
      toast.error("更新失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("新密码与确认密码不一致");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("密码至少需要 8 个字符");
      return;
    }

    setSaving(true);
    try {
      await api.auth.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
      });

      toast.success("密码修改成功");
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error("密码修改失败，请检查当前密码是否正确");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("头像大小不能超过 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const response = await api.upload.image(file) as {
        success: boolean;
        data: { file_url: string };
      };

      if (response.success) {
        await api.users.updateMe({
          avatar_url: response.data.file_url,
        });

        updateUser({
          ...user,
          avatar_url: response.data.file_url,
        });

        toast.success("头像更新成功");
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast.error("头像上传失败");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-muted-foreground">请先登录</p>
            <Button onClick={() => navigate("/auth")} className="mt-4">
              前往登录
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-foreground mb-6">设置</h1>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                个人资料
              </TabsTrigger>
              <TabsTrigger value="account">
                <Lock className="h-4 w-4 mr-2" />
                账号安全
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                通知设置
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Globe className="h-4 w-4 mr-2" />
                偏好设置
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle>个人资料</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user?.avatar_url} alt={user?.full_name || user?.username} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                        {(user?.full_name || user?.username)?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef?.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4 mr-2" />
                        )}
                        更换头像
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        支持 JPG、PNG、GIF，最大 5MB
                      </p>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">姓名</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="输入你的姓名"
                      className="bg-secondary/30 border-border/50"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">个人简介</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="介绍一下你自己..."
                      className="bg-secondary/30 border-border/50 min-h-[100px]"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">位置</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="城市, 国家"
                        className="pl-9 bg-secondary/30 border-border/50"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website">个人网站</Label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="pl-9 bg-secondary/30 border-border/50"
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="twitter"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          placeholder="username"
                          className="pl-9 bg-secondary/30 border-border/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="github"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          placeholder="username"
                          className="pl-9 bg-secondary/30 border-border/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="linkedin"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="profile url"
                          className="pl-9 bg-secondary/30 border-border/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="gradient-primary"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          保存更改
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account">
              <Card className="border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle>账号安全</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email (read-only for now) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱地址</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user?.email}
                        disabled
                        className="pl-9 bg-secondary/30 border-border/50"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      如需更改邮箱，请联系客服
                    </p>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label>密码</Label>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <div>
                        <p className="text-sm font-medium">•••••••••••••</p>
                        <p className="text-xs text-muted-foreground">
                          最后修改: {user?.updated_at ? new Date(user.updated_at).toLocaleDateString("zh-CN") : "未知"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        修改密码
                      </Button>
                    </div>
                  </div>

                  {/* Account deletion warning */}
                  <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                    <h3 className="font-medium text-destructive mb-2">删除账号</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      删除账号将永久删除你的所有数据，此操作不可撤销。
                    </p>
                    <Button variant="destructive" size="sm">
                      删除账号
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle>通知设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">邮件通知</h3>
                      <p className="text-sm text-muted-foreground">
                        接收新文章、评论、点赞等邮件通知
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">推送通知</h3>
                      <p className="text-sm text-muted-foreground">
                        接收浏览器推送通知
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveNotifications}
                      disabled={saving}
                      className="gradient-primary"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          保存更改
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle>偏好设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>语言</Label>
                    <Select defaultValue="zh-CN">
                      <SelectTrigger className="bg-secondary/30 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zh-CN">简体中文</SelectItem>
                        <SelectItem value="en-US">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>时区</Label>
                    <Select defaultValue="Asia/Shanghai">
                      <SelectTrigger className="bg-secondary/30 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Shanghai">中国标准时间 (UTC+8)</SelectItem>
                        <SelectItem value="America/New_York">美东时间 (UTC-5)</SelectItem>
                        <SelectItem value="Europe/London">格林威治时间 (UTC+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>
              请输入当前密码和新密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-secondary/30 border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-secondary/30 border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary/30 border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  修改中...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  确认修改
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
