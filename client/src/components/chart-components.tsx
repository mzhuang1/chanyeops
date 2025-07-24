import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { TrendingUp, BarChart3, Activity, Target } from "lucide-react";

interface ChartComponentsProps {
  data: any;
}

export default function ChartComponents({ data }: ChartComponentsProps) {
  if (!data) return null;

  const renderRadarChart = (chartData: any[]) => (
    <Card className="bg-white border rounded-lg mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-center flex items-center justify-center">
          <Target className="w-4 h-4 mr-2 text-primary" />
          产业集群评估雷达图
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={chartData}>
            <PolarGrid className="stroke-gray-200" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
            />
            <PolarRadiusAxis 
              angle={0} 
              domain={[0, 100]} 
              tick={false} 
            />
            <Radar
              name="评估指标"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderMetricsCards = (metrics: any) => (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {metrics.innovationScore && (
        <div className="data-metric-card">
          <div className="data-metric-value text-lg">{metrics.innovationScore}分</div>
          <div className="data-metric-label">创新能力指数</div>
        </div>
      )}
      {metrics.policyScore && (
        <div className="data-metric-card">
          <div className="data-metric-value text-lg">{metrics.policyScore}分</div>
          <div className="data-metric-label">政策支持度</div>
        </div>
      )}
      {metrics.totalScore && (
        <div className="data-metric-card col-span-2">
          <div className="data-metric-value text-xl">{metrics.totalScore}分</div>
          <div className="data-metric-label">综合评分</div>
        </div>
      )}
    </div>
  );

  const renderTrendChart = (trendData: any[]) => (
    <Card className="bg-white border rounded-lg mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-center flex items-center justify-center">
          <TrendingUp className="w-4 h-4 mr-2 text-secondary" />
          发展趋势分析
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderBarChart = (barData: any[]) => (
    <Card className="bg-white border rounded-lg mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-center flex items-center justify-center">
          <BarChart3 className="w-4 h-4 mr-2 text-accent" />
          对比分析
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderPieChart = (pieData: any[]) => {
    const COLORS = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))'
    ];

    return (
      <Card className="bg-white border rounded-lg mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-center flex items-center justify-center">
            <Activity className="w-4 h-4 mr-2 text-purple-600" />
            结构分析
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderAreaChart = (areaData: any[]) => (
    <Card className="bg-white border rounded-lg mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-center flex items-center justify-center">
          <Activity className="w-4 h-4 mr-2 text-green-600" />
          发展历程分析
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={areaData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--secondary))" 
              fill="hsl(var(--secondary))"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Radar Chart */}
      {data.chartData?.radarData && renderRadarChart(data.chartData.radarData)}
      
      {/* Metrics Cards */}
      {data.metrics && renderMetricsCards(data.metrics)}
      
      {/* Trend Chart */}
      {data.chartData?.trendData && renderTrendChart(data.chartData.trendData)}
      
      {/* Bar Chart */}
      {data.chartData?.barData && renderBarChart(data.chartData.barData)}
      
      {/* Pie Chart */}
      {data.chartData?.pieData && renderPieChart(data.chartData.pieData)}
      
      {/* Area Chart */}
      {data.chartData?.areaData && renderAreaChart(data.chartData.areaData)}
      
      {/* Additional Analysis */}
      {data.analysis && (
        <Card className="bg-white border rounded-lg">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">分析结果</h4>
            <div className="prose prose-sm max-w-none">
              {typeof data.analysis === 'string' ? (
                <p>{data.analysis}</p>
              ) : (
                Object.entries(data.analysis).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <Card className="bg-white border rounded-lg">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">发展建议</h4>
            <div className="space-y-2">
              {data.recommendations.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
