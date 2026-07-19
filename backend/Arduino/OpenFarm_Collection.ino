#include <Wire.h>
#include <Adafruit_SHT4x.h>
#include <SoftwareSerial.h>
#include <MHZ19.h>

// =======================
// 핀 설정
// =======================
const int RELAY_PIN = 7;   // LED 릴레이
const int MHZ_RX = 4;      // Arduino RX ← MH-Z19 TX
const int MHZ_TX = 5;      // Arduino TX → MH-Z19 RX

const int PUMP_AA = 10;     // 수중모터 PWM
const int PUMP_AB = 6;      // 수중모터 방향

// =======================
// 릴레이 동작 설정
// =======================
const int LED_ON_STATE  = HIGH;
const int LED_OFF_STATE = LOW;

// =======================
// 수중모터 설정
// =======================
const int PUMP_SPEED = 180;

// =======================
// 시간 설정
// =======================
const unsigned long SENSOR_INTERVAL = 3600000UL;   // 1시간
const unsigned long LED_OFF_TIME    = 43200000UL;  // 12시간 OFF
const unsigned long LED_ON_TIME     = 43200000UL;  // 12시간 ON

// 센서 전송 전후 LED 켜는 시간
const unsigned long SENSOR_LED_BEFORE_TIME = 300000UL;  // 5분
const unsigned long SENSOR_LED_AFTER_TIME  = 300000UL;  // 5분

// =======================
// 테스트용
// =======================
// const unsigned long SENSOR_INTERVAL = 10000UL;   // 10초마다 센서 전송
// const unsigned long LED_OFF_TIME    = 60000UL;   // 1분 OFF
// const unsigned long LED_ON_TIME     = 60000UL;   // 1분 ON
// const unsigned long SENSOR_LED_BEFORE_TIME = 3000UL; // 전 3초
// const unsigned long SENSOR_LED_AFTER_TIME  = 3000UL; // 후 3초

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

bool mainLedIsOn = false;    // false: 기본 OFF 구간, true: 기본 ON 구간
bool sensorHasSent = false;  // 센서 전송 후 5분 LED ON 판단용

// =======================
// millis 오버플로우 대응용 함수
// =======================
bool timeReached(unsigned long now, unsigned long targetTime) {
  return (long)(now - targetTime) >= 0;
}

void setup() {
  Serial.begin(9600);
  ss.begin(9600);
  Wire.begin();

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(PUMP_AA, OUTPUT);
  pinMode(PUMP_AB, OUTPUT);

  // =======================
  // 수중모터 항상 가동
  // =======================
  digitalWrite(PUMP_AB, LOW);
  analogWrite(PUMP_AA, PUMP_SPEED);

  // =======================
  // 시작할 때 LED OFF
  // 12시간 OFF → 12시간 ON 반복
  // =======================
  mainLedIsOn = false;
  digitalWrite(RELAY_PIN, LED_OFF_STATE);
  lastLedChangeTime = millis();

  delay(2000);

  // =======================
  // SHT4x 시작
  // =======================
  if (!sht4.begin()) {
    Serial.println("ERROR,SHT4x_NOT_FOUND");
    while (1) {
      delay(10);
    }
  }

  sht4.setPrecision(SHT4X_HIGH_PRECISION);
  sht4.setHeater(SHT4X_NO_HEATER);

  // =======================
  // 센서 전송은 1시간마다 계속
  // 첫 전송은 시작 후 1시간 뒤
  // =======================
  nextSensorTime = millis() + SENSOR_INTERVAL;
}

void loop() {
  unsigned long now = millis();

  // =======================
  // 1. 기본 LED 12시간 OFF / 12시간 ON 반복
  // =======================
  if (mainLedIsOn) {
    // 현재 기본 ON 구간
    if (now - lastLedChangeTime >= LED_ON_TIME) {
      mainLedIsOn = false;
      lastLedChangeTime = now;
    }
  } 
  else {
    // 현재 기본 OFF 구간
    if (now - lastLedChangeTime >= LED_OFF_TIME) {
      mainLedIsOn = true;
      lastLedChangeTime = now;
    }
  }

  // =======================
  // 2. 센서값은 1시간마다 항상 전송
  // LED ON/OFF 구간과 상관없이 계속 전송
  // =======================
  if (timeReached(now, nextSensorTime)) {
    sendSensorData();

    lastSensorSendTime = now;
    sensorHasSent = true;

    // 다음 센서 전송 시간 예약
    nextSensorTime = nextSensorTime + SENSOR_INTERVAL;

    // 혹시 loop 지연 등으로 시간이 많이 밀렸을 때 보정
    while (timeReached(now, nextSensorTime)) {
      nextSensorTime = nextSensorTime + SENSOR_INTERVAL;
    }
  }

  // =======================
  // 3. LED 실제 출력 결정
  // =======================

  // 센서 전송 5분 전 구간
  // 기본 OFF 구간에서만 의미 있음
  bool sensorBeforeLight = false;
  if (!mainLedIsOn) {
    unsigned long sensorLightStartTime = nextSensorTime - SENSOR_LED_BEFORE_TIME;

    if (timeReached(now, sensorLightStartTime) && !timeReached(now, nextSensorTime)) {
      sensorBeforeLight = true;
    }
  }

  // 센서 전송 후 5분 구간
  // 기본 OFF 구간에서만 의미 있음
  bool sensorAfterLight = false;
  if (!mainLedIsOn && sensorHasSent) {
    unsigned long sensorLightEndTime = lastSensorSendTime + SENSOR_LED_AFTER_TIME;

    if (timeReached(now, lastSensorSendTime) && !timeReached(now, sensorLightEndTime)) {
      sensorAfterLight = true;
    }
  }

  // 최종 LED 상태
  // 기본 ON 구간이면 무조건 ON
  // 기본 OFF 구간이라도 센서 전송 전후 5분이면 ON
  if (mainLedIsOn || sensorBeforeLight || sensorAfterLight) {
    digitalWrite(RELAY_PIN, LED_ON_STATE);
  } 
  else {
    digitalWrite(RELAY_PIN, LED_OFF_STATE);
  }
}

// =======================
// 센서값 전송 함수
// 형식:
// MHZ_TEMP,SHT_TEMP,HUMIDITY,CO2
// =======================
void sendSensorData() {
  // 1. MH-Z19 CO2 읽기
  MHZ19_RESULT response = mhz.retrieveData();

  int co2 = -999;
  int mhz_temp = -999;

  if (response == MHZ19_RESULT_OK) {
    co2 = mhz.getCO2();
    mhz_temp = mhz.getTemperature();
  }

  // 2. SHT4x 온습도 읽기
  sensors_event_t humidity, temp;
  sht4.getEvent(&humidity, &temp);

  float sht_temp = temp.temperature;
  float sht_humidity = humidity.relative_humidity;

  // 3. Raspberry Pi 또는 PC로 전송
  Serial.print(mhz_temp);
  Serial.print(",");
  Serial.print(sht_temp);
  Serial.print(",");
  Serial.print(sht_humidity);
  Serial.print(",");
  Serial.println(co2);
}
