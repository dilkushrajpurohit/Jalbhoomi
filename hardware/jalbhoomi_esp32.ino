#include <WiFi.h>
#include <WebServer.h>

// =========================================================================
// JALBHOOMI AI - ESP32 WIRELESS GATEWAY & WEB SERVER FIRMWARE
// File: jalbhoomi_esp32.ino
// =========================================================================

// Wi-Fi Access Point Configuration
const char* ssid     = "JalBhoomi_AP";
const char* password = "groundwater123";

WebServer server(80);

// Telemetry Variables Received from Raspberry Pi Pico
float  g_level    = 0.0f;
String g_soil     = "DRY";
float  g_flow     = 0.0f;
float  g_total    = 0.0f;
int    g_health   = 100;
String g_safety   = "NORMAL";
String g_ai       = "WAIT";
String g_valve    = "CLOSED";
int    g_valveDeg = 0;
int    g_runMin   = 0;

String inputBuffer = "";

// Helper Functions to Parse JSON Fields
float getJsonFloat(String json, String key) {
  int keyIndex = json.indexOf("\"" + key + "\":");
  if (keyIndex == -1) return 0.0f;
  int start = keyIndex + key.length() + 3;
  int end = json.indexOf(",", start);
  if (end == -1) end = json.indexOf("}", start);
  if (end == -1) return 0.0f;
  return json.substring(start, end).toFloat();
}

String getJsonString(String json, String key) {
  int keyIndex = json.indexOf("\"" + key + "\":\"");
  if (keyIndex == -1) return "";
  int start = keyIndex + key.length() + 4;
  int end = json.indexOf("\"", start);
  if (end == -1) return "";
  return json.substring(start, end);
}

int getJsonInt(String json, String key) {
  int keyIndex = json.indexOf("\"" + key + "\":");
  if (keyIndex == -1) return 0;
  int start = keyIndex + key.length() + 3;
  int end = json.indexOf(",", start);
  if (end == -1) end = json.indexOf("}", start);
  if (end == -1) return 0;
  return json.substring(start, end).toInt();
}

void parseJson(String raw) {
  int first = raw.indexOf('{');
  int last  = raw.lastIndexOf('}');
  if (first != -1 && last != -1 && last > first) {
    String json = raw.substring(first, last + 1);
    g_level    = getJsonFloat(json, "level");
    g_soil     = getJsonString(json, "soil");
    g_flow     = getJsonFloat(json, "flow");
    g_total    = getJsonFloat(json, "total");
    g_health   = getJsonInt(json, "health");
    g_safety   = getJsonString(json, "safety");
    g_ai       = getJsonString(json, "ai");
    g_valve    = getJsonString(json, "valve");
    g_valveDeg = getJsonInt(json, "valveDeg");
    g_runMin   = getJsonInt(json, "runMin");
  }
}

// REST API Endpoint for Local or External Websites
void handleApiData() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  
  String json = "{";
  json += "\"level\":" + String(g_level, 1) + ",";
  json += "\"soil\":\"" + g_soil + "\",";
  json += "\"flow\":" + String(g_flow, 1) + ",";
  json += "\"total\":" + String(g_total, 2) + ",";
  json += "\"health\":" + String(g_health) + ",";
  json += "\"safety\":\"" + g_safety + "\",";
  json += "\"ai\":\"" + g_ai + "\",";
  json += "\"valve\":\"" + g_valve + "\",";
  json += "\"valveDeg\":" + String(g_valveDeg) + ",";
  json += "\"runMin\":" + String(g_runMin);
  json += "}";

  server.send(200, "application/json", json);
}

