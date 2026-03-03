"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { HeartPulse, CheckSquare, Activity, Sun, Moon } from "lucide-react";

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState("dark");

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    useEffect(() => {
        const stored = localStorage.getItem("theme") || "dark";
        setTheme(stored);

        if (stored === "light") {
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);

        if (newTheme === "light") {
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    };

    // ==========================
    // EMAIL LOGIN
    // ==========================
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const payload = new URLSearchParams();
            payload.append("username", email.trim());
            payload.append("password", password);

            const res = await api.post("/login/access-token", payload, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });

            const token = res.data.access_token;

            if (token) {
                localStorage.setItem("token", token);
                document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
                router.push("/dashboard");
            }
        } catch (err) {
            setError("Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================
    // GOOGLE LOGIN
    // ==========================
    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!credentialResponse?.credential) {
            setError("Google authentication failed.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 🔥 FIXED ROUTE HERE
            const res = await api.post("/google", {
                id_token: credentialResponse.credential,
            });

            const token = res.data.access_token;

            if (token) {
                localStorage.setItem("token", token);
                document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
                router.push("/dashboard");
            }
        } catch (err: any) {
            console.error("Google login error:", err?.response?.data || err);
            setError("Google Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!clientId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500">
                    Google Client ID is not configured.
                </p>
            </div>
        );
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">

                {/* Theme Toggle Mobile */}
                <div className="absolute top-4 right-4 z-50 md:hidden">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-white hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm bg-black/20 shadow-sm border border-white/10"
                    >
                        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                {/* Left Branding */}
                <div className={`w-full md:w-1/2 flex flex-col justify-center px-8 py-12 md:px-16 lg:px-24 text-white relative overflow-hidden transition-colors duration-300 ${theme === "dark" ? "bg-[#7f1d1d]" : "bg-[#DC2626]"}`}>
                    <div className="relative z-10 w-full max-w-lg mx-auto md:mx-0">
                        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">LifeOS</h1>
                        <p className="text-xl text-red-100 mb-12">
                            Design your day.<br />Optimize your life.
                        </p>

                        <div className="space-y-6">
                            <Feature icon={<HeartPulse />} text="Track Health & Sleep" />
                            <Feature icon={<CheckSquare />} text="Smart Task Planning" />
                            <Feature icon={<Activity />} text="ML-Based Burnout Monitoring" />
                        </div>
                    </div>
                </div>

                {/* Right Login Panel */}
                <div className="w-full md:w-1/2 flex flex-col justify-center p-8 max-w-sm mx-auto w-full">

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                        <p className="text-[var(--text-muted)]">
                            Sign in to continue
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-lg text-center mb-6">
                            {error}
                        </div>
                    )}

                    {/* Google Login */}
                    <div className="mb-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError("Google Login verification failed.")}
                            theme={theme === "dark" ? "filled_black" : "outline"}
                            shape="rectangular"
                            width="300"
                        />
                    </div>

                    <div className="relative flex items-center justify-center mb-6">
                        <div className="border-t border-[var(--card-border)] w-full absolute"></div>
                        <span className="bg-[var(--bg-main)] px-4 z-10 text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider">
                            or sign in with email
                        </span>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            className="btn-primary w-full mt-6 py-3"
                            disabled={isLoading}
                        >
                            {isLoading ? "Authenticating..." : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}

function Feature({ icon, text }: any) {
    return (
        <div className="flex items-center gap-4 text-red-50">
            <div className="p-2 bg-red-500/30 rounded-lg">
                {icon}
            </div>
            <span className="text-lg font-medium">{text}</span>
        </div>
    );
}
