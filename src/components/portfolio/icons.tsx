import {
  BookOpen,
  ClipboardList,
  FileChartColumn,
  FileText,
  PenTool,
  FolderGit2,
  GitPullRequest,
  Globe,
  HardDrive,
  Link2,
  NotebookTabs,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ResourceType } from "@/domain/schema";

/** One icon per resource type, used everywhere resources appear. */
export const RESOURCE_ICON: Record<ResourceType, LucideIcon> = {
  github_repository: FolderGit2,
  github_pull_request: GitPullRequest,
  figma_design: PenTool,
  google_drive: HardDrive,
  notion_page: NotebookTabs,
  technical_documentation: BookOpen,
  project_brief: ClipboardList,
  strategy_document: FileChartColumn,
  meeting_notes: Users,
  website: Globe,
  other: Link2,
};

export const DocumentIcon = FileText;
