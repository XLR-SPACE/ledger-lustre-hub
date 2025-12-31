import { useState, useEffect } from "react";
import { getCategoryTree, CategoryTreeNode, Category } from "@/lib/api";
import { useApp } from "@/hooks/useApp";
import { cn } from "@/lib/utils";
import { ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}: {
  node: CategoryTreeNode;
  level: number;
  selectedId?: number;
  onSelect: (category: Category) => void;
}) {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.category.category_id === selectedId;

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren && level === 0) {
            setExpanded(!expanded);
          } else {
            onSelect(node.category);
          }
        }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
          isSelected
            ? "bg-primary/10 border-2 border-primary"
            : "hover:bg-muted active:bg-muted/80",
          level > 0 && "ml-6"
        )}
      >
        <span className="text-2xl">{node.category.icon}</span>
        <span className={cn("flex-1 font-medium", isSelected && "text-primary")}>
          {node.category.name}
        </span>
        {hasChildren && level === 0 && (
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        )}
      </div>
      
      {hasChildren && expanded && (
        <div className="mt-1 space-y-1">
          {node.children!.map((child) => (
            <CategoryNode
              key={child.category.category_id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Category</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tree.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No categories found
            </p>
          ) : (
            <div className="space-y-2">
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
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
