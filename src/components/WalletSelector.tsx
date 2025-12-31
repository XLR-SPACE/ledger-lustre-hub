import { useApp } from "@/hooks/useApp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet } from "lucide-react";

export default function WalletSelector() {
  const { wallets, selectedWallet, setSelectedWallet } = useApp();

  if (!wallets.length) return null;

  return (
    <Select
      value={selectedWallet?.wallet_id?.toString() || ""}
      onValueChange={(value) => {
        const wallet = wallets.find((w) => w.wallet_id.toString() === value);
        if (wallet) setSelectedWallet(wallet);
      }}
    >
      <SelectTrigger className="w-auto min-w-[140px] h-9 bg-card border-border/50 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedWallet?.icon || "💰"}</span>
          <SelectValue placeholder="Select wallet" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {wallets.map((wallet) => (
          <SelectItem key={wallet.wallet_id} value={wallet.wallet_id.toString()}>
            <div className="flex items-center gap-2">
              <span>{wallet.icon}</span>
              <span>{wallet.name}</span>
              <span className="ml-2 text-muted-foreground text-xs">
                ${wallet.balance.toLocaleString()}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
