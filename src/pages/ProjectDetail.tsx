import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowLeft, Calendar, DollarSign, Users, CheckSquare, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ui/ProgressBar';
import { formatDate, formatStatus, getProjectStatusColor, getPriorityColor, getTaskStatusColor, formatCurrency, isOverdue } from '../utils/helpers';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProjectById, getTasksByProject, users } = useData();
  const { currentUser } = useAuth();

  const project = getProjectById(id || '');
  const projectTasks = useMemo(() => getTasksByProject(id || ''), [id, getTasksByProject]);
  const manager = users.find(u => u.id === project?.managerId);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Project Not Found</h2>
          <p className="text-gray-500 mt-2">The project you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const taskStats = useMemo(() => {
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    const inProgress = projectTasks.filter(t => t.status === 'in_progress').length;
    const overdue = projectTasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate)).length;
    const totalEstimated = projectTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const totalLogged = projectTasks.reduce((s, t) => s + t.loggedHours, 0);
    return { total, completed, inProgress, overdue, totalEstimated, totalLogged };
  }, [projectTasks]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/projects')} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 mt-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProjectStatusColor(project.status)}`}>{formatStatus(project.status)}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>{project.priority}</span>
          </div>
          <p className="text-gray-500">{project.description}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Calendar className="w-4 h-4" /><span className="text-xs">Timeline</span></div>
          <p className="text-sm font-medium text-gray-900">{formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><DollarSign className="w-4 h-4" /><span className="text-xs">Budget</span></div>
          <p className="text-sm font-medium text-gray-900">{formatCurrency(project.budget)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Users className="w-4 h-4" /><span className="text-xs">Manager</span></div>
          <p className="text-sm font-medium text-gray-900">{manager?.name}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><CheckSquare className="w-4 h-4" /><span className="text-xs">Tasks</span></div>
          <p className="text-sm font-medium text-gray-900">{taskStats.completed}/{taskStats.total} completed</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Project Progress</h3>
        <ProgressBar progress={project.progress} size="lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{taskStats.completed}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{taskStats.totalLogged}h</p>
            <p className="text-xs text-gray-500">Hours Logged</p>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Team Members</h3>
        <div className="flex flex-wrap gap-3">
          {project.teamMemberIds.map(memberId => {
            const member = users.find(u => u.id === memberId);
            if (!member) return null;
            const memberTasks = projectTasks.filter(t => t.assigneeId === memberId);
            const memberCompleted = memberTasks.filter(t => t.status === 'completed').length;
            return (
              <div key={memberId} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">{member.avatar}</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{memberCompleted}/{memberTasks.length} tasks done</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{tag}</span>
          ))}
        </div>
      )}

      {/* Task List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Tasks ({projectTasks.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Progress</th>
              </tr>
            </thead>
            <tbody>
              {projectTasks.map(task => {
                const assignee = users.find(u => u.id === task.assigneeId);
                return (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{task.title}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>{formatStatus(task.status)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                    </td>
                    <td className="px-6 py-3">
                      {assignee && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{assignee.avatar}</div>
                          <span className="text-xs text-gray-600">{assignee.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                    <td className="px-6 py-3 w-32"><ProgressBar progress={task.progress} size="sm" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
