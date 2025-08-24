"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      alert("Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      console.log("Register submit", { email, password, photo });
      alert("Registration (demo) - will connect API later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#cecece] flex items-start justify-center px-4 pt-8 pb-4">
      {/* Scale 80% to match login page */}
      <div className="scale-[0.8] w-fit">
        <div className="w-full max-w-4xl">
          {/* Title — больше отступа снизу и плотное кернинг */}
          <h1 className="text-6xl md:text-8xl lg:text-[96px] font-bold text-black text-center mb-6 leading-none tracking-tight">
            Sign up
          </h1>

          {/* Card */}
          <div className="bg-white rounded-lg border-2 border-[#d9a339] p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                {/* Left column - Form fields */}
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
                      placeholder="someone@example.com"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-[30px] font-bold text-black">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-[52px] px-4 bg-[#cecece] rounded-lg border-0 text-[24px] text-[#5f5f5f] placeholder-[#5f5f5f] focus:outline-none focus:ring-2 focus:ring-[#d9a339]"
                      placeholder="Type"
                      required
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-[30px] font-bold text-black">
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-[52px] px-4 bg-[#cecece] rounded-lg border-0 text-[24px] text-[#5f5f5f] placeholder-[#5f5f5f] focus:outline-none focus:ring-2 focus:ring-[#d9a339]"
                      placeholder="Type"
                      required
                    />
                  </div>
                </div>

                {/* Right column - Photo upload */}
                <div className="flex flex-col items-center space-y-4 lg:mt-[38px]">
                  <div className="relative group">
                    <input
                      type="file"
                      id="photo"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="photo"
                      className="w-[219px] h-[219px] rounded-full bg-[#cecece] border-2 border-[#d9a339] flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
                    >
                      {/* image / placeholder */}
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <img
                          src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5b8932af-d6f8-4bc8-87fa-ac846174e91b"
                          alt="Upload placeholder"
                          className="w-full h-full object-cover rounded-full opacity-50"
                        />
                      )}

                      {/* hover overlay: затемнение + текст */}
                      <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-white font-bold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        choose photo
                      </span>
                    </label>
                  </div>
                  <span className="text-[20px] font-bold text-black">
                    photo (optional)
                  </span>
                </div>
              </div>

              {/* Confirm Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-[298px] h-[73px] bg-[#d9d9d9] rounded-lg text-[40px] font-bold text-black transition-colors duration-300 hover:bg-[#d9a339] disabled:opacity-70 disabled:pointer-events-none"
                >
                  {loading ? "..." : "Confirm"}
                </button>
              </div>

              {/* Login Link */}
              <div className="pt-1 text-center">
                <Link href="/auth/login" className="text-[16px] font-bold text-black hover:text-[#d9a339]">
                  Already have an account?
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
