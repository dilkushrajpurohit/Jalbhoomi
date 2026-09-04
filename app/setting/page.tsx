export default function Settings() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          ⚙️ Settings
        </h1>

        <p className="mt-2 text-gray-500">
          Manage your JalBhoomi preferences.
        </p>
      </header>

      <section className="max-w-3xl rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold">
          Farmer Information
        </h2>

        <div className="mt-6 space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium">
              Farmer Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Farm Location
            </label>

            <input
              type="text"
              placeholder="Enter farm location"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <button className="rounded-lg bg-green-600 px-6 py-3 text-white">
            Save Settings
          </button>

        </div>

      </section>

    </main>
  );
}