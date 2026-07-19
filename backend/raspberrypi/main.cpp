#include <iostream>
#include <string>
#include <vector>
#include <ctime>
#include <fstream>
#include <fcntl.h>
#include <termios.h>
#include <unistd.h>
#include <sstream>
#include <opencv2/opencv.hpp>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

using namespace std;
using namespace cv;
using json = nlohmann::json;

// Supabase 접속 정보 — 환경변수에서 읽기
const string SUPABASE_URL = "https://heygnkqtjrpvumjenozr.supabase.co";
const char* env_key = getenv("SUPABASE_KEY");
string SUPABASE_KEY = env_key ? string(env_key) : "sb_publishable_Ruo628BB_Ysc32ts7b250g_T0GkNoZR";
const char* env_id = getenv("DEVICE_ID");
string DEVICE_ID = env_id ? string(env_id) : "openfarm1";
const char* env_crop = getenv("CROP_TYPE");
string CROP_TYPE = env_crop ? string(env_crop) : "상추";
const char* env_port = getenv("SERIAL_PORT");
string SERIAL_PORT = env_port ? string(env_port) : "/dev/ttyS0";

// 사진 촬영 및 업로드 함수
string captureAndUpload() {
    // 카메라 연결(0번)
    VideoCapture cap(0);
    if (!cap.isOpened()) {
        cerr << "\033[1;31m [카메라 에러] 카메라를 열 수 없습니다.\033[0m" << endl;
        return "";
    }

    // 센서 인식 시간 확보
    Mat frame;
    for (int i = 0; i < 5; i++) cap >> frame; // 예열

    if (frame.empty()) {
        cap.release();
        return "";
    }
    cap.release(); // 촬영 후 카메라 자원 해제

    string tempFileName = "cam_check.jpg";
    imwrite(tempFileName, frame);

    ifstream in(tempFileName, ios::binary | ios::ate);
    long fileSize = in.tellg();
    if (fileSize <= 0) {
        remove(tempFileName.c_str());
        return "";
    }

    // 사진 파일명 생성 (형식: 디바이스명_월.일.시)
    time_t now = time(0);
    struct tm* tstruct = localtime(&now);

    stringstream ss_time;
    ss_time << (tstruct->tm_mon + 1) << "."
            << tstruct->tm_mday << "."
            << tstruct->tm_hour;

    string realFileName = DEVICE_ID + "_" + ss_time.str() + ".jpg";
    rename(tempFileName.c_str(), realFileName.c_str());

    string publicUrl = "";
    CURL* curl = curl_easy_init();
    if (curl) {
        string uploadUrl = SUPABASE_URL + "/storage/v1/object/plant_images/" + realFileName;
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, ("Authorization: Bearer " + SUPABASE_KEY).c_str());
        headers = curl_slist_append(headers, ("apikey: " + SUPABASE_KEY).c_str());
        headers = curl_slist_append(headers, "Content-Type: image/jpeg");

        FILE* fd = fopen(realFileName.c_str(), "rb");
        curl_easy_setopt(curl, CURLOPT_URL, uploadUrl.c_str());
        curl_easy_setopt(curl, CURLOPT_UPLOAD, 1L);
        curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");
        curl_easy_setopt(curl, CURLOPT_READDATA, fd);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        CURLcode res = curl_easy_perform(curl);
        fclose(fd);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        if (res == CURLE_OK) {
            publicUrl = SUPABASE_URL + "/storage/v1/object/public/plant_images/" + realFileName;
            remove(realFileName.c_str());
        }
    }
    return publicUrl;
}

int main() {
    // 환경변수 확인 출력
    cout << "\n [설정] DEVICE_ID: " << DEVICE_ID << endl;
    cout << " [설정] CROP_TYPE: " << CROP_TYPE << endl;
    cout << " [설정] SERIAL_PORT: " << SERIAL_PORT << endl;

    // 시리얼 포트 열기
    int serial_fd = open(SERIAL_PORT.c_str(), O_RDWR | O_NOCTTY);
    if (serial_fd == -1) {
        perror("\033[1;31m [시리얼 에러] 포트를 열 수 없습니다.\033[0m");
        return -1;
    }

    // 통신 속도, 모드 설정
    struct termios options;
    tcgetattr(serial_fd, &options);
    cfsetispeed(&options, B9600);
    cfsetospeed(&options, B9600);
    options.c_lflag |= ICANON;
    tcsetattr(serial_fd, TCSANOW, &options);

    cout << "\n 시스템 가동 중... (온도1, 온도2, 습도, CO2 데이터 수신 대기)" << endl;

    char buf[128];

    while (true) {
        int n = read(serial_fd, buf, sizeof(buf) - 1);

        if (n > 0) {
            buf[n] = '\0';
            string data_str(buf);
            stringstream ss(data_str);

            string t1, t2, hum, co2;

            if (getline(ss, t1, ',') && getline(ss, t2, ',') &&
                getline(ss, hum, ',') && getline(ss, co2)) {

                cout << "\n [수신] 온도1: " << t1 << "°C | 온도2: " << t2
                     << "°C | 습도: " << hum << "% | CO2: " << co2 << "ppm" << endl;

                // 사진 촬영 및 업로드
                string imageUrl = captureAndUpload();
                if (!imageUrl.empty()) cout << " [성공] 사진 촬영 및 업로드 완료" << endl;
                else imageUrl = "";

                // Supabase에 데이터 저장
                CURL* curl = curl_easy_init();
                if (curl) {
                    string dbUrl = SUPABASE_URL + "/rest/v1/sensor_logs";

                    float temp1 = 0.0f, temp2 = 0.0f, humidity = 0.0f, co2_val = 0.0f;

                    try { temp1 = stof(t1); }
                    catch (...) {
                        cerr << " \033[1;33m[경고] 온도1 변환 실패 (기본값 -999.0): " << t1 << "\033[0m" << endl;
                        temp1 = -999.0f;
                    }

                    try { temp2 = stof(t2); }
                    catch (...) {
                        cerr << " \033[1;33m[경고] 온도2 변환 실패 (기본값 -999.0): " << t2 << "\033[0m" << endl;
                        temp2 = -999.0f;
                    }

                    try { humidity = stof(hum); }
                    catch (...) {
                        cerr << " \033[1;33m[경고] 습도 변환 실패 (기본값 0.0): " << hum << "\033[0m" << endl;
                        humidity = 0.0f;
                    }

                    try { co2_val = stof(co2); }
                    catch (...) {
                        cerr << " \033[1;33m[경고] CO2 변환 실패 (기본값 0.0): " << co2 << "\033[0m" << endl;
                        co2_val = 0.0f;
                    }

                    // JSON payload — crop_type 추가
                    json payload = {
                        {"device_id", DEVICE_ID},
                        {"temperature", temp1},
                        {"temperature2", temp2},
                        {"humidity", humidity},
                        {"co2_level", co2_val},
                        {"image_url", imageUrl.empty() ? nullptr : json(imageUrl)},
                        {"crop_type", CROP_TYPE}
                    };
                    string jsonStr = payload.dump();

                    struct curl_slist* headers = NULL;
                    headers = curl_slist_append(headers, ("Authorization: Bearer " + SUPABASE_KEY).c_str());
                    headers = curl_slist_append(headers, ("apikey: " + SUPABASE_KEY).c_str());
                    headers = curl_slist_append(headers, "Content-Type: application/json");

                    curl_easy_setopt(curl, CURLOPT_URL, dbUrl.c_str());
                    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonStr.c_str());
                    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

                    CURLcode res = curl_easy_perform(curl);
                    if (res == CURLE_OK) {
                        cout << "\033[1;36m [DB 성공] 데이터 저장 완료\033[0m\n" << endl;
                    } else {
                        cerr << "\033[1;31m [DB 에러] Supabase 전송 실패\033[0m" << endl;
                    }

                    curl_slist_free_all(headers);
                    curl_easy_cleanup(curl);
                }
            }
        }

        usleep(500000); // 0.5초 대기
    }

    close(serial_fd);
    return 0;
}