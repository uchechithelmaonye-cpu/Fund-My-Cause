"use client";

import { useState } from "react";
import { Campaign } from "@/types/campaign";
import {
  exportCampaignAsJson,
  exportCampaignAsCsv,
  exportCampaignAsPdf,
} from "@/lib/campaignExport";

interface CampaignExportButtonProps {
  campaign: Campaign;
}

export function CampaignExportButton({ campaign }: CampaignExportButtonProps) {
  const [open, setOpen] = useState(false);

  const handleExport = (format: "json" | "csv" | "pdf") => {
    switch (format) {
      case "json":
        exportCampaignAsJson(campaign);
        break;
      case "csv":
        exportCampaignAsCsv(campaign);
        break;
      case "pdf":
        exportCampaignAsPdf(campaign);
        break;
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Export
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
          <button
            onClick={() => handleExport("json")}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Export as JSON
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Export as CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}
