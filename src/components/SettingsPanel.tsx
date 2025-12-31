import { useApp } from "@/hooks/useApp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User, Smartphone, Info } from "lucide-react";

export default function SettingsPanel() {
  const { users, selectedUser, setSelectedUser, selectedWallet } = useApp();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Settings</h2>

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
