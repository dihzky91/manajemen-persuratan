"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline as UnderlineIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type EditorMode = "visual" | "html" | "preview";

interface HtmlEditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 w-8 rounded-lg",
        active && "bg-primary/10 text-primary hover:bg-primary/15",
      )}
    >
      {children}
    </Button>
  );
}

function PreviewPane({ html, minHeight }: { html: string; minHeight: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.documentElement) return;
    const h = iframe.contentDocument.documentElement.scrollHeight;
    iframe.style.height = `${Math.max(h, minHeight)}px`;
  }, [minHeight]);

  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0.9rem 0.95rem;
    font-family: sans-serif;
    font-size: 0.95rem;
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
      style={{ width: "100%", border: "none", display: "block", minHeight }}
      sandbox="allow-same-origin"
      title="Preview pengumuman"
    />
  );
}

export function HtmlEditor({
  value,
  onChange,
  placeholder = "Tulis isi pengumuman...",
  minHeight = 220,
  maxHeight = 320,
}: HtmlEditorProps) {
  const [mode, setMode] = useState<EditorMode>("visual");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["https", "http", "mailto"],
      }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: "announcement-editor-content",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  const linkValue = useMemo(() => editor?.getAttributes("link").href ?? "", [editor]);

  function setOrUnsetLink() {
    if (!editor) return;
    const current = linkValue;
    const input = window.prompt("Masukkan URL", current || "https://");
    if (input === null) return;
    const href = input.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href }).run();
  }

  function handleHtmlChange(next: string) {
    onChange(next);
    if (!editor) return;
    editor.commands.setContent(next || "<p></p>", { emitUpdate: false });
  }

  const isVisual = mode === "visual";
  const isHtml = mode === "html";
  const isPreview = mode === "preview";

  return (
    <div
      className={cn(
        "announcement-editor rounded-2xl border border-input bg-background",
        isHtml && "announcement-editor-html-mode",
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/35 p-2">
        <ToolbarButton
          title="Bold"
          disabled={!isVisual}
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          disabled={!isVisual}
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          disabled={!isVisual}
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 1"
          disabled={!isVisual}
          active={editor?.isActive("heading", { level: 1 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          disabled={!isVisual}
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Bullet List"
          disabled={!isVisual}
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Ordered List"
          disabled={!isVisual}
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Quote"
          disabled={!isVisual}
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Code Block"
          disabled={!isVisual}
          active={editor?.isActive("codeBlock")}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Link"
          disabled={!isVisual}
          active={editor?.isActive("link")}
          onClick={setOrUnsetLink}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>

        {/* Mode switcher */}
        <div className="ml-auto flex gap-1">
          {(["visual", "html", "preview"] as EditorMode[]).map((m) => (
            <Button
              key={m}
              type="button"
              variant={mode === m ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m)}
              className="h-8 rounded-lg px-3 capitalize"
            >
              {m === "visual" ? "Visual" : m === "html" ? "HTML" : "Preview"}
            </Button>
          ))}
        </div>
      </div>

      {/* Content area */}
      {isHtml ? (
        <Textarea
          value={value}
          onChange={(e) => handleHtmlChange(e.target.value)}
          rows={12}
          className="announcement-editor-html-textarea min-h-[220px] resize-y rounded-none border-0 font-mono text-sm shadow-none focus-visible:ring-0"
        />
      ) : isPreview ? (
        <PreviewPane html={value} minHeight={minHeight} />
      ) : (
        <div style={{ minHeight, maxHeight, overflowY: "auto" }}>
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}
