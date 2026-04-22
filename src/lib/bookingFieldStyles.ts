/**
 * Telefon maydoni bilan bir xil: halqa tashqi qutida (`focus-within`), ichkarida ring yo‘q.
 */
export const BOOKING_FIELD_SHELL_CLASS =
  "min-w-0 w-full overflow-hidden rounded-xl border border-input bg-card transition-all focus-within:ring-2 focus-within:ring-ring";

/**
 * Quti ichidagi bir qator maydon — chekka yo‘q, fokus halqasi tashqi `BOOKING_FIELD_SHELL` da.
 */
export const BOOKING_SINGLE_LINE_INPUT_CLASS =
  "h-12 w-full border-0 bg-transparent px-4 text-[1rem] font-semibold leading-snug text-foreground outline-none ring-0 transition-all placeholder:font-normal placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 md:text-[1rem]";

/** Izoh textarea — xuddi shu quti pattern */
export const BOOKING_NOTES_TEXTAREA_CLASS =
  "min-h-[3rem] max-h-[17.5rem] w-full resize-none overflow-y-auto border-0 bg-transparent px-4 py-3 text-[1rem] font-semibold leading-snug text-foreground box-border outline-none ring-0 transition-all placeholder:font-normal placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 md:text-[1rem]";
