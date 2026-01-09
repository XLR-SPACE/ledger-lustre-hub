import { useState, useEffect, useMemo } from "react";
import { getCategoryTree, CategoryTreeNode, Category } from "@/lib/api";
import { useApp } from "@/hooks/useApp";
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
}: {
  node: CategoryTreeNode;
  level: number;
  selectedId?: number;
  onSelect: (category: Category) => void;
  searchQuery: string;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.category.category_id === selectedId;

  // Check if this node or any descendant matches the search
  const matchesSearch = (n: CategoryTreeNode): boolean => {
    const nameMatches = n.category.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (nameMatches) return true;
    if (n.children) {
      return n.children.some(matchesSearch);
    }
    return false;
  };

  // Check if THIS node directly matches (for parent that should show children)
  const thisNodeMatches = node.category.name.toLowerCase().includes(searchQuery.toLowerCase());

  // If searching and no match at all, hide this node
  if (searchQuery && !matchesSearch(node)) {
    return null;
  }

  // If searching and this parent node matches, show all its children
  const shouldShowAllChildren = searchQuery && thisNodeMatches && hasChildren;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
          isSelected
            ? "bg-primary/10 border border-primary"
            : "hover:bg-muted active:bg-muted/80"
        )}
        style={{ marginLeft: `${level * 16}px` }}
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
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                (expanded || forceExpanded || shouldShowAllChildren) && "rotate-90"
              )}
            />
          </button>
        )}
        <div
          className="flex items-center gap-2 flex-1"
          onClick={() => onSelect(node.category)}
        >
          <span className="text-lg">{node.category.icon}</span>
          <span className={cn("flex-1 text-sm font-medium", isSelected && "text-primary")}>
            {node.category.name}
          </span>
        </div>
      </div>
      
      {hasChildren && (expanded || forceExpanded || shouldShowAllChildren) && (
        <div className="space-y-0.5">
          {node.children!.map((child) => (
            <CategoryNode
              key={child.category.category_id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              searchQuery={searchQuery}
              forceExpanded={shouldShowAllChildren}
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
      
      setIsLoading(true);
      try {
        const response = await getCategoryTree(selectedWallet.wallet_id);
        if (response.success) {
          setTree(response.data?.roots || []);
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
      <DialogContent className="max-w-sm max-h-[70vh] overflow-hidden flex flex-col top-[5%] translate-y-0">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Select Category</DialogTitle>
        </DialogHeader>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : tree.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
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
