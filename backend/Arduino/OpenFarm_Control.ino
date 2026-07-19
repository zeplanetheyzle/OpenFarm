#include <Wire.h>
#include <Adafruit_SHT4x.h>
#include <SoftwareSerial.h>
#include <MHZ19.h>
#include <string.h>
#include <stdlib.h>
#include <math.h>

// =======================
// 핀 설정
// =======================
const int LED_RELAY_PIN = 7;
const int COOLING_RELAY_PIN = 8;
const int HEATING_RELAY_PIN = 9;
const int VENT_RELAY_PIN = 11;

const int MHZ_RX = 4;
const int MHZ_TX = 5;

const int PUMP_AA = 10;
const int PUMP_AB = 6;
const int PUMP_SPEED = 180;

// =======================
// 릴레이 설정
// =======================
const int LED_ON_STATE = HIGH;
const int LED_OFF_STATE = LOW;
const int CONTROL_RELAY_ON_STATE = HIGH;
const int CONTROL_RELAY_OFF_STATE = LOW;

// =======================
// 시간 설정
// =======================
const unsigned long SENSOR_INTERVAL = 3600000UL;
const unsigned long LED_OFF_TIME = 43200000UL;
const unsigned long LED_ON_TIME = 43200000UL;
const unsigned long SENSOR_LED_BEFORE_TIME = 300000UL;
const unsigned long SENSOR_LED_AFTER_TIME = 300000UL;
const unsigned long CONTROL_SENSOR_INTERVAL = 2000UL;

// =======================
// 제어 설정
// =======================
const float TEMP_HYSTERESIS = 0.5f;
const float HUM_HYSTERESIS = 3.0f;

const float MIN_TARGET_TEMP = 5.0f;
const float MAX_TARGET_TEMP = 45.0f;
const float MIN_TARGET_HUM = 20.0f;
const float MAX_TARGET_HUM = 95.0f;

// =======================
// 센서 객체
// =======================
Adafruit_SHT4x sht4 = Adafruit_SHT4x();
SoftwareSerial ss(MHZ_RX, MHZ_TX);
MHZ19 mhz(&ss);

// =======================
// 상태 변수
// =======================
unsigned long lastLedChangeTime = 0;
unsigned long nextSensorTime = 0;
unsigned long lastSensorSendTime = 0;
unsigned long lastControlSensorReadTime = 0;

bool mainLedIsOn = false;
bool sensorHasSent = false;

float currentTemperature = NAN;
float currentHumidity = NAN;
float targetTemperature = 0.0f;
float targetHumidity = 0.0f;

bool targetReceived = false;
bool coolingIsOn = false;
bool heatingIsOn = false;
bool ventIsOn = false;

char serialBuffer[48];
byte serialIndex = 0;

bool timeReached(unsigned long now, unsigned long targetTime) {
  return (long)(now - targetTime) >= 0;
}

// =======================
// 초기 설정
// =======================
void setup() {
  Serial.begin(9600);
  ss.begin(9600);
  Wire.begin();

  pinMode(LED_RELAY_PIN, OUTPUT);
  pinMode(COOLING_RELAY_PIN, OUTPUT);
  pinMode(HEATING_RELAY_PIN, OUTPUT);
  pinMode(VENT_RELAY_PIN, OUTPUT);
  pinMode(PUMP_AA, OUTPUT);
  pinMode(PUMP_AB, OUTPUT);

  digitalWrite(COOLING_RELAY_PIN, CONTROL_RELAY_OFF_STATE);
  digitalWrite(HEATING_RELAY_PIN, CONTROL_RELAY_OFF_STATE);
  digitalWrite(VENT_RELAY_PIN, CONTROL_RELAY_OFF_STATE);

  digitalWrite(PUMP_AB, LOW);
  analogWrite(PUMP_AA, PUMP_SPEED);

  digitalWrite(LED_RELAY_PIN, LED_OFF_STATE);
  lastLedChangeTime = millis();

  delay(2000);

  if (!sht4.begin()) {
    Serial.println("ERROR,SHT4x_NOT_FOUND");
    turnOffClimateDevices();

    while (1) {
      delay(10);
    }
  }

  sht4.setPrecision(SHT4X_HIGH_PRECISION);
  sht4.setHeater(SHT4X_NO_HEATER);

  nextSensorTime = millis() + SENSOR_INTERVAL;
  lastControlSensorReadTime = millis() - CONTROL_SENSOR_INTERVAL;
}

