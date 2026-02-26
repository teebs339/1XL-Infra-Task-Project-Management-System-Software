import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Project, Task, User, Notification, ActivityLog } from '../types';
import { seedUsers, seedProjects, seedTasks, seedNotifications, seedActivityLogs } from '../data/seedData';
import { v4 as uuidv4 } from 'uuid';

interface DataContextType {
  // Users
  users: User[];
  addUser: (user: Omit<User, 'id'>) => User;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;

  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTaskById: (id: string) => Task | undefined;
  getTasksByProject: (projectId: string) => Task[];
  getTasksByAssignee: (userId: string) => Task[];

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  getUnreadCount: (userId: string) => number;

  // Activity Logs
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  const saved = localStorage.getItem(key);
  if (saved) {
    return JSON.parse(saved);
  }
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => loadFromStorage('tpms_users', seedUsers));
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage('tpms_projects', seedProjects));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('tpms_tasks', seedTasks));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage('tpms_notifications', seedNotifications));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadFromStorage('tpms_activity_logs', seedActivityLogs));

  useEffect(() => { localStorage.setItem('tpms_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('tpms_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('tpms_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('tpms_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('tpms_activity_logs', JSON.stringify(activityLogs)); }, [activityLogs]);

  // Users
  const addUser = useCallback((userData: Omit<User, 'id'>): User => {
    const newUser: User = { ...userData, id: `user-${uuidv4().slice(0, 8)}` };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  }, []);

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const getUserById = useCallback((id: string) => {
    return users.find(u => u.id === id);
  }, [users]);

  // Projects
  const addProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...projectData,
      id: `proj-${uuidv4().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  }, []);

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  }, []);

  const getProjectById = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  // Tasks
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: `task-${uuidv4().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const getTaskById = useCallback((id: string) => {
    return tasks.find(t => t.id === id);
  }, [tasks]);

  const getTasksByProject = useCallback((projectId: string) => {
    return tasks.filter(t => t.projectId === projectId);
  }, [tasks]);

  const getTasksByAssignee = useCallback((userId: string) => {
    return tasks.filter(t => t.assigneeId === userId);
  }, [tasks]);

  // Notifications
  const addNotification = useCallback((notifData: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotif: Notification = {
      ...notifData,
      id: `notif-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback((userId: string) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, read: true } : n));
  }, []);

  const getUnreadCount = useCallback((userId: string) => {
    return notifications.filter(n => n.userId === userId && !n.read).length;
  }, [notifications]);

  // Activity Logs
  const addActivityLog = useCallback((logData: Omit<ActivityLog, 'id' | 'createdAt'>) => {
    const newLog: ActivityLog = {
      ...logData,
      id: `log-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setActivityLogs(prev => [newLog, ...prev]);
  }, []);

  return (
    <DataContext.Provider value={{
      users, addUser, updateUser, deleteUser, getUserById,
      projects, addProject, updateProject, deleteProject, getProjectById,
      tasks, addTask, updateTask, deleteTask, getTaskById, getTasksByProject, getTasksByAssignee,
      notifications, addNotification, markNotificationRead, markAllNotificationsRead, getUnreadCount,
      activityLogs, addActivityLog,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
