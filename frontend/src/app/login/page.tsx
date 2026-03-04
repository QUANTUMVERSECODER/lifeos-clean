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

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

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

    /* ==========================
       EMAIL LOGIN
    ========================== */

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

    /* ==========================
       GOOGLE LOGIN
    ========================== */

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!credentialResponse?.credential) {
            setError("Google authentication failed.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(
                "https://lifeos-clean-production.up.railway.app/api/v1/auth/google",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id_token: credentialResponse.credential,
                    }),
                }
            );

            if (!res.ok) {
                throw new Error("Google login failed");
            }

            const data = await res.json();

            if (data.access_token) {
                localStorage.setItem("token", data.access_token);
                document.cookie = `token=${data.access_token}; path=/; max-age=86400; SameSite=Strict`;
                router.push("/dashboard");
            }
        } catch (err) {
            console.error("Google login error:", err);
            setError("Google Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-main)] text-[var(--text-main)]">

                {/* Theme Toggle */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-white hover:bg-white/10 rounded-full bg-black/20"
                    >
                        {theme === "dark" ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                </div>

                {/* LEFT SIDE */}
                <div className={`w-full md:w-1/2 flex flex-col justify-center px-12 text-white ${theme === "dark" ? "bg-[#7f1d1d]" : "bg-[#DC2626]"}`}>
                    <h1 className="text-5xl font-bold mb-4">LifeOS</h1>

                    <p className="text-xl mb-10">
                        Design your day.<br/>
                        Optimize your life.
                    </p>

                    <div className="space-y-6">
                        <Feature icon={<HeartPulse />} text="Track Health & Sleep" />
                        <Feature icon={<CheckSquare />} text="Smart Task Planning" />
                        <Feature icon={<Activity />} text="ML Burnout Monitoring" />
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="w-full md:w-1/2 flex flex-col justify-center p-8 max-w-sm mx-auto">

                    <h2 className="text-3xl font-bold text-center mb-6">
                        Welcome Back
                    </h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
                            {error}
                        </div>
                    )}

                    {/* GOOGLE LOGIN */}
                    <div className="flex justify-center mb-6">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError("Google Login verification failed")}
                            theme={theme === "dark" ? "filled_black" : "outline"}
                            width="300"
                        />
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
                            className="btn-primary w-full py-3"
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

/* Feature Component */

function Feature({ icon, text }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className="p-2 bg-red-500/30 rounded-lg">
                {icon}
            </div>
            <span className="text-lg">{text}</span>
        </div>
    );
}
