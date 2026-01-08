import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
}

const TagFilter = ({ tags, selectedTags, onTagSelect }: TagFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer transition-all duration-200 hover:scale-105",
          selectedTags.length === 0
            ? "bg-primary text-primary-foreground border-primary shadow-card"
            : "bg-secondary text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
        )}
        onClick={() => onTagSelect("")}
      >
        全部
      </Badge>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className={cn(
            "cursor-pointer transition-all duration-200 hover:scale-105",
            selectedTags.includes(tag)
              ? "bg-primary text-primary-foreground border-primary shadow-card"
              : "bg-secondary text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
          )}
          onClick={() => onTagSelect(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export default TagFilter;
