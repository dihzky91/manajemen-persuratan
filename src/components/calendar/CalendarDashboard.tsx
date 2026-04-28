"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CalendarEvent } from "@/server/db/schema";

interface CalendarDashboardProps {
  initialEvents: CalendarEvent[];
  userId: string | undefined;
}

const eventTypeColors: Record<string, string> = {
  surat_deadline: "bg-blue-500",
  disposisi_deadline: "bg-amber-500",
  rapat: "bg-purple-500",
  reminder: "bg-green-500",
  other: "bg-gray-500",
  ujian: "bg-rose-500",
  ujian_pengawas: "bg-orange-500",
  admin_jaga: "bg-cyan-500",
};

const eventTypeLabels: Record<string, string> = {
  surat_deadline: "Deadline Surat",
  disposisi_deadline: "Deadline Disposisi",
  rapat: "Rapat",
  reminder: "Pengingat",
  other: "Lainnya",
  ujian: "Ujian",
  ujian_pengawas: "Pengawas",
  admin_jaga: "Admin Jaga",
};

export function CalendarDashboard({ initialEvents, userId }: CalendarDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const events = initialEvents;

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = format(event.startDate, "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      existing.push(event);
      map.set(dateKey, existing);
    });
    return map;
  }, [events]);

  const selectedDateEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) || []
    : [];

  const getEventsForDate = (date: Date) => {
    return eventsByDate.get(format(date, "yyyy-MM-dd")) || [];
  };

  const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">
            {format(currentDate, "MMMM yyyy", { locale: id })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={today}>
              Hari Ini
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, index) => {
              const dateEvents = getEventsForDate(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isTodayDate = isToday(date);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    relative min-h-20 p-2 text-left rounded-lg border transition-colors
                    ${isCurrentMonth ? "bg-card" : "bg-muted/30 text-muted-foreground"}
                    ${isSelected ? "ring-2 ring-primary border-primary" : "border-border hover:border-muted-foreground/30"}
                    ${isTodayDate ? "bg-primary/5" : ""}
                  `}
                >
                  <span
                    className={`
                      text-sm font-medium
                      ${isTodayDate ? "text-primary" : ""}
                      ${!isCurrentMonth ? "text-muted-foreground" : ""}
                    `}
                  >
                    {format(date, "d")}
                  </span>

                  {/* Event Indicators */}
                  {dateEvents.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dateEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full ${eventTypeColors[event.eventType] || "bg-gray-500"}`}
                        />
                      ))}
                      {dateEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{dateEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {selectedDate
              ? format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })
              : "Pilih Tanggal"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {selectedDate ? (
              selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Badge
                            className={`${eventTypeColors[event.eventType] || "bg-gray-500"} text-white mb-2`}
                          >
                            {eventTypeLabels[event.eventType] || event.eventType}
                          </Badge>
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {event.allDay
                              ? "Sepanjang hari"
                              : format(new Date(event.startDate), "HH:mm")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada event</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Klik tanggal untuk melihat event</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="lg:col-span-3">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {Object.entries(eventTypeLabels).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${eventTypeColors[type]}`} />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
