"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/server/actions/notifications";
import type { Notification } from "@/server/db/schema";
import { formatTanggalWaktuJakarta } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    const [notifs, count] = await Promise.all([
      getNotifications(userId, { limit: 10 }),
      getUnreadNotificationCount(userId),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id, userId);
    await fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
    await fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id, userId);
    await fetchNotifications();
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }

    // Navigate based on entity type
    if (notif.entitasType && notif.entitasId) {
      const routes: Record<string, string> = {
        disposisi: "/disposisi",
        surat_keluar: "/surat-keluar",
        surat_masuk: "/surat-masuk",
      };
      const baseRoute = routes[notif.entitasType];
      if (baseRoute) {
        router.push(`${baseRoute}/${notif.entitasId}`);
      }
    }

    setOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    const styles: Record<string, string> = {
      disposisi_baru: "text-blue-500",
      disposisi_deadline: "text-amber-500",
      surat_keluar_approval: "text-purple-500",
      surat_keluar_revisi: "text-red-500",
      surat_keluar_selesai: "text-green-500",
      surat_masuk_baru: "text-cyan-500",
      system: "text-gray-500",
    };
    return styles[type] || "text-gray-500";
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold">Notifikasi</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto py-1 px-2 text-xs"
            >
              Tandai semua dibaca
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Tidak ada notifikasi
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`px-3 py-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                  !notif.isRead ? "bg-muted/30" : ""
                }`}
                onClick={() => handleClick(notif)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${getNotificationIcon(notif.type)}`}>
                    <div className="h-2 w-2 rounded-full bg-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatTanggalWaktuJakarta(notif.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!notif.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
