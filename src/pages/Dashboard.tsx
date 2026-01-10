import { useState, useCallback, useEffect } from "react";
import { Transaction } from "@/lib/api";
import WalletSelector from "@/components/WalletSelector";
import TransactionList from "@/components/TransactionList";
import TransactionDialog from "@/components/TransactionDialog";
import BottomNav from "@/components/BottomNav";
import SettingsPanel from "@/components/SettingsPanel";
import { useApp } from "@/hooks/useApp";
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

type Tab = "transactions" | "settings";

export default function Dashboard() {
  const { refreshWallets } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Handle back button for exit confirmation
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Only show exit confirm if no dialog is open
      if (!showTransactionDialog) {
        e.preventDefault();
        setShowExitConfirm(true);
        // Push state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Push initial state
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [showTransactionDialog]);

  const handleTransactionClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionDialog(true);
  };

  const handleAddClick = () => {
    setEditingTransaction(null);
    setShowTransactionDialog(true);
  };

  const handleTransactionSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    refreshWallets();
  }, [refreshWallets]);

  const handleExitApp = () => {
    // Close the PWA or navigate away
    window.history.go(-(window.history.length - 1));
    window.close();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "transactions":
        return <TransactionList onTransactionClick={handleTransactionClick} refreshTrigger={refreshTrigger} />;
      case "settings":
        return <SettingsPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
        <div className="flex items-center justify-center px-4 py-3">
          <WalletSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 overflow-hidden">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onAddClick={handleAddClick} />

      {/* Transaction Dialog */}
      <TransactionDialog
        open={showTransactionDialog}
        onClose={() => {
          setShowTransactionDialog(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSuccess={handleTransactionSuccess}
      />

      {/* Exit Confirmation */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit App?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit the app?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExitApp}>
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
