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
      className="flex items-center gap-2 p-2.5 bg-card rounded-xl shadow-card hover:shadow-soft transition-all duration-200 cursor-pointer active:scale-[0.99] select-none"
    >
      {/* Category Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg text-base",
          isIncome ? "bg-income/10" : "bg-expense/10"
        )}
      >
        {transaction.category?.icon || "💰"}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-xs text-foreground truncate">
          {transaction.category?.name || "Unknown"}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {transaction.note || transaction.person?.person_name || "No note"}
        </p>
        {/* Transaction time and Modified time */}
        <div className="flex gap-2 mt-0.5">
          <p className="text-[8px] text-muted-foreground/70">
            {format(new Date(transaction.transaction_time), "MMM d, h:mm a")}
          </p>
          {transaction.last_modified_time && (
            <p className="text-[8px] text-muted-foreground/50">
              • Mod: {format(new Date(transaction.last_modified_time), "MMM d, h:mm a")}
            </p>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p
          className={cn(
            "font-semibold text-xs tabular-nums",
            isIncome ? "text-income" : "text-expense"
          )}
        >
          {amountPrefix}{displayAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    </div>
  );
}
