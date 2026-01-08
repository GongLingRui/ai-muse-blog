import { useState } from "react";
import { Comment } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { MessageCircle, MoreHorizontal, Trash2, Reply } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks";
import { useDeleteComment } from "@/services/queries";
import CommentForm from "./CommentForm";

interface CommentSectionProps {
  articleId: string;
  comments: Comment[];
  isLoading: boolean;
}

const CommentSection = ({ articleId, comments, isLoading }: CommentSectionProps) => {
  const { user } = useAuth();
  const deleteCommentMutation = useDeleteComment();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());

  const handleDeleteComment = async (commentId: string) => {
    if (confirm("确定要删除这条评论吗？")) {
      await deleteCommentMutation.mutateAsync(commentId);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyTo(commentId);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const toggleReplies = (commentId: string) => {
    setCollapsedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isCollapsed = collapsedReplies.has(comment.id);
    const isAuthor = user?.id === comment.author_id;
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <div
        key={comment.id}
        className={`${isReply ? "ml-12 mt-3" : "mt-4"}`}
      >
        <Card className="border-border bg-card">
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {comment.author?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm text-foreground">
                    {comment.author?.full_name || comment.author?.email || "匿名用户"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleReply(comment.id)}>
                    <Reply className="h-4 w-4 mr-2" />
                    回复
                  </DropdownMenuItem>
                  {isAuthor && (
                    <DropdownMenuItem
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            <div className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                {hasReplies && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="hover:text-foreground transition-colors flex items-center space-x-1"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{comment.replies?.length || 0} 条回复</span>
                  </button>
                )}
              </div>
            </div>

            {/* Reply Form */}
            {replyTo === comment.id && (
              <div className="mt-3 pt-3 border-t border-border">
                <CommentForm
                  articleId={articleId}
                  parentId={comment.id}
                  onSuccess={handleCancelReply}
                  onCancel={handleCancelReply}
                  placeholder={`回复 @${comment.author?.full_name || comment.author?.email}...`}
                  showAvatar={false}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Replies */}
        {hasReplies && !isCollapsed && (
          <div className="space-y-2 mt-2">
            {comment.replies?.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground mb-2">暂无评论</p>
        <p className="text-sm text-muted-foreground/70">快来发表第一条评论吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => renderComment(comment))}
    </div>
  );
};

export default CommentSection;
