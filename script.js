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
let workEndWatcher = null;
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
   ORDER STORAGE
========================= */

function saveOrder() {
  localStorage.setItem(
    "currentOrder",
    JSON.stringify(order)
  );
}

function loadOrder() {
  const saved =
    localStorage.getItem("currentOrder");

  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved);

    if (!parsed || typeof parsed !== "object") {
      return false;
    }

    order = {
      location: parsed.location || "",
      equipment: parsed.equipment || "",
      duration: parsed.duration || "",
      operator: parsed.operator || "",
      notes: parsed.notes || "",
      price: Number(parsed.price) || 0
    };

    return true;

  } catch {
    return false;
  }
}

function setOrderState(state) {
  localStorage.setItem(
    "orderState",
    state
  );
}

function getOrderState() {
  return (
    localStorage.getItem("orderState") || ""
  );
}

function calculatePrice() {
  const hourly =
    hourlyPrices[order.equipment] || 250;

  const hours =
    durationHours[order.duration] || 4;

  return hourly * hours;
}

/* =========================
   SCREEN DATA
========================= */

function updateMatchedScreen() {

  const equipment =
    document.getElementById(
      "matchedEquipment"
    );

  const location =
    document.getElementById(
      "matchedLocation"
    );

  if (equipment) {
    equipment.textContent =
      order.equipment
        ? `${order.equipment} - CAT 320`
        : "بوكلين - CAT 320";
  }

  if (location) {
    location.textContent =
      order.location || "موقع العميل";
  }
}

function updateWorkingScreen() {

  const equipment =
    document.getElementById(
      "workingEquipment"
    );

  const location =
    document.getElementById(
      "workingLocation"
    );

  if (equipment) {
    equipment.textContent =
      order.equipment || "بوكلين";
  }

  if (location) {
    location.textContent =
      order.location || "موقع العميل";
  }
}

function updateOperatorScreen() {

  const equipment =
    document.getElementById(
      "operatorEquipment"
    );

  const location =
    document.getElementById(
      "operatorLocation"
    );

  const duration =
    document.getElementById(
      "operatorDuration"
    );

  const price =
    document.getElementById(
      "operatorPrice"
    );

  const notes =
    document.getElementById(
      "operatorNotes"
    );

  if (equipment) {
    equipment.textContent =
      order.equipment || "بوكلين";
  }

  if (location) {
    location.textContent =
      order.location || "موقع العميل";
  }

  if (duration) {
    duration.textContent =
      order.duration || "4 ساعات";
  }

  if (price) {
    price.textContent =
      `${order.price || 1000} ريال`;
  }

  if (notes) {
    notes.textContent =
      order.notes || "لا توجد ملاحظات";
  }
}

/* =========================
   CUSTOMER REQUEST
========================= */

const requestBtn =
  document.getElementById(
    "requestBtn"
  );

if (requestBtn) {

  requestBtn.addEventListener(
    "click",
    () => {

      const location =
        document
          .getElementById(
            "locationInput"
          )
          ?.value.trim();

      const equipment =
        document
          .getElementById(
            "equipmentSelect"
          )
          ?.value;

      const duration =
        document
          .getElementById(
            "durationSelect"
          )
          ?.value;

      const operator =
        document
          .getElementById(
            "operatorSelect"
          )
          ?.value;

      const notes =
        document
          .getElementById(
            "notesInput"
          )
          ?.value.trim();

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

      order.price =
        calculatePrice();

      /* حفظ الطلب */
      saveOrder();

      /* تنظيف حالة الطلب السابقة فقط */
      [
        "acceptedOrder",
        "workEnded",
        "finalPrice",
        "orderAccepted"
      ].forEach(key => {
        localStorage.removeItem(key);
      });

      /* الطلب الآن يبحث */
      setOrderState("searching");

      selectedRole = "customer";

      updateMatchedScreen();
      updateWorkingScreen();
      updateOperatorScreen();

      /* إظهار شاشة البحث */
      showScreen(
        "searchingScreen"
      );

      startAcceptanceWatcher();
    }
  );
}

