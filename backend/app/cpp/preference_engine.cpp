#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <cstdlib>

using namespace std;

struct Item {

    string name;

    int click;
};

int main(
    int argc,
    char* argv[]
) {

    if(argc < 4) {

        return 1;
    }

    int graphClick =
        atoi(argv[1]);

    int reportClick =
        atoi(argv[2]);

    int tableClick =
        atoi(argv[3]);

    vector<Item> items = {

        {"GRAPH", graphClick},

        {"REPORT", reportClick},

        {"TABLE", tableClick}
    };

    sort(

        items.begin(),

        items.end(),

        [](const Item& a,
           const Item& b) {

            return a.click > b.click;
        }
    );

    cout

        << items[0].name << ","

        << items[1].name << ","

        << items[2].name;

    return 0;
}