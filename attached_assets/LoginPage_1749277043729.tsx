import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { CdiLogo } from '../../assets/cdi-logo';
import { Eye, EyeOff } from 'lucide-react';
import { PlayCircle } from 'lucide-react';

interface LocationState {
  from?: Location;
  registered?: boolean;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, loginAsDemo } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  
  const locationState = location.state as LocationState;
  const redirectPath = locationState?.from?.pathname || '/';
  const justRegistered = locationState?.registered || false;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    
    try {
      await login({
        username,
        password,
        remember: rememberMe
      });
      
      navigate(redirectPath);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('登录失败，请稍后再试');
      }
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 处理演示模式登录
  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      await loginAsDemo();
      navigate('/');
    } catch (error) {
      setError('演示模式登录失败，请稍后重试');
    } finally {
      setIsDemoLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶部提示条 */}
      <div className="w-full bg-[#FFF8F8] border-b border-[#FFCCC7] py-2 px-4 flex items-center justify-center text-[#FF4D4F] text-sm">
        <span className="mr-1">⚠️</span>
        <span>无法连接到API服务器，已切换到模拟模式。</span>
        <Button variant="link" size="sm" className="ml-2 text-[#FF4D4F] h-auto p-0">
          重新连接
        </Button>
      </div>
      
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="max-w-md w-full p-6 m-4">
          <div className="flex items-center gap-2 mb-8">
            <CdiLogo className="h-10 w-auto" />
            <h1 className="text-2xl font-medium">产业集群发展潜力评估系统</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-medium mb-4 text-center">登录系统</h2>
            <p className="text-sm text-center text-muted-foreground mb-6">
              请输入您的账号密码登录系统
            </p>
            
            {/* 演示模式按钮 */}
            <div className="mb-6">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary/5"
                onClick={handleDemoLogin}
                disabled={isDemoLoading || isLoading}
              >
                {isDemoLoading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
                    正在进入演示模式...
                  </>
                ) : (
                  <>
                    <PlayCircle size={18} />
                    直接体验演示版
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                无需登录，直接体验系统全部功能
              </p>
            </div>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-muted-foreground">或者登录您的账号</span>
              </div>
            </div>
            
            {justRegistered && (
              <div className="p-3 rounded-md bg-green-50 text-green-600 text-sm mb-4">
                注册成功！请使用您的新账号登录。
              </div>
            )}
            
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm">用户名</label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm">密码</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    忘记密码?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    className="pr-10"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  记住我
                </label>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></span>
                    登录中...
                  </>
                ) : '登录'}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground mt-4">
                没有账号? {' '}
                <Link to="/register" className="text-primary hover:underline">
                  注册新账号
                </Link>
              </div>
            </form>
          </div>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            &copy; 2025 产业发展研究院. 保留所有权利.
          </div>
        </div>
      </div>
    </div>
  );
};