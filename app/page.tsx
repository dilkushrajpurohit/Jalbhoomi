"use client";

import Link from "next/link";

export default function Home() {
  // Demo water usage data
  const waterUsage = [
    { day: "Mon", value: 42 },
    { day: "Tue", value: 58 },
    { day: "Wed", value: 47 },
    { day: "Thu", value: 65 },
    { day: "Fri", value: 52 },
    { day: "Sat", value: 38 },
    { day: "Sun", value: 44 },
  ];

  const maxUsage = Math.max(...waterUsage.map((item) => item.value));

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">

      {/* ================= HEADER ================= */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Good Morning 👋
        </h1>

        <p className="mt-2 text-gray-500">
          Here&apos;s the current status of your farm and water system.
        </p>
      </header>

      {/* ================= STATUS CARDS ================= */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {/* Water Level */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <p className="text-sm text-gray-500">
            💧 Water Level
          </p>

          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            42 m
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Current level
          </p>
        </div>
        
        {/* Well Health */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <p className="text-sm text-gray-500">
            ❤️ Well Health
          </p>

          <h2 className="mt-3 text-3xl font-bold text-green-600">
            87/100
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Good condition
          </p>
        </div>


        {/* Soil Moisture */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <p className="text-sm text-gray-500">
            🌱 Soil Moisture
          </p>

          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            38%
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Current condition
          </p>
        </div>


        {/* Pump Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <p className="text-sm text-gray-500">
            ⚡ Pump Status
          </p>

          <h2 className="mt-3 text-3xl font-bold text-gray-700">
            OFF
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Ready to operate
          </p>
        </div>

      </section>


      {/* ================= MAP + WEATHER ================= */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Groundwater Map */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">

          <div className="flex items-start justify-between gap-4">

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                🗺️ Groundwater Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Groundwater condition around your farm.
              </p>
            </div>

            <Link
              href="/pre-drilling"
              className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              View Analysis
            </Link>

          </div>


          {/* Map Area */}
          <div className="relative mt-5 h-80 overflow-hidden rounded-xl border bg-gray-100">

            {/* Background grid */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)",
                backgroundSize: "35px 35px",
              }}
            />

            {/* Map-like area */}
            <div className="absolute inset-0">

              {/* Farm area */}
              <div className="absolute left-[18%] top-[28%] h-28 w-40 rotate-[-8deg] rounded-2xl border-2 border-green-500 bg-green-100/70" />

              {/* Groundwater favorable zones */}
              <div className="absolute left-[45%] top-[35%] h-20 w-28 rounded-full bg-blue-200/70 blur-sm" />

              <div className="absolute left-[62%] top-[55%] h-24 w-36 rounded-full bg-blue-200/60 blur-sm" />


              {/* Groundwater monitoring points */}
              <div className="absolute left-[28%] top-[38%] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-lg" />

              <div className="absolute left-[49%] top-[42%] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-600 shadow-lg" />

              <div className="absolute left-[65%] top-[58%] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-lg" />

              <div className="absolute left-[75%] top-[30%] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-yellow-500 shadow-lg" />

            </div>


            {/* Center farm marker */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-green-600 text-xl shadow-lg">
                📍
              </div>

              <div className="mt-2 rounded-lg bg-white px-3 py-2 shadow-md">
                <p className="text-sm font-semibold text-gray-800">
                  Your Farm
                </p>

                <p className="text-xs text-gray-500">
                  Groundwater: Good
                </p>
              </div>

            </div>


            {/* Legend */}
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/95 p-3 shadow-md">

              <p className="mb-2 text-xs font-semibold text-gray-700">
                Groundwater Status
              </p>

              <div className="space-y-1.5 text-xs">

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                  <span>Good</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span>Moderate</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span>Low</span>
                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ================= WEATHER ================= */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-semibold text-gray-900">
              🌦️ Weather
            </h2>

            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              Today
            </span>

          </div>


          <div className="mt-8 text-center">

            <div className="text-6xl">
              ☀️
            </div>

            <h3 className="mt-4 text-4xl font-bold text-gray-900">
              31°C
            </h3>

            <p className="mt-2 text-gray-500">
              Jodhpur, Rajasthan
            </p>

          </div>


          <div className="mt-8 space-y-4">

            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm text-gray-500">
                🌧️ Rain Probability
              </span>

              <span className="font-semibold text-gray-900">
                20%
              </span>
            </div>


            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm text-gray-500">
                💨 Wind
              </span>

              <span className="font-semibold text-gray-900">
                12 km/h
              </span>
            </div>


            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                💧 Humidity
              </span>

              <span className="font-semibold text-gray-900">
                58%
              </span>
            </div>

          </div>

        </div>

      </section>


      {/* ================= ANALYTICS + AI ================= */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Water Usage */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                📊 Water Usage
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Weekly irrigation water consumption.
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                346 L
              </p>

              <p className="text-xs text-gray-500">
                This week
              </p>
            </div>

          </div>


          {/* Chart */}
          <div className="mt-6">

            <div className="flex h-64 items-end justify-between gap-3 border-b border-gray-200 px-2">

              {waterUsage.map((item) => {

                const height =
                  (item.value / maxUsage) * 85;

                return (
                  <div
                    key={item.day}
                    className="flex h-full flex-1 flex-col items-center justify-end"
                  >

                    <div className="mb-2 text-xs font-medium text-gray-500">
                      {item.value} L
                    </div>

                    <div
                      className="w-full max-w-10 rounded-t-lg bg-blue-500 transition hover:bg-blue-600"
                      style={{
                        height: `${height}%`,
                        minHeight: "10px",
                      }}
                    />

                    <div className="mt-3 text-xs font-medium text-gray-500">
                      {item.day}
                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </div>


        {/* AI Recommendation */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                🤖 AI Recommendation
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Smart irrigation decision.
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Healthy
            </span>

          </div>


          <div className="mt-5 rounded-xl border border-green-100 bg-green-50 p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-lg">
                ✓
              </div>

              <div className="min-w-0">

                <h3 className="font-semibold text-green-700">
                  Irrigation not required today
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Soil moisture is currently sufficient and rainfall
                  is expected. JalBhoomi recommends waiting before
                  starting irrigation.
                </p>

              </div>

            </div>

          </div>


          {/* Recommendation factors */}
          <div className="mt-5 grid grid-cols-2 gap-3">

            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Soil Moisture
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                38%
              </p>

              <p className="mt-1 text-xs text-green-600">
                Sufficient
              </p>
            </div>


            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Rainfall
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                Expected
              </p>

              <p className="mt-1 text-xs text-blue-600">
                Monitor
              </p>
            </div>

          </div>


          <Link
            href="/Ai-advisor"
            className="mt-5 block rounded-lg border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Ask AI Advisor →
          </Link>

        </div>

      </section>


      {/* ================= QUICK ACTIONS ================= */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          🚀 Quick Actions
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Quickly access JalBhoomi&apos;s main tools.
        </p>


        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Pre-Drilling */}
          <Link
            href="/pre-drilling"
            className="group rounded-xl border border-gray-200 p-5 transition hover:-translate-y-1 hover:bg-gray-50 hover:shadow-sm"
          >

            <div className="text-2xl">
              🔍
            </div>

            <h3 className="mt-3 font-semibold text-gray-900">
              Pre-Drilling
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Analyze a potential drilling location.
            </p>

            <p className="mt-4 text-sm font-medium text-blue-600">
              Open tool →
            </p>

          </Link>


          {/* Post-Drilling */}
          <Link
            href="/PostDrilling"
            className="group rounded-xl border border-gray-200 p-5 transition hover:-translate-y-1 hover:bg-gray-50 hover:shadow-sm"
          >

            <div className="text-2xl">
              💧
            </div>

            <h3 className="mt-3 font-semibold text-gray-900">
              Post-Drilling
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Monitor your borewell and sensors.
            </p>

            <p className="mt-4 text-sm font-medium text-blue-600">
              Open dashboard →
            </p>

          </Link>


          {/* Irrigation */}
          <Link
            href="/PostDrilling"
            className="group rounded-xl border border-gray-200 p-5 transition hover:-translate-y-1 hover:bg-gray-50 hover:shadow-sm"
          >

            <div className="text-2xl">
              🌱
            </div>

            <h3 className="mt-3 font-semibold text-gray-900">
              Irrigation
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Manage smart irrigation decisions.
            </p>

            <p className="mt-4 text-sm font-medium text-blue-600">
              Manage irrigation →
            </p>

          </Link>


          {/* AI Advisor */}
          <Link
            href="/Ai-advisor"
            className="group rounded-xl border border-gray-200 p-5 transition hover:-translate-y-1 hover:bg-gray-50 hover:shadow-sm"
          >

            <div className="text-2xl">
              🤖
            </div>

            <h3 className="mt-3 font-semibold text-gray-900">
              AI Advisor
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Get intelligent water recommendations.
            </p>

            <p className="mt-4 text-sm font-medium text-blue-600">
              Ask AI →
            </p>

          </Link>

        </div>

      </section>


      {/* ================= FOOTER ================= */}
      <footer className="mt-8 pb-4 text-center">

        <p className="text-xs text-gray-400">
          JalBhoomi • Smart Groundwater & Irrigation Management
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Prototype dashboard — sensor values shown here are demo values.
        </p>

      </footer>

    </main>
  );
}