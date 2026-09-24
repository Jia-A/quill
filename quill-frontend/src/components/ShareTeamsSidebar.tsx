"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, Users, X } from "lucide-react";
import Button from "@/atoms/Button";
import { createTeam, getTeams, shareToTeams, type Team } from "@/actions/teamActions";
import { PostVisibility } from "@/types/PostProps";

type Props = {
  token: string;
  open: boolean;
  onClose: () => void;
  /** Omitted on the teams page, where the drawer only manages teams. */
  postId?: string;
  onShared?: (visibility: PostVisibility) => void;
  /** Open straight on the create-team form instead of the team list. */
  createOnly?: boolean;
  onCreated?: () => void;
};

/** Split a textarea of emails on commas or newlines, dropping blanks. */
const parseEmails = (raw: string) =>
  raw
    .split(/[\n,]/)
    .map((email) => email.trim())
    .filter(Boolean);

const ShareTeamsSidebar = ({
  postId,
  token,
  open,
  onClose,
  onShared,
  createOnly = false,
  onCreated,
}: Props) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [ticked, setTicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // The drawer shows either the team list or the create-team form.
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const panelRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A close from anywhere else (Escape, the backdrop, an unmount) has to drop
  // the pending auto-close, or it would fire against a dead component.
  useEffect(() => {
    if (open) return;
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  // Load on every open so a team created elsewhere, or sharing changed on
  // another post, isn't served stale from the previous visit.
  useEffect(() => {
    if (!open) return;
    setError("");
    setSuccess("");
    setFormError("");
    setName("");
    setEmails("");
    // Create-only has no list to show, so there's nothing to fetch either.
    if (createOnly) {
      setCreating(true);
      return;
    }
    let active = true;
    setLoading(true);
    setCreating(false);
    getTeams(token, postId)
      .then((list) => {
        if (!active) return;
        setTeams(list);
        setTicked(list.filter((team) => team.sharedWithPost).map((team) => team.id));
        // With nothing to tick, the list would be an empty box: go straight to
        // the form, which is the only useful thing to do here.
        if (list.length === 0) setCreating(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Couldn't load your teams");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, postId, token, createOnly]);

  // Move focus into the drawer once it's mounted, so the keyboard lands here
  // rather than staying behind on the editor.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => panelRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const toggle = (id: string) => {
    setSuccess("");
    setTicked((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleShare = async () => {
    // Deliberately unguarded on an empty selection: clearing every team is how
    // you unshare a post, so that request still has to go out.
    if (!postId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await shareToTeams(postId, ticked, token);
      // Clearing every team is an unshare, so say which one actually happened.
      const names = teams.filter((team) => ticked.includes(team.id)).map((team) => team.name);
      setSuccess(
        names.length === 0
          ? "Removed from all teams."
          : `Shared with ${names.length === 1 ? names[0] : `${names.length} teams`}.`
      );
      onShared?.(result.visibility);
      // Hold the drawer open briefly so the confirmation is actually read.
      closeTimer.current = setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update sharing");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Give the team a name");
      return;
    }
    const memberEmails = parseEmails(emails);
    if (memberEmails.length === 0) {
      setFormError("Add at least one member email");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const team = await createTeam(trimmed, memberEmails, token);
      setName("");
      setEmails("");
      if (createOnly) {
        onCreated?.();
        onClose();
        return;
      }
      setTeams((prev) => [team, ...prev]);
      setTicked((prev) => [...prev, team.id]);
      setCreating(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't create the team");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="share-teams"
          className="fixed inset-0 z-50 flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex-1 bg-black/50" onClick={onClose} aria-hidden />

          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={createOnly ? "Create a new team" : "Share this post with teams"}
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-bg outline-none"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                {creating && !createOnly && teams.length > 0 && (
                  <Button
                    variant="ghost"
                    square
                    size="sm"
                    onClick={() => {
                      setCreating(false);
                      setFormError("");
                    }}
                    aria-label="Back to teams"
                    icon={<ArrowLeft className="h-4 w-4" />}
                  />
                )}
                <h2 className="text-2xl">{creating ? "New team" : "Share in teams"}</h2>
              </div>
              <Button
                variant="ghost"
                square
                onClick={onClose}
                className="text-muted"
                aria-label="Close"
                icon={<X className="h-5 w-5" />}
              />
            </header>

            {creating ? (
              <form onSubmit={handleCreate} className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex flex-1 flex-col gap-5 px-4 py-5 sm:px-6">
                  <div className="flex flex-col">
                    <label htmlFor="team-name" className="mb-1.5 text-sm font-medium">
                      Team name
                    </label>
                    <input
                      id="team-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Design Crew"
                      className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="team-emails" className="mb-1.5 text-sm font-medium">
                      Member emails
                    </label>
                    <textarea
                      id="team-emails"
                      value={emails}
                      onChange={(e) => setEmails(e.target.value)}
                      placeholder={"ana@quill.com, ben@quill.com\ncara@quill.com"}
                      rows={5}
                      className="w-full resize-y rounded-md border border-border bg-bg px-3 py-2 text-sm leading-relaxed focus:border-accent focus:outline-none"
                    />
                    <span className="mt-1.5 text-xs text-muted">
                      Separate them with commas or new lines.
                    </span>
                  </div>

                  {formError && <p className="text-sm text-danger">{formError}</p>}
                </div>

                <footer className="flex justify-end gap-2 border-t border-border px-4 py-4 sm:px-6">
                  {(createOnly || teams.length > 0) && (
                    <Button
                      type="button"
                      variant="secondary"
                      label="Cancel"
                      onClick={() => {
                        if (createOnly) {
                          onClose();
                          return;
                        }
                        setCreating(false);
                        setFormError("");
                      }}
                      disabled={submitting}
                    />
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    label={submitting ? "Creating..." : "Create team"}
                    loading={submitting}
                  />
                </footer>
              </form>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-muted">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading teams…
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {teams.map((team) => (
                        <li key={team.id}>
                          <label className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2.5 hover:bg-bg-subtle">
                            <input
                              type="checkbox"
                              checked={ticked.includes(team.id)}
                              onChange={() => toggle(team.id)}
                              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--accent)]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">
                                {team.name} <span className="text-muted">·</span>{" "}
                                {team.memberNames.length}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted">
                                {team.memberNames.join(", ")}
                              </span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!loading && (
                    <Button
                      variant="secondary"
                      label="Create new team"
                      icon={<Users className="h-4 w-4" />}
                      onClick={() => {
                        setCreating(true);
                        setFormError("");
                      }}
                      className="mt-4 w-full justify-center"
                    />
                  )}

                  {success && (
                    <p role="status" className="mt-4 flex items-center gap-1.5 text-sm text-accent">
                      <Check className="h-4 w-4 shrink-0" />
                      {success}
                    </p>
                  )}

                  {error && <p className="mt-4 text-sm text-danger">{error}</p>}
                </div>

                <footer className="flex justify-end border-t border-border px-4 py-4 sm:px-6">
                  <Button
                    variant="primary"
                    label={saving ? "Sharing..." : success ? "Done" : "Share"}
                    onClick={handleShare}
                    loading={saving}
                    disabled={saving || loading || !!success}
                  />
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareTeamsSidebar;
