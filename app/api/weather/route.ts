import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");

    if (!latitude || !longitude) {
      return Response.json(
        {
          error: "latitude and longitude are required",
        },
        { status: 400 }
      );
    }

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code` +
      `&hourly=soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,precipitation` +
      `&daily=precipitation_sum,et0_fao_evapotranspiration` +
      `&timezone=auto` +
      `&forecast_days=7`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Weather API request failed");
    }

    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    console.error("Weather API error:", error);

    return Response.json(
      {
        error: "Unable to fetch weather data",
      },
      { status: 500 }
    );
  }
}