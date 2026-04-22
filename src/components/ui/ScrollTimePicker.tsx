import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { formatBronArrivalHuman, parseLocalDateTime, toLocalDateTimeIso } from "@/lib/bronTime";

const ROW = 44;
const VISIBLE = 220;
const PAD = Math.max(0, (VISIBLE - ROW) / 2);

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function useSnapColumn(
  length: number,
  onPick: (index: number) => void,
  scrollRef: React.RefObject<HTMLDivElement | null>
) {
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const raw = el.scrollTop / ROW;
    const i = Math.max(0, Math.min(length - 1, Math.round(raw)));
    if (Math.abs(el.scrollTop - i * ROW) > 1) {
      el.scrollTo({ top: i * ROW, behavior: "smooth" });
    }
    onPick(i);
  }, [length, onPick, scrollRef]);

  const onScroll = useCallback(() => {
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => {
      scrollEndTimer.current = null;
      snapFromScroll();
    }, 120);
  }, [snapFromScroll]);

  useEffect(() => () => {
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
  }, []);

  return onScroll;
}

function SnapColumn({
  labels,
  selectedIndex,
  onSelectIndex,
}: {
  labels: readonly string[];
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onScroll = useSnapColumn(labels.length, onSelectIndex, ref);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = selectedIndex * ROW;
    if (Math.abs(el.scrollTop - t) > 2) el.scrollTo({ top: t, behavior: "auto" });
  }, [selectedIndex]);

  return (
    <div
      className="relative flex-1 min-w-0 overflow-hidden rounded-2xl bg-muted/30"
      style={{ height: VISIBLE }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 border-y border-black/10 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.06]"
        style={{ height: ROW }}
      />
      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-auto overscroll-contain scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-y snap-mandatory touch-pan-y"
        style={{ paddingTop: PAD, paddingBottom: PAD }}
      >
        {labels.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className={cn(
              "flex h-[44px] shrink-0 snap-center items-center justify-center text-[1.125rem] font-semibold tabular-nums",
              i === selectedIndex ? "text-foreground font-extrabold" : "text-foreground/30"
            )}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface ScrollTimePickerProps {
  /** Taxta sanasi — `value` dagi sana bilan mos kelishi kerak */
  stayDateIso: string;
  value: string;
  onChange: (isoLocal: string) => void;
  /** Pastda qisqa matn */
  showCaption?: boolean;
}

/**
 * iOS uslubidagi scroll-vaqt tanlovi (24 soat + daqiqa).
 */
const ScrollTimePicker = ({ stayDateIso, value, onChange, showCaption = true }: ScrollTimePickerProps) => {
  const parsed = parseLocalDateTime(value);
  const hour24 = Math.min(23, Math.max(0, parsed?.hour24 ?? 14));
  const minute = Math.min(59, Math.max(0, parsed?.minute ?? 0));
  const hourIdx = hour24;
  const minIdx = minute;

  const setParts = useCallback(
    (nextHour24: number, nextMin: number) => {
      const h = Math.min(23, Math.max(0, nextHour24));
      const m = Math.min(59, Math.max(0, nextMin));
      onChange(toLocalDateTimeIso(stayDateIso, h, m));
    },
    [stayDateIso, onChange]
  );

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-background to-muted/20 shadow-inner">
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-b from-background via-transparent to-background opacity-[0.92]"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)",
          }}
        />
        <div className="relative z-[6] flex gap-1 px-1 pt-2 pb-3">
          <SnapColumn
            labels={HOURS_24.map((h) => String(h).padStart(2, "0"))}
            selectedIndex={hourIdx}
            onSelectIndex={(i) => setParts(i, minIdx)}
          />
          <SnapColumn
            labels={MINUTES.map((m) => String(m).padStart(2, "0"))}
            selectedIndex={minIdx}
            onSelectIndex={(i) => setParts(hourIdx, i)}
          />
        </div>
      </div>
      {showCaption ? (
        <p className="mt-3 text-center text-xs font-semibold text-muted-foreground tracking-wide">
          {formatBronArrivalHuman(value)}
        </p>
      ) : null}
    </div>
  );
};

export default ScrollTimePicker;
