
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, BarChart3, Building2, GraduationCap, Users, MapPin, Briefcase, Brain, TrendingUp, Database, Target, Cpu, Cog } from "lucide-react";
import { Link } from "wouter";

function HomePage() {

  // 顶部导航标签页
  const navigationTabs = [
    { name: "首页", href: "/", active: true },
    { name: "五年规划", href: "/planning" },
    { name: "产业测评", href: "/planning?subPage=assessment" },
    { name: "产业研究与策划", href: "/planning?subPage=research" },
    { name: "集群打造", href: "/planning?subPage=cluster" },
    { name: "产业培训", href: "/planning?subPage=training" },
    { name: "园区托管", href: "/planning?subPage=park" },
    { name: "产业托管", href: "/planning?subPage=trusteeship" }
  ];

  // 我们的资源（左侧板块）
  const ourResources = [
    {
      number: "1.",
      title: "优质企业数据库",
      description: "（含上市公司、百强企业、独角兽、专精特新小巨人等）"
    },
    {
      number: "2.",
      title: "国内外专利及科研资源数据库",
      description: "（含各产业专利及使用情况、科研团队及机构信息、最新科研成果产业化状况等）"
    },
    {
      number: "3.",
      title: "国内主要产业拿地及投融资数据库",
      description: "（含全国所有企业国内拿地及优质企业投融资信息等）"
    },
    {
      number: "4.",
      title: "各产业研究报告库",
      description: "（含全国所有战新产业研究近年报告等）"
    }
  ];

  // 我们的服务（中间板块）
  const ourServices = [
    {
      title: "产业发展潜力测评",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/planning?subPage=assessment"
    },
    {
      title: "产业发展运营人才系统培养",
      icon: <GraduationCap className="h-5 w-5" />,
      href: "/planning?subPage=training"
    },
    {
      title: "产业共性技术攻关资源整合",
      icon: <Cpu className="h-5 w-5" />,
      href: "/planning?subPage=research"
    },
    {
      title: "产业集群打造全程辅导",
      icon: <Building2 className="h-5 w-5" />,
      href: "/planning?subPage=cluster"
    },
    {
      title: "产业链显性化与强链补链",
      icon: <Target className="h-5 w-5" />,
      href: "/planning?subPage=research"
    },
    {
      title: "产业发展运营全流程托管",
      icon: <Cog className="h-5 w-5" />,
      href: "/planning?subPage=trusteeship"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Title */}
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              产业集群智能体
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-wrap justify-center">
              {navigationTabs.map((tab, index) => (
                <Link key={index} href={tab.href}>
                  <div className={`px-4 py-3 mx-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                    tab.active 
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}>
                    {tab.name}
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Mobile Navigation - Scrollable */}
            <div className="md:hidden overflow-x-auto scrollbar-hide touch-scroll">
              <div className="flex gap-1 min-w-max">
                {navigationTabs.map((tab, index) => (
                  <Link key={index} href={tab.href}>
                    <div className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                      tab.active 
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-white' 
                        : 'border-transparent text-gray-500'
                    }`}>
                      {tab.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Left Column - Our Resources */}
          <div className="md:col-span-2 lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="text-center bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                <CardTitle className="text-lg font-bold text-red-700 dark:text-red-400">
                  我们的资源
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {ourResources.map((resource, index) => (
                    <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-start">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mr-2">
                          {resource.number}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {resource.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Our Services */}
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader className="text-center bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                <CardTitle className="text-base md:text-lg font-bold text-blue-700 dark:text-blue-400">
                  我们的服务
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  {ourServices.map((service, index) => (
                    <Link key={index} href={service.href}>
                      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 md:p-4 flex items-center space-x-2 md:space-x-3 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer">
                        <div className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                          {service.icon}
                        </div>
                        <span className="text-blue-700 dark:text-blue-300 font-medium text-sm md:text-base">
                          ▶ {service.title}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Our Achievements */}
          <div className="md:col-span-1 lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="text-center bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                <CardTitle className="text-base md:text-lg font-bold text-green-700 dark:text-green-400">
                  我们的成果
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {/* Achievement Grid - 15 cards arranged in 5 rows x 3 columns */}
                  {Array.from({ length: 15 }, (_, index) => (
                    <div key={index} className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-300 dark:border-blue-700 flex flex-col items-center justify-center p-1 md:p-2">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 dark:bg-blue-500 rounded mb-1"></div>
                      <div className="text-xs text-center text-blue-700 dark:text-blue-300 font-medium leading-tight">
                        成果{index + 1}
                      </div>
                      <div className="flex space-x-1 mt-1">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              开始您的产业发展评估
            </h2>
            <p className="text-blue-100 mb-6">
              立即体验专业的产业发展潜力评估与集群打造服务
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/planning">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  五年规划制定
                </Button>
              </Link>
              <Link href="/planning?subPage=assessment">
                <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white hover:bg-white hover:text-blue-600">
                  产业测评分析
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;