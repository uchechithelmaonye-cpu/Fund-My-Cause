import { Campaign } from "@/types/campaign";

export interface CampaignExportData {
  campaign: Campaign;
  exportedAt: string;
}

export function exportCampaignAsJson(campaign: Campaign): void {
  const data: CampaignExportData = {
    campaign,
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `campaign-${campaign.id}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCampaignAsCsv(campaign: Campaign): void {
  const rows = [
    ["Field", "Value"],
    ["Campaign ID", campaign.id],
    ["Title", campaign.title],
    ["Creator", campaign.creator],
    ["Goal", campaign.goal],
    ["Raised", campaign.raised],
    ["Status", campaign.status],
    ["Deadline", campaign.deadline],
    ["Contributors", campaign.contributorCount || 0],
    ["Min Contribution", campaign.minContribution || 0],
    ["Description", campaign.description],
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `campaign-${campaign.id}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCampaignAsPdf(campaign: Campaign): void {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${campaign.title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #1f2937; margin-bottom: 10px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 16px; color: #374151; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
    .row { display: flex; margin-bottom: 8px; }
    .label { font-weight: bold; width: 150px; color: #4b5563; }
    .value { flex: 1; }
    .progress { width: 100%; height: 20px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .progress-bar { height: 100%; background: #3b82f6; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${campaign.title}</h1>
  <div class="meta">Campaign ID: ${campaign.id} | Created: ${new Date().toLocaleDateString()}</div>
  
  <div class="section">
    <h2>Campaign Overview</h2>
    <div class="row">
      <div class="label">Status:</div>
      <div class="value">${campaign.status}</div>
    </div>
    <div class="row">
      <div class="label">Creator:</div>
      <div class="value">${campaign.creator}</div>
    </div>
    <div class="row">
      <div class="label">Deadline:</div>
      <div class="value">${new Date(campaign.deadline).toLocaleDateString()}</div>
    </div>
  </div>

  <div class="section">
    <h2>Funding Progress</h2>
    <div class="row">
      <div class="label">Goal:</div>
      <div class="value">${campaign.goal} XLM</div>
    </div>
    <div class="row">
      <div class="label">Raised:</div>
      <div class="value">${campaign.raised} XLM</div>
    </div>
    <div class="row">
      <div class="label">Progress:</div>
      <div class="value">${Math.round((campaign.raised / campaign.goal) * 100)}%</div>
    </div>
    <div class="progress">
      <div class="progress-bar" style="width: ${Math.min((campaign.raised / campaign.goal) * 100, 100)}%"></div>
    </div>
  </div>

  <div class="section">
    <h2>Description</h2>
    <p>${campaign.description}</p>
  </div>

  <div class="section">
    <h2>Statistics</h2>
    <div class="row">
      <div class="label">Contributors:</div>
      <div class="value">${campaign.contributorCount || 0}</div>
    </div>
    <div class="row">
      <div class="label">Min Contribution:</div>
      <div class="value">${campaign.minContribution || 0} XLM</div>
    </div>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
