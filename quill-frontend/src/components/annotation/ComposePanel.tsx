"use client";

import { useRef } from "react";
import {
  AccentButton,
  CloseButton,
  COMPOSE_W,
  LoginNote,
  META,
  PanelInput,
  TextButton,
  panelClass,
  panelStyle,
  type Anchor,
} from "./ui";
import type { Busy } from "./useComments";

/** New annotation on the current selection, pinned above it. */
export default function ComposePanel({
  at,
  isLoggedIn,
  busy,
  error,
  onSave,
  onClose,
  panelRef,
}: {
  at: Anchor;
  isLoggedIn: boolean;
  busy: Busy;
  error: string;
  onSave: (text: string) => void;
  onClose: () => void;
  panelRef: React.Ref<HTMLDivElement>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const saving = busy === "comment";

  const save = () => {
    const text = inputRef.current?.value.trim() ?? "";
    onSave(text);
  };

  return (
    <div ref={panelRef} style={panelStyle(at, COMPOSE_W)} className={panelClass}>
      <CloseButton onClick={onClose} aria-label="Discard annotation" />

      {isLoggedIn ? (
        <>
          <div className="px-3 pb-2">
            <PanelInput
              ref={inputRef}
              disabled={saving}
              placeholder="Leave a note…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !busy) save();
                if (e.key === "Escape") onClose();
              }}
            />
          </div>

          {error && <p className={`px-3 pb-1.5 ${META} text-destructive`}>{error}</p>}

          <div className="flex justify-end items-center gap-3 px-3 pb-2">
            <TextButton onClick={onClose}>Cancel</TextButton>
            <AccentButton onClick={save} disabled={saving} loading={saving}>
              {saving ? "Saving" : "Save"}
            </AccentButton>
          </div>
        </>
      ) : (
        <LoginNote what="add inline comments" onNavigate={onClose} />
      )}
    </div>
  );
}
