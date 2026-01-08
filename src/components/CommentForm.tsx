import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useCreateComment } from "@/services/queries";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CommentFormProps {
  articleId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  showAvatar?: boolean;
}

const CommentForm = ({
  articleId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = "写下你的评论...",
  showAvatar = true,
}: CommentFormProps) => {
  const { user } = useAuth();
  const createCommentMutation = useCreateComment();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("请先登录");
      return;
    }

    if (!content.trim()) {
      toast.error("请输入评论内容");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCommentMutation.mutateAsync({
        article_id: articleId,
        content: content.trim(),
        parent_id: parentId,
      });

      setContent("");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8 border border-dashed border-border rounded-lg">
        <p className="text-muted-foreground mb-4">登录后发表评论</p>
        <Button asChild>
          <a href="/auth">立即登录</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        {showAvatar && (
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px] resize-none"
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                取消
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {parentId ? "回复" : "发表评论"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
