import { useState, useEffect, useMemo } from "react";
import { Transaction, getWalletTransactions } from "@/lib/api";
import { useApp } from "@/hooks/useApp";
import TransactionItem from "./TransactionItem";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, ArrowUpDown, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type PeriodType = "daily" | "weekly" | "monthly" | "yearly" | "custom";
type SortType = "transaction_time" | "entry_time" | "last_modified_time";

interface TransactionListProps {
  onTransactionClick?: (transaction: Transaction) => void;
  refreshTrigger?: number;
}

export default function TransactionList({ onTransactionClick, refreshTrigger }: TransactionListProps) {
  const { selectedWallet } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sortBy, setSortBy] = useState<SortType>("transaction_time");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { periodStart, periodEnd, periodLabel } = useMemo(() => {
    if (periodType === "custom" && customStartDate) {
      const start = startOfDay(customStartDate);
      const end = customEndDate ? endOfDay(customEndDate) : endOfDay(customStartDate);
      const label = customEndDate
        ? `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
        : format(start, "MMM d, yyyy");
      return { periodStart: start, periodEnd: end, periodLabel: label };
    }

    let start: Date, end: Date, label: string;
    
    switch (periodType) {
      case "daily":
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
        label = format(currentDate, "EEEE, MMM d, yyyy");
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
    
    return { periodStart: start, periodEnd: end, periodLabel: label };
  }, [periodType, currentDate, customStartDate, customEndDate]);

  const navigate = (direction: "prev" | "next") => {
    if (periodType === "custom") return;
    
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
    if (type !== "custom") {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
    setPeriodDropdownOpen(false);
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedWallet) return;
      
      setIsLoading(true);
      try {
        const response = await getWalletTransactions(selectedWallet.wallet_id, {
          start_transaction_time: periodStart.toISOString(),
          end_transaction_time: periodEnd.toISOString(),
        });
        
        if (response.success) {
          setTransactions(response.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedWallet, periodStart, periodEnd, refreshTrigger]);

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
      const dateA = new Date(a[sortBy]).getTime();
      const dateB = new Date(b[sortBy]).getTime();
      return dateB - dateA;
    });
  }, [filteredTransactions, sortBy]);

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    sortedTransactions.forEach((transaction) => {
      const date = format(new Date(transaction[sortBy]), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    return groups;
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
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
    { value: "custom", label: "Select Dates" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Period Navigation */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-3 space-y-3">
        {/* Period Navigator with Dropdown */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("prev")}
            className="h-8 w-8"
            disabled={periodType === "custom"}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {periodType === "custom" ? (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {customStartDate ? format(customStartDate, "MMM d, yyyy") : "Start Date"}
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
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Select
                      value={periodType}
                      onValueChange={(v) => handlePeriodTypeChange(v as PeriodType)}
                    >
                      <SelectTrigger className="border-0 h-6 p-0 text-xs focus:ring-0">
                        <span className="text-muted-foreground">TO</span>
                      </SelectTrigger>
                      <SelectContent>
                        {periodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Button>
                </PopoverTrigger>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {customEndDate ? format(customEndDate, "MMM d, yyyy") : "End Date"}
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
                <Button variant="ghost" className="h-auto py-1 px-3 gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{periodLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" align="center">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePeriodTypeChange(option.value as PeriodType)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      periodType === option.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {option.label}
                    {periodType === option.value && (
                      <span className="float-right">✓</span>
                    )}
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
            disabled={periodType === "custom"}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary, Search & Sort */}
        <div className="flex items-center justify-between gap-2">
          {/* Search Toggle */}
          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <div className="relative flex items-center animate-fade-in">
                <Input
                  placeholder="Search notes, category, date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-40 text-xs pr-8"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-2 p-0.5 hover:bg-muted rounded"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex gap-4 text-sm">
            <span className="text-income font-medium">
              +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-expense font-medium">
              -${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
            <SelectTrigger className="w-auto h-8 text-xs gap-1">
              <ArrowUpDown className="h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transaction_time">Transaction Date</SelectItem>
              <SelectItem value="entry_time">Entry Date</SelectItem>
              <SelectItem value="last_modified_time">Modified Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No transactions</p>
            <p className="text-sm text-muted-foreground/70">Add your first transaction</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, txns]) => (
              <div key={date} className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {format(new Date(date), "EEEE, MMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {txns.length} transaction{txns.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="space-y-2">
                  {txns.map((transaction) => (
                    <TransactionItem
                      key={transaction.transaction_id}
                      transaction={transaction}
                      onClick={() => onTransactionClick?.(transaction)}
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
