#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHTesp.h>

// ============ CONFIGURATION ============
const char* THINGSPEAK_CHANNEL_ID = "3424030";
const char* THINGSPEAK_WRITE_KEY  = "OECVKXYWKIUTMSR6";
const char* THINGSPEAK_READ_KEY   = "THNAJESH2V3J2Y9I";
const char* ROOM                  = "A101";
const char* DEVICE_ID             = "ESP32-A101";

// ============ Network ============
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// ============ Server URLs ============
const char* THINGSPEAK_URL = "http://api.thingspeak.com/update";
const char* API_BASE_URL   = "https://smart-campus-api-y8qy.onrender.com";

// ============ Timing ============
const unsigned long SEND_INTERVAL      = 15000;
const unsigned long HEARTBEAT_INTERVAL = 60000;

// ============ Pins — Wokwi wiring ============
#define DHT_PIN    15
#define LIGHT_PIN  34
#define PIR_PIN    27
#define LED_PIN    2
#define LED_R_PIN  23
#define LED_G_PIN  25
#define LED_B_PIN  26

// ============ LEDC PWM ============
#define CH_R     0
#define CH_G     1
#define CH_B     2
#define PWM_FREQ 5000
#define PWM_RES  8

// ============ DHT22 ============
DHTesp dht;

// ============ State ============
unsigned long lastSendTime      = 0;
unsigned long lastHeartbeatTime = 0;
float battery     = 100.0;
float temperature = 22.0;
float humidity    = 45.0;
float light       = 300.0;
bool  presence    = false;

// ============ Forward Declarations ============
void connectWiFi();
void readSensors();
void sendToThingSpeak();
void sendHeartbeat();
void checkLedCommand();
void autoUpdateLedByCondition();
void setLedColor(const char* color, int brightness);

// ============ Setup ============
void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 Smart Campus ESP32 — Room: " + String(ROOM));

  dht.setup(DHT_PIN, DHTesp::DHT22);
  delay(2000); // DHT22 warmup

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  ledcSetup(CH_R, PWM_FREQ, PWM_RES);
  ledcSetup(CH_G, PWM_FREQ, PWM_RES);
  ledcSetup(CH_B, PWM_FREQ, PWM_RES);
  ledcAttachPin(LED_R_PIN, CH_R);
  ledcAttachPin(LED_G_PIN, CH_G);
  ledcAttachPin(LED_B_PIN, CH_B);
  setLedColor("off", 0);

  connectWiFi();
  sendHeartbeat();
}

// ============ Loop ============
void loop() {
  unsigned long now = millis();

  readSensors();

  if (now - lastSendTime >= SEND_INTERVAL) {
    sendToThingSpeak();
    lastSendTime = now;
  }

  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeatTime = now;
  }

  checkLedCommand();
  autoUpdateLedByCondition(); // ← auto LED color based on conditions

  delay(2000);
}

// ============ WiFi ============
void connectWiFi() {
  Serial.print("📡 Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected! IP: " + WiFi.localIP().toString());
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("\n❌ WiFi failed! Restarting...");
    ESP.restart();
  }
}

// ============ Read Sensors ============
void readSensors() {
  static unsigned long lastDhtRead = 0;
  unsigned long now = millis();

  if (now - lastDhtRead >= 2000) {
    lastDhtRead = now;
    TempAndHumidity data = dht.getTempAndHumidity();

    if (dht.getStatus() == DHTesp::ERROR_NONE
        && data.temperature >  0.0 && data.temperature < 50.0
        && data.humidity    >  5.0 && data.humidity    < 99.0) {
      temperature = data.temperature;
      humidity    = data.humidity;
    } else {
      Serial.println("⚠️  DHT22 bad value, keeping last");
    }
  }

  light    = (analogRead(LIGHT_PIN) / 4095.0) * 1000.0;
  presence = digitalRead(PIR_PIN) == HIGH;

  battery -= 0.001;
  if (battery < 0) battery = 0;

  digitalWrite(LED_PIN, presence ? HIGH : LOW);

  Serial.printf("📊 T:%.1f°C  H:%.1f%%  L:%.0f lux  P:%s  B:%.0f%%\n",
    temperature, humidity, light,
    presence ? "YES" : "NO", battery);

  // Alert conditions
  if (temperature > 30.0) Serial.printf("🔴 ALERT: High temp! %.1f°C\n", temperature);
  if (humidity    > 70.0) Serial.printf("🔵 ALERT: High humidity! %.1f%%\n", humidity);
  if (light       < 100.0) Serial.printf("🟡 ALERT: Low light! %.0f lux\n", light);
  if (presence)             Serial.println("🟢 INFO: Presence detected");
  if (battery     < 20.0) Serial.printf("🔋 ALERT: Low battery! %.0f%%\n", battery);

  // Active LED prediction
  if      (temperature > 30.0) Serial.println("💡 LED → RED (heat alert)");
  else if (humidity    > 70.0) Serial.println("💡 LED → BLUE (high humidity)");
  else if (light       < 100.0) Serial.println("💡 LED → YELLOW (dark room)");
  else if (presence)            Serial.println("💡 LED → GREEN (occupied)");
  else                          Serial.println("💡 LED → GREEN (default) or OFF");
}

