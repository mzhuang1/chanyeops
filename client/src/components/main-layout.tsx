import { ReactNode } from "react";
import Sidebar from "./sidebar";
import { useSidebar } from "@/hooks/useSidebar";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar />
      <main 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        } ml-0`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-center p-4 bg-white dark:bg-gray-800 shadow-sm border-b">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">产业集群智能体</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <MainLayoutContent>{children}</MainLayoutContent>;
}