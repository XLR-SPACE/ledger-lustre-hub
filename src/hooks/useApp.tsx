import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  checkInitStatus,
  getWallets,
  getUsers,
  Wallet,
  User,
  InitStatus,
} from "@/lib/api";

interface AppContextType {
  initStatus: InitStatus | null;
  isLoading: boolean;
  wallets: Wallet[];
  users: User[];
  selectedWallet: Wallet | null;
  selectedUser: User | null;
  setSelectedWallet: (wallet: Wallet | null) => void;
  setSelectedUser: (user: User | null) => void;
  refreshWallets: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshInitStatus: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [initStatus, setInitStatus] = useState<InitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const refreshInitStatus = async (): Promise<void> => {
    try {
      const status = await checkInitStatus();
      setInitStatus(status);
    } catch (error) {
      console.error("Failed to check init status:", error);
      throw error;
    }
  };

  const refreshWallets = async () => {
    try {
      const response = await getWallets();
      if (response.success) {
        setWallets(response.data || []);
        if (!selectedWallet && response.data?.length > 0) {
          setSelectedWallet(response.data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch wallets:", error);
    }
  };

  const refreshUsers = async () => {
    try {
      const response = await getUsers();
      if (response.success) {
        setUsers(response.data || []);
        if (!selectedUser && response.data?.length > 0) {
          setSelectedUser(response.data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const status = await checkInitStatus();
        setInitStatus(status);
        if (status.init_done) {
          await Promise.all([refreshWallets(), refreshUsers()]);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return (
    <AppContext.Provider
      value={{
        initStatus,
        isLoading,
        wallets,
        users,
        selectedWallet,
        selectedUser,
        setSelectedWallet,
        setSelectedUser,
        refreshWallets,
        refreshUsers,
        refreshInitStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