// =======================
// 메인 루프
// =======================
void loop() {
  unsigned long now = millis();

  receiveSerialCommand();
  updateMainLedSchedule(now);

  if (now - lastControlSensorReadTime >= CONTROL_SENSOR_INTERVAL) {
    lastControlSensorReadTime = now;

    if (readShtSensor()) {
      updateClimateControl();
    } else {
      turnOffClimateDevices();
    }
  }

  if (timeReached(now, nextSensorTime)) {
    sendSensorData();
    lastSensorSendTime = now;
    sensorHasSent = true;
    nextSensorTime += SENSOR_INTERVAL;

    while (timeReached(now, nextSensorTime)) {
      nextSensorTime += SENSOR_INTERVAL;
    }
  }

  updateLedOutput(now);
}

// =======================
// 시리얼 통신
// =======================
void receiveSerialCommand() {
  while (Serial.available() > 0) {
    char incoming = Serial.read();

    if (incoming == '\r') {
      continue;
    }

    if (incoming == '\n') {
      serialBuffer[serialIndex] = '\0';

      if (serialIndex > 0) {
        processSerialCommand(serialBuffer);
      }

      serialIndex = 0;
    } else if (serialIndex < sizeof(serialBuffer) - 1) {
      serialBuffer[serialIndex++] = incoming;
    } else {
      serialIndex = 0;
    }
  }
}

void processSerialCommand(char *command) {
  if (strcmp(command, "STOP") == 0) {
    targetReceived = false;
    turnOffClimateDevices();
    return;
  }

  char *firstToken = strtok(command, ",");
  char *secondToken = strtok(NULL, ",");
  char *thirdToken = strtok(NULL, ",");

  if (firstToken == NULL || secondToken == NULL) {
    return;
  }

  float newTargetTemperature;
  float newTargetHumidity;

  if (strcmp(firstToken, "SET") == 0) {
    if (thirdToken == NULL) {
      return;
    }

    newTargetTemperature = atof(secondToken);
    newTargetHumidity = atof(thirdToken);
  } else {
    newTargetTemperature = atof(firstToken);
    newTargetHumidity = atof(secondToken);
  }

  if (newTargetTemperature < MIN_TARGET_TEMP ||
      newTargetTemperature > MAX_TARGET_TEMP ||
      newTargetHumidity < MIN_TARGET_HUM ||
      newTargetHumidity > MAX_TARGET_HUM) {
    return;
  }

  targetTemperature = newTargetTemperature;
  targetHumidity = newTargetHumidity;
  targetReceived = true;

  coolingIsOn = false;
  heatingIsOn = false;
  ventIsOn = false;
  applyClimateOutputs();

  if (!isnan(currentTemperature) && !isnan(currentHumidity)) {
    updateClimateControl();
  }
}

// =======================
// 센서 측정
// =======================
bool readShtSensor() {
  sensors_event_t humidityEvent;
  sensors_event_t temperatureEvent;

  sht4.getEvent(&humidityEvent, &temperatureEvent);

  float newTemperature = temperatureEvent.temperature;
  float newHumidity = humidityEvent.relative_humidity;

  if (isnan(newTemperature) || isnan(newHumidity)) {
    return false;
  }

  currentTemperature = newTemperature;
  currentHumidity = newHumidity;
  return true;
}

