"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Redo2, Undo2, Link as LinkIcon, Minus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaUploadActions } from "@/components/admin/media-upload-actions";
import type { Media } from "@/lib/blog/types";

export function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), LinkExtension.configure({ openOnClick: false }), ImageExtension, Youtube.configure({ controls: true, nocookie: true })],
    content: value,
    editorProps: { attributes: { class: "cms-editor min-h-[420px] px-5 py-4 outline-none" } },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <div className="min-h-[460px] border border-white/10 p-4 text-sm text-muted-foreground">Carregando editor...</div>;
  const link = () => { const href = window.prompt("URL do link", editor.getAttributes("link").href || "https://"); if (href === null) return; if (!href) editor.chain().focus().unsetLink().run(); else editor.chain().focus().extendMarkRange("link").setLink({ href, target: "_blank" }).run(); };
  const youtube = () => { const src = window.prompt("URL do vídeo no YouTube"); if (src) editor.commands.setYoutubeVideo({ src, width: 1280, height: 720 }); };
  const tools = [
    { title: "Negrito", icon: Bold, run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { title: "Itálico", icon: Italic, run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { title: "Título H2", icon: Heading2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { title: "Título H3", icon: Heading3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { title: "Lista", icon: List, run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { title: "Lista numerada", icon: ListOrdered, run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { title: "Citação", icon: Quote, run: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
  ];
  const insertImage = (media: Media) => {
    editor.chain().focus().setImage({ src: media.url, alt: media.alt || media.filename, title: media.caption || undefined }).run();
  };
  return <div className="min-w-0 max-w-full overflow-hidden border border-white/10 bg-background"><div className="flex flex-wrap gap-1 border-b border-white/10 p-2">{tools.map(({ title, icon: Icon, run, active }) => <Button key={title} type="button" variant={active ? "secondary" : "ghost"} size="icon-sm" title={title} onClick={run}><Icon /></Button>)}<Button type="button" variant="ghost" size="icon-sm" title="Link" onClick={link}><LinkIcon /></Button><Button type="button" variant="ghost" size="icon-sm" title="Vídeo do YouTube" onClick={youtube}><Video /></Button><Button type="button" variant="ghost" size="icon-sm" title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus /></Button><span className="mx-1 w-px bg-white/10" /><Button type="button" variant="ghost" size="icon-sm" title="Desfazer" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 /></Button><Button type="button" variant="ghost" size="icon-sm" title="Refazer" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 /></Button></div><EditorContent editor={editor} /><div className="border-t border-white/10 p-3"><p className="mb-2 text-xs text-muted-foreground">Adicionar imagem ao texto</p><MediaUploadActions onSelect={insertImage} /></div></div>;
}
