"use client"

import { useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import { Button } from "@/components/ui/button"

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: "https",
      }),
      Placeholder.configure({ placeholder: placeholder || "Write something amazing…" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] p-3 bg-white border rounded-md focus:outline-none prose prose-sm max-w-none tiptap",
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const incoming = value || ""
    if (current !== incoming) {
      editor.commands.setContent(incoming, false)
    }
  }, [value, editor])

  if (!editor) return null

  function setLink() {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href as string | undefined
    // eslint-disable-next-line no-alert
    const result = window.prompt("URL", previousUrl || "")
    if (result === null) return
    const url = result.trim()
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    try {
      const safe = new URL(url, window.location.origin).toString()
      editor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run()
    } catch {
      // ignore invalid URL
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={editor.isActive("bold") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </Button>
        <Button type="button" variant={editor.isActive("italic") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </Button>
        <Button type="button" variant={editor.isActive("underline") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()}>
          Underline
        </Button>
        <Button type="button" variant={editor.isActive("heading", { level: 1 }) ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          H1
        </Button>
        <Button type="button" variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Button>
        <Button type="button" variant={editor.isActive("heading", { level: 3 }) ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Button>
        <Button type="button" variant={editor.isActive("bulletList") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          Bullets
        </Button>
        <Button type="button" variant={editor.isActive("orderedList") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          Numbers
        </Button>
        <Button type="button" variant={editor.isActive("blockquote") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Quote
        </Button>
        <Button type="button" variant={editor.isActive("codeBlock") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          Code
        </Button>
        <Button type="button" variant={editor.isActive("link") ? "default" : "outline"} size="sm" onClick={setLink}>
          Link
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          Clear
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          Left
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          Center
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          Right
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().undo().run()}>
          Undo
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().redo().run()}>
          Redo
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor


