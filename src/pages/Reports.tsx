import { useState, useMemo } from 'react';
import { FileText, Download, BarChart3, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatDate, formatStatus, formatCurrency, generateCSV, downloadFile, isOverdue } from '../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type ReportType = 'project_summary' | 'task_completion' | 'team_productivity' | 'deadline_adherence';

export default function Reports() {
  const { currentUser } = useAuth();
  const { projects, tasks, users } = useData();
  const [reportType, setReportType] = useState<ReportType>('project_summary');
  const [dateRange, setDateRange] = useState({ start: '2025-01-01', end: '2026-12-31' });

  const reportData = useMemo(() => {
    switch (reportType) {
      case 'project_summary':
        return projects.map(p => {
          const projectTasks = tasks.filter(t => t.projectId === p.id);
          const completed = projectTasks.filter(t => t.status === 'completed').length;
          const manager = users.find(u => u.id === p.managerId);
          return {
            name: p.name,
            status: formatStatus(p.status),
            progress: p.progress,
            tasks: projectTasks.length,
            completed,
            budget: p.budget,
            manager: manager?.name || 'N/A',
            startDate: p.startDate,
            endDate: p.endDate,
          };
        });

      case 'task_completion':
        return tasks.map(t => {
          const project = projects.find(p => p.id === t.projectId);
          const assignee = users.find(u => u.id === t.assigneeId);
          return {
            title: t.title,
            project: project?.name || 'N/A',
            assignee: assignee?.name || 'N/A',
            status: formatStatus(t.status),
            priority: t.priority,
            progress: t.progress,
            dueDate: t.dueDate,
            overdue: t.status !== 'completed' && isOverdue(t.dueDate) ? 'Yes' : 'No',
            estimatedHours: t.estimatedHours,
            loggedHours: t.loggedHours,
          };
        });

      case 'team_productivity':
        return users.filter(u => u.isActive).map(u => {
          const userTasks = tasks.filter(t => t.assigneeId === u.id);
          const completed = userTasks.filter(t => t.status === 'completed').length;
          const totalEstimated = userTasks.reduce((s, t) => s + t.estimatedHours, 0);
          const totalLogged = userTasks.reduce((s, t) => s + t.loggedHours, 0);
          const overdue = userTasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate)).length;
          return {
            name: u.name,
            role: formatStatus(u.role),
            department: u.department,
            totalTasks: userTasks.length,
            completed,
            completionRate: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0,
            estimatedHours: totalEstimated,
            loggedHours: totalLogged,
            overdueTasks: overdue,
          };
        });

      case 'deadline_adherence':
        return projects.map(p => {
          const projectTasks = tasks.filter(t => t.projectId === p.id);
          const completedTasks = projectTasks.filter(t => t.status === 'completed');
          const onTime = completedTasks.filter(t => t.completedDate && t.completedDate <= t.dueDate).length;
          const late = completedTasks.length - onTime;
          const overdueCurrent = projectTasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate)).length;
          return {
            project: p.name,
            totalTasks: projectTasks.length,
            completedOnTime: onTime,
            completedLate: late,
            currentlyOverdue: overdueCurrent,
            adherenceRate: completedTasks.length > 0 ? Math.round((onTime / completedTasks.length) * 100) : 100,
          };
        });

      default:
        return [];
    }
  }, [reportType, projects, tasks, users, dateRange]);

  const chartData = useMemo(() => {
    if (reportType === 'project_summary') {
      return projects.filter(p => p.status !== 'cancelled').map(p => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
        progress: p.progress,
        budget: p.budget / 1000,
      }));
    }
    if (reportType === 'team_productivity') {
      return (reportData as { name: string; completionRate: number; totalTasks: number }[]).map(d => ({
        name: d.name.split(' ')[0],
        rate: d.completionRate,
        tasks: d.totalTasks,
      }));
    }
    return [];
  }, [reportType, reportData, projects]);

  const exportCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const rows = reportData.map(d => Object.values(d).map(v => String(v)));
    const csv = generateCSV(headers, rows);
    downloadFile(csv, `${reportType}_report.csv`, 'text/csv');
  };

  const exportPDF = () => {
    if (reportData.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(formatStatus(reportType) + ' Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    const headers = Object.keys(reportData[0]);
    const rows = reportData.map(d => Object.values(d).map(v => String(v)));

    autoTable(doc, {
      head: [headers.map(h => h.charAt(0).toUpperCase() + h.slice(1).replace(/([A-Z])/g, ' $1'))],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`${reportType}_report.pdf`);
  };

  const exportExcel = () => {
    if (reportData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}_report.xlsx`);
  };

  const reportTypes: { value: ReportType; label: string; description: string }[] = [
    { value: 'project_summary', label: 'Project Summary', description: 'Overview of all projects with status, progress, and budget' },
    { value: 'task_completion', label: 'Task Completion', description: 'Detailed task status with assignees and deadlines' },
    { value: 'team_productivity', label: 'Team Productivity', description: 'Team member performance and workload analysis' },
    { value: 'deadline_adherence', label: 'Deadline Adherence', description: 'On-time delivery rates and overdue tracking' },
  ];

  const getTableHeaders = () => {
    if (reportData.length === 0) return [];
    return Object.keys(reportData[0]).map(key => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and export detailed reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportPDF} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={exportExcel} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {reportTypes.map(rt => (
          <button
            key={rt.value}
            onClick={() => setReportType(rt.value)}
            className={`p-4 rounded-xl border text-left transition-all ${
              reportType === rt.value
                ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <FileText className={`w-5 h-5 mb-2 ${reportType === rt.value ? 'text-indigo-600' : 'text-gray-400'}`} />
            <h3 className={`text-sm font-semibold ${reportType === rt.value ? 'text-indigo-700' : 'text-gray-900'}`}>{rt.label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{rt.description}</p>
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            {reportType === 'project_summary' ? 'Project Progress Overview' : 'Team Completion Rates'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {reportType === 'project_summary' ? (
                  <>
                    <Bar dataKey="progress" fill="#6366f1" name="Progress %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="budget" fill="#0ea5e9" name="Budget ($K)" radius={[4, 4, 0, 0]} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="rate" fill="#22c55e" name="Completion %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tasks" fill="#6366f1" name="Total Tasks" radius={[4, 4, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{reportTypes.find(r => r.value === reportType)?.label} Data</h3>
          <span className="text-sm text-gray-500">{reportData.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {getTableHeaders().map((header, i) => (
                  <th key={i} className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {typeof val === 'number' && Object.keys(row)[j].includes('budget')
                        ? formatCurrency(val)
                        : typeof val === 'number' && (Object.keys(row)[j].includes('progress') || Object.keys(row)[j].includes('Rate') || Object.keys(row)[j].includes('rate'))
                          ? `${val}%`
                          : String(val)
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
