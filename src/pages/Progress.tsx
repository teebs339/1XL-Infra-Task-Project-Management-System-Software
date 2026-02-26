import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ProgressBar from '../components/ui/ProgressBar';
import { formatStatus, getProjectStatusColor, isOverdue, formatDate, getPriorityColor } from '../utils/helpers';

const COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Progress() {
  const { currentUser } = useAuth();
  const { projects, tasks, users } = useData();

  const relevantProjects = useMemo(() => {
    if (currentUser?.role === 'admin') return projects;
    if (currentUser?.role === 'project_manager') return projects.filter(p => p.managerId === currentUser.id);
    return projects.filter(p => p.teamMemberIds.includes(currentUser?.id || ''));
  }, [projects, currentUser]);

  const relevantTasks = useMemo(() => {
    if (currentUser?.role === 'admin') return tasks;
    if (currentUser?.role === 'project_manager') {
      const pmProjectIds = projects.filter(p => p.managerId === currentUser.id).map(p => p.id);
      return tasks.filter(t => pmProjectIds.includes(t.projectId));
    }
    return tasks.filter(t => t.assigneeId === currentUser?.id);
  }, [tasks, projects, currentUser]);

  const overallStats = useMemo(() => {
    const total = relevantTasks.length;
    const completed = relevantTasks.filter(t => t.status === 'completed').length;
    const inProgress = relevantTasks.filter(t => t.status === 'in_progress').length;
    const overdue = relevantTasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate)).length;
    const avgProgress = total > 0 ? Math.round(relevantTasks.reduce((sum, t) => sum + t.progress, 0) / total) : 0;
    const totalEstimated = relevantTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const totalLogged = relevantTasks.reduce((sum, t) => sum + t.loggedHours, 0);
    return { total, completed, inProgress, overdue, avgProgress, totalEstimated, totalLogged, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [relevantTasks]);

  const projectProgressData = useMemo(() => {
    return relevantProjects.filter(p => p.status !== 'cancelled').map(p => {
      const projectTasks = tasks.filter(t => t.projectId === p.id);
      const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
      const calculatedProgress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : p.progress;
      return { name: p.name.length > 25 ? p.name.slice(0, 25) + '...' : p.name, progress: calculatedProgress, tasks: projectTasks.length, completed: completedTasks, fullName: p.name };
    });
  }, [relevantProjects, tasks]);

  const memberProductivity = useMemo(() => {
    const memberIds = [...new Set(relevantTasks.map(t => t.assigneeId))];
    return memberIds.map(id => {
      const user = users.find(u => u.id === id);
      const userTasks = relevantTasks.filter(t => t.assigneeId === id);
      const completed = userTasks.filter(t => t.status === 'completed').length;
      return { name: user?.name || 'Unknown', completed, total: userTasks.length, rate: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0 };
    }).sort((a, b) => b.rate - a.rate).slice(0, 8);
  }, [relevantTasks, users]);

  const priorityBreakdown = useMemo(() => {
    const priorities = { critical: 0, high: 0, medium: 0, low: 0 };
    relevantTasks.forEach(t => { priorities[t.priority]++; });
    return Object.entries(priorities).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [relevantTasks]);

  const deadlineAdherence = useMemo(() => {
    const completedTasks = relevantTasks.filter(t => t.status === 'completed' && t.completedDate);
    let onTime = 0;
    let late = 0;
    completedTasks.forEach(t => {
      if (t.completedDate && t.completedDate <= t.dueDate) onTime++;
      else late++;
    });
    return [
      { name: 'On Time', value: onTime },
      { name: 'Late', value: late },
    ];
  }, [relevantTasks]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
        <p className="text-gray-500 mt-1">Monitor project and task completion across your team</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-indigo-600">{overallStats.completionRate}%</p>
          <p className="text-sm text-gray-500 mt-1">Overall Completion</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-emerald-600">{overallStats.completed}</p>
          <p className="text-sm text-gray-500 mt-1">Tasks Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{overallStats.inProgress}</p>
          <p className="text-sm text-gray-500 mt-1">In Progress</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-red-600">{overallStats.overdue}</p>
          <p className="text-sm text-gray-500 mt-1">Overdue Tasks</p>
        </div>
      </div>

      {/* Hours Overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Hours Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Estimated Hours</p>
            <p className="text-2xl font-bold text-gray-900">{overallStats.totalEstimated}h</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Logged Hours</p>
            <p className="text-2xl font-bold text-blue-600">{overallStats.totalLogged}h</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Efficiency</p>
            <p className="text-2xl font-bold text-emerald-600">
              {overallStats.totalEstimated > 0 ? Math.round((overallStats.totalLogged / overallStats.totalEstimated) * 100) : 0}%
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar progress={overallStats.totalEstimated > 0 ? Math.min(100, Math.round((overallStats.totalLogged / overallStats.totalEstimated) * 100)) : 0} size="lg" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Project Progress</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgressData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                <Bar dataKey="progress" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Task Priority Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {priorityBreakdown.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Productivity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Team Productivity</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="#e2e8f0" name="Total" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deadline Adherence */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Deadline Adherence</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deadlineAdherence} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project Details Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Project Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Tasks</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {relevantProjects.map(project => {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
                return (
                  <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{project.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProjectStatusColor(project.status)}`}>{formatStatus(project.status)}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{completedTasks}/{projectTasks.length}</td>
                    <td className="px-6 py-4 w-48"><ProgressBar progress={project.progress} size="sm" /></td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${isOverdue(project.endDate) && project.status !== 'completed' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(project.endDate)}
                      </span>
                    </td>
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