/* =========================
   CUSTOMER SEARCH WATCHER
========================= */

function stopAcceptanceWatcher() {

  if (acceptanceWatcher) {

    clearInterval(
      acceptanceWatcher
    );

    acceptanceWatcher = null;
  }
}

function startAcceptanceWatcher() {

  stopAcceptanceWatcher();

  acceptanceWatcher =
    setInterval(() => {

      /* لا نحتاج مراقبة إلا للعميل */
      if (
        selectedRole !== "customer"
      ) {
        return;
      }

      const searching =
        document.getElementById(
          "searchingScreen"
        );

      if (
        !searching ||
        !searching.classList.contains(
          "active"
        )
      ) {
        return;
      }

      const state =
        getOrderState();

      /* عندما يقبل صاحب المعدة */
      if (state === "accepted") {

        if (!loadOrder()) {
          return;
        }

        stopAcceptanceWatcher();

        updateMatchedScreen();
        updateWorkingScreen();

        showScreen(
          "matchedScreen"
        );
      }

    }, 500);
}

/* =========================
   ROLE
========================= */

const customerRoleBtn =
  document.getElementById(
    "customerRoleBtn"
  );

if (customerRoleBtn) {

  customerRoleBtn.addEventListener(
    "click",
    () => {

      selectedRole = "customer";

      const text =
        document.getElementById(
          "phoneRoleText"
        );

      if (text) {
        text.textContent =
          "تسجيل الدخول كعميل";
      }

      showScreen(
        "phoneScreen"
      );
    }
  );
}

const operatorRoleBtn =
  document.getElementById(
    "operatorRoleBtn"
  );

if (operatorRoleBtn) {

  operatorRoleBtn.addEventListener(
    "click",
    () => {

      selectedRole = "operator";

      stopAcceptanceWatcher();

      const text =
        document.getElementById(
          "phoneRoleText"
        );

      if (text) {
        text.textContent =
          "تسجيل الدخول كصاحب معدة / مشغل";
      }

      showScreen(
        "phoneScreen"
      );
    }
  );
}

/* =========================
   OTP
========================= */

const sendCodeBtn =
  document.getElementById(
    "sendCodeBtn"
  );

if (sendCodeBtn) {

  sendCodeBtn.addEventListener(
    "click",
    () => {

      const phone =
        document
          .getElementById(
            "phoneInput"
          )
          ?.value.trim();

      const error =
        document.getElementById(
          "phoneError"
        );

      if (
        !/^5\d{8}$/.test(phone)
      ) {

        if (error) {
          error.textContent =
            "أدخل رقم جوال سعودي صحيح يبدأ بـ 5";
        }

        return;
      }

      if (error) {
        error.textContent = "";
      }

      const otpText =
        document.getElementById(
          "otpText"
        );

      if (otpText) {

        otpText.textContent =
          `أدخل رمز التحقق المرسل إلى +966 ${phone}`;
      }

      showScreen(
        "otpScreen"
      );

      alert(
        "رمز التحقق التجريبي هو: 1234"
      );
    }
  );
}

const verifyCodeBtn =
  document.getElementById(
    "verifyCodeBtn"
  );

if (verifyCodeBtn) {

  verifyCodeBtn.addEventListener(
    "click",
    () => {

      const code =
        document
          .getElementById(
            "otpInput"
          )
          ?.value.trim();

      const error =
        document.getElementById(
          "otpError"
        );

      if (code !== "1234") {

        if (error) {
          error.textContent =
            "رمز التحقق غير صحيح";
        }

        return;
      }

      if (error) {
        error.textContent = "";
      }

      /* =====================
         CUSTOMER LOGIN
      ===================== */

      if (
        selectedRole === "customer"
      ) {

        const state =
          getOrderState();

        /* الطلب مقبول */
        if (
          state === "accepted" &&
          loadOrder()
        ) {

          stopAcceptanceWatcher();

          updateMatchedScreen();
          updateWorkingScreen();

          showScreen(
            "matchedScreen"
          );

          return;
        }

        /* الطلب ما زال يبحث */
        if (
          state === "searching" &&
          loadOrder()
        ) {

          updateMatchedScreen();
          updateWorkingScreen();

          showScreen(
            "searchingScreen"
          );

          startAcceptanceWatcher();

          return;
        }

        /* لا يوجد طلب */
        showScreen(
          "requestScreen"
        );

        return;
      }

      /* =====================
         OPERATOR LOGIN
      ===================== */

      if (
        selectedRole === "operator"
      ) {

        const state =
          getOrderState();

        /*
         إذا يوجد طلب عميل
         يظهر لصاحب المعدة مباشرة
        */
        if (
          (
            state === "searching" ||
            state === "accepted"
          ) &&
          loadOrder()
        ) {

          updateOperatorScreen();
          displayMyEquipment();

          showScreen(
            "operatorScreen"
          );

          return;
        }

        /*
         إذا لا يوجد طلب،
         يذهب لإضافة معدة
        */
        showScreen(
          "addEquipmentScreen"
        );
      }
    }
  );
}

