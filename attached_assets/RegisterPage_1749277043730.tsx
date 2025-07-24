import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RegisterRequest } from '../../services/AuthService';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { CdiLogo } from '../../assets/cdi-logo';
import { Eye, EyeOff } from 'lucide-react';
import { PlayCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, loginAsDemo } = useAuth();
  
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    password: '',
    email: '',
    name: '',
    organization: '',
    department: ''
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  
  // 处理表单输入更改
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    }
    
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    }
    
    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (!formData.email) {
      newErrors.email = '请输入电子邮箱';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = '请输入有效的电子邮箱';
    }
    
    if (!formData.name) {
      newErrors.name = '请输入姓名';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 处理注册提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await register(formData);
      navigate('/login', { state: { registered: true } });
    } catch (error) {
      if (error instanceof Error) {
        setErrors({
          general: error.message
        });
      } else {
        setErrors({
          general: '注册失败，请稍后重试'
        });
      }
    }
  };
  
  // 切换密码可见性
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
      setErrors({
        general: '演示模式登录失败，请稍后重试'
      });
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
            <h2 className="text-xl font-medium mb-4 text-center">注册新账号</h2>
            <p className="text-sm text-center text-muted-foreground mb-6">
              创建账号以使用产业集群评估功能
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
                无需注册，直接体验系统全部功能
              </p>
            </div>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-muted-foreground">或者注册新账号</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {errors.general}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm">用户名</label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-xs text-destructive mt-1">{errors.username}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm">电子邮箱</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="请输入电子邮箱"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm">姓名</label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="请输入您的姓名"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm">密码</label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    className="pr-10"
                    value={formData.password}
                    onChange={handleChange}
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
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm">确认密码</label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    className="pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="organization" className="block text-sm">单位/组织</label>
                <Input
                  id="organization"
                  name="organization"
                  type="text"
                  placeholder="请输入您的单位/组织名称（可选）"
                  value={formData.organization}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="department" className="block text-sm">部门</label>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  placeholder="请输入您的部门名称（可选）"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></span>
                    注册中...
                  </>
                ) : '注册'}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground mt-4">
                已有账号? {' '}
                <Link to="/login" className="text-primary hover:underline">
                  返回登录
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