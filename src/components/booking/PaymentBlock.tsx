import { BOOKING_FIELD_SHELL_CLASS, BOOKING_SINGLE_LINE_INPUT_CLASS } from "@/lib/bookingFieldStyles";
import { digitsFromSoumInput, formatSoumDisplay } from "@/lib/moneyInput";
import { cn } from "@/lib/utils";

interface PaymentBlockProps {
  price: string;
  paid: string;
  nights: number;
  onPaidChange: (val: string) => void;
  disabled?: boolean;
}

const PaymentBlock = ({ price, paid, nights, onPaidChange, disabled }: PaymentBlockProps) => {
  const priceNum = Number(digitsFromSoumInput(price)) || 0;
  const totalPrice = priceNum * nights;
  const paidNum = Number(digitsFromSoumInput(paid)) || 0;
  const debt = totalPrice - paidNum;

  const handleFullPaid = () => {
    if (disabled) return;
    if (totalPrice > 0) {
      onPaidChange(String(totalPrice));
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[0.8125rem] font-semibold leading-none text-foreground tracking-tight">To&apos;langan</label>
      <div className="flex items-center gap-2">
        <div className={cn(BOOKING_FIELD_SHELL_CLASS, "min-w-0 flex-1", disabled && "pointer-events-none opacity-60")}>
          <input
            type="text"
            inputMode="numeric"
            value={formatSoumDisplay(paid)}
            onChange={(e) => !disabled && onPaidChange(digitsFromSoumInput(e.target.value))}
            placeholder="0"
            readOnly={disabled}
            disabled={disabled}
            className={cn(BOOKING_SINGLE_LINE_INPUT_CLASS, "tabular-nums")}
          />
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={handleFullPaid}
          className="h-12 px-3.5 rounded-xl bg-emerald-600 text-white font-bold text-[0.8125rem] whitespace-nowrap shadow-sm shadow-emerald-600/25 transition-all hover:bg-emerald-700 active:scale-[0.97] shrink-0 disabled:opacity-50"
        >
          To&apos;liq to&apos;landi
        </button>
      </div>

      {totalPrice > 0 && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg font-semibold ${
          debt > 0
            ? "bg-destructive/10 text-destructive"
            : "bg-accent/10 text-accent"
        }`}>
          <span className="text-sm font-medium">Qarz</span>
          <span className="text-base sm:text-lg font-bold tabular-nums">
            {debt > 0 ? `${debt.toLocaleString("uz-UZ")} so'm` : "To'liq to'langan ✓"}
          </span>
        </div>
      )}
    </div>
  );
};

export default PaymentBlock;
