import { Transaction } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLongPress } from "@/hooks/useLongPress";

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
  onEdit?: () => void;
}

export default function TransactionItem({ transaction, onClick, onEdit }: TransactionItemProps) {
  const isIncome = transaction.category?.root_id === 1 || 
    transaction.category?.name?.toLowerCase().includes("income") ||
    transaction.amount > 0 && transaction.category?.parent_id === 1;
  
  const displayAmount = Math.abs(transaction.amount);
  const amountPrefix = isIncome ? "+" : "-";

  const { handlers } = useLongPress({
    onLongPress: () => onEdit?.(),
    onClick: onClick,
    delay: 400,
  });

  return (
    <div
      {...handlers}
      className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-card hover:shadow-soft transition-all duration-200 cursor-pointer active:scale-[0.99] select-none"
    >
      {/* Category Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl text-lg",
          isIncome ? "bg-income/10" : "bg-expense/10"
        )}
      >
        {transaction.category?.icon || "💰"}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">
          {transaction.category?.name || "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {transaction.note || transaction.person?.person_name || "No note"}
        </p>
        {transaction.last_modified_time && (
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">
            Modified: {format(new Date(transaction.last_modified_time), "MMM d, h:mm a")}
          </p>
        )}
      </div>

      {/* Amount & Time */}
      <div className="text-right">
        <p
          className={cn(
            "font-semibold text-sm tabular-nums",
            isIncome ? "text-income" : "text-expense"
          )}
        >
          {amountPrefix}${displayAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {format(new Date(transaction.transaction_time), "h:mm a")}
        </p>
      </div>
    </div>
  );
}
