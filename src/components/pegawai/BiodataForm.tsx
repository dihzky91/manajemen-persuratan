"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  biodataSchema,
  type BiodataInput,
} from "@/lib/validators/pegawai.schema";
import { upsertBiodata } from "@/server/actions/pegawai";

const GENDER_OPTIONS = ["Laki-laki", "Perempuan"] as const;
const STATUS_PERNIKAHAN_OPTIONS = ["BM", "M", "C", "D", "J"] as const;

export function BiodataForm({
  userId,
  initialData,
  canEdit,
}: {
  userId: string;
  initialData: Partial<BiodataInput> | null;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<BiodataInput>({
    resolver: zodResolver(biodataSchema),
    values: {
      userId,
      noKtp: initialData?.noKtp ?? "",
      gender: initialData?.gender,
      statusPernikahan: initialData?.statusPernikahan,
      tempatLahir: initialData?.tempatLahir ?? "",
      tanggalLahir: initialData?.tanggalLahir ?? "",
      alamatTinggal: initialData?.alamatTinggal ?? "",
      kodePos: initialData?.kodePos ?? "",
      provinsi: initialData?.provinsi ?? "",
      kotaKabupaten: initialData?.kotaKabupaten ?? "",
      alamatKtp: initialData?.alamatKtp ?? "",
    },
  });

  function onSubmit(values: BiodataInput) {
    startTransition(async () => {
      try {
        await upsertBiodata({
          ...values,
          noKtp: values.noKtp || undefined,
          tempatLahir: values.tempatLahir || undefined,
          tanggalLahir: values.tanggalLahir || undefined,
          alamatTinggal: values.alamatTinggal || undefined,
          kodePos: values.kodePos || undefined,
          provinsi: values.provinsi || undefined,
          kotaKabupaten: values.kotaKabupaten || undefined,
          alamatKtp: values.alamatKtp || undefined,
        });
        toast.success("Biodata pegawai diperbarui.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menyimpan biodata.");
      }
    });
  }

  return (
    <Form {...form}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="noKtp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>No. KTP</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} disabled={!canEdit || isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit || isPending}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="statusPernikahan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status Pernikahan</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit || isPending}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUS_PERNIKAHAN_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tempatLahir"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempat Lahir</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} disabled={!canEdit || isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tanggalLahir"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tanggal Lahir</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ""} disabled={!canEdit || isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provinsi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provinsi</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} disabled={!canEdit || isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kotaKabupaten"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kota / Kabupaten</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} disabled={!canEdit || isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kodePos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Pos</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} disabled={!canEdit || isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="alamatTinggal"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat Tinggal</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} disabled={!canEdit || isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="alamatKtp"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat KTP</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} disabled={!canEdit || isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {canEdit ? (
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Biodata"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
