import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';

interface ChartRendererProps {
  chartData: any;
  className?: string;
}

const COLORS = ['#1e88e5', '#43a047', '#ff9800', '#e53935', '#8e24aa', '#00acc1'];

export default function ChartRenderer({ chartData, className = "" }: ChartRendererProps) {
  if (!chartData || !chartData.charts) {
    return null;
  }

  const renderChart = (chart: any, index: number) => {
    const { type, data, title, xKey, yKey } = chart;

    switch (type) {
      case 'pie':
      case 'doughnut':
        return (
          <div key={index} className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey={yKey || 'value'}
                >
                  {data.map((entry: any, entryIndex: number) => (
                    <Cell key={`cell-${entryIndex}`} fill={COLORS[entryIndex % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: string) => [`${value}`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'bar':
      case 'column':
        return (
          <div key={index} className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={xKey || 'name'} 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={yKey || 'value'} fill="#1e88e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'radar':
        return (
          <div key={index} className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={data}>
                <PolarGrid />
                <PolarAngleAxis dataKey={xKey || 'subject'} />
                <PolarRadiusAxis />
                <Radar 
                  name={title}
                  dataKey={yKey || 'value'} 
                  stroke="#1e88e5" 
                  fill="#1e88e5" 
                  fillOpacity={0.3} 
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'line':
        return (
          <div key={index} className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey || 'name'} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={yKey || 'value'} 
                  stroke="#1e88e5" 
                  strokeWidth={2}
                  dot={{ fill: '#1e88e5', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {chartData.charts.map((chart: any, index: number) => renderChart(chart, index))}
    </div>
  );
}