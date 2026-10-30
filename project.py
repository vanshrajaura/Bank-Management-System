# =================== Import Required Modules ===================
import json
import random
import string
from pathlib import Path
from datetime import datetime

# =================== Bank Class ===================
class Bank:
    # Database file name aur data storage
    database = 'data.json'
    data = []

    # ----------------- Load Data from JSON -----------------
    try:
        if Path(database).exists():
            with open(database) as fs:
                data = json.load(fs)
        else:
            data = []
    except Exception as err:
        print(f"Error loading database: {err}")
        data = []

    # ----------------- Update Database -----------------
    @classmethod
    def __update(cls):
        with open(Bank.database, 'w') as fs:
            json.dump(Bank.data, fs, indent=4)

    # ----------------- Account Number Generator -----------------
    @classmethod
    def __accountgenrater(cls):
        while True:
            alpha = random.choices(string.ascii_uppercase, k=3)
            num = random.choices(string.digits, k=3)
            spchar = random.choices("@#$&*!", k=1)
            acc = alpha + num + spchar
            random.shuffle(acc)
            acc_num = "".join(acc)

            # check unique
            if all(u["account"] != acc_num for u in Bank.data):
                return acc_num

    # ----------------- Add Transaction Record -----------------
    @staticmethod
    def __add_transaction(user, t_type, amount):
        user['transactions'].append({
            "type": t_type,
            "amount": amount,
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

    # ----------------- Create Account -----------------
    def create_account(self):
        try:
            name = input("Enter Name: ")
            age = int(input("Enter Age: "))
            email = input("Enter Email: ")
            pin = input("Set 4-digit PIN: ")

            if age < 18 or not (pin.isdigit() and len(pin) == 4):
                print("❌ Account creation failed (Age must be 18+ & PIN must be 4 digits)")
                return

            info = {
                "name": name,
                "age": age,
                "E-mail": email,
                "Pin": int(pin),
                "account": Bank.__accountgenrater(),
                "balance": 0,
                "transactions": [],
                "loan": {"amount": 0, "emi": 0}
            }

            Bank.data.append(info)
            Bank.__update()
            print("\n✅ Account created successfully!")
            print("Your Account Number:", info["account"])
        except Exception as e:
            print("❌ Error:", e)

    # ----------------- Login Method -----------------
    def __login(self):
        acc = input("Enter Account No: ")
        pin = input("Enter PIN: ")
        if not pin.isdigit():
            print("❌ Invalid PIN format")
            return None
        pin = int(pin)

        for user in Bank.data:
            if user["account"] == acc and user["Pin"] == pin:
                return user
        print("❌ Invalid Account No or PIN")
        return None

    # ----------------- Deposit Money -----------------
    def deposit(self):
        user = self.__login()
        if not user: return
        try:
            amount = int(input("Enter amount to deposit: "))
            if amount <= 0:
                print("❌ Invalid amount")
                return
            user["balance"] += amount
            Bank.__add_transaction(user, "Deposit", amount)
            Bank.__update()
            print(f"✅ {amount} deposited successfully! New Balance: {user['balance']}")
        except:
            print("❌ Invalid input")

    # ----------------- Withdraw Money -----------------
    def withdraw(self):
        user = self.__login()
        if not user: return
        try:
            amount = int(input("Enter amount to withdraw: "))
            if amount <= 0 or amount > user["balance"]:
                print("❌ Insufficient Balance or Invalid amount")
                return
            user["balance"] -= amount
            Bank.__add_transaction(user, "Withdraw", amount)
            Bank.__update()
            print(f"✅ {amount} withdrawn successfully! New Balance: {user['balance']}")
        except:
            print("❌ Invalid input")

    # ----------------- Balance Enquiry -----------------
    def balance_enquiry(self):
        user = self.__login()
        if not user: return
        print(f"💰 Your Current Balance is: {user['balance']}")

    # ----------------- Show Account Details -----------------
    def show_details(self):
        user = self.__login()
        if not user: return
        print("\n📑 Account Details:")
        for k, v in user.items():
            if k != "transactions":
                print(f"{k}: {v}")

    # ----------------- Show Transaction History -----------------
    def show_transactions(self):
        user = self.__login()
        if not user: return
        print("\n📊 Transaction History:")
        for t in user["transactions"]:
            print(f"{t['time']} | {t['type']} | Amount: {t['amount']}")

    # ----------------- Change PIN -----------------
    def change_pin(self):
        user = self.__login()
        if not user: return
        new_pin = input("Enter new 4-digit PIN: ")
        if len(new_pin) == 4 and new_pin.isdigit():
            user["Pin"] = int(new_pin)
            Bank.__update()
            print("✅ PIN changed successfully!")
        else:
            print("❌ Invalid PIN format")

    # ----------------- Delete Account -----------------
    def delete_account(self):
        user = self.__login()
        if not user: return
        Bank.data.remove(user)
        Bank.__update()
        print("✅ Account deleted successfully")

    # ----------------- Money Transfer -----------------
    def transfer(self):
        sender = self.__login()
        if not sender: return
        receiver_acc = input("Enter Receiver Account No: ")
        receiver = next((u for u in Bank.data if u["account"] == receiver_acc), None)
        if not receiver:
            print("❌ Receiver account not found")
            return
        try:
            amount = int(input("Enter amount to transfer: "))
            if amount <= 0 or amount > sender["balance"]:
                print("❌ Invalid or insufficient balance")
                return
            sender["balance"] -= amount
            receiver["balance"] += amount
            Bank.__add_transaction(sender, f"Transfer to {receiver['name']}", amount)
            Bank.__add_transaction(receiver, f"Transfer from {sender['name']}", amount)
            Bank.__update()
            print(f"✅ {amount} transferred to {receiver['name']} successfully!")
        except:
            print("❌ Invalid input")

    # ----------------- Loan Apply -----------------
    def loan_apply(self):
        user = self.__login()
        if not user: return
        try:
            amount = int(input("Enter Loan Amount: "))
            months = int(input("Enter tenure in months: "))
            if amount <= 0 or months <= 0:
                print("❌ Invalid Loan request")
                return
            emi = round(amount / months, 2)
            user["loan"]["amount"] = amount
            user["loan"]["emi"] = emi
            user["balance"] += amount
            Bank.__add_transaction(user, "Loan credited", amount)
            Bank.__update()
            print(f"✅ Loan Approved! EMI per month: {emi}")
        except:
            print("❌ Invalid input")

    # ----------------- Pay EMI -----------------
    def pay_emi(self):
        user = self.__login()
        if not user: return
        if user["loan"]["amount"] <= 0:
            print("❌ No active loan")
            return
        emi = user["loan"]["emi"]
        if user["balance"] < emi:
            print("❌ Insufficient balance to pay EMI")
            return
        user["balance"] -= emi
        user["loan"]["amount"] -= emi
        Bank.__add_transaction(user, "EMI Payment", emi)
        if user["loan"]["amount"] <= 0:
            user["loan"]["amount"] = 0
            user["loan"]["emi"] = 0
            print("✅ Loan fully repaid!")
        else:
            print(f"✅ EMI of {emi} paid! Remaining Loan: {user['loan']['amount']}")
        Bank.__update()

    # ----------------- Admin Panel -----------------
    def admin_panel(self):
        username = input("Enter Admin Username: ")
        password = input("Enter Admin Password: ")
        if username == "admin" and password == "1234":
            print("\n=== ADMIN PANEL ===")
            for u in Bank.data:
                print(f"Name: {u['name']}, Acc: {u['account']}, Balance: {u['balance']}, Loan: {u['loan']}")
        else:
            print("❌ Invalid admin credentials")


# =================== Main Program ===================
user = Bank()

while True:
    print("\n==== BANK MANAGEMENT MENU ====")
    print("1. Create Account")
    print("2. Deposit Money")
    print("3. Withdraw Money")
    print("4. Balance Enquiry")
    print("5. Show Account Details")
    print("6. Show Transaction History")
    print("7. Change PIN")
    print("8. Delete Account")
    print("9. Transfer Money")
    print("10. Apply Loan")
    print("11. Pay EMI")
    print("12. Admin Panel")
    print("13. Exit")

    choice = input("Enter your choice: ")

    if choice == "1": user.create_account()
    elif choice == "2": user.deposit()
    elif choice == "3": user.withdraw()
    elif choice == "4": user.balance_enquiry()
    elif choice == "5": user.show_details()
    elif choice == "6": user.show_transactions()
    elif choice == "7": user.change_pin()
    elif choice == "8": user.delete_account()
    elif choice == "9": user.transfer()
    elif choice == "10": user.loan_apply()
    elif choice == "11": user.pay_emi()
    elif choice == "12": user.admin_panel()
    elif choice == "13":
        print("👋 Thank you for using our Bank System")
        break
    else:
        print("❌ Invalid choice")
