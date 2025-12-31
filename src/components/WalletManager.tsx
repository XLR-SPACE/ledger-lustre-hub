import { useState } from "react";
import { Wallet, createWallet, updateWallet, deleteWallet } from "@/lib/api";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WALLET_ICONS = ["💰", "💵", "💳", "🏦", "💎", "🪙", "📊", "🎯", "🏠", "🚗"];

export default function WalletManager() {
  const { wallets, selectedWallet, setSelectedWallet, refreshWallets } = useApp();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deleteWalletId, setDeleteWalletId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    icon: "💰",
    balance: "0",
    is_enabled: true,
  });

  const openNewWallet = () => {
    setEditingWallet(null);
    setFormData({ name: "", icon: "💰", balance: "0", is_enabled: true });
    setIsDialogOpen(true);
  };

  const openEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      icon: wallet.icon,
      balance: wallet.balance.toString(),
      is_enabled: wallet.is_enabled,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const balance = parseFloat(formData.balance) || 0;

      if (editingWallet) {
        await updateWallet(editingWallet.wallet_id, {
          name: formData.name,
          icon: formData.icon,
          balance,
          is_enabled: formData.is_enabled,
        });
        toast({ title: "Wallet updated" });
      } else {
        await createWallet({
          name: formData.name,
          icon: formData.icon,
          balance,
          is_enabled: formData.is_enabled,
        });
        toast({ title: "Wallet created" });
      }

      await refreshWallets();
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
    if (!deleteWalletId) return;
    setIsSubmitting(true);

    try {
      await deleteWallet(deleteWalletId);
      toast({ title: "Wallet deleted" });
      await refreshWallets();
      if (selectedWallet?.wallet_id === deleteWalletId) {
        setSelectedWallet(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setDeleteWalletId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Wallets</h2>
        <Button size="sm" onClick={openNewWallet}>
          <Plus className="h-4 w-4 mr-1" />
          Add Wallet
        </Button>
      </div>

      <div className="space-y-2">
        {wallets.map((wallet) => (
          <div
            key={wallet.wallet_id}
            className={cn(
              "flex items-center gap-3 p-4 bg-card rounded-xl shadow-card transition-all",
              selectedWallet?.wallet_id === wallet.wallet_id &&
                "ring-2 ring-primary"
            )}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-2xl">
              {wallet.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium">{wallet.name}</p>
              <p className="text-lg font-bold text-primary">
                ${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditWallet(wallet)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteWalletId(wallet.wallet_id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        {wallets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No wallets yet. Create your first wallet!
          </div>
        )}
      </div>

      {/* Wallet Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWallet ? "Edit Wallet" : "New Wallet"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {WALLET_ICONS.map((icon) => (
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
                placeholder="My Wallet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Initial Balance</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_enabled: checked })
                }
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingWallet ? (
                  "Save Changes"
                ) : (
                  "Create Wallet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteWalletId} onOpenChange={() => setDeleteWalletId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wallet?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the wallet and all associated transactions. This action cannot be undone.
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
