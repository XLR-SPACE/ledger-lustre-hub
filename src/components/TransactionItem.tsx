import { Transaction, Category } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export default function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const isIncome = transaction.category?.root_id === 1 || 
    transaction.category?.name?.toLowerCase().includes("income") ||
    transaction.amount > 0 && transaction.category?.parent_id === 1;
  
  const displayAmount = Math.abs(transaction.amount);
  const amountPrefix = isIncome ? "+" : "-";

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-card hover:shadow-soft transition-all duration-200 cursor-pointer active:scale-[0.99]"
    >
      {/* Category Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-11 h-11 rounded-xl text-xl",
          isIncome ? "bg-income/10" : "bg-expense/10"
        )}
      >
        {transaction.category?.icon || "💰"}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {transaction.category?.name || "Unknown"}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {transaction.note || transaction.person?.person_name || "No note"}
        </p>
      </div>

      {/* Amount & Time */}
      <div className="text-right">
        <p
          className={cn(
            "font-semibold tabular-nums",
            isIncome ? "text-income" : "text-expense"
          )}
        >
          {amountPrefix}${displayAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(transaction.transaction_time), "h:mm a")}
        </p>
      </div>
    </div>
  );
}
