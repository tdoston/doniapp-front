import React from "react";
import { Receipt } from "lucide-react";

const PaymentsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Receipt className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm font-semibold">To'lov hisoboti</p>
      <p className="text-xs mt-1">Tez orada...</p>
    </div>
  );
};

export default PaymentsPage;
