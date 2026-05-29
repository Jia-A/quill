"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getDrafts,
  generateDraft,
  updateDraft,
  getLinkedInStatus,
  linkedInConnectUrl,
  publishToLinkedIn,
  type PublishResult,
} from "@/actions/socialActions";

const LINKEDIN_SOFT_CAP = 1100;
const LINKEDIN_HARD_CAP = 1300;

type Props = {
  postId: string;
  authorId: string;
};

const SocialDraftsPanel = ({ postId, authorId }: Props) => {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [permalink, setPermalink] = useState<string | null>(null);

  const isOwner = session?.user?.id === authorId;
  const token = session?.backendToken;

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
    if (flag === "connected") setOpen(true);
    // clean the URL so a refresh doesn't re-trigger
    params.delete("linkedin");
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
    if (dirty && !window.confirm("Discard your unsaved edits and regenerate?")) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await generateDraft(postId, "linkedin", token);
      setContent(res.content);
      setSaved(res.content);
    } catch {
      setError("Generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
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

  const handleConnect = () => {
    if (!token) return;
    window.location.href = linkedInConnectUrl(token);
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
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-3 eyebrow border border-foreground text-foreground px-6 py-4 hover:bg-foreground hover:text-background transition-colors"
      >
        <Linkedin className="w-4 h-4" />
        Share on socials
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="w-full max-w-xl bg-background border-l border-border h-full overflow-y-auto flex flex-col">
            <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <Linkedin className="w-5 h-5" />
                <h2 className="font-serif text-2xl tracking-tightest">LinkedIn draft</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading…
                </div>
              ) : (
                <>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="No draft yet — hit Generate to create one with AI."
                    className="w-full min-h-[200px] sm:min-h-[320px] flex-1 bg-muted/40 border border-border rounded-md p-4 font-sans text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground resize-y"
                  />

                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={
                        overHard
                          ? "text-red-600 font-medium"
                          : overSoft
                            ? "text-amber-600"
                            : "text-muted-foreground"
                      }
                    >
                      {content.length} / {LINKEDIN_HARD_CAP} chars
                      {overHard && ` — exceeds ${LINKEDIN_HARD_CAP} limit`}
                    </span>
                    {dirty && !overHard && (
                      <span className="text-muted-foreground italic">Unsaved changes</span>
                    )}
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                </>
              )}
            </div>

            <footer className="px-4 sm:px-6 py-4 sm:py-5 border-t border-border flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button onClick={handleGenerate} disabled={generating || loading} variant="outline">
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {content ? "Regenerate" : "Generate"}
                </Button>
                <Button onClick={handleSave} disabled={!dirty || overHard || saving || loading}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </Button>
                <Button onClick={handleCopy} disabled={!content || loading} variant="outline">
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <div className="sm:ml-auto flex flex-wrap items-center gap-3">
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
                  <Button onClick={handleConnect} variant="outline">
                    <Link2 className="w-4 h-4" />
                    Connect LinkedIn
                  </Button>
                ) : (
                  <Button
                    onClick={handlePublish}
                    disabled={!content || overHard || publishing || loading || connected === null}
                  >
                    {publishing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Post to LinkedIn
                  </Button>
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
