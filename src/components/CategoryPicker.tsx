import { useState, useEffect, useMemo } from "react";
import { getCategoryTree, CategoryTreeNode, Category } from "@/lib/api";
import { useApp } from "@/hooks/useApp";
import { getCachedCategories, setCachedCategories } from "@/hooks/useCache";
import { cn } from "@/lib/utils";
import { ChevronRight, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CategoryPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (category: Category) => void;
  selectedCategoryId?: number;
}

function CategoryNode({
  node,
  level,
  selectedId,
  onSelect,
  searchQuery,
  forceExpanded,
  parentMatches,
}: {
  node: CategoryTreeNode;
  level: number;
  selectedId?: number;
  onSelect: (category: Category) => void;
  searchQuery: string;
  forceExpanded?: boolean;
  parentMatches?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.category.category_id === selectedId;

  // Check if this node matches the search
  const thisNodeMatches = node.category.name.toLowerCase().includes(searchQuery.toLowerCase());

  // Check if any descendant matches the search
  const descendantMatches = (n: CategoryTreeNode): boolean => {
    if (n.children) {
      return n.children.some(child => 
        child.category.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        descendantMatches(child)
      );
    }
    return false;
  };

  // This node should show if:
  // 1. No search query
  // 2. This node matches
  // 3. Any descendant matches
  // 4. Parent matched (show all children of matching parents)
  const shouldShow = !searchQuery || thisNodeMatches || descendantMatches(node) || parentMatches;

  if (!shouldShow) {
    return null;
  }

  // Show children if:
  // 1. Manually expanded
  // 2. Force expanded from parent
  // 3. This node matches search (show all its children)
  // 4. Any descendant matches (to show path to match)
  const shouldShowChildren = expanded || forceExpanded || (searchQuery && (thisNodeMatches || descendantMatches(node)));

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-all",
          isSelected
            ? "bg-primary/10 border border-primary"
            : "hover:bg-muted active:bg-muted/80"
        )}
        style={{ marginLeft: `${level * 12}px` }}
      >
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 -ml-0.5"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 text-muted-foreground transition-transform",
                shouldShowChildren && "rotate-90"
              )}
            />
          </button>
        )}
        <div
          className="flex items-center gap-1.5 flex-1"
          onClick={() => onSelect(node.category)}
        >
          <span className="text-sm">{node.category.icon}</span>
          <span className={cn("flex-1 text-xs font-medium", isSelected && "text-primary")}>
            {node.category.name}
          </span>
        </div>
      </div>
      
      {hasChildren && shouldShowChildren && (
        <div className="space-y-0.5">
          {node.children!.map((child) => (
            <CategoryNode
              key={child.category.category_id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              searchQuery={searchQuery}
              forceExpanded={forceExpanded}
              parentMatches={thisNodeMatches && !!searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryPicker({
  open,
  onClose,
  onSelect,
  selectedCategoryId,
}: CategoryPickerProps) {
  const { selectedWallet } = useApp();
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTree = async () => {
      if (!selectedWallet || !open) return;
      
      // Try cache first
      const cached = getCachedCategories<CategoryTreeNode[]>(selectedWallet.wallet_id);
      if (cached) {
        setTree(cached);
      }
      
      setIsLoading(!cached);
      try {
        const response = await getCategoryTree(selectedWallet.wallet_id);
        if (response.success) {
          const roots = response.data?.roots || [];
          setTree(roots);
          setCachedCategories(selectedWallet.wallet_id, roots);
        }
      } catch (error) {
        console.error("Failed to fetch category tree:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTree();
  }, [selectedWallet, open]);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs max-h-[65vh] overflow-hidden flex flex-col top-[3%] translate-y-0 p-3">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-sm">Select Category</DialogTitle>
        </DialogHeader>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : tree.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-xs">
              No categories found
            </p>
          ) : (
            <div className="space-y-0.5">
              {tree.map((node) => (
                <CategoryNode
                  key={node.category.category_id}
                  node={node}
                  level={0}
                  selectedId={selectedCategoryId}
                  onSelect={(cat) => {
                    onSelect(cat);
                    onClose();
                  }}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
