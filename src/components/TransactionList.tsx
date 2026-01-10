import { useState, useEffect, useMemo, useCallback } from "react";
import { Transaction, getWalletTransactions, CategoryTreeNode, getCategoryTree } from "@/lib/api";
import { useApp } from "@/hooks/useApp";
import { getPersistedPeriod, setPersistedPeriod, PeriodType } from "@/hooks/useCache";
import TransactionItem from "./TransactionItem";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, addDays, addWeeks, addMonths, addYears, isToday, isYesterday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, ArrowUpDown, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type SortType = "transaction_time" | "entry_time" | "last_modified_time" | "category";

interface TransactionListProps {
  onTransactionClick?: (transaction: Transaction) => void;
  refreshTrigger?: number;
}

const CACHE_KEY_PREFIX = "transactions_cache_";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: Transaction[];
  timestamp: number;
}

function getCachedTransactions(walletId: number, periodKey: string): Transaction[] | null {
  try {
    const key = `${CACHE_KEY_PREFIX}${walletId}_${periodKey}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      if (Date.now() - entry.timestamp < CACHE_EXPIRY) {
        return entry.data;
      }
    }
  } catch (e) {
    console.error("Cache read error:", e);
  }
  return null;
}

function setCachedTransactions(walletId: number, periodKey: string, data: Transaction[]): void {
  try {
    const key = `${CACHE_KEY_PREFIX}${walletId}_${periodKey}`;
    const entry: CacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.error("Cache write error:", e);
  }
}

// Helper to get friendly date label
function getDateLabel(date: Date, periodType: PeriodType): string {
  if (periodType === "daily") {
    if (isToday(date)) {
      return `Today - ${format(date, "MMM d, yyyy")}`;
    }
    if (isYesterday(date)) {
      return `Yesterday - ${format(date, "MMM d, yyyy")}`;
    }
  }
  return format(date, "EEEE, MMM d, yyyy");
}

export default function TransactionList({ onTransactionClick, refreshTrigger }: TransactionListProps) {
  const { selectedWallet } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  
  // Load persisted period settings
  const persistedPeriod = getPersistedPeriod();
  const [periodType, setPeriodType] = useState<PeriodType>(persistedPeriod.periodType);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sortBy, setSortBy] = useState<SortType>("transaction_time");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
    persistedPeriod.customStartDate ? new Date(persistedPeriod.customStartDate) : undefined
  );
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(
    persistedPeriod.customEndDate ? new Date(persistedPeriod.customEndDate) : undefined
  );
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Persist period selection changes
  useEffect(() => {
    setPersistedPeriod({
      periodType,
      customStartDate: customStartDate?.toISOString(),
      customEndDate: customEndDate?.toISOString(),
    });
  }, [periodType, customStartDate, customEndDate]);

  const { periodStart, periodEnd, periodLabel, periodKey } = useMemo(() => {
    if (periodType === "all") {
      return {
        periodStart: null,
        periodEnd: null,
        periodLabel: "All Transactions",
        periodKey: "all",
      };
    }

    if (periodType === "custom" && customStartDate) {
      const start = startOfDay(customStartDate);
      const end = customEndDate ? endOfDay(customEndDate) : endOfDay(customStartDate);
      const label = customEndDate
        ? `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
        : format(start, "MMM d, yyyy");
      return { periodStart: start, periodEnd: end, periodLabel: label, periodKey: `custom_${start.getTime()}_${end.getTime()}` };
    }

    let start: Date, end: Date, label: string;
    
    switch (periodType) {
      case "daily":
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
        label = getDateLabel(currentDate, periodType);
        break;
      case "weekly":
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
        label = `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
        break;
      case "monthly":
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        label = format(currentDate, "MMMM yyyy");
        break;
      case "yearly":
        start = startOfYear(currentDate);
        end = endOfYear(currentDate);
        label = format(currentDate, "yyyy");
        break;
      default:
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        label = format(currentDate, "MMMM yyyy");
    }
    
    return { periodStart: start, periodEnd: end, periodLabel: label, periodKey: `${periodType}_${start.getTime()}` };
  }, [periodType, currentDate, customStartDate, customEndDate]);

  const navigate = (direction: "prev" | "next") => {
    if (periodType === "custom" || periodType === "all") return;
    
    const modifier = direction === "prev" ? -1 : 1;
    switch (periodType) {
      case "daily":
        setCurrentDate(addDays(currentDate, modifier));
        break;
      case "weekly":
        setCurrentDate(addWeeks(currentDate, modifier));
        break;
      case "monthly":
        setCurrentDate(addMonths(currentDate, modifier));
        break;
      case "yearly":
        setCurrentDate(addYears(currentDate, modifier));
        break;
    }
  };

  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type);
    // Reset to current date when switching to daily/weekly/monthly/yearly
    if (type !== "custom" && type !== "all") {
      setCurrentDate(new Date());
    }
    if (type !== "custom") {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
    setPeriodDropdownOpen(false);
  };

  // Fetch category tree for grouping
  useEffect(() => {
    const fetchCategories = async () => {
      if (!selectedWallet) return;
      try {
        const response = await getCategoryTree(selectedWallet.wallet_id);
        if (response.success) {
          setCategoryTree(response.data?.roots || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, [selectedWallet]);

  const fetchTransactions = useCallback(async (forceRefresh = false, isBackground = false) => {
    if (!selectedWallet) return;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedTransactions(selectedWallet.wallet_id, periodKey);
      if (cached) {
        setTransactions(cached);
        // Still fetch in background to update
        setIsBackgroundLoading(true);
        try {
          const filters = periodType === "all" ? {} : {
            start_transaction_time: periodStart!.toISOString(),
            end_transaction_time: periodEnd!.toISOString(),
          };
          const response = await getWalletTransactions(selectedWallet.wallet_id, filters);
          if (response.success) {
            const data = response.data || [];
            setTransactions(data);
            setCachedTransactions(selectedWallet.wallet_id, periodKey, data);
          }
        } catch (error) {
          console.error("Background fetch failed:", error);
        } finally {
          setIsBackgroundLoading(false);
        }
        return;
      }
    }

    if (isBackground) {
      setIsBackgroundLoading(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const filters = periodType === "all" ? {} : {
        start_transaction_time: periodStart!.toISOString(),
        end_transaction_time: periodEnd!.toISOString(),
      };
      
      const response = await getWalletTransactions(selectedWallet.wallet_id, filters);
      
      if (response.success) {
        const data = response.data || [];
        setTransactions(data);
        setCachedTransactions(selectedWallet.wallet_id, periodKey, data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
      setIsBackgroundLoading(false);
    }
  }, [selectedWallet, periodStart, periodEnd, periodType, periodKey]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Force refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchTransactions(true);
    }
  }, [refreshTrigger, fetchTransactions]);

  // Periodic sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTransactions(true, true);
    }, 60000); // Sync every minute
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    
    const query = searchQuery.toLowerCase();
    return transactions.filter((t) => {
      const matchesNotes = t.note?.toLowerCase().includes(query);
      const matchesCategory = t.category?.name?.toLowerCase().includes(query);
      const matchesDate = format(new Date(t.transaction_time), "MMM d, yyyy").toLowerCase().includes(query);
      return matchesNotes || matchesCategory || matchesDate;
    });
  }, [transactions, searchQuery]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortBy === "category") {
        const catA = a.category?.name || "";
        const catB = b.category?.name || "";
        if (catA !== catB) return catA.localeCompare(catB);
        // Secondary sort by entry_time when transaction_time is same
        return new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime();
      }
      
      const dateA = new Date(a[sortBy]).getTime();
      const dateB = new Date(b[sortBy]).getTime();
      
      // If dates are equal, sort by entry_time
      if (dateA === dateB) {
        return new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime();
      }
      
      return dateB - dateA;
    });
  }, [filteredTransactions, sortBy]);

  const groupedData = useMemo(() => {
    if (sortBy === "category") {
      // Group by category
      const groups: { [key: string]: { transactions: Transaction[]; total: number; icon: string } } = {};
      
      sortedTransactions.forEach((transaction) => {
        const catName = transaction.category?.name || "Uncategorized";
        const icon = transaction.category?.icon || "💰";
        if (!groups[catName]) {
          groups[catName] = { transactions: [], total: 0, icon };
        }
        groups[catName].transactions.push(transaction);
        groups[catName].total += Math.abs(transaction.amount);
      });
      
      return { type: "category" as const, groups };
    }
    
    // Group by date
    const groups: { [key: string]: Transaction[] } = {};
    
    sortedTransactions.forEach((transaction) => {
      const date = format(new Date(transaction[sortBy as Exclude<SortType, "category">]), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    return { type: "date" as const, groups };
  }, [sortedTransactions, sortBy]);

  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    transactions.forEach((t) => {
      const isIncome = t.category?.root_id === 1 || t.category?.name?.toLowerCase().includes("income");
      if (isIncome) {
        income += Math.abs(t.amount);
      } else {
        expense += Math.abs(t.amount);
      }
    });
    
    return { totalIncome: income, totalExpense: expense };
  }, [transactions]);

  const periodOptions = [
    { value: "all", label: "All" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
    { value: "custom", label: "Select Dates" },
  ];

  const sortOptions = [
    { value: "transaction_time", label: "Transaction Date" },
    { value: "entry_time", label: "Entry Date" },
    { value: "last_modified_time", label: "Modified Date" },
    { value: "category", label: "Category" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Period Navigation */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-2 space-y-2">
        {/* Period Navigator with Dropdown */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("prev")}
            className="h-8 w-8"
            disabled={periodType === "custom" || periodType === "all"}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {periodType === "custom" ? (
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    {customStartDate ? format(customStartDate, "MMM d") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-xs text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    {customEndDate ? format(customEndDate, "MMM d") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => customStartDate ? date < customStartDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <Popover open={periodDropdownOpen} onOpenChange={setPeriodDropdownOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-auto py-1 px-2 gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-sm">{periodLabel}</span>
                  {isBackgroundLoading && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-36 p-1" align="center">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePeriodTypeChange(option.value as PeriodType)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                      periodType === option.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("next")}
            className="h-8 w-8"
            disabled={periodType === "custom" || periodType === "all"}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary, Search & Sort */}
        <div className="flex items-center justify-between gap-1">
          {/* Search Toggle */}
          <div className="flex items-center">
            {isSearchOpen ? (
              <div className="relative flex items-center animate-fade-in">
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 w-28 text-xs pr-6"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-1.5 p-0.5 hover:bg-muted rounded"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="flex gap-2 text-xs">
            <span className="text-income font-medium">
              +{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-expense font-medium">
              -{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          
          <Popover open={sortDropdownOpen} onOpenChange={setSortDropdownOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ArrowUpDown className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="end">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value as SortType);
                    setSortDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                    sortBy === option.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(groupedData.groups).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No transactions</p>
            <p className="text-sm text-muted-foreground/70">Add your first transaction</p>
          </div>
        ) : groupedData.type === "category" ? (
          <div className="space-y-3">
            {Object.entries(groupedData.groups).map(([catName, { transactions: txns, total, icon }]) => (
              <div key={catName} className="space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <span>{icon}</span>
                    {catName}
                  </p>
                  <p className="text-xs font-medium text-primary">
                    {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {txns.map((transaction) => (
                    <TransactionItem
                      key={transaction.transaction_id}
                      transaction={transaction}
                      onEdit={() => onTransactionClick?.(transaction)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedData.groups).map(([date, txns]) => (
              <div key={date} className="space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {format(new Date(date), "EEE, MMM d")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {txns.length} txn{txns.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {txns.map((transaction) => (
                    <TransactionItem
                      key={transaction.transaction_id}
                      transaction={transaction}
                      onEdit={() => onTransactionClick?.(transaction)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
