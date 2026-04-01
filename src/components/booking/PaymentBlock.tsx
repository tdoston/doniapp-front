interface PaymentBlockProps {
  price: string;
  paid: string;
  onPaidChange: (val: string) => void;
}

const formatNumber = (val: string): string => {
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("uz-UZ");
};

const PaymentBlock = ({ price, paid, onPaidChange }: PaymentBlockProps) => {
  const priceNum = Number(price.replace(/\D/g, "")) || 0;
  const paidNum = Number(paid.replace(/\D/g, "")) || 0;
  const debt = priceNum - paidNum;

  const handleFullPaid = () => {
    if (priceNum > 0) {
      onPaidChange(String(priceNum));
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">To'langan (so'm)</label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={formatNumber(paid)}
            onChange={(e) => onPaidChange(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="flex-1 h-12 px-4 rounded-lg border border-input bg-card text-foreground text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          <button
            type="button"
            onClick={handleFullPaid}
            className="h-12 px-4 rounded-lg bg-accent text-accent-foreground font-bold text-sm whitespace-nowrap transition-all active:scale-[0.97]"
          >
            To'liq to'landi
          </button>
        </div>
      </div>

      {priceNum > 0 && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg font-semibold ${
          debt > 0
            ? "bg-destructive/10 text-destructive"
            : "bg-accent/10 text-accent"
        }`}>
          <span className="text-sm">Qarz</span>
          <span className="text-lg">
            {debt > 0 ? `${debt.toLocaleString("uz-UZ")} so'm` : "To'liq to'langan ✓"}
          </span>
        </div>
      )}
    </div>
  );
};

export default PaymentBlock;
