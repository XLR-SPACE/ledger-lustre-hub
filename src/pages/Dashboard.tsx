import { useState, useCallback } from "react";
import { Transaction } from "@/lib/api";
import WalletSelector from "@/components/WalletSelector";
import TransactionList from "@/components/TransactionList";
import TransactionDialog from "@/components/TransactionDialog";
import BottomNav from "@/components/BottomNav";
import WalletManager from "@/components/WalletManager";
import CategoryManager from "@/components/CategoryManager";
import SettingsPanel from "@/components/SettingsPanel";
import { useApp } from "@/hooks/useApp";
type Tab = "transactions" | "categories" | "wallets" | "settings";
export default function Dashboard() {
  const {
    selectedWallet,
    refreshWallets
  } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
  const renderContent = () => {
    switch (activeTab) {
      case "transactions":
        return <TransactionList onTransactionClick={handleTransactionClick} refreshTrigger={refreshTrigger} />;
      case "categories":
        return <CategoryManager />;
      case "wallets":
        return <WalletManager />;
      case "settings":
        return <SettingsPanel />;
    }
  };
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">MoneyLover</h1>
          </div>
          <WalletSelector />
        </div>

        {/* Balance Display */}
        {activeTab === "transactions" && selectedWallet && <div className="px-4 pb-3">
            
          </div>}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 overflow-hidden">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onAddClick={handleAddClick} />

      {/* Transaction Dialog */}
      <TransactionDialog open={showTransactionDialog} onClose={() => {
      setShowTransactionDialog(false);
      setEditingTransaction(null);
    }} transaction={editingTransaction} onSuccess={handleTransactionSuccess} />
    </div>;
}