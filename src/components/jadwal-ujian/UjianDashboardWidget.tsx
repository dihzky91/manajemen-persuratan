import { CalendarCheck, CalendarDays, CalendarRange, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StatistikUjian } from "@/server/actions/jadwal-ujian/bebanKerja";

interface UjianDashboardWidgetProps {
  data: StatistikUjian;
}

export function UjianDashboardWidget({ data }: UjianDashboardWidgetProps) {
  const items = [
    {
      label: "Ujian Hari Ini",
      value: data.totalHariIni,
      icon: CalendarCheck,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Ujian Minggu Ini",
      value: data.totalMingguIni,
      icon: CalendarDays,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
    },
    {
      label: "Ujian Bulan Ini",
      value: data.totalBulanIni,
      icon: CalendarRange,
      color: "text-violet-500",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      label: "Total Pengawas",
      value: data.totalPengawasAktif,
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ];

  return (
    <>
      {items.map((item) => (
        <Card key={item.label} className="gap-4 rounded-[24px]">
          <CardContent className="pt-5 sm:pt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums sm:text-3xl">{item.value}</p>
              </div>
              <div className={`rounded-xl p-2.5 sm:p-3 ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
