import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { CdiLogo } from '../../assets/cdi-logo';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ShieldX } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex justify-between items-center border-b">
        <div className="flex items-center">
          <CdiLogo className="h-10 w-auto" />
          <h1 className="ml-4 text-2xl font-medium">产业集群发展潜力评估系统</h1>
        </div>
        <LanguageSwitcher />
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-destructive mb-6">
          <ShieldX size={64} />
        </div>
        
        <h1 className="text-3xl font-medium text-center mb-2">访问受限</h1>
        
        <p className="text-lg text-muted-foreground text-center mb-8 max-w-md">
          您没有权限访问此页面。如需访问，请联系系统管理员升级您的账号权限。
        </p>
        
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link to="/">返回首页</Link>
          </Button>
          
          <Button asChild>
            <Link to="/contact">联系管理员</Link>
          </Button>
        </div>
      </main>
      
      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        &copy; 2025 产业发展研究院. 保留所有权利.
      </footer>
    </div>
  );
};