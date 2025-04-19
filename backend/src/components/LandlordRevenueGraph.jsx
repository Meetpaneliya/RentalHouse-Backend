import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { TrendingUp, DollarSign, Users, Home } from "lucide-react";

const LandlordRevenueGraph = ({ record }) => {
  const {
    revenue = 0,
    historicalData = [],
    totalBookings = 0,
    averageOccupancy = 0,
  } = record.params || {};
  console.log(record.params);
  if (historicalData.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const chartData = useMemo(() => {
    return historicalData.map((item) => ({
      ...item,
      formattedDate: format(new Date(item.date), "MMM d"),
    }));
  }, [historicalData]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Revenue Overview</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Total Revenue
                </p>
                <p className="text-xl font-bold text-blue-700">
                  ${revenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Total Bookings
                </p>
                <p className="text-xl font-bold text-green-700">
                  {totalBookings}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  Avg. Occupancy
                </p>
                <p className="text-xl font-bold text-purple-700">
                  {averageOccupancy}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px] mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="occupancyGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="formattedDate"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#3B82F6"
              fill="url(#revenueGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="bookings"
              name="Bookings"
              stroke="#22C55E"
              fill="url(#bookingsGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="occupancyRate"
              name="Occupancy Rate"
              stroke="#A855F7"
              fill="url(#occupancyGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LandlordRevenueGraph;
