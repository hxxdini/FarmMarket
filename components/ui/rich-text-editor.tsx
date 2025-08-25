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
  disabled?: boolean
}

export function RichTextEditor({ value, onChange, placeholder, disabled = false }: RichTextEditorProps) {
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
          `min-h-[300px] p-3 bg-white border rounded-md focus:outline-none prose prose-sm max-w-none tiptap ${
            disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
          }`,
      },
    },
    editable: !disabled,
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
      <div className={`flex flex-wrap gap-2 ${disabled ? 'opacity-50' : ''}`}>
        <Button type="button" variant={editor.isActive("bold") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleBold().run()} disabled={disabled}>
          Bold
        </Button>
        <Button type="button" variant={editor.isActive("italic") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={disabled}>
          Italic
        </Button>
        <Button type="button" variant={editor.isActive("underline") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={disabled}>
          Underline
        </Button>
        <Button type="button" variant={editor.isActive("heading", { level: 1 }) ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} disabled={disabled}>
          H1
        </Button>
        <Button type="button" variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={disabled}>
          H2
        </Button>
        <Button type="button" variant={editor.isActive("heading", { level: 3 }) ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} disabled={disabled}>
          H3
        </Button>
        <Button type="button" variant={editor.isActive("bulletList") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled}>
          Bullets
        </Button>
        <Button type="button" variant={editor.isActive("orderedList") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={disabled}>
          Numbers
        </Button>
        <Button type="button" variant={editor.isActive("blockquote") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={disabled}>
          Quote
        </Button>
        <Button type="button" variant={editor.isActive("codeBlock") ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()} disabled={disabled}>
          Code
        </Button>
        <Button type="button" variant={editor.isActive("link") ? "default" : "outline"} size="sm" onClick={setLink} disabled={disabled}>
          Link
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} disabled={disabled}>
          Clear
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().setTextAlign("left").run()} disabled={disabled}>
          Left
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().setTextAlign("center").run()} disabled={disabled}>
          Center
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().setTextAlign("right").run()} disabled={disabled}>
          Right
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={disabled}>
          Undo
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={disabled}>
          Redo
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor


