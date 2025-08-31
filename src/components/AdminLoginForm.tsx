// components/AdminLoginForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import InputField from "./InputField";
import { Button } from "./ui/button";
import Image from "next/image";


export default function AdminLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      log.info('로그인 시도:', username);
      
      const emailModify = `${username}@beautylink.com`;
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: emailModify, 
        password 
      });
      log.info('로그인 시도 email:', emailModify);
      
      if (error) {
        console.error('로그인 에러:', error);
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      if (data.user && data.session) {
        log.info('로그인 성공:', data.user.email);
        log.info('세션 생성됨:', data.session.access_token ? '토큰 존재' : '토큰 없음');
        
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
