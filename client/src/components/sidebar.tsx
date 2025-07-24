import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";

import { useState, useEffect } from "react";
import { 
  Home, 
  Brain, 
  FileText, 
  Search, 
  Settings, 
  LogOut,
  MessageSquare,
  Plus,
  PenTool,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Building2,
  GraduationCap,
  MapPin,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, toggleCollapsed } = useSidebar();

  // Auto-close sidebar on mobile after navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Auto-close sidebar on mobile screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigationItems = [
    {
      name: "首页",
      href: "/",
      icon: Home,
      current: location === "/"
    },
    {
      name: "产业集群智能体",
      href: "/planning",
      icon: PenTool,
      current: location === "/planning"
    },
    {
      name: "智能搜索",
      href: "/research",
      icon: Search,
      current: location === "/research"
    },
    {
      name: "智能分析",
      href: "/chat",
      icon: MessageSquare,
      current: location === "/chat" || location.startsWith("/chat/")
    },
    {
      name: "报告模板库",
      href: "/assessment",
      icon: BarChart3,
      current: location === "/assessment"
    },
    {
      name: "内部知识库",
      href: "/training",
      icon: GraduationCap,
      current: location === "/training"
    },
    {
      name: "第三方数据库",
      href: "/industry-management",
      icon: Briefcase,
      current: location === "/industry-management"
    },

    {
      name: "系统管理",
      href: "/admin",
      icon: Settings,
      current: location === "/admin"
    }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 touch-manipulation"
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative lg:flex h-full flex-col bg-gray-900 z-50 transition-all duration-300 ease-in-out",
        // Mobile behavior - wider sidebar for better touch experience
        isOpen ? 'translate-x-0 w-72 sm:w-80' : '-translate-x-full w-72 sm:w-80',
        // Desktop behavior
        'lg:translate-x-0',
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      )}>
        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Header */}
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="text-white">
                <div className="text-sm font-semibold">
                  产业集群智能体
                </div>
                <div className="text-xs text-gray-300">
                  产业发展潜力评估
                </div>
              </div>
            )}
          </div>
        </div>



        {/* New Chat Button */}
        {isCollapsed ? (
          <div className="px-2 pb-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/chat">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-10 p-0 text-gray-400 hover:text-white hover:bg-gray-700 justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gray-800 text-white">
                  新建对话
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="px-4 pb-4">
            <Link href="/chat">
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white hover:bg-gray-700 justify-start"
              >
                <Plus className="w-4 h-4 mr-2" />
                新建对话
              </Button>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          <TooltipProvider>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              
              if (isCollapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <div
                          className={cn(
                            "group flex items-center justify-center p-3 text-sm font-medium rounded-md transition-colors cursor-pointer",
                            item.current
                              ? "bg-gray-800 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 flex-shrink-0",
                              item.current ? "text-white" : "text-gray-400 group-hover:text-white"
                            )}
                          />
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-800 text-white">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors cursor-pointer touch-manipulation",
                      item.current
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white active:bg-gray-600"
                    )}
                  >
                    <Icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        item.current ? "text-white" : "text-gray-400 group-hover:text-white"
                      )}
                    />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* Toggle Button */}
        <div className="hidden lg:flex justify-center border-t border-gray-700 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Section */}
        <div className="flex-shrink-0 border-t border-gray-700 p-4">
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center cursor-pointer">
                      <span className="text-sm font-medium text-white">
                        {(user as any)?.firstName?.charAt(0) || 
                         (user as any)?.username?.charAt(0)?.toUpperCase() || "用"}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gray-800 text-white">
                  <div>
                    <p className="text-sm font-medium">
                      {(user as any)?.username || "Demo用户"}
                    </p>
                    <p className="text-xs text-gray-300">
                      研究人员
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {(user as any)?.firstName?.charAt(0) || 
                     (user as any)?.username?.charAt(0)?.toUpperCase() || "用"}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">
                  {(user as any)?.username || "Demo用户"}
                </p>
                <p className="text-xs text-gray-400">
                  研究人员
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}