import React, { useState } from "react";
import { CAMPAIGN_TEMPLATES, type CampaignTemplate } from "@/lib/campaign-templates";
import { ChevronRight } from "lucide-react";

interface TemplatePreviewProps {
  template: CampaignTemplate;
  onSelect: (template: CampaignTemplate) => void;
}

export function TemplatePreview({ template, onSelect }: TemplatePreviewProps) {
  return (
    <button
      onClick={() => onSelect(template)}
      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-3xl mb-2">{template.icon}</div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
      </div>
    </button>
  );
}

interface TemplateSelector {
  onSelect: (template: CampaignTemplate) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelector) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(CAMPAIGN_TEMPLATES.map((t) => t.category)));
  const filteredTemplates = selectedCategory
    ? CAMPAIGN_TEMPLATES.filter((t) => t.category === selectedCategory)
    : CAMPAIGN_TEMPLATES;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Choose a Template
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <TemplatePreview key={template.id} template={template} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
