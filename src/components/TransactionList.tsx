import { useState, useEffect, useMemo } from "react";
import { Transaction, getWalletTransactions } from "@/lib/api";
import { useApp } from "@/hooks/useApp";
import TransactionItem from "./TransactionItem";
import DateRangePicker from "./DateRangePicker";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { DateRange } from "react-day-picker";
import { ChevronLeft, ChevronRight, Calendar, ArrowUpDown, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  const { periodStart, periodEnd, periodLabel } = useMemo(() => {
    // If custom date range is set, use it
    if (periodType === "custom" && customDateRange?.from) {
      const start = startOfDay(customDateRange.from);
      const end = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from);
      const label = customDateRange.to
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
  }, [periodType, currentDate, customDateRange]);

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
      setCustomDateRange(undefined);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setCustomDateRange(range);
    if (range?.from) {
      setPeriodType("custom");
    } else {
      setPeriodType("monthly");
    }
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

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a[sortBy]).getTime();
      const dateB = new Date(b[sortBy]).getTime();
      return dateB - dateA;
    });
  }, [transactions, sortBy]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Period Navigation */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-3 space-y-3">
        {/* Period Type Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["daily", "weekly", "monthly", "yearly"] as PeriodType[]).map((type) => (
            <button
              key={type}
              onClick={() => handlePeriodTypeChange(type)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                periodType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
          
          {/* Date Range Picker */}
          <DateRangePicker
            dateRange={customDateRange}
            onDateRangeChange={handleDateRangeChange}
            className={cn(
              "text-xs",
              periodType === "custom" && "border-primary"
            )}
          />
        </div>

        {/* Period Navigator - only show for non-custom periods */}
        {periodType !== "custom" && (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("prev")}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{periodLabel}</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("next")}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Custom date label */}
        {periodType === "custom" && customDateRange?.from && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-medium">{periodLabel}</span>
          </div>
        )}

        {/* Summary & Sort */}
        <div className="flex items-center justify-between">
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
