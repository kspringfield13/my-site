import aiWorkflow from "@/content/config/ai-workflow.json";
import type { SearchDoc } from "@/lib/types";
import type { EvidenceItem } from "@/lib/agent-kyle/types";

export const AI_WORKFLOW_ID = "section:ai-workflow";

export const aiWorkflowSearchDoc: SearchDoc = {
  id: AI_WORKFLOW_ID,
  type: "Section",
  title: "Kyle's AI workflow",
  url: "/about#ai-workflow",
  tags: ["ai", "models", "openai", "anthropic", "spacexai", "tools", "workflow"],
  body: `${aiWorkflow.summary} ${aiWorkflow.approach}`
};

export const aiWorkflowEvidence: EvidenceItem = {
  id: aiWorkflowSearchDoc.id,
  title: aiWorkflowSearchDoc.title,
  url: aiWorkflowSearchDoc.url,
  sourceType: "section",
  // Preserve the complete current statement instead of the short section excerpt.
  snippet: aiWorkflowSearchDoc.body,
  tags: aiWorkflowSearchDoc.tags
};
