import { useState, useMemo } from 'react';
import { Plus, Search, CheckSquare, Calendar, Clock, MessageSquare, ChevronDown, ChevronRight, X, Paperclip } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import type { Task, TaskStatus, TaskPriority } from '../types';
import { formatDate, formatStatus, getTaskStatusColor, getPriorityColor, isOverdue, formatRelativeTime } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

export default function Tasks() {
  const { currentUser, hasRole } = useAuth();
  const { tasks, projects, users, addTask, updateTask, deleteTask, addActivityLog, addNotification } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  const emptyForm = {
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    projectId: '',
    assigneeId: '',
    startDate: '',
    dueDate: '',
    estimatedHours: 0,
    tags: '',
  };
  const [form, setForm] = useState(emptyForm);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (currentUser?.role === 'team_member') {
      result = result.filter(t => t.assigneeId === currentUser.id);
    } else if (currentUser?.role === 'project_manager') {
      const pmProjects = projects.filter(p => p.managerId === currentUser.id).map(p => p.id);
      result = result.filter(t => pmProjects.includes(t.projectId));
    }

    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter);
    if (projectFilter !== 'all') result = result.filter(t => t.projectId === projectFilter);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tasks, projects, currentUser, statusFilter, priorityFilter, projectFilter, searchQuery]);

  const availableProjects = useMemo(() => {
    if (currentUser?.role === 'admin') return projects;
    if (currentUser?.role === 'project_manager') return projects.filter(p => p.managerId === currentUser.id);
    return projects.filter(p => p.teamMemberIds.includes(currentUser?.id || ''));
  }, [projects, currentUser]);

  const resetForm = () => setForm(emptyForm);

  const openCreate = () => {
    resetForm();
    setEditTask(null);
    setShowCreateModal(true);
  };

  const openEdit = (task: Task) => {
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      startDate: task.startDate,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      tags: task.tags.join(', '),
    });
    setEditTask(task);
    setShowCreateModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      projectId: form.projectId,
      assigneeId: form.assigneeId,
      reporterId: currentUser!.id,
      startDate: form.startDate,
      dueDate: form.dueDate,
      estimatedHours: form.estimatedHours,
      loggedHours: editTask?.loggedHours || 0,
      progress: editTask?.progress || 0,
      subtasks: editTask?.subtasks || [],
      comments: editTask?.comments || [],
      attachments: editTask?.attachments || [],
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      completedDate: form.status === 'completed' ? new Date().toISOString().split('T')[0] : editTask?.completedDate,
    };

    if (editTask) {
      updateTask(editTask.id, taskData);
      addActivityLog({
        userId: currentUser!.id,
        action: 'updated',
        entityType: 'task',
        entityId: editTask.id,
        details: `Updated task "${form.title}"`,
      });
    } else {
      const newTask = addTask(taskData);
      addActivityLog({
        userId: currentUser!.id,
        action: 'created',
        entityType: 'task',
        entityId: newTask.id,
        details: `Created task "${form.title}"`,
      });
      if (form.assigneeId && form.assigneeId !== currentUser!.id) {
        const project = projects.find(p => p.id === form.projectId);
        addNotification({
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned to "${form.title}" in ${project?.name || 'a project'}.`,
          userId: form.assigneeId,
          relatedId: newTask.id,
          read: false,
        });
      }
    }
    setShowCreateModal(false);
  };

  const handleDelete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    deleteTask(id);
    addActivityLog({
      userId: currentUser!.id,
      action: 'deleted',
      entityType: 'task',
      entityId: id,
      details: `Deleted task "${task?.title}"`,
    });
    setDeleteConfirm(null);
    if (viewTask?.id === id) setViewTask(null);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateTask(taskId, {
      status: newStatus,
      progress: newStatus === 'completed' ? 100 : task.progress,
      completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
    });
    addActivityLog({
      userId: currentUser!.id,
      action: 'status_changed',
      entityType: 'task',
      entityId: taskId,
      details: `Changed "${task.title}" status to "${formatStatus(newStatus)}"`,
    });
  };

  const handleAddComment = (taskId: string) => {
    if (!newComment.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const comment = {
      id: `c-${uuidv4().slice(0, 8)}`,
      userId: currentUser!.id,
      content: newComment,
      createdAt: new Date().toISOString(),
    };
    updateTask(taskId, { comments: [...task.comments, comment] });
    setNewComment('');
    addActivityLog({
      userId: currentUser!.id,
      action: 'comment',
      entityType: 'task',
      entityId: taskId,
      details: `Commented on "${task.title}"`,
    });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const completedCount = updatedSubtasks.filter(st => st.completed).length;
    const progress = updatedSubtasks.length > 0 ? Math.round((completedCount / updatedSubtasks.length) * 100) : task.progress;
    updateTask(taskId, { subtasks: updatedSubtasks, progress });
  };

  const boardColumns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'To Do', color: 'border-t-gray-400' },
    { status: 'in_progress', label: 'In Progress', color: 'border-t-blue-500' },
    { status: 'in_review', label: 'In Review', color: 'border-t-purple-500' },
    { status: 'completed', label: 'Completed', color: 'border-t-emerald-500' },
    { status: 'blocked', label: 'Blocked', color: 'border-t-red-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">{filteredTasks.length} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-sm font-medium ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>List</button>
            <button onClick={() => setViewMode('board')} className={`px-3 py-1.5 text-sm font-medium ${viewMode === 'board' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Board</button>
          </div>
          {hasRole(['admin', 'project_manager']) && (
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Projects</option>
          {availableProjects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Board View */}
      {viewMode === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {boardColumns.map(col => {
            const columnTasks = filteredTasks.filter(t => t.status === col.status);
            return (
              <div key={col.status} className={`flex-shrink-0 w-72 bg-gray-50 rounded-xl border-t-4 ${col.color}`}>
                <div className="p-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                  <span className="bg-gray-200 text-gray-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{columnTasks.length}</span>
                </div>
                <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {columnTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <div key={task.id} onClick={() => setViewTask(task)} className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                          {isOverdue(task.dueDate) && task.status !== 'completed' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Overdue</span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h4>
                        <p className="text-xs text-gray-500 mb-2">{project?.name}</p>
                        <ProgressBar progress={task.progress} size="sm" showLabel={false} />
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                          {assignee && (
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700" title={assignee.name}>
                              {assignee.avatar}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        filteredTasks.length === 0 ? (
          <EmptyState icon={<CheckSquare className="w-8 h-8" />} title="No tasks found" description="Create a new task or adjust your filters." action={
            hasRole(['admin', 'project_manager']) ? (
              <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">
                <Plus className="w-4 h-4" /> Create Task
              </button>
            ) : undefined
          } />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Task</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Assignee</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <button onClick={() => setViewTask(task)} className="font-medium text-gray-900 hover:text-indigo-600 text-left">{task.title}</button>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                            {task.subtasks.length > 0 && <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks</span>}
                            {task.comments.length > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{task.comments.length}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{project?.name}</td>
                        <td className="px-4 py-3">
                          <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer ${getTaskStatusColor(task.status)}`}>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                        </td>
                        <td className="px-4 py-3">
                          {assignee && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{assignee.avatar}</div>
                              <span className="text-xs text-gray-600">{assignee.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {formatDate(task.dueDate)}
                            {isOverdue(task.dueDate) && task.status !== 'completed' && ' (Overdue)'}
                          </span>
                        </td>
                        <td className="px-4 py-3 w-32">
                          <ProgressBar progress={task.progress} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-600" title="Edit">
                              <CheckSquare className="w-3.5 h-3.5" />
                            </button>
                            {hasRole(['admin', 'project_manager']) && (
                              <button onClick={() => setDeleteConfirm(task.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Task Detail Modal */}
      <Modal isOpen={!!viewTask} onClose={() => setViewTask(null)} title="Task Details" size="xl">
        {viewTask && (() => {
          const task = tasks.find(t => t.id === viewTask.id) || viewTask;
          const assignee = users.find(u => u.id === task.assigneeId);
          const reporter = users.find(u => u.id === task.reporterId);
          const project = projects.find(p => p.id === task.projectId);
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{task.title}</h3>
                <p className="text-gray-500 mt-2">{task.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>{formatStatus(task.status)}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Priority</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Project</p>
                  <p className="text-sm font-medium text-gray-900">{project?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Progress</p>
                  <ProgressBar progress={task.progress} size="sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Assignee</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{assignee?.avatar}</div>
                    <span className="text-sm text-gray-900">{assignee?.name}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Reporter</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700">{reporter?.avatar}</div>
                    <span className="text-sm text-gray-900">{reporter?.name}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Start Date</p>
                  <p className="text-sm text-gray-900">{formatDate(task.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Due Date</p>
                  <p className={`text-sm font-medium ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-600' : 'text-gray-900'}`}>{formatDate(task.dueDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estimated Hours</p>
                  <p className="text-sm text-gray-900">{task.estimatedHours}h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Logged Hours</p>
                  <p className="text-sm text-gray-900">{task.loggedHours}h</p>
                </div>
              </div>

              {/* Subtasks */}
              {task.subtasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</h4>
                  <div className="space-y-1.5">
                    {task.subtasks.map(st => (
                      <div key={st.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => handleToggleSubtask(task.id, st.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className={`text-sm ${st.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{st.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {task.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Comments ({task.comments.length})</h4>
                <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                  {task.comments.map(comment => {
                    const commentUser = users.find(u => u.id === comment.userId);
                    return (
                      <div key={comment.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">{commentUser?.avatar}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{commentUser?.name}</span>
                            <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{comment.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment(task.id)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={() => handleAddComment(task.id)} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">Send</button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button onClick={() => { openEdit(task); setViewTask(null); }} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">Edit Task</button>
                {hasRole(['admin', 'project_manager']) && (
                  <button onClick={() => { setDeleteConfirm(task.id); setViewTask(null); }} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">Delete</button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={editTask ? 'Edit Task' : 'Create New Task'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Describe the task..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select required value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select project</option>
                {availableProjects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee *</label>
              <select required value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select assignee</option>
                {users.filter(u => u.isActive).map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TaskStatus })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="date" required value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input type="number" min={0} value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="frontend, backend (comma separated)" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600">{editTask ? 'Update Task' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Delete Task" message="Are you sure you want to delete this task? This action cannot be undone." confirmText="Delete" />
    </div>
  );
}