/* =========================
   OPERATOR SCREEN
========================= */

function openOperatorScreen() {

  /*
   إعادة تحميل الطلب من التخزين
   قبل إظهاره لصاحب المعدة
  */
  loadOrder();

  updateOperatorScreen();
  displayMyEquipment();

  showScreen(
    "operatorScreen"
  );
}

/* =========================
   ACCEPT REQUEST
========================= */

const acceptRequestBtn =
  document.getElementById(
    "acceptRequestBtn"
  );

if (acceptRequestBtn) {

  acceptRequestBtn.addEventListener(
    "click",
    () => {

      /*
       تحميل طلب العميل مرة أخرى
      */
      if (!loadOrder()) {

        alert(
          "لا يوجد طلب عميل محفوظ"
        );

        return;
      }

      /*
       التأكد أن الطلب موجود
      */
      if (
        !order.location ||
        !order.equipment
      ) {

        alert(
          "بيانات طلب العميل غير مكتملة"
        );

        return;
      }

      /*
       حفظ الطلب المقبول
      */
      localStorage.setItem(
        "acceptedOrder",
        JSON.stringify({
          ...order,
          operatorName:
            "فهد القحطاني",
          operatorRating:
            "4.8"
        })
      );

      /*
       إعادة حفظ الطلب
       حتى لا يضيع
      */
      saveOrder();

      localStorage.setItem(
        "orderAccepted",
        "true"
      );

      setOrderState(
        "accepted"
      );

      updateMatchedScreen();
      updateWorkingScreen();

      alert(
        "تم قبول الطلب بنجاح 🚜"
      );

      /*
       صاحب المعدة يبقى في
       شاشة العمل
      */
      showScreen(
        "workingScreen"
      );
    }
  );
}

/* =========================
   REJECT
========================= */

const rejectRequestBtn =
  document.getElementById(
    "rejectRequestBtn"
  );

if (rejectRequestBtn) {

  rejectRequestBtn.addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        "acceptedOrder"
      );

      localStorage.removeItem(
        "orderAccepted"
      );

      setOrderState(
        "rejected"
      );

      alert(
        "تم رفض الطلب"
      );

      showScreen(
        "roleScreen"
      );
    }
  );
}

/* =========================
   EQUIPMENT
========================= */

const saveEquipmentBtn =
  document.getElementById(
    "saveEquipmentBtn"
  );

if (saveEquipmentBtn) {

  saveEquipmentBtn.addEventListener(
    "click",
    saveEquipment
  );
}

