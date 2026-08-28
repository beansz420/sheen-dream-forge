import { useEffect, useState } from "react";
import { Truck, Clock } from "lucide-react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function Announcement() {
  const [time, setTime] = useState({ h: 1, m: 59, s: 59 });

  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) { h = 1; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-nowrap items-center justify-center gap-3 overflow-hidden whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider sm:gap-4 sm:text-xs">
        <span className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 shrink-0" /> Frete grátis
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" /> Acaba em
          <span className="rounded bg-black/20 px-1 py-0.5 tabular-nums">{pad(time.h)}</span>:
          <span className="rounded bg-black/20 px-1 py-0.5 tabular-nums">{pad(time.m)}</span>:
          <span className="rounded bg-black/20 px-1 py-0.5 tabular-nums">{pad(time.s)}</span>
        </span>
      </div>
    </div>
  );
}

