// frontend/src/pages/MultiAgentSdlcDemoPage.tsx

import React, { useMemo, useState } from "react";
import { BACKEND_BASE } from "../lib/backend";
import "../styles/multiAgentSdlcDemo.css";

type Mode = "feature" | "pr_review" | "bug";

interface TranscriptEntry {
  agent: string;
  message: string;
}

interface Artifacts {
  [key: string]: string;
}

interface DemoResponse {
  mode: Mode;
  transcript: TranscriptEntry[];
  artifacts: Artifacts;
}

interface PipelineStep {
  id: string;
  label: string;
  description: string;
  agentKey: string; // matches transcript.agent values
}

const MODE_LABELS: Record<Mode, string> = {
  feature: "New Feature (Requirements → Plan)",
  pr_review: "PR Review (Code → Security → Plan)",
  bug: "Bug / Incident (Triage → Root Cause → Fix)",
};

const PIPELINE_BY_MODE: Record<Mode, PipelineStep[]> = {
  feature: [
    {
      id: "product_owner",
      label: "👩‍💼 Product Owner",
      description: "Turn leadership intent into a user story + acceptance criteria.",
      agentKey: "product_owner",
    },
    {
      id: "architect",
      label: "🧱 Architect",
      description: "Design data model, APIs, and UI impact.",
      agentKey: "architect",
    },
    {
      id: "planner",
      label: "🧑‍💻 Planner",
      description: "Break into backend / frontend / testing tasks.",
      agentKey: "planner",
    },
    {
      id: "tester",
      label: "🧪 Test Engineer",
      description: "Derive test scenarios and edge cases.",
      agentKey: "tester",
    },
    {
      id: "reporter",
      label: "📝 Reporter",
      description: "Summarize everything for leadership.",
      agentKey: "reporter",
    },
  ],
  pr_review: [
    {
      id: "code_reviewer",
      label: "Code Reviewer Agent",
      description: "Find functional and quality issues in the PR.",
      agentKey: "code_reviewer",
    },
    {
      id: "security_reviewer",
      label: "Security Agent",
      description: "Do a lightweight threat model of the change.",
      agentKey: "security_reviewer",
    },
    {
      id: "tester",
      label: "🧪 Test Engineer",
      description: "Suggest tests for coverage and regression.",
      agentKey: "tester",
    },
    {
      id: "planner",
      label: "🧑‍💻 Planner",
      description: "Turn findings into a refactor plan.",
      agentKey: "planner",
    },
    {
      id: "reporter",
      label: "📝 Reporter",
      description: "Generate a leadership-ready summary.",
      agentKey: "reporter",
    },
  ],
  bug: [
    {
      id: "bug_triage",
      label: "Triage Agent",
      description: "Classify severity and scope of the incident.",
      agentKey: "bug_triage",
    },
    {
      id: "root_cause",
      label: "Root Cause Agent",
      description: "Propose likely causes from logs + behavior.",
      agentKey: "root_cause",
    },
    {
      id: "fix_planner",
      label: "Fix Planner Agent",
      description: "Create a concrete remediation plan.",
      agentKey: "fix_planner",
    },
    {
      id: "regression_tester",
      label: "Regression Test Agent",
      description: "Define tests to prevent recurrence.",
      agentKey: "regression_tester",
    },
    {
      id: "reporter",
      label: "📝 Reporter",
      description: "Produce an incident summary for leadership.",
      agentKey: "reporter",
    },
  ],
};

const ARTIFACT_ORDER: Record<Mode, string[]> = {
  feature: ["summary", "user_story", "design", "tasks", "test_plan"],
  pr_review: ["summary", "review_findings", "security_findings", "test_plan", "refactor_plan"],
  bug: ["summary", "triage", "root_cause", "fix_plan", "regression_tests"],
};

