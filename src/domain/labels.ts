import type { ActivityCategory, IssueKind, ResourceType, TaskCategory, WorkStatus } from "./schema";

export const STATUS_LABEL: Record<WorkStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Pending",
  blocked: "Blocked",
  awaiting_approval: "Awaiting Approval",
};

export const STATUS_DESCRIPTION: Record<WorkStatus, string> = {
  completed: "Work is finished and there is evidence for it.",
  in_progress: "Work has started but is not finished.",
  pending: "Work is planned or awaiting commencement.",
  blocked: "Work cannot progress because of a dependency or obstacle.",
  awaiting_approval: "A decision or approval by someone else is required.",
};

export const TASK_CATEGORY_LABEL: Record<TaskCategory, string> = {
  development: "Development",
  configuration: "Configuration and setup",
  research: "Research",
  testing: "Testing and validation",
  documentation: "Documentation",
  deployment: "Deployment",
  business_requirements: "Business requirements",
  other: "Other deliverables",
};

/** Order in which outstanding work is grouped on a project page. */
export const TASK_CATEGORY_ORDER: TaskCategory[] = [
  "development",
  "configuration",
  "testing",
  "documentation",
  "deployment",
  "business_requirements",
  "research",
  "other",
];

export const ACTIVITY_CATEGORY_LABEL: Record<ActivityCategory, string> = {
  development: "Development",
  research: "Research",
  testing: "Testing",
  deployment: "Deployment",
  documentation: "Documentation",
  meetings_coordination: "Meetings and coordination",
  decisions: "Decisions",
  other: "Other",
};

export const ISSUE_KIND_LABEL: Record<IssueKind, string> = {
  blocker: "Blocker",
  dependency: "External dependency",
  decision: "Pending decision",
  approval: "Approval required",
  risk: "Risk or limitation",
};

export const ISSUE_KIND_ORDER: IssueKind[] = ["blocker", "decision", "approval", "dependency", "risk"];

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  github_repository: "GitHub repository",
  github_pull_request: "GitHub pull request",
  figma_design: "Figma design",
  google_drive: "Google Drive document",
  notion_page: "Notion page",
  technical_documentation: "Technical documentation",
  project_brief: "Project brief",
  strategy_document: "Strategy document",
  meeting_notes: "Meeting notes",
  website: "Website",
  other: "External link",
};

export const PRIORITY_LABEL = { high: "High priority", medium: "Medium priority", low: "Low priority" } as const;

export const PENDING_CONFIRMATION = "Pending confirmation";
