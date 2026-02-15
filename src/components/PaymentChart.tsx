import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { AmortizationRow } from '../types/mortgage';
import { formatCurrency } from '../utils/mortgage';

interface Props {
  schedule: AmortizationRow[];
}

interface ChartDataPoint {
  year: number;
  principal: number;
  interest: number;
  balance: number;
}

export default function PaymentChart({ schedule }: Props) {
  if (schedule.length === 0) return null;

  const chartData: ChartDataPoint[] = [];
  for (let i = 11; i < schedule.length; i += 12) {
    const yearStart = i - 11;
    let yearPrincipal = 0;
    let yearInterest = 0;
    for (let j = yearStart; j <= i; j++) {
      yearPrincipal += schedule[j].principal;
      yearInterest += schedule[j].interest;
    }
    chartData.push({
      year: Math.floor(i / 12) + 1,
      principal: Math.round(yearPrincipal),
      interest: Math.round(yearInterest),
      balance: Math.round(schedule[i].remainingBalance),
    });
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
          <XAxis
            dataKey="year"
            label={{ value: 'Year', position: 'insideBottom', offset: -5, fontSize: 12 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
            labelFormatter={(label: number) => `Year ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="principal"
            name="Principal"
            stackId="1"
            stroke="#1a73e8"
            fill="#e8f0fe"
          />
          <Area
            type="monotone"
            dataKey="interest"
            name="Interest"
            stackId="1"
            stroke="#ea4335"
            fill="#fce8e6"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
