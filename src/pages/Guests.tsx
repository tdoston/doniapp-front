import React from "react";
import { Users } from "lucide-react";

const GuestsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Users className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm font-semibold">Mehmonlar ro'yxati</p>
      <p className="text-xs mt-1">Tez orada...</p>
    </div>
  );
};

export default GuestsPage;
