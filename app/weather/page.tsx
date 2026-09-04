export default function Weather() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          🌦️ Weather
        </h1>

        <p className="mt-2 text-gray-500">
          Weather information for smarter irrigation decisions.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-gray-500">🌡️ Temperature</p>
          <h2 className="mt-3 text-3xl font-bold">31°C</h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-gray-500">🌧️ Rain Probability</p>
          <h2 className="mt-3 text-3xl font-bold">20%</h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-gray-500">💨 Wind</p>
          <h2 className="mt-3 text-3xl font-bold">12 km/h</h2>
        </div>

      </section>

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          7-Day Forecast
        </h2>

        <div className="mt-5 flex h-64 items-center justify-center rounded-lg bg-gray-100">
          <p className="text-gray-500">
            Weather forecast will appear here
          </p>
        </div>
      </section>

    </main>
  );
}