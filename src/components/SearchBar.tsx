import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useNavigate, useSearchParams } from "react-router-dom";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

const SearchBar = ({
  className,
  placeholder = "搜索文章、标签、作者...",
  onSearch,
}: SearchBarProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [localQuery, setLocalQuery] = useState(searchParams.get("q") || "");
  const debouncedQuery = useDebounce(localQuery, 500);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedQuery);
    } else if (debouncedQuery) {
      navigate(`/articles?q=${encodeURIComponent(debouncedQuery)}`);
    }
  }, [debouncedQuery, navigate, onSearch]);

  const handleClear = () => {
    setLocalQuery("");
    navigate("/articles");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      if (onSearch) {
        onSearch(localQuery.trim());
      } else {
        navigate(`/articles?q=${encodeURIComponent(localQuery.trim())}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-10 bg-secondary/50 border-border focus:border-primary/50"
        />
        {localQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
