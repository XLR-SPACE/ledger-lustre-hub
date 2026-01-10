import { useState, useEffect, useRef, useCallback } from "react";
import { Transaction, Category, createTransaction, updateTransaction, deleteTransaction } from "@/lib/api";
import { useApp } from "@/hooks/useApp";
import { getLastTransactionTime, setLastTransactionTime, invalidateCategoryCache } from "@/hooks/useCache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import CategoryPicker from "./CategoryPicker";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Tag, Calendar, FileText, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onSuccess: () => void;
}

export default function TransactionDialog({
  open,
  onClose,
  transaction,
  onSuccess,
}: TransactionDialogProps) {
  const { selectedWallet, selectedUser } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    amount: "",
    category: null as Category | null,
    note: "",
    person_name: "",
    transaction_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  const isEditing = !!transaction;

  // Handle back button to close dialog instead of exiting app
  useEffect(() => {
    if (!open) return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      onClose();
      // Push state back so we don't actually navigate
      window.history.pushState(null, "", window.location.href);
    };

    // Push a state when dialog opens
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Math.abs(transaction.amount).toString(),
        category: transaction.category || null,
        note: transaction.note || "",
        person_name: transaction.person?.person_name || "",
        transaction_time: format(new Date(transaction.transaction_time), "yyyy-MM-dd'T'HH:mm"),
      });
    } else {
      // For new transaction, try to use last saved datetime
      const lastTime = getLastTransactionTime();
      setFormData({
        amount: "",
        category: null,
        note: "",
        person_name: "",
        transaction_time: lastTime || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      });
    }
  }, [transaction, open]);

  // Focus amount input when dialog opens
  useEffect(() => {
    if (open && !transaction) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [open, transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !selectedWallet || !selectedUser) {
      toast({
        title: "Missing information",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) {
        throw new Error("Invalid amount");
      }

      // Save the transaction time for next transaction
      setLastTransactionTime(formData.transaction_time);

      if (isEditing && transaction) {
        await updateTransaction(transaction.transaction_id, {
          category_id: formData.category.category_id,
          amount,
          note: formData.note || undefined,
          person_name: formData.person_name || undefined,
          transaction_time: new Date(formData.transaction_time).toISOString(),
        });
        toast({ title: "Transaction updated" });
      } else {
        await createTransaction({
          wallet_id: selectedWallet.wallet_id,
          category_id: formData.category.category_id,
          amount,
          note: formData.note || undefined,
          person_name: formData.person_name || undefined,
          user_id: selectedUser.user_id,
          transaction_time: new Date(formData.transaction_time).toISOString(),
        });
        toast({ title: "Transaction added" });
      }

      // Refresh category cache in background
      invalidateCategoryCache(selectedWallet.wallet_id);

      onSuccess();
      onClose();
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
    if (!transaction || !selectedWallet) return;

    setIsSubmitting(true);
    try {
      await deleteTransaction(transaction.transaction_id);
      toast({ title: "Transaction deleted" });
      
      // Refresh category cache in background
      invalidateCategoryCache(selectedWallet.wallet_id);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto top-[5%] translate-y-0 p-4">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-sm">
              {isEditing ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Amount */}
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                Amount
              </Label>
              <Input
                ref={amountInputRef}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="text-lg font-bold h-10"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Tag className="h-2.5 w-2.5" />
                Category
              </Label>
              <button
                type="button"
                onClick={() => setShowCategoryPicker(true)}
                className={cn(
                  "w-full flex items-center gap-2 p-2 rounded-md border transition-colors text-left text-xs",
                  formData.category
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted"
                )}
              >
                {formData.category ? (
                  <>
                    <span className="text-base">{formData.category.icon}</span>
                    <span className="font-medium">{formData.category.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select category</span>
                )}
              </button>
            </div>

            {/* Date/Time */}
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="h-2.5 w-2.5" />
                Date & Time
              </Label>
              <Input
                type="datetime-local"
                value={formData.transaction_time}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_time: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>

            {/* Note - Moved above Person */}
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <FileText className="h-2.5 w-2.5" />
                Note
              </Label>
              <Input
                placeholder="Add a note..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            {/* Person */}
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <User className="h-2.5 w-2.5" />
                Person/Payee
              </Label>
              <Input
                placeholder="e.g., Grocery Store"
                value={formData.person_name}
                onChange={(e) =>
                  setFormData({ ...formData, person_name: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="flex gap-2 pt-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                className="flex-1 h-9"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEditing ? (
                  "Save"
                ) : (
                  "Add"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CategoryPicker
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={(category) => setFormData({ ...formData, category })}
        selectedCategoryId={formData.category?.category_id}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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
    </>
  );
}
