import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, PenSquare, Home, Info, LogIn, LogOut, Search, Sun, Moon, FileText, BookOpen, Tag, Settings, Bell, Bookmark, User, BookMarked, BarChart3, Clock, Users, Sparkles, Library, GitCompare, HelpCircle, GraduationCap, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const Navbar = ({ searchQuery = "", onSearchChange }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "首页", icon: Home },
    { to: "/papers", label: "论文库", icon: Library },
    { to: "/daily", label: "每日更新", icon: Sparkles },
    { to: "/ai-qa", label: "AI助手", icon: HelpCircle },
    { to: "/comparison", label: "论文对比", icon: GitCompare },
    { to: "/daily-digest", label: "团队Digest", icon: Users },
    { to: "/articles", label: "最新文章", icon: FileText },
    { to: "/classic-papers", label: "经典论文", icon: BookOpen },
    { to: "/terminology", label: "术语库", icon: GraduationCap },
    { to: "/tags", label: "标签", icon: Tag },
    { to: "/write", label: "写文章", icon: PenSquare },
    { to: "/about", label: "关于", icon: Info },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-card">
              <span className="text-lg font-bold text-white">AI</span>
            </div>
            <span className="hidden sm:block text-xl font-bold text-gradient">AI Learning Hub</span>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive(link.to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Search & User - Right */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            {onSearchChange && (
              <div className="hidden sm:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 w-[180px] lg:w-[240px] bg-secondary/50 border-border focus:border-primary/50 h-9"
                />
              </div>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* User Avatar / Login */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">
                      {user?.username || "用户"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/write" className="cursor-pointer">
                      <PenSquare className="h-4 w-4 mr-2" />
                      写文章
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/bookmarks" className="cursor-pointer">
                      <Bookmark className="h-4 w-4 mr-2" />
                      我的收藏
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="cursor-pointer">
                      <Bell className="h-4 w-4 mr-2" />
                      通知中心
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/reading-list" className="cursor-pointer">
                      <BookMarked className="h-4 w-4 mr-2" />
                      阅读列表
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/reading-stats" className="cursor-pointer">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      阅读统计
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/search-history" className="cursor-pointer">
                      <Clock className="h-4 w-4 mr-2" />
                      搜索历史
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/study-groups" className="cursor-pointer">
                      <Users className="h-4 w-4 mr-2" />
                      学习小组
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      设置
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button
                  size="sm"
                  className="gradient-primary text-white hover:opacity-90 shadow-card"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  登录
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            {/* Mobile Search */}
            {onSearchChange && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 bg-secondary/50 border-border"
                />
              </div>
            )}

            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(link.to)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="pt-4 border-t border-border">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button className="w-full gradient-primary text-white">
                      <LogIn className="h-4 w-4 mr-2" />
                      登录
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
