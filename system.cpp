// ============================================================
//  SUPER MARKET BILLING SYSTEM
//  OOP Concepts Covered:
//    1. Class and Object
//    2. Constructor
//    3. Inheritance
//    4. Polymorphism (Runtime - virtual functions)
//    5. Encapsulation (private data + public functions)
//    6. File Handling (DBMS concept - CRUD operations)
// ============================================================

#include<iostream.h>
#include<fstream.h>
#include<conio.h>
#include<stdio.h>
#include<process.h>

// ============================================================
//  CONCEPT 1: CLASS AND OBJECT
//  A class is a blueprint. An object is created from that class.
//  Here 'Product' is the class. 'pr' (used in functions) is the object.
// ============================================================

class Product
{
    // --------------------------------------------------------
    //  CONCEPT 2: ENCAPSULATION
    //  Data members are private — cannot be accessed directly
    //  from outside the class. Only public functions can access them.
    // --------------------------------------------------------
    private:
        int   pno;        // Product Number
        char  name[50];   // Product Name
        float price;      // Price
        float dis;        // Discount

    public:

        // ----------------------------------------------------
        //  CONCEPT 3: CONSTRUCTOR
        //  Automatically called when an object is created.
        //  Used to initialise data members with default values.
        // ----------------------------------------------------
        Product()
        {
            pno   = 0;
            price = 0;
            dis   = 0;
            name[0] = '\0';
        }

        // Member function - take input from user
        void create_product()
        {
            cout << "\nEnter Product No  : ";
            cin  >> pno;

            cout << "Enter Product Name: ";
            cin.ignore();
            gets(name);

            cout << "Enter Price       : ";
            cin  >> price;

            cout << "Enter Discount (%) : ";
            cin  >> dis;
        }

        // --------------------------------------------------------
        //  CONCEPT 4: POLYMORPHISM (Part 1 - Virtual Function)
        //  'virtual' keyword allows derived class to override this.
        //  When called using a base class pointer, the correct
        //  version is picked at RUNTIME (Runtime Polymorphism).
        // --------------------------------------------------------
        virtual void show_product()
        {
            cout << "\nProduct No   : " << pno;
            cout << "\nProduct Name : " << name;
            cout << "\nPrice        : " << price;
            cout << "\nDiscount     : " << dis << " %";
            cout << "\n--------------------------";
        }

        // Getter functions (Encapsulation - controlled access)
        int   retpno()   { return pno;   }
        float retprice() { return price; }
        char* retname()  { return name;  }
        float retdis()   { return dis;   }
};

// ============================================================
//  CONCEPT 5: INHERITANCE
//  SpecialProduct INHERITS from Product.
//  It gets all data and functions of Product automatically.
//  "is-a" relationship: SpecialProduct IS-A Product.
// ============================================================

class SpecialProduct : public Product
{
    private:
        float extra_dis;   // Extra discount (only in this derived class)

    public:

        // Constructor of derived class
        SpecialProduct()
        {
            extra_dis = 0;
        }

        void set_extra_dis(float e)
        {
            extra_dis = e;
        }

        // --------------------------------------------------------
        //  CONCEPT 4: POLYMORPHISM (Part 2 - Override)
        //  This overrides show_product() from the base class.
        //  If called via base class pointer → this version runs.
        //  That is RUNTIME POLYMORPHISM (decided at run time).
        // --------------------------------------------------------
        virtual void show_product()
        {
            // Call base class version first
            Product::show_product();

            // Then add extra info
            cout << "\nExtra Discount : " << extra_dis << " % (Special!)";
            cout << "\n--------------------------";
        }
};

// ============================================================
//  FILE HANDLING (DBMS Concept)
//  Shop.dat is our database file. We perform:
//    CREATE  → write new record
//    READ    → display all / search
//    UPDATE  → modify a record
//    DELETE  → delete a record
// ============================================================

fstream fp;       // File object (global)
Product pr;       // Object of Product class (global)

// ---- CREATE: Write a new product to file ----
void write_product()
{
    clrscr();
    fp.open("Shop.dat", ios::out | ios::app | ios::binary);

    pr.create_product();
    fp.write((char*)&pr, sizeof(Product));

    fp.close();
    cout << "\nProduct Added Successfully!";
    getch();
}

// ---- READ ALL: Show every product from file ----
void display_all()
{
    clrscr();
    cout << "\n===== ALL PRODUCTS =====\n";

    fp.open("Shop.dat", ios::in | ios::binary);

    while(fp.read((char*)&pr, sizeof(Product)))
    {
        pr.show_product();   // Virtual call - runtime polymorphism
        getch();
    }

    fp.close();
    getch();
}

// ---- READ ONE: Search product by number ----
void display_sp(int n)
{
    int flag = 0;

    fp.open("Shop.dat", ios::in | ios::binary);

    while(fp.read((char*)&pr, sizeof(Product)))
    {
        if(pr.retpno() == n)
        {
            clrscr();
            pr.show_product();
            flag = 1;
        }
    }

    fp.close();

    if(flag == 0)
        cout << "\nProduct Not Found!";

    getch();
}

// ---- UPDATE: Modify an existing product ----
void modify_product()
{
    int no, found = 0;

    clrscr();
    cout << "\nEnter Product No to Modify: ";
    cin  >> no;

    fp.open("Shop.dat", ios::in | ios::out | ios::binary);

    while(fp.read((char*)&pr, sizeof(Product)) && found == 0)
    {
        if(pr.retpno() == no)
        {
            pr.show_product();

            cout << "\nEnter New Details:\n";
            pr.create_product();

            // Move file pointer back one record and overwrite
            int pos = -1 * sizeof(pr);
            fp.seekp(pos, ios::cur);

            fp.write((char*)&pr, sizeof(Product));
            found = 1;

            cout << "\nRecord Updated!";
        }
    }

    fp.close();

    if(found == 0)
        cout << "\nProduct Not Found!";

    getch();
}

// ---- DELETE: Remove a product from file ----
void delete_product()
{
    int no;

    clrscr();
    cout << "\nEnter Product No to Delete: ";
    cin  >> no;

    fp.open("Shop.dat", ios::in | ios::binary);

    fstream fp2;
    fp2.open("Temp.dat", ios::out | ios::binary);

    while(fp.read((char*)&pr, sizeof(Product)))
    {
        if(pr.retpno() != no)
            fp2.write((char*)&pr, sizeof(Product));
    }

    fp.close();
    fp2.close();

    remove("Shop.dat");
    rename("Temp.dat","Shop.dat");

    cout << "\nProduct Deleted!";
    getch();
}

// ---- Show product list (used before placing order) ----
void menu()
{
    clrscr();

    fp.open("Shop.dat", ios::in | ios::binary);

    if(!fp)
    {
        cout << "\nDatabase Not Found!";
        getch();
        exit(0);
    }

    cout << "\nPNO\tNAME\t\tPRICE\n";
    cout << "--------------------------------\n";

    while(fp.read((char*)&pr, sizeof(Product)))
    {
        cout << pr.retpno()   << "\t"
             << pr.retname()  << "\t"
             << pr.retprice() << "\n";
    }

    fp.close();
}

// ---- Place Order and calculate bill ----
void place_order()
{
    int   order_arr[50], quan[50], c = 0;
    float amt, damt, total = 0;
    char  ch = 'Y';

    menu();

    do
    {
        cout << "\nEnter Product No : ";
        cin  >> order_arr[c];

        cout << "Enter Quantity   : ";
        cin  >> quan[c];

        c++;

        cout << "\nAdd More? (Y/N)  : ";
        cin  >> ch;

    } while(ch == 'Y' || ch == 'y');

    // Calculate total bill
    cout << "\n========== INVOICE ==========";

    for(int x = 0; x < c; x++)
    {
        fp.open("Shop.dat", ios::in | ios::binary);

        while(fp.read((char*)&pr, sizeof(Product)))
        {
            if(pr.retpno() == order_arr[x])
            {
                amt  = pr.retprice() * quan[x];
                damt = amt - (amt * pr.retdis() / 100);
                total += damt;

                cout << "\n" << pr.retname()
                     << " x " << quan[x]
                     << " = Rs." << damt;
            }
        }

        fp.close();
    }

    cout << "\n------------------------------";
    cout << "\nTOTAL = Rs." << total;
    cout << "\n==============================";
    getch();
}

