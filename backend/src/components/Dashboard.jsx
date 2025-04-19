import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Building2, DollarSign, Users, Activity } from "lucide-react";
import { ApiClient } from "adminjs";

const api = new ApiClient();

// Mock data - replace with real API data

const styles = {
  dashboard: {
    minHeight: "100vh",
    backgroundColor: "rgb(249, 250, 251)",
  },
  header: {
    backgroundColor: "white",
    borderBottom: "1px solid rgb(229, 231, 235)",
  },
  headerContent: {
    padding: "1.5rem 2rem",
  },
  headerTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "rgb(17, 24, 39)",
  },
  main: {
    padding: "2rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    border: "1px solid rgb(229, 231, 235)",
  },
  statHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  statIcon: {
    width: "2rem",
    height: "2rem",
    color: "rgb(79, 70, 229)",
  },
  statChangePositive: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "rgb(22, 163, 74)",
  },
  statChangeNegative: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "rgb(220, 38, 38)",
  },
  statTitle: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "rgb(107, 114, 128)",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "rgb(17, 24, 39)",
    marginTop: "0.25rem",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "2rem",
    "@media (minWidth: 1024px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
  },
  chartCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    border: "1px solid rgb(229, 231, 235)",
  },
  chartTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "rgb(17, 24, 39)",
    marginBottom: "1.5rem",
  },
};

function App() {
  const [chartData, setChartData] = useState([]);
  const [data, setData] = useState({
    totalRevenue: 0,
    totalLandlords: 0,
    totalUsers: 0,
    growth: 0,
  });
  useEffect(() => {
    api.getDashboard().then((res) => {
      setData(res.data);
      setChartData(res.data.chartData); // 👈 get chart data from API
    });
  }, []);

  useEffect(() => {
    api.getDashboard().then((res) => {
      setData(res.data);
    });
  }, []);

  const stats = [
    {
      title: "Total Revenue",
      value: `${data.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      change: `+${data.growth}%`,
    },
    {
      title: "Active Landlords",
      value: data.totalLandlords?.toString(),
      icon: Building2,
      change: "+7%", // Optional
    },
    {
      title: "Total Users",
      value: data.totalUsers?.toString(),
      icon: Users,
      change: "+12%", // Optional
    },
    {
      title: "Growth Rate",
      value: `${data.growth}%`,
      icon: Activity,
      change: `+${data.growth}%`, // Optional
    },
  ];

  return (
    <div style={styles.dashboard}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>Dashboard Overview</h1>
        </div>
      </header>

      <main style={styles.main}>
        {/* Stats */}
        <div style={styles.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.title} style={styles.statCard}>
              <div style={styles.statHeader}>
                <stat.icon style={styles.statIcon} />
                <span
                  style={
                    stat.change.startsWith("+")
                      ? styles.statChangePositive
                      : styles.statChangeNegative
                  }
                >
                  {stat.change}
                </span>
              </div>
              <h3 style={styles.statTitle}>{stat.title}</h3>
              <p style={styles.statValue}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Revenue Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#4F46E5"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="landlords"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Monthly Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#4F46E5" />
                <Bar dataKey="landlords" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
