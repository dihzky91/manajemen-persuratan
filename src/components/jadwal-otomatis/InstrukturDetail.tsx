"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, CalendarX, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addExpertise,
  removeExpertise,
  addUnavailability,
  removeUnavailability,
} from "@/server/actions/jadwal-otomatis/expertise";
import { updateInstructor } from "@/server/actions/jadwal-otomatis/instructors";

interface Props {
  instructor: any;
  expertise: any[];
  unavailability: any[];
  history: any[];
  programs: any[];
}

export function InstrukturDetail({ instructor, expertise, unavailability, history, programs }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // Expertise
  const [expProgram, setExpProgram] = useState("");
  const [expBlock, setExpBlock] = useState("");

  // Unavailability
  const [unavDate, setUnavDate] = useState("");
  const [unavReason, setUnavReason] = useState("");

  // Toggle status
  const [toggling, startToggle] = useTransition();

  function handleAddExpertise() {
    if (!expProgram || !expBlock) { toast.error("Pilih program dan blok materi"); return; }
    start(async () => {
      const res = await addExpertise({ instructorId: instructor.id, programId: expProgram, materiBlock: expBlock });
      if (res.ok) { toast.success("Keahlian ditambahkan"); router.refresh(); }
    });
  }

  function handleRemoveExpertise(id: string) {
    start(async () => {
      await removeExpertise(id);
      toast.success("Keahlian dihapus");
      router.refresh();
    });
  }

  function handleAddUnavailability() {
    if (!unavDate) { toast.error("Pilih tanggal"); return; }
    start(async () => {
      const res = await addUnavailability({ instructorId: instructor.id, date: unavDate, reason: unavReason });
      if (res.ok) { toast.success("Ketidaktersediaan ditambahkan"); setUnavDate(""); setUnavReason(""); router.refresh(); }
    });
  }

  function handleRemoveUnavailability(id: string) {
    start(async () => {
      await removeUnavailability(id);
      toast.success("Ketidaktersediaan dihapus");
      router.refresh();
    });
  }

  function handleToggleActive() {
    startToggle(async () => {
      await updateInstructor({ id: instructor.id, name: instructor.name, isActive: !instructor.isActive });
      toast.success(`Instruktur ${instructor.isActive ? "dinonaktifkan" : "diaktifkan"}`);
      router.refresh();
    });
  }

  const selectedProgram = programs.find((p: any) => p.id === expProgram);

  return (
    <div className="space-y-6">
      {/* Info */}
      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Data Instruktur</CardTitle>
              <CardDescription>Informasi dasar instruktur.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={toggling}>
              {instructor.isActive ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-3 gap-4">
          <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{instructor.email ?? "—"}</p></div>
          <div><p className="text-sm text-muted-foreground">Telepon</p><p className="font-medium">{instructor.phone ?? "—"}</p></div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={instructor.isActive ? "default" : "secondary"}>{instructor.isActive ? "Aktif" : "Nonaktif"}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Expertise */}
      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border"><CardTitle>Keahlian (Expertise)</CardTitle></CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select value={expProgram} onValueChange={setExpProgram}>
                <SelectTrigger><SelectValue placeholder="Pilih program" /></SelectTrigger>
                <SelectContent>
                  {programs.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input placeholder="Blok materi (e.g. PPh OP)" value={expBlock} onChange={(e) => setExpBlock(e.target.value)} />
            </div>
            <Button size="sm" onClick={handleAddExpertise} disabled={pending}><Plus className="h-4 w-4" /></Button>
          </div>
          {expertise.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada keahlian.</p>
          ) : (
            <div className="space-y-2">
              {expertise.map((e: any) => {
                const prog = programs.find((p: any) => p.id === e.programId);
                return (
                  <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <div>
                      <Badge variant="secondary">{prog?.name ?? e.programId}</Badge>
                      <span className="ml-2 text-sm">{e.materiBlock}</span>
                    </div>
                    <button onClick={() => handleRemoveExpertise(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unavailability */}
      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border"><CardTitle>Ketidaktersediaan</CardTitle></CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2 items-end">
            <div><Input type="date" value={unavDate} onChange={(e) => setUnavDate(e.target.value)} /></div>
            <div className="flex-1"><Input placeholder="Alasan (opsional)" value={unavReason} onChange={(e) => setUnavReason(e.target.value)} /></div>
            <Button size="sm" onClick={handleAddUnavailability} disabled={pending}><Plus className="h-4 w-4" /></Button>
          </div>
          {unavailability.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada ketidaktersediaan.</p>
          ) : (
            <div className="space-y-2">
              {unavailability.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CalendarX className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{u.date}</span>
                    {u.reason && <span className="text-sm text-muted-foreground">— {u.reason}</span>}
                  </div>
                  <button onClick={() => handleRemoveUnavailability(u.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teaching History */}
      <Card className="rounded-[28px]">
        <CardHeader className="border-b border-border"><CardTitle>Histori Mengajar</CardTitle></CardHeader>
        <CardContent className="pt-6 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Kelas</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Program</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Materi/Sesi</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Belum ada histori mengajar.</td></tr>
                ) : (
                  history.map((h: any) => (
                    <tr key={h.assignmentId} className="border-b border-border hover:bg-muted/50">
                      <td className="px-6 py-3">{h.scheduledDate}</td>
                      <td className="px-6 py-3 font-medium">{h.namaKelas}</td>
                      <td className="px-6 py-3">{h.programName}</td>
                      <td className="px-6 py-3">{h.isExamDay ? "Ujian" : h.materiName ?? `Sesi ${h.sessionNumber}`}</td>
                      <td className="px-6 py-3">
                        {h.isSubstitute ? (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">Substitusi</Badge>
                        ) : (
                          <Badge variant="secondary">Planned</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
