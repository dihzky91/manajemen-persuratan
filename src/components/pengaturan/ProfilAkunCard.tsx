"use client";

import { useState, useTransition } from "react";
import { Loader2, Upload, UserCircle2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateMyProfile, type ProfileRow } from "@/server/actions/profile";

interface Props {
  initial: ProfileRow;
}

export function ProfilAkunCard({ initial }: Props) {
  const [isPendingProfile, startProfileTransition] = useTransition();
  const [isPendingPassword, startPasswordTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initial.avatarUrl);

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startProfileTransition(async () => {
      const result = await updateMyProfile(formData);
      if (result.ok) {
        toast.success("Profil berhasil disimpan.");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const currentPassword = String(fd.get("currentPassword") ?? "");
    const newPassword = String(fd.get("newPassword") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");

    if (newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    startPasswordTransition(async () => {
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            revokeOtherSessions: false,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data?.message ?? "Gagal mengubah password.");
          return;
        }
        toast.success("Password berhasil diubah.");
        form.reset();
      } catch {
        toast.error("Terjadi kesalahan jaringan.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Profil */}
      <Card className="rounded-[24px]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Profil Saya</CardTitle>
              <CardDescription>
                Informasi pribadi yang ditampilkan di aplikasi.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Read-only header info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={initial.namaLengkap} disabled readOnly />
                <p className="text-xs text-muted-foreground">
                  Hanya admin yang dapat mengubah nama lengkap.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Email Login</Label>
                <Input value={initial.email} disabled readOnly />
              </div>
            </div>

            <Separator />

            {/* Editable fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emailPribadi">Email Pribadi (opsional)</Label>
                <Input
                  id="emailPribadi"
                  name="emailPribadi"
                  type="email"
                  defaultValue={initial.emailPribadi ?? ""}
                  placeholder="email.pribadi@contoh.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noHp">No. HP (opsional)</Label>
                <Input
                  id="noHp"
                  name="noHp"
                  defaultValue={initial.noHp ?? ""}
                  placeholder="08xxxxxxxxxx"
                  maxLength={20}
                />
              </div>
            </div>

            {/* Avatar */}
            <div className="space-y-2">
              <Label>Foto Profil (Avatar)</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/30">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <Input
                  type="file"
                  name="avatar"
                  accept="image/png,image/jpeg,image/webp"
                  className="text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAvatarPreview(URL.createObjectURL(file));
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, atau WebP. Disarankan format square.
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPendingProfile}>
                {isPendingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Profil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Ubah Password */}
      <Card className="rounded-[24px]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>
                Pastikan password baru minimal 8 karakter dan mudah Anda ingat.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Saat Ini</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPendingPassword}>
                {isPendingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ubah Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
