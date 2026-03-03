"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { HeartPulse, CheckSquare, Activity, Sun, Moon } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState('dark');
    const router = useRouter();

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    useEffect(() => {
        const stored = localStorage.getItem('theme') || 'dark';
        setTheme(stored);
        if (stored === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const encodedEmail = encodeURIComponent(email.trim());
            const encodedPassword = encodeURIComponent(password);
            const payload = `username=${encodedEmail}&password=${encodedPassword}`;

            const res = await api.post('/login/access-token', payload, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const token = res.data.access_token;
            if (token) {
                localStorage.setItem('token', token);
                document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
                router.push('/dashboard');
            }
        } catch (err: unknown) {
            setError('Login failed. Please check your credentials.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.post('/google', { id_token: credentialResponse.credential });
            const token = res.data.access_token;
            if (token) {
                localStorage.setItem('token', token);
                document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
                router.push('/dashboard');
            }
        } catch (err) {
            console.error(err);
            setError('Google Login failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">

                {/* Theme Toggle Mobile */}
                <div className="absolute top-4 right-4 z-50 md:hidden">
                    <button onClick={toggleTheme} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm bg-black/20 shadow-sm border border-white/10">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                {/* Left Side: Branding Panel */}
                <div className={`w-full md:w-1/2 flex flex-col justify-center px-8 py-12 md:px-16 lg:px-24 text-white relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#7f1d1d]' : 'bg-[#DC2626]'}`}>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-black opacity-[0.08] rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>

                    <div className="relative z-10 w-full max-w-lg mx-auto md:mx-0">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-sm">LifeOS</h1>
                        <p className="text-xl md:text-2xl font-light text-red-100 mb-12 drop-shadow-sm">
                            Design your day.<br />Optimize your life.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-red-50 group">
                                <div className="p-2.5 bg-red-500/30 rounded-lg backdrop-blur-sm border border-red-500/50 shadow-sm group-hover:bg-red-500/50 transition-colors">
                                    <HeartPulse className="w-6 h-6" />
                                </div>
                                <span className="text-lg font-medium drop-shadow-sm">Track Health & Sleep</span>
                            </div>
                            <div className="flex items-center gap-4 text-red-50 group">
                                <div className="p-2.5 bg-red-500/30 rounded-lg backdrop-blur-sm border border-red-500/50 shadow-sm group-hover:bg-red-500/50 transition-colors">
                                    <CheckSquare className="w-6 h-6" />
                                </div>
                                <span className="text-lg font-medium drop-shadow-sm">Smart Task Planning</span>
                            </div>
                            <div className="flex items-center gap-4 text-red-50 group">
                                <div className="p-2.5 bg-red-500/30 rounded-lg backdrop-blur-sm border border-red-500/50 shadow-sm group-hover:bg-red-500/50 transition-colors">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <span className="text-lg font-medium drop-shadow-sm">ML-Based Burnout Monitoring</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Panel */}
                <div className="w-full md:w-1/2 flex flex-col justify-between p-6 md:p-12 relative min-h-[60vh] md:min-h-screen">
                    {/* Theme Toggle Desktop */}
                    <div className="hidden md:flex justify-end w-full">
                        <button onClick={toggleTheme} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors hover:bg-[var(--input-bg)] rounded-lg">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                            <p className="text-[var(--text-muted)]">Sign in to continue</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-lg text-center mb-6">
                                {error}
                            </div>
                        )}

                        <div className="mb-6 flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google Login verification failed.')}
                                useOneTap
                                theme={theme === 'dark' ? "filled_black" : "outline"}
                                shape="rectangular"
                                width="300"
                            />
                        </div>

                        <div className="relative flex items-center justify-center mb-6">
                            <div className="border-t border-[var(--card-border)] w-full absolute"></div>
                            <span className="bg-[var(--bg-main)] px-4 z-10 text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider transition-colors duration-300">or sign in with email</span>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    className="input-field shadow-sm"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5 ml-1">Password</label>
                                <input
                                    type="password"
                                    className="input-field shadow-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-primary w-full mt-6 py-3" disabled={isLoading}>
                                {isLoading ? (
                                    <div className="flex justify-center items-center gap-2">
                                        <span className="animate-spin w-5 h-5 border-2 border-white/40 border-t-white rounded-full"></span>
                                        Authenticating...
                                    </div>
                                ) : 'Sign In'}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-[var(--text-muted)] mt-auto pb-4 pt-12">
                        © 2026 LifeOS – Built for disciplined living.
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}
