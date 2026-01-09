import { useState, useEffect, useMemo } from "react";
import { Category, CategoryTreeNode, getCategoryTree, createCategory, updateCategory, deleteCategory } from "@/lib/api";
import { useApp } from "@/hooks/useApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, ChevronRight, FolderTree, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = ["💵", "💸", "🛒", "🍽️", "🚗", "🏠", "💊", "🎬", "✈️", "📚", "💼", "🎁", "📊", "💎", "🏋️"];

interface CategoryItemProps {
  node: CategoryTreeNode;
  level: number;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: number) => void;
  onAddChild: (parent: Category) => void;
  searchQuery: string;
  forceExpanded?: boolean;
}

function CategoryItem({ node, level, onEdit, onDelete, onAddChild, searchQuery, forceExpanded }: CategoryItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  // Check if this node or any children match the search
  const matchesSearch = (n: CategoryTreeNode): boolean => {
    const nameMatches = n.category.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (nameMatches) return true;
    if (n.children) {
      return n.children.some(matchesSearch);
    }
    return false;
  };

  // Check if THIS node directly matches
  const thisNodeMatches = node.category.name.toLowerCase().includes(searchQuery.toLowerCase());

  // If searching and no match, hide this node
  if (searchQuery && !matchesSearch(node)) {
    return null;
  }

  // If searching and this parent matches, show all children
  const shouldShowAllChildren = searchQuery && thisNodeMatches && hasChildren;

  return (
    <div>
      <div
        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 mb-1.5 group"
        style={{ marginLeft: `${level * 20}px` }}
      >
        {hasChildren && (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                (expanded || forceExpanded || shouldShowAllChildren) && "rotate-90"
              )}
            />
          </button>
        )}
        
        <span className="text-lg">{node.category.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{node.category.name}</p>
          <div className="flex gap-1.5 text-[10px] text-muted-foreground">
            {node.category.is_global && <span>Global</span>}
          </div>
        </div>

        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(node.category)}
            title="Add subcategory"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(node.category)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(node.category.category_id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {hasChildren && (expanded || forceExpanded || shouldShowAllChildren) && (
        <div>
          {node.children!.map((child) => (
            <CategoryItem
              key={child.category.category_id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              searchQuery={searchQuery}
              forceExpanded={shouldShowAllChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryManager() {
  const { selectedWallet } = useApp();
  const { toast } = useToast();
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    icon: "📊",
    is_global: false,
    parent_id: null as number | null,
  });

  const fetchTree = async () => {
    if (!selectedWallet) return;
    setIsLoading(true);
    try {
      const response = await getCategoryTree(selectedWallet.wallet_id);
      if (response.success) {
        setTree(response.data?.roots || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [selectedWallet]);

  // Get flat list of ALL categories for parent selector
  const allCategories = useMemo(() => {
    const result: { category: Category; level: number }[] = [];
    
    const flattenTree = (nodes: CategoryTreeNode[], level: number) => {
      nodes.forEach((node) => {
        if (!editingCategory || node.category.category_id !== editingCategory.category_id) {
          result.push({ category: node.category, level });
          if (node.children && node.children.length > 0) {
            flattenTree(node.children, level + 1);
          }
        }
      });
    };
    
    flattenTree(tree, 0);
    return result;
  }, [tree, editingCategory]);

  const openNewCategory = (parent?: Category) => {
    setEditingCategory(null);
    setFormData({
      name: "",
      icon: "📊",
      is_global: false,
      parent_id: parent?.category_id || null,
    });
    setIsDialogOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      is_global: category.is_global,
      parent_id: category.parent_id,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(selectedWallet.wallet_id, editingCategory.category_id, {
          name: formData.name,
          icon: formData.icon,
          is_global: formData.is_global,
          parent_id: formData.parent_id,
        });
        toast({ title: "Category updated" });
      } else {
        await createCategory(selectedWallet.wallet_id, {
          name: formData.name,
          icon: formData.icon,
          parent_id: formData.parent_id,
          is_global: formData.is_global,
        });
        toast({ title: "Category created" });
      }

      await fetchTree();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !selectedWallet) return;
    setIsSubmitting(true);

    try {
      await deleteCategory(selectedWallet.wallet_id, deleteId);
      toast({ title: "Category deleted" });
      await fetchTree();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setDeleteId(null);
    }
  };

  const currentParentName = useMemo(() => {
    if (!formData.parent_id) return null;
    const found = allCategories.find((c) => c.category.category_id === formData.parent_id);
    return found ? `${found.category.icon} ${found.category.name}` : null;
  }, [formData.parent_id, allCategories]);

  if (!selectedWallet) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Select a wallet first
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={() => openNewCategory()}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

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

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : tree.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FolderTree className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No categories yet</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[40vh] overflow-y-auto scrollbar-hide">
          {tree.map((node) => (
            <CategoryItem
              key={node.category.category_id}
              node={node}
              level={0}
              onEdit={openEditCategory}
              onDelete={setDeleteId}
              onAddChild={openNewCategory}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Icon</Label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      "w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all",
                      formData.icon === icon
                        ? "bg-primary text-primary-foreground scale-105"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
                className="h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Parent Category</Label>
              <Select
                value={formData.parent_id?.toString() || "none"}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    parent_id: value === "none" ? null : parseInt(value),
                  });
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select parent">
                    {formData.parent_id ? currentParentName : "No parent"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root)</SelectItem>
                  {allCategories.map(({ category, level }) => (
                    <SelectItem key={category.category_id} value={category.category_id.toString()}>
                      <span style={{ paddingLeft: `${level * 12}px` }}>
                        {category.icon} {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Global Category</Label>
              <Switch
                checked={formData.is_global}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_global: checked })
                }
              />
            </div>

            <DialogFooter>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingCategory ? (
                  "Save"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the category. Transactions using this category may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
