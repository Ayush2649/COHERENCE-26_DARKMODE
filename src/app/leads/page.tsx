"use client";

/**
 * Lead Upload Page - MVC: View
 * Features: upload CSV, parse with PapaParse, preview table, save to database.
 */

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** One row from parsed CSV (matches Lead fields we care about) */
interface ParsedLead {
  name: string;
  email: string;
  company: string;
  role: string;
}

const CSV_HEADERS = ["name", "email", "company", "role"];

export default function LeadsUploadPage() {
  const [rows, setRows] = useState<ParsedLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{ saved: number; total: number } | null>(null);
  const [totalInDb, setTotalInDb] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }
    setParsing(true);
    // Dynamic import so PapaParse runs only on client (avoids SSR/hydration issues)
    import("papaparse").then(({ default: Papa }) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          setParsing(false);
          if (res.errors.length > 0) {
            setError(res.errors[0].message ?? "CSV parse error");
            setRows([]);
            return;
          }
          const data = res.data;
          if (!data?.length) {
            setError("No rows found in CSV.");
            setRows([]);
            return;
          }
          // Case-insensitive header match (CSV may have "Name" or "name")
          const first = data[0];
          const findKey = (want: string) =>
            Object.keys(first).find((k) => k.toLowerCase().trim() === want) ?? "";
          const nameKey = findKey("name");
          const emailKey = findKey("email");
          const companyKey = findKey("company");
          const roleKey = findKey("role");
          const mapRow = (row: Record<string, string>): ParsedLead => ({
            name: (nameKey ? row[nameKey] : "").trim(),
            email: (emailKey ? row[emailKey] : "").trim(),
            company: (companyKey ? row[companyKey] : "").trim(),
            role: (roleKey ? row[roleKey] : "").trim(),
          });
          const parsed: ParsedLead[] = data.map(mapRow).filter((r) => r.name && r.email);
          setRows(parsed);
          if (parsed.length === 0)
            setError("No valid rows. CSV must have 'name' and 'email' columns with values.");
        },
      });
    }).catch((err) => {
      setParsing(false);
      setError(err instanceof Error ? err.message : "Failed to load CSV parser");
      setRows([]);
    });
    // Reset input so the same file can be selected again
    e.target.value = "";
  }, []);

  const handleSave = async () => {
    if (rows.length === 0) {
      setError("No leads to save. Upload a CSV first.");
      return;
    }
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: rows.map((r) => ({
            name: r.name,
            email: r.email,
            company: r.company || undefined,
            role: r.role || undefined,
          })),
        }),
      });
      if (res.status === 404) {
        setError("API not found (404). Restart the dev server: npm run dev");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save leads");
        return;
      }
      setResult({ saved: data.saved, total: data.total });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSaving(false);
    }
  };

  const fetchLeadCount = async () => {
    try {
      const res = await fetch("/api/leads");
      if (res.status === 404) {
        setError("API not found (404). Restart the dev server: npm run dev");
        setTotalInDb(null);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.ok) setTotalInDb(data.count ?? 0);
    } catch {
      setTotalInDb(null);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">← Home</Link>
        </Button>
        <h1 className="text-2xl font-bold">Upload Leads</h1>
      </div>

      <p className="text-muted-foreground mb-4">
        Upload a CSV with columns: <code className="bg-muted px-1 rounded">name</code>,{" "}
        <code className="bg-muted px-1 rounded">email</code>,{" "}
        <code className="bg-muted px-1 rounded">company</code>,{" "}
        <code className="bg-muted px-1 rounded">role</code>.
      </p>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
          aria-label="Choose CSV file"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={parsing}
        >
          {parsing ? "Parsing…" : "Choose CSV file"}
        </Button>
        <Button onClick={handleSave} disabled={saving || rows.length === 0}>
          {saving ? "Saving…" : "Save to database"}
        </Button>
        <Button variant="outline" size="sm" onClick={fetchLeadCount}>
          Verify: count leads in DB
        </Button>
      </div>
      {totalInDb !== null && (
        <p className="text-sm text-muted-foreground mb-2">
          Total leads in database: <strong>{totalInDb}</strong>
        </p>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {result && (
        <div className="mb-4 p-3 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
          Saved {result.saved} of {result.total} leads. Duplicates (same email) are skipped.
        </div>
      )}

      {rows.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <p className="p-2 bg-muted/50 text-sm text-muted-foreground">
            Preview ({rows.length} row{rows.length !== 1 ? "s" : ""})
          </p>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  {CSV_HEADERS.map((h) => (
                    <th key={h} className="text-left p-2 font-medium border-b">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-2">{row.name}</td>
                    <td className="p-2">{row.email}</td>
                    <td className="p-2">{row.company}</td>
                    <td className="p-2">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground">
        <strong>Sample CSV format:</strong>
        <pre className="mt-2 font-mono text-xs overflow-x-auto">
          {`name,email,company,role
John,john@tesla.com,Tesla,CTO
Sarah,sarah@openai.com,OpenAI,Engineer`}
        </pre>
      </div>
    </main>
  );
}
