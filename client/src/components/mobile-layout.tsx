import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  FileText, Target, BarChart3, Building2, GraduationCap, 
  Briefcase, MapPin, Menu, X 
} from "lucide-react";

interface MobileLayoutProps {
  activeSubPage: string;
  setActiveSubPage: (page: string) => void;
  children: React.ReactNode;
}

export function MobileLayout({ activeSubPage, setActiveSubPage, children }: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { id: "planning", icon: FileText, label: "五年规划" },
    { id: "evaluation", icon: Target, label: "产业测评" },
    { id: "research", icon: BarChart3, label: "产业研究" },
    { id: "cluster", icon: Building2, label: "集群打造" },
    { id: "training", icon: GraduationCap, label: "产业培训" },
    { id: "management", icon: Briefcase, label: "产业托管" },
    { id: "park", icon: MapPin, label: "园区托管" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-900 dark:text-blue-100">产业集群智能体</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 h-full bg-white dark:bg-gray-800 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSubPage === item.id ? "default" : "outline"}
                  className={`w-full justify-start ${
                    activeSubPage === item.id 
                      ? "bg-yellow-400 hover:bg-yellow-500 text-black" 
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                  onClick={() => {
                    setActiveSubPage(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex space-x-1 p-2 min-w-max">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSubPage === item.id ? "default" : "outline"}
              size="sm"
              className={`min-w-max text-xs ${
                activeSubPage === item.id 
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black" 
                  : "text-gray-600 dark:text-gray-400"
              }`}
              onClick={() => setActiveSubPage(item.id)}
            >
              <item.icon className="w-3 h-3 mr-1" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="lg:flex lg:h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-48 bg-white dark:bg-gray-800 flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 flex-1">
            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
              产业集群智能体
            </h2>
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSubPage === item.id ? "default" : "outline"}
                  className={`w-full justify-start ${
                    activeSubPage === item.id 
                      ? "bg-yellow-400 hover:bg-yellow-500 text-black" 
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                  onClick={() => setActiveSubPage(item.id)}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}