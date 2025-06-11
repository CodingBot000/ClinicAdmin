// components/AdminLoginForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import InputField from "./InputField";
import { Button } from "./ui/button";


export default function AdminLoginForm() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      console.log('로그인 시도:', username);
      
      const emailModify = `${username}@beautylink.com`;
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: emailModify, 
        password 
      });
      console.log('로그인 시도 email:', emailModify);
      
      if (error) {
        console.error('로그인 에러:', error);
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      if (data.user && data.session) {
        console.log('로그인 성공:', data.user.email);
        console.log('세션 생성됨:', data.session.access_token ? '토큰 존재' : '토큰 없음');
        
        // Next.js router 사용
        router.push('/admin');
      } else {
        setError('로그인 정보가 올바르지 않습니다.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('로그인 처리 중 오류:', err);
      setError('로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen">
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
        {error && <p className="text-red-500">{error}</p>}
      </form>
      </div>
  );
}
