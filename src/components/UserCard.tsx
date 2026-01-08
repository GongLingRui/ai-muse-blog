import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Link as LinkIcon, Calendar } from "lucide-react";
import { UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import { useFollowUser, useUnfollowUser, useFollowStatus } from "@/services/queries";
import { useAuth } from "@/hooks/useAuth";
import { UserCheck, UserPlus } from "lucide-react";
import { useState } from "react";

interface UserCardProps {
  user: UserProfile;
  className?: string;
}

const UserCard = ({ user, className }: UserCardProps) => {
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === user.id;
  const { data: isFollowing } = useFollowStatus(user.id);
  const followUserMutation = useFollowUser();
  const unfollowUserMutation = useUnfollowUser();

  const [optimisticFollowing, setOptimisticFollowing] = useState(isFollowing || false);

  const handleFollow = async () => {
    if (!currentUser) {
      return;
    }

    setOptimisticFollowing(!optimisticFollowing);

    try {
      if (optimisticFollowing) {
        await unfollowUserMutation.mutateAsync(user.id);
      } else {
        await followUserMutation.mutateAsync(user.id);
      }
    } catch (error) {
      setOptimisticFollowing(!optimisticFollowing);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <Card className={cn("border-border bg-card shadow-card", className)}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <Avatar className="h-24 w-24 border-4 border-primary/10">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          {/* Name & Email */}
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">
              {user.full_name || "用户"}
            </h3>
            {user.email && (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-muted-foreground max-w-xs">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {user.articles_count || 0}
              </div>
              <div className="text-xs text-muted-foreground">文章</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {user.followers_count || 0}
              </div>
              <div className="text-xs text-muted-foreground">粉丝</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {user.following_count || 0}
              </div>
              <div className="text-xs text-muted-foreground">关注</div>
            </div>
          </div>

          {/* Location & Website */}
          {(user.location || user.website) && (
            <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground">
              {user.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-primary transition-colors"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span className="underline">个人网站</span>
                </a>
              )}
            </div>
          )}

          {/* Joined Date */}
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>加入于 {formatDate(user.created_at)}</span>
          </div>
        </div>
      </CardContent>

      {!isOwnProfile && (
        <CardFooter className="justify-center pb-6">
          <Button
            onClick={handleFollow}
            variant={optimisticFollowing ? "outline" : "default"}
            className={cn(
              "min-w-[120px]",
              !optimisticFollowing && "gradient-primary"
            )}
            disabled={followUserMutation.isPending || unfollowUserMutation.isPending}
          >
            {optimisticFollowing ? (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                已关注
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                关注
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default UserCard;