void sendSensorData() {
  MHZ19_RESULT response = mhz.retrieveData();

  int co2 = -999;
  int mhzTemperature = -999;

  if (response == MHZ19_RESULT_OK) {
    co2 = mhz.getCO2();
    mhzTemperature = mhz.getTemperature();
  }

  bool shtReadSuccess = readShtSensor();

  float shtTemperature = -999.0f;
  float shtHumidity = -999.0f;

  if (shtReadSuccess) {
    shtTemperature = currentTemperature;
    shtHumidity = currentHumidity;
    updateClimateControl();
  } else {
    turnOffClimateDevices();
  }

  Serial.print(mhzTemperature);
  Serial.print(",");
  Serial.print(shtTemperature);
  Serial.print(",");
  Serial.print(shtHumidity);
  Serial.print(",");
  Serial.println(co2);
}

// =======================
// 온습도 제어
// =======================
void updateClimateControl() {
  if (!targetReceived ||
      isnan(currentTemperature) ||
      isnan(currentHumidity)) {
    turnOffClimateDevices();
    return;
  }

  if (coolingIsOn) {
    if (currentTemperature <= targetTemperature) {
      coolingIsOn = false;
    }
  } else if (heatingIsOn) {
    if (currentTemperature >= targetTemperature) {
      heatingIsOn = false;
    }
  } else {
    if (currentTemperature >= targetTemperature + TEMP_HYSTERESIS) {
      coolingIsOn = true;
      heatingIsOn = false;
    } else if (currentTemperature <= targetTemperature - TEMP_HYSTERESIS) {
      heatingIsOn = true;
      coolingIsOn = false;
    }
  }

  if (ventIsOn) {
    if (currentHumidity <= targetHumidity) {
      ventIsOn = false;
    }
  } else if (currentHumidity >= targetHumidity + HUM_HYSTERESIS) {
    ventIsOn = true;
  }

  applyClimateOutputs();
}

void applyClimateOutputs() {
  digitalWrite(
    COOLING_RELAY_PIN,
    coolingIsOn ? CONTROL_RELAY_ON_STATE : CONTROL_RELAY_OFF_STATE
  );

  digitalWrite(
    HEATING_RELAY_PIN,
    heatingIsOn ? CONTROL_RELAY_ON_STATE : CONTROL_RELAY_OFF_STATE
  );

  digitalWrite(
    VENT_RELAY_PIN,
    ventIsOn ? CONTROL_RELAY_ON_STATE : CONTROL_RELAY_OFF_STATE
  );
}

void turnOffClimateDevices() {
  coolingIsOn = false;
  heatingIsOn = false;
  ventIsOn = false;
  applyClimateOutputs();
}

// =======================
// LED 제어
// =======================
void updateMainLedSchedule(unsigned long now) {
  if (mainLedIsOn) {
    if (now - lastLedChangeTime >= LED_ON_TIME) {
      mainLedIsOn = false;
      lastLedChangeTime = now;
    }
  } else {
    if (now - lastLedChangeTime >= LED_OFF_TIME) {
      mainLedIsOn = true;
      lastLedChangeTime = now;
    }
  }
}

void updateLedOutput(unsigned long now) {
  bool sensorBeforeLight = false;

  if (!mainLedIsOn) {
    unsigned long sensorLightStartTime = nextSensorTime - SENSOR_LED_BEFORE_TIME;

    if (timeReached(now, sensorLightStartTime) &&
        !timeReached(now, nextSensorTime)) {
      sensorBeforeLight = true;
    }
  }

  bool sensorAfterLight = false;

  if (!mainLedIsOn && sensorHasSent) {
    unsigned long sensorLightEndTime = lastSensorSendTime + SENSOR_LED_AFTER_TIME;

    if (timeReached(now, lastSensorSendTime) &&
        !timeReached(now, sensorLightEndTime)) {
      sensorAfterLight = true;
    }
  }

  if (mainLedIsOn || sensorBeforeLight || sensorAfterLight) {
    digitalWrite(LED_RELAY_PIN, LED_ON_STATE);
  } else {
    digitalWrite(LED_RELAY_PIN, LED_OFF_STATE);
  }
}
