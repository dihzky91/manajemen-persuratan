"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, FileCheck, UserCheck } from "lucide-react";
import { assignInstructorToBlock } from "@/server/actions/jadwal-otomatis/assignments";

interface KelasDetail {
  id: string; namaKelas: string; programId: string; programName: string; programCode: string;
  classTypeId: string; classTypeName: string; mode: string; startDate: string; endDate: string | null;
  lokasi: string | null; status: string; createdAt: Date;
}

interface Session {
  id: string; kelasId: string; sessionNumber: number | null; isExamDay: boolean;
  examSubjects: string[] | null; scheduledDate: string; timeSlotStart: string;
  timeSlotEnd: string; materiName: string | null; status: string;
}

interface Assignment {
  assignmentId: string; sessionId: string; sessionNumber: number | null;
  scheduledDate: string; materiName: string | null; isExamDay: boolean;
  plannedInstructorId: string; plannedInstructorName: string;
  actualInstructorId: string | null; substitutionReason: string | null;
}

interface Instructor { id: string; name: string; email: string | null; phone: string | null; isActive: boolean; expertiseCount?: number; createdAt: Date; }

interface JadwalDetailProps {
  kelas: KelasDetail; sessions: Session[];
  assignments: Assignment[]; instructors: Instructor[];
  materiBlocks: string[]; canManage: boolean;
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "default", completed: "secondary", cancelled: "destructive", makeup: "outline",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function getDayName(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long" });
}

export function JadwalDetail({ kelas, sessions, assignments, instructors, materiBlocks, canManage }: JadwalDetailProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [assignBlock, setAssignBlock] = useState("");
  const [assignInstructor, setAssignInstructor] = useState("");

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
    [sessions],
  );

  const sessionCount = sortedSessions.filter((s) => !s.isExamDay).length;
  const examCount = sortedSessions.filter((s) => s.isExamDay).length;

  // Group assignments by session for lookup
  const assignBySession = useMemo(() => {
    const map = new Map<string, Assignment>();
    for (const a of assignments) map.set(a.sessionId, a);
    return map;
  }, [assignments]);

  const sessionBlocks = useMemo(() => {
    const blocks = new Set<string>(materiBlocks);
    for (const s of sortedSessions) {
      if (s.materiName && !s.isExamDay) blocks.add(s.materiName);
    }
    return [...blocks];
  }, [sortedSessions, materiBlocks]);

  function handleAssign() {
    if (!assignBlock || !assignInstructor) { toast.error("Pilih blok materi dan instruktur"); return; }
    start(async () => {
      const res = await assignInstructorToBlock(kelas.id, assignInstructor, assignBlock);
      if (res.ok) {
        toast.success(`${res.assignedCount} sesi di-assign ke instruktur.`);
        setAssignBlock("");
        setAssignInstructor("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Info Kelas */}
      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border"><CardTitle>Informasi Kelas</CardTitle></CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><p className="text-sm text-muted-foreground">Program</p><p className="font-medium">{kelas.programName}</p></div>
            <div><p className="text-sm text-muted-foreground">Tipe Kelas</p><p className="font-medium">{kelas.classTypeName}</p></div>
            <div><p className="text-sm text-muted-foreground">Tanggal Mulai</p><p className="font-medium">{formatDate(kelas.startDate)}</p></div>
            <div><p className="text-sm text-muted-foreground">Tanggal Selesai</p><p className="font-medium">{kelas.endDate ? formatDate(kelas.endDate) : "—"}</p></div>
            <div><p className="text-sm text-muted-foreground">Metode</p><Badge variant={kelas.mode === "online" ? "secondary" : "default"}>{kelas.mode === "online" ? "Online" : "Offline"}</Badge></div>
            <div><p className="text-sm text-muted-foreground">Lokasi</p><p className="font-medium">{kelas.lokasi ?? "—"}</p></div>
            <div><p className="text-sm text-muted-foreground">Status</p><Badge variant={STATUS_COLORS[kelas.status] ?? "outline"}>{kelas.status}</Badge></div>
            <div><p className="text-sm text-muted-foreground">Total Sesi</p><p className="font-medium">{sessionCount}</p></div>
            <div><p className="text-sm text-muted-foreground">Total Ujian</p><p className="font-medium">{examCount}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Assign Instruktur */}
      {canManage && (
        <Card className="rounded-[28px]">
          <CardHeader className="border-b border-border"><CardTitle>Assign Instruktur</CardTitle></CardHeader>
          <CardContent className="pt-6">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Select value={assignBlock} onValueChange={setAssignBlock}>
                  <SelectTrigger><SelectValue placeholder="Pilih blok materi" /></SelectTrigger>
                  <SelectContent>
                    {sessionBlocks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={assignInstructor} onValueChange={setAssignInstructor}>
                  <SelectTrigger><SelectValue placeholder="Pilih instruktur" /></SelectTrigger>
                  <SelectContent>
                    {instructors.filter((i) => i.isActive).map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssign} disabled={pending}>
                <UserCheck className="h-4 w-4 mr-1" />
                Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jadwal */}
      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border"><CardTitle>Jadwal Kelas</CardTitle></CardHeader>
        <CardContent className="pt-6 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Hari</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Jam</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Tipe</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Materi / Ujian</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Instruktur</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedSessions.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Belum ada jadwal.</td></tr>
                ) : (
                  sortedSessions.map((s, idx) => {
                    const assign = assignBySession.get(s.id);
                    const instructorName = assign?.actualInstructorId
                      ? instructors.find((i) => i.id === assign.actualInstructorId)?.name ?? assign.plannedInstructorName
                      : assign?.plannedInstructorName;
                    return (
                      <tr key={s.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                        <td className="px-6 py-3 font-medium">{s.scheduledDate}</td>
                        <td className="px-6 py-3 text-muted-foreground">{getDayName(s.scheduledDate)}</td>
                        <td className="px-6 py-3 tabular-nums">{s.timeSlotStart} - {s.timeSlotEnd}</td>
                        <td className="px-6 py-3">
                          {s.isExamDay ? (
                            <Badge variant="outline" className="border-amber-300 text-amber-700"><FileCheck className="h-3 w-3 mr-1" />Ujian</Badge>
                          ) : (
                            <Badge variant="secondary"><BookOpen className="h-3 w-3 mr-1" />Sesi {s.sessionNumber}</Badge>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {s.isExamDay ? s.examSubjects?.join(", ") ?? "Ujian" : s.materiName ?? `Sesi ${s.sessionNumber}`}
                        </td>
                        <td className="px-6 py-3">
                          {instructorName ? (
                            <span className="text-sm">{instructorName}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant={STATUS_COLORS[s.status] ?? "outline"}>{s.status}</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
