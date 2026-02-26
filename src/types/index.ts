export type UserRole = 'admin' | 'project_manager' | 'team_member';

export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationType = 'task_assigned' | 'task_updated' | 'deadline_reminder' | 'comment_added' | 'project_updated' | 'status_changed';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar: string;
  department: string;
  phone: string;
  joinDate: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  managerId: string;
  teamMemberIds: string[];
  budget: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  reporterId: string;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  estimatedHours: number;
  loggedHours: number;
  progress: number;
  subtasks: SubTask[];
  comments: Comment[];
  attachments: Attachment[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: 'project' | 'task' | 'user';
  entityId: string;
  details: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
  upcomingDeadlines: number;
  projectProgress: number;
}
