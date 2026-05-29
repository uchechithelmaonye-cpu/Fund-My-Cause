"use client";

import { CampaignDocument, formatFileSize, downloadDocument } from "@/lib/documentManager";

interface DocumentViewerProps {
  document: CampaignDocument;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded bg-gray-50">
      <div className="flex-1">
        <p className="font-medium text-sm">{document.name}</p>
        <p className="text-xs text-gray-600">{formatFileSize(document.size)}</p>
      </div>
      <button
        onClick={() => downloadDocument(document)}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Download
      </button>
    </div>
  );
}
