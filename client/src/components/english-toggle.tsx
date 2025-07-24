import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

export default function EnglishToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleToEnglish = () => {
    // Clear any cached language preference and force English
    localStorage.removeItem('language');
    localStorage.setItem('language', 'en');
    setLanguage('en');
    window.location.reload();
  };

  if (language === 'en') {
    return null; // Don't show if already in English
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button 
        onClick={toggleToEnglish}
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        size="sm"
      >
        🇺🇸 Switch to English
      </Button>
    </div>
  );
}