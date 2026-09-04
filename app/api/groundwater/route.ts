import fs from "fs";
import path from "path";
import Papa from "papaparse";

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "app",
    "data",
    "grnd.csv"
  );

  const csvData = fs.readFileSync(filePath, "utf8");

  const parsedData =  Papa.parse<Record<string, string>>(csvData, {
    header: true,
  });
const cleanedData = parsedData.data.map((row: Record<string, string>) => {
         return {
    "station": row["Station"],
    "district": row["District"],
    "tehsil": row["Tehsil"],
    "block": row["Block"],
    "village": row["Village"],
    "latitude": Number(row["Latitude"]),
    "longitude": Number(row["Longitude"]),
    "date": row["Data Acquisition Time"],
    "groundwaterLevel": Number(row["Groundwater Level Quarterly Manual (meter)"])
    }
});
  return new Response(JSON.stringify(cleanedData), {
    headers: {
      "Content-Type": "application/json",
    },
  });
       
    }

