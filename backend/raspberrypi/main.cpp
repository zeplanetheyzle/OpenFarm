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

// Supabase 접속 정보
const string SUPABASE_URL = "https://heygnkqtjrpvumjenozr.supabase.co";
const string SUPABASE_KEY = "sb_publishable_Ruo628BB_Ysc32ts7b250g_T0GkNoZR";
const string DEVICE_ID = "openfarm1"; // supabase에 저장될 디바이스 이름

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
    cap.release();      // 촬영 후 카메라 자원 해제

    string tempFileName = "cam_check.jpg";
    imwrite(tempFileName, frame);

    ifstream in(tempFileName, ios::binary | ios::ate);
    long fileSize = in.tellg();
    if (fileSize <= 0) {
        remove(tempFileName.c_str());
        return "";
    }

    // 사진 파일명 생성(형식: 디바이스명_날짜.시간(0~23))
    // 1. 현재 시간 가져오기
    time_t now = time(0);
    struct tm* tstruct = localtime(&now);

    // 2. 월, 일, 시(0~23) 정보를 문자열 스트림으로 조합
    stringstream ss_time;
    ss_time << (tstruct->tm_mon + 1) << "."  // tm_mon은 0부터 시작하므로 +1
        << tstruct->tm_mday << "."
        << tstruct->tm_hour;             // 0~23시 형식

    // 3. 디바이스명(DEVICE_ID)과 조합하여 최종 파일명 완성
    string realFileName = DEVICE_ID + "_" + ss_time.str() + ".jpg";
    rename(tempFileName.c_str(), realFileName.c_str());

    string publicUrl = "";
    CURL* curl = curl_easy_init();
    if (curl) {
        // Supabase 업로드 주소
        string uploadUrl = SUPABASE_URL + "/storage/v1/object/plant_images/" + realFileName;
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, ("Authorization: Bearer " + SUPABASE_KEY).c_str());
        headers = curl_slist_append(headers, ("apikey: " + SUPABASE_KEY).c_str());
        headers = curl_slist_append(headers, "Content-Type: image/jpeg");

        // 바이너리 파일 읽기 및 POST 설정
        FILE* fd = fopen(realFileName.c_str(), "rb");
        curl_easy_setopt(curl, CURLOPT_URL, uploadUrl.c_str());
        curl_easy_setopt(curl, CURLOPT_UPLOAD, 1L);
        curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");
        curl_easy_setopt(curl, CURLOPT_READDATA, fd);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        // 전송
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
    // 시리얼 포트 열기
    int serial_fd = open("/dev/ttyS0", O_RDWR | O_NOCTTY);
    if (serial_fd == -1) {
        perror("\033[1;31m [시리얼 에러] 포트를 열 수 없습니다.\033[0m");
        return -1;
    }

    // 통신 속도, 모드 설정
    struct termios options;
    tcgetattr(serial_fd, &options);
    cfsetispeed(&options, B9600);       // 수신 속도
    cfsetospeed(&options, B9600);       // 송신 속도
    options.c_lflag |= ICANON;          // '\n' 단위로 줄 단위 데이터 읽기
    tcsetattr(serial_fd, TCSANOW, &options);

    cout << "\n 시스템 가동 중... (온도1, 온도2, 습도, CO2 데이터 수신 대기)" << endl;

    char buf[128];

    while (true) {
        // 시리얼 버퍼 열기
        int n = read(serial_fd, buf, sizeof(buf) - 1);

        if (n > 0) {
            buf[n] = '\0';
            string data_str(buf);
            stringstream ss(data_str);

            // 4개의 데이터를 저장할 변수
            string t1, t2, hum, co2;

            // 콤마(,)를 기준으로 4개 데이터를 분리
            if (getline(ss, t1, ',') && getline(ss, t2, ',') &&
                getline(ss, hum, ',') && getline(ss, co2)) {

                // 수신 데이터 콘솔 출력
                cout << "\n [수신] 온도1: " << t1 << "°C | 온도2: " << t2
                    << "°C | 습도: " << hum << "% | CO2: " << co2 << "ppm" << endl;

                // 사진 촬영 함수 호출 & 이미지 주소 get
                string imageUrl = captureAndUpload();
                if (!imageUrl.empty()) cout << " [성공] 사진 촬영 및 업로드 완료" << endl;
                else imageUrl = "";

                // 수신 데이터 및 이미지 주소 supabase에 저장
                CURL* curl = curl_easy_init();
                if (curl) {
                    string dbUrl = SUPABASE_URL + "/rest/v1/sensor_logs";

                    // 데이터 변환용 변수 초기화
                    float temp1 = 0.0f, temp2 = 0.0f, humidity = 0.0f, co2_val = 0.0f;

                    // 숫자가 아닌 문자열이 들어왔을 때 튕기지 않도록 try-catch 예외 처리
                    try {
                        temp1 = stof(t1);
                    }
                    catch (...) {
                        cerr << " \033[1;33m[경고] 온도1 데이터 변환 실패 (기본값 -999.0 처리): " << t1 << "\033[0m" << endl;
                        temp1 = -999.0f;
                    }

                    try {
                        temp2 = stof(t2);
                    }
                    catch (...) {
                        cerr << " \033[1;33m[경고] 온도2 데이터 변환 실패 (기본값 -999.0 처리): " << t2 << "\033[0m" << endl;
                        temp2 = -999.0f;
                    }

                    try {
                        humidity = stof(hum);
                    }
                    catch (...) {
                        cerr << " \033[1;33m[경고] 습도 데이터 변환 실패 (기본값 0.0 처리): " << hum << "\033[0m" << endl;
                        humidity = 0.0f;
                    }

                    try {
                        co2_val = stof(co2);
                    }
                    catch (...) {
                        cerr << " \033[1;33m[경고] CO2 데이터 변환 실패 (기본값 0.0 처리): " << co2 << "\033[0m" << endl;
                        co2_val = 0.0f;
                    }

                    // 안전하게 정제된 데이터로 JSON 생성
                    json payload = {
                        {"device_id", DEVICE_ID},
                        {"temperature", temp1},
                        {"temperature2", temp2},
                        {"humidity", humidity},
                        {"co2_level", co2_val},
                        {"image_url", imageUrl.empty() ? nullptr : imageUrl}
                    };
                    string jsonStr = payload.dump();        // JSON 객체를 문자열로

                    // HTTP 헤더 설정
                    struct curl_slist* headers = NULL;
                    headers = curl_slist_append(headers, ("Authorization: Bearer " + SUPABASE_KEY).c_str());
                    headers = curl_slist_append(headers, ("apikey: " + SUPABASE_KEY).c_str());
                    headers = curl_slist_append(headers, "Content-Type: application/json");

                    // CURL 옵션 설정
                    curl_easy_setopt(curl, CURLOPT_URL, dbUrl.c_str());
                    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonStr.c_str());
                    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

                    // API 요청 실행
                    CURLcode res = curl_easy_perform(curl);
                    if (res == CURLE_OK) {
                        cout << "\033[1;36m [DB 성공] 데이터 저장 완료\033[0m\n" << endl;
                    }
                    else {
                        cerr << "\033[1;31m [DB 에러] Supabase 전송 실패\033[0m" << endl;
                    }

                    // 자원 해제
                    curl_slist_free_all(headers);
                    curl_easy_cleanup(curl);
                }
            }
        }
        // 대기
        usleep(500000);
    }
    // 프로그램 종료 전 시리얼 표트 닫기
    close(serial_fd);
    return 0;
}
