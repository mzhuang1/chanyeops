import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { CdiLogo } from '../../assets/cdi-logo';
import { ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setErrorMessage('请输入电子邮箱');
      return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage('请输入有效的电子邮箱');
      return;
    }
    
    setErrorMessage('');
    setIsSubmitting(true);
    
    try {
      // 这里应该调用实际的密码重置API
      // 目前使用模拟实现
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('发送重置邮件失败，请稍后重试');
      }
    } finally {
      setIsSubmitting(false);
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
      
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full p-6 m-4">
          <div className="flex items-center gap-2 mb-8">
            <CdiLogo className="h-10 w-auto" />
            <h1 className="text-2xl font-medium">产业集群发展潜力评估系统</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            {!isSubmitted ? (
              <>
                <h2 className="text-xl font-medium mb-4 text-center">找回密码</h2>
                <p className="text-sm text-center text-muted-foreground mb-6">
                  请输入您的电子邮箱，我们将向您发送密码重置链接
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {errorMessage}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm">电子邮箱</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="请输入您的注册邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></span>
                        发送中...
                      </>
                    ) : '发送重置链接'}
                  </Button>
                  
                  <div className="text-center">
                    <Link to="/login" className="inline-flex items-center text-sm text-primary hover:underline">
                      <ArrowLeft size={16} className="mr-1" />
                      返回登录
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium mb-2">邮件已发送</h2>
                <p className="text-muted-foreground mb-6">
                  我们已向 <strong>{email}</strong> 发送了密码重置链接，请查收邮件并按照指示重置密码。
                </p>
                <Button asChild>
                  <Link to="/login">返回登录</Link>
                </Button>
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            &copy; 2025 产业发展研究院. 保留所有权利.
          </div>
        </div>
      </div>
    </div>
  );
};