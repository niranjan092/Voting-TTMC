"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

export default function TestSupabase() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured (missing env vars).");
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.from("votes").select("*").limit(5);
        if (error) {
          setError(error.message);
        } else {
          setResult(data);
        }
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase Test</h1>
      <p>Configured: {String(isSupabaseConfigured)}</p>
      {error && (
        <div style={{ color: "red" }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {result && (
        <div>
          <strong>Rows (up to 5):</strong>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {!error && !result && <p>Loading...</p>}
    </div>
  );
}
