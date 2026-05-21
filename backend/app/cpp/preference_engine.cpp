#include <iostream>
#include <string>
#include <cstdlib>

using namespace std;

class UserPreference {

public:

    string recommendUI(
        int graphClick,
        int reportClick,
        int tableClick
    ) {

        if(
            graphClick >= reportClick &&
            graphClick >= tableClick
        ) {

            return "GRAPH";
        }

        if(
            reportClick >= graphClick &&
            reportClick >= tableClick
        ) {

            return "REPORT";
        }

        return "TABLE";
    }
};

int main(int argc, char* argv[]) {

    if(argc < 4) {

        return 1;
    }

    int graphClick = atoi(argv[1]);

    int reportClick = atoi(argv[2]);

    int tableClick = atoi(argv[3]);

    UserPreference user;

    cout << user.recommendUI(
        graphClick,
        reportClick,
        tableClick
    );

    return 0;
}