// ================= HEADER FILES =================
// (C++ Libraries / Preprocessor Directives)
#include<iostream.h>   // Input-Output Stream
#include<conio.h>      // Console functions (getch, clrscr)
#include<stdio.h>      // C standard I/O
#include<process.h>    // exit()
#include<fstream.h>    // File Handling

// ================= CLASS DEFINITION =================
// (OOP Concept: Class & Data Members)
class product
{
    int pno;              // Product number (Data Member)
    char name[50];        // Product name (Array)
    float price;          // Price (Primitive Data Type)
    float qty, tax, dis;  // Quantity, Tax, Discount

public:

    // ================= MEMBER FUNCTION =================
    // (Function + Input using cin)
    void create_product()
    {
        cout << "\nEnter Product No: ";
        cin >> pno;

        cout << "\nEnter Product Name: ";
        gets(name);   // (String Handling)

        cout << "\nEnter Price: ";
        cin >> price;

        cout << "\nEnter Discount (%): ";
        cin >> dis;
    }

    // ================= DISPLAY FUNCTION =================
    // (Output using cout)
    void show_product()
    {
        cout << "\nProduct No: " << pno;

        cout << "\nProduct Name: ";
        puts(name);   // (String Output)

        cout << "\nPrice: " << price;
        cout << "\nDiscount: " << dis;
    }

    // ================= GETTER FUNCTIONS =================
    // (Encapsulation concept)
    int retpno() { return pno; }
    float retprice() { return price; }
    char* retname() { return name; }
    int retdis() { return dis; }
};

// ================= GLOBAL VARIABLES =================
// (Global Scope Variables)
fstream fp;   // File object (File Handling)
product pr;   // Object of class

// ================= CREATE PRODUCT =================
// (File Handling: Write Operation)
void write_product()
{
    fp.open("Shop.dat", ios::out | ios::app); // Open file in append mode

    pr.create_product(); // Function Call (OOP)
    fp.write((char*)&pr, sizeof(product)); // Binary file write

    fp.close();

    cout << "\nProduct Created Successfully";
    getch();
}

// ================= DISPLAY ALL PRODUCTS =================
// (Loop + File Handling: Read Operation)
void display_all()
{
    clrscr(); // Screen clear (Console Function)

    cout << "\nDISPLAY ALL RECORDS\n";

    fp.open("Shop.dat", ios::in);

    while (fp.read((char*)&pr, sizeof(product))) // Loop
    {
        pr.show_product();
        cout << "\n--------------------------\n";
        getch();
    }

    fp.close();
    getch();
}

// ================= SEARCH PRODUCT =================
// (Conditional Statement + Loop)
void display_sp(int n)
{
    int flag = 0;

    fp.open("Shop.dat", ios::in);

    while (fp.read((char*)&pr, sizeof(product)))
    {
        if (pr.retpno() == n) // Decision Making (if)
        {
            clrscr();
            pr.show_product();
            flag = 1;
        }
    }

    fp.close();

    if (flag == 0)
        cout << "\nRecord Not Found";

    getch();
}

// ================= MODIFY PRODUCT =================
// (File Pointer Manipulation)
void modify_product()
{
    int no, found = 0;

    clrscr();
    cout << "\nEnter Product No to Modify: ";
    cin >> no;

    fp.open("Shop.dat", ios::in | ios::out);

    while (fp.read((char*)&pr, sizeof(product)) && found == 0)
    {
        if (pr.retpno() == no)
        {
            pr.show_product();

            cout << "\nEnter New Details\n";
            pr.create_product();

            int pos = -1 * sizeof(pr);
            fp.seekp(pos, ios::cur); // File pointer reposition

            fp.write((char*)&pr, sizeof(product));

            cout << "\nRecord Updated";
            found = 1;
        }
    }

    fp.close();

    if (found == 0)
        cout << "\nRecord Not Found";

    getch();
}

// ================= DELETE PRODUCT =================
// (File Handling + Temporary File Technique)
void delete_product()
{
    int no;

    clrscr();
    cout << "\nEnter Product No to Delete: ";
    cin >> no;

    fp.open("Shop.dat", ios::in | ios::out);

    fstream fp2;
    fp2.open("Temp.dat", ios::out);

    fp.seekg(0, ios::beg);

    while (fp.read((char*)&pr, sizeof(product)))
    {
        if (pr.retpno() != no)
        {
            fp2.write((char*)&pr, sizeof(product));
        }
    }

    fp2.close();
    fp.close();

    remove("Shop.dat");           // File delete
    rename("Temp.dat", "Shop.dat"); // Rename file

    cout << "\nRecord Deleted";
    getch();
}

// ================= MENU DISPLAY =================
// (Loop + File Reading)
void menu()
{
    clrscr();

    fp.open("Shop.dat", ios::in);

    if (!fp) // Error Handling
    {
        cout << "File Not Found";
        getch();
        exit(0);
    }

    cout << "\nP.NO\tNAME\tPRICE\n";

    while (fp.read((char*)&pr, sizeof(product)))
    {
        cout << pr.retpno() << "\t" << pr.retname()
             << "\t" << pr.retprice() << endl;
    }

    fp.close();
}

// ================= PLACE ORDER =================
// (Arrays + Loop + Arithmetic Operations)
void place_order()
{
    int order_arr[50], quan[50], c = 0; // Arrays
    float amt, damt, total = 0;
    char ch = 'Y';

    menu();

    do
    {
        cout << "\nEnter Product No: ";
        cin >> order_arr[c];

        cout << "Enter Quantity: ";
        cin >> quan[c];

        c++;

        cout << "\nAdd More? (y/n): ";
        cin >> ch;

    } while (ch == 'y' || ch == 'Y'); // Loop

    // Invoice Calculation
    for (int x = 0; x <= c; x++)
    {
        fp.open("Shop.dat", ios::in);

        while (fp.read((char*)&pr, sizeof(product)))
        {
            if (pr.retpno() == order_arr[x])
            {
                amt = pr.retprice() * quan[x]; // Arithmetic
                damt = amt - (amt * pr.retdis() / 100);

                total += damt;
            }
        }

        fp.close();
    }

    cout << "\nTOTAL = " << total;
    getch();
}

// ================= INTRO =================
// (Basic Output)
void intro()
{
    clrscr();

    cout << "SUPER MARKET BILLING SYSTEM\n";
    cout << "MINI PROJECT\n";

    getch();
}

// ================= ADMIN MENU =================
// (Switch Case - Control Statement)
void admin_menu()
{
    char ch2;

    cout << "\n1. Create\n2. Display\n3. Search\n4. Modify\n5. Delete\n6. Menu\n7. Exit";
    ch2 = getche();

    switch (ch2)
    {
        case '1': write_product(); break;
        case '2': display_all(); break;
        case '3':
            int num;
            cin >> num;
            display_sp(num);
            break;
        case '4': modify_product(); break;
        case '5': delete_product(); break;
        case '6': menu(); break;
    }
}

// ================= MAIN FUNCTION =================
// (Program Execution Starts Here)
void main()
{
    char ch;

    intro();

    do
    {
        cout << "\n1.Customer\n2.Admin\n3.Exit";
        ch = getche();

        switch (ch)
        {
            case '1': place_order(); break;
            case '2': admin_menu(); break;
            case '3': exit(0);
        }

    } while (ch != '3');
}