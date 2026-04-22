import { LockKeyhole, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RoadmapPlaceholderProps {
  phase: string;
  title: string;
  description: string;
  scope: string[];
  active?: boolean;
}

export function RoadmapPlaceholder({
  phase,
  title,
  description,
  scope,
  active = false,
}: RoadmapPlaceholderProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-linear-to-r from-primary/8 via-primary/3 to-transparent px-6 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={active ? "default" : "secondary"}>{phase}</Badge>
          <Badge variant="outline" className="gap-1">
            {active ? <Sparkles className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}
            {active ? "Dalam Cakupan" : "Belum Aktif"}
          </Badge>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="px-6 py-6">
        <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
          Ruang Lingkup
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {scope.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
          {active
            ? "Kerangka UI modul ini sudah disiapkan pada Phase 1. Form detail, tab lanjutan, dan integrasi data akan diteruskan sesuai roadmap implementasi."
            : "Modul tetap ditampilkan agar roadmap produk terlihat jelas, tetapi interaksi penuh ditahan sampai phase terkait dimulai."}
        </div>

        {!active ? (
          <div className="mt-6">
            <Button variant="outline" disabled>
              Menunggu {phase}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
