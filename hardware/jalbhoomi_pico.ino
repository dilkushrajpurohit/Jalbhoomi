#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Servo.h>

// =========================================================================
// JALBHOOMI AI - RASPBERRY PI PICO CORE SENSOR & ACTUATOR FIRMWARE
// File: jalbhoomi_pico.ino
// =========================================================================

// ==========================================
// PICO HARDWARE PIN MAPPING
// ==========================================
#define PIN_SDA          0   // GP0 (Physical Pin 1)  - OLED SDA
#define PIN_SCL          1   // GP1 (Physical Pin 2)  - OLED SCL
#define PIN_TRIG         2   // GP2 (Physical Pin 4)  - HC-SR04 TRIG
#define PIN_ECHO         3   // GP3 (Physical Pin 5)  - HC-SR04 ECHO
#define PIN_SOIL        16   // GP16 (Physical Pin 21) - TCRT5000 Signal (OUT)
#define PIN_ENC_CLK     17   // GP17 (Physical Pin 22) - Encoder CLK
#define PIN_ENC_DT      18   // GP18 (Physical Pin 24) - Encoder DT
#define PIN_TX_TO_ESP   12   // GP12 (Physical Pin 16) - Direct UART to ESP32 RX2
#define PIN_SERVO       15   // GP15 (Physical Pin 20) - Servo Signal Wire

// ==========================================
// SERVO SPEED & ANGLE TUNING
// ==========================================
#define SERVO_OPEN_ANGLE    90   // Open angle in degrees (adjust to 45, 60, 90 etc.)
#define SERVO_CLOSED_ANGLE   0   // Closed angle in degrees
#define SERVO_STEP_DEG       6   // Step size (Larger = Faster! 6 = ~0.25s fast & smooth)
#define SERVO_STEP_DELAY    15   // Step interval in ms

#define OLED_ADDR 0x3C
Adafruit_SSD1306 oled(128, 64, &Wire, -1);

Servo valveServo;

// ==========================================
// CALIBRATION & WELL METRICS
// ==========================================
const float WELL_DEPTH_CM          = 150.0f; // Total depth of well container
const float LEVEL_CRITICAL_CM      =  30.0f; // Emergency low-water lockout
const float LEVEL_WARNING_CM       =  70.0f; // Warning water level
const float AMBIENT_TEMP_C         =  26.0f; // Ambient room temp in °C
const float CALIBRATION_OFFSET_CM  =   0.0f; // Offset to match a physical ruler (+/- cm)

// System State Variables
volatile long flowPulseCount = 0;
float waterLevelCm     = 0.0f;
float smoothedLevelCm  = 0.0f;
float flowRateLPM      = 0.0f;
float totalLitres      = 0.0f;
String soilStatus      = "DRY";
String aiDecision      = "WAIT";
String safetyStatus    = "NORMAL";
uint16_t recomRunMin   = 0;
uint8_t currentSlide   = 0;

// Servo Position Trackers
int currentServoAngle  = SERVO_CLOSED_ANGLE;
int targetServoAngle   = SERVO_CLOSED_ANGLE;

void encoderISR() { flowPulseCount++; }

// ==========================================
// DIRECT 9600-BAUD SOFTWARE UART TO ESP32
// ==========================================
void sendUartByte(uint8_t pin, char c) {
  digitalWrite(pin, LOW);
  delayMicroseconds(104);
  for (int i = 0; i < 8; i++) {
    digitalWrite(pin, (c >> i) & 1);
    delayMicroseconds(104);
  }
  digitalWrite(pin, HIGH);
  delayMicroseconds(104);
}

void sendUartString(uint8_t pin, String s) {
  for (unsigned int i = 0; i < s.length(); i++) {
    sendUartByte(pin, s[i]);
  }
}

// ==========================================
// HIGH-PRECISION HC-SR04 ULTRASONIC ENGINE
// ==========================================
float singlePing() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  unsigned long dur = pulseIn(PIN_ECHO, HIGH, 10000UL); // 10ms timeout (~1.7m)
  if (dur == 0) return -1.0f;

  float speedOfSound = (331.3f + (0.606f * AMBIENT_TEMP_C)) / 10000.0f;
  float dist = (dur * speedOfSound) / 2.0f;

  if (dist < 2.0f || dist > 250.0f) return -1.0f;
  return dist + CALIBRATION_OFFSET_CM;
}

// 3-Sample Median Filter (Eliminates acoustic jump errors)
float getStableDistance() {
  float s[3];
  int count = 0;

  for (int i = 0; i < 3; i++) {
    float val = singlePing();
    if (val > 0) s[count++] = val;
    delay(8);
  }

  if (count == 0) return -1.0f;
  if (count == 1) return s[0];
  if (count == 2) return (s[0] + s[1]) / 2.0f;

  if (s[0] > s[1]) { float t = s[0]; s[0] = s[1]; s[1] = t; }
  if (s[1] > s[2]) { float t = s[1]; s[1] = s[2]; s[2] = t; }
  if (s[0] > s[1]) { float t = s[0]; s[0] = s[1]; s[1] = t; }
  return s[1];
}

void setup() {
  Serial.begin(115200);

  // Setup UART Line to ESP32
  pinMode(PIN_TX_TO_ESP, OUTPUT);
  digitalWrite(PIN_TX_TO_ESP, HIGH);

  // Setup Sensors
  pinMode(PIN_TRIG, OUTPUT);
  digitalWrite(PIN_TRIG, LOW);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_SOIL, INPUT_PULLUP);
  pinMode(PIN_ENC_CLK, INPUT_PULLUP);
  pinMode(PIN_ENC_DT, INPUT_PULLUP);

  // Attach Servo & initialize to closed position
  valveServo.attach(PIN_SERVO);
  valveServo.write(SERVO_CLOSED_ANGLE);
  currentServoAngle = SERVO_CLOSED_ANGLE;
  targetServoAngle = SERVO_CLOSED_ANGLE;

  // Fast-Mode 400kHz I2C for crisp OLED rendering
  Wire.setSDA(PIN_SDA);
  Wire.setSCL(PIN_SCL);
  Wire.begin();
  Wire.setClock(400000);

  if (oled.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
    oled.setTextSize(1);
    oled.setCursor(15, 18);
    oled.println("JALBHOOMI AI CORE");
    oled.setCursor(16, 38);
    oled.println("Smart Valve Ready");
    oled.display();
    delay(600);
  }

  attachInterrupt(digitalPinToInterrupt(PIN_ENC_CLK), encoderISR, RISING);
}

