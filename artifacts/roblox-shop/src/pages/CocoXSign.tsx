import { useRef, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Check, Download, FileArchive, FileBadge, FileKey, KeyRound,
  Loader2, Lock, RotateCcw, Smartphone, TriangleAlert, X,
} from "lucide-react";
import { useCocoXSigner } from "@/hooks/useCocoXSigner";

const BASE = import.meta.env.BASE_URL;

type Slot = "ipa" | "p12" | "profile";

const slots: { key: Slot; label: string; hint: string; accept: string; exts: string[]; Icon: typeof FileArchive }[] = [
  { key: "ipa", label: "App package", hint: ".ipa or .zip", accept: ".ipa,.zip", exts: ["ipa", "zip"], Icon: FileArchive },
  { key: "p12", label: "Certificate", hint: ".p12 or .pfx", accept: ".p12,.pfx", exts: ["p12", "pfx"], Icon: FileKey },
  { key: "profile", label: "Provisioning profile", hint: ".mobileprovision", accept: ".mobileprovision", exts: ["mobileprovision"], Icon: FileBadge },
];

function fmtSize(n: number) {
  return n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function FileSlot({ index, slot, file, disabled, onPick }: {
  index: number; slot: (typeof slots)[number]; file: File | null; disabled: boolean;
  onPick: (f: File | null, err?: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const { Icon } = slot;
  return (
    <motion.button
      type="button"
      data-testid={`button-pick-${slot.key}`}
      disabled={disabled}
      onClick={() => ref.current?.click()}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.07 }}
      whileHover={disabled ? undefined : { y: -3 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        file ? "border-[#ff6a00] bg-[#ff6a00]/10" : "border-dashed border-[#ff6a00]/35 bg-[#1a0d05]/60 hover:border-[#ff6a00]/80"
      }`}
    >
      <input
        ref={ref}
        type="file"
        accept={slot.accept}
        className="hidden"
        data-testid={`input-${slot.key}`}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = "";
          if (!f) return;
          const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
          if (!slot.exts.includes(ext)) onPick(null, `${slot.label} must be ${slot.hint}. "${f.name}" was not accepted.`);
          else onPick(f);
        }}
      />
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${file ? "bg-[#ff6a00] text-[#1a0a00]" : "bg-[#ff6a00]/15 text-[#ff8a2a] group-hover:rotate-[-6deg]"}`}>
        <AnimatePresence mode="wait" initial={false}>
          {file ? (
            <motion.span key="ok" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}><Check className="h-6 w-6" strokeWidth={3} /></motion.span>
          ) : (
            <motion.span key="ic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Icon className="h-6 w-6" /></motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] text-[#ff8a2a]/70">0{index + 1}</span>
          <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[#fff1e4]">{slot.label}</span>
        </span>
        <span className="mt-1 block truncate text-sm text-[#e8c8ad]/75" data-testid={`text-file-${slot.key}`}>
          {file ? `${file.name}  ·  ${fmtSize(file.size)}` : `Tap to choose ${slot.hint}`}
        </span>
      </span>
      <span className="font-display text-[10px] font-bold uppercase tracking-widest text-[#ff8a2a]">{file ? "Change" : "Choose"}</span>
    </motion.button>
  );
}

export default function CocoXSign() {
  const { status, error, logs, result, sign, cancel, download } = useCocoXSigner();
  const [files, setFiles] = useState<Record<Slot, File | null>>({ ipa: null, p12: null, profile: null });
  const [password, setPassword] = useState("");
  const [outputName, setOutputName] = useState("");
  const [formError, setFormError] = useState("");
  const signing = status === "signing";
  const ready = !!(files.ipa && files.p12 && files.profile);
  const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const bigIpa = (files.ipa?.size ?? 0) > 150 * 1048576;

  const start = () => {
    const missing = slots.filter((s) => !files[s.key]).map((s) => s.label.toLowerCase());
    if (missing.length) { setFormError(`Choose your ${missing.join(", ")} before signing.`); return; }
    setFormError("");
    sign({ ipa: files.ipa!, p12: files.p12!, profile: files.profile!, password, outputName: outputName.trim() || undefined });
  };

  const resetAll = () => {
    cancel();
    setFiles({ ipa: null, p12: null, profile: null });
    setPassword(""); setOutputName(""); setFormError("");
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#140902] font-sans text-[#fff1e4]">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#ff5a00]/25 blur-[140px]" />
      <motion.div className="pointer-events-none absolute -bottom-52 right-[-10%] h-[560px] w-[560px] rounded-full bg-[#ff9a1f]/15 blur-[150px]"
        animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(#ff8a2a 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" data-testid="link-home" className="inline-flex items-center gap-2 rounded-full border border-[#ff6a00]/40 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#ffb27a] transition-colors hover:bg-[#ff6a00] hover:text-[#1a0a00]">
            <ArrowLeft className="h-3.5 w-3.5" /> CocoX home
          </Link>
          <span className="inline-flex items-center gap-2 font-mono text-[11px] text-[#ffb27a]/80"><Lock className="h-3.5 w-3.5" /> on-device only</span>
        </header>

        <section className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <div className="min-w-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
              <motion.img src={`${BASE}cocox-sign-icon.png`} alt="" className="h-16 w-16 rounded-[18px] shadow-[0_10px_40px_rgba(255,106,0,0.45)]"
                whileHover={{ rotate: -8, scale: 1.06 }} />
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#ff8a2a]">Private IPA signer</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="mt-6 font-display font-black uppercase leading-[0.9] tracking-tight" style={{ fontSize: "clamp(2.8rem, 8vw, 5.6rem)" }}>
              CocoX<br /><span className="text-[#ff6a00]">Sign</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className="mt-5 max-w-md text-lg leading-snug text-[#e8c8ad]">
              Sign your own iOS app with your own certificate, right inside this browser tab. Nothing is uploaded. Your password and certificate never leave your device and are discarded when you close the page.
            </motion.p>

            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }} className="mt-7 space-y-3 text-sm text-[#e8c8ad]/85">
              <li className="flex gap-3"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6a00]" /><span className="min-w-0">No uploads. Signing runs in a local worker; files stay in memory only.</span></li>
              <li className="flex gap-3"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6a00]" /><span className="min-w-0">A signed IPA is not proof Apple trusts your certificate. Certificates can be revoked by Apple at any time, after which signed apps stop opening.</span></li>
              <li className="flex gap-3"><Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6a00]" /><span className="min-w-0">Large apps need lots of memory. Phones may stop mid-way; desktop Chrome or Edge is the most reliable.</span></li>
            </motion.ul>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
              className="mt-9 rounded-3xl border border-[#ff6a00]/30 bg-[#1f0f05]/80 p-5">
              <div className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#ffb27a]">Add to Home Screen</div>
              <p className="mt-2 text-sm text-[#e8c8ad]/80">This profile only installs a CocoX Sign shortcut (webclip) that opens this page. It makes no DNS or network changes and is not a native app.</p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[#e8c8ad]/80">
                <li>Open this page in Safari and tap the button below, then Allow.</li>
                <li>Open Settings, tap Profile Downloaded.</li>
                <li>Tap Install, enter your passcode, then Install again.</li>
              </ol>
              <a href={`${BASE}api/cocox-sign-profile`} data-testid="link-mobileconfig"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#fff1e4] px-5 py-3 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a0a00] transition-transform hover:-translate-y-0.5 active:scale-95">
                <Download className="h-4 w-4" /> Get Home Screen shortcut
              </a>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 18 }}
            className="min-w-0 rounded-[28px] border border-[#ff6a00]/40 bg-[#1a0c04]/90 p-5 shadow-[0_30px_80px_-20px_rgba(255,90,0,0.35)] backdrop-blur sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Signing bench</h2>
              <span data-testid="status-signer" className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase ${
                status === "success" ? "bg-[#ffd29a] text-[#1a0a00]" : status === "error" ? "bg-[#ff3b1f] text-white" : status === "signing" ? "bg-[#ff6a00] text-[#1a0a00]" : "bg-[#ff6a00]/15 text-[#ffb27a]"}`}>
                {status === "idle" ? (ready ? "ready" : "waiting for files") : status}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {slots.map((s, i) => (
                <FileSlot key={s.key} index={i} slot={s} file={files[s.key]} disabled={signing}
                  onPick={(f, err) => { cancel(); setFormError(err || ""); setFiles((p) => ({ ...p, [s.key]: f })); }} />
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffb27a]"><KeyRound className="h-3 w-3" /> Certificate password</span>
                <input type="password" autoComplete="off" value={password} disabled={signing} onChange={(e) => { cancel(); setPassword(e.target.value); }}
                  data-testid="input-password" placeholder="Leave empty if none"
                  className="mt-1.5 w-full rounded-xl border border-[#ff6a00]/30 bg-[#0f0601] px-3 py-3 text-base text-[#fff1e4] outline-none transition focus:border-[#ff6a00] focus:ring-2 focus:ring-[#ff6a00]/30 disabled:opacity-50" />
              </label>
              <label className="block">
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffb27a]">Output name (optional)</span>
                <input value={outputName} disabled={signing} onChange={(e) => { cancel(); setOutputName(e.target.value); }} data-testid="input-output-name"
                  placeholder={files.ipa ? files.ipa.name.replace(/\.(ipa|zip)$/i, "") + "_signed" : "MyApp_signed"}
                  className="mt-1.5 w-full rounded-xl border border-[#ff6a00]/30 bg-[#0f0601] px-3 py-3 text-base text-[#fff1e4] outline-none transition focus:border-[#ff6a00] focus:ring-2 focus:ring-[#ff6a00]/30 disabled:opacity-50" />
              </label>
            </div>
            <p className="mt-2 text-xs text-[#e8c8ad]/60">An empty password only works for certificates exported without one.</p>

            {(isMobile || bigIpa) && status !== "success" && (
              <div data-testid="text-memory-warning" className="mt-4 flex gap-2 rounded-xl border border-[#ffb27a]/30 bg-[#ffb27a]/10 p-3 text-xs text-[#ffd8b8]">
                <Smartphone className="h-4 w-4 shrink-0" />
                {bigIpa ? "This IPA is large. Your browser may run out of memory; close other tabs or use a desktop computer." : "Phones have limited browser memory. Keep this tab open and in front while signing; large apps may fail."}
              </div>
            )}

            <AnimatePresence>
              {(formError || (status === "error" && error)) && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  data-testid="text-error" role="alert" className="mt-4 overflow-hidden">
                  <div className="flex gap-2 rounded-xl border border-[#ff3b1f]/50 bg-[#ff3b1f]/15 p-3 text-sm text-[#ffd0c4]">
                    <TriangleAlert className="h-4 w-4 shrink-0 text-[#ff5a3c]" /> {formError || error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {signing && (
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#ff6a00]/15" aria-label="Signing in progress" role="progressbar">
                <motion.div className="h-full w-1/3 rounded-full bg-[#ff6a00]" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }} />
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {status === "success" && result ? (
                <>
                  <motion.button type="button" onClick={download} data-testid="button-download"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileTap={{ scale: 0.97 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ff6a00] px-5 py-4 font-display text-xs font-black uppercase tracking-[0.16em] text-[#1a0a00] transition hover:bg-[#ff8a2a]">
                    <Download className="h-4 w-4" /> Download signed IPA
                  </motion.button>
                  <button type="button" onClick={resetAll} data-testid="button-reset"
                    className="flex items-center justify-center gap-2 rounded-2xl border border-[#ff6a00]/40 px-5 py-4 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[#ffb27a] transition hover:bg-[#ff6a00]/10">
                    <RotateCcw className="h-4 w-4" /> Start over
                  </button>
                </>
              ) : signing ? (
                <>
                  <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ff6a00]/20 px-5 py-4 font-display text-xs font-bold uppercase tracking-[0.16em] text-[#ffb27a]">
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing locally
                  </div>
                  <button type="button" onClick={cancel} data-testid="button-cancel"
                    className="flex items-center justify-center gap-2 rounded-2xl border border-[#ff6a00]/40 px-5 py-4 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[#ffb27a] transition hover:bg-[#ff6a00]/10">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <motion.button type="button" onClick={start} data-testid="button-sign" whileTap={{ scale: 0.97 }}
                    aria-disabled={!ready}
                    className={`flex-1 rounded-2xl px-5 py-4 font-display text-xs font-black uppercase tracking-[0.16em] transition ${ready ? "bg-[#ff6a00] text-[#1a0a00] shadow-[0_12px_30px_-8px_rgba(255,106,0,0.7)] hover:bg-[#ff8a2a]" : "bg-[#ff6a00]/15 text-[#ffb27a]/60"}`}>
                    {status === "error" ? "Try signing again" : "Sign IPA"}
                  </motion.button>
                  {(status === "error" || files.ipa || files.p12 || files.profile) && (
                    <button type="button" onClick={resetAll} data-testid="button-reset"
                      className="flex items-center justify-center gap-2 rounded-2xl border border-[#ff6a00]/40 px-5 py-4 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[#ffb27a] transition hover:bg-[#ff6a00]/10">
                      <RotateCcw className="h-4 w-4" /> Reset
                    </button>
                  )}
                </>
              )}
            </div>
            {status === "success" && result && (
              <p className="mt-3 text-xs text-[#e8c8ad]/70" data-testid="text-result">
                {result.name} · {fmtSize(result.blob.size)}. Install it with your own sideloading method; it opens only while your certificate stays valid.
              </p>
            )}

            {logs.length > 0 && (
              <div className="mt-5">
                <div className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#ffb27a]/80">Engine log</div>
                <pre data-testid="text-logs" className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-[#0a0400] p-3 font-mono text-[11px] leading-relaxed text-[#ffd8b8]/80">
                  {logs.join("\n")}
                </pre>
              </div>
            )}
          </motion.div>
        </section>
      </div>
    </div>
  );
}
