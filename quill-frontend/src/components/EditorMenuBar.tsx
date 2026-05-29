import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
} from "lucide-react";
import { Editor } from "@tiptap/react";

export default function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  const groups = [
    [
      {
        icon: <Heading2 className="size-4" />,
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        pressed: editor.isActive("heading", { level: 2 }),
      },
      {
        icon: <Heading3 className="size-4" />,
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        pressed: editor.isActive("heading", { level: 3 }),
      },
    ],
    [
      {
        icon: <Bold className="size-4" />,
        onClick: () => editor.chain().focus().toggleBold().run(),
        pressed: editor.isActive("bold"),
      },
      {
        icon: <Italic className="size-4" />,
        onClick: () => editor.chain().focus().toggleItalic().run(),
        pressed: editor.isActive("italic"),
      },
      {
        icon: <Strikethrough className="size-4" />,
        onClick: () => editor.chain().focus().toggleStrike().run(),
        pressed: editor.isActive("strike"),
      },
      {
        icon: <Highlighter className="size-4" />,
        onClick: () => editor.chain().focus().toggleHighlight().run(),
        pressed: editor.isActive("highlight"),
      },
    ],
    [
      {
        icon: <AlignLeft className="size-4" />,
        onClick: () => editor.chain().focus().setTextAlign("left").run(),
        pressed: editor.isActive({ textAlign: "left" }),
      },
      {
        icon: <AlignCenter className="size-4" />,
        onClick: () => editor.chain().focus().setTextAlign("center").run(),
        pressed: editor.isActive({ textAlign: "center" }),
      },
      {
        icon: <AlignRight className="size-4" />,
        onClick: () => editor.chain().focus().setTextAlign("right").run(),
        pressed: editor.isActive({ textAlign: "right" }),
      },
    ],
    [
      {
        icon: <List className="size-4" />,
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        pressed: editor.isActive("bulletList"),
      },
      {
        icon: <ListOrdered className="size-4" />,
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        pressed: editor.isActive("orderedList"),
      },
    ],
    [
      {
        icon: <Code2 className="size-4" />,
        onClick: () => editor.chain().focus().toggleCodeBlock().run(),
        pressed: editor.isActive("codeBlock"),
      },
      {
        icon: <ImagePlus className="size-4" />,
        onClick: () => {
          const url = window.prompt(
            "Paste a direct image URL (must end in .jpg, .png, .webp, etc.)"
          );
          if (!url) return;
          const trimmed = url.trim();
          if (!trimmed) return;
          try {
            const parsed = new URL(trimmed);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
              window.alert("URL must start with http:// or https://");
              return;
            }
            const pathname = parsed.pathname.toLowerCase();
            const looksLikeImage = /\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/.test(pathname);
            if (!looksLikeImage) {
              const proceed = window.confirm(
                "That URL doesn't look like a direct image link (no .jpg/.png/etc.). It might be a webpage. Insert anyway?"
              );
              if (!proceed) return;
            }
          } catch {
            window.alert("That's not a valid URL.");
            return;
          }
          editor.chain().focus().setImage({ src: trimmed }).run();
        },
        pressed: false,
      },
    ],
  ];

  return (
    <div className="flex items-center gap-px border border-border bg-background sticky top-[61px] z-30 overflow-x-auto whitespace-nowrap scrollbar-thin">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center border-r border-border last:border-r-0 shrink-0">
          {group.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={option.onClick}
              className={`flex items-center justify-center w-9 h-9 transition-colors ${
                option.pressed
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {option.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
