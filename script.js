console.log("MA3DA SCRIPT LOADED");

const screens =
  document.querySelectorAll(".screen");
 
function showScreen(id){

  screens.forEach(
    s=>s.classList.remove("active")
  );

  const screen =
    document.getElementById(id);

  if(screen){

    screen.classList.add("active");

    window.scrollTo(0,0);

  }

}

/* STATE */

let selectedRole="";

let workStartTime=null;

let timerInterval=null;

let acceptanceWatcher=null;

let selectedPayment="";

let selectedRating=0;

let order={
  location:"",
  equipment:"",
  duration:"",
  operator:"",
  notes:"",
  price:0
};

const hourlyPrices={

  "بوكلين":250,
  "شيول":220,
  "قلاب":180,
  "كرين":350,
  "حفار":250,
  "بلدوزر":300

};

const durationHours={

  "ساعة واحدة":1,
  "4 ساعات":4,
  "8 ساعات":8,
  "يوم كامل":10

};

/* ORDER */

async function saveOrder(){

  console.log(
    "بدء حفظ الطلب في Firebase..."
  );

  /*
    ننتظر Firebase بشكل صريح.
  */

  try{

    if(window.ma3daFirebaseReady){

      await window.ma3daFirebaseReady;

    }

  }catch(error){

    console.error(
      "Firebase لم يصبح جاهزًا:",
      error
    );

    alert(
      "تعذر تجهيز Firebase. أعد تحميل الصفحة."
    );

    return false;

  }

  const user =
    window.ma3daGetCurrentUser
      ? await window.ma3daGetCurrentUser()
      : window.ma3daAuth?.currentUser;

  console.log(
    "المستخدم الحالي:",
    user ? user.uid : "لا يوجد"
  );

  if(!user){

    alert(
      "لا يوجد مستخدم مسجل الدخول"
    );

    console.error(
      "لا يوجد مستخدم مسجل"
    );

    return false;

  }

  if(!window.ma3daDB){

    alert(
      "Firebase غير متصل"
    );

    console.error(
      "ma3daDB غير موجود"
    );

    return false;

  }

  if(
    !window.ma3daAddDoc ||
    !window.ma3daCollection
  ){

    alert(
      "أدوات حفظ الطلب غير جاهزة"
    );

    console.error(
      "ma3daAddDoc أو ma3daCollection غير موجود"
    );

    return false;

  }

  try{

    const requestsCollection =
      window.ma3daCollection(
        window.ma3daDB,
        "requests"
      );

    console.log(
      "تم تجهيز collection requests"
    );

    const requestData = {

      location:
        order.location || "",

      equipment:
        order.equipment || "",

      duration:
        order.duration || "",

      operator:
        order.operator || "",

      notes:
        order.notes || "",

      price:
        Number(order.price) || 0,

      customerId:
        user.uid,

      customerEmail:
        user.email || "",

      status:
        "searching",

      createdAt:
        Date.now()

    };

    console.log(
      "بيانات الطلب:",
      requestData
    );

    const ref =
      await window.ma3daAddDoc(
        requestsCollection,
        requestData
      );

    if(!ref || !ref.id){

      console.error(
        "Firebase لم يرجع رقم الطلب"
      );

      alert(
        "لم يتم تأكيد حفظ الطلب في Firebase"
      );

      return false;

    }

    /*
      نحفظ الطلب محليًا فقط بعد نجاح Firebase.
    */

    localStorage.setItem(
      "currentOrder",
      JSON.stringify(order)
    );

    localStorage.setItem(
      "currentRequestId",
      ref.id
    );

    console.log(
      "تم حفظ طلب العميل في Firebase بنجاح:",
      ref.id
    );

    return true;

  }catch(error){

    console.error(
      "تعذر حفظ طلب العميل في Firebase:",
      error
    );

    console.error(
      "Firebase error code:",
      error?.code
    );

    console.error(
      "Firebase error message:",
      error?.message
    );

    if(
      error?.code ===
      "permission-denied"
    ){

      alert(
        "Firebase رفض حفظ الطلب بسبب صلاحيات Firestore.\n\n" +
        "الكود: permission-denied"
      );

    }else{

      alert(
        "خطأ Firebase:\n" +
        (error?.code || "unknown") +
        "\n" +
        (error?.message || "تعذر حفظ الطلب")
      );

    }

    return false;

  }

}

function setOrderState(state){

  localStorage.setItem(
    "orderState",
    state
  );

}

function getOrderState(){

  return (
    localStorage.getItem(
      "orderState"
    ) || ""
  );

}

/* LOAD ORDER */

function loadOrder(){

  const saved =
    localStorage.getItem(
      "currentOrder"
    );

  if(!saved){

    return false;

  }

  try{

    order =
      JSON.parse(saved);

    return true;

  }catch(error){

    console.error(
      "تعذر تحميل الطلب:",
      error
    );

    localStorage.removeItem(
      "currentOrder"
    );

    return false;

  }

}

function calculatePrice(){

  return (
    hourlyPrices[order.equipment] || 250
  ) *
  (
    durationHours[order.duration] || 4
  );

}

/* SCREEN DATA */

