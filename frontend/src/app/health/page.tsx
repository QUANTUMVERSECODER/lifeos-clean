"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Health() {
    const [loadingHealth, setLoadingHealth] = useState(false);
    const [loadingAI, setLoadingAI] = useState(false);
    const [msg, setMsg] = useState("");

    const [diet, setDiet] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [health, setHealth] = useState({ weight: '', sleepTime: '', wakeTime: '', activity: '' });
    const [goals, setGoals] = useState({ calories: '', protein: '' });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await api.get('/users/me');
                if (res.data) {
                    setGoals({
                        calories: res.data.daily_calorie_goal || '',
                        protein: res.data.daily_protein_goal || ''
                    });
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchUserData();
    }, []);

    const handleDietSubmit = async () => {
        setLoadingAI(true);
        try {
            await api.post('/health/diet-logs', {
                date: new Date().toISOString().split('T')[0],
                calories_in: diet.calories,
                protein_g: diet.protein,
                carbs_g: diet.carbs,
                fat_g: diet.fat
            });

            setMsg("Diet logged successfully.");
            setDiet({ calories: 0, protein: 0, carbs: 0, fat: 0 });
        } catch (err) {
            console.error(err);
            setMsg("Failed to save diet.");
        } finally { setLoadingAI(false); }
    };

    const handleHealthSubmit = async () => {
        setLoadingHealth(true);
        setMsg('');
        try {
            await api.post('/health/health-logs', {
                date: new Date().toISOString().split('T')[0],
                weight_kg: health.weight ? parseFloat(health.weight) : null,
                sleep_time: health.sleepTime || null,
                wake_time: health.wakeTime || null,
                physical_activity_minutes: health.activity ? parseInt(health.activity) : null
            });
            setMsg("Health metrics logged.");
            setHealth({ weight: '', sleepTime: '', wakeTime: '', activity: '' });
        } catch (err) {
            console.error(err);
            setMsg("Failed to save health metrics.");
        } finally { setLoadingHealth(false); }
    };

    const handleSetGoals = async () => {
        try {
            await api.put('/users/me', {
                daily_calorie_goal: goals.calories ? Number(goals.calories) : null,
                daily_protein_goal: goals.protein ? Number(goals.protein) : null
            });
            setMsg("Daily goals updated.");
        } catch (err) {
            setMsg("Failed to update goals.");
        }
    };

    return (
        <div className="min-h-screen p-6 lg:p-12 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Health & Diet Tracking</h1>
                {msg && <span className="text-violet-400 bg-violet-400/10 px-3 py-1 rounded-full text-sm">{msg}</span>}
            </div>

            <div className="glass-card mb-8">
                <h2 className="text-xl font-semibold text-white mb-6">Set Daily Goals</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Calorie Target (kcal)</label>
                        <input type="number" value={goals.calories} onChange={e => setGoals({ ...goals, calories: e.target.value })} className="input-field" placeholder="e.g. 2500" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Protein Target (g)</label>
                        <input type="number" value={goals.protein} onChange={e => setGoals({ ...goals, protein: e.target.value })} className="input-field" placeholder="e.g. 150" />
                    </div>
                    <div className="flex items-end">
                        <button onClick={handleSetGoals} className="btn-primary w-full h-11">
                            Save Goals
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card">
                    <h2 className="text-xl font-semibold text-white mb-6">Log Diet Metrics</h2>
                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Calories (kcal)</label>
                                <input type="number" value={diet.calories || ''} onChange={e => setDiet({ ...diet, calories: Number(e.target.value) })} className="input-field" placeholder="e.g. 2000" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Protein (g)</label>
                                <input type="number" value={diet.protein || ''} onChange={e => setDiet({ ...diet, protein: Number(e.target.value) })} className="input-field" placeholder="e.g. 150" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Carbs (g)</label>
                                <input type="number" value={diet.carbs || ''} onChange={e => setDiet({ ...diet, carbs: Number(e.target.value) })} className="input-field" placeholder="e.g. 250" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Fat (g)</label>
                                <input type="number" value={diet.fat || ''} onChange={e => setDiet({ ...diet, fat: Number(e.target.value) })} className="input-field" placeholder="e.g. 65" />
                            </div>
                        </div>
                        <button type="button" onClick={handleDietSubmit} disabled={loadingAI || !diet.calories} className="btn-primary w-full mt-6 disabled:opacity-50">
                            {loadingAI ? 'Saving...' : 'Log Diet Data'}
                        </button>
                    </form>
                </div>

                <div className="glass-card">
                    <h2 className="text-xl font-semibold text-white mb-6">Log Health Metrics</h2>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Weight (kg)</label>
                            <input type="number" value={health.weight} onChange={e => setHealth({ ...health, weight: e.target.value })} step="0.1" className="input-field" placeholder="e.g. 75.5" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Sleep time</label>
                                <input type="time" value={health.sleepTime} onChange={e => setHealth({ ...health, sleepTime: e.target.value })} className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Wake time</label>
                                <input type="time" value={health.wakeTime} onChange={e => setHealth({ ...health, wakeTime: e.target.value })} className="input-field" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Activity (Minutes)</label>
                            <input type="number" value={health.activity} onChange={e => setHealth({ ...health, activity: e.target.value })} className="input-field" placeholder="e.g. 45" />
                        </div>
                        <button type="button" onClick={handleHealthSubmit} disabled={loadingHealth} className="btn-primary w-full mt-4 disabled:opacity-50">
                            {loadingHealth ? 'Saving...' : 'Save Health Data'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
