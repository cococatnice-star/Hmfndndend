import { useCallback, useEffect, useRef, useState } from "react";

export interface SigningInputs {
  ipa: File;
  p12: File;
  profile: File;
  password: string;
  outputName?: string;
}

export interface SignedIpa {
  name: string;
  blob: Blob;
}

export function useCocoXSigner() {
  const worker = useRef<Worker | null>(null);
  const [status, setStatus] = useState<"idle" | "signing" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<SignedIpa | null>(null);

  const cancel = useCallback(() => {
    worker.current?.terminate();
    worker.current = null;
    setStatus("idle");
    setLogs([]);
    setError("");
    setResult(null);
  }, []);

  useEffect(() => () => worker.current?.terminate(), []);

  const sign = useCallback((inputs: SigningInputs) => {
    worker.current?.terminate();
    setStatus("signing");
    setError("");
    setLogs(["Loading the local signing engine…"]);
    setResult(null);
    const name = (inputs.outputName || inputs.ipa.name.replace(/\.(ipa|zip)$/i, "") + "_signed")
      .replace(/[^\w.-]/g, "_").replace(/\.ipa$/i, "") + ".ipa";
    try {
      const instance = new Worker(`${import.meta.env.BASE_URL}cocox-sign-runtime/worker.js`);
      worker.current = instance;
      const fail = (message: string) => {
        if (worker.current !== instance) return;
        instance.terminate();
        worker.current = null;
        setError(message);
        setStatus("error");
      };
      instance.onerror = () => fail("The signing engine stopped. Try desktop Chrome or Edge with more free memory.");
      instance.onmessage = ({ data }) => {
        if (worker.current !== instance) return;
        if (data.type === "log") {
          // Never retain certificate passwords or raw runtime arguments in logs.
          const line = inputs.password ? String(data.line).split(inputs.password).join("[redacted]") : String(data.line);
          setLogs(previous => [...previous.slice(-79), line]);
        } else if (data.type === "success") {
          setResult({ name, blob: new Blob([data.bytes], { type: "application/octet-stream" }) });
          setStatus("success");
          instance.terminate();
          worker.current = null;
        } else if (data.type === "error") {
          fail("Signing failed. Check the certificate password and matching provisioning profile. A damaged IPA or insufficient browser memory can also cause this.");
        }
      };
      instance.postMessage({ ...inputs, outputName: name });
    } catch {
      worker.current?.terminate();
      worker.current = null;
      setStatus("error");
      setError("This browser could not start local signing. Try a current desktop Chrome or Edge browser.");
    }
  }, []);

  const download = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [result]);

  return { status, error, logs, result, sign, cancel, download };
}