// ============ Send to ThingSpeak ============
void sendToThingSpeak() {
  if (WiFi.status() != WL_CONNECTED) { connectWiFi(); return; }

  HTTPClient http;
  String url = String(THINGSPEAK_URL)
    + "?api_key=" + THINGSPEAK_WRITE_KEY
    + "&field1="  + String(temperature, 1)
    + "&field2="  + String(humidity,    1)
    + "&field3="  + String(light,       0)
    + "&field4="  + String(presence ? 1 : 0)
    + "&field5="  + String(battery,     0);
  // ⚠️ field6 owned by autoUpdateLedByCondition — do NOT write here

  http.begin(url);
  http.setTimeout(15000);
  int httpCode = http.GET();

  if (httpCode == 200) {
    Serial.println("✅ ThingSpeak updated (entry: " + http.getString() + ")");
  } else {
    Serial.println("❌ ThingSpeak failed: " + String(httpCode));
  }
  http.end();
}

// ============ Heartbeat ============
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/devices/heartbeat";

  http.begin(url);
  http.setTimeout(15000);
  http.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  doc["deviceId"]            = DEVICE_ID;
  doc["room"]                = ROOM;
  doc["battery"]             = (int)battery;
  doc["wifiSignal"]          = WiFi.RSSI();
  doc["firmware"]            = "1.0.0";
  doc["thingspeakChannelId"] = THINGSPEAK_CHANNEL_ID;
  doc["thingspeakReadKey"]   = THINGSPEAK_READ_KEY;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  if (httpCode == 200 || httpCode == 201) {
    Serial.println("💓 Heartbeat sent successfully");
  } else {
    Serial.println("❌ Heartbeat failed: " + String(httpCode));
    Serial.println("   Response: " + http.getString());
  }
  http.end();
}

// ============ Auto LED update by sensor condition ============
// Writes field6 to ThingSpeak every 15s based on live sensor values
void autoUpdateLedByCondition() {
  static unsigned long lastAutoUpdate = 0;
  if (millis() - lastAutoUpdate < 15000) return;
  lastAutoUpdate = millis();

  if (WiFi.status() != WL_CONNECTED) return;

  String color      = "green";
  int    brightness = 200;

  if      (temperature > 30.0)  { color = "red";    brightness = 255; }
  else if (humidity    > 70.0)  { color = "blue";   brightness = 200; }
  else if (light       < 100.0) { color = "yellow"; brightness = 200; }
  else if (presence)            { color = "green";  brightness = 180; }

  String field6 = "1:" + color + ":" + String(brightness);

  HTTPClient http;
  String url = "http://api.thingspeak.com/update?api_key="
               + String(THINGSPEAK_WRITE_KEY)
               + "&field6=" + field6;
  http.begin(url);
  http.setTimeout(8000);
  http.GET();
  http.end();

  Serial.println("🔄 Auto LED → " + field6);
}

// ============ Check LED command from ThingSpeak field6 ============
void checkLedCommand() {
  static unsigned long lastLedCheck = 0;
  if (millis() - lastLedCheck < 10000) return;
  lastLedCheck = millis();

  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = "http://api.thingspeak.com/channels/"
               + String(THINGSPEAK_CHANNEL_ID)
               + "/fields/6/last.txt?api_key="
               + String(THINGSPEAK_READ_KEY);

  http.begin(url);
  http.setTimeout(10000);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String field6 = http.getString();
    field6.trim();

    if (field6 == "-1" || field6 == "" || field6 == "0:off:0") {
      setLedColor("off", 0);
      Serial.println("💡 LED: off");
      http.end();
      return;
    }

    Serial.println("💡 LED command: '" + field6 + "'");

    int sep1 = field6.indexOf(':');
    int sep2 = field6.lastIndexOf(':');

    if (sep1 != -1 && sep2 != -1 && sep1 != sep2) {
      String onStr     = field6.substring(0, sep1);
      String colorStr  = field6.substring(sep1 + 1, sep2);
      String brightStr = field6.substring(sep2 + 1);

      bool ledOn      = onStr.toInt() == 1;
      int  brightness = brightStr.toInt();

      if (ledOn) {
        setLedColor(colorStr.c_str(), brightness);
        Serial.printf("💡 LED: %s (brightness: %d)\n", colorStr.c_str(), brightness);
      } else {
        setLedColor("off", 0);
        Serial.println("💡 LED: off");
      }
    }
  } else {
    Serial.println("⚠️  LED check failed: " + String(httpCode));
  }
  http.end();
}

// ============ Set RGB LED Color ============
void setLedColor(const char* color, int brightness) {
  int r = 0, g = 0, b = 0;

  if      (strcmp(color, "red")    == 0) { r = brightness; }
  else if (strcmp(color, "green")  == 0) { g = brightness; }
  else if (strcmp(color, "blue")   == 0) { b = brightness; }
  else if (strcmp(color, "yellow") == 0) { r = brightness; g = brightness; }
  else if (strcmp(color, "white")  == 0) { r = brightness; g = brightness; b = brightness; }

  ledcWrite(CH_R, r);
  ledcWrite(CH_G, g);
  ledcWrite(CH_B, b);
}