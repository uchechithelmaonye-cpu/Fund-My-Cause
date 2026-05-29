import React, { useState } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  parseCSV,
  validateImportData,
  type CampaignImportData,
  type ImportValidationError,
} from "@/lib/campaign-import";

interface CampaignImportProps {
  onImport: (data: CampaignImportData[]) => void;
}

export function CampaignImport({ onImport }: CampaignImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CampaignImportData[]>([]);
  const [errors, setErrors] = useState<Record<number, ImportValidationError[]>>({});
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);

      const importData: CampaignImportData[] = rows.map((row) => ({
        title: row.title || "",
        description: row.description || "",
        goal: row.goal || "",
        deadline: row.deadline || "",
        minContribution: row.minContribution || "1",
        imageUrl: row.imageUrl,
        videoUrl: row.videoUrl,
      }));

      const validationErrors: Record<number, ImportValidationError[]> = {};
      importData.forEach((data, idx) => {
        const errs = validateImportData(data);
        if (errs.length > 0) {
          validationErrors[idx] = errs;
        }
      });

      setPreview(importData);
      setErrors(validationErrors);
    } catch (err) {
      console.error("Failed to parse CSV:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    const validData = preview.filter((_, idx) => !errors[idx]);
    if (validData.length > 0) {
      onImport(validData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
        <label className="flex flex-col items-center cursor-pointer">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload CSV file
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Columns: title, description, goal, deadline, minContribution, imageUrl, videoUrl
          </span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
        </label>
      </div>

      {file && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selected: <span className="font-medium">{file.name}</span>
        </div>
      )}

      {preview.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Preview</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {preview.map((data, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  errors[idx]
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                    : "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                }`}
              >
                <div className="flex items-start gap-2">
                  {errors[idx] ? (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{data.title}</p>
                    {errors[idx] && (
                      <ul className="mt-1 space-y-1">
                        {errors[idx].map((err, errIdx) => (
                          <li key={errIdx} className="text-xs text-red-600 dark:text-red-400">
                            {err.field}: {err.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={Object.keys(errors).length === preview.length}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {preview.filter((_, idx) => !errors[idx]).length} Campaign(s)
          </button>
        </div>
      )}
    </div>
  );
}
