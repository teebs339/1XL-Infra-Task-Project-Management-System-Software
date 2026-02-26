import { format, formatDistanceToNow, isAfter, isBefore, parseISO, differenceInDays } from 'date-fns';
import type { ProjectStatus, TaskStatus, TaskPriority } from '../types';

export function formatDate(date: string): string {
  return format(parseISO(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string): string {
  return format(parseISO(date), 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
}

export function isOverdue(dueDate: string): boolean {
  return isBefore(parseISO(dueDate), new Date());
}

export function daysUntilDue(dueDate: string): number {
  return differenceInDays(parseISO(dueDate), new Date());
}

export function getProjectStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    not_started: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    on_hold: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return colors[status];
}

export function getTaskStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    in_review: 'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700',
    blocked: 'bg-red-100 text-red-700',
  };
  return colors[status];
}

export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
  };
  return colors[priority];
}

export function getPriorityDot(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: 'bg-gray-400',
    medium: 'bg-blue-400',
    high: 'bg-amber-400',
    critical: 'bg-red-500',
  };
  return colors[priority];
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-emerald-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-amber-500';
  return 'bg-red-500';
}

export function formatStatus(status: string): string {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateCSV(headers: string[], rows: string[][]): string {
  const csvRows = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ];
  return csvRows.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function calculateProjectProgress(tasks: { progress: number }[]): number {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, t) => sum + t.progress, 0);
  return Math.round(total / tasks.length);
}