function updateMatchedScreen(){

  const equipment =
    document.getElementById(
      "matchedEquipment"
    );

  const location =
    document.getElementById(
      "matchedLocation"
    );

  if(equipment)
    equipment.textContent =
      order.equipment
        ? `${order.equipment} - CAT 320`
        : "بوكلين - CAT 320";

  if(location)
    location.textContent =
      order.location ||
      "موقع العميل";

}

function updateWorkingScreen(){

  const equipment =
    document.getElementById(
      "workingEquipment"
    );

  const location =
    document.getElementById(
      "workingLocation"
    );

  if(equipment)
    equipment.textContent =
      order.equipment ||
      "بوكلين";

  if(location)
    location.textContent =
      order.location ||
      "موقع العميل";

}

function updateOperatorScreen(){

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

  if(equipment)
    equipment.textContent =
      order.equipment ||
      "بوكلين";

  if(location)
    location.textContent =
      order.location ||
      "موقع العميل";

  if(duration)
    duration.textContent =
      order.duration ||
      "4 ساعات";

  if(price)
    price.textContent =
      `${order.price || 1000} ريال`;

  if(notes)
    notes.textContent =
      order.notes ||
      "لا توجد ملاحظات";

}

/* CUSTOMER REQUEST */

const requestBtn =
  document.getElementById(
    "requestBtn"
  );

if(requestBtn){

  requestBtn.addEventListener(
    "click",
    async()=>{

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

      if(!location)
        return alert(
          "اكتب موقع العمل"
        );

      if(!equipment)
        return alert(
          "اختر نوع المعدة"
        );

      if(!duration)
        return alert(
          "اختر مدة العمل"
        );

      order = {

        location,
        equipment,
        duration,
        operator,
        notes,
        price:0

      };

      order.price =
        calculatePrice();

      const saved =
        await saveOrder();

      if(!saved){

        console.error(
          "تم إيقاف الطلب لأن الحفظ في Firebase فشل."
        );

        return;

      }

      [
        "acceptedOrder",
        "workEnded",
        "finalPrice",
        "orderAccepted"
      ].forEach(
        key =>
          localStorage.removeItem(key)
      );

      setOrderState(
        "searching"
      );

      selectedRole =
        "customer";

      localStorage.setItem(
        "selectedRole",
        "customer"
      );

      updateMatchedScreen();

      updateWorkingScreen();

      updateOperatorScreen();

      showScreen(
        "searchingScreen"
      );

      startAcceptanceWatcher();

    }
  );

}

/* ACCEPTANCE WATCHER */

function stopAcceptanceWatcher(){

  if(acceptanceWatcher){

    clearInterval(
      acceptanceWatcher
    );

    acceptanceWatcher=null;

  }

}

function startAcceptanceWatcher(){

  stopAcceptanceWatcher();

  acceptanceWatcher =
    setInterval(
      async()=>{

        if(
          selectedRole !==
          "customer"
        )
          return;

        const requestId =
          localStorage.getItem(
            "currentRequestId"
          );

        if(
          !requestId ||
          !window.ma3daDB ||
          !window.ma3daDoc ||
          !window.ma3daGetDoc
        )
          return;

        try{

          const requestRef =
            window.ma3daDoc(
              window.ma3daDB,
              "requests",
              requestId
            );

          const snapshot =
            await window.ma3daGetDoc(
              requestRef
            );

          if(!snapshot.exists())
            return;

          const data =
            snapshot.data();

          /* ACCEPTED */

          if(
            data.status ===
            "accepted"
          ){

            order = {

              location:
                data.location || "",

              equipment:
                data.equipment || "",

              duration:
                data.duration || "",

              operator:
                data.operator || "",

              notes:
                data.notes || "",

              price:
                Number(
                  data.price || 0
                )

            };

            localStorage.setItem(
              "currentOrder",
              JSON.stringify(order)
            );

            localStorage.setItem(
              "acceptedOrder",
              JSON.stringify({

                ...order,

                operatorName:
                  data.operatorName ||
                  "فهد القحطاني",

                operatorRating:
                  data.operatorRating ||
                  "4.8"

              })
            );

            localStorage.setItem(
              "orderAccepted",
              "true"
            );

            setOrderState(
              "accepted"
            );

            updateMatchedScreen();

            updateWorkingScreen();

            if(
              document.getElementById(
                "searchingScreen"
              )?.classList.contains(
                "active"
              )
            ){

              showScreen(
                "matchedScreen"
              );

            }

          }

          /* ARRIVED */

          if(
            data.status ===
            "arrived"
          ){

            order = {

              location:
                data.location || "",

              equipment:
                data.equipment || "",

              duration:
                data.duration || "",

              operator:
                data.operator || "",

              notes:
                data.notes || "",

              price:
                Number(
                  data.price || 0
                )

            };

            localStorage.setItem(
              "currentOrder",
              JSON.stringify(order)
            );

            const arrivedEquipment =
              document.getElementById(
                "arrivedCustomerEquipment"
              );

            const arrivedLocation =
              document.getElementById(
                "arrivedCustomerLocation"
              );

            if(arrivedEquipment){

              arrivedEquipment.textContent =
                data.equipment ||
                "المعدة";

            }

            if(arrivedLocation){

              arrivedLocation.textContent =
                data.location ||
                "موقعك";

            }

            showScreen(
              "arrivedCustomerScreen"
            );

          }

          /* WORKING */

          if(
            data.status ===
            "working"
          ){

            console.log(
              "العمل بدأ عند صاحب المعدة"
            );

            setOrderState(
              "working"
            );

            if(data.workStartedAt){

              workStartTime =
                data.workStartedAt;

            }else if(!workStartTime){

              workStartTime =
                Date.now();

            }

            updateWorkingScreen();

            showScreen(
              "workingScreen"
            );

            clearInterval(
              timerInterval
            );

            timerInterval =
              setInterval(
                updateTimer,
                1000
              );

            updateTimer();

          }
/* COMPLETED */

if(
  data.status ===
  "completed"
){

  clearInterval(
    timerInterval
  );

  setOrderState(
    "completed"
  );

  showScreen(
    "completedScreen"
  );

}
          /* REJECTED */

          if(
            data.status ===
            "rejected"
          ){

            stopAcceptanceWatcher();

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
              "تم رفض طلبك من صاحب المعدة"
            );

            showScreen(
              "roleScreen"
            );

          }

        }catch(error){

          console.error(
            "تعذر متابعة حالة الطلب:",
            error
          );

        }

      },
      1000
    );

}
/* ROLE */

