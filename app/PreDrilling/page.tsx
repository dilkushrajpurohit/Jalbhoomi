"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* =====================================================
   LEAFLET ICON FIX
===================================================== */

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* =====================================================
   TYPES
===================================================== */

type GroundwaterPoint = {
  station: string;
  district: string;
  tehsil: string;
  block: string;
  village: string;
  latitude: number;
  longitude: number;
  date: string;
  groundwaterLevel: number;
  distance?: number;
};

type StationAnalysis = {
  station: string;
  district: string;
  latitude: number;
  longitude: number;
  latestLevel: number;
  averageLevel: number;
  minimumLevel: number;
  maximumLevel: number;
  observations: number;
  latestDate: string;
  trend: "Rising" | "Declining" | "Stable";
  distance: number;
};

type WeatherData = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    rain?: number;
    weather_code?: number;
  };

  hourly?: {
    time?: string[];
    soil_moisture_0_to_1cm?: number[];
    soil_moisture_1_to_3cm?: number[];
    precipitation?: number[];
  };

  daily?: {
    time?: string[];
    precipitation_sum?: number[];
    et0_fao_evapotranspiration?: number[];
  };
};

/* =====================================================
   MAP UPDATER
===================================================== */

function MapUpdater({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], 13);
  }, [latitude, longitude, map]);

  return null;
}

/* =====================================================
   DISTANCE CALCULATOR
===================================================== */

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;

  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

/* =====================================================
   MAIN COMPONENT
===================================================== */