function saveEquipment() {

  const type =
    document
      .getElementById(
        "equipmentType"
      )
      ?.value;

  const model =
    document
      .getElementById(
        "equipmentModel"
      )
      ?.value.trim();

  const year =
    document
      .getElementById(
        "equipmentYear"
      )
      ?.value.trim();

  const city =
    document
      .getElementById(
        "equipmentCity"
      )
      ?.value.trim();

  const availability =
    document
      .getElementById(
        "equipmentAvailability"
      )
      ?.value;

  const imageInput =
    document.getElementById(
      "equipmentImage"
    );

  if (
    !type ||
    !model ||
    !year ||
    !city
  ) {

    alert(
      "فضلاً أكمل جميع بيانات المعدة"
    );

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

  const file =
    imageInput?.files[0];

  if (!file) {

    localStorage.setItem(
      "myEquipment",
      JSON.stringify(equipment)
    );

    alert(
      "تم حفظ المعدة بنجاح 🚜"
    );

    openOperatorScreen();

    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {

    const image =
      new Image();

    image.onload = () => {

      const maxWidth = 1000;

      let width =
        image.width;

      let height =
        image.height;

      if (
        width > maxWidth
      ) {

        height =
          Math.round(
            height *
            maxWidth /
            width
          );

        width =
          maxWidth;
      }

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        width;

      canvas.height =
        height;

      const ctx =
        canvas.getContext(
          "2d"
        );

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

        localStorage.setItem(
          "myEquipment",
          JSON.stringify(
            equipment
          )
        );

        alert(
          "تم حفظ المعدة بنجاح 🚜"
        );

        openOperatorScreen();

      } catch {

        alert(
          "الصورة كبيرة جدًا، حاول اختيار صورة أخرى"
        );
      }
    };

    image.src =
      reader.result;
  };

  reader.readAsDataURL(
    file
  );
}

function displayMyEquipment() {

  const saved =
    localStorage.getItem(
      "myEquipment"
    );

  if (!saved) return;

  try {

    const equipment =
      JSON.parse(saved);

    const type =
      document.getElementById(
        "myEquipmentType"
      );

    const model =
      document.getElementById(
        "myEquipmentModel"
      );

    const year =
      document.getElementById(
        "myEquipmentYear"
      );

    const city =
      document.getElementById(
        "myEquipmentCity"
      );

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
        equipment.availability ===
        "available"
          ? "متاحة الآن"
          : "غير متاحة";
    }

    if (image) {

      if (equipment.image) {

        image.src =
          equipment.image;

        image.style.display =
          "block";

      } else {

        image.removeAttribute(
          "src"
        );

        image.style.display =
          "none";
      }
    }

  } catch {

    console.log(
      "تعذر قراءة بيانات المعدة"
    );
  }
}

/* =========================
   MATCHED
========================= */

const trackingBtn =
  document.getElementById(
    "trackingBtn"
  );

if (trackingBtn) {

  trackingBtn.addEventListener(
    "click",
    () => {

      showScreen(
        "trackingScreen"
      );

      startTracking();
    }
  );
}

/* =========================
   CUSTOMER CALL
========================= */

const callBtn =
  document.getElementById(
    "callBtn"
  );

if (callBtn) {

  callBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "tel:0550000000";
    }
  );
}

/* =========================
   CHAT
========================= */

const chatBtn =
  document.getElementById(
    "chatBtn"
  );

if (chatBtn) {

  chatBtn.addEventListener(
    "click",
    () => {

      showScreen(
        "chatScreen"
      );

      setTimeout(() => {

        document
          .getElementById(
            "chatInput"
          )
          ?.focus();

      }, 100);
    }
  );
}

function sendChatMessage() {

  const input =
    document.getElementById(
      "chatInput"
    );

  const messages =
    document.getElementById(
      "chatMessages"
    );

  if (
    !input ||
    !messages
  ) {
    return;
  }

  const text =
    input.value.trim();

  if (!text) return;

  const message =
    document.createElement(
      "div"
    );

  message.className =
    "message sent";

  message.textContent =
    text;

  messages.appendChild(
    message
  );

  input.value = "";

  messages.scrollTop =
    messages.scrollHeight;
}

const sendChatBtn =
  document.getElementById(
    "sendChatBtn"
  );

if (sendChatBtn) {

  sendChatBtn.addEventListener(
    "click",
    sendChatMessage
  );
}

const chatInput =
  document.getElementById(
    "chatInput"
  );

if (chatInput) {

  chatInput.addEventListener(
    "keydown",
    e => {

      if (
        e.key === "Enter"
      ) {

        e.preventDefault();

        sendChatMessage();
      }
    }
  );
}

const backFromChatBtn =
  document.getElementById(
    "backFromChatBtn"
  );