const ARTIFACT_LABELS: Record<string, string> = {
  summary: "Executive Summary",
  user_story: "User Story",
  design: "Architecture / Design",
  tasks: "Task Breakdown",
  test_plan: "Test Plan",
  review_findings: "Code Review Findings",
  security_findings: "Security Findings",
  refactor_plan: "Refactor Plan",
  triage: "Bug Triage",
  root_cause: "Root Cause Analysis",
  fix_plan: "Fix Plan",
  regression_tests: "Regression Tests",
};

const MultiAgentSdlcDemoPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>("feature");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<DemoResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [visibleStepCount, setVisibleStepCount] = useState(0);

  const pipelineSteps = PIPELINE_BY_MODE[mode];

  const completedAgents = useMemo(() => {
    if (!response) return new Set<string>();
    return new Set(response.transcript.map((t) => t.agent));
  }, [response]);

  const activeAgent = useMemo(() => {
    if (!response) return null;
    const agents = response.transcript.map((t) => t.agent);
    return agents.length ? agents[agents.length - 1] : null;
  }, [response]);

  const runDemo = async () => {
    setError(null);
    setResponse(null);
    setVisibleStepCount(0);

    if (!input.trim()) {
      setError("Please enter a description for the feature / PR / bug.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/agents/sdlc_demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Request failed with status ${res.status}`);
      }

      const data: DemoResponse = await res.json();
      setResponse(data);

      // Animate steps one-by-one for the demo UI so leadership sees progression
      const steps = PIPELINE_BY_MODE[data.mode] || [];
      steps.forEach((_, idx) => {
        setTimeout(() => {
          setVisibleStepCount(idx + 1);
        }, idx * 500);
      });
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getArtifactSnippet = (text?: string, maxLength = 420): string => {
    if (!text) return "";
    const cleaned = text.trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.slice(0, maxLength) + "…";
  };

  const cleanLeadershipText = (text: string) => {
    return text
      .replace(/^###?\s+/gm, "")       // remove markdown headers
      .replace(/\*\*/g, "")            // remove bold markers
      .replace(/^- /gm, "• ")          // bullets to dots
      .replace(/_/g, "")               // remove underscores
      .trim();
  };

  const trimLeadership = (text: string, maxLines = 6) => {
    const lines = text.split("\n");
    return (
      lines.slice(0, maxLines).join("\n") + (lines.length > maxLines ? "\n…" : "")
    );
  };

  const cleanMarkdownForLeadership = (text: string, maxLines = 8): string => {
    if (!text) return "";

    // Limit to first N lines so cards stay short
    const lines = text.trim().split("\n").slice(0, maxLines);

    const cleanedLines = lines.map((line) => {
      let l = line;

      // Strip markdown headers like "## Problem Summary"
      l = l.replace(/^#{1,6}\s+/, "");

      // Remove bold/italic markers
      l = l.replace(/\*\*/g, "").replace(/__/g, "").replace(/[*_]/g, "");

      // Convert "- " bullets to "• "
      l = l.replace(/^\s*-\s+/, "• ");

      // Trim leftover whitespace
      return l.trimEnd();
    });

    return cleanedLines.join("\n").trim();
  };

  const renderLeadershipCards = () => {
    if (!response) {
      return (
        <div className="ma-leadership-placeholder">
          Run the demo to see a leadership-ready summary here.
        </div>
      );
    }

    const order = ARTIFACT_ORDER[response.mode];

    return (
      <div className="ma-leadership-cards">
        {order.map((key) => {
          const label = ARTIFACT_LABELS[key] || key;
          const value = response.artifacts[key];
          if (!value) return null;

          return (
            <div key={key} className="ma-card">
              <div className="ma-card-header">
                <span className="ma-card-title">{label}</span>
              </div>
              <div className="ma-card-body">
                <pre>{cleanMarkdownForLeadership(getArtifactSnippet(value))}</pre>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPipeline = () => {
    return (
      <div className="ma-pipeline">
        {pipelineSteps.map((step, idx) => {
          const isCompleted = idx < visibleStepCount;
          const isActive = idx === visibleStepCount - 1 && isCompleted;
          const isLast = idx === pipelineSteps.length - 1;

          return (
            <div key={step.id} className="ma-pipeline-step-wrapper">
              <div
                className={
                  "ma-pipeline-step" +
                  (isCompleted ? " ma-step-completed" : "") +
                  (isActive ? " ma-step-active" : "")
                }
              >
                <div className="ma-step-circle">
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div className="ma-step-content">
                  <div className="ma-step-label">{step.label}</div>
                  <div className="ma-step-description">{step.description}</div>
                  <div className="ma-step-status">
                    {isCompleted ? (isActive ? "Active ✓" : "Completed ✓") : "Pending"}
                  </div>
                </div>
              </div>
              {!isLast && <div className="ma-pipeline-connector" />}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTranscript = () => {
    if (!response) return null;
    if (!showDetails) {
      return (
        <button
          className="ma-toggle-details"
          type="button"
          onClick={() => setShowDetails(true)}
        >
          Show Detailed Agent Conversation
        </button>
      );
    }

    return (
      <div className="ma-transcript">
        <div className="ma-transcript-header-row">
          <span>Agent Conversation (full details)</span>
          <button
            className="ma-toggle-details"
            type="button"
            onClick={() => setShowDetails(false)}
          >
            Hide Details
          </button>
        </div>
        {response.transcript.map((entry, idx) => (
          <div key={idx} className="ma-transcript-entry">
            <div className="ma-transcript-agent">{entry.agent}</div>
            <pre className="ma-transcript-message">
              {cleanMarkdownForLeadership(entry.message, 20)}
            </pre>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="ma-page">
      <header className="ma-header">
        <div>
          <h1>Multi-Agent SDLC Orchestration Demo</h1>
          <p className="ma-subtitle">
            Shows how our local 7B model acts as multiple specialized agents to
            turn a vague request into a complete, leadership-ready SDLC plan.
          </p>
        </div>
      </header>

      <section className="ma-controls">
        <div className="ma-controls-left">
          <div className="ma-field">
            <label htmlFor="ma-mode">Demo Mode</label>
            <select
              id="ma-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              {Object.entries(MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="ma-field">
            <label htmlFor="ma-input-text">
              Leadership / developer request:
            </label>
            <textarea
              id="ma-input-text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              placeholder={
                mode === "feature"
                  ? "Example: We need MITRE ATT&CK tagging on DevCell tasks so we can filter reports by technique."
                  : mode === "pr_review"
                  ? "Example: PR #42 adds a malware upload endpoint. Include a short description and any key diff snippets."
                  : "Example: Dashboard shows yesterday's standup data after midnight. Paste key log lines if helpful."
              }
            />
          </div>

          <div className="ma-actions">
            <button onClick={runDemo} disabled={loading}>
              {loading ? "Running multi-agent workflow…" : "Run Multi-Agent Demo"}
            </button>
            {error && <div className="ma-error">{error}</div>}
          </div>
        </div>

        <div className="ma-controls-right">
          <div className="ma-callout">
            <div className="ma-callout-title">How to explain this</div>
            <div className="ma-callout-body">
              <p>
                <strong>“Sir/Ma’am, this engine takes a vague request and lets
                specialized AI agents handle requirements, architecture, planning,
                testing, and reporting — all on our internal 7B model.”</strong>
              </p>
              <p>
                The diagram below will animate as each agent finishes its work,
                and the right side shows the leadership-ready summary.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ma-main-layout">
        <div className="ma-left">
          <h2>Multi-Agent Orchestration Flow</h2>
          {renderPipeline()}
          {renderTranscript()}
        </div>

        <div className="ma-right">
          <h2>Leadership View (Artifacts)</h2>
          {renderLeadershipCards()}
        </div>
      </section>
    </div>
  );
};

export default MultiAgentSdlcDemoPage;
