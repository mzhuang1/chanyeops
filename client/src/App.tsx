import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/components/LanguageProvider";
import { useLanguage } from "@/hooks/useLanguage";

import LoginPage from "@/pages/login";
import Home from "@/pages/home-new";
import Chat from "@/pages/chat";
import Knowledge from "@/pages/knowledge";
import Templates from "@/pages/templates";
import Search from "@/pages/search";
import Admin from "@/pages/admin";
import Planning from "@/pages/planning";
import FiveYearPlanning from "@/pages/five-year-planning-redesigned";
import { IndustryAssessment } from "@/pages/industry-assessment";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/main-layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Debug logging
  console.log('Router state:', { isAuthenticated, isLoading });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">系统初始化中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route component={LoginPage} />
      </Switch>
    );
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/planning" component={FiveYearPlanning} />
        <Route path="/assessment" component={Templates} />
        <Route path="/research" component={Search} />
        <Route path="/cluster" component={Planning} />
        <Route path="/training" component={Knowledge} />
        <Route path="/park-management" component={Admin} />
        <Route path="/industry-management" component={Admin} />
        <Route path="/chat" component={Chat} />
        <Route path="/chat/:id" component={Chat} />
        <Route path="/knowledge" component={Knowledge} />
        <Route path="/templates" component={Templates} />
        <Route path="/search" component={Search} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <div className="min-h-screen">
          <Router />
          <Toaster />
        </div>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
