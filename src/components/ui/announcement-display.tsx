"use client";

import { useCallback, useRef } from "react";

interface AnnouncementDisplayProps {
  html: string;
  className?: string;
}

export function AnnouncementDisplay({ html, className }: AnnouncementDisplayProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;
    const height = iframe.contentDocument.documentElement.scrollHeight;
    iframe.style.height = `${height}px`;
  }, []);

  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.6;
    color: inherit;
    background: transparent;
    overflow: hidden;
  }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>${html}</body>
</html>`;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      onLoad={handleLoad}
      className={className}
      style={{ width: "100%", border: "none", display: "block", minHeight: 40 }}
      sandbox="allow-same-origin"
      title="Isi pengumuman"
    />
  );
}
