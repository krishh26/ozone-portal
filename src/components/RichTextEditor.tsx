import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadBlogImage } from "../api/client";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      className={`rounded px-2 py-1 text-xs font-medium ${
        active ? "bg-amber-800 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: "Write the article…",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rich-text-editor__content min-h-[28rem] px-3 py-2 outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="mt-1 min-h-[280px] rounded-lg border border-slate-200 bg-white px-3 py-8 text-sm text-slate-400">
        Loading editor…
      </div>
    );
  }

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  async function insertImage(file?: File) {
    if (!file || !editor) return;
    try {
      const url = await uploadBlogImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not upload image.");
    }
  }

  return (
    <div className="rich-text-editor mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          Underline
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Heading
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          List
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Numbers
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("link")} onClick={setLink}>
          Link
        </ToolbarButton>
        <ToolbarButton onClick={() => fileRef.current?.click()}>Image</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>Undo</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>Redo</ToolbarButton>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void insertImage(file);
        }}
      />
      <EditorContent editor={editor} />
    </div>
  );
}
