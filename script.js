class Bank {
  constructor() {
    this.baseUrl = "http://localhost:3000";
  }

  async loadData() {
    try {
      const response = await fetch(`${this.baseUrl}/data`);
      return await response.json();
    } catch (err) {
      console.error("Error loading data:", err);
      return [];
    }
  }

  async updateData(data) {
    try {
      await fetch(`${this.baseUrl}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error("Error updating data:", err);
    }
  }

  accountGenerator() {
    while (true) {
      const accNum = Math.floor(10000000 + Math.random() * 90000000).toString();
      return accNum;
    }
  }

  async addTransaction(user, type, amount) {
    user.transactions.push({
      type: type,
      amount: amount,
      time: new Date().toISOString().slice(0, 19).replace("T", " "),
    });
    const data = await this.loadData();
    const index = data.findIndex((u) => u.account === user.account);
    if (index !== -1) {
      data[index] = user;
      await this.updateData(data);
    }
  }

  async login(acc, pin) {
    const data = await this.loadData();
    pin = parseInt(pin);
    return data.find((u) => u.account === acc && u.Pin === pin) || null;
  }
}

const bank = new Bank();

const services = [
  { name: "Create Account", id: "createAccountModal" },
  { name: "Deposit Money", id: "depositModal" },
  { name: "Withdraw Money", id: "withdrawModal" },
  { name: "Balance Enquiry", id: "balanceModal" },
  { name: "Show Account Details", id: "detailsModal" },
  { name: "Show Transaction History", id: "transactionsModal" },
  { name: "Change PIN", id: "changePinModal" },
  { name: "Delete Account", id: "deleteAccountModal" },
  { name: "Transfer Money", id: "transferModal" },
  { name: "Apply Loan", id: "loanApplyModal" },
  { name: "Pay EMI", id: "payEmiModal" },
  { name: "Admin Panel", id: "adminPanelModal" },
];

// Voice variables
let voiceEnabled = false;
const synth = window.speechSynthesis;
let recognition;
if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
}

// Sound effect for transactions
const transactionSound = document.getElementById("transactionSound");

function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  document.getElementById("voiceToggle").innerText = `Voice: ${
    voiceEnabled ? "On" : "Off"
  }`;
  if (
    voiceEnabled &&
    document.getElementById("menu").style.display === "flex"
  ) {
    askForOption();
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("light-mode");
  const isLightMode = document.body.classList.contains("light-mode");
  document.getElementById("darkModeToggle").innerText = isLightMode
    ? "Dark Mode"
    : "Light Mode";
  if (voiceEnabled) {
    speak(`Switched to ${isLightMode ? "light" : "dark"} mode`);
  }
}

function speak(text) {
  if (voiceEnabled && synth) {
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
  }
}

function speakField(text) {
  speak(text);
}

function askForOption() {
  speak("What do you want to choose?");
  if (recognition) {
    recognition.start();
    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript.toLowerCase();
      const service = services.find((s) =>
        s.name.toLowerCase().includes(spoken)
      );
      if (service) {
        speak(`You chose ${service.name}`);
        openModal(service.id);
      } else {
        speak("Sorry, option not found. Try again.");
      }
    };
    recognition.onerror = () =>
      speak("Voice recognition is on. Continue your process.");
  }
}

// Show Greeting on Load
window.onload = () => {
  const greeting = document.getElementById("greeting");
  greeting.style.display = "block";
  setTimeout(() => {
    greeting.style.display = "none";
    showMenu();
  }, 5000);
};

// Show Menu
function showMenu() {
  const menu = document.getElementById("menu");
  menu.style.display = "flex";
  menu.style.opacity = 1;
  menu.style.animation = "fadeIn 1s ease-in-out forwards";
  if (voiceEnabled) {
    askForOption();
  }

  menu.innerHTML = "";
  services.forEach((service, index) => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.innerHTML = `<h3>${service.name}</h3>`;
    card.dataset.index = index;
    card.onclick = () => openModal(service.id);
    menu.appendChild(card);
  });
}

// Open Modal with slide out animation for menu
function openModal(id) {
  const menu = document.getElementById("menu");
  Array.from(menu.children).forEach((card, i) => {
    card.style.animation = `slideOut${
      i % 2 === 0 ? "Left" : "Right"
    } 0.5s forwards`;
  });
  setTimeout(() => {
    menu.style.display = "none";
    document.getElementById(id).style.display = "flex";
    const firstInput = document.getElementById(id).querySelector("input");
    if (firstInput) firstInput.focus();
  }, 500);
}

// Close Modal
function closeModal(id) {
  document.getElementById(id).style.display = "none";
  const modal = document.getElementById(id);
  const inputs = modal.querySelectorAll("input");
  inputs.forEach((input) => (input.value = ""));
  if (id === "adminPanelModal") {
    document.getElementById("adminResult").innerHTML = "";
  }
  showMenu();
}

// Popup Functions
function showSuccess(message, modalId) {
  speak(message.replace(/[^a-zA-Z0-9 ]/g, ""));
  transactionSound.play();
  document.getElementById("popupMessage").innerHTML = `✅ ${message}`;
  document.getElementById("popupContent").style.background =
    document.body.classList.contains("light-mode")
      ? "linear-gradient(135deg, #34c759, #28a745)"
      : "linear-gradient(135deg, #28a745, #218838)";
  const buttons = document.getElementById("popupButtons");
  buttons.innerHTML =
    "<button onclick=\"closePopupAndModal('" + modalId + "')\">OK</button>";
  document.getElementById("popupModal").style.display = "flex";
  launchConfetti();
  setTimeout(() => closePopupAndModal(modalId), 3000);
}

function showFail(message, modalId) {
  speak(message.replace(/[^a-zA-Z0-9 ]/g, ""));
  document.getElementById("popupMessage").innerHTML = `❌ ${message}`;
  document.getElementById("popupContent").style.background =
    document.body.classList.contains("light-mode")
      ? "linear-gradient(135deg, #ff6666, #cc3333)"
      : "linear-gradient(135deg, #dc3545, #c82333)";
  const buttons = document.getElementById("popupButtons");
  buttons.innerHTML =
    '<button onclick="closePopup()">Try Again</button><button onclick="closePopupAndModal(\'' +
    modalId +
    "')\">Exit</button>";
  document.getElementById("popupModal").style.display = "flex";
}

function closePopup() {
  document.getElementById("popupModal").style.display = "none";
}

function closePopupAndModal(modalId) {
  closePopup();
  closeModal(modalId);
}

// Confetti Animation
const confettiCanvas = document.getElementById("confettiCanvas");
const ctx = confettiCanvas.getContext("2d");
confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;
let particles = [];

function createParticle() {
  return {
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height - confettiCanvas.height,
    size: Math.random() * 10 + 5,
    speedX: Math.random() * 3 - 1.5,
    speedY: Math.random() * 5 + 2,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    rotation: Math.random() * 360,
    rotSpeed: Math.random() * 10 - 5,
  };
}

function animateConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  particles.forEach((p, index) => {
    p.x += p.speedX;
    p.y += p.speedY;
    p.rotation += p.rotSpeed;
    if (p.y > confettiCanvas.height + p.size) {
      particles.splice(index, 1);
      return;
    }
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  });
  if (particles.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiCanvas.style.display = "none";
  }
}

function launchConfetti() {
  particles = [];
  for (let i = 0; i < 200; i++) {
    particles.push(createParticle());
  }
  confettiCanvas.style.display = "block";
  animateConfetti();
  setTimeout(() => (particles = []), 5000);
}

// Resize canvas on window resize
window.addEventListener("resize", () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});

// Functions
async function createAccount() {
  const name = document.getElementById("name").value.trim();
  const age = parseInt(document.getElementById("age").value);
  const email = document.getElementById("email").value.trim();
  const pin = document.getElementById("pin").value;

  if (
    !name ||
    isNaN(age) ||
    age < 18 ||
    !email.includes("@") ||
    !email.includes(".") ||
    !/^\d{4}$/.test(pin)
  ) {
    showFail(
      "Account creation failed (Age must be 18+, valid email with @ and ., PIN must be 4 digits)",
      "createAccountModal"
    );
    return;
  }

  const data = await bank.loadData();
  let account = bank.accountGenerator();
  while (data.some((u) => u.account === account)) {
    account = bank.accountGenerator();
  }

  const info = {
    name: name,
    age: age,
    "E-mail": email,
    Pin: parseInt(pin),
    account: account,
    balance: 0,
    transactions: [],
    loan: { amount: 0, emi: 0 },
  };

  data.push(info);
  await bank.updateData(data);
  showSuccess(
    `Congratulations! Your account is created. Account Number: ${info.account}`,
    "createAccountModal"
  );
}

async function deposit() {
  const acc = document.getElementById("depAcc").value.trim();
  const pin = document.getElementById("depPin").value;
  const amount = parseInt(document.getElementById("depAmount").value);

  if (!acc || !/^\d{4}$/.test(pin) || isNaN(amount) || amount <= 0) {
    showFail(
      "Invalid input. Check account, PIN (4 digits), amount (>0)",
      "depositModal"
    );
    return;
  }

  const user = await bank.login(acc, pin);
  if (!user) {
    showFail("Invalid Account No or PIN", "depositModal");
    return;
  }

  const data = await bank.loadData();
  const index = data.findIndex((u) => u.account === acc);
  data[index].balance += amount;
  await bank.addTransaction(data[index], "Deposit", amount);
  await bank.updateData(data);
  showSuccess(
    `${amount} deposited successfully! New Balance: ${data[index].balance}`,
    "depositModal"
  );
}

async function withdraw() {
  const acc = document.getElementById("wdAcc").value.trim();
  const pin = document.getElementById("wdPin").value;
  const amount = parseInt(document.getElementById("wdAmount").value);

  if (!acc || !/^\d{4}$/.test(pin) || isNaN(amount) || amount <= 0) {
    showFail(
      "Invalid input. Check account, PIN (4 digits), amount (>0)",
      "withdrawModal"
    );
    return;
  }

  const user = await bank.login(acc, pin);
  if (!user) {
    showFail("Invalid Account No or PIN", "withdrawModal");
    return;
  }

  if (amount > user.balance) {
    showFail("Insufficient Balance", "withdrawModal");
    return;
  }

  const data = await bank.loadData();
  const index = data.findIndex((u) => u.account === acc);
  data[index].balance -= amount;
  await bank.addTransaction(data[index], "Withdraw", amount);
  await bank.updateData(data);
  showSuccess(
    `${amount} withdrawn successfully! New Balance: ${data[index].balance}`,
    "withdrawModal"
  );
}

async function balanceEnquiry() {
  const acc = document.getElementById("balAcc").value.trim();
  const pin = document.getElementById("balPin").value;

  if (!acc || !/^\d{4}$/.test(pin)) {
    showFail("Invalid Account No or PIN format", "balanceModal");
    return;
  }

  const user = await bank.login(acc, pin);
  if (!user) {
    showFail("Invalid Account No or PIN", "balanceModal");
    return;
  }

  showSuccess(`Your Current Balance is: ${user.balance}`, "balanceModal");
}

async function showDetails() {
  const acc = document.getElementById("detAcc").value.trim();
  const pin = document.getElementById("detPin").value;

  if (!acc || !/^\d{4}$/.test(pin)) {
    showFail("Invalid Account No or PIN format", "detailsModal");
    return;
  }

  const user = await bank.login(acc, pin);
  if (!user) {
    showFail("Invalid Account No or PIN", "detailsModal");
    return;
  }

  let details = "Account Details:<br>";
  for (let [k, v] of Object.entries(user)) {
    if (k !== "transactions") {
      details += `${k}: ${JSON.stringify(v)}<br>`;
    }
  }
  showSuccess(details, "detailsModal");
}

async function showTransactions() {
  const acc = document.getElementById("transAcc").value.trim();
  const pin = document.getElementById("transPin").value;

  if (!acc || !/^\d{4}$/.test(pin)) {
    showFail("Invalid Account No or PIN format", "transactionsModal");
    return;
  }

  const user = await bank.login(acc, pin);
  if (!user) {
    showFail("Invalid Account No or PIN", "transactionsModal");
    return;
  }

  let history = "Transaction History:<br>";
  if (user.transactions.length === 0) {
    history += "No transactions yet.";
  } else {
    user.transactions.forEach((t) => {
      history += `${t.time} | ${t.type} | Amount: ${t.amount}<br>`;
    });
  }
  showSuccess(history, "transactionsModal");
}

async function changePin() {
  const acc = document.getElementById("cpAcc").value.trim();
  const pin = document.getElementById("cpPin").value;
  const newPin = document.getElementById("newPin").value;

  if (!acc || !/^\d{4}$/.test(pin) || !/^\d{4}$/.test(newPin)) {
    showFail("Invalid Account No or PIN format (4 digits)", "changePinModal");
    return;
  }

  const user = await bank.login(acc, pin);
  if (!user) {
    showFail("Invalid Account No or PIN", "changePinModal");
    return;
  }

  const data = await bank.loadData();
  const index = data.findIndex((u) => u.account === acc);
  data[index].Pin = parseInt(newPin);
  await bank.updateData(data);
  showSuccess("PIN changed successfully!", "changePinModal");
}

async function deleteAccount() {
  const acc = document.getElementById("delAcc").value.trim();
  const pin = document.getElementById("delPin").value;

  if (!acc || !/^\d{4}$/.test(pin)) {
    showFail("Invalid Account No or PIN format", "deleteAccountModal");
    return;
  }

  const user = await bank.login(acc, pin);
  if (!user) {
    showFail("Invalid Account No or PIN", "deleteAccountModal");
    return;
  }

  const data = await bank.loadData();
  const newData = data.filter((u) => u.account !== acc);
  await bank.updateData(newData);
  showSuccess("Account deleted successfully", "deleteAccountModal");
}

async function transfer() {
  const senderAcc = document.getElementById("transfAcc").value.trim();
  const senderPin = document.getElementById("transfPin").value;
  const receiverAcc = document.getElementById("recAcc").value.trim();
  const amount = parseInt(document.getElementById("transfAmount").value);

  if (
    !senderAcc ||
    !/^\d{4}$/.test(senderPin) ||
    !receiverAcc ||
    isNaN(amount) ||
    amount <= 0
  ) {
    showFail(
      "Invalid input. Check accounts, PIN (4 digits), amount (>0)",
      "transferModal"
    );
    return;
  }

  const sender = await bank.login(senderAcc, senderPin);
  if (!sender) {
    showFail("Invalid Sender Account or PIN", "transferModal");
    return;
  }

  const data = await bank.loadData();
  const receiver = data.find((u) => u.account === receiverAcc);
  if (!receiver) {
    showFail("Receiver account not found", "transferModal");
    return;
  }

  if (amount > sender.balance) {
    showFail("Insufficient balance", "transferModal");
    return;
  }

  const senderIndex = data.findIndex((u) => u.account === senderAcc);
  const receiverIndex = data.findIndex((u) => u.account === receiverAcc);
  data[senderIndex].balance -= amount;
  data[receiverIndex].balance += amount;
  await bank.addTransaction(
    data[senderIndex],
    `Transfer to ${receiver.name}`,
    amount
  );
  await bank.addTransaction(
    data[receiverIndex],
    `Transfer from ${sender.name}`,
    amount
  );
  await bank.updateData(data);
  showSuccess(
    `${amount} transferred to ${receiver.name} successfully!`,
    "transferModal"
  );
}

async function loanApply() {
  const acc = document.getElementById("loanAcc").value.trim();
  const pin = document.getElementById("loanPin").value;
  const amount = parseInt(document.getElementById("loanAmount").value);
  const months = parseInt(document.getElementById("loanMonths").value);

  if (
    !acc ||
    !/^\d{4}$/.test(pin) ||
    isNaN(amount) ||
    amount <= 0 ||
    isNaN(months) ||
    months <= 0
  ) {
    showFail("Invalid Loan request. Check details", "loanApplyModal");
    return;
  }

  const user = await bank.login(acc, pin);
  if (!user) {
    showFail("Invalid Account No or PIN", "loanApplyModal");
    return;
  }

  const data = await bank.loadData();
  const index = data.findIndex((u) => u.account === acc);
  const emi = Math.round((amount / months) * 100) / 100;
  data[index].loan.amount = amount;
  data[index].loan.emi = emi;
  data[index].balance += amount;
  await bank.addTransaction(data[index], "Loan credited", amount);
  await bank.updateData(data);
  showSuccess(`Loan Approved! EMI per month: ${emi}`, "loanApplyModal");
}

async function payEmi() {
  const acc = document.getElementById("emiAcc").value.trim();
  const pin = document.getElementById("emiPin").value;

  if (!acc || !/^\d{4}$/.test(pin)) {
    showFail("Invalid Account No or PIN format", "payEmiModal");
    return;
  }

  const user = await bank.login(acc, pin);
  if (!user) {
    showFail("Invalid Account No or PIN", "payEmiModal");
    return;
  }

  if (user.loan.amount <= 0) {
    showFail("No active loan", "payEmiModal");
    return;
  }

  const emi = user.loan.emi;
  if (user.balance < emi) {
    showFail("Insufficient balance to pay EMI", "payEmiModal");
    return;
  }

  const data = await bank.loadData();
  const index = data.findIndex((u) => u.account === acc);
  data[index].balance -= emi;
  data[index].loan.amount -= emi;
  await bank.addTransaction(data[index], "EMI Payment", emi);
  let message = `EMI of ${emi} paid! Remaining Loan: ${data[index].loan.amount}`;
  if (data[index].loan.amount <= 0) {
    data[index].loan.amount = 0;
    data[index].loan.emi = 0;
    message = "Loan fully repaid!";
  }
  await bank.updateData(data);
  showSuccess(message, "payEmiModal");
}

async function adminPanel() {
  const username = document.getElementById("adminUser").value.trim();
  const password = document.getElementById("adminPass").value;

  if (username !== "AdminPanels" || password !== "#Radhayadav123@") {
    showFail("Invalid admin credentials", "adminPanelModal");
    return;
  }

  const data = await bank.loadData();
  const numAccounts = data.length;
  const totalDeposits = data.reduce((sum, u) => sum + u.balance, 0);
  const latestAccount = numAccounts > 0 ? data[numAccounts - 1] : null;
  let adminInfo = `<div style="background: rgba(0, 123, 255, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 10px;">Number of Accounts: <strong>${numAccounts}</strong></div>`;
  adminInfo += `<div style="background: rgba(0, 123, 255, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 10px;">Total Deposits in Bank: <strong>${totalDeposits}</strong></div>`;
  if (latestAccount) {
    adminInfo += `<div style="background: rgba(0, 123, 255, 0.1); padding: 10px; border-radius: 8px;">Latest Account Details:<br>Name: <strong>${
      latestAccount.name
    }</strong><br>Account: <strong>${
      latestAccount.account
    }</strong><br>Age: <strong>${
      latestAccount.age
    }</strong><br>Email: <strong>${
      latestAccount["E-mail"]
    }</strong><br>Balance: <strong>${
      latestAccount.balance
    }</strong><br>Loan: <strong>${JSON.stringify(
      latestAccount.loan
    )}</strong></div>`;
  } else {
    adminInfo += `<div style="background: rgba(255, 0, 0, 0.1); padding: 10px; border-radius: 8px;">No accounts created yet.</div>`;
  }
  document.getElementById("adminResult").innerHTML = adminInfo;
}

async function searchUser() {
  const acc = document.getElementById("adminSearchInput").value.trim();
  if (!acc) {
    return;
  }

  const data = await bank.loadData();
  const user = data.find((u) => u.account === acc);
  if (!user) {
    const notFound = document.getElementById("notFoundMessage");
    notFound.style.opacity = 1;
    notFound.style.animation = "fadeNotFound 4s forwards";
    setTimeout(() => {
      notFound.style.animation = "";
      notFound.style.opacity = 0;
    }, 4000);
    return;
  }

  let userDetails = `<div style="background: rgba(0, 255, 0, 0.1); padding: 10px; border-radius: 8px; margin-top: 10px;">User Found:<br>Name: <strong>${
    user.name
  }</strong><br>Account: <strong>${user.account}</strong><br>Age: <strong>${
    user.age
  }</strong><br>Email: <strong>${user["E-mail"]}</strong><br>Balance: <strong>${
    user.balance
  }</strong><br>Loan: <strong>${JSON.stringify(user.loan)}</strong></div>`;
  document.getElementById("adminResult").innerHTML += userDetails;
}
