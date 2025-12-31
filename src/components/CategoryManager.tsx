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
import { Plus, Pencil, Trash2, Loader2, ChevronRight, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = ["💵", "💸", "🛒", "🍽️", "🚗", "🏠", "💊", "🎬", "✈️", "📚", "💼", "🎁", "📊", "💎", "🏋️"];

interface CategoryItemProps {
  node: CategoryTreeNode;
  level: number;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: number) => void;
  onAddChild: (parent: Category) => void;
}

function CategoryItem({ node, level, onEdit, onDelete, onAddChild }: CategoryItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl bg-card shadow-card mb-2 group",
          level > 0 && "ml-6"
        )}
      >
        {hasChildren && (
          <button onClick={() => setExpanded(!expanded)} className="p-1">
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                expanded && "rotate-90"
              )}
            />
          </button>
        )}
        
        <span className="text-2xl">{node.category.icon}</span>
        <div className="flex-1">
          <p className="font-medium">{node.category.name}</p>
          <div className="flex gap-2 text-xs text-muted-foreground">
            {node.category.is_global && <span>Global</span>}
            {node.category.parent_id && <span>Subcategory</span>}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {level === 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddChild(node.category)}
              title="Add subcategory"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(node.category)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(node.category.category_id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <CategoryItem
              key={child.category.category_id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
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

  // Get flat list of root categories for parent selector (exclude current category when editing)
  const rootCategories = useMemo(() => {
    return tree
      .map((node) => node.category)
      .filter((cat) => !editingCategory || cat.category_id !== editingCategory.category_id);
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

  // Find current parent name for display
  const currentParentName = useMemo(() => {
    if (!formData.parent_id) return null;
    const parent = rootCategories.find((c) => c.category_id === formData.parent_id);
    return parent ? `${parent.icon} ${parent.name}` : null;
  }, [formData.parent_id, rootCategories]);

  if (!selectedWallet) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Select a wallet first
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categories</h2>
        <Button size="sm" onClick={() => openNewCategory()}>
          <Plus className="h-4 w-4 mr-1" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tree.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No categories yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tree.map((node) => (
            <CategoryItem
              key={node.category.category_id}
              node={node}
              level={0}
              onEdit={openEditCategory}
              onDelete={setDeleteId}
              onAddChild={openNewCategory}
            />
          ))}
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all",
                      formData.icon === icon
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
                required
              />
            </div>

            {/* Parent Category Selector - always show */}
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={formData.parent_id?.toString() || "none"}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    parent_id: value === "none" ? null : parseInt(value),
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category">
                    {formData.parent_id ? currentParentName : "No parent (root category)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root category)</SelectItem>
                  {rootCategories.map((cat) => (
                    <SelectItem key={cat.category_id} value={cat.category_id.toString()}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {editingCategory 
                  ? "Change the parent to move this category" 
                  : "Leave empty for a root category, or select a parent"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Global Category</Label>
                <p className="text-xs text-muted-foreground">
                  Sync to all wallets
                </p>
              </div>
              <Switch
                checked={formData.is_global}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_global: checked })
                }
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingCategory ? (
                  "Save Changes"
                ) : (
                  "Create Category"
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
