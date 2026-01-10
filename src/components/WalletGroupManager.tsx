import { useState, useEffect } from "react";
import { Wallet } from "@/lib/api";
import { useApp } from "@/hooks/useApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// Wallet Group storage in localStorage
const WALLET_GROUPS_KEY = "wallet_groups_v1";

export interface WalletGroup {
  id: string;
  name: string;
  icon: string;
  walletIds: number[];
}

function getWalletGroups(): WalletGroup[] {
  try {
    const stored = localStorage.getItem(WALLET_GROUPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWalletGroups(groups: WalletGroup[]): void {
  localStorage.setItem(WALLET_GROUPS_KEY, JSON.stringify(groups));
}

const GROUP_ICONS = ["📁", "💼", "🏠", "🚗", "✈️", "🎯", "📊", "💳", "🛒", "🎮"];

export default function WalletGroupManager() {
  const { wallets } = useApp();
  const { toast } = useToast();
  const [groups, setGroups] = useState<WalletGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WalletGroup | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    icon: "📁",
    walletIds: [] as number[],
  });

  useEffect(() => {
    setGroups(getWalletGroups());
  }, []);

  const openNewGroup = () => {
    setEditingGroup(null);
    setFormData({ name: "", icon: "📁", walletIds: [] });
    setIsDialogOpen(true);
  };

  const openEditGroup = (group: WalletGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      icon: group.icon,
      walletIds: group.walletIds,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let updatedGroups: WalletGroup[];

      if (editingGroup) {
        updatedGroups = groups.map((g) =>
          g.id === editingGroup.id
            ? { ...g, name: formData.name, icon: formData.icon, walletIds: formData.walletIds }
            : g
        );
        toast({ title: "Wallet group updated" });
      } else {
        const newGroup: WalletGroup = {
          id: Date.now().toString(),
          name: formData.name,
          icon: formData.icon,
          walletIds: formData.walletIds,
        };
        updatedGroups = [...groups, newGroup];
        toast({ title: "Wallet group created" });
      }

      setGroups(updatedGroups);
      saveWalletGroups(updatedGroups);
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
    if (!deleteGroupId) return;
    setIsSubmitting(true);

    try {
      const updatedGroups = groups.filter((g) => g.id !== deleteGroupId);
      setGroups(updatedGroups);
      saveWalletGroups(updatedGroups);
      toast({ title: "Wallet group deleted" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setDeleteGroupId(null);
    }
  };

  const toggleWallet = (walletId: number) => {
    setFormData((prev) => ({
      ...prev,
      walletIds: prev.walletIds.includes(walletId)
        ? prev.walletIds.filter((id) => id !== walletId)
        : [...prev.walletIds, walletId],
    }));
  };

  const getGroupWallets = (group: WalletGroup): Wallet[] => {
    return wallets.filter((w) => group.walletIds.includes(w.wallet_id));
  };

  const getGroupBalance = (group: WalletGroup): number => {
    return getGroupWallets(group).reduce((sum, w) => sum + w.balance, 0);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={openNewGroup}>
          <Plus className="h-4 w-4 mr-1" />
          Add Group
        </Button>
      </div>

      <div className="space-y-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg transition-all"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-xl">
              {group.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{group.name}</p>
              <p className="text-xs text-muted-foreground">
                {group.walletIds.length} wallet{group.walletIds.length !== 1 ? "s" : ""} • {getGroupBalance(group).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEditGroup(group)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDeleteGroupId(group.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center gap-2">
            <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
            <p>No wallet groups yet</p>
          </div>
        )}
      </div>

      {/* Group Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingGroup ? "Edit Wallet Group" : "New Wallet Group"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Icon</Label>
              <div className="flex flex-wrap gap-1.5">
                {GROUP_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      "w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all",
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
                placeholder="My Group"
                className="h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Select Wallets</Label>
              <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2">
                {wallets.map((wallet) => (
                  <div
                    key={wallet.wallet_id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                    onClick={() => toggleWallet(wallet.wallet_id)}
                  >
                    <Checkbox
                      checked={formData.walletIds.includes(wallet.wallet_id)}
                      onCheckedChange={() => toggleWallet(wallet.wallet_id)}
                    />
                    <span className="text-sm">{wallet.icon}</span>
                    <span className="text-sm flex-1">{wallet.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingGroup ? (
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
      <AlertDialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wallet Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the group. Wallets will not be deleted.
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

// Export for use in WalletSelector
export { getWalletGroups, type WalletGroup };
