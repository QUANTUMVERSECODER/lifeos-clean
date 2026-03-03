"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [theme, setTheme] = useState('dark');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    if (pathname === '/login' || pathname === '/') return null;

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (err) {
            console.error(err);
        } finally {
            localStorage.removeItem('token');
            router.push('/login');
        }
    };

    const links = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Health & Diet', path: '/health' },
        { name: 'Task Planner', path: '/tasks' },
    ];

    return (
        <nav className="glass-card mb-8 sticky top-4 z-50 mx-4 lg:mx-12 mt-4 relative">
            <div className="flex justify-between items-center py-4 px-6">
                <div className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-rose-600">
                    LifeOS
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex gap-6">
                    {links.map((l) => (
                        <Link
                            key={l.path}
                            href={l.path}
                            className={`text-sm font-medium transition-colors ${pathname === l.path ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {l.name}
                        </Link>
                    ))}
                </div>

                {/* Desktop Controls */}
                <div className="hidden md:flex gap-4 items-center">
                    <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800/50 rounded-lg">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button onClick={handleLogout} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign Out</button>
                </div>

                {/* Mobile Hamburger Toggle */}
                <div className="md:hidden flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400 hover:text-white transition-colors focus:outline-none">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 mt-2 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200">
                    {links.map((l) => (
                        <Link
                            key={l.path}
                            href={l.path}
                            className={`text-base font-medium py-2 px-4 rounded-lg transition-colors ${pathname === l.path ? 'bg-red-500/20 text-red-500' : 'text-slate-300 hover:bg-slate-800'}`}
                        >
                            {l.name}
                        </Link>
                    ))}
                    <div className="h-px bg-slate-800 w-full my-2"></div>
                    <button onClick={handleLogout} className="text-base text-left font-medium text-slate-400 hover:text-white py-2 px-4 transition-colors">
                        Sign Out
                    </button>
                </div>
            )}
        </nav>
    );
}