// Interactive Live Web Dashboard
void handleRoot() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JalBhoomi Live Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 18px; text-align: center; }
    h1 { color: #38bdf8; font-size: 2rem; margin-bottom: 4px; }
    .status { font-size: 0.85rem; color: #94a3b8; margin-bottom: 18px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; margin-right: 5px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; max-width: 860px; margin: 0 auto; }
    .card { background: #1e293b; padding: 18px; border-radius: 14px; border: 1px solid #334155; }
    .card h3 { color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .val { font-size: 2.2rem; font-weight: 700; color: #38bdf8; margin: 8px 0; }
    .sub { color: #64748b; font-size: 0.82rem; }
    .badge { padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.85rem; display: inline-block; }
    .badge-normal { background: #166534; color: #4ade80; }
    .badge-warning { background: #854d0e; color: #facc15; }
    .badge-critical { background: #991b1b; color: #f87171; }
  </style>
</head>
<body>
  <h1>JALBHOOMI AI</h1>
  <div class="status">
    <span class="dot"></span>LIVE TELEMETRY • Updates: <b id="cnt" style="color:#38bdf8">0</b>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Water Level</h3>
      <div class="val" id="level">-- cm</div>
      <div class="sub">Groundwater Column</div>
    </div>
    <div class="card">
      <h3>Soil Condition</h3>
      <div class="val" id="soil">--</div>
      <div class="sub">TCRT5000 IR Proxy</div>
    </div>
    <div class="card">
      <h3>Flow Rate</h3>
      <div class="val" id="flow">-- L/m</div>
      <div class="sub">Total: <span id="total">--</span> L</div>
    </div>
    <div class="card">
      <h3>Automated Valve</h3>
      <div class="val" id="valve" style="color:#facc15">--</div>
      <div class="sub">Position: <span id="valveDeg">0</span>&deg;</div>
    </div>
    <div class="card" style="grid-column: 1 / -1;">
      <h3>AI Irrigation Decision</h3>
      <div class="val" id="ai" style="color:#4ade80">--</div>
      <div class="sub" id="safetyBadge"><span class="badge badge-normal">SYSTEM NORMAL</span></div>
    </div>
  </div>

  <script>
    let c = 0;
    function poll() {
      var x = new XMLHttpRequest();
      x.open('GET', '/api/data?t=' + Date.now(), true);
      x.timeout = 500;
      x.onload = function() {
        if (x.status === 200) {
          try {
            var d = JSON.parse(x.responseText);
            document.getElementById('cnt').innerText = ++c;
            document.getElementById('level').innerText = d.level + ' cm';
            document.getElementById('soil').innerText = d.soil;
            document.getElementById('flow').innerText = d.flow + ' L/m';
            document.getElementById('total').innerText = d.total;
            document.getElementById('ai').innerText = d.ai;
            document.getElementById('valve').innerText = d.valve;
            document.getElementById('valveDeg').innerText = d.valveDeg;

            if (d.valve === 'OPEN') {
              document.getElementById('valve').style.color = '#4ade80';
            } else {
              document.getElementById('valve').style.color = '#94a3b8';
            }

            if (d.ai === 'IRRIGATE') {
              document.getElementById('ai').style.color = '#4ade80';
            } else if (d.ai === 'LOCKOUT') {
              document.getElementById('ai').style.color = '#f87171';
            } else {
              document.getElementById('ai').style.color = '#facc15';
            }

            var badge = document.getElementById('safetyBadge');
            if (d.safety === 'CRITICAL') {
              badge.innerHTML = '<span class="badge badge-critical">CRITICAL LOCKOUT</span>';
            } else if (d.safety === 'WARNING') {
              badge.innerHTML = '<span class="badge badge-warning">WARNING LEVEL</span>';
            } else {
              badge.innerHTML = '<span class="badge badge-normal">SYSTEM NORMAL</span>';
            }
          } catch(e) {}
        }
      };
      x.onloadend = function() { setTimeout(poll, 100); };
      x.onerror = function() { setTimeout(poll, 300); };
      x.send();
    }
    poll();
  </script>
</body>
</html>
  )rawliteral";
  server.send(200, "text/html", html);
}

void setup() {
  Serial.begin(115200);

  // Hardware Serial2 listening on pin RX2 (GPIO 16) at 9600 Baud (Matches Pico)
  Serial2.begin(9600, SERIAL_8N1, 16, 17);

  WiFi.softAP(ssid, password);
  server.on("/", handleRoot);
  server.on("/api/data", handleApiData);
  server.begin();

  Serial.println("\n[JalBhoomi ESP32 Gateway Ready on RX2 at 9600 Baud]");
}

void loop() {
  server.handleClient();

  while (Serial2.available() > 0) {
    char c = (char)Serial2.read();
    if (c == '\n') {
      parseJson(inputBuffer);
      inputBuffer = "";
    } else if (c != '\r') {
      inputBuffer += c;
    }
  }
}
