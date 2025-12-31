import { cn } from "@/lib/utils";
import { LayoutList, FolderTree, Wallet, Settings, Plus } from "lucide-react";

type Tab = "transactions" | "categories" | "wallets" | "settings";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onAddClick: () => void;
}

const navItems: { id: Tab; icon: React.ComponentType<any>; label: string }[] = [
  { id: "transactions", icon: LayoutList, label: "Transactions" },
  { id: "categories", icon: FolderTree, label: "Categories" },
  { id: "wallets", icon: Wallet, label: "Wallets" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function BottomNav({ activeTab, onTabChange, onAddClick }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border safe-area-inset-bottom z-50">
      <nav className="flex items-center justify-around max-w-lg mx-auto h-16 relative">
        {navItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
              activeTab === item.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}

        {/* FAB */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={onAddClick}
            className="absolute -top-5 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center text-primary-foreground hover:shadow-xl transition-shadow active:scale-95"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>

        {navItems.slice(2).map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
              activeTab === item.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