void loop() {
  static unsigned long tSensor = 0, tFlow = 0, tOled = 0, tTele = 0, tSlide = 0, tServo = 0;
  unsigned long now = millis();

  // 1. Read Sensors & Run AI Logic (Every 80ms)
  if (now - tSensor >= 80) {
    tSensor = now;

    // Stable Ultrasonic Distance
    float dist = getStableDistance();
    if (dist > 0) {
      float rawLevel = WELL_DEPTH_CM - dist;
      if (rawLevel < 0) rawLevel = 0;

      // Exponential smoothing filter
      if (smoothedLevelCm == 0.0f) smoothedLevelCm = rawLevel;
      else smoothedLevelCm = (0.30f * rawLevel) + (0.70f * smoothedLevelCm);

      // Deadband: Only update if change >= 0.2cm (stops number flickering)
      if (abs(smoothedLevelCm - waterLevelCm) >= 0.2f) {
        waterLevelCm = smoothedLevelCm;
      }
    }

    // Read TCRT5000: LOW = Wet, HIGH = Dry
    soilStatus = (digitalRead(PIN_SOIL) == LOW) ? "WET" : "DRY";

    // AI Recommendation Logic
    if (waterLevelCm <= LEVEL_CRITICAL_CM && waterLevelCm > 0) {
      safetyStatus = "CRITICAL";
      aiDecision = "LOCKOUT";
      recomRunMin = 0;
    } else if (waterLevelCm <= LEVEL_WARNING_CM && waterLevelCm > 0) {
      safetyStatus = "WARNING";
      if (soilStatus == "DRY") {
        aiDecision = "IRRIGATE";
        recomRunMin = 5;
      } else {
        aiDecision = "WAIT";
        recomRunMin = 0;
      }
    } else {
      safetyStatus = "NORMAL";
      if (soilStatus == "DRY") {
        aiDecision = "IRRIGATE";
        recomRunMin = 15;
      } else {
        aiDecision = "WAIT";
        recomRunMin = 0;
      }
    }

    // Master Servo Target Angle Assignment
    if (aiDecision == "IRRIGATE") {
      targetServoAngle = SERVO_OPEN_ANGLE;
    } else {
      targetServoAngle = SERVO_CLOSED_ANGLE;
    }
  }

  // 2. Fast & Smooth Servo Stepper (Steps by SERVO_STEP_DEG every 15ms)
  if (now - tServo >= SERVO_STEP_DELAY) {
    tServo = now;
    if (currentServoAngle < targetServoAngle) {
      currentServoAngle += SERVO_STEP_DEG;
      if (currentServoAngle > targetServoAngle) currentServoAngle = targetServoAngle;
      valveServo.write(currentServoAngle);
    } else if (currentServoAngle > targetServoAngle) {
      currentServoAngle -= SERVO_STEP_DEG;
      if (currentServoAngle < targetServoAngle) currentServoAngle = targetServoAngle;
      valveServo.write(currentServoAngle);
    }
  }

  // 3. Flow Rate Calculation (Every 500ms)
  if (now - tFlow >= 500) {
    tFlow = now;
    noInterrupts();
    long pulses = flowPulseCount;
    flowPulseCount = 0;
    interrupts();

    float lps = ((float)pulses / 100.0f) * 2.0f;
    flowRateLPM = lps * 60.0f;
    totalLitres += (lps * 0.5f);
  }

  // 4. Real-Time Telemetry to ESP32 (Every 150ms)
  if (now - tTele >= 150) {
    tTele = now;
    String valveState = (currentServoAngle >= (SERVO_OPEN_ANGLE - 10)) ? "OPEN" : "CLOSED";

    String json = "{\"level\":" + String(waterLevelCm, 1) + 
                  ",\"soil\":\"" + soilStatus + 
                  "\",\"flow\":" + String(flowRateLPM, 1) + 
                  ",\"total\":" + String(totalLitres, 2) + 
                  ",\"health\":" + String(waterLevelCm > 50 ? 95 : 45) + 
                  ",\"safety\":\"" + safetyStatus + 
                  "\",\"ai\":\"" + aiDecision + 
                  "\",\"valve\":\"" + valveState + "\"" +
                  ",\"valveDeg\":" + String(currentServoAngle) + 
                  ",\"runMin\":" + String(recomRunMin) + "}\n";

    sendUartString(PIN_TX_TO_ESP, json);
  }

  // 5. Slide Advance (Every 3s)
  if (now - tSlide >= 3000) {
    tSlide = now;
    currentSlide = (currentSlide + 1) % 4;
  }

  // 6. Fast OLED Rendering (Every 100ms)
  if (now - tOled >= 100) {
    tOled = now;
    oled.clearDisplay();
    oled.setTextSize(1);
    oled.setCursor(0, 0);
    oled.print("JALBHOOMI AI  ");
    oled.print(currentSlide + 1);
    oled.print("/4");
    oled.drawLine(0, 9, 127, 9, SSD1306_WHITE);

    oled.setCursor(0, 16);
    switch (currentSlide) {
      case 0:
        oled.println("WATER LEVEL:");
        oled.setTextSize(2);
        oled.setCursor(10, 30);
        oled.print(waterLevelCm, 1);
        oled.print(" cm");
        oled.setTextSize(1);
        oled.setCursor(0, 52);
        oled.print("Depth: 150cm | ");
        oled.print(safetyStatus);
        break;

      case 1:
        oled.println("SOIL CONDITION:");
        oled.setTextSize(2);
        oled.setCursor(20, 30);
        oled.print(soilStatus);
        oled.setTextSize(1);
        oled.setCursor(0, 52);
        oled.print("Valve: ");
        oled.print(currentServoAngle);
        oled.print(" deg (");
        oled.print(currentServoAngle > 20 ? "OPEN" : "OFF");
        oled.print(")");
        break;

      case 2:
        oled.println("FLOW RATE:");
        oled.setTextSize(2);
        oled.setCursor(0, 30);
        oled.print(flowRateLPM, 1);
        oled.print(" L/m");
        oled.setTextSize(1);
        oled.setCursor(0, 52);
        oled.print("Total: ");
        oled.print(totalLitres, 1);
        oled.print(" L");
        break;

      case 3:
        oled.println("AI IRRIGATION:");
        oled.setTextSize(2);
        oled.setCursor(5, 28);
        oled.print(aiDecision);
        oled.setTextSize(1);
        oled.setCursor(0, 52);
        oled.print("Valve: ");
        oled.print(currentServoAngle >= (SERVO_OPEN_ANGLE - 10) ? "OPEN" : "CLOSED");
        break;
    }
    oled.display();
  }
}