// ---- Intro Screen ----
void intro()
{
    clrscr();
    cout << "\n==============================";
    cout << "\n  SUPER MARKET BILLING SYSTEM";
    cout << "\n==============================";
    cout << "\n\nOOP Concepts Used:";
    cout << "\n 1. Class and Object";
    cout << "\n 2. Constructor";
    cout << "\n 3. Encapsulation";
    cout << "\n 4. Inheritance";
    cout << "\n 5. Polymorphism (virtual)";
    cout << "\n 6. File Handling (DBMS)";
    getch();
}

// ---- Admin Menu ----
void admin_menu()
{
    char ch2;

    clrscr();
    cout << "\n===== ADMIN MENU =====";
    cout << "\n1. Add Product";
    cout << "\n2. Display All";
    cout << "\n3. Search Product";
    cout << "\n4. Modify Product";
    cout << "\n5. Delete Product";
    cout << "\n6. Back";
    cout << "\n\nChoice: ";
    ch2 = getche();

    switch(ch2)
    {
        case '1': write_product();  break;
        case '2': display_all();    break;
        case '3':
            int num;
            cout << "\nEnter Product No: ";
            cin  >> num;
            display_sp(num);
            break;
        case '4': modify_product(); break;
        case '5': delete_product(); break;
    }
}

// ============================================================
//  POLYMORPHISM DEMO FUNCTION
//  Shows how the same base class pointer calls different
//  show_product() depending on the actual object type.
//  This decision happens at RUNTIME using virtual functions.
// ============================================================
void polymorphism_demo()
{
    clrscr();
    cout << "\n=== POLYMORPHISM DEMO ===\n";

    // Base class pointer
    Product* ptr;

    // Object 1: Regular Product
    Product p1;
    // Manually set values for demo
    // (in real use, create_product() fills these)

    // Object 2: Special Product (derived class object)
    SpecialProduct sp1;
    sp1.set_extra_dis(10);

    // Same pointer, different objects
    // → different show_product() is called each time (Runtime Polymorphism)
    ptr = &p1;
    cout << "\nCalling via base pointer (Product object):";
    ptr->show_product();    // Calls Product::show_product()

    ptr = &sp1;
    cout << "\n\nCalling via base pointer (SpecialProduct object):";
    ptr->show_product();    // Calls SpecialProduct::show_product()

    cout << "\n\nSame pointer 'ptr' → different output = Runtime Polymorphism!";
    getch();
}

// ============================================================
//  MAIN FUNCTION
// ============================================================
void main()
{
    char ch;

    intro();

    polymorphism_demo();   // Show polymorphism before main menu

    do
    {
        clrscr();
        cout << "\n===== MAIN MENU =====";
        cout << "\n1. Customer";
        cout << "\n2. Admin";
        cout << "\n3. Exit";
        cout << "\n\nChoice: ";
        ch = getche();

        switch(ch)
        {
            case '1': place_order(); break;
            case '2': admin_menu();  break;
            case '3': exit(0);
        }

    } while(ch != '3');
}

// ============================================================
//  OOP CONCEPTS SUMMARY
// ============================================================
//
//  1. CLASS & OBJECT
//     'Product' is the class (blueprint).
//     'pr', 'p1', 'sp1' are objects (real instances).
//
//  2. CONSTRUCTOR
//     Product() and SpecialProduct() run automatically
//     when objects are created. Sets default values.
//
//  3. ENCAPSULATION
//     pno, name, price, dis are private.
//     Accessed only via public getter functions like retpno().
//
//  4. INHERITANCE
//     SpecialProduct inherits from Product using ': public Product'.
//     Gets all members of Product + adds extra_dis of its own.
//
//  5. POLYMORPHISM (Runtime)
//     show_product() is 'virtual' in base class.
//     SpecialProduct overrides it.
//     When called via Product* pointer at runtime,
//     the correct version is picked automatically (vtable).
//
//  6. FILE HANDLING (DBMS)
//     Shop.dat stores all product records as binary data.
//     Create → write_product()
//     Read   → display_all() / display_sp()
//     Update → modify_product()
//     Delete → delete_product()
//
// ============================================================