import { useState, useEffect } from "react";
import { useApp } from "@/hooks/useApp";
import { getWalletGroups, WalletGroup } from "./WalletGroupManager";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function WalletSelector() {
  const { wallets, selectedWallet, setSelectedWallet } = useApp();
  const [groups, setGroups] = useState<WalletGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    setGroups(getWalletGroups());
  }, []);

  if (!wallets.length) return null;

  const handleValueChange = (value: string) => {
    // Check if it's a group selection
    if (value.startsWith("group_")) {
      const groupId = value.replace("group_", "");
      setSelectedGroupId(groupId);
      // When selecting a group, select the first wallet in that group
      const group = groups.find((g) => g.id === groupId);
      if (group && group.walletIds.length > 0) {
        const firstWallet = wallets.find((w) => group.walletIds.includes(w.wallet_id));
        if (firstWallet) setSelectedWallet(firstWallet);
      }
    } else {
      // Regular wallet selection
      setSelectedGroupId(null);
      const wallet = wallets.find((w) => w.wallet_id.toString() === value);
      if (wallet) setSelectedWallet(wallet);
    }
  };

  const currentValue = selectedGroupId
    ? `group_${selectedGroupId}`
    : selectedWallet?.wallet_id?.toString() || "";

  const getDisplayValue = () => {
    if (selectedGroupId) {
      const group = groups.find((g) => g.id === selectedGroupId);
      if (group) {
        const totalBalance = wallets
          .filter((w) => group.walletIds.includes(w.wallet_id))
          .reduce((sum, w) => sum + w.balance, 0);
        return (
          <div className="flex items-center gap-2">
            <span>{group.icon}</span>
            <span>{group.name}</span>
            <span className="ml-2 text-muted-foreground text-xs">
              {totalBalance.toLocaleString()}
            </span>
          </div>
        );
      }
    }
    if (selectedWallet) {
      return (
        <div className="flex items-center gap-2">
          <span>{selectedWallet.icon}</span>
          <span>{selectedWallet.name}</span>
          <span className="ml-2 text-muted-foreground text-xs">
            {selectedWallet.balance.toLocaleString()}
          </span>
        </div>
      );
    }
    return "Select wallet";
  };

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-auto min-w-[140px] h-9 bg-card border-border/50 shadow-sm">
        <SelectValue>{getDisplayValue()}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Wallet Groups */}
        {groups.length > 0 && (
          <>
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground">Wallet Groups</SelectLabel>
              {groups.map((group) => {
                const totalBalance = wallets
                  .filter((w) => group.walletIds.includes(w.wallet_id))
                  .reduce((sum, w) => sum + w.balance, 0);
                return (
                  <SelectItem key={`group_${group.id}`} value={`group_${group.id}`}>
                    <div className="flex items-center gap-2">
                      <span>{group.icon}</span>
                      <span>{group.name}</span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        {totalBalance.toLocaleString()}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
            <Separator className="my-1" />
          </>
        )}

        {/* Individual Wallets */}
        <SelectGroup>
          <SelectLabel className="text-xs text-muted-foreground">Wallets</SelectLabel>
          {wallets.map((wallet) => (
            <SelectItem key={wallet.wallet_id} value={wallet.wallet_id.toString()}>
              <div className="flex items-center gap-2">
                <span>{wallet.icon}</span>
                <span>{wallet.name}</span>
                <span className="ml-2 text-muted-foreground text-xs">
                  {wallet.balance.toLocaleString()}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
