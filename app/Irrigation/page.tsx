export default function Irrigation() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Smart Irrigation
        </h1>

        <p className="mt-2 text-gray-500">
          Manage irrigation using soil, crop, weather and groundwater data.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">🌱 Soil Moisture</p>
          <h2 className="mt-3 text-3xl font-bold">38%</h2>
          <p className="mt-2 text-sm text-gray-500">Current condition</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">🌾 Crop</p>
          <h2 className="mt-3 text-2xl font-bold">Wheat</h2>
          <p className="mt-2 text-sm text-gray-500">Growth stage: Vegetative</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">🌦️ Rain Probability</p>
          <h2 className="mt-3 text-3xl font-bold">20%</h2>
          <p className="mt-2 text-sm text-gray-500">Next 24 hours</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">⚡ Pump</p>
          <h2 className="mt-3 text-2xl font-bold text-green-600">
            OFF
          </h2>
          <p className="mt-2 text-sm text-gray-500">Ready to operate</p>
        </div>

      </section>

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          🤖 AI Irrigation Recommendation
        </h2>

        <div className="mt-5 rounded-lg bg-green-50 p-5">
          <h3 className="font-semibold text-green-700">
            Irrigation not required now
          </h3>

          <p className="mt-2 text-gray-600">
            Soil moisture is sufficient and rainfall is expected.
          </p>
        </div>
      </section>

    </main>
  );
}