import { useApp } from "@/hooks/useApp";
import InitSetup from "./InitSetup";
import Dashboard from "./Dashboard";
import { Loader2, Wallet } from "lucide-react";

export default function Index() {
  const { initStatus, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary shadow-lg flex items-center justify-center animate-pulse">
          <Wallet className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!initStatus?.init_done) {
    return <InitSetup />;
  }

  return <Dashboard />;
}
