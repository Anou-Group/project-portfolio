import { z } from "zod";

/**
 * The shape of every reporting record. Types are inferred from these schemas, the
 * database enums mirror them (supabase/migrations), and both the content files and
 * database rows are parsed with them.
 */

export const WORK_STATUSES = ["completed", "in_progress", "pending", "blocked", "awaiting_approval"] as const;
export const TASK_CATEGORIES = [
  "development",
  "configuration",
  "research",
  "testing",
  "documentation",
  "deployment",
  "business_requirements",
  "other",
] as const;
export const ACTIVITY_CATEGORIES = [
  "development",
  "research",
  "testing",
  "deployment",
  "documentation",
  "meetings_coordination",
  "decisions",
  "other",
] as const;
export const ISSUE_KINDS = ["blocker", "dependency", "decision", "approval", "risk"] as const;
export const ISSUE_STATUSES = ["open", "resolved"] as const;
export const RESOURCE_TYPES = [
  "github_repository",
  "github_pull_request",
  "figma_design",
  "google_drive",
  "notion_page",
  "technical_documentation",
  "project_brief",
  "strategy_document",
  "meeting_notes",
  "website",
  "other",
] as const;
export const PRIORITIES = ["high", "medium", "low"] as const;

export type WorkStatus = (typeof WORK_STATUSES)[number];
export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];
export type IssueKind = (typeof ISSUE_KINDS)[number];
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,79}$/;
const id = z.string().regex(ID_PATTERN, "Use lowercase letters, numbers and dashes (2–80 characters)");
const isoDate = z.iso.date({ message: "Use an ISO date, e.g. 2026-10-22" });
const text = (max: number) => z.string().trim().min(1, "Required").max(max);
const optionalText = (max: number) => z.string().trim().min(1).max(max).nullish().transform((v) => v ?? null);
const optionalDate = isoDate.nullish().transform((v) => v ?? null);

/** Absolute https URL, or a site-relative path to a published document (/documents/…). */
export const resourceUrl = z
  .string()
  .trim()
  .refine(
    (v) => /^https:\/\/[^\s]+$/.test(v) || /^\/documents\/[A-Za-z0-9._-]+\.pdf$/.test(v),
    "Use an https:// URL or /documents/<file>.pdf",
  );

export const statusChangeSchema = z.strictObject({
  fromStatus: z.enum(WORK_STATUSES).nullable(),
  toStatus: z.enum(WORK_STATUSES),
  changedAt: z.string(),
});

export const taskSchema = z.strictObject({
  id,
  title: text(160),
  description: text(1200),
  status: z.enum(WORK_STATUSES),
  category: z.enum(TASK_CATEGORIES),
  priority: z.enum(PRIORITIES).nullish().transform((v) => v ?? null),
  latestProgress: optionalText(800),
  dependency: optionalText(600),
  evidence: optionalText(600),
  dueDate: optionalDate,
  completedAt: optionalDate,
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  statusHistory: z.array(statusChangeSchema).default([]),
});

export const issueSchema = z.strictObject({
  id,
  title: text(160),
  description: text(1000),
  kind: z.enum(ISSUE_KINDS),
  status: z.enum(ISSUE_STATUSES).default("open"),
  waitingOn: optionalText(120),
  raisedOn: optionalDate,
  resolvedOn: optionalDate,
  isPublished: z.boolean().default(true),
});

export const updateSchema = z.strictObject({
  id,
  taskId: id.nullish().transform((v) => v ?? null),
  title: text(160),
  description: text(800),
  category: z.enum(ACTIVITY_CATEGORIES),
  occurredOn: isoDate,
  isPublished: z.boolean().default(true),
});

export const resourceSchema = z.strictObject({
  id,
  taskId: id.nullish().transform((v) => v ?? null),
  title: text(160),
  description: text(400),
  type: z.enum(RESOURCE_TYPES),
  url: resourceUrl,
  accessNote: optionalText(160),
  isPublished: z.boolean().default(true),
});

export const stakeholderSchema = z.strictObject({
  id,
  name: text(120),
  role: text(200),
  organisation: optionalText(120),
  isPublished: z.boolean().default(true),
});

export const projectSchema = z.strictObject({
  id,
  slug: id,
  name: text(120),
  summary: text(280),
  description: text(2000),
  businessObjective: text(1200),
  background: text(2000),
  responsibilitySummary: text(160),
  responsibilities: z.array(text(240)).min(1),
  status: z.enum(WORK_STATUSES),
  category: text(60),
  organisation: optionalText(120),
  progressSummary: text(400),
  sourceNote: text(400),
  lastVerifiedAt: isoDate,
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
  statusHistory: z.array(statusChangeSchema).default([]),
  tasks: z.array(taskSchema).default([]),
  issues: z.array(issueSchema).default([]),
  updates: z.array(updateSchema).default([]),
  resources: z.array(resourceSchema).default([]),
  stakeholders: z.array(stakeholderSchema).default([]),
});

export const profileSchema = z.strictObject({
  ownerName: text(120),
  ownerRole: optionalText(120),
  organisation: optionalText(120),
  reportPurpose: text(600),
});

export const portfolioSchema = z.strictObject({
  profile: profileSchema,
  projects: z.array(projectSchema),
});

export type StatusChange = z.infer<typeof statusChangeSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Issue = z.infer<typeof issueSchema>;
export type ProjectUpdate = z.infer<typeof updateSchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type Stakeholder = z.infer<typeof stakeholderSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Portfolio = z.infer<typeof portfolioSchema>;
/** What the content files contain before defaults are applied. */
export type ProjectInput = z.input<typeof projectSchema>;
