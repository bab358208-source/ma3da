alert("JavaScript يعمل");
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

document
  .getElementById("requestBtn")
  .addEventListener("click", () => {

    const location =
      document
        .getElementById("locationInput")
        .value
        .trim();

    const equipment =
      document.getElementById("equipmentSelect").value;

    const duration =
      document.getElementById("durationSelect").value;

    const operator =
      document.getElementById("operatorSelect").value;

    const notes =
      document
        .getElementById("notesInput")
        .value
        .trim();


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


    document.getElementById("matchedEquipment")
      .textContent = order.equipment;

    document.getElementById("matchedLocation")
      .textContent = order.location;

    document.getElementById("workingEquipment")
      .textContent = order.equipment;

    document.getElementById("workingLocation")
      .textContent = order.location;


    showScreen("searchingScreen");


    setTimeout(() => {

      showScreen("matchedScreen");

    }, 2500);

  });


/* ===============================
   TRACKING
================================ */

document
  .getElementById("trackingBtn")
  .addEventListener("click", () => {

    showScreen("trackingScreen");

    startTracking();

  });


function startTracking() {

  const marker =
    document.getElementById("equipmentMarker");

  const distance =
    document.getElementById("distanceText");

  const eta =
    document.getElementById("etaText");

  const status =
    document.getElementById("trackingStatus");


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

    distance.textContent =
      step.distance;

    eta.textContent =
      step.eta;


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


document
  .getElementById("startWorkBtn")
  .addEventListener("click", () => {

    showScreen("workingScreen");

    workStartTime = Date.now();

    updateTimer();

    timerInterval =
      setInterval(updateTimer, 1000);

  });


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


  document.getElementById("timer")
    .textContent = formatted;

}


/* ===============================
   END WORK
================================ */

document
  .getElementById("endWorkBtn")
  .addEventListener("click", () => {

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
                (
                  durationHours[order.duration] || 4
                )
              ) * extraHours
            )

          : minimumPrice

      );


    document.getElementById("finalPrice")
      .textContent =
      finalPrice + " ريال";


    showScreen("completedScreen");

  });


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


      document.getElementById(
        "confirmPaymentBtn"
      ).disabled = false;

    });

  });


document
  .getElementById("paymentBtn")
  .addEventListener("click", () => {

    showScreen("paymentScreen");

  });


document
  .getElementById("confirmPaymentBtn")
  .addEventListener("click", () => {

    if (!selectedPayment) return;

    showScreen("ratingScreen");

  });


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


      document.getElementById(
        "ratingBtn"
      ).disabled = false;

    });

  });


document
  .getElementById("ratingBtn")
  .addEventListener("click", () => {

    showScreen("thankYouScreen");

  });


/* ===============================
   NEW REQUEST
================================ */

document
  .getElementById("newRequestBtn")
  .addEventListener("click", () => {

    location.reload();

  });


/* ===============================
   OPERATOR SCREEN
================================ */
function openOperatorScreen() {
  showScreen("operatorScreen");
}



/* ===============================
   ACCEPT REQUEST
================================ */

document
  .getElementById("acceptRequestBtn")
  .addEventListener("click", () => {

    alert("تم قبول الطلب بنجاح 🚜");

    showScreen("matchedScreen");

  });


/* ===============================
   REJECT REQUEST
================================ */

document
  .getElementById("rejectRequestBtn")
  .addEventListener("click", () => {

    alert("تم رفض الطلب");

    showScreen("roleScreen");

  });
/* ===============================
   PHONE LOGIN
================================ */

let selectedRole = "";


/* العميل */

document
  .getElementById("customerRoleBtn")
  .addEventListener("click", () => {

    selectedRole = "customer";

    document.getElementById("phoneRoleText").textContent =
      "تسجيل الدخول كعميل";

    showScreen("phoneScreen");

  });


/* صاحب المعدة */

document
  .getElementById("operatorRoleBtn")
  .addEventListener("click", () => {

    selectedRole = "operator";

    document.getElementById("phoneRoleText").textContent =
      "تسجيل الدخول كصاحب معدة / مشغل";

    showScreen("phoneScreen");

  });


/* إرسال رمز التحقق */

document
  .getElementById("sendCodeBtn")
  .addEventListener("click", () => {

    const phone =
      document
        .getElementById("phoneInput")
        .value
        .trim();

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


/* التحقق من الرمز */

document
  .getElementById("verifyCodeBtn")
  .addEventListener("click", () => {

    const code =
      document
        .getElementById("otpInput")
        .value
        .trim();

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

    }
if (selectedRole === "operator") {

  showScreen("addEquipmentScreen");

}

    

    

  });


/* الرجوع لاختيار الدور */

document
  .getElementById("backRoleBtn")
  .addEventListener("click", () => {

    document.getElementById("phoneInput").value = "";

    document.getElementById("phoneError").textContent = "";

    showScreen("roleScreen");

  });


/* تغيير رقم الجوال */

document
  .getElementById("backPhoneBtn")
  .addEventListener("click", () => {

    document.getElementById("otpInput").value = "";

    document.getElementById("otpError").textContent = "";

    showScreen("phoneScreen");

  });
/* ===============================
   SAVE EQUIPMENT
================================ */

document
  .getElementById("saveEquipmentBtn")
  .addEventListener("click", () => {

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

if (imageFile) {

  const reader = new FileReader();

  reader.onload = function () {

    equipment.image = reader.result;

    localStorage.setItem(
      "myEquipment",
      JSON.stringify(equipment)
    );

    alert("تم حفظ المعدة بنجاح 🚜");

    openOperatorScreen();

  };

  reader.readAsDataURL(imageFile);

} else {

  localStorage.setItem(
    "myEquipment",
    JSON.stringify(equipment)
  );

  alert("تم حفظ المعدة بنجاح 🚜");

  openOperatorScreen();

}


    localStorage.setItem(
      "myEquipment",
      JSON.stringify(equipment)
    );


    alert("تم حفظ المعدة بنجاح 🚜");


    openOperatorScreen();

  });
/* ===============================
   DISPLAY MY EQUIPMENT
================================ */
function displayMyEquipment() {

  const saved = localStorage.getItem("myEquipment");

  if (!saved) return;

  const equipment = JSON.parse(saved);

  const image = document.getElementById("myEquipmentImage");

  if (image && equipment.image) {
    image.src = equipment.image;
    image.style.display = "block";
  }

}