if (backFromChatBtn) {

  backFromChatBtn.addEventListener(
    "click",
    () => {

      showScreen(
        "matchedScreen"
      );
    }
  );
}

/* =========================
   TRACKING
========================= */

function startTracking() {

  const marker =
    document.getElementById(
      "equipmentMarker"
    );

  const distance =
    document.getElementById(
      "distanceText"
    );

  const eta =
    document.getElementById(
      "etaText"
    );

  const status =
    document.getElementById(
      "trackingStatus"
    );

  if (
    !marker ||
    !distance ||
    !eta ||
    !status
  ) {
    return;
  }

  const steps = [
    [
      "18%",
      "55%",
      "2.4 كم",
      "8 دقائق"
    ],
    [
      "30%",
      "45%",
      "2.0 كم",
      "7 دقائق"
    ],
    [
      "42%",
      "40%",
      "1.5 كم",
      "5 دقائق"
    ],
    [
      "55%",
      "30%",
      "900 م",
      "3 دقائق"
    ],
    [
      "65%",
      "20%",
      "400 م",
      "1 دقيقة"
    ],
    [
      "75%",
      "12%",
      "0 م",
      "الآن"
    ]
  ];

  let index = 0;

  function move() {

    const step =
      steps[index];

    marker.style.top =
      step[0];

    marker.style.right =
      step[1];

    distance.textContent =
      step[2];

    eta.textContent =
      step[3];

    if (
      index ===
      steps.length - 1
    ) {

      status.textContent =
        "وصلت المعدة إلى موقعك";

      setTimeout(() => {

        showScreen(
          "arrivedScreen"
        );

      }, 1500);

      return;
    }

    index++;

    setTimeout(
      move,
      1400
    );
  }

  move();
}

/* =========================
   START WORK
========================= */

const startWorkBtn =
  document.getElementById(
    "startWorkBtn"
  );

if (startWorkBtn) {

  startWorkBtn.addEventListener(
    "click",
    () => {

      showScreen(
        "workingScreen"
      );

      if (
        selectedRole !==
        "customer"
      ) {
        return;
      }

      workStartTime =
        Date.now();

      clearInterval(
        timerInterval
      );

      updateTimer();

      timerInterval =
        setInterval(
          updateTimer,
          1000
        );

      clearInterval(
        workEndWatcher
      );

      workEndWatcher =
        setInterval(
          () => {

            if (
              localStorage.getItem(
                "workEnded"
              ) === "true"
            ) {

              clearInterval(
                workEndWatcher
              );

              clearInterval(
                timerInterval
              );

              const price =
                localStorage.getItem(
                  "finalPrice"
                );

              if (price) {

                const finalPrice =
                  document.getElementById(
                    "finalPrice"
                  );

                if (finalPrice) {

                  finalPrice.textContent =
                    `${price} ريال`;
                }
              }

              showScreen(
                "completedScreen"
              );
            }

          },
          1000
        );
    }
  );
}

function updateTimer() {

  if (!workStartTime) {
    return;
  }

  const elapsed =
    Math.floor(
      (
        Date.now() -
        workStartTime
      ) / 1000
    );

  const hours =
    Math.floor(
      elapsed / 3600
    );

  const minutes =
    Math.floor(
      (elapsed % 3600) / 60
    );

  const seconds =
    elapsed % 60;

  const timer =
    document.getElementById(
      "timer"
    );

  if (timer) {

    timer.textContent =
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;
  }
}

/* =========================
   OPERATOR CALL
========================= */

const callCustomerBtn =
  document.getElementById(
    "callCustomerBtn"
  );

if (callCustomerBtn) {

  callCustomerBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "tel:0550000000";
    }
  );
}

/* =========================
   END WORK
========================= */

const endWorkBtn =
  document.getElementById(
    "endWorkBtn"
  );

