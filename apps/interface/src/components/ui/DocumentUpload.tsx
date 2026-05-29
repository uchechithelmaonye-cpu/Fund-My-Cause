"use client";

import { useState } from "react";
import { CampaignDocument, uploadDocument, validateDocument } from "@/lib/documentManager";

interface DocumentUploadProps {
  campaignId: string;
  onUpload: (doc: CampaignDocument) => void;
}

export function DocumentUpload({ campaignId, onUpload }: DocumentUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDocument(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const doc = await uploadDocument(file, campaignId);
      onUpload(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={loading}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <button
          onClick={(e) => {
            const input = (e.currentTarget.parentElement as HTMLLabelElement).querySelector(
              'input[type="file"]',
            ) as HTMLInputElement;
            input?.click();
          }}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Document"}
        </button>
      </label>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
