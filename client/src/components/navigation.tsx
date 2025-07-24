import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/language-switcher";

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const { t } = useLanguage();

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                <svg width="20" height="20" viewBox="0 0 156 154" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M77.798 154C121.121 154 156 119.346 156 76.298C156 33.25 121.121 0 77.798 0C34.474 0 0 33.25 0 76.298C0 119.346 34.474 154 77.798 154Z" fill="#1E88E5"/>
                  <path d="M49.8 54.5C53.5 49.7 58.3 46.1 64.3 43.7C70.2 41.3 76.6 40.1 83.3 40.1C90 40.1 96.4 41.3 102.3 43.7C108.3 46.1 113.1 49.7 116.8 54.5L105.2 63.5C103 60.6 100.2 58.4 96.8 56.9C93.4 55.3 89.6 54.6 85.4 54.6C81.2 54.6 77.4 55.3 74 56.9C70.6 58.4 67.8 60.6 65.6 63.5L49.8 54.5Z" fill="white"/>
                  <path d="M40.8 102.3C37.1 97.5 35.3 91.7 35.3 85.1C35.3 78.5 37.1 72.8 40.8 67.9C44.5 63 49.4 59.3 55.3 56.9C61.3 54.5 67.8 53.3 74.8 53.3C81.8 53.3 88.3 54.5 94.3 56.9C100.2 59.3 105.1 63 108.8 67.9C112.5 72.8 114.3 78.5 114.3 85.1C114.3 91.7 112.5 97.5 108.8 102.3C105.1 107.2 100.2 110.9 94.3 113.3C88.3 115.7 81.8 116.9 74.8 116.9C67.8 116.9 61.3 115.7 55.3 113.3C49.4 110.9 44.5 107.2 40.8 102.3ZM93.9 94C96.1 91.2 97.2 88 97.2 84.3C97.2 80.6 96.1 77.4 93.9 74.6C91.7 71.8 88.5 70.4 84.3 70.4C80.1 70.4 76.9 71.8 74.7 74.6C72.5 77.4 71.4 80.6 71.4 84.3C71.4 88 72.5 91.2 74.7 94C76.9 96.8 80.1 98.2 84.3 98.2C88.5 98.2 91.7 96.8 93.9 94Z" fill="white"/>
                </svg>
              </div>
              <span className="text-lg font-semibold">{t('app.title')}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className={`px-1 py-4 text-sm font-medium ${location === "/" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}>
                {t('navigation.home')}
              </Link>
              <Link href="/knowledge" className={`px-1 py-4 text-sm font-medium ${location === "/knowledge" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}>
                {t('navigation.knowledge')}
              </Link>
              <Link href="/templates" className={`px-1 py-4 text-sm font-medium ${location === "/templates" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}>
                {t('navigation.templates')}
              </Link>
              <Link href="/search" className={`px-1 py-4 text-sm font-medium ${location === "/search" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}>
                {t('navigation.search')}
              </Link>
              <Link href="/admin" className={`px-1 py-4 text-sm font-medium ${location === "/admin" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}>
                {t('navigation.admin')}
              </Link>
            </nav>
            
            <LanguageSwitcher />
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">{t('navigation.profile')}</span>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {(user as any)?.firstName?.charAt(0) || (user as any)?.username?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  {t('auth.logout')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
