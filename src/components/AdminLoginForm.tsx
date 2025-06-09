// components/AdminLoginForm.tsx
"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import InputField from "./InputField";
import { Button } from "./ui/button";


export default function AdminLoginForm() {
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else window.location.href = "/admin"; // 로그인 성공 시 대시보드로 이동
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen">
      <form onSubmit={handleLogin} className="space-y-4 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <InputField
            label="Login ID email"
            type="email"
            name="login id"
            placeholder="발급받은 로그인 아이디를 입력하세요"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        
        <InputField
            label="Password"   
            type="password"
            name="login id"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

        <Button type="submit" className="w-full">Login</Button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
      </div>
  );
}
