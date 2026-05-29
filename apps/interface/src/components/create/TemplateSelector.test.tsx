import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateSelector, TemplatePreview } from "./TemplateSelector";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";

const mockOnSelect = jest.fn();

describe("TemplateSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all templates by default", () => {
    render(<TemplateSelector onSelect={mockOnSelect} />);
    CAMPAIGN_TEMPLATES.forEach((template) => {
      expect(screen.getByText(template.name)).toBeInTheDocument();
    });
  });

  it("filters templates by category", () => {
    render(<TemplateSelector onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /charity/i }));
    expect(screen.getByText("Medical Fundraiser")).toBeInTheDocument();
  });

  it("shows all templates when 'All' is clicked", () => {
    render(<TemplateSelector onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /creative/i }));
    fireEvent.click(screen.getByRole("button", { name: /^all$/i }));
    expect(screen.getByText("Medical Fundraiser")).toBeInTheDocument();
    expect(screen.getByText("Music Project")).toBeInTheDocument();
  });

  it("calls onSelect when template is clicked", () => {
    render(<TemplateSelector onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByText("Medical Fundraiser"));
    expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "charity-medical" }));
  });
});

describe("TemplatePreview", () => {
  it("renders template information", () => {
    const template = CAMPAIGN_TEMPLATES[0];
    render(<TemplatePreview template={template} onSelect={mockOnSelect} />);
    expect(screen.getByText(template.name)).toBeInTheDocument();
    expect(screen.getByText(template.description)).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const template = CAMPAIGN_TEMPLATES[0];
    render(<TemplatePreview template={template} onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockOnSelect).toHaveBeenCalledWith(template);
  });

  it("displays template icon", () => {
    const template = CAMPAIGN_TEMPLATES[0];
    render(<TemplatePreview template={template} onSelect={mockOnSelect} />);
    expect(screen.getByText(template.icon)).toBeInTheDocument();
  });
});