export default function PreDrilling() {
  /* ===================================================
     LOCATION
  =================================================== */

  const [location, setLocation] = useState(
    "Jodhpur, Rajasthan"
  );

  const [latitude, setLatitude] =
    useState<number>(26.2389);

  const [longitude, setLongitude] =
    useState<number>(73.0243);

  /* ===================================================
     GROUNDWATER
  =================================================== */

  const [
    groundwaterPoints,
    setGroundwaterPoints,
  ] = useState<GroundwaterPoint[]>([]);

  const [
    nearbyPoints,
    setNearbyPoints,
  ] = useState<GroundwaterPoint[]>([]);

  const [
    stationAnalyses,
    setStationAnalyses,
  ] = useState<StationAnalysis[]>([]);

  /* ===================================================
     WEATHER
  =================================================== */

  const [weatherData, setWeatherData] =
    useState<WeatherData | null>(null);

  const [
    weatherLoading,
    setWeatherLoading,
  ] = useState(false);

  /* ===================================================
     UI
  =================================================== */

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [radius, setRadius] =
    useState(50);

  /* ===================================================
     FETCH GROUNDWATER
  =================================================== */

  const loadGroundwaterData =
    async () => {
      try {
        const response = await fetch(
          "/api/groundwater",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Groundwater API failed"
          );
        }

        const data =
          await response.json();

        const cleaned: GroundwaterPoint[] =
          data
            .map((point: any) => ({
              station:
                point.station ?? "",

              district:
                point.district ?? "",

              tehsil:
                point.tehsil ?? "",

              block:
                point.block ?? "",

              village:
                point.village ?? "",

              latitude:
                Number(point.latitude),

              longitude:
                Number(point.longitude),

              date:
                point.date ?? "",

              groundwaterLevel:
                Number(
                  point.groundwaterLevel
                ),
            }))
            .filter(
              (
                point: GroundwaterPoint
              ) =>
                Number.isFinite(
                  point.latitude
                ) &&
                Number.isFinite(
                  point.longitude
                ) &&
                Number.isFinite(
                  point.groundwaterLevel
                )
            );

        setGroundwaterPoints(cleaned);

        return cleaned;
      } catch (error) {
        console.error(
          "Groundwater error:",
          error
        );

        setErrorMessage(
          "Unable to load groundwater data."
        );

        return [];
      }
    };

  /* ===================================================
     FETCH WEATHER
  =================================================== */

  const getWeatherData =
    async (
      lat: number,
      lon: number
    ) => {
      try {
        setWeatherLoading(true);

        const response =
          await fetch(
            `/api/weather?latitude=${lat}&longitude=${lon}`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Weather API failed"
          );
        }

        const data =
          await response.json();

        setWeatherData(data);

        console.log(
          "Weather:",
          data
        );

        return data;
      } catch (error) {
        console.error(
          "Weather error:",
          error
        );

        return null;
      } finally {
        setWeatherLoading(false);
      }
    };

  /* ===================================================
     FIND NEARBY POINTS
  =================================================== */

  const findNearbyPoints =
    (
      userLat: number,
      userLon: number,
      points: GroundwaterPoint[]
    ) => {
      const nearby =
        points
          .map((point) => ({
            ...point,

            distance:
              calculateDistance(
                userLat,
                userLon,
                point.latitude,
                point.longitude
              ),
          }))
          .filter(
            (point) =>
              point.distance !==
                undefined &&
              point.distance <= radius
          )
          .sort(
            (a, b) =>
              (a.distance ?? Infinity) -
              (b.distance ?? Infinity)
          );

      setNearbyPoints(
        nearby
      );

      return nearby;
    };

  /* ===================================================
     ANALYZE STATIONS
  =================================================== */

  const analyzeStations =
    (
      points: GroundwaterPoint[]
    ) => {
      const grouped: Record<
        string,
        GroundwaterPoint[]
      > = {};

      points.forEach(
        (point) => {
          const name =
            point.station ||
            `${point.latitude}-${point.longitude}`;

          if (!grouped[name]) {
            grouped[name] = [];
          }

          grouped[name].push(
            point
          );
        }
      );

      const analyses: StationAnalysis[] =
        [];

      Object.entries(
        grouped
      ).forEach(
        ([
          station,
          observations,
        ]) => {
          const sorted =
            [...observations].sort(
              (a, b) => {
                const dateA =
                  new Date(
                    a.date
                  ).getTime();

                const dateB =
                  new Date(
                    b.date
                  ).getTime();

                return (
                  dateA - dateB
                );
              }
            );

          const levels =
            sorted
              .map((p) =>
                Number(
                  p.groundwaterLevel
                )
              )
              .filter(
                Number.isFinite
              );

          if (
            levels.length ===
            0
          ) {
            return;
          }

          const first =
            sorted[0];

          const latest =
            sorted[
              sorted.length - 1
            ];

          const average =
            levels.reduce(
              (
                sum,
                value
              ) =>
                sum + value,
              0
            ) /
            levels.length;

          const minimum =
            Math.min(
              ...levels
            );

          const maximum =
            Math.max(
              ...levels
            );

          const change =
            latest.groundwaterLevel -
            first.groundwaterLevel;

          let trend:
            | "Rising"
            | "Declining"
            | "Stable";

          /*
            Larger groundwater depth
            means water is deeper.

            Positive change:
            water getting deeper.

            Negative change:
            water getting shallower.
          */

          if (change > 3) {
            trend =
              "Declining";
          } else if (
            change < -3
          ) {
            trend =
              "Rising";
          } else {
            trend =
              "Stable";
          }

          analyses.push({
            station,

            district:
              latest.district,

            latitude:
              latest.latitude,

            longitude:
              latest.longitude,

            latestLevel:
              latest.groundwaterLevel,

            averageLevel:
              average,

            minimumLevel:
              minimum,

            maximumLevel:
              maximum,

            observations:
              levels.length,

            latestDate:
              latest.date,

            trend,

            distance:
              latest.distance ??
              0,
          });
        }
      );

      analyses.sort(
        (a, b) =>
          a.distance -
          b.distance
      );

      setStationAnalyses(
        analyses
      );

      return analyses;
    };

  /* ===================================================
     DETECT LOCATION
  =================================================== */

  const getlocation = () => {
    if (
      !navigator.geolocation
    ) {
      setLocation(
        "Geolocation is not supported."
      );

      return;
    }

    setIsLoading(true);

    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      async (
        position
      ) => {
        try {
          const lat =
            position.coords
              .latitude;

          const lon =
            position.coords
              .longitude;

          console.log(
            "CURRENT GPS:",
            lat,
            lon
          );

          setLatitude(lat);

          setLongitude(lon);

          setLocation(
            `Current Location: ${lat.toFixed(
              6
            )}, ${lon.toFixed(
              6
            )}`
          );

          /*
            Run both analyses.
          */

          const [
            groundwaterData,
          ] = await Promise.all([
            loadGroundwaterData(),
            getWeatherData(
              lat,
              lon
            ),
          ]);

          const nearby =
            findNearbyPoints(
              lat,
              lon,
              groundwaterData
            );

          analyzeStations(
            nearby
          );
        } catch (error) {
          console.error(
            error
          );

          setErrorMessage(
            "Location analysis failed."
          );
        } finally {
          setIsLoading(false);
        }
      },

      (error) => {
        console.error(
          "GPS error:",
          error
        );

        setLocation(
          "Location permission denied."
        );

        setIsLoading(false);
      },

      {
        enableHighAccuracy:
          true,

        timeout: 15000,

        maximumAge: 0,
      }
    );
  };

  /* ===================================================
     INITIAL LOAD
  =================================================== */

  useEffect(() => {
    const initialize =
      async () => {
        const data =
          await loadGroundwaterData();

        const nearby =
          findNearbyPoints(
            latitude,
            longitude,
            data
          );

        analyzeStations(
          nearby
        );

        await getWeatherData(
          latitude,
          longitude
        );
      };

    initialize();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===================================================
     RADIUS CHANGE
  =================================================== */

  useEffect(() => {
    if (
      groundwaterPoints.length ===
      0
    ) {
      return;
    }

    const nearby =
      findNearbyPoints(
        latitude,
        longitude,
        groundwaterPoints
      );

    analyzeStations(
      nearby
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  /* ===================================================
     WEATHER VALUES
  =================================================== */

  const weatherAnalysis =
    useMemo(() => {
      if (!weatherData) {
        return {
          temperature: null,
          humidity: null,
          rain: null,
          rainfall7Day: null,
          soilMoisture: null,
          et0: null,
        };
      }

      const current =
        weatherData.current;

      const hourly =
        weatherData.hourly;

      const daily =
        weatherData.daily;

      const soilValues =
        [
          ...(hourly
            ?.soil_moisture_0_to_1cm ??
            []),
          ...(hourly
            ?.soil_moisture_1_to_3cm ??
            []),
        ].filter(
          (value) =>
            Number.isFinite(
              value
            )
        );

      const soilMoisture =
        soilValues.length >
        0
          ? soilValues[
              soilValues.length - 1
            ]
          : null;

      const rainfall7Day =
        (
          daily
            ?.precipitation_sum ??
          []
        ).reduce(
          (
            sum,
            value
          ) =>
            sum +
            (Number(value) ||
              0),
          0
        );

      const et0 =
        (
          daily
            ?.et0_fao_evapotranspiration ??
          []
        ).reduce(
          (
            sum,
            value
          ) =>
            sum +
            (Number(value) ||
              0),
          0
        );

      return {
        temperature:
          current
            ?.temperature_2m ??
          null,

        humidity:
          current
            ?.relative_humidity_2m ??
          null,

        rain:
          current?.rain ??
          null,

        rainfall7Day,

        soilMoisture,

        et0,
      };
    }, [weatherData]);

  /* ===================================================
     JALBHOOMI ANALYSIS ENGINE
  =================================================== */

  const analysis =
    useMemo(() => {
      if (
        stationAnalyses.length ===
        0
      ) {
        return {
          averageDepth: null,
          latestDepth: null,
          expectedMin: null,
          expectedMax: null,
          trend:
            "Insufficient Data",
          groundwaterScore: 0,
          trendScore: 0,
          rainfallScore: 0,
          soilScore: 0,
          confidenceScore: 0,
          score: 0,
          risk: "High",
          potential: "Unknown",
        };
      }

      /* -----------------------------------------------
         GROUNDWATER DEPTH
      ------------------------------------------------ */

      const averageDepth =
        stationAnalyses.reduce(
          (
            sum,
            station
          ) =>
            sum +
            station.averageLevel,
          0
        ) /
        stationAnalyses.length;

      const latestDepth =
        stationAnalyses.reduce(
          (
            sum,
            station
          ) =>
            sum +
            station.latestLevel,
          0
        ) /
        stationAnalyses.length;

      /* -----------------------------------------------
         TREND
      ------------------------------------------------ */

      const declining =
        stationAnalyses.filter(
          (station) =>
            station.trend ===
            "Declining"
        ).length;

      const rising =
        stationAnalyses.filter(
          (station) =>
            station.trend ===
            "Rising"
        ).length;

      let trend:
        | "Improving"
        | "Declining"
        | "Stable"
        | "Mixed";

      if (
        declining >
        stationAnalyses.length /
          2
      ) {
        trend =
          "Declining";
      } else if (
        rising >
        stationAnalyses.length /
          2
      ) {
        trend =
          "Improving";
      } else if (
        declining === 0 &&
        rising === 0
      ) {
        trend =
          "Stable";
      } else {
        trend =
          "Mixed";
      }

      /* -----------------------------------------------
         GROUNDWATER SCORE
      ------------------------------------------------ */

      let groundwaterScore =
        70;

      if (
        averageDepth <= 30
      ) {
        groundwaterScore =
          95;
      } else if (
        averageDepth <= 60
      ) {
        groundwaterScore =
          88;
      } else if (
        averageDepth <= 100
      ) {
        groundwaterScore =
          78;
      } else if (
        averageDepth <= 150
      ) {
        groundwaterScore =
          60;
      } else {
        groundwaterScore =
          40;
      }

      /* -----------------------------------------------
         TREND SCORE
      ------------------------------------------------ */

      let trendScore = 70;

      if (
        trend ===
        "Improving"
      ) {
        trendScore = 90;
      } else if (
        trend === "Stable"
      ) {
        trendScore = 82;
      } else if (
        trend === "Mixed"
      ) {
        trendScore = 65;
      } else {
        trendScore = 45;
      }

      /* -----------------------------------------------
         RAINFALL SCORE
      ------------------------------------------------ */

      let rainfallScore = 60;

      const rainfall =
        weatherAnalysis.rainfall7Day;

      if (
        rainfall !== null
      ) {
        if (
          rainfall >= 50
        ) {
          rainfallScore = 90;
        } else if (
          rainfall >= 25
        ) {
          rainfallScore = 80;
        } else if (
          rainfall >= 10
        ) {
          rainfallScore = 70;
        } else {
          rainfallScore = 55;
        }
      }

      /* -----------------------------------------------
         SOIL MOISTURE SCORE
      ------------------------------------------------ */

      let soilScore = 60;

      const soil =
        weatherAnalysis.soilMoisture;

      if (
        soil !== null
      ) {
        /*
          Open-Meteo soil moisture
          is volumetric water content.

          This is only a prototype
          environmental indicator.
        */

        if (soil >= 0.30) {
          soilScore = 90;
        } else if (
          soil >= 0.20
        ) {
          soilScore = 80;
        } else if (
          soil >= 0.10
        ) {
          soilScore = 65;
        } else {
          soilScore = 50;
        }
      }

      /* -----------------------------------------------
         DATA CONFIDENCE
      ------------------------------------------------ */

      let confidenceScore =
        40;

      if (
        stationAnalyses.length >=
        10
      ) {
        confidenceScore =
          90;
      } else if (
        stationAnalyses.length >=
        5
      ) {
        confidenceScore =
          80;
      } else if (
        stationAnalyses.length >=
        3
      ) {
        confidenceScore =
          70;
      } else {
        confidenceScore =
          55;
      }

      /* -----------------------------------------------
         FINAL SCORE

         Groundwater   35%
         Trend         20%
         Rainfall      15%
         Soil          10%
         Confidence    20%
      ------------------------------------------------ */

      const score =
        Math.round(
          groundwaterScore *
            0.35 +
            trendScore *
              0.2 +
            rainfallScore *
              0.15 +
            soilScore *
              0.1 +
            confidenceScore *
              0.2
        );

      /* -----------------------------------------------
         POTENTIAL
      ------------------------------------------------ */

      let potential =
        "Moderate";

      if (score >= 80) {
        potential = "Good";
      } else if (
        score < 60
      ) {
        potential = "Low";
      }

      /* -----------------------------------------------
         RISK
      ------------------------------------------------ */

      let risk = "Moderate";

      if (score >= 80) {
        risk = "Low";
      } else if (
        score < 60
      ) {
        risk = "High";
      }

      /* -----------------------------------------------
         EXPECTED DEPTH RANGE
      ------------------------------------------------ */

      const expectedMin =
        Math.max(
          0,
          averageDepth - 10
        );

      const expectedMax =
        averageDepth + 10;

      return {
        averageDepth,

        latestDepth,

        expectedMin,

        expectedMax,

        trend,

        groundwaterScore,

        trendScore,

        rainfallScore,

        soilScore,

        confidenceScore,

        score,

        risk,

        potential,
      };
    }, [
      stationAnalyses,
      weatherAnalysis,
    ]);

  /* ===================================================
     NEAREST STATION
  =================================================== */

  const nearestStation =
    stationAnalyses.length >
    0
      ? stationAnalyses[0]
      : null;

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <main className="min-h-screen bg-gray-50 p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900">
          Pre-Drilling Assessment
        </h1>

        <p className="mt-2 text-gray-500">
          Analyze your exact location before drilling a borewell.
        </p>

      </header>


      {/* =================================================
          LOCATION
      ================================================= */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          📍 Select Drilling Location
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          JalBhoomi analyzes groundwater and environmental
          conditions around your selected location.
        </p>


        <div className="mt-6">

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Location
          </label>

          <div className="rounded-lg border bg-gray-50 px-4 py-3">
            {location}
          </div>

        </div>


        {/* COORDINATES */}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Latitude
            </label>

            <div className="rounded-lg border bg-gray-50 px-4 py-3">
              {latitude.toFixed(6)}
            </div>

          </div>


          <div>

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Longitude
            </label>

            <div className="rounded-lg border bg-gray-50 px-4 py-3">
              {longitude.toFixed(6)}
            </div>

          </div>

        </div>


        {/* RADIUS */}

        <div className="mt-6">

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Groundwater Analysis Radius
          </label>

          <select
            value={radius}
            onChange={(e) =>
              setRadius(
                Number(
                  e.target.value
                )
              )
            }
            className="rounded-lg border bg-white px-4 py-3"
          >

            <option value={25}>
              25 km
            </option>

            <option value={50}>
              50 km
            </option>

            <option value={75}>
              75 km
            </option>

            <option value={100}>
              100 km
            </option>

          </select>

        </div>


        {/* BUTTONS */}

        <div className="mt-6 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={
              getlocation
            }
            disabled={
              isLoading
            }
            className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >

            {isLoading
              ? "📍 Analyzing Location..."
              : "📍 Detect My Location"}

          </button>


          <button
            type="button"
            onClick={async () => {

              setIsLoading(
                true
              );

              const nearby =
                findNearbyPoints(
                  latitude,
                  longitude,
                  groundwaterPoints
                );

              analyzeStations(
                nearby
              );

              await getWeatherData(
                latitude,
                longitude
              );

              setIsLoading(
                false
              );

            }}
            className="rounded-lg border border-green-600 bg-white px-6 py-3 font-medium text-green-700 hover:bg-green-50"
          >
            🔍 Analyze Location
          </button>

        </div>


        {errorMessage && (

          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">

            ⚠️ {errorMessage}

          </div>

        )}

      </section>


      {/* =================================================
          MAP
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          🗺️ Groundwater Potential Map
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Your current location and nearby groundwater
          monitoring stations.
        </p>


        <div className="mt-4 flex flex-wrap gap-5 text-sm">

          <span>
            📍 Your Location
          </span>

          <span>
            💧 Groundwater Stations
          </span>

          <span>
            <strong>
              {stationAnalyses.length}
            </strong>{" "}
            stations analyzed
          </span>

        </div>


        <div className="mt-4 overflow-hidden rounded-xl">

          <MapContainer
            center={[
              latitude,
              longitude,
            ]}
            zoom={13}
            style={{
              height: "500px",
              width: "100%",
            }}
          >

            <MapUpdater
              latitude={latitude}
              longitude={longitude}
            />


            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {/* ANALYSIS RADIUS */}

            <Circle
              center={[
                latitude,
                longitude,
              ]}
              radius={
                radius * 1000
              }
              pathOptions={{
                color: "green",
                fillOpacity: 0.05,
              }}
            />


            {/* USER LOCATION */}

            <Marker
              position={[
                latitude,
                longitude,
              ]}
            >

              <Popup>

                <strong>
                  📍 Your Current Location
                </strong>

                <br />

                Latitude:{" "}
                {latitude.toFixed(
                  6
                )}

                <br />

                Longitude:{" "}
                {longitude.toFixed(
                  6
                )}

                <br />

                <br />

                JalBhoomi Score:{" "}
                {analysis.score}%

              </Popup>

            </Marker>


            {/* STATIONS */}

            {stationAnalyses.map(
              (
                station,
                index
              ) => (

                <Marker
                  key={`${station.station}-${index}`}
                  position={[
                    station.latitude,
                    station.longitude,
                  ]}
                >

                  <Popup>

                    <div className="min-w-[230px]">

                      <h3 className="font-bold">
                        💧{" "}
                        {station.station ||
                          "Groundwater Station"}
                      </h3>

                      <div className="mt-2 space-y-1 text-sm">

                        <p>
                          <strong>
                            District:
                          </strong>{" "}
                          {station.district ||
                            "N/A"}
                        </p>

                        <p>
                          <strong>
                            Distance:
                          </strong>{" "}
                          {station.distance.toFixed(
                            1
                          )}{" "}
                          km
                        </p>

                        <p>
                          <strong>
                            Latest:
                          </strong>{" "}
                          {station.latestLevel.toFixed(
                            1
                          )}{" "}
                          m
                        </p>

                        <p>
                          <strong>
                            Average:
                          </strong>{" "}
                          {station.averageLevel.toFixed(
                            1
                          )}{" "}
                          m
                        </p>

                        <p>
                          <strong>
                            Trend:
                          </strong>{" "}
                          {station.trend}
                        </p>

                        <p>
                          <strong>
                            Observations:
                          </strong>{" "}
                          {station.observations}
                        </p>

                      </div>

                    </div>

                  </Popup>

                </Marker>

              )
            )}

          </MapContainer>

        </div>

      </section>


      {/* =================================================
          WEATHER
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          🌧️ Environmental Analysis
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Real weather and soil conditions for your GPS location.
        </p>


        {weatherLoading ? (

          <p className="mt-6 text-gray-500">
            Loading environmental data...
          </p>

        ) : weatherData ? (

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">


            {/* TEMPERATURE */}

            <div className="rounded-xl bg-orange-50 p-5">

              <p className="text-sm text-gray-500">
                🌡️ Temperature
              </p>

              <h3 className="mt-2 text-3xl font-bold">

                {weatherAnalysis.temperature ??
                  "N/A"}
                °C

              </h3>

            </div>


            {/* HUMIDITY */}

            <div className="rounded-xl bg-blue-50 p-5">

              <p className="text-sm text-gray-500">
                💧 Humidity
              </p>

              <h3 className="mt-2 text-3xl font-bold">

                {weatherAnalysis.humidity ??
                  "N/A"}
                %

              </h3>

            </div>


            {/* RAINFALL */}

            <div className="rounded-xl bg-cyan-50 p-5">

              <p className="text-sm text-gray-500">
                🌧️ 7-Day Rainfall
              </p>

              <h3 className="mt-2 text-3xl font-bold">

                {weatherAnalysis.rainfall7Day?.toFixed(
                  1
                ) ??
                  "N/A"}{" "}
                mm

              </h3>

            </div>


            {/* SOIL */}

            <div className="rounded-xl bg-green-50 p-5">

              <p className="text-sm text-gray-500">
                🌱 Soil Moisture
              </p>

              <h3 className="mt-2 text-3xl font-bold">

                {weatherAnalysis.soilMoisture !==
                null
                  ? weatherAnalysis.soilMoisture.toFixed(
                      3
                    )
                  : "N/A"}

              </h3>

            </div>


            {/* ET0 */}

            <div className="rounded-xl bg-yellow-50 p-5">

              <p className="text-sm text-gray-500">
                💦 7-Day ET₀
              </p>

              <h3 className="mt-2 text-3xl font-bold">

                {weatherAnalysis.et0?.toFixed(
                  1
                ) ??
                  "N/A"}{" "}
                mm

              </h3>

            </div>


            {/* CURRENT RAIN */}

            <div className="rounded-xl bg-blue-50 p-5">

              <p className="text-sm text-gray-500">
                🌧️ Current Rain
              </p>

              <h3 className="mt-2 text-3xl font-bold">

                {weatherAnalysis.rain ??
                  "N/A"}{" "}
                mm

              </h3>

            </div>

          </div>

        ) : (

          <p className="mt-6 text-gray-500">
            Detect your location to load environmental data.
          </p>

        )}

      </section>


      {/* =================================================
          MAIN SCORE CARDS
      ================================================= */}

      <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">


        {/* DEPTH */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            💧 Expected Groundwater Depth
          </p>

          <h3 className="mt-3 text-3xl font-bold">

            {analysis.expectedMin !==
            null
              ? `${analysis.expectedMin.toFixed(
                  0
                )}–${analysis.expectedMax?.toFixed(
                  0
                )} m`
              : "N/A"}

          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Estimated from nearby historical observations
          </p>

        </div>


        {/* SCORE */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            🎯 JalBhoomi Score
          </p>

          <h3 className="mt-3 text-3xl font-bold text-green-600">

            {analysis.score}/100

          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {analysis.potential} potential
          </p>

        </div>


        {/* TREND */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            📉 Groundwater Trend
          </p>

          <h3 className="mt-3 text-2xl font-bold">

            {analysis.trend ===
            "Declining"
              ? "↓ Declining"
              : analysis.trend ===
                "Improving"
              ? "↑ Improving"
              : analysis.trend ===
                "Stable"
              ? "→ Stable"
              : analysis.trend}

          </h3>

        </div>


        {/* RISK */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            ⚠️ Drilling Risk
          </p>

          <h3 className="mt-3 text-2xl font-bold text-yellow-600">
            {analysis.risk}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Preliminary assessment
          </p>

        </div>

      </section>


      {/* =================================================
          FACTOR SCORES
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          📊 JalBhoomi Factor Analysis
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Factors currently used to calculate the preliminary score.
        </p>


        <div className="mt-6 space-y-6">


          {/* GROUNDWATER */}

          <div>

            <div className="mb-2 flex justify-between">

              <span className="font-medium">
                💧 Groundwater Availability
              </span>

              <span className="font-semibold">
                {analysis.groundwaterScore}/100
              </span>

            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: `${analysis.groundwaterScore}%`,
                }}
              />

            </div>

          </div>


          {/* TREND */}

          <div>

            <div className="mb-2 flex justify-between">

              <span className="font-medium">
                📉 Historical Trend
              </span>

              <span className="font-semibold">
                {analysis.trendScore}/100
              </span>

            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full rounded-full bg-purple-500"
                style={{
                  width: `${analysis.trendScore}%`,
                }}
              />

            </div>

          </div>


          {/* RAINFALL */}

          <div>

            <div className="mb-2 flex justify-between">

              <span className="font-medium">
                🌧️ Rainfall / Recharge Indicator
              </span>

              <span className="font-semibold">
                {analysis.rainfallScore}/100
              </span>

            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full rounded-full bg-cyan-500"
                style={{
                  width: `${analysis.rainfallScore}%`,
                }}
              />

            </div>

          </div>


          {/* SOIL */}

          <div>

            <div className="mb-2 flex justify-between">

              <span className="font-medium">
                🌱 Soil Moisture
              </span>

              <span className="font-semibold">
                {analysis.soilScore}/100
              </span>

            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full rounded-full bg-green-500"
                style={{
                  width: `${analysis.soilScore}%`,
                }}
              />

            </div>

          </div>


          {/* CONFIDENCE */}

          <div>

            <div className="mb-2 flex justify-between">

              <span className="font-medium">
                📡 Data Confidence
              </span>

              <span className="font-semibold">
                {analysis.confidenceScore}/100
              </span>

            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full rounded-full bg-gray-700"
                style={{
                  width: `${analysis.confidenceScore}%`,
                }}
              />

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          DETAILED ANALYSIS
      ================================================= */}

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">


        {/* GROUNDWATER */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            📈 Groundwater Analysis
          </h2>


          <div className="mt-6 space-y-5">


            <div className="flex justify-between">

              <span className="text-gray-600">
                Stations analyzed
              </span>

              <strong>
                {stationAnalyses.length}
              </strong>

            </div>


            <div className="flex justify-between">

              <span className="text-gray-600">
                Analysis radius
              </span>

              <strong>
                {radius} km
              </strong>

            </div>


            <div className="flex justify-between">

              <span className="text-gray-600">
                Average groundwater depth
              </span>

              <strong>

                {analysis.averageDepth !==
                null
                  ? `${analysis.averageDepth.toFixed(
                      1
                    )} m`
                  : "N/A"}

              </strong>

            </div>


            <div className="flex justify-between">

              <span className="text-gray-600">
                Latest average depth
              </span>

              <strong>

                {analysis.latestDepth !==
                null
                  ? `${analysis.latestDepth.toFixed(
                      1
                    )} m`
                  : "N/A"}

              </strong>

            </div>


            <div className="flex justify-between">

              <span className="text-gray-600">
                Historical trend
              </span>

              <strong>
                {analysis.trend}
              </strong>

            </div>


            <div className="flex justify-between">

              <span className="text-gray-600">
                Nearest station
              </span>

              <strong>

                {nearestStation
                  ? `${nearestStation.distance.toFixed(
                      1
                    )} km`
                  : "N/A"}

              </strong>

            </div>

          </div>

        </div>


        {/* RECOMMENDATION */}

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            🤖 What Happens If You Drill Here?
          </h2>


          <div
            className={`mt-5 rounded-lg p-5 ${
              analysis.potential ===
              "Good"
                ? "bg-green-50"
                : analysis.potential ===
                  "Moderate"
                ? "bg-yellow-50"
                : "bg-red-50"
            }`}
          >

            <h3 className="text-xl font-bold">

              {analysis.potential ===
              "Good"
                ? "🟢 Good Potential"
                : analysis.potential ===
                  "Moderate"
                ? "🟡 Moderate Potential"
                : "🔴 Low Potential"}

            </h3>


            <p className="mt-4 leading-7 text-gray-700">

              {stationAnalyses.length >
              0
                ? `Based on ${stationAnalyses.length} nearby groundwater monitoring station${
                    stationAnalyses.length ===
                    1
                      ? ""
                      : "s"
                  }, historical groundwater observations and current environmental conditions, this location has ${analysis.potential.toLowerCase()} preliminary groundwater potential.`
                : "There is insufficient nearby groundwater data to make a reliable preliminary assessment."}

            </p>


            <div className="mt-5 space-y-2 text-sm text-gray-700">

              <p>
                <strong>
                  Estimated groundwater depth:
                </strong>{" "}

                {analysis.expectedMin !==
                null
                  ? `${analysis.expectedMin.toFixed(
                      0
                    )}–${analysis.expectedMax?.toFixed(
                      0
                    )} m`
                  : "N/A"}

              </p>


              <p>
                <strong>
                  Groundwater trend:
                </strong>{" "}

                {analysis.trend}
              </p>


              <p>
                <strong>
                  Recent rainfall:
                </strong>{" "}

                {weatherAnalysis.rainfall7Day !==
                null
                  ? `${weatherAnalysis.rainfall7Day.toFixed(
                      1
                    )} mm`
                  : "N/A"}

              </p>


              <p>
                <strong>
                  Soil moisture:
                </strong>{" "}

                {weatherAnalysis.soilMoisture !==
                null
                  ? weatherAnalysis.soilMoisture.toFixed(
                      3
                    )
                  : "N/A"}

              </p>


              <p>
                <strong>
                  Overall score:
                </strong>{" "}

                {analysis.score}/100

              </p>


              <p>
                <strong>
                  Preliminary risk:
                </strong>{" "}

                {analysis.risk}

              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          STATIONS TABLE
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          📍 Nearby Groundwater Stations
        </h2>


        <div className="mt-5 overflow-x-auto">

          <table className="w-full min-w-[850px] text-left text-sm">

            <thead>

              <tr className="border-b bg-gray-50">

                <th className="px-4 py-3">
                  Station
                </th>

                <th className="px-4 py-3">
                  District
                </th>

                <th className="px-4 py-3">
                  Distance
                </th>

                <th className="px-4 py-3">
                  Latest
                </th>

                <th className="px-4 py-3">
                  Average
                </th>

                <th className="px-4 py-3">
                  Trend
                </th>

                <th className="px-4 py-3">
                  Observations
                </th>

              </tr>

            </thead>


            <tbody>

              {stationAnalyses
                .slice(0, 20)
                .map(
                  (
                    station,
                    index
                  ) => (

                    <tr
                      key={`${station.station}-${index}`}
                      className="border-b"
                    >

                      <td className="px-4 py-3 font-medium">

                        {station.station ||
                          "Unknown"}

                      </td>


                      <td className="px-4 py-3">

                        {station.district ||
                          "N/A"}

                      </td>


                      <td className="px-4 py-3">

                        {station.distance.toFixed(
                          1
                        )}{" "}
                        km

                      </td>


                      <td className="px-4 py-3">

                        {station.latestLevel.toFixed(
                          1
                        )}{" "}
                        m

                      </td>


                      <td className="px-4 py-3">

                        {station.averageLevel.toFixed(
                          1
                        )}{" "}
                        m

                      </td>


                      <td className="px-4 py-3">

                        {station.trend ===
                        "Declining"
                          ? "↓ Declining"
                          : station.trend ===
                            "Rising"
                          ? "↑ Rising"
                          : "→ Stable"}

                      </td>


                      <td className="px-4 py-3">

                        {station.observations}

                      </td>

                    </tr>

                  )
                )}

            </tbody>

          </table>

        </div>

      </section>


      {/* =================================================
          WHAT IS MISSING
      ================================================= */}

      <section className="mt-8 rounded-xl border bg-blue-50 p-6">

        <h2 className="text-xl font-semibold text-gray-900">
          🧠 Next JalBhoomi Data Layers
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          These should be connected to real datasets rather than
          simulated values.
        </p>


        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">


          <div className="rounded-lg bg-white p-4">

            <h3 className="font-semibold">
              🪨 Aquifer / Geology
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Add geological and aquifer information from
              appropriate Indian geospatial datasets.
            </p>

          </div>


          <div className="rounded-lg bg-white p-4">

            <h3 className="font-semibold">
              🧂 Water Quality
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Add available groundwater-quality observations
              such as EC/TDS/salinity indicators.
            </p>

          </div>


          <div className="rounded-lg bg-white p-4">

            <h3 className="font-semibold">
              🌾 Crop Information
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Farmer can enter crop, field size and growth stage
              for irrigation recommendations.
            </p>

          </div>

        </div>

      </section>


      {/* =================================================
          DISCLAIMER
      ================================================= */}

      <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-800">

        <strong>
          ⚠️ Important:
        </strong>{" "}
        This is a preliminary decision-support
        assessment. Nearby groundwater observations
        and weather/soil data cannot guarantee that
        groundwater will be encountered at a specific
        drilling point. Actual drilling should be
        supported by appropriate hydrogeological and
        geological investigation, local regulations,
        and post-drilling water-quality testing.

      </div>

    </main>
  );
}