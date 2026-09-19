const screens = document.querySelectorAll(".screen");

function showScreen(id) {

  screens.forEach(screen => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(id);

  if (target) {
    target.classList.add("active");
    window.scrollTo(0, 0);
  }
}


/* ===============================
   ORDER DATA
================================ */

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

function calculatePrice() {

  const hourly =
    hourlyPrices[order.equipment] || 250;

  const hours =
    durationHours[order.duration] || 4;

  return hourly * hours;
}


/* ===============================
   CUSTOMER REQUEST
================================ */

const requestBtn =
  document.getElementById("requestBtn");

if (requestBtn) {

  requestBtn.addEventListener("click", () => {

    const location =
      document.getElementById("locationInput").value.trim();

    const equipment =
      document.getElementById("equipmentSelect").value;

    const duration =
      document.getElementById("durationSelect").value;

    const operator =
      document.getElementById("operatorSelect").value;

    const notes =
      document.getElementById("notesInput").value.trim();

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

    order.location = location;
    order.equipment = equipment;
    order.duration = duration;
    order.operator = operator;
    order.notes = notes;
    order.price = calculatePrice();

    document.getElementById("matchedEquipment").textContent =
      order.equipment;

    document.getElementById("matchedLocation").textContent =
      order.location;

    document.getElementById("workingEquipment").textContent =
      order.equipment;

    document.getElementById("workingLocation").textContent =
      order.location;

    showScreen("searchingScreen");

const acceptanceCheck = setInterval(() => {

  const accepted =
    localStorage.getItem("orderAccepted");

  if (accepted === "true") {

    clearInterval(acceptanceCheck);

    document.getElementById("matchedEquipment").textContent =
      order.equipment;

    document.getElementById("matchedLocation").textContent =
      order.location;

    showScreen("matchedScreen");

  }

}, 1000);

  });

}


/* ===============================
   TRACKING
================================ */

const trackingBtn =
  document.getElementById("trackingBtn");

if (trackingBtn) {

  trackingBtn.addEventListener("click", () => {

    showScreen("trackingScreen");

    startTracking();

  });

}


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

    {
      top: "18%",
      right: "55%",
      distance: "2.4 كم",
      eta: "8 دقائق"
    },

    {
      top: "30%",
      right: "45%",
      distance: "2.0 كم",
      eta: "7 دقائق"
    },

    {
      top: "42%",
      right: "40%",
      distance: "1.5 كم",
      eta: "5 دقائق"
    },

    {
      top: "55%",
      right: "30%",
      distance: "900 م",
      eta: "3 دقائق"
    },

    {
      top: "65%",
      right: "20%",
      distance: "400 م",
      eta: "1 دقيقة"
    },

    {
      top: "75%",
      right: "12%",
      distance: "0 م",
      eta: "الآن"
    }

  ];

  let index = 0;

  function move() {

    const step = steps[index];

    marker.style.top = step.top;
    marker.style.right = step.right;

    distance.textContent = step.distance;
    eta.textContent = step.eta;

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


/* ===============================
   START WORK
================================ */

let workStartTime = null;
let timerInterval = null;

const startWorkBtn =
  document.getElementById("startWorkBtn");

if (startWorkBtn) {

  startWorkBtn.addEventListener("click", () => {

    showScreen("workingScreen");

    if (selectedRole === "customer") {

      workStartTime = Date.now();

      updateTimer();

      clearInterval(timerInterval);

      timerInterval =
        setInterval(updateTimer, 1000);

    }

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

  const formatted =
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");

  const timer =
    document.getElementById("timer");

  if (timer) {
    timer.textContent = formatted;
  }
}


/* ===============================
   END WORK
================================ */

const endWorkBtn =
  document.getElementById("endWorkBtn");

if (endWorkBtn) {

  endWorkBtn.addEventListener("click", () => {

    clearInterval(timerInterval);

    const elapsed =
      workStartTime
        ? Math.floor(
            (Date.now() - workStartTime) / 1000
          )
        : 0;

    const minimumPrice =
      order.price || 1000;

    const extraHours =
      Math.floor(elapsed / 3600);

    const finalPrice =
      Math.max(

        minimumPrice,

        extraHours > 0

          ? Math.round(
              (
                minimumPrice /
                (durationHours[order.duration] || 4)
              ) * extraHours
            )

          : minimumPrice

      );

    const finalPriceElement =
      document.getElementById("finalPrice");

    if (finalPriceElement) {
      finalPriceElement.textContent =
        finalPrice + " ريال";
    }

    if (selectedRole === "operator") {

  localStorage.setItem("workEnded", "true");
localStorage.setItem("finalPrice", finalPrice);
  showScreen("operatorCompletedScreen");

} else {

  showScreen("completedScreen");

}

  });

}


/* ===============================
   PAYMENT
================================ */

let selectedPayment = "";

document
  .querySelectorAll(".payment-option")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".payment-option")
        .forEach(item => {
          item.classList.remove("selected");
        });

      button.classList.add("selected");

      selectedPayment =
        button.dataset.payment;

      const confirmButton =
        document.getElementById("confirmPaymentBtn");

      if (confirmButton) {
        confirmButton.disabled = false;
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


/* ===============================
   RATING
================================ */

let selectedRating = 0;

document
  .querySelectorAll(".stars button")
  .forEach(button => {

    button.addEventListener("click", () => {

      selectedRating =
        Number(button.dataset.rating);

      document
        .querySelectorAll(".stars button")
        .forEach(star => {

          const value =
            Number(star.dataset.rating);

          star.classList.toggle(
            "selected",
            value <= selectedRating
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


/* ===============================
   NEW REQUEST
================================ */

const newRequestBtn =
  document.getElementById("newRequestBtn");

if (newRequestBtn) {

  newRequestBtn.addEventListener("click", () => {
    location.reload();
  });

}


/* ===============================
   OPERATOR SCREEN
================================ */

function openOperatorScreen() {

  showScreen("operatorScreen");

  displayMyEquipment();

}


/* ===============================
   ACCEPT REQUEST
================================ */

const acceptRequestBtn =
  document.getElementById("acceptRequestBtn");

if (acceptRequestBtn) {

 acceptRequestBtn.addEventListener("click", () => {

  localStorage.setItem("orderAccepted", "true");

  alert("تم قبول الطلب بنجاح 🚜");

  showScreen("workingScreen");

}); 

}


/* ===============================
   REJECT REQUEST
================================ */

const rejectRequestBtn =
  document.getElementById("rejectRequestBtn");

if (rejectRequestBtn) {

  rejectRequestBtn.addEventListener("click", () => {

    alert("تم رفض الطلب");

    showScreen("roleScreen");

  });

}


/* ===============================
   PHONE LOGIN
================================ */

let selectedRole = "";


/* العميل */

const customerRoleBtn =
  document.getElementById("customerRoleBtn");

if (customerRoleBtn) {

  customerRoleBtn.addEventListener("click", () => {

    selectedRole = "customer";

    document.getElementById("phoneRoleText").textContent =
      "تسجيل الدخول كعميل";

    showScreen("phoneScreen");

  });

}


/* صاحب المعدة */

const operatorRoleBtn =
  document.getElementById("operatorRoleBtn");

if (operatorRoleBtn) {

  operatorRoleBtn.addEventListener("click", () => {

    selectedRole = "operator";

    document.getElementById("phoneRoleText").textContent =
      "تسجيل الدخول كصاحب معدة / مشغل";

    showScreen("phoneScreen");

  });

}


/* إرسال رمز التحقق */

const sendCodeBtn =
  document.getElementById("sendCodeBtn");

if (sendCodeBtn) {

  sendCodeBtn.addEventListener("click", () => {

    const phone =
      document.getElementById("phoneInput").value.trim();

    const error =
      document.getElementById("phoneError");

    if (!/^5\d{8}$/.test(phone)) {

      error.textContent =
        "أدخل رقم جوال سعودي صحيح يبدأ بـ 5";

      return;
    }

    error.textContent = "";

    document.getElementById("otpText").textContent =
      "أدخل رمز التحقق المرسل إلى +966 " + phone;

    showScreen("otpScreen");

    alert("رمز التحقق التجريبي هو: 1234");

  });

}


/* التحقق من الرمز */

const verifyCodeBtn =
  document.getElementById("verifyCodeBtn");

if (verifyCodeBtn) {

  verifyCodeBtn.addEventListener("click", () => {

    const code =
      document.getElementById("otpInput").value.trim();

    const error =
      document.getElementById("otpError");

    if (code !== "1234") {

      error.textContent =
        "رمز التحقق غير صحيح";

      return;
    }

    error.textContent = "";

    if (selectedRole === "customer") {

      showScreen("requestScreen");

    } else if (selectedRole === "operator") {

      showScreen("addEquipmentScreen");

    }

  });

}


/* الرجوع لاختيار الدور */

const backRoleBtn =
  document.getElementById("backRoleBtn");

if (backRoleBtn) {

  backRoleBtn.addEventListener("click", () => {

    document.getElementById("phoneInput").value = "";

    document.getElementById("phoneError").textContent = "";

    showScreen("roleScreen");

  });

}


/* تغيير رقم الجوال */

const backPhoneBtn =
  document.getElementById("backPhoneBtn");

if (backPhoneBtn) {

  backPhoneBtn.addEventListener("click", () => {

    document.getElementById("otpInput").value = "";

    document.getElementById("otpError").textContent = "";

    showScreen("phoneScreen");

  });

}


/* ===============================
   SAVE EQUIPMENT
================================ */

const saveEquipmentBtn =
  document.getElementById("saveEquipmentBtn");

if (saveEquipmentBtn) {

  saveEquipmentBtn.addEventListener("click", saveEquipment);

}


function saveEquipment() {

  const type =
    document.getElementById("equipmentType").value;

  const model =
    document.getElementById("equipmentModel").value.trim();

  const year =
    document.getElementById("equipmentYear").value.trim();

  const city =
    document.getElementById("equipmentCity").value.trim();

  const availability =
    document.getElementById("equipmentAvailability").value;

  if (!type || !model || !year || !city) {

    alert("فضلاً أكمل جميع بيانات المعدة");

    return;
  }

  const imageInput =
    document.getElementById("equipmentImage");

  const imageFile =
    imageInput.files[0];

  const equipment = {
    type: type,
    model: model,
    year: year,
    city: city,
    availability: availability,
    image: ""
  };


  /* بدون صورة */

  if (!imageFile) {

    try {

      localStorage.setItem(
        "myEquipment",
        JSON.stringify(equipment)
      );

      alert("تم حفظ المعدة بنجاح 🚜");

      openOperatorScreen();

    } catch (error) {

      console.error(error);

      alert("حدث خطأ أثناء حفظ بيانات المعدة");

    }

    return;
  }


  /* مع صورة */

  const reader =
    new FileReader();

  reader.onload = function () {

    try {

      const image =
        new Image();

      image.onload = function () {

        const maxWidth = 1000;

        let width = image.width;
        let height = image.height;

        if (width > maxWidth) {

          height =
            Math.round(
              height * (maxWidth / width)
            );

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

          localStorage.setItem(
            "myEquipment",
            JSON.stringify(equipment)
          );

          alert("تم حفظ المعدة بنجاح 🚜");

          openOperatorScreen();

        } catch (error) {

          console.error(error);

          alert(
            "الصورة كبيرة جدًا، حاول اختيار صورة أخرى"
          );

        }

      };

      image.onerror = function () {

        alert("تعذر قراءة صورة المعدة");

      };

      image.src = reader.result;

    } catch (error) {

      console.error(error);

      alert("حدث خطأ أثناء معالجة الصورة");

    }

  };

  reader.onerror = function () {

    alert("تعذر قراءة الصورة");

  };

  reader.readAsDataURL(imageFile);

}


/* ===============================
   DISPLAY MY EQUIPMENT
================================ */

function displayMyEquipment() {

  const saved =
    localStorage.getItem("myEquipment");

  if (!saved) {
    return;
  }

  let equipment;

  try {

    equipment =
      JSON.parse(saved);

  } catch (error) {

    console.error(error);

    return;
  }


  const type =
    document.getElementById("myEquipmentType");

  const model =
    document.getElementById("myEquipmentModel");

  const year =
    document.getElementById("myEquipmentYear");

  const city =
    document.getElementById("myEquipmentCity");

  const availability =
    document.getElementById("myEquipmentAvailability");

  const image =
    document.getElementById("myEquipmentImage");


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

      image.src =
        equipment.image;

      image.style.display =
        "block";

    } else {

      image.removeAttribute("src");

      image.style.display =
        "none";

    }

  }

}


/* ===============================
   LOAD SAVED EQUIPMENT
================================ */

displayMyEquipment();
