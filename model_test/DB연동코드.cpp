// 하드웨어 제어 및 클라우드 데이터베이스(Supabase) 실시간 연동을 위한 코드
  
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

const string SUPABASE_URL = "https://heygnkqtjrpvumjenozr.supabase.co";
const string SUPABASE_KEY = "sb_publishable_Ruo628BB_Ysc32ts7b250g_T0GkNoZR";


// 데이터 보관용 구조체 정의
struct SensorData {
    float temperature1;
    float temperature2;
    float humidity;
    float co2_level;
    bool isValid; // 데이터가 정상 변환되었는지 체크
};

// 사진 촬영 및 스토리지 업로드
string captureAndUpload() {
    VideoCapture cap(0);
    if (!cap.isOpened()) {
        cerr << "\033[1;31m [카메라 에러] 카메라를 열 수 없습니다.\033[0m" << endl;
        return "";
    }

    Mat frame;
    for(int i=0; i<5; i++) cap >> frame; 

    if (frame.empty()) {
        cap.release();
        return "";
    }
    cap.release();

    // 임시 파일 생성 및 로컬에 저장
    string tempFileName = "cam_check.jpg";
    imwrite(tempFileName, frame);
    
    // 파일 크기가 0이거나 에러 발생 시 빈 문자열을 반환하여 쓰레기값 업로드 방지
    ifstream in(tempFileName, ios::binary | ios::ate);
    long fileSize = in.tellg();
    if (fileSize <= 0) {
        remove(tempFileName.c_str());
        return "";
    }


    time_t now = time(0);
    tm *ltm = localtime(&now);

    int month = ltm->tm_mon + 1; 
    int day = ltm->tm_mday;
    int hour = ltm->tm_hour;     

    // 파일명 규격화 (ex: openfarm1_5.30.14.jpg)
    string deviceName = "openfarm1"; 
    string realFileName = deviceName + "_" + to_string(month) + "." + to_string(day) + "." + to_string(hour) + ".jpg";
    rename(tempFileName.c_str(), realFileName.c_str());

    string publicUrl = "";
    CURL* curl = curl_easy_init();
    // 인터넷 통신 라이브러리 libcurl을 사용해 찍은 사진을 Supabase에 업로드
    if (curl) {
        string uploadUrl = SUPABASE_URL + "/storage/v1/object/plant_images/" + realFileName;
        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, ("Authorization: Bearer " + SUPABASE_KEY).c_str());
        headers = curl_slist_append(headers, ("apikey: " + SUPABASE_KEY).c_str());
        headers = curl_slist_append(headers, "Content-Type: image/jpeg");

        FILE* fd = fopen(realFileName.c_str(), "rb");
        
        // Supabase 호환성을 위해 POST 방식으로 업로드 명령 강제
        curl_easy_setopt(curl, CURLOPT_URL, uploadUrl.c_str());
        curl_easy_setopt(curl, CURLOPT_UPLOAD, 1L);
        curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");
        curl_easy_setopt(curl, CURLOPT_READDATA, fd);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        CURLcode res = curl_easy_perform(curl);
        fclose(fd);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        // 업로드 성공 시 저장했던 로컬 파일 삭제
        if (res == CURLE_OK) {
            publicUrl = SUPABASE_URL + "/storage/v1/object/public/plant_images/" + realFileName;
            remove(realFileName.c_str());
        }
    }
    return publicUrl;
}


// 센서 데이터 분류 및 정리
SensorData parseSensorData(const string& data_str) {
    SensorData result = {0, 0, 0, 0, false};
    stringstream ss(data_str);
    string t1, t2, hum, co2;

    // 한 줄로 들어온 데이터를 콤마(,) 기준으로 분리
    if (getline(ss, t1, ',') && getline(ss, t2, ',') &&
        getline(ss, hum, ',') && getline(ss, co2)) {
        try {
            // stof 오류 시 프로그램 종료를 막기 위한 try-catch
            result.temperature1 = stof(t1);
            result.temperature2 = stof(t2);
            result.humidity = stof(hum);
            result.co2_level = stof(co2);
            result.isValid = true; // 분류 성공
        } catch (...) {
            cerr << "\033[1;33m [경고] 데이터 변환 오류 (통신 노이즈 발생)\033[0m" << endl;
        }
    }
    return result;
}

// 클라우드 DB 데이터 전송
void uploadToDatabase(const SensorData& data, const string& imageUrl) {
    CURL* curl = curl_easy_init();
    if (curl) {
        string dbUrl = SUPABASE_URL + "/rest/v1/sensor_logs";
        
        // nlohmann/json 라이브러리를 사용해
        // Supabase 테이블 구조에 맞는 JSON 객체로 변환
        json payload = {
            {"device_id", "1"},
            {"temperature", data.temperature1},
            {"temperature2", data.temperature2},
            {"humidity", data.humidity},
            {"co2_level", data.co2_level},
            {"image_url", imageUrl.empty() ? nullptr : imageUrl}
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
        if(res == CURLE_OK) {
            cout << "\033[1;36m [DB 성공] 데이터 저장 완료\033[0m\n" << endl;
        }
        
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
}


int main() {
    // 라즈베리파이와 아두이노 간 시리얼 통신 설정
    int serial_fd = open("/dev/ttyAMA0", O_RDWR | O_NOCTTY);
    if (serial_fd == -1) {
        perror("\033[1;31m [시리얼 에러] 포트를 열 수 없습니다.\033[0m");
        return -1;
    }

    struct termios options;
    tcgetattr(serial_fd, &options);
    cfsetispeed(&options, B9600);
    cfsetospeed(&options, B9600);
    options.c_lflag |= ICANON;
    tcsetattr(serial_fd, TCSANOW, &options);

    cout << "\n 시스템 가동 중... (데이터 수신 대기)" << endl;

    char buf[128];
    
    // 정해진 주기마다 데이터를 전송하기 위한 상태 변수
    time_t last_upload_time = 0; 

    while (true) {
        int n = read(serial_fd, buf, sizeof(buf) - 1);
        
        if (n > 0) {
            buf[n] = '\0';
            SensorData sensorData = parseSensorData(string(buf));
            
            if (sensorData.isValid) {
                
                time_t current_time = time(0);
                
                // 이전 업로드 시점으로부터 3600초(1시간) 경과 여부 검사
                if (current_time - last_upload_time >= 3600) {
                    
                    cout << "\n [알림] 1시간 경과! 최신 데이터를 측정 및 업로드합니다." << endl;
                    cout << " 온도1: " << sensorData.temperature1 << "°C | 온도2: " << sensorData.temperature2
                         << "°C | 습도: " << sensorData.humidity << "% | CO2: " << sensorData.co2_level << "ppm" << endl;

                    // 카메라 촬영 및 스토리지 업로드
                    string imageUrl = captureAndUpload();
                    if(!imageUrl.empty()) cout << " [성공] 사진 업로드 완료" << endl;

                    // 파싱된 데이터와 이미지 URL을 DB에 저장
                    uploadToDatabase(sensorData, imageUrl);
                    
                    // 데이터 전송 완료 후 기준 타임스탬프 갱신
                    last_upload_time = current_time;
                }
            }
        }
        usleep(100000); 
    }
    close(serial_fd);
    return 0;
}
