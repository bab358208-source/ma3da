const screens = document.querySelectorAll(".screen");

function showScreen(id) {
  screens.forEach(s => s.classList.remove("active"));
  const screen = document.getElementById(id);
  if (screen) {
    screen.classList.add("active");
    window.scrollTo(0, 0);
  }
}

/* =========================
   STATE
========================= */

let selectedRole = "";
let workStartTime = null;
let timerInterval = null;
let acceptanceWatcher = null;
let selectedPayment = "";
let selectedRating = 0;

let order = {
  location: "",
  equipment: "",
  duration: "",
  operator: "",
  notes: "",
  price: 0
};

const hourlyPrices = {
  "بوكلين": 250,
  "شيول": 220,
  "قلاب": 180,
  "كرين": 350,
  "حفار": 250,
  "بلدوزر": 300
};

const durationHours = {
  "ساعة واحدة": 1,
  "4 ساعات": 4,
  "8 ساعات": 8,
  "يوم كامل": 10
};

/* =========================
   ORDER
========================= */

function saveOrder() {
  localStorage.setItem("currentOrder", JSON.stringify(order));
}

function loadOrder() {
  const saved = localStorage.getItem("currentOrder");
  if (!saved) return false;

  try {
    order = JSON.parse(saved);
    return true;
  } catch {
    return false;
  }
}

function setOrderState(state) {
  localStorage.setItem("orderState", state);
}

function getOrderState() {
  return localStorage.getItem("orderState") || "";
}

function calculatePrice() {
  return (
    hourlyPrices[order.equipment] || 250
  ) * (
    durationHours[order.duration] || 4
  );
}

/* =========================
   SCREENS DATA
========================= */

function updateMatchedScreen() {
  const equipment = document.getElementById("matchedEquipment");
  const location = document.getElementById("matchedLocation");

  if (equipment) {
    equipment.textContent =
      order.equipment
        ? `${order.equipment} - CAT 320`
        : "بوكلين - CAT 320";
  }

  if (location) {
    location.textContent = order.location || "موقع العميل";
  }
}

function updateWorkingScreen() {
  const equipment = document.getElementById("workingEquipment");
  const location = document.getElementById("workingLocation");

  if (equipment) {
    equipment.textContent = order.equipment || "بوكلين";
  }

  if (location) {
    location.textContent = order.location || "موقع العميل";
  }
}

function updateOperatorScreen() {
  const equipment = document.getElementById("operatorEquipment");
  const location = document.getElementById("operatorLocation");
  const duration = document.getElementById("operatorDuration");
  const price = document.getElementById("operatorPrice");
  const notes = document.getElementById("operatorNotes");

  if (equipment) equipment.textContent = order.equipment || "بوكلين";
  if (location) location.textContent = order.location || "موقع العميل";
  if (duration) duration.textContent = order.duration || "4 ساعات";
  if (price) price.textContent = `${order.price || 1000} ريال`;
  if (notes) notes.textContent = order.notes || "لا توجد ملاحظات";
}

/* =========================
   CUSTOMER REQUEST
========================= */

const requestBtn = document.getElementById("requestBtn");

if (requestBtn) {
  requestBtn.addEventListener("click", () => {

    const location =
      document.getElementById("locationInput")?.value.trim();

    const equipment =
      document.getElementById("equipmentSelect")?.value;

    const duration =
      document.getElementById("durationSelect")?.value;

    const operator =
      document.getElementById("operatorSelect")?.value;

    const notes =
      document.getElementById("notesInput")?.value.trim();

    if (!location) {
      alert("اكتب موقع العمل");
      return;
    }

    if (!equipment) {
      alert("اختر نوع المعدة");
      return;
    }

    if (!duration) {
      alert("اختر مدة العمل");
      return;
    }

    order = {
      location,
      equipment,
      duration,
      operator,
      notes,
      price: 0
    };

    order.price = calculatePrice();

    saveOrder();

    [
      "acceptedOrder",
      "workEnded",
      "finalPrice",
      "orderAccepted"
    ].forEach(key => localStorage.removeItem(key));

    setOrderState("searching");

    selectedRole = "customer";

    updateMatchedScreen();
    updateWorkingScreen();
    updateOperatorScreen();

    showScreen("searchingScreen");

const searchingScreen =
  document.getElementById("searchingScreen");

if (searchingScreen) {
  searchingScreen.classList.add("active");
}

startAcceptanceWatcher();
  });
}

/* =========================
   ACCEPTANCE WATCHER
========================= */

function stopAcceptanceWatcher() {
  if (acceptanceWatcher) {
    clearInterval(acceptanceWatcher);
    acceptanceWatcher = null;
  }
}

function startAcceptanceWatcher() {
  stopAcceptanceWatcher();

  acceptanceWatcher = setInterval(() => {

    if (selectedRole !== "customer") return;

    const searching =
      document.getElementById("searchingScreen");

    if (
      !searching ||
      !searching.classList.contains("active")
    ) {
      return;
    }

    if (getOrderState() === "accepted") {

      stopAcceptanceWatcher();

      if (loadOrder()) {
        updateMatchedScreen();
        updateWorkingScreen();
        showScreen("matchedScreen");
      }
    }

  }, 500);
}

/* =========================
   ROLE
========================= */

const customerRoleBtn =
  document.getElementById("customerRoleBtn");

if (customerRoleBtn) {
  customerRoleBtn.addEventListener("click", () => {

    selectedRole = "customer";

    const text =
      document.getElementById("phoneRoleText");

    if (text) {
      text.textContent = "تسجيل الدخول كعميل";
    }

    showScreen("phoneScreen");
  });
}

const operatorRoleBtn =
  document.getElementById("operatorRoleBtn");

if (operatorRoleBtn) {
  operatorRoleBtn.addEventListener("click", () => {

    selectedRole = "operator";
    stopAcceptanceWatcher();

    const text =
      document.getElementById("phoneRoleText");

    if (text) {
      text.textContent =
        "تسجيل الدخول كصاحب معدة / مشغل";
    }

    showScreen("phoneScreen");
  });
}

/* =========================
   OTP
========================= */

/* =========================
   EMAIL LOGIN
========================= */

const emailLoginBtn =
  document.getElementById("sendCodeBtn");

const createAccountBtn =
  document.getElementById("createAccountBtn");

if (emailLoginBtn) {

  emailLoginBtn.addEventListener("click", async () => {

    const email =
      document.getElementById("emailInput")?.value.trim();

    const password =
      document.getElementById("passwordInput")?.value;

    const error =
      document.getElementById("emailError");

    if (!email || !password) {

      if (error) {
        error.textContent =
          "أدخل البريد الإلكتروني وكلمة المرور";
      }

      return;
    }

    if (error) {
      error.textContent = "";
    }

    const user =
      await ma3daLogin(email, password);

    if (!user) return;

    console.log(
      "تم تسجيل الدخول بنجاح:",
      user.uid
    );

    if (selectedRole === "customer") {

      const state =
        getOrderState();

      if (
        state === "accepted" &&
        loadOrder()
      ) {

        stopAcceptanceWatcher();

        updateMatchedScreen();
        updateWorkingScreen();

        showScreen("matchedScreen");

        return;
      }

      if (
        state === "searching" &&
        loadOrder()
      ) {

        showScreen("searchingScreen");

        startAcceptanceWatcher();

        return;
      }

      showScreen("requestScreen");

      return;
    }

    if (selectedRole === "operator") {

      showScreen("addEquipmentScreen");

    }

  });

}


if (createAccountBtn) {

  createAccountBtn.addEventListener("click", async () => {

    const email =
      document.getElementById("emailInput")?.value.trim();

    const password =
      document.getElementById("passwordInput")?.value;

    const error =
      document.getElementById("emailError");

    if (!email || !password) {

      if (error) {
        error.textContent =
          "أدخل البريد الإلكتروني وكلمة المرور";
      }

      return;
    }

    if (password.length < 6) {

      if (error) {
        error.textContent =
          "كلمة المرور يجب أن تكون 6 أحرف أو أكثر";
      }

      return;
    }

    if (error) {
      error.textContent = "";
    }

    const user =
      await ma3daCreateAccount(
        email,
        password
      );

    if (!user) return;

    console.log(
      "تم إنشاء الحساب بنجاح:",
      user.uid
    );

    alert("تم إنشاء الحساب بنجاح ✅");

    if (selectedRole === "customer") {

      showScreen("requestScreen");

      return;
    }

    if (selectedRole === "operator") {

      showScreen("addEquipmentScreen");

      return;
    }

  });

}
/* =========================
   OPERATOR
========================= */

function openOperatorScreen() {
  updateOperatorScreen();
  displayMyEquipment();
  showScreen("operatorScreen");
}

/* =========================
   ACCEPT REQUEST
========================= */

const acceptRequestBtn =
  document.getElementById("acceptRequestBtn");

if (acceptRequestBtn) {
  acceptRequestBtn.addEventListener("click", () => {

    if (!loadOrder()) {
      alert("لا يوجد طلب عميل محفوظ");
      return;
    }

    localStorage.setItem(
      "acceptedOrder",
      JSON.stringify({
        ...order,
        operatorName: "فهد القحطاني",
        operatorRating: "4.8"
      })
    );

localStorage.setItem("orderAccepted", "true");
setOrderState("accepted");

updateMatchedScreen();
updateWorkingScreen();

alert("تم قبول الطلب بنجاح 🚜");

showScreen("matchedScreen");
  });
}

/* =========================
   REJECT
========================= */

const rejectRequestBtn =
  document.getElementById("rejectRequestBtn");

if (rejectRequestBtn) {
  rejectRequestBtn.addEventListener("click", () => {

    localStorage.removeItem("acceptedOrder");
    localStorage.removeItem("orderAccepted");

    setOrderState("rejected");

    alert("تم رفض الطلب");

    showScreen("roleScreen");
  });
}

/* =========================
   EQUIPMENT
========================= */

const saveEquipmentBtn =
  document.getElementById("saveEquipmentBtn");

if (saveEquipmentBtn) {
  saveEquipmentBtn.addEventListener(
    "click",
    saveEquipment
  );
}

async function saveEquipment() {

  const type =
    document.getElementById("equipmentType")?.value;

  const model =
    document.getElementById("equipmentModel")?.value.trim();

  const year =
    document.getElementById("equipmentYear")?.value.trim();

  const city =
    document.getElementById("equipmentCity")?.value.trim();

  const availability =
    document.getElementById("equipmentAvailability")?.value;

  const imageInput =
    document.getElementById("equipmentImage");

  if (!type || !model || !year || !city) {
    alert("فضلاً أكمل جميع بيانات المعدة");
    return;
  }

  const equipment = {
    type,
    model,
    year,
    city,
    availability,
    image: ""
  };

  const saveToFirebase = async () => {

    if (!window.ma3daDB) {
      throw new Error("Firebase غير متصل");
    }

    const equipmentRef =
      window.ma3daDoc(
        window.ma3daDB,
        "equipment",
        "myEquipment"
      );

    await window.ma3daSetDoc(
      equipmentRef,
      equipment
    );
  };

  const file = imageInput?.files[0];

  if (!file) {

    try {

      await saveToFirebase();

      localStorage.setItem(
        "myEquipment",
        JSON.stringify(equipment)
      );

      alert("تم حفظ المعدة بنجاح 🚜");
      openOperatorScreen();

    } catch (error) {

      console.error(error);

      alert(
        "تعذر حفظ المعدة في قاعدة البيانات"
      );
    }

    return;
  }

  const reader = new FileReader();

  reader.onload = () => {

    const image = new Image();

    image.onload = async () => {

      const maxWidth = 1000;

      let width = image.width;
      let height = image.height;

      if (width > maxWidth) {
        height =
          Math.round(height * maxWidth / width);

        width = maxWidth;
      }

      const canvas =
        document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const ctx =
        canvas.getContext("2d");

      ctx.drawImage(
        image,
        0,
        0,
        width,
        height
      );

      equipment.image =
        canvas.toDataURL(
          "image/jpeg",
          0.75
        );

      try {

        await saveToFirebase();

        localStorage.setItem(
          "myEquipment",
          JSON.stringify(equipment)
        );

        alert("تم حفظ المعدة بنجاح 🚜");
        openOperatorScreen();

      } catch (error) {

        console.error(error);

        alert(
          "تعذر حفظ المعدة في قاعدة البيانات"
        );
      }
    };

    image.src = reader.result;
  };

  reader.readAsDataURL(file);
}
async function displayMyEquipment() {

  try {

    if (!window.ma3daDB) {
      console.log("Firebase غير متصل");
      return;
    }

    const equipmentRef =
      window.ma3daDoc(
        window.ma3daDB,
        "equipment",
        "myEquipment"
      );

    const snapshot =
      await window.ma3daGetDoc(equipmentRef);

    if (!snapshot.exists()) {
      console.log("لا توجد بيانات للمعدة");
      return;
    }

    const equipment = snapshot.data();

    const type =
      document.getElementById("myEquipmentType");

    const model =
      document.getElementById("myEquipmentModel");

    const year =
      document.getElementById("myEquipmentYear");

    const city =
      document.getElementById("myEquipmentCity");

    const availability =
      document.getElementById(
        "myEquipmentAvailability"
      );

    const image =
      document.getElementById(
        "myEquipmentImage"
      );

    if (type) {
      type.textContent =
        equipment.type || "-";
    }

    if (model) {
      model.textContent =
        equipment.model || "-";
    }

    if (year) {
      year.textContent =
        equipment.year || "-";
    }

    if (city) {
      city.textContent =
        equipment.city || "-";
    }

    if (availability) {
      availability.textContent =
        equipment.availability === "available"
          ? "متاحة الآن"
          : "غير متاحة";
    }

    if (image) {

      if (equipment.image) {

        image.src = equipment.image;
        image.style.display = "block";

      } else {

        image.removeAttribute("src");
        image.style.display = "none";

      }
    }

  } catch (error) {

    console.error(
      "تعذر تحميل بيانات المعدة:",
      error
    );

  }
}
/* =========================
   MATCHED
========================= */

const trackingBtn =
  document.getElementById("trackingBtn");

if (trackingBtn) {
  trackingBtn.addEventListener("click", () => {
    showScreen("trackingScreen");
    startTracking();
  });
}

/* =========================
   CHAT
========================= */

const chatBtn =
  document.getElementById("chatBtn");

if (chatBtn) {
  chatBtn.addEventListener("click", () => {

    showScreen("chatScreen");

    setTimeout(() => {
      document.getElementById("chatInput")?.focus();
    }, 100);
  });
}

function sendChatMessage() {

  const input =
    document.getElementById("chatInput");

  const messages =
    document.getElementById("chatMessages");

  if (!input || !messages) return;

  const text = input.value.trim();

  if (!text) return;

  const message =
    document.createElement("div");

  message.className = "message sent";
  message.textContent = text;

  messages.appendChild(message);

  input.value = "";
  messages.scrollTop = messages.scrollHeight;
}

const sendChatBtn =
  document.getElementById("sendChatBtn");

if (sendChatBtn) {
  sendChatBtn.addEventListener(
    "click",
    sendChatMessage
  );
}

const chatInput =
  document.getElementById("chatInput");

if (chatInput) {
  chatInput.addEventListener("keydown", e => {

    if (e.key === "Enter") {
      e.preventDefault();
      sendChatMessage();
    }

  });
}

const backFromChatBtn =
  document.getElementById("backFromChatBtn");

if (backFromChatBtn) {
  backFromChatBtn.addEventListener("click", () => {
    showScreen("matchedScreen");
  });
}

/* =========================
   TRACKING
========================= */

function startTracking() {

  const marker =
    document.getElementById("equipmentMarker");

  const distance =
    document.getElementById("distanceText");

  const eta =
    document.getElementById("etaText");

  const status =
    document.getElementById("trackingStatus");

  if (!marker || !distance || !eta || !status) {
    return;
  }

  const steps = [
    ["18%", "55%", "2.4 كم", "8 دقائق"],
    ["30%", "45%", "2.0 كم", "7 دقائق"],
    ["42%", "40%", "1.5 كم", "5 دقائق"],
    ["55%", "30%", "900 م", "3 دقائق"],
    ["65%", "20%", "400 م", "1 دقيقة"],
    ["75%", "12%", "0 م", "الآن"]
  ];

  let index = 0;

  function move() {

    const step = steps[index];

    marker.style.top = step[0];
    marker.style.right = step[1];

    distance.textContent = step[2];
    eta.textContent = step[3];

    if (index === steps.length - 1) {

      status.textContent =
        "وصلت المعدة إلى موقعك";

      setTimeout(() => {
        showScreen("arrivedScreen");
      }, 1500);

      return;
    }

    index++;
    setTimeout(move, 1400);
  }

  move();
}

/* =========================
   START WORK
========================= */

const startWorkBtn =
  document.getElementById("startWorkBtn");

if (startWorkBtn) {
  startWorkBtn.addEventListener("click", () => {

    showScreen("workingScreen");

    if (selectedRole !== "customer") {
      return;
    }

    workStartTime = Date.now();

    clearInterval(timerInterval);

    updateTimer();

    timerInterval =
      setInterval(updateTimer, 1000);

    const check =
      setInterval(() => {

        if (
          localStorage.getItem("workEnded") === "true"
        ) {

          clearInterval(check);
          clearInterval(timerInterval);

          const price =
            localStorage.getItem("finalPrice");

          if (price) {
            const finalPrice =
              document.getElementById("finalPrice");

            if (finalPrice) {
              finalPrice.textContent =
                `${price} ريال`;
            }
          }

          showScreen("completedScreen");
        }

      }, 1000);
  });
}

function updateTimer() {

  if (!workStartTime) return;

  const elapsed =
    Math.floor(
      (Date.now() - workStartTime) / 1000
    );

  const hours =
    Math.floor(elapsed / 3600);

  const minutes =
    Math.floor((elapsed % 3600) / 60);

  const seconds =
    elapsed % 60;

  const timer =
    document.getElementById("timer");

  if (timer) {
    timer.textContent =
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;
  }
}

/* =========================
   CALL - OPERATOR ONLY
========================= */

const callCustomerBtn =
  document.getElementById("callCustomerBtn");

if (callCustomerBtn) {
  callCustomerBtn.addEventListener("click", () => {
    window.location.href = "tel:0550000000";
  });
}
const callBtn =
  document.getElementById("callBtn");

if (callBtn) {
  callBtn.addEventListener("click", () => {
    window.location.href = "tel:0550000000";
  });
}
/* =========================
   END WORK
========================= */

const endWorkBtn =
  document.getElementById("endWorkBtn");

if (endWorkBtn) {
  endWorkBtn.addEventListener("click", () => {

    clearInterval(timerInterval);

    const finalPrice =
      order.price || 1000;

    const priceElement =
      document.getElementById("finalPrice");

    if (priceElement) {
      priceElement.textContent =
        `${finalPrice} ريال`;
    }

    if (selectedRole === "operator") {

      localStorage.setItem(
        "workEnded",
        "true"
      );

      localStorage.setItem(
        "finalPrice",
        finalPrice
      );

      setOrderState("completed");

      showScreen("operatorCompletedScreen");

    } else {

      showScreen("completedScreen");
    }
  });
}

/* =========================
   PAYMENT
========================= */

document
  .querySelectorAll(".payment-option")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".payment-option")
        .forEach(item =>
          item.classList.remove("selected")
        );

      button.classList.add("selected");

      selectedPayment =
        button.dataset.payment;

      const confirm =
        document.getElementById(
          "confirmPaymentBtn"
        );

      if (confirm) {
        confirm.disabled = false;
      }
    });
  });

const paymentBtn =
  document.getElementById("paymentBtn");

if (paymentBtn) {
  paymentBtn.addEventListener("click", () => {
    showScreen("paymentScreen");
  });
}

const confirmPaymentBtn =
  document.getElementById("confirmPaymentBtn");

if (confirmPaymentBtn) {
  confirmPaymentBtn.addEventListener("click", () => {

    if (!selectedPayment) return;

    showScreen("ratingScreen");
  });
}

/* =========================
   RATING
========================= */

document
  .querySelectorAll(".stars button")
  .forEach(button => {

    button.addEventListener("click", () => {

      selectedRating =
        Number(button.dataset.rating);

      document
        .querySelectorAll(".stars button")
        .forEach(star => {

          star.classList.toggle(
            "selected",
            Number(star.dataset.rating) <= selectedRating
          );
        });

      const ratingBtn =
        document.getElementById("ratingBtn");

      if (ratingBtn) {
        ratingBtn.disabled = false;
      }
    });
  });

const ratingBtn =
  document.getElementById("ratingBtn");

if (ratingBtn) {
  ratingBtn.addEventListener("click", () => {
    showScreen("thankYouScreen");
  });
}

/* =========================
   NEW REQUEST
========================= */

const newRequestBtn =
  document.getElementById("newRequestBtn");

if (newRequestBtn) {
  newRequestBtn.addEventListener("click", () => {

    stopAcceptanceWatcher();

    [
      "currentOrder",
      "orderState",
      "acceptedOrder",
      "orderAccepted",
      "workEnded",
      "finalPrice"
    ].forEach(key =>
      localStorage.removeItem(key)
    );

    location.reload();
  });
}

/* =========================
   BACK BUTTONS
========================= */

const backRoleBtn =
  document.getElementById("backRoleBtn");

if (backRoleBtn) {
  backRoleBtn.addEventListener("click", () => {

    const phone =
      document.getElementById("phoneInput");

    const error =
      document.getElementById("phoneError");

    if (phone) phone.value = "";
    if (error) error.textContent = "";

    showScreen("roleScreen");
  });
}

const backPhoneBtn =
  document.getElementById("backPhoneBtn");

if (backPhoneBtn) {
  backPhoneBtn.addEventListener("click", () => {

    const otp =
      document.getElementById("otpInput");

    const error =
      document.getElementById("otpError");

    if (otp) otp.value = "";
    if (error) error.textContent = "";

    showScreen("phoneScreen");
  });
}

/* =========================
   START
========================= */

displayMyEquipment();

async function ma3daCreateAccount(email, password) {
  try {
    const { createUserWithEmailAndPassword } =
      await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js");

    const result =
      await createUserWithEmailAndPassword(
        window.ma3daAuth,
        email,
        password
      );

    console.log("تم إنشاء الحساب:", result.user.uid);

    return result.user;

  } catch (error) {

    console.error(
      "خطأ في إنشاء الحساب:",
      error
    );

    alert("تعذر إنشاء الحساب: " + error.message);

    return null;
  }
}
async function ma3daLogin(email, password) {
  try {
    const { signInWithEmailAndPassword } =
      await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js");

    const result =
      await signInWithEmailAndPassword(
        window.ma3daAuth,
        email,
        password
      );

    console.log("تم تسجيل الدخول:", result.user.uid);

    return result.user;

  } catch (error) {

    console.error(
      "خطأ في تسجيل الدخول:",
      error
    );

    alert("تعذر تسجيل الدخول: " + error.message);

    return null;
  }
}
/* =========================
   EMAIL LOGIN - TEMPORARY
========================= */

const emailLoginBtn =
  document.getElementById("sendCodeBtn");

const createAccountBtn =
  document.getElementById("createAccountBtn");

if (emailLoginBtn) {
  emailLoginBtn.addEventListener("click", async () => {

    const email =
      document.getElementById("emailInput")?.value.trim();

    const password =
      document.getElementById("passwordInput")?.value;

    if (!email || !password) {
      alert("أدخل البريد الإلكتروني وكلمة المرور");
      return;
    }

    const user = await ma3daLogin(email, password);

    if (!user) return;

    alert("تم تسجيل الدخول بنجاح ✅");

    if (selectedRole === "customer") {
      showScreen("requestScreen");
    }

    if (selectedRole === "operator") {
      showScreen("addEquipmentScreen");
    }
  });
}

if (createAccountBtn) {
  createAccountBtn.addEventListener("click", async () => {

    const email =
      document.getElementById("emailInput")?.value.trim();

    const password =
      document.getElementById("passwordInput")?.value;

    if (!email || !password) {
      alert("أدخل البريد الإلكتروني وكلمة المرور");
      return;
    }

    if (password.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف أو أكثر");
      return;
    }

    const user =
      await ma3daCreateAccount(email, password);

    if (!user) return;

    alert("تم إنشاء الحساب بنجاح ✅");

    if (selectedRole === "customer") {
      showScreen("requestScreen");
    }

    if (selectedRole === "operator") {
      showScreen("addEquipmentScreen");
    }
  });
}