if (endWorkBtn) {

  endWorkBtn.addEventListener(
    "click",
    () => {

      clearInterval(
        timerInterval
      );

      clearInterval(
        workEndWatcher
      );

      const finalPrice =
        order.price || 1000;

      const priceElement =
        document.getElementById(
          "finalPrice"
        );

      if (priceElement) {

        priceElement.textContent =
          `${finalPrice} ريال`;
      }

      if (
        selectedRole ===
        "operator"
      ) {

        localStorage.setItem(
          "workEnded",
          "true"
        );

        localStorage.setItem(
          "finalPrice",
          finalPrice
        );

        setOrderState(
          "completed"
        );

        showScreen(
          "operatorCompletedScreen"
        );

      } else {

        showScreen(
          "completedScreen"
        );
      }
    }
  );
}

/* =========================
   PAYMENT
========================= */

document
  .querySelectorAll(
    ".payment-option"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".payment-option"
          )
          .forEach(item =>
            item.classList.remove(
              "selected"
            )
          );

        button.classList.add(
          "selected"
        );

        selectedPayment =
          button.dataset.payment;

        const confirm =
          document.getElementById(
            "confirmPaymentBtn"
          );

        if (confirm) {
          confirm.disabled =
            false;
        }
      }
    );
  });

const paymentBtn =
  document.getElementById(
    "paymentBtn"
  );

if (paymentBtn) {

  paymentBtn.addEventListener(
    "click",
    () => {

      showScreen(
        "paymentScreen"
      );
    }
  );
}

const confirmPaymentBtn =
  document.getElementById(
    "confirmPaymentBtn"
  );

if (confirmPaymentBtn) {

  confirmPaymentBtn.addEventListener(
    "click",
    () => {

      if (!selectedPayment) {
        return;
      }

      showScreen(
        "ratingScreen"
      );
    }
  );
}

/* =========================
   RATING
========================= */

document
  .querySelectorAll(
    ".stars button"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectedRating =
          Number(
            button.dataset.rating
          );

        document
          .querySelectorAll(
            ".stars button"
          )
          .forEach(star => {

            star.classList.toggle(
              "selected",
              Number(
                star.dataset.rating
              ) <=
              selectedRating
            );
          });

        const ratingBtn =
          document.getElementById(
            "ratingBtn"
          );

        if (ratingBtn) {
          ratingBtn.disabled =
            false;
        }
      }
    );
  });

const ratingBtn =
  document.getElementById(
    "ratingBtn"
  );

if (ratingBtn) {

  ratingBtn.addEventListener(
    "click",
    () => {

      showScreen(
        "thankYouScreen"
      );
    }
  );
}

/* =========================
   NEW REQUEST
========================= */

const newRequestBtn =
  document.getElementById(
    "newRequestBtn"
  );

if (newRequestBtn) {

  newRequestBtn.addEventListener(
    "click",
    () => {

      stopAcceptanceWatcher();

      clearInterval(
        timerInterval
      );

      clearInterval(
        workEndWatcher
      );

      [
        "currentOrder",
        "orderState",
        "acceptedOrder",
        "orderAccepted",
        "workEnded",
        "finalPrice"
      ].forEach(key =>
        localStorage.removeItem(
          key
        )
      );

      location.reload();
    }
  );
}

/* =========================
   BACK BUTTONS
========================= */

const backRoleBtn =
  document.getElementById(
    "backRoleBtn"
  );

if (backRoleBtn) {

  backRoleBtn.addEventListener(
    "click",
    () => {

      const phone =
        document.getElementById(
          "phoneInput"
        );

      const error =
        document.getElementById(
          "phoneError"
        );

      if (phone) {
        phone.value = "";
      }

      if (error) {
        error.textContent = "";
      }

      showScreen(
        "roleScreen"
      );
    }
  );
}

const backPhoneBtn =
  document.getElementById(
    "backPhoneBtn"
  );

if (backPhoneBtn) {

  backPhoneBtn.addEventListener(
    "click",
    () => {

      const otp =
        document.getElementById(
          "otpInput"
        );

      const error =
        document.getElementById(
          "otpError"
        );

      if (otp) {
        otp.value = "";
      }

      if (error) {
        error.textContent = "";
      }

      showScreen(
        "phoneScreen"
      );
    }
  );
}

/* =========================
   START
========================= */

displayMyEquipment();
