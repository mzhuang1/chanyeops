import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleDemoLogin = () => {
    console.log('Demo login button clicked');
    try {
      // Clear logged out state and create demo user
      localStorage.removeItem('logged_out');
      const defaultDemoUser = {
        id: "guest_demo", 
        username: "Demo用户",
        email: "demo@example.com"
      };
      localStorage.setItem('demo_user', JSON.stringify(defaultDemoUser));
      console.log('Demo user created:', defaultDemoUser);
      
      // Force reload to trigger auth hook
      window.location.reload();
    } catch (error) {
      console.error('Error during demo login:', error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, redirect to demo login regardless of credentials
    handleDemoLogin();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register form submitted');
    
    if (password !== confirmPassword) {
      alert('密码不匹配，请重新输入');
      return;
    }
    
    // For demo purposes, redirect to demo login
    console.log('Registration data:', { username, email, password });
    alert('注册成功！正在跳转到系统...');
    handleDemoLogin();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

      
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            产业集群智能体
          </h2>
        </div>

        {/* Login/Register Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-gray-900">
              {isRegistering ? "注册账号" : "登录系统"}
            </CardTitle>
            <CardDescription className="text-gray-500">
              {isRegistering ? "创建新账号以使用系统" : "请输入您的账号密码登录系统"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Demo Login Button */}
            <Button 
              onClick={handleDemoLogin} 
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              <div className="w-4 h-4 bg-white rounded-full mr-2 flex-shrink-0"></div>
              直接体验演示版
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              无需登录，直接体验系统全部功能
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  或者登录您的账号
                </span>
              </div>
            </div>

            {/* Login/Register Form */}
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-gray-700">
                  用户名
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              {isRegistering && (
                <div>
                  <Label htmlFor="email" className="text-gray-700">
                    邮箱
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700">
                    密码
                  </Label>
                  {!isRegistering && (
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                      忘记密码?
                    </a>
                  )}
                </div>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-700">
                    确认密码
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                  </div>
                </div>
              )}

              {!isRegistering && (
                <div className="flex items-center">
                  <Checkbox 
                    id="remember" 
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                    记住我
                  </Label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {isRegistering ? "注册" : "登录"}
              </Button>
            </form>

            <div className="text-center">
              <span className="text-sm text-gray-500">
                {isRegistering ? "已有账号? " : "没有账号? "}
              </span>
              <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {isRegistering ? "立即登录" : "注册新账号"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          © 2025 产业集群智能体. 保留所有权利.
        </div>
      </div>
    </div>
  );
}