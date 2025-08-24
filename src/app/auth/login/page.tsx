"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return alert("Please enter email and password");
    setLoading(true);
    try {
      console.log("Login submit", { email, password, rememberMe });
      alert("Login (demo) - will connect API later.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    alert("Google login - will implement OAuth later.");
  };

  return (
    <main className="min-h-screen bg-[#cecece] flex items-start md:items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Title */}
        <h1 className="text-6xl md:text-8xl lg:text-[96px] font-bold text-black text-center mb-8 leading-none">
          Log in
        </h1>

        {/* Card */}
        <div className="bg-white rounded-lg border-2 border-[#d9a339] p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Ряд со столбцами, как на скриншоте */}
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              {/* Левый столбец: поля */}
              <div className="flex-1 min-w-[300px] space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-[30px] font-bold text-black">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[52px] px-4 bg-[#cecece] rounded-lg border-0 text-[24px] text-[#5f5f5f] placeholder-[#5f5f5f] focus:outline-none focus:ring-2 focus:ring-[#d9a339]"
                    placeholder="Type"
                    required
                  />
                </div>

                {/* Password с глазом */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-[30px] font-bold text-black">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-[52px] pr-12 px-4 bg-[#cecece] rounded-lg border-0 text-[24px] text-[#5f5f5f] placeholder-[#5f5f5f] focus:outline-none focus:ring-2 focus:ring-[#d9a339]"
                      placeholder="Type"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/5"
                    >
                      {showPassword ? (
                        // eye-off
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                             className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-3.42" />
                          <path d="M16.24 16.24A8.5 8.5 0 013 12s2.5-5.5 9-5.5c1.27 0 2.45.2 3.5.56" />
                          <path d="M19.06 19.06A8.5 8.5 0 0021 12s-2.5-5.5-9-5.5" />
                        </svg>
                      ) : (
                        // eye
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                             className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label htmlFor="remember" className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    className={`w-[26px] h-[26px] rounded-lg border-2 border-[#d9a339] flex items-center justify-center transition-colors
                      ${rememberMe ? "bg-[#d9a339]" : "bg-white"}`}
                    aria-hidden="true"
                  >
                    {rememberMe && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  <span className="text-[24px] font-bold text-[#d9a339]">Remember me</span>
                </label>
              </div>

              {/* Правый столбец: Google — поднят к уровню поля E-mail */}
              <div className="w-full md:w-auto md:mt-[38px] flex md:block justify-center">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="h-[52px] px-4 bg-white border-2 border-[#d9a339] rounded-lg inline-flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/382a4195-a96e-4632-b36d-44e231e8e1e5"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  <span className="text-[16px] md:text-[20px] font-bold text-black">
                    Continue with Google
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm — по центру */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-[298px] h-[73px] bg-[#d9d9d9] rounded-lg text-[40px] font-bold text-black hover:bg-gray-400 transition-colors disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? "..." : "Confirm"}
              </button>
            </div>

            {/* Текстовые ссылки ниже, как на скрине */}
            <div className="pt-1 text-center space-y-2">
              <Link href="/auth/register" className="text-[16px] font-bold text-black hover:text-[#d9a339]">
                {"Don't have an account?"}
              </Link>
              <br className="hidden sm:block" />
              <Link href="/auth/forgot-password" className="text-[16px] font-bold text-black hover:text-[#d9a339]">
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
