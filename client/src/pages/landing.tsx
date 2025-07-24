import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye } from "lucide-react";
import { useState } from "react";

export default function Landing() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    // For demo purposes, simulate successful login
    // In production, this would validate credentials
    if (username && password) {
      // Simulate login success and redirect to main app
      localStorage.setItem('demo_user', JSON.stringify({
        id: 'demo_user',
        username: username,
        email: `${username}@demo.com`,
        loginTime: new Date().toISOString()
      }));
      window.location.reload();
    } else {
      // Simple validation feedback
      alert('请输入用户名和密码');
    }
  };

  const handleGuestDemo = () => {
    // Set demo guest user and proceed
    localStorage.setItem('demo_user', JSON.stringify({
      id: 'guest_demo',
      username: 'Demo用户',
      email: 'demo@guest.com',
      loginTime: new Date().toISOString()
    }));
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            </div>
          </div>
          <h1 className="text-xl font-medium text-gray-900">
            产业集群发展潜力评估系统
          </h1>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                登录系统
              </h2>
              <p className="text-sm text-gray-500">
                请输入您的账号密码登录系统
              </p>
            </div>

            {/* Demo Access Button */}
            <Button
              onClick={handleGuestDemo}
              className="w-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:text-blue-700 rounded-lg py-3"
              variant="outline"
            >
              <div className="w-4 h-4 border-2 border-blue-600 rounded-full mr-2 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              直接体验演示版
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-400">
                无需登录，直接体验系统全部功能
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-400">
                或者登录您的账号
              </p>
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  密码
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                  忘记密码?
                </a>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Eye className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                记住我
              </label>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
            >
              登录
            </Button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                没有账号？{" "}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  注册新账号
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © 2025 产业发展研究院. 保留所有权利.
          </p>
        </div>
      </div>
    </div>
  );
}