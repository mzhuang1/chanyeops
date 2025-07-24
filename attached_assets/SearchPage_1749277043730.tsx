import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchBox } from '../SearchBox';
import { SearchResult, SearchResponse } from '../../services/SearchService';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { ChevronLeft } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [language] = useState<'zh' | 'en'>(user?.language === 'en' ? 'en' : 'zh');
  
  // 从URL参数中获取初始查询
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };
  
  // 更新搜索URL
  const handleSearch = (query: string) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('q', query);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {language === 'zh' ? '返回' : 'Back'}
        </Button>
        <h1 className="text-2xl font-medium">
          {language === 'zh' ? '网络搜索' : 'Web Search'}
        </h1>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <SearchBox 
          language={language}
          isFullScreen={true}
          initialQuery={initialQuery}
          onSearch={(query) => handleSearch(query)}
        />
      </div>
    </div>
  );
};