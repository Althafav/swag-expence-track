"use client";

import React, { useState } from "react";
import Card from "./ui/Card";
import SegmentedControl from "./ui/SegmentedControl";
import ProjectRow, { ProjectSummary } from "./ui/ProjectRow";
import EmptyState from "./ui/EmptyState";
import Button from "./ui/Button";
import Money from "./ui/Money";
import { STATUS_OPTIONS } from "@/lib/status";
import { plural } from "@/lib/format";
import { useTrackerModals } from "./AppShell";

const FILTERS = ["All", ...STATUS_OPTIONS.map((s) => s.label)];

export interface ProjectsListClientProps {
  projects: ProjectSummary[];
}

export default function ProjectsListClient({ projects }: ProjectsListClientProps) {
  const { openNewProject } = useTrackerModals();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  const list = projects.filter((p) => {
    const haystack = `${p.name} ${p.location} ${p.client || ""}`.toLowerCase();
    const matchQ = haystack.includes(q.toLowerCase());
    const matchS = status === "All" || STATUS_OPTIONS.find((s) => s.label === status)?.value === p.status;
    return matchQ && matchS;
  });

  const net = list.reduce((a, p) => a + ((p.income || 0) - (p.expense || 0)), 0);

  function clearFilters() {
    setQ("");
    setStatus("All");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", alignItems: "flex-end" }}>
        <div className="swag-field" style={{ flex: "1 1 240px" }}>
          <label className="swag-field__label" htmlFor="project-search">
            Search
          </label>
          <input
            id="project-search"
            className="swag-input"
            placeholder="Name, location or client"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="primary" iconLeft="folder-plus" size="lg" onClick={openNewProject}>
          New project
        </Button>
      </div>

      <SegmentedControl options={FILTERS} value={status} onChange={setStatus} />

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon="search-x"
            title="No projects match"
            body={`Nothing for "${q}". Clear the search or change the status filter.`}
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {list.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </div>
      )}

      <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)", display: "flex", gap: 6, alignItems: "baseline" }}>
        {list.length} of {plural(projects.length, "project", "projects")} · net <Money value={net} kind="profit" size="sm" />
      </span>
    </div>
  );
}