const customerRoleBtn =
  document.getElementById(
    "customerRoleBtn"
  );

if(customerRoleBtn){

  customerRoleBtn.addEventListener(
    "click",
    ()=>{

      selectedRole =
        "customer";

      localStorage.setItem(
        "selectedRole",
        "customer"
      );

      const text =
        document.getElementById(
          "phoneRoleText"
        );

      if(text)
        text.textContent =
          "تسجيل الدخول كعميل";

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

if(operatorRoleBtn){

  operatorRoleBtn.addEventListener(
    "click",
    ()=>{

      selectedRole =
        "operator";

      localStorage.setItem(
        "selectedRole",
        "operator"
      );

      stopAcceptanceWatcher();

      const text =
        document.getElementById(
          "phoneRoleText"
        );

      if(text)
        text.textContent =
          "تسجيل الدخول كصاحب معدة / مشغل";

      showScreen(
        "phoneScreen"
      );

    }
  );

}

/* EMAIL LOGIN */

const emailLoginBtn =
  document.getElementById(
    "sendCodeBtn"
  );

const createAccountBtn =
  document.getElementById(
    "createAccountBtn"
  );

const forgotPasswordBtn =
  document.getElementById(
    "forgotPasswordBtn"
  );

function getEmailData(){

  return {

    email:
      document
        .getElementById(
          "emailInput"
        )
        ?.value.trim(),

    password:
      document
        .getElementById(
          "passwordInput"
        )
        ?.value,

    error:
      document.getElementById(
        "emailError"
      )

  };

}

/* نسيان كلمة المرور */

if(forgotPasswordBtn){

  forgotPasswordBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "forgotPasswordScreen"
      );

    }
  );

}

/* إرسال رابط استعادة كلمة المرور */

const sendResetPasswordBtn =
  document.getElementById(
    "sendResetPasswordBtn"
  );

if(sendResetPasswordBtn){

  sendResetPasswordBtn.addEventListener(
    "click",
    async()=>{

      const resetEmail =
        document.getElementById(
          "resetEmail"
        );

      const email =
        resetEmail
          ?.value
          .trim();

      if(!email){

        alert(
          "أدخل بريدك الإلكتروني أولاً"
        );

        if(resetEmail)
          resetEmail.focus();

        return;

      }

      if(
        typeof window.ma3daSendPasswordResetEmail !==
        "function"
      ){

        alert(
          "Firebase لم يجهز بعد، أعد تحميل الصفحة"
        );

        return;

      }

      sendResetPasswordBtn.disabled =
        true;

      sendResetPasswordBtn.textContent =
        "جاري الإرسال...";

      try{

        const result =
          await window.ma3daSendPasswordResetEmail(
            email
          );

        if(result === true){

          alert(
            "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني 📧"
          );

        }

      }catch(errorObject){

        console.error(
          "خطأ في استعادة كلمة المرور:",
          errorObject
        );

        if(
          errorObject?.code ===
          "auth/user-not-found"
        ){

          alert(
            "لا يوجد حساب بهذا البريد الإلكتروني"
          );

        }else if(
          errorObject?.code ===
          "auth/invalid-email"
        ){

          alert(
            "البريد الإلكتروني غير صحيح"
          );

        }else{

          alert(
            errorObject?.message ||
            "تعذر إرسال رابط إعادة تعيين كلمة المرور"
          );

        }

      }finally{

        sendResetPasswordBtn.disabled =
          false;

        sendResetPasswordBtn.textContent =
          "إرسال رابط الاستعادة";

      }

    }
  );

}

/* العودة من صفحة استعادة كلمة المرور */

const backFromForgotPasswordBtn =
  document.getElementById(
    "backFromForgotPasswordBtn"
  );

