"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth")
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setAuthEnabled(Boolean(data.authEnabled));
        if (data.authenticated) {
          router.replace(params.get("from") ?? "/");
        }
      })
      .catch(() => !cancelled && setAuthEnabled(true));
    return () => {
      cancelled = true;
    };
  }, [router, params]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Błąd logowania.");
      }
      router.replace(params.get("from") ?? "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd.");
      setLoading(false);
    }
  }

  if (authEnabled === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-200">
        <p>Auth jest wyłączony. Otwieram aplikację…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Atlas</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Zaloguj się aby uzyskać dostęp do panelu
          </p>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-300">Hasło</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
          />
        </label>
        {error ? (
          <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Logowanie…" : "Zaloguj"}
        </button>
        <p className="text-center text-xs text-zinc-500">
          Konfiguruj zmienne środowiskowe <code>LOCALDB_PASSWORD</code> lub{" "}
          <code>LOCALDB_TOKEN</code> aby aktywować autoryzację.
        </p>
      </form>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-200">Ładowanie…</div>}>
      <LoginForm />
    </Suspense>
  );
}

