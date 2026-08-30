"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaUploadActions } from "@/components/admin/media-upload-actions";
import type { Media } from "@/lib/blog/types";

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function EmailRichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class: "cms-editor min-h-[280px] px-5 py-4 outline-none",
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const next = value || "<p></p>";
    if (editor.getHTML() !== next) editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return <div className="min-h-[360px] border border-white/10 p-4 text-sm text-muted-foreground">Carregando editor...</div>;
  }

  const addLink = () => {
    const current = editor.getAttributes("link").href || "https://";
    const input = window.prompt("URL do link", current);
    if (input === null) return;
    if (!input.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const href = safeHttpUrl(input.trim());
    if (!href) {
      window.alert("Informe um link http:// ou https:// válido.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href, target: "_blank", rel: "noopener noreferrer" }).run();
  };

  const addVideoLink = () => {
    const input = window.prompt("URL do vídeo", "https://");
    if (!input) return;
    const href = safeHttpUrl(input.trim());
    if (!href) {
      window.alert("Informe um link http:// ou https:// válido.");
      return;
    }
    editor.chain().focus().insertContent({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "▶ Assistir ao vídeo",
          marks: [{ type: "link", attrs: { href, target: "_blank", rel: "noopener noreferrer" } }],
        },
      ],
    }).run();
  };

  const insertImage = (media: Media) => {
    editor.chain().focus().setImage({
      src: media.url,
      alt: media.alt || media.filename,
      title: media.caption || undefined,
    }).run();
  };

  const tools = [
    { title: "Negrito", icon: Bold, active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { title: "Itálico", icon: Italic, active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { title: "Título H2", icon: Heading2, active: editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { title: "Título H3", icon: Heading3, active: editor.isActive("heading", { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { title: "Lista", icon: List, active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { title: "Lista numerada", icon: ListOrdered, active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
    { title: "Citação", icon: Quote, active: editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
  ];

  return (
    <div className="min-w-0 max-w-full overflow-hidden border border-white/10 bg-background">
      <div className="border-b border-white/10">
        <div className="flex flex-wrap gap-1 p-2">
          {tools.map(({ title, icon: Icon, active, run }) => (
            <Button key={title} type="button" variant={active ? "secondary" : "ghost"} size="icon-sm" title={title} onClick={run}>
              <Icon />
            </Button>
          ))}
          <Button type="button" variant="ghost" size="icon-sm" title="Link" onClick={addLink}><LinkIcon /></Button>
          <Button type="button" variant="ghost" size="icon-sm" title="Vídeo por link" onClick={addVideoLink}><Video /></Button>
          <Button type="button" variant="ghost" size="icon-sm" title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus /></Button>
          <span className="mx-1 w-px bg-white/10" />
          <Button type="button" variant="ghost" size="icon-sm" title="Desfazer" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 /></Button>
          <Button type="button" variant="ghost" size="icon-sm" title="Refazer" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 /></Button>
        </div>
        <div className="border-t border-white/10 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Adicionar imagem ao e-mail</p>
          <MediaUploadActions onSelect={insertImage} />
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