if(backFromForgotPasswordBtn){

  backFromForgotPasswordBtn.addEventListener(
    "click",
    ()=>{

      const resetEmail =
        document.getElementById(
          "resetEmail"
        );

      if(resetEmail)
        resetEmail.value = "";

      showScreen(
        "phoneScreen"
      );

    }
  );

}
/* فتح صفحة صاحب المعدة حسب وجود معدة */

async function openOperatorAfterLogin(){

  const user =
    window.ma3daGetCurrentUser
      ? await window.ma3daGetCurrentUser()
      : window.ma3daAuth?.currentUser;

  if(!user){

    alert(
      "تعذر استعادة تسجيل الدخول"
    );

    showScreen(
      "phoneScreen"
    );

    return;

  }

  if(!window.ma3daDB){

    alert(
      "Firebase غير متصل"
    );

    return;

  }

  try{

    const ref =
      window.ma3daDoc(
        window.ma3daDB,
        "equipment",
        user.uid
      );

    const snapshot =
      await window.ma3daGetDoc(
        ref
      );

    if(snapshot.exists()){

      await displayMyEquipment();

      await loadLatestCustomerRequest();

      showScreen(
        "operatorScreen"
      );

    }else{

      showScreen(
        "addEquipmentScreen"
      );

    }

  }catch(error){

    console.error(
      "خطأ في فحص المعدة:",
      error
    );

    alert(
      "تعذر تحميل بيانات المعدة"
    );

  }

}
if(emailLoginBtn){

  emailLoginBtn.addEventListener(
    "click",
    async()=>{

      const {
        email,
        password,
        error
      } =
        getEmailData();

      if(!email || !password){

        if(error)
          error.textContent =
            "أدخل البريد الإلكتروني وكلمة المرور";

        return;

      }

      if(error)
        error.textContent = "";

      if(
        typeof window.ma3daLogin !==
        "function"
      ){

        if(error)
          error.textContent =
            "Firebase لم يجهز بعد، أعد تحميل الصفحة";

        console.error(
          "ma3daLogin غير موجود"
        );

        return;

      }

      try{

        const user =
          await window.ma3daLogin(
            email,
            password
          );

        if(!user)
          return;

        console.log(
          "تم تسجيل الدخول بنجاح:",
          user.uid
        );

        localStorage.setItem(
          "selectedRole",
          selectedRole
        );

        if(
          selectedRole ===
          "customer"
        ){

          showScreen(
            "requestScreen"
          );

          return;

        }

        if(
          selectedRole ===
          "operator"
        ){

          await openOperatorAfterLogin();

        }

      }catch(loginError){

        console.error(
          "خطأ داخل تسجيل الدخول:",
          loginError
        );

        if(error){

          error.textContent =
            loginError?.message ||
            "تعذر تسجيل الدخول";

        }

      }

    }
  );

}

/* CREATE ACCOUNT */

if(createAccountBtn){

  createAccountBtn.addEventListener(
    "click",
    async()=>{

      const {
        email,
        password,
        error
      } =
        getEmailData();

      if(!email || !password){

        if(error)
          error.textContent =
            "أدخل البريد الإلكتروني وكلمة المرور";

        return;

      }

      if(password.length < 6){

        if(error)
          error.textContent =
            "كلمة المرور يجب أن تكون 6 أحرف أو أكثر";

        return;

      }

      if(error)
        error.textContent = "";

      if(
        typeof window.ma3daCreateAccount !==
        "function"
      ){

        if(error)
          error.textContent =
            "Firebase لم يجهز بعد، أعد تحميل الصفحة";

        console.error(
          "ma3daCreateAccount غير موجود"
        );

        return;

      }

      const user =
        await window.ma3daCreateAccount(
          email,
          password
        );

      if(!user)
        return;

      console.log(
        "تم إنشاء الحساب بنجاح:",
        user.uid
      );

      /*
        تم إرسال رابط التحقق من Firebase
      */

      alert(
        "تم إنشاء الحساب بنجاح ✅\n\n" +
        "تم إرسال رابط التحقق إلى بريدك الإلكتروني 📧\n\n" +
        "افتح البريد واضغط على رابط التحقق، ثم ارجع وسجّل الدخول."
      );

      /*
        نخرج المستخدم من شاشة الحساب الجديد
        حتى يقوم بتأكيد البريد ثم تسجيل الدخول.
      */

      if(window.ma3daAuth){

        try{

          const {
            signOut
          } =
            await import(
              "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"
            );

          await signOut(
            window.ma3daAuth
          );

        }catch(signOutError){

          console.error(
            "تعذر تسجيل الخروج بعد إنشاء الحساب:",
            signOutError
          );

        }

      }

      showScreen(
        "phoneScreen"
      );

    }
  );

}

/* OPERATOR */

async function openOperatorScreen(){

  await displayMyEquipment();

  updateOperatorScreen();

  showScreen(
    "operatorScreen"
  );

}
/* LOAD CUSTOMER REQUEST FOR OPERATOR */

