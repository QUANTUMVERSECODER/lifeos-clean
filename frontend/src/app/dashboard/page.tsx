"use client";

import { useState, useEffect } from 'react';
import { XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { api, mlApi } from '@/lib/api';

export default function Dashboard() {
    const [metrics, setMetrics] = useState({
        burnout: 0,
        hasSufficientData: false,
        pending: 0,
        completed: 0,
        percent: 0,

        calsToday: 0,
        calsTarget: 0,
        calsRemaining: 0,
        proteinToday: 0,
        proteinTarget: 0,
        sleepLastNight: null as number | null,
        sleepWeeklyAvg: null as number | null,

        sleepTrend: [] as { day: string, hours: number }[],
        taskTrend: [] as { day: string, tasks: number }[],
        burnoutForecast: [] as { day: string, score: number }[],
        productivityInsight: ""
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/metrics/dashboard');
                const data = res.data;

                const safeBurnout = data.latest_burnout_score || 0;

                setMetrics({
                    burnout: Number((safeBurnout * 100).toFixed(1)),
                    hasSufficientData: data.has_sufficient_data,
                    pending: data.pending_tasks_total,
                    completed: data.completed_tasks_7d,
                    percent: data.completion_percentage_7d,

                    calsToday: data.cals_today,
                    calsTarget: data.cals_target,
                    calsRemaining: data.cals_remaining,
                    proteinToday: data.protein_today,
                    proteinTarget: data.protein_target,
                    sleepLastNight: data.sleep_last_night,
                    sleepWeeklyAvg: data.sleep_weekly_avg,

                    sleepTrend: data.weekly_sleep_trend,
                    taskTrend: data.weekly_task_completion_trend,
                    burnoutForecast: data.burnout_forecast_trend || [],
                    productivityInsight: data.productivity_insight || ""
                });
            } catch (err) {
                console.error("Dashboard API Error:", err);
            }
        };
        fetchDashboardData();
    }, []);

    return (
        <div className="min-h-screen p-6 lg:p-12 max-w-7xl mx-auto space-y-8">

            {/* Header section */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Architect</h1>
                    <p className="text-slate-400">Here&apos;s your personal life telemetry for today.</p>
                </div>
                <div className="flex gap-4">
                    <button className="glass-card !py-2 !px-4 hover:border-violet-500/50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        Systems Nominal
                    </button>
                </div>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="glass-card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:bg-fuchsia-500/20 transition-all"></div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Burnout Probability</h3>
                    {metrics.hasSufficientData ? (
                        <>
                            <div className="text-4xl font-bold text-white">{metrics.burnout}%</div>
                            <div className="mt-4 text-xs text-fuchsia-400 flex items-center">
                                <span>Recent XGBoost Scan</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-2xl font-bold text-slate-300 mt-2">Awaiting Data</div>
                            <div className="mt-4 text-xs text-slate-500 flex items-center">
                                <span>Not enough logs to compute burnout.</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="glass-card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Daily Calorie Progress</h3>
                    <div className="text-4xl font-bold text-white">
                        {metrics.calsTarget > 0 ? `${Math.round((metrics.calsToday / metrics.calsTarget) * 100)}%` : "0%"}
                    </div>
                    <div className="mt-4 text-xs text-emerald-400 flex items-center">
                        <span>{metrics.calsToday} kcal logged</span>
                    </div>
                </div>

                <div className="glass-card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all"></div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Weekly Task Completion</h3>
                    <div className="text-4xl font-bold text-white">{metrics.percent}%</div>
                    <div className="mt-4 text-xs text-violet-400 flex items-center">
                        <span>{metrics.completed} Done</span>
                    </div>
                </div>

                <div className="glass-card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/20 transition-all"></div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Pending Objectives</h3>
                    <div className="text-4xl font-bold text-white">{metrics.pending}</div>
                    <div className="mt-4 text-xs text-sky-400 flex items-center">
                        <span>Waiting for action</span>
                    </div>
                </div>
            </div>

            {/* Health Overview */}
            <div className="glass-card mt-8">
                <h3 className="text-lg font-medium text-white mb-6">Health Overview</h3>
                {metrics.calsToday === 0 && metrics.sleepLastNight === null ? (
                    <div className="text-slate-500 text-sm py-8 text-center bg-slate-800/20 border border-slate-700/30 rounded-lg">
                        No health logs recorded today.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <div className="text-xs text-slate-400 mb-1">Diet (Calories)</div>
                            <div className="text-xl font-semibold text-white">{metrics.calsToday} / {metrics.calsTarget}</div>
                            <div className="text-xs text-slate-500 mt-1">{metrics.calsRemaining} kcal remaining</div>
                        </div>
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <div className="text-xs text-slate-400 mb-1">Diet (Protein)</div>
                            <div className="text-xl font-semibold text-white">{metrics.proteinToday}g / {metrics.proteinTarget}g</div>
                            <div className="text-xs text-slate-500 mt-1">Daily target</div>
                        </div>
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <div className="text-xs text-slate-400 mb-1">Rest & Recovery</div>
                            <div className="text-xl font-semibold text-white">{metrics.sleepLastNight || 0} hrs</div>
                            <div className="text-xs text-slate-500 mt-1">Logged last night</div>
                        </div>
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <div className="text-xs text-slate-400 mb-1">Weekly Sleep Avg</div>
                            <div className="text-xl font-semibold text-white">{metrics.sleepWeeklyAvg || 0} hrs</div>
                            <div className="text-xs text-slate-500 mt-1">Over 7 days</div>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Productivity Insight */}
            {metrics.productivityInsight && (
                <div className="glass-card mt-8 bg-indigo-500/5 border-indigo-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        <h3 className="text-lg font-medium text-white">Peak Productivity Insight</h3>
                    </div>
                    <p className="text-slate-300">{metrics.productivityInsight}</p>
                </div>
            )}

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="glass-card">
                    <h3 className="text-lg font-medium text-white mb-6">Rest & Recovery (Past 7 Days)</h3>
                    <div className="h-64">
                        {metrics.sleepTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.sleepTrend}>
                                    <defs>
                                        <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" stroke="#64748b" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSleep)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 text-sm bg-slate-800/20 border border-slate-700/30 rounded-lg">No sleep logs found. Track health to populate.</div>
                        )}
                    </div>
                </div>

                <div className="glass-card">
                    <h3 className="text-lg font-medium text-white mb-6">Tasks Completed (Past 7 Days)</h3>
                    <div className="h-64">
                        {metrics.taskTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.taskTrend}>
                                    <defs>
                                        <linearGradient id="colorTask" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" stroke="#64748b" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="tasks" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorTask)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 text-sm bg-slate-800/20 border border-slate-700/30 rounded-lg">No task completion trend recorded this week.</div>
                        )}
                    </div>
                </div>
                <div className="glass-card">
                    <h3 className="text-lg font-medium text-white mb-6">Burnout Forecast (Next 3 Days)</h3>
                    <div className="h-64">
                        {metrics.burnoutForecast.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.burnoutForecast}>
                                    <defs>
                                        <linearGradient id="colorBurnout" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" stroke="#64748b" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorBurnout)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 text-sm bg-slate-800/20 border border-slate-700/30 rounded-lg">Awaiting ML scoring data to compute linear forecast.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
