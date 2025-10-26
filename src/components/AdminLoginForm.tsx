// components/AdminLoginForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import InputField from "./InputField";
import { Button } from "./ui/button";
import Image from "next/image";


export default function AdminLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      log.info('로그인 시도:', username);
      
      // 기존 로직: username, password 가 폼 state에 있다고 가정
      const email = `${username}@beautylink.com`;

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // 로그인 실패 처리 (에러 메시지 표시 등)
        setError("아이디 또는 비밀번호를 확인해주세요.");
        return;
      }

      const json = await res.json();
      if (json.ok) {
        // 성공: 서버가 HttpOnly 쿠키로 세션을 이미 심었다.
        // 클라이언트에서는 /admin 으로 라우팅만 하면 된다.
        log.info('로그인 성공:', email);
        router.push("/admin");
      } else {
        setError("아이디 또는 비밀번호를 확인해주세요.");
      }
    } catch (err) {
      console.error('로그인 처리 중 오류:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full min-h-screen bg-gray-50">
      <div className="text-center mb-8">
          <Image
              src="/logo/logo_mimotok.svg"
              alt="logo"
              width={0}  // dummy
              height={0} // dummy
              style={{ width: "500px", height: "auto" }} // 기본값
             className="w-[200px] h-auto md:w-[300px] lg:w-[386px]"
            />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Mimotok Admin</h1>
      
        <p className="text-lg text-gray-600">Please enter your ID and password</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <InputField
            label="Login ID"
            type="text"
            name="login_id"
            placeholder="발급받은 로그인 아이디를 입력하세요"
            value={username}
            onChange={e => setUsername(e.target.value)}
            // value={email}
            // onChange={e => setEmail(e.target.value)}
            required
          />
        
        <InputField
            label="Password"   
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '로그인 중...' : 'Login'}
        </Button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </form>
      </div>
  );
}