async function loadLatestCustomerRequest(){

  try{

    if(!window.ma3daDB){

      console.error(
        "Firebase غير متصل"
      );

      return false;

    }

    if(!window.ma3daGetDocs){

      console.error(
        "ma3daGetDocs غير موجود"
      );

      return false;

    }

    const requestsRef =
      window.ma3daCollection(
        window.ma3daDB,
        "requests"
      );

    const snapshot =
      await window.ma3daGetDocs(
        requestsRef
      );

    if(snapshot.empty){

      console.log(
        "لا توجد طلبات عملاء"
      );

      return false;

    }

    let latestRequest = null;

    snapshot.forEach(
      docSnapshot => {

        const data =
          docSnapshot.data();

        if(
          data.status ===
          "searching"
        ){

          if(
            !latestRequest ||
            Number(data.createdAt || 0) >
            Number(
              latestRequest.createdAt || 0
            )
          ){

            latestRequest = {

              id:
                docSnapshot.id,

              ...data

            };

          }

        }

      }
    );

    if(!latestRequest){

      console.log(
        "لا يوجد طلب searching حالي"
      );

      return false;

    }

    order = {

      location:
        latestRequest.location || "",

      equipment:
        latestRequest.equipment || "",

      duration:
        latestRequest.duration || "",

      operator:
        latestRequest.operator || "",

      notes:
        latestRequest.notes || "",

      price:
        Number(
          latestRequest.price || 0
        )

    };

    localStorage.setItem(
      "currentOrder",
      JSON.stringify(order)
    );

    localStorage.setItem(
      "currentRequestId",
      latestRequest.id
    );

    updateOperatorScreen();

    console.log(
      "تم تحميل طلب العميل من Firebase:",
      latestRequest
    );

    return true;

  }catch(error){

    console.error(
      "تعذر تحميل طلب العميل:",
      error
    );

    return false;

  }

}
const acceptRequestBtn =
  document.getElementById(
    "acceptRequestBtn"
  );
const arrivedAtCustomerBtn =
  document.getElementById(
    "arrivedAtCustomerBtn"
  );

if(arrivedAtCustomerBtn){

  arrivedAtCustomerBtn.addEventListener(
    "click",
    async()=>{

      const requestId =
        localStorage.getItem(
          "currentRequestId"
        );

      if(!requestId){

        alert(
          "لم يتم العثور على رقم الطلب"
        );

        return;

      }

      try{

        const requestRef =
          window.ma3daDoc(
            window.ma3daDB,
            "requests",
            requestId
          );

        await window.ma3daUpdateDoc(
          requestRef,
          {
            status: "arrived"
          }
        );

        const customerLocation =
          document.getElementById(
            "acceptedCustomerLocation"
          );

        const arrivedLocation =
          document.getElementById(
            "arrivedCustomerLocation"
          );

        if(
          customerLocation &&
          arrivedLocation
        ){

          arrivedLocation.textContent =
            customerLocation.textContent;

        }

        showScreen(
          "operatorArrivedScreen"
        );

      }catch(error){

        console.error(
          "تعذر تسجيل الوصول:",
          error
        );

        alert(
          "تعذر تسجيل الوصول في Firebase"
        );

      }

    }
  );

}

if(arrivedAtCustomerBtn){

  arrivedAtCustomerBtn.addEventListener(
    "click",
    ()=>{

      const customerLocation =
        document.getElementById(
          "acceptedCustomerLocation"
        );

      const arrivedLocation =
        document.getElementById(
          "arrivedCustomerLocation"
        );

      if(
        customerLocation &&
        arrivedLocation
      ){

        arrivedLocation.textContent =
          customerLocation.textContent;

      }

      showScreen(
        "operatorArrivedScreen"
      );

    }
  );

}
/* ACCEPT REQUEST */

if(acceptRequestBtn){

  acceptRequestBtn.addEventListener(
    "click",
    async()=>{

      if(!loadOrder()){

        alert(
          "لا يوجد طلب عميل محفوظ"
        );

        return;

      }

      const requestId =
        localStorage.getItem(
          "currentRequestId"
        );

      if(!requestId){

        alert(
          "لم يتم العثور على رقم طلب العميل"
        );

        return;

      }

      try{

        const requestRef =
          window.ma3daDoc(
            window.ma3daDB,
            "requests",
            requestId
          );

        const requestSnap =
          await window.ma3daGetDoc(
            requestRef
          );

        const requestData =
          requestSnap.data();

        const customerLocation =
          requestData?.location ||
          "موقع العميل";

        const acceptedCustomerLocation =
          document.getElementById(
            "acceptedCustomerLocation"
          );

        if(acceptedCustomerLocation){

          acceptedCustomerLocation.textContent =
            customerLocation;

        }

        await window.ma3daUpdateDoc(
          requestRef,
          {
            status: "accepted",
            operatorName: "فهد القحطاني",
            operatorRating: "4.8"
          }
        );

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

        showScreen(
          "operatorAcceptedScreen"
        );

      }catch(error){

        console.error(
          "تعذر تحديث حالة الطلب في Firebase:",
          error
        );

        alert(
          "تعذر قبول الطلب في Firebase"
        );

      }

    }
  );

}

/* REJECT */

const rejectRequestBtn =
  document.getElementById(
    "rejectRequestBtn"
  );

