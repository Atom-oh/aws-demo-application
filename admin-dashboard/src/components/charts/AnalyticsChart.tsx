'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { ChartDataPoint, TimeSeriesData } from '@/types';

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];

interface BaseChartProps {
  title: string;
  description?: string;
  className?: string;
}

interface LineChartProps extends BaseChartProps {
  data: TimeSeriesData[];
  dataKey?: string;
  color?: string;
  showGrid?: boolean;
  height?: number;
}

export function AnalyticsLineChart({
  title,
  description,
  data,
  dataKey = 'value',
  color = COLORS[0],
  showGrid = true,
  height = 300,
  className,
}: LineChartProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} />
      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface AreaChartProps extends BaseChartProps {
  data: TimeSeriesData[];
  dataKey?: string;
  color?: string;
  height?: number;
}

export function AnalyticsAreaChart({
  title,
  description,
  data,
  dataKey = 'value',
  color = COLORS[0],
  height = 300,
  className,
}: AreaChartProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} />
      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface BarChartProps extends BaseChartProps {
  data: ChartDataPoint[];
  dataKey?: string;
  color?: string;
  height?: number;
}

export function AnalyticsBarChart({
  title,
  description,
  data,
  dataKey = 'value',
  color = COLORS[0],
  height = 300,
  className,
}: BarChartProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} />
      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface MultiLineChartProps extends BaseChartProps {
  data: Record<string, unknown>[];
  lines: { dataKey: string; color: string; name: string }[];
  height?: number;
}

export function MultiLineChart({
  title,
  description,
  data,
  lines,
  height = 300,
  className,
}: MultiLineChartProps) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} />
      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={2}
                name={line.name}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface PieChartProps extends BaseChartProps {
  data: ChartDataPoint[];
  height?: number;
}

export function AnalyticsPieChart({
  title,
  description,
  data,
  height = 300,
  className,
}: PieChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }));
  }, [data]);

  return (
    <Card className={className}>
      <CardHeader title={title} description={description} />
      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// Custom Tooltip Component
function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-gray-900">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            {typeof entry.value === 'number'
              ? entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default AnalyticsLineChart;
