import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User, Smartphone, Info, Wallet, FolderTree, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import WalletManager from "./WalletManager";
import CategoryManager from "./CategoryManager";

type SettingsSection = "wallets" | "categories" | null;

export default function SettingsPanel() {
  const { users, selectedUser, setSelectedUser, selectedWallet } = useApp();
  const [openSection, setOpenSection] = useState<SettingsSection>(null);

  const toggleSection = (section: SettingsSection) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="space-y-3 pb-20 overflow-y-auto max-h-[calc(100vh-160px)]">
      <h2 className="text-lg font-semibold">Settings</h2>

      {/* Wallets Section */}
      <Collapsible open={openSection === "wallets"} onOpenChange={() => toggleSection("wallets")}>
        <Card className="shadow-card">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Wallets
                </div>
                <ChevronRight className={cn("h-4 w-4 transition-transform", openSection === "wallets" && "rotate-90")} />
              </CardTitle>
              <CardDescription className="text-left">Manage your wallets</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <WalletManager />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Categories Section */}
      <Collapsible open={openSection === "categories"} onOpenChange={() => toggleSection("categories")}>
        <Card className="shadow-card">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-primary" />
                  Categories
                </div>
                <ChevronRight className={cn("h-4 w-4 transition-transform", openSection === "categories" && "rotate-90")} />
              </CardTitle>
              <CardDescription className="text-left">Manage expense and income categories</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <CategoryManager />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* User Selection */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Active User
          </CardTitle>
          <CardDescription>Select which user to use for transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedUser?.user_id?.toString() || ""}
            onValueChange={(value) => {
              const user = users.find((u) => u.user_id.toString() === value);
              if (user) setSelectedUser(user);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id.toString()}>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            Install App
          </CardTitle>
          <CardDescription>Add to home screen for the best experience</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>On iOS: Tap Share → "Add to Home Screen"</p>
          <p>On Android: Tap menu → "Add to Home Screen"</p>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Current Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">User:</span>
            <span className="font-medium">{selectedUser?.name || "None"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Wallet:</span>
            <span className="font-medium">{selectedWallet?.name || "None"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-medium text-primary">
              ${selectedWallet?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
