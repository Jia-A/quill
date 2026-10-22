"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Linkedin,
  Copy,
  RefreshCw,
  Save,
  X,
  Loader2,
  Send,
  ExternalLink,
  Link2,
  Square,
} from "lucide-react";
import Button from "@/atoms/Button";
import {
  getDrafts,
  streamDraft,
  updateDraft,
  getLinkedInStatus,
  linkedInConnectUrl,
  publishToLinkedIn,
  type PublishResult,
} from "@/actions/socialActions";
import { sanitizeDraft, assembleDraft } from "@/utils/socialDraftFormat";

const LINKEDIN_SOFT_CAP = 1100;
const LINKEDIN_HARD_CAP = 1300;

type Props = {
  postId: string;
  authorId: string;
};

const SocialDraftsPanel = ({ postId, authorId }: Props) => {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  // `render` keeps the panel in the DOM while the close animation plays.
  // `entered` drives the open/closed CSS state (fade + slide) one frame after mount.
  const [render, setRender] = useState(false);
  const [entered, setEntered] = useState(false);
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [permalink, setPermalink] = useState<string | null>(null);
  // The in-flight generation; null once its stream has finished or been stopped.
  const abortRef = useRef<AbortController | null>(null);

  const isOwner = session?.user?.id === authorId;
  const token = session?.backendToken;

  // Drive enter/exit transitions: mount → next frame flips `entered` to true
  // (slide in); on close, flip `entered` off, then unmount after the transition.
  useEffect(() => {
    if (open) {
      setRender(true);
      const id = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
    // Closing the panel stops any stream rather than letting it save unseen.
    abortRef.current?.abort();
    const t = setTimeout(() => setRender(false), 300);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!open || !token) return;
    setLoading(true);
    setError(null);
    setPermalink(null);
    Promise.all([getDrafts(postId, token), getLinkedInStatus(token)])
      .then(([d, s]) => {
        setContent(d.linkedin ?? "");
        setSaved(d.linkedin ?? "");
        setConnected(s.connected);
      })
      .catch(() => setError("Failed to load drafts."))
      .finally(() => setLoading(false));
  }, [open, postId, token]);

  // If we just came back from LinkedIn OAuth, auto-open the panel and refresh status
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("linkedin");
    if (!flag) return;
    // We were redirected back here from the LinkedIn OAuth round-trip — reopen the panel.
    setOpen(true);
    if (flag !== "connected") {
      setError("Couldn't connect LinkedIn. Please try again.");
    }
    // clean the URL so a refresh doesn't re-trigger
    params.delete("linkedin");
    params.delete("share");
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
    window.history.replaceState({}, "", newUrl);
  }, []);

  if (!isOwner) return null;

  const dirty = content !== saved;
  const overHard = content.length > LINKEDIN_HARD_CAP;
  const overSoft = content.length > LINKEDIN_SOFT_CAP;

  const handleGenerate = async () => {
    if (!token) return;
    // While streaming, the textarea holds the in-flight draft, not user edits.
    if (!generating && dirty && !window.confirm("Discard your unsaved edits and regenerate?"))
      return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    setGenerating(true);
    setError(null);
    setContent("");

    let raw = "";
    try {
      await streamDraft(postId, "linkedin", token, signal, (text) => {
        if (signal.aborted) return;
        raw += text;
        setContent(raw);
      });
    } catch {
      // Stop / Regenerate / close abort the stream: a user action, not an error.
      if (signal.aborted) return;
      setError("Generation failed. Try again.");
      return;
    } finally {
      // Only the current run may clear the flag; a Regenerate already owns it.
      if (abortRef.current === controller) {
        abortRef.current = null;
        setGenerating(false);
      }
    }
    if (signal.aborted) return;

    // Normal [DONE]: clean up once, then save. Stop can no longer reach this run.
    const postUrl = `${window.location.origin}/blog/${postId}`;
    const final = assembleDraft(sanitizeDraft(raw), postUrl, LINKEDIN_HARD_CAP);
    setContent(final);
    setSaving(true);
    try {
      const res = await updateDraft(postId, "linkedin", final, token);
      setSaved(res.content);
    } catch {
      setError("Draft generated but not saved. Use Save edits to retry.");
    } finally {
      setSaving(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleSave = async () => {
    if (!token || !dirty || overHard) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateDraft(postId, "linkedin", content, token);
      setSaved(res.content);
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
  };

  const handleConnect = async () => {
    if (!token) return;
    const response = await linkedInConnectUrl(token, postId);
    const url = response.url;
    window.location.href = url;
  };

  const handlePublish = async () => {
    if (!token || !content || overHard) return;
    if (dirty && !window.confirm("You have unsaved edits. Save first, or publish anyway?")) return;
    setPublishing(true);
    setError(null);
    setPermalink(null);
    const result = (await publishToLinkedIn(postId, token)) as PublishResult;
    setPublishing(false);
    if (result.ok === true) {
      setPermalink(result.permalink);
      return;
    }
    const failure = result as Extract<PublishResult, { ok: false }>;
    if (failure.reason === "not_connected") {
      setConnected(false);
      setError("LinkedIn isn't connected. Click Connect LinkedIn to authorize.");
    } else if (failure.reason === "no_draft") {
      setError("Save the draft before publishing.");
    } else {
      setError("Publishing failed. Try again in a moment.");
    }
  };

  return (
    <>
      <Button
        variant="primary"
        label="Share on socials"
        icon={<Linkedin className="w-4 h-4" />}
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto justify-center"
      />

      {render && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className={`flex-1 bg-black/40 transition-opacity duration-500 ease-out ${
              entered ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside
            className={`w-full max-w-xl bg-bg border-l border-border h-full overflow-y-auto flex flex-col transition-transform duration-500 ease-out ${
              entered ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <Linkedin className="w-5 h-5" />
                <h2 className="text-2xl">LinkedIn draft</h2>
              </div>
              <Button
                variant="ghost"
                square
                onClick={() => setOpen(false)}
                className="text-muted"
                aria-label="Close"
                icon={<X className="w-5 h-5" />}
              />
            </header>

            <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading…
                </div>
              ) : (
                <>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    readOnly={generating}
                    placeholder="No draft yet — hit Generate to create one with AI."
                    className="w-full min-h-[200px] sm:min-h-[320px] flex-1 bg-bg-subtle border border-border rounded-md p-4 font-sans text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-fg resize-y"
                  />

                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={
                        overHard
                          ? "text-red-600 font-medium"
                          : overSoft
                            ? "text-amber-600"
                            : "text-muted"
                      }
                    >
                      {content.length} / {LINKEDIN_HARD_CAP} chars
                      {overHard && ` — exceeds ${LINKEDIN_HARD_CAP} limit`}
                    </span>
                    {dirty && !overHard && (
                      <span className="text-muted italic">Unsaved changes</span>
                    )}
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                </>
              )}
            </div>

            <footer className="px-4 sm:px-6 py-4 sm:py-5 border-t border-border flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={saving || loading}
                  variant="secondary"
                  icon={
                    generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )
                  }
                  label={content || generating ? "Regenerate" : "Generate"}
                />
                {generating && (
                  <Button
                    onClick={handleStop}
                    variant="secondary"
                    icon={<Square className="w-4 h-4" />}
                    label="Stop"
                    size="sm"
                  />
                )}
                <Button
                  onClick={handleSave}
                  disabled={!dirty || overHard || saving || loading}
                  variant="primary"
                  icon={
                    saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )
                  }
                  label={saving ? "Saving..." : "Save edits"}
                  size="sm"
                />
                <Button
                  onClick={handleCopy}
                  disabled={!content || loading}
                  variant="secondary"
                  icon={<Copy className="w-4 h-4" />}
                  label="Copy"
                  size="sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {permalink && (
                  <a
                    href={permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on LinkedIn
                  </a>
                )}
                {connected === false ? (
                  <Button
                    onClick={handleConnect}
                    variant="secondary"
                    icon={<Link2 className="w-4 h-4" />}
                    label="Connect LinkedIn"
                    size="sm"
                  />
                ) : (
                  <Button
                    onClick={handlePublish}
                    disabled={!content || overHard || publishing || loading || connected === null}
                    variant="primary"
                    icon={
                      publishing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )
                    }
                    label="Post to LinkedIn"
                    size="sm"
                  />
                )}
              </div>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
};

export default SocialDraftsPanel;