if(rejectRequestBtn){

  rejectRequestBtn.addEventListener(
    "click",
    async()=>{

      const requestId =
        localStorage.getItem(
          "currentRequestId"
        );

      if(!requestId){

        alert(
          "لم يتم العثور على رقم طلب العميل"
        );

        return;

      }

      try{

        const requestRef =
          window.ma3daDoc(
            window.ma3daDB,
            "requests",
            requestId
          );

        await window.ma3daUpdateDoc(
          requestRef,
          {
            status: "rejected"
          }
        );

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

      }catch(error){

        console.error(
          "تعذر رفض الطلب في Firebase:",
          error
        );

        alert(
          "تعذر رفض الطلب في Firebase"
        );

      }

    }
  );

}

/* EQUIPMENT */

const saveEquipmentBtn =
  document.getElementById(
    "saveEquipmentBtn"
  );

if(saveEquipmentBtn){

  saveEquipmentBtn.addEventListener(
    "click",
    saveEquipment
  );

}

async function saveEquipment(){

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

  if(!type || !model || !year || !city){

    alert(
      "فضلاً أكمل جميع بيانات المعدة"
    );

    return;

  }

  const user =
    window.ma3daGetCurrentUser
      ? await window.ma3daGetCurrentUser()
      : window.ma3daAuth?.currentUser;

  if(!user){

    alert(
      "يجب تسجيل الدخول أولاً"
    );

    return;

  }

  if(!window.ma3daDB){

    alert(
      "Firebase غير متصل"
    );

    return;

  }

  const equipment = {

    type,
    model,
    year,
    city,
    availability,
    image:"",
    ownerId:
      user.uid,
    ownerEmail:
      user.email || ""

  };

  const saveToFirebase =
    async()=>{

      const ref =
        window.ma3daDoc(
          window.ma3daDB,
          "equipment",
          user.uid
        );

      await window.ma3daSetDoc(
        ref,
        equipment
      );

    };

  const file =
    imageInput?.files[0];

  if(!file){

    try{

      await saveToFirebase();

      localStorage.setItem(
        "myEquipment",
        JSON.stringify(
          equipment
        )
      );

      alert(
        "تم حفظ المعدة بنجاح 🚜"
      );

      await displayMyEquipment();

      showScreen(
        "operatorScreen"
      );

    }catch(error){

      console.error(
        error
      );

      alert(
        "تعذر حفظ المعدة في قاعدة البيانات"
      );

    }

    return;

  }

  const reader =
    new FileReader();

  reader.onload = ()=>{

    const image =
      new Image();

    image.onload =
      async()=>{

        const maxWidth =
          1000;

        let width =
          image.width;

        let height =
          image.height;

        if(width > maxWidth){

          height =
            Math.round(
              maxWidth *
              height /
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

        try{

          await saveToFirebase();

          localStorage.setItem(
            "myEquipment",
            JSON.stringify(
              equipment
            )
          );

          alert(
            "تم حفظ المعدة بنجاح 🚜"
          );

          await displayMyEquipment();

          showScreen(
            "operatorScreen"
          );

        }catch(error){

          console.error(
            error
          );

          alert(
            "تعذر حفظ المعدة في قاعدة البيانات"
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

/* LOAD EQUIPMENT */

async function displayMyEquipment(){

  try{

    if(!window.ma3daDB){

      console.log(
        "Firebase غير متصل"
      );

      return false;

    }

    const user =
      window.ma3daGetCurrentUser
        ? await window.ma3daGetCurrentUser()
        : window.ma3daAuth?.currentUser;

    if(!user){

      console.log(
        "لا يوجد مستخدم مسجل"
      );

      return false;

    }

    const ref =
      window.ma3daDoc(
        window.ma3daDB,
        "equipment",
        user.uid
      );

    const snapshot =
      await window.ma3daGetDoc(
        ref
      );

    if(!snapshot.exists()){

      console.log(
        "لا توجد بيانات للمعدة"
      );

      return false;

    }

    const equipment =
      snapshot.data();

    localStorage.setItem(
      "myEquipment",
      JSON.stringify(
        equipment
      )
    );

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

    if(type)
      type.textContent =
        equipment.type || "-";

    if(model)
      model.textContent =
        equipment.model || "-";

    if(year)
      year.textContent =
        equipment.year || "-";

    if(city)
      city.textContent =
        equipment.city || "-";

    if(availability){

      availability.textContent =
        equipment.availability ===
        "available"
          ? "متاحة الآن"
          : "غير متاحة";

    }

    if(image){

      if(equipment.image){

        image.src =
          equipment.image;

        image.style.display =
          "block";

      }else{

        image.removeAttribute(
          "src"
        );

        image.style.display =
          "none";

      }

    }

    return true;

  }catch(error){

    console.error(
      "تعذر تحميل بيانات المعدة:",
      error
    );

    return false;

  }

}

/* MATCHED */

const trackingBtn =
  document.getElementById(
    "trackingBtn"
  );

if(trackingBtn){

  trackingBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "trackingScreen"
      );

      startTracking();

    }
  );

}

/* CHAT */

const chatBtn =
  document.getElementById(
    "chatBtn"
  );

if(chatBtn){

  chatBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "chatScreen"
      );

      setTimeout(
        ()=>{

          document
            .getElementById(
              "chatInput"
            )
            ?.focus();

        },
        100
      );

    }
  );

}

function sendChatMessage(){

  const input =
    document.getElementById(
      "chatInput"
    );

  const messages =
    document.getElementById(
      "chatMessages"
    );

  if(!input || !messages)
    return;

  const text =
    input.value.trim();

  if(!text)
    return;

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

if(sendChatBtn){

  sendChatBtn.addEventListener(
    "click",
    sendChatMessage
  );

}

const chatInput =
  document.getElementById(
    "chatInput"
  );

if(chatInput){

  chatInput.addEventListener(
    "keydown",
    e=>{

      if(e.key === "Enter"){

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

if(backFromChatBtn){

  backFromChatBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "matchedScreen"
      );

    }
  );

}

/* TRACKING */

function startTracking(){

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

  if(
    !marker ||
    !distance ||
    !eta ||
    !status
  )
    return;

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

  function move(){

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

    if(
      index ===
      steps.length - 1
    ){

      status.textContent =
        "وصلت المعدة إلى موقعك";

      console.log(
  "اكتمل التتبع - بانتظار وصول صاحب المعدة"
);

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


  /* START WORK */

document.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        "#startWorkBtn"
      );

    if(!button)
      return;

    console.log(
      "تم الضغط على زر بدء العمل"
    );

    const requestId =
      localStorage.getItem(
        "currentRequestId"
      );

    if(!requestId){

      alert(
        "لم يتم العثور على رقم الطلب"
      );

      return;

    }

    /* ننتقل للشاشة مباشرة */

    showScreen(
      "workingScreen"
    );
document.getElementById(
  "endWorkBtn"
).style.display =
  "block";
    workStartTime =
      Date.now();

    clearInterval(
      timerInterval
    );

    updateWorkingScreen();

    updateTimer();

    timerInterval =
      setInterval(
        updateTimer,
        1000
      );

    /* تحديث Firebase */

    try{

      const requestRef =
        window.ma3daDoc(
          window.ma3daDB,
          "requests",
          requestId
        );

      await window.ma3daUpdateDoc(
        requestRef,
        {
          status: "working",
          workStartedAt:
            workStartTime
        }
      );

      setOrderState(
        "working"
      );

      console.log(
        "تم تحديث الطلب إلى working"
      );

    }catch(error){

      console.error(
        "تعذر تحديث حالة العمل في Firebase:",
        error
      );

      alert(
        "تم بدء العمل، لكن تعذر تحديث Firebase"
      );

    }

  }
);
function updateTimer(){

  if(!workStartTime)
    return;

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

  if(timer){

    timer.textContent =
      `${String(hours).padStart(2,"0")}:` +
      `${String(minutes).padStart(2,"0")}:` +
      `${String(seconds).padStart(2,"0")}`;

  }

}

/* CALL */

const callCustomerBtn =
  document.getElementById(
    "callCustomerBtn"
  );

if(callCustomerBtn){

  callCustomerBtn.addEventListener(
    "click",
    ()=>{

      window.location.href =
        "tel:0550000000";

    }
  );

}

const callBtn =
  document.getElementById(
    "callBtn"
  );

if(callBtn){

  callBtn.addEventListener(
    "click",
    ()=>{

      window.location.href =
        "tel:0550000000";

    }
  );

}

/* END WORK */

const endWorkBtn =
  document.getElementById(
    "endWorkBtn"
  );

if(endWorkBtn){

  endWorkBtn.addEventListener(
    "click",
    async ()=>{

      if(
        selectedRole !==
        "operator"
      )
        return;

      const requestId =
        localStorage.getItem(
          "currentRequestId"
        );

      if(requestId){

        const requestRef =
          window.ma3daDoc(
            window.ma3daDB,
            "requests",
            requestId
          );

        await window.ma3daUpdateDoc(
          requestRef,
          {
            status: "completed",
            completedAt: Date.now()
          }
        );

      }

      clearInterval(
        timerInterval
      );

      const finalPrice =
        order.price || 1000;

      const priceElement =
        document.getElementById(
          "finalPrice"
        );

      if(priceElement)
        priceElement.textContent =
          `${finalPrice} ريال`;

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

    }
  );

}

/* PAYMENT */

document
  .querySelectorAll(
    ".payment-option"
  )
  .forEach(
    button=>{

      button.addEventListener(
        "click",
        ()=>{

          document
            .querySelectorAll(
              ".payment-option"
            )
            .forEach(
              item =>
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

          if(confirm)
            confirm.disabled =
              false;

        }
      );

    }
  );

const paymentBtn =
  document.getElementById(
    "paymentBtn"
  );

if(paymentBtn){

 paymentBtn.addEventListener(
  "click",
  ()=>{
    
    stopAcceptanceWatcher();

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

if(confirmPaymentBtn){

  confirmPaymentBtn.addEventListener(
    "click",
    ()=>{

      if(!selectedPayment)
        return;

      showScreen(
        "ratingScreen"
      );

    }
  );

}

/* RATING */

document
  .querySelectorAll(
    ".stars button"
  )
  .forEach(
    button=>{

      button.addEventListener(
        "click",
        ()=>{

          selectedRating =
            Number(
              button.dataset.rating
            );

          document
            .querySelectorAll(
              ".stars button"
            )
            .forEach(
              star=>{

                star.classList.toggle(
                  "selected",
                  Number(
                    star.dataset.rating
                  ) <=
                  selectedRating
                );

              }
            );

          const ratingBtn =
            document.getElementById(
              "ratingBtn"
            );

          if(ratingBtn)
            ratingBtn.disabled =
              false;

        }
      );

    }
  );

const ratingBtn =
  document.getElementById(
    "ratingBtn"
  );

if(ratingBtn){

  ratingBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "thankYouScreen"
      );

    }
  );

}

/* NEW REQUEST */

const newRequestBtn =
  document.getElementById(
    "newRequestBtn"
  );

if(newRequestBtn){

  newRequestBtn.addEventListener(
    "click",
    ()=>{

      stopAcceptanceWatcher();

      [
        "currentOrder",
        "orderState",
        "acceptedOrder",
        "orderAccepted",
        "workEnded",
        "finalPrice",
        "currentRequestId"
      ].forEach(
        key =>
          localStorage.removeItem(
            key
          )
      );

      location.reload();

    }
  );

}

/* BACK ROLE */

const backRoleBtn =
  document.getElementById(
    "backRoleBtn"
  );

if(backRoleBtn){

  backRoleBtn.addEventListener(
    "click",
    ()=>{

      const email =
        document.getElementById(
          "emailInput"
        );

      const password =
        document.getElementById(
          "passwordInput"
        );

      const error =
        document.getElementById(
          "emailError"
        );

      if(email)
        email.value = "";

      if(password)
        password.value = "";

      if(error)
        error.textContent = "";

      showScreen(
        "roleScreen"
      );

    }
  );

}

/* BACK FROM OTP */

const backPhoneBtn =
  document.getElementById(
    "backPhoneBtn"
  );

if(backPhoneBtn){

  backPhoneBtn.addEventListener(
    "click",
    ()=>{

      const otp =
        document.getElementById(
          "otpInput"
        );

      const error =
        document.getElementById(
          "otpError"
        );

      if(otp)
        otp.value = "";

      if(error)
        error.textContent = "";

      showScreen(
        "phoneScreen"
      );

    }
  );

}

/* LOGOUT */

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );

if(logoutBtn){

  logoutBtn.addEventListener(
    "click",
    async()=>{

      try{

        if(window.ma3daAuth){

          const {
            signOut
          } =
            await import(
              "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"
            );

          await signOut(
            window.ma3daAuth
          );

        }

        localStorage.removeItem(
          "selectedRole"
        );

        selectedRole = "";

        showScreen(
          "roleScreen"
        );

      }catch(error){

        console.error(
          "خطأ في تسجيل الخروج:",
          error
        );

        alert(
          "تعذر تسجيل الخروج"
        );

      }

    }
  );

}

/* BACK CUSTOMER */

const backFromRequestBtn =
  document.getElementById(
    "backFromRequestBtn"
  );

if(backFromRequestBtn){

  backFromRequestBtn.addEventListener(
    "click",
    ()=>{

      localStorage.removeItem(
        "selectedRole"
      );

      selectedRole = "";

      showScreen(
        "roleScreen"
      );

    }
  );

}

/* RESTORE SESSION */

(async()=>{

  try{

    const user =
      window.ma3daGetCurrentUser
        ? await window.ma3daGetCurrentUser()
        : window.ma3daAuth?.currentUser;

    const savedRole =
      localStorage.getItem(
        "selectedRole"
      );

    console.log(
      "استعادة الجلسة:",
      user ? user.uid : "لا يوجد مستخدم",
      savedRole || "لا يوجد دور"
    );

    /*
      إذا كان المستخدم موجودًا لكن بريده غير موثق،
      لا نعيد فتح الجلسة.
    */

    if(
      user &&
      !user.emailVerified
    ){

      console.log(
        "المستخدم موجود لكن البريد غير موثق."
      );

      if(window.ma3daAuth){

        try{

          const {
            signOut
          } =
            await import(
              "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"
            );

          await signOut(
            window.ma3daAuth
          );

        }catch(signOutError){

          console.error(
            "تعذر تسجيل الخروج من المستخدم غير الموثق:",
            signOutError
          );

        }

      }

      localStorage.removeItem(
        "selectedRole"
      );

      selectedRole = "";

      showScreen(
        "roleScreen"
      );

      return;

    }

    if(!user){

      selectedRole = "";

      localStorage.removeItem(
        "selectedRole"
      );

      showScreen(
        "roleScreen"
      );

      return;

    }

    if(!savedRole){

      showScreen(
        "roleScreen"
      );

      return;

    }

    selectedRole =
      savedRole;

    /* CUSTOMER */

    if(
      savedRole ===
      "customer"
    ){

      showScreen(
        "requestScreen"
      );

      return;

    }

    /* OPERATOR */

    if(
      savedRole ===
      "operator"
    ){

      await openOperatorAfterLogin();

    }

  }catch(error){

    console.error(
      "خطأ في استعادة الجلسة:",
      error
    );

    showScreen(
      "roleScreen"
    );

  }

})();
