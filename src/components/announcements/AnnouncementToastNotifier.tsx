"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface AnnouncementToastNotifierProps {
  unreadCount: number;
}

export function AnnouncementToastNotifier({
  unreadCount,
}: AnnouncementToastNotifierProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || unreadCount === 0) return;
    fired.current = true;
    toast.info(
      unreadCount === 1
        ? "Ada 1 pengumuman yang butuh aksi Anda."
        : `Ada ${unreadCount} pengumuman yang butuh aksi Anda.`,
      {
        duration: 6000,
        action: {
          label: "Lihat",
          onClick: () => {
            window.location.href = "/pengumuman";
          },
        },
      },
    );
  }, [unreadCount]);

  return null;
}
