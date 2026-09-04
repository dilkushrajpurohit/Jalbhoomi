"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

type SensorData = {
  waterLevel: number;
  flowRate: number;
  salinity: number | null;
  salinitySimulated: boolean;
  soilMoisture: number;
  soilMoistureSimulated: boolean;
  soilStatus: string;
  pumpOn: boolean;
  total: number;
  health: number;
  safety: string;
  ai: string;
  runMin: number;
};

type HistoryPoint = {
  time: string;
  waterLevel: number;
  flowRate: number;
  soilMoisture: number;
};

type WeatherData = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    rain?: number;
  };

  daily?: {
    precipitation_sum?: number[];
  };
};

function simulatedReading(minimum: number, maximum: number, phase = 0) {
  const cycle = (Date.now() / 45000 + phase) * Math.PI * 2;
  const midpoint = (minimum + maximum) / 2;
  const amplitude = (maximum - minimum) / 2;

  return Number((midpoint + Math.sin(cycle) * amplitude).toFixed(2));
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PostDrilling() {

  /* =======================================================
     SIMULATED SENSOR DATA
  ======================================================= */

  const [sensor, setSensor] = useState<SensorData>({
    waterLevel: 0,
    flowRate: 0,
    salinity: null,
    salinitySimulated: false,
    soilMoisture: 0,
    soilMoistureSimulated: false,
    soilStatus: "UNKNOWN",
    pumpOn: false,
    total: 0,
    health: 0,
    safety: "UNKNOWN",
    ai: "WAIT",
    runMin: 0,
  });

  /* =======================================================
     HISTORY
  ======================================================= */

  const [history, setHistory] = useState<HistoryPoint[]>([]);

  /* =======================================================
     WEATHER
  ======================================================= */

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(false);

  /* =======================================================
     FARMER INPUT
  ======================================================= */

  const [crop, setCrop] =
    useState("Wheat");

  const [growthStage, setGrowthStage] =
    useState("Vegetative");

  const [fieldSize, setFieldSize] =
    useState(2);

  /* =======================================================
     UI
  ======================================================= */

const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [esp32Connected, setEsp32Connected] = useState(false);
  const [sensorError, setSensorError] = useState<string | null>(null);

  const [autoIrrigation, setAutoIrrigation] =
    useState(true);

  const [alertEnabled, setAlertEnabled] =
    useState(true);

  /* =======================================================
     DATABASE
  ======================================================= */

  const [databaseStatus, setDatabaseStatus] =
    useState<"idle" | "saving" | "saved" | "error">("idle");

  const saveSensorData = async (reading: SensorData) => {
    try {
      setDatabaseStatus("saving");

      const response = await fetch("/api/sensor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          borewell_id: "BW-001",
          water_level: reading.waterLevel,
          flow_rate: reading.flowRate,
          salinity: reading.salinity,
          soil_moisture: reading.soilMoisture,
          pump_status: reading.pumpOn,
          rainfall,
          temperature:
            weather?.current?.temperature_2m ?? null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Failed to save sensor reading"
        );
      }

      setDatabaseStatus("saved");
    } catch (error) {
      console.error("Database save error:", error);
      setDatabaseStatus("error");
    }
  };

  /* =======================================================
     WEATHER API
  ======================================================= */

  const getWeather = async () => {

    try {

      setWeatherLoading(true);

      /*
        Using a fixed demo location for now.

        Later this can use the farmer's
        actual GPS coordinates.
      */

      const latitude = 26.2389;
      const longitude = 73.0243;

      const response = await fetch(
        `/api/weather?latitude=${latitude}&longitude=${longitude}`
      );

      if (!response.ok) {
        throw new Error("Weather request failed");
      }

      const data = await response.json();

      setWeather(data);

    } catch (error) {

      console.error(
        "Weather error:",
        error
      );

    } finally {

      setWeatherLoading(false);

    }
  };

  /* =======================================================
     INITIAL WEATHER
  ======================================================= */

  useEffect(() => {

    getWeather();

  }, []);

  /* =======================================================
     LIVE ESP32 SENSOR UPDATE
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchSensorData = async () => {
      try {
        const response = await fetch("/api/sensor", {
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `ESP32 request failed (${response.status})`
          );
        }

        const result = await response.json();

        if (!result.success || !result.sensor) {
          throw new Error(result.error || "Invalid ESP32 response");
        }

        const data = result.sensor;

        const soilStatus = String(data.soil ?? "UNKNOWN");
        const hasSalinity = data.salinity !== null && data.salinity !== undefined;
        const hasSoilMoisture =
          data.soilMoisture !== null && data.soilMoisture !== undefined;

        const newSensor: SensorData = {
          waterLevel: Number(data.waterLevel ?? data.level ?? 0),
          flowRate: Number(data.flowRate ?? data.flow ?? 0),
          salinity: hasSalinity
            ? Number(data.salinity)
            : simulatedReading(1.2, 2.4, 0.25),
          salinitySimulated: !hasSalinity,
          soilMoisture: hasSoilMoisture
            ? Number(data.soilMoisture)
            : soilStatus === "WET"
              ? simulatedReading(55, 78, 0.5)
              : simulatedReading(18, 38, 0.5),
          soilMoistureSimulated: !hasSoilMoisture,
          soilStatus,
          pumpOn: Number(data.runMin ?? 0) > 0,
          total: Number(data.total ?? 0),
          health: Number(data.health ?? 0),
          safety: String(data.safety ?? "UNKNOWN"),
          ai: String(data.ai ?? "WAIT"),
          runMin: Number(data.runMin ?? 0),
        };

        if (!mounted) return;

        setSensor(newSensor);
        setEsp32Connected(true);
        setSensorError(null);
        setLastUpdated(new Date());

        setHistory((oldHistory) => [
          ...oldHistory.slice(-9),
          {
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            waterLevel: newSensor.waterLevel,
            flowRate: newSensor.flowRate,
            soilMoisture: newSensor.soilMoisture,
          },
        ]);
      } catch (error) {
        console.error("ESP32 fetch error:", error);
        if (mounted) {
          setEsp32Connected(false);
          setSensorError(
            error instanceof Error ? error.message : "Unable to read ESP32 data"
          );
          setDatabaseStatus("error");
        }
      }
    };

    void fetchSensorData();

    const interval = window.setInterval(() => {
      void fetchSensorData();
    }, 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  /* =======================================================
     DATABASE AUTO-SAVE
  ======================================================= */
const sensorRef = useRef(sensor);

  useEffect(() => {
    sensorRef.current = sensor;
  }, [sensor]);

  useEffect(() => {
    const interval = setInterval(() => {
      void saveSensorData(sensorRef.current);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /* =======================================================
     WELL HEALTH SCORE
  ======================================================= */

  const wellHealth = sensor.health;

  /* =======================================================
     WATER QUALITY
  ======================================================= */

  const waterQuality = useMemo(() => {

    if (sensor.salinity === null) {
      return "Not Available";
    }

    if (sensor.salinity < 1) {
      return "Excellent";
    }

    if (sensor.salinity < 2) {
      return "Good";
    }

    if (sensor.salinity < 3) {
      return "Moderate";
    }

    return "Poor";

  }, [sensor.salinity]);

  /* =======================================================
     DRAW DOWN
  ======================================================= */

  const drawdown = useMemo(() => {

    if (history.length === 0) {
      return 0;
    }

    const initial =
      history[0].waterLevel;

    const current =
      sensor.waterLevel;

    return Number(
      Math.max(
        0,
        current - initial
      ).toFixed(1)
    );

  }, [history, sensor.waterLevel]);

  /* =======================================================
     RECOVERY
  ======================================================= */

  const recovery = useMemo(() => {

    if (history.length < 2) {
      return 0;
    }

    const previous =
      history[
        history.length - 2
      ].waterLevel;

    const current =
      sensor.waterLevel;

    if (sensor.pumpOn) {
      return 0;
    }

    return Number(
      Math.max(
        0,
        previous - current
      ).toFixed(1)
    );

  }, [history, sensor]);

  /* =======================================================
     RAINFALL
  ======================================================= */

  const rainfall =
    weather?.daily
      ?.precipitation_sum
      ?.slice(0, 7)
      .reduce(
        (sum, value) =>
          sum + (value || 0),
        0
      ) ?? 0;

  /* =======================================================
     IRRIGATION RECOMMENDATION
  ======================================================= */

  const irrigation = useMemo(() => {

    if (
      sensor.soilMoisture < 20
    ) {

      return {
        status: "Irrigation Required",
        message:
          "Soil moisture is low. Irrigation is recommended.",
        action: "START",
      };

    }

    if (
      sensor.soilMoisture < 30
    ) {

      return {
        status: "Monitor Soil",
        message:
          "Soil moisture is approaching the irrigation threshold.",
        action: "MONITOR",
      };

    }

    return {
      status: "No Irrigation Required",
      message:
        "Current soil moisture is sufficient.",
      action: "STOP",
    };

  }, [sensor.soilMoisture]);

  /* =======================================================
     PUMP CONTROL
  ======================================================= */

  /* =======================================================
     GRAPH MAXIMUMS
  ======================================================= */

  const maxWater = Math.max(
    ...history.map(
      (item) =>
        item.waterLevel
    ),
    1
  );

  const maxFlow = Math.max(
    ...history.map(
      (item) =>
        item.flowRate
    ),
    1
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main className="min-h-screen bg-gray-50 p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="mb-8">

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <h1 className="text-3xl font-bold text-gray-900">
              Post-Drilling Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Monitor your borewell, water level,
              irrigation and well health.
            </p>

          </div>

          <div className="rounded-lg bg-white px-4 py-3 shadow-sm">

            <p className="text-xs text-gray-500">
              SENSOR STATUS
            </p>

            <p className={`font-semibold ${
              esp32Connected ? "text-green-600" : "text-red-600"
            }`}>
              {esp32Connected ? "● ESP32 Connected" : "● ESP32 Disconnected"}
            </p>

         <p className="text-xs text-gray-400">
  Updated{" "}
  {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
</p>

          </div>

        </div>

        {sensorError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Sensor connection error: {sensorError}. Connect this computer to the
            ESP32 Wi-Fi network and verify 192.168.4.1 is reachable.
          </div>
        )}

      </header>


      {/* =================================================
          DEMO NOTICE
      ================================================= */}

      <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-800">
          <strong>🟢 Live Hardware Mode:</strong>{" "}
          Sensor readings are being received from the JalBhoomi ESP32 over Wi-Fi.
          Dashboard refreshes every 5 seconds.
        </p>
      </div>


      {/* =================================================
          LIVE SENSOR CARDS
      ================================================= */}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">


        {/* WATER LEVEL */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            💧 Water Level
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            {sensor.waterLevel} m
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Current borewell level
          </p>

        </div>


        {/* FLOW */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            🚰 Flow Rate
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            {sensor.flowRate} L/min
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Pump discharge
          </p>

        </div>


        {/* SALINITY */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            🧂 Water Salinity
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            {sensor.salinity === null ? "N/A" : `${sensor.salinity} dS/m`}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {sensor.salinitySimulated
              ? "Demo value · "
              : "Quality: "}
            {waterQuality}
          </p>

        </div>


        {/* SOIL */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            🌱 Soil Moisture
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            {sensor.soilMoisture}%
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {sensor.soilMoistureSimulated
              ? `Demo percentage · Status: ${sensor.soilStatus}`
              : "Field soil condition"}
          </p>

        </div>

      </section>

      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">💧 Total Water</p>
          <h2 className="mt-3 text-3xl font-bold">
            {sensor.total.toFixed(2)}
          </h2>
          <p className="mt-2 text-sm text-gray-500">Hardware total</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">⏱️ Pump Runtime</p>
          <h2 className="mt-3 text-3xl font-bold">
            {sensor.runMin} min
          </h2>
          <p className="mt-2 text-sm text-gray-500">Current runtime</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">🛡️ Safety</p>
          <h2 className={`mt-3 text-2xl font-bold ${
            sensor.safety === "NORMAL" ? "text-green-600" : "text-red-600"
          }`}>
            {sensor.safety}
          </h2>
          <p className="mt-2 text-sm text-gray-500">ESP32 safety status</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">🤖 AI Status</p>
          <h2 className="mt-3 text-2xl font-bold">{sensor.ai}</h2>
          <p className="mt-2 text-sm text-gray-500">Hardware AI state</p>
        </div>
      </section>


      {/* =================================================
          PUMP + WELL HEALTH
      ================================================= */}

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">


        {/* PUMP */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-xl font-semibold">
                ⚡ Pump Control
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Borewell motor status
              </p>

            </div>

            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                sensor.pumpOn
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >

              {sensor.pumpOn
                ? "● RUNNING"
                : "● OFF"}

            </div>

          </div>


          <button
            type="button"
            disabled
            className="mt-6 w-full cursor-not-allowed rounded-lg bg-gray-300 px-6 py-4 text-lg font-semibold text-gray-600"
          >
            Pump control unavailable
          </button>


          <div className="mt-5 grid grid-cols-2 gap-4">

            <div className="rounded-lg bg-gray-50 p-4">

              <p className="text-sm text-gray-500">
                Flow
              </p>

              <p className="mt-1 text-xl font-bold">
                {sensor.flowRate} L/min
              </p>

            </div>


            <div className="rounded-lg bg-gray-50 p-4">

              <p className="text-sm text-gray-500">
                Water Level
              </p>

              <p className="mt-1 text-xl font-bold">
                {sensor.waterLevel} m
              </p>

            </div>

          </div>

        </div>


        {/* WELL HEALTH */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold">
            ❤️ Well Health
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Overall borewell condition
          </p>


          <div className="mt-6 flex items-center gap-6">

            <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-green-500">

              <span className="text-3xl font-bold">
                {wellHealth}
              </span>

            </div>


            <div>

              <h3 className="text-2xl font-bold text-green-600">

                {wellHealth >= 80
                  ? "Healthy"
                  : wellHealth >= 60
                  ? "Moderate"
                  : "Attention Required"}

              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Based on water level,
                flow and water quality indicators.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          DRAW DOWN / RECOVERY
      ================================================= */}

      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">


        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            📉 Drawdown
          </p>

          <h3 className="mt-3 text-3xl font-bold">
            {drawdown} m
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Change during monitoring
          </p>

        </div>


        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            ♻️ Recovery
          </p>

          <h3 className="mt-3 text-3xl font-bold">
            {recovery} m
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Recovery after pumping
          </p>

        </div>


        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            🧂 Water Quality
          </p>

          <h3 className="mt-3 text-3xl font-bold">
            {waterQuality}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            EC/Salinity indicator
          </p>

        </div>

      </section>


      {/* =================================================
          WEATHER
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold">
          🌧️ Weather & Recharge
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Environmental conditions affecting irrigation
          and groundwater recharge.
        </p>


        {weatherLoading ? (

          <p className="mt-5 text-gray-500">
            Loading weather...
          </p>

        ) : (

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">


            <div className="rounded-lg bg-blue-50 p-5">

              <p className="text-sm text-gray-500">
                🌡️ Temperature
              </p>

              <p className="mt-2 text-3xl font-bold">

                {weather?.current
                  ?.temperature_2m ??
                  "N/A"}
                °C

              </p>

            </div>


            <div className="rounded-lg bg-blue-50 p-5">

              <p className="text-sm text-gray-500">
                💧 Humidity
              </p>

              <p className="mt-2 text-3xl font-bold">

                {weather?.current
                  ?.relative_humidity_2m ??
                  "N/A"}
                %

              </p>

            </div>


            <div className="rounded-lg bg-blue-50 p-5">

              <p className="text-sm text-gray-500">
                🌧️ Recent Rainfall
              </p>

              <p className="mt-2 text-3xl font-bold">

                {rainfall.toFixed(
                  1
                )}{" "}
                mm

              </p>

            </div>

          </div>

        )}

      </section>


      {/* =================================================
          IRRIGATION AI
      ================================================= */}

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">


        {/* FARMER INPUT */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold">
            🌾 Crop & Field Information
          </h2>

          <div className="mt-6 space-y-5">


            <div>

              <label className="mb-2 block text-sm font-medium">
                Crop
              </label>

              <select
                value={crop}
                onChange={(e) =>
                  setCrop(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-3"
              >

                <option>
                  Wheat
                </option>

                <option>
                  Mustard
                </option>

                <option>
                  Cotton
                </option>

                <option>
                  Bajra
                </option>

                <option>
                  Maize
                </option>

                <option>
                  Tomato
                </option>

              </select>

            </div>


            <div>

              <label className="mb-2 block text-sm font-medium">
                Growth Stage
              </label>

              <select
                value={
                  growthStage
                }
                onChange={(e) =>
                  setGrowthStage(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-3"
              >

                <option>
                  Germination
                </option>

                <option>
                  Vegetative
                </option>

                <option>
                  Flowering
                </option>

                <option>
                  Fruiting
                </option>

                <option>
                  Maturity
                </option>

              </select>

            </div>


            <div>

              <label className="mb-2 block text-sm font-medium">
                Field Size
              </label>

              <div className="flex items-center gap-3">

                <input
                  type="number"
                  min="0.1"
                  value={
                    fieldSize
                  }
                  onChange={(e) =>
                    setFieldSize(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full rounded-lg border px-4 py-3"
                />

                <span>
                  acres
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* AI */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold">
            🤖 AI Irrigation Recommendation
          </h2>


          <div className="mt-5 rounded-xl bg-green-50 p-5">

            <h3 className="text-xl font-bold text-green-700">

              {irrigation.status}

            </h3>


            <p className="mt-3 leading-6 text-gray-600">

              {irrigation.message}

            </p>


            <div className="mt-5 space-y-2 text-sm">

              <p>
                <strong>
                  Crop:
                </strong>{" "}
                {crop}
              </p>

              <p>
                <strong>
                  Growth Stage:
                </strong>{" "}
                {growthStage}
              </p>

              <p>
                <strong>
                  Field:
                </strong>{" "}
                {fieldSize} acres
              </p>

              <p>
                <strong>
                  Soil Moisture:
                </strong>{" "}
                {sensor.soilMoisture}%
              </p>

              <p>
                <strong>
                  Recent Rainfall:
                </strong>{" "}
                {rainfall.toFixed(
                  1
                )}{" "}
                mm
              </p>

            </div>

          </div>


          <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 p-4">

            <div>

              <p className="font-semibold">
                🤖 Auto Irrigation
              </p>

              <p className="text-sm text-gray-500">
                Automatically control pump
                based on conditions.
              </p>

            </div>


            <button
              onClick={() =>
                setAutoIrrigation(
                  !autoIrrigation
                )
              }
              className={`rounded-full px-5 py-2 font-semibold ${
                autoIrrigation
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
            >

              {autoIrrigation
                ? "ON"
                : "OFF"}

            </button>

          </div>

        </div>

      </section>


      {/* =================================================
          WATER LEVEL GRAPH
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold">
          📈 Water Level Monitoring
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Live groundwater-level history from ESP32.
        </p>


        <div className="mt-8 flex h-64 items-end gap-2 overflow-x-auto">

          {history.map(
            (point, index) => {

              const height =
                (point.waterLevel /
                  maxWater) *
                180;

              return (

                <div
                  key={index}
                  className="flex min-w-13.75 flex-col items-center justify-end"
                >

                  <span className="mb-2 text-xs">
                    {point.waterLevel}
                  </span>

                  <div
                    className="w-8 shrink-0 rounded-t bg-blue-500"
                    style={{
                      height: `${height}px`,
                      minHeight: "8px",
                    }}
                  />

                  <span className="mt-2 text-xs text-gray-500">
                    {point.time}
                  </span>

                </div>

              );

            }
          )}

        </div>

      </section>


      {/* =================================================
          FLOW GRAPH
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold">
          🚰 Pumping / Flow History
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Flow-rate monitoring from the borewell.
        </p>


        <div className="mt-8 flex h-64 items-end gap-2 overflow-x-auto">

          {history.map(
            (point, index) => {

              const height =
                (point.flowRate /
                  maxFlow) *
                180;

              return (

                <div
                  key={index}
                  className="flex min-w-13.75 flex-col items-center justify-end"
                >

                  <span className="mb-2 text-xs">
                    {point.flowRate}
                  </span>

                  <div
                    className="w-8 shrink-0 rounded-t bg-cyan-500"
                    style={{
                      height: `${height}px`,
                      minHeight: "8px",
                    }}
                  />

                  <span className="mt-2 text-xs text-gray-500">
                    {point.time}
                  </span>

                </div>

              );

            }
          )}

        </div>

      </section>


      {/* =================================================
          ALERTS
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>

            <h2 className="text-xl font-semibold">
              🚨 Well Alerts & Protection
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              JalBhoomi continuously checks borewell
              conditions.
            </p>

          </div>


          <button
            onClick={() =>
              setAlertEnabled(
                !alertEnabled
              )
            }
            className={`rounded-lg px-5 py-2 font-semibold ${
              alertEnabled
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >

            Alerts{" "}
            {alertEnabled
              ? "ON"
              : "OFF"}

          </button>

        </div>


        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">


          {/* WATER LEVEL */}

          <div className="rounded-lg border p-4">

            <p className="font-semibold">
              💧 Water Level
            </p>

            <p className="mt-2 text-sm text-gray-500">

              {sensor.waterLevel >
              60
                ? "⚠️ Critical water level"
                : "✅ Safe"}

            </p>

          </div>


          {/* QUALITY */}

          <div className="rounded-lg border p-4">

            <p className="font-semibold">
              🧂 Water Quality
            </p>

            <p className="mt-2 text-sm text-gray-500">

              {sensor.salinity === null
                ? "ℹ️ Salinity sensor not available"
                : sensor.salinity > 3
                  ? "⚠️ High salinity"
                  : "✅ Acceptable"}

            </p>

          </div>


          {/* FLOW */}

          <div className="rounded-lg border p-4">

            <p className="font-semibold">
              🚰 Pump Flow
            </p>

            <p className="mt-2 text-sm text-gray-500">

              {sensor.pumpOn &&
              sensor.flowRate <
                5
                ? "⚠️ Low flow detected"
                : "✅ Normal"}

            </p>

          </div>

        </div>

      </section>


      {/* =================================================
          DATABASE STATUS
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              🗄️ Data Storage
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Sensor readings are stored in the JalBhoomi database for historical analysis and future AI insights.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium">
            {databaseStatus === "saving" && "⏳ Saving reading..."}
            {databaseStatus === "saved" && "✅ Data saved"}
            {databaseStatus === "error" && "❌ Database error"}
            {databaseStatus === "idle" && "○ Waiting for first reading"}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void saveSensorData(sensor)}
          disabled={databaseStatus === "saving"}
          className="mt-5 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          💾 Save Current Reading
        </button>
      </section>


      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-800">

        <strong>
          ⚠️ Prototype Notice:
        </strong>{" "}
        Sensor readings in this Post-Drilling
        dashboard are received from the ESP32 hardware.
        Pump-control UI remains a local demonstration until
        a dedicated, safety-validated ESP32 control endpoint
        is connected. Always use proper field calibration,
        hydrogeological assessment, and safe electrical
        controls.

      </div>

    </main>
  );
}