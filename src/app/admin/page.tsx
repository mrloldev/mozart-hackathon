"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Lock,
  MusicNotesPlus,
  Trash,
  ArrowLeft,
  Check,
  SpinnerGap,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useUploadThing } from "@/utils/uploadthing";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const verifyAdmin = useMutation(api.admin.verifyAdmin);
  const addSong = useMutation(api.admin.addSong);
  const listSongs = useQuery(
    api.admin.listSongs,
    isAuthenticated ? { password } : "skip"
  );
  const deleteSong = useMutation(api.admin.deleteSong);
  const { startUpload } = useUploadThing("songUpload");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const valid = await verifyAdmin({ password });
      if (valid) {
        setIsAuthenticated(true);
      } else {
        setAuthError("Invalid password");
      }
    } catch {
      setAuthError("Invalid password");
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lyrics.trim() || !file || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const uploadResult = await startUpload([file]);
      const fileUrl = uploadResult?.[0]?.ufsUrl;
      if (!fileUrl) throw new Error("Upload failed");

      await addSong({
        password,
        title: title.trim(),
        lyrics: lyrics.trim(),
        fileUrl,
      });

      setTitle("");
      setLyrics("");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to add song");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (songId: Id<"songs">) => {
    if (!confirm("Delete this song?")) return;
    try {
      await deleteSong({ password, songId });
    } catch {
      alert("Failed to delete");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/80 mb-8"
          >
            <ArrowLeft size={18} />
            Back to game
          </Link>

          <div className=" rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/20">
                <Lock size={28} weight="bold" className="text-amber-400" />
              </div>
            </div>
            <h1 className="text-center text-xl font-bold text-white">
              Admin access
            </h1>
            <p className="mt-2 text-center text-sm text-white/50">
              Enter password to manage songs
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition-colors focus:border-amber-400/50"
                required
              />
              {authError && (
                <p className="text-sm text-red-400">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-black transition-colors hover:bg-amber-400"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/80"
          >
            <ArrowLeft size={18} />
            Back to game
          </Link>
          <h1 className="text-lg font-bold text-white">Song Library</h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-sm text-white/40 hover:text-white/80"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <MusicNotesPlus size={22} weight="bold" className="text-amber-400" />
            Add song
          </h2>
          <form onSubmit={handleAddSong} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Song title"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-amber-400/50"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">
                Lyrics
              </label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Paste lyrics here..."
                rows={6}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-amber-400/50 resize-none"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">
                Audio file
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/70 file:mr-4 file:rounded file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-black file:font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !lyrics.trim() || !file}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <SpinnerGap size={20} weight="bold" className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check size={20} weight="bold" />
                  Add song
                </>
              )}
            </button>
          </form>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-white">
            Songs ({listSongs?.length ?? 0})
          </h2>
          {listSongs?.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/20 py-12 text-center text-white/40">
              No songs yet. Add one above for Classic mode.
            </p>
          ) : (
            <ul className="space-y-3">
              {listSongs?.map((song) => (
                <li
                  key={song._id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                >
                  <span className="font-medium text-white">{song.title}</span>
                  <button
                    onClick={() => handleDelete(song._id)}
                    className="rounded-lg p-2 text-white/40 transition-colors hover:bg-red-500/20 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
