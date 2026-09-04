"use client";

import { useState } from "react";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7days");

  // Sample data for charts
  const waterLevelData = [
    { time: "Mon", level: 38.2 },
    { time: "Tue", level: 39.5 },
    { time: "Wed", level: 41.2 },
    { time: "Thu", level: 42.1 },
    { time: "Fri", level: 42.8 },
    { time: "Sat", level: 42.6 },
    { time: "Sun", level: 43.1 },
  ];

  const flowRateData = [
    { time: "Mon", rate: 12.5 },
    { time: "Tue", rate: 14.8 },
    { time: "Wed", rate: 16.2 },
    { time: "Thu", rate: 17.8 },
    { time: "Fri", rate: 19.1 },
    { time: "Sat", rate: 18.4 },
    { time: "Sun", rate: 20.2 },
  ];

  const soilMoistureData = [
    { time: "Mon", moisture: 28 },
    { time: "Tue", moisture: 30 },
    { time: "Wed", moisture: 32 },
    { time: "Thu", moisture: 33 },
    { time: "Fri", moisture: 35 },
    { time: "Sat", moisture: 34 },
    { time: "Sun", moisture: 36 },
  ];

  const salinityData = [
    { time: "Mon", salinity: 1.8 },
    { time: "Tue", salinity: 1.75 },
    { time: "Wed", salinity: 1.72 },
    { time: "Thu", salinity: 1.70 },
    { time: "Fri", salinity: 1.68 },
    { time: "Sat", salinity: 1.72 },
    { time: "Sun", salinity: 1.71 },
  ];

  const maxWaterLevel = Math.max(...waterLevelData.map((d) => d.level));
  const maxFlowRate = Math.max(...flowRateData.map((d) => d.rate));
  const maxMoisture = 100;
  const maxSalinity = 2.5;

  const renderChart = (data: any[], max: number, unit: string) => {
    return (
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 w-12">{item.time}</span>
            <div className="flex-1 mx-3">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(item.value || Object.values(item)[1]) * (100 / max)}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-800 w-16 text-right">
              {Object.values(item)[1]} {unit}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
        <p className="mt-2 text-gray-500">Track your farm's performance metrics</p>

        {/* Time Range Filter */}
        <div className="mt-4 flex gap-2">
          {[
            { label: "7 Days", value: "7days" },
            { label: "30 Days", value: "30days" },
            { label: "90 Days", value: "90days" },
            { label: "1 Year", value: "1year" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === option.value
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Average Water Level</p>
          <h2 className="mt-3 text-3xl font-bold text-blue-600">
            {(waterLevelData.reduce((sum, d) => sum + d.level, 0) / waterLevelData.length).toFixed(1)} m
          </h2>
          <p className="mt-2 text-xs text-gray-500">Last 7 days</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Average Flow Rate</p>
          <h2 className="mt-3 text-3xl font-bold text-cyan-600">
            {(flowRateData.reduce((sum, d) => sum + d.rate, 0) / flowRateData.length).toFixed(1)} L/s
          </h2>
          <p className="mt-2 text-xs text-gray-500">Liters per second</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Average Soil Moisture</p>
          <h2 className="mt-3 text-3xl font-bold text-amber-600">
            {(soilMoistureData.reduce((sum, d) => sum + d.moisture, 0) / soilMoistureData.length).toFixed(0)}%
          </h2>
          <p className="mt-2 text-xs text-gray-500">Moisture level</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Average Salinity</p>
          <h2 className="mt-3 text-3xl font-bold text-orange-600">
            {(salinityData.reduce((sum, d) => sum + d.salinity, 0) / salinityData.length).toFixed(2)} ppt
          </h2>
          <p className="mt-2 text-xs text-gray-500">Parts per thousand</p>
        </div>
      </section>

      {/* Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water Level Chart */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">💧 Water Level Trend</h3>
          {renderChart(waterLevelData, maxWaterLevel, "m")}
          <p className="text-xs text-gray-500 mt-4">Measured in meters</p>
        </div>

        {/* Flow Rate Chart */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">💦 Flow Rate Trend</h3>
          {renderChart(flowRateData, maxFlowRate, "L/s")}
          <p className="text-xs text-gray-500 mt-4">Liters per second</p>
        </div>

        {/* Soil Moisture Chart */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🌱 Soil Moisture Trend</h3>
          {renderChart(soilMoistureData, maxMoisture, "%")}
          <p className="text-xs text-gray-500 mt-4">Soil moisture percentage</p>
        </div>

        {/* Salinity Chart */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🧂 Salinity Trend</h3>
          {renderChart(salinityData, maxSalinity, "ppt")}
          <p className="text-xs text-gray-500 mt-4">Parts per thousand</p>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Performance Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Water Quality</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Salinity Level</span>
                <span className="text-sm font-semibold text-green-600">✓ Good</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">pH Level</span>
                <span className="text-sm font-semibold text-green-600">✓ Optimal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Turbidity</span>
                <span className="text-sm font-semibold text-green-600">✓ Clear</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">System Health</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pump Status</span>
                <span className="text-sm font-semibold text-green-600">✓ Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pressure</span>
                <span className="text-sm font-semibold text-green-600">✓ Normal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sensors</span>
                <span className="text-sm font-semibold text-green-600">✓ Connected</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Recommendations</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-sm text-green-600 mt-0.5">→</span>
                <span className="text-sm text-gray-600">Monitor water level in next 48h</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm text-green-600 mt-0.5">→</span>
                <span className="text-sm text-gray-600">Schedule pump maintenance</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm text-green-600 mt-0.5">→</span>
                <span className="text-sm text-gray-600">Check soil moisture levels</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
