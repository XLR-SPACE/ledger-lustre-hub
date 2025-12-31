import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initDatabase } from "@/lib/api";
import { useApp } from "@/hooks/useApp";
import { Loader2, Wallet, Shield, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InitSetup() {
  const { refreshInitStatus, refreshWallets, refreshUsers } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    default_wallet_name: "My Wallet",
    admin_username: "",
    admin_password: "",
    admin_email: "",
    admin_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await initDatabase({
        ...formData,
        force_migrate: true,
      });

      if (response.success) {
        toast({
          title: "Setup Complete!",
          description: "Your finance app is ready to use.",
        });
        await refreshInitStatus();
        await Promise.all([refreshWallets(), refreshUsers()]);
      }
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 safe-area-inset-top safe-area-inset-bottom">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* Logo/Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg mb-4">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">MoneyLover</h1>
          <p className="text-muted-foreground">Smart expense tracking made simple</p>
        </div>

        {/* Setup Card */}
        <Card className="shadow-soft border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Initial Setup
            </CardTitle>
            <CardDescription>
              Set up your admin account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin_name">Your Name</Label>
                <Input
                  id="admin_name"
                  name="admin_name"
                  placeholder="John Doe"
                  value={formData.admin_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_username">Username</Label>
                <Input
                  id="admin_username"
                  name="admin_username"
                  placeholder="johndoe"
                  value={formData.admin_username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_email">Email</Label>
                <Input
                  id="admin_email"
                  name="admin_email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.admin_email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_password">Password</Label>
                <Input
                  id="admin_password"
                  name="admin_password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.admin_password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_wallet_name">Default Wallet Name</Label>
                <Input
                  id="default_wallet_name"
                  name="default_wallet_name"
                  placeholder="My Wallet"
                  value={formData.default_wallet_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Your data is stored securely on your server
        </p>
      </div>
    </div>
  );
}
