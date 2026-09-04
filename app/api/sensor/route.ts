export async function GET() {
  try {
    // Fetch latest data from ESP32
    const esp32Response = await fetch(
      "http://192.168.4.1/api/data",
      {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!esp32Response.ok) {
      return Response.json(
        {
          error: `ESP32 returned HTTP ${esp32Response.status}`,
        },
        { status: 502 }
      );
    }

    const esp32Data = await esp32Response.json();

    // ESP32 data:
    // {
    //   level: 56.1,
    //   soil: "WET",
    //   flow: 0.0,
    //   total: 5.15,
    //   health: 95,
    //   safety: "NORMAL",
    //   ai: "WAIT",
    //   runMin: 0
    // }

    const sensor = {
      waterLevel: Number(
        esp32Data.waterLevel ??
          esp32Data.level ??
          esp32Data.height ??
          esp32Data.wellHeight ??
          0
      ),
      flowRate: Number(
        esp32Data.flowRate ??
          esp32Data.flow ??
          esp32Data.waterFlow ??
          esp32Data.speed ??
          0
      ),
      salinity: esp32Data.salinity == null ? null : Number(esp32Data.salinity),
      soilMoisture:
        esp32Data.soilMoisture == null
          ? null
          : Number(esp32Data.soilMoisture),
      soil: esp32Data.soil ?? "UNKNOWN",
      total: Number(esp32Data.total ?? 0),
      health: Number(esp32Data.health ?? 0),
      safety: esp32Data.safety ?? "UNKNOWN",
      ai: esp32Data.ai ?? "WAIT",
      runMin: Number(esp32Data.runMin ?? 0),
    };

    return Response.json({
      success: true,
      sensor,
    });
  } catch (error) {
    console.error("Sensor API error:", error);

    return Response.json(
      {
        error: "Unable to connect to ESP32",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 502 }
    );
  }
}


// Optional POST route
// Keeps compatibility with your existing frontend/manual sensor saving.

export async function POST(request: Request) {
  try {
    const { supabase } = await import("@/lib/supabase");
    const body = await request.json();

    const { data, error } = await supabase
      .from("sensor_readings")
      .insert([
        {
          borewell_id: body.borewell_id ?? "BW-001",
          water_level: body.water_level ?? null,
          flow_rate: body.flow_rate ?? null,
          salinity: body.salinity ?? null,
          soil_moisture: body.soil_moisture ?? null,
          pump_status: body.pump_status ?? false,
          rainfall: body.rainfall ?? null,
          temperature: body.temperature ?? null,
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);

      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("POST sensor error:", error);

    return Response.json(
      {
        error: "Failed to save sensor data",
      },
      { status: 500 }
    );
  }
}