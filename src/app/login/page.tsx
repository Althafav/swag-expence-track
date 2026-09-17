"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Keypad from "@/components/ui/Keypad";

const CODE_LENGTH = 4;

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(passcode: string) {
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(true);
      setCode("");
    }
  }

  function press(key: string) {
    if (loading) return;
    setError(false);
    if (key === "del") {
      setCode((c) => c.slice(0, -1));
      return;
    }
    if (key === ".") return;
    setCode((c) => {
      const next = (c + key).slice(0, CODE_LENGTH);
      if (next.length === CODE_LENGTH) submit(next);
      return next;
    });
  }

  return (
    <div
      className="mow-lines"
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--sp-8)",
        padding: "var(--sp-8) var(--gutter-app)",
      }}
    >
      <Image src="/swag-logo-on-dark.png" alt="SWAG Landscapes" width={208} height={80} style={{ width: 208, maxWidth: "70%", height: "auto" }} priority />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)" }}>
        <span className="swag-eyebrow" style={{ color: "var(--text-on-dark-muted)" }}>
          Project profit tracker
        </span>

        <div className="swag-pass" aria-label="Passcode">
          {Array.from({ length: CODE_LENGTH }).map((_, i) => (
            <span key={i} className={"swag-pass__cell" + (code.length > i ? " swag-pass__cell--filled" : "")}>
              {code.length > i ? "•" : ""}
            </span>
          ))}
        </div>

        <span
          style={{
            font: "var(--type-body-sm)",
            color: error ? "#FFB5A0" : "var(--text-on-dark-muted)",
            minHeight: 20,
          }}
          role="status"
        >
          {error ? "Wrong passcode. Try again." : loading ? "Checking…" : "Enter the shared passcode"}
        </span>
      </div>

      <div style={{ width: "100%", maxWidth: 300 }}>
        <Keypad onKey={press} style={{ gap: "var(--sp-3)" }} />
      </div>

      <style>{`.swag-key { color: var(--text-on-dark); } .swag-key:hover { background: rgba(255, 255, 255, .08); } .swag-key:active { background: var(--lime-400); color: var(--ink); }`}</style>
    </div>
  );
}
