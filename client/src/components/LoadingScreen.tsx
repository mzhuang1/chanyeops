import { useLanguage } from "@/hooks/useLanguage";

export function LoadingScreen() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    </div>
  );
}