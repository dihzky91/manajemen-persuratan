"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { createInstructor } from "@/server/actions/jadwal-otomatis/instructors";

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(200),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export function FormBuatInstruktur() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", phone: "" } });

  function onSubmit(v: z.infer<typeof schema>) {
    start(async () => {
      const res = await createInstructor(v);
      if (!res.ok) { toast.error("Gagal"); return; }
      toast.success("Instruktur ditambahkan.");
      router.push("/jadwal-otomatis/instruktur");
    });
  }

  return (
    <Card className="rounded-[28px] max-w-lg">
      <CardHeader><CardTitle>Form Instruktur</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input placeholder="Nama instruktur" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email <span className="text-muted-foreground">(opsional)</span></FormLabel><FormControl><Input placeholder="email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Telepon <span className="text-muted-foreground">(opsional)</span></FormLabel><FormControl><Input placeholder="08xxxxxxxxxx" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>Batal</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
