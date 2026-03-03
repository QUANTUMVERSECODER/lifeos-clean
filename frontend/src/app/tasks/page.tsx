"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AlertTriangle, Clock, CheckCircle, CalendarDays } from 'lucide-react';

interface Task {
    id: string;
    task_name: string;
    tag: string | null;
    priority: string;
    status: string;
    deadline: string | null;
}

export default function Tasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');
    const [newTag, setNewTag] = useState('');
    const [priority, setPriority] = useState('medium');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterTag, setFilterTag] = useState<string>('all');
    const [showOnlyCompleted, setShowOnlyCompleted] = useState<boolean>(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks/');
            setTasks(res.data);
        } catch (err) {
            console.error("Failed to load tasks", err);
        }
    };

    const handleAddTask = async () => {
        if (!newTask) return;
        setLoading(true);
        try {
            await api.post('/tasks/', {
                task_name: newTask,
                tag: newTag.trim() || null,
                priority: priority,
                status: 'pending',
                deadline: deadline ? new Date(deadline).toISOString() : null
            });
            setNewTask('');
            setNewTag('');
            setDeadline('');
            fetchTasks();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (task: Task) => {
        const newStatus = task.status === 'pending' ? 'completed' : 'pending';
        // Optimistic UI update
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        try {
            await api.put(`/tasks/${task.id}`, {
                status: newStatus
            });
        } catch (err) {
            console.error("Failed to toggle task", err);
            // Revert state
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
            alert("Failed to update task status. Please try again.");
            fetchTasks(); // fallback sync
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (err) {
            console.error("Failed to delete task", err);
            fetchTasks(); // fallback
        }
    };

    // Extract unique tags for the filter dropdown
    const uniqueTags = Array.from(new Set(tasks.map(t => t.tag).filter(Boolean))) as string[];

    const filteredTasks = tasks.filter(t => {
        if (!showOnlyCompleted && t.status === 'completed') return false; // Hide completed by default
        if (showOnlyCompleted && t.status !== 'completed') return false;  // Hide pending if toggled
        if (filterTag !== 'all' && t.tag !== filterTag) return false;
        return true;
    });

    const getTagColor = (tag: string) => {
        // Simple hash to color array mapping
        const colors = [
            'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'bg-rose-500/20 text-rose-400 border-rose-500/30',
            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            'bg-amber-500/20 text-amber-400 border-amber-500/30',
            'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            'bg-violet-500/20 text-violet-400 border-violet-500/30'
        ];
        let hash = 0;
        for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const isOverdue = (taskDeadline: string | null) => {
        if (!taskDeadline) return false;
        return new Date(taskDeadline) < new Date();
    };

    const getBorderClass = (task: Task) => {
        if (task.status === 'completed') return 'border-green-500/30 opacity-60';
        if (isOverdue(task.deadline)) return 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
        return 'border-slate-700 hover:border-violet-500/50';
    };

    const PriorityIcon = ({ level }: { level: string }) => {
        if (level === 'high') return <AlertTriangle className="w-4 h-4 text-red-500" />;
        if (level === 'medium') return <Clock className="w-4 h-4 text-amber-500" />;
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    };

    return (
        <div className="min-h-screen p-6 lg:p-12 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-left-8 duration-500">
            <h1 className="text-3xl font-bold text-white mb-8">Tasks</h1>

            {/* Add Task Box */}
            <div className="glass-card mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Add New Task</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="md:col-span-2">
                        <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} className="input-field w-full" placeholder="Task Name (e.g. Finish Calculus Homework)" />
                    </div>
                    <div>
                        <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} className="input-field w-full" placeholder="Tag (e.g. College)" />
                    </div>
                    <div>
                        <select value={priority} onChange={e => setPriority(e.target.value)} className="input-field w-full appearance-none bg-slate-900 border-slate-700">
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Deadline (Optional)</label>
                        <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="input-field w-full" />
                    </div>
                </div>
                <button onClick={handleAddTask} disabled={loading || !newTask} className="btn-primary w-full disabled:opacity-50">
                    {loading ? 'Adding...' : 'Add Task'}
                </button>
            </div>

            {/* Task List Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <span className="text-slate-400 text-sm">Filter by Tag:</span>
                    <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className="input-field py-1 text-sm bg-slate-800 border-slate-700">
                        <option value="all">All Tags</option>
                        {uniqueTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-slate-400 text-sm cursor-pointer select-none">Show Completed Only</label>
                    <input
                        type="checkbox"
                        checked={showOnlyCompleted}
                        onChange={e => setShowOnlyCompleted(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500 bg-slate-800 cursor-pointer"
                    />
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
                {filteredTasks.length === 0 ? <p className="text-center text-slate-500 py-8">No tasks found matching your criteria.</p> : null}
                {filteredTasks.map((task) => (
                    <div key={task.id} className={`bg-slate-900/40 border p-4 rounded-xl flex justify-between items-center transition-colors ${getBorderClass(task)}`}>
                        <div className="flex items-center gap-4 flex-1">
                            <input
                                type="checkbox"
                                checked={task.status === 'completed'}
                                onChange={() => handleToggleTask(task)}
                                className="w-5 h-5 rounded cursor-pointer border-slate-600 text-violet-500 focus:ring-violet-500 bg-slate-800"
                            />
                            <div className="flex items-center gap-3 flex-wrap">
                                <h4 className={`font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                    {task.task_name}
                                </h4>
                                {task.tag && (
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getTagColor(task.tag)}`}>
                                        {task.tag}
                                    </span>
                                )}
                                <div className="flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-800 border border-slate-700 rounded capitalize">
                                    <PriorityIcon level={task.priority} />
                                    <span>{task.priority}</span>
                                </div>
                                {task.deadline && (
                                    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${isOverdue(task.deadline) && task.status === 'pending' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                        <CalendarDays className="w-3 h-3" />
                                        <span>{new Date(task.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-slate-500 hover:text-red-400 ml-4 p-2 transition-colors flex flex-col justify-center"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
