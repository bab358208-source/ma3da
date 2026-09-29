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

  if(
    document
      .getElementById("paymentScreen")
      ?.classList.contains("active")
  )
    return;

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
 
/* فتح صفحة صاحب المعدة حسب وجود */

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
      await window.ma3daGetDoc(ref);

    if(snapshot.exists()){

      await displayMyEquipment();

      const hasOperatorData =
        await loadOperatorData();

      if(!hasOperatorData){

        showScreen(
          "operatorDataScreen"
        );

        return;

      }

      await loadOperatorHome();

      showScreen(
        "operatorHomeScreen"
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
    "customerDataScreen"
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

  let type =
    document
      .getElementById(
        "equipmentType"
      )
      ?.value;

  const otherEquipmentType =
    document
      .getElementById(
        "otherEquipmentType"
      )
      ?.value.trim();

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

  const hourlyPrice =
    document
      .getElementById(
        "equipmentHourlyPrice"
      )
      ?.value.trim();

  const imageInput =
    document.getElementById(
      "equipmentImage"
    );


  /* ================================
     التحقق من نوع المعدة
     ================================ */

  if(type === "أخرى"){

    if(!otherEquipmentType){

      alert(
        "فضلاً اكتب نوع المعدة"
      );

      return;

    }

    type =
      otherEquipmentType;

  }


  /* ================================
     التحقق من البيانات
     ================================ */

  if(
    !type ||
    !model ||
    !year ||
    !city ||
    !hourlyPrice
  ){

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

    hourlyPrice:
      Number(hourlyPrice),

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
/* OTHER EQUIPMENT */

const equipmentType =
  document.getElementById(
    "equipmentType"
  );

const otherEquipmentContainer =
  document.getElementById(
    "otherEquipmentContainer"
  );

const otherEquipmentType =
  document.getElementById(
    "otherEquipmentType"
  );

if(
  equipmentType &&
  otherEquipmentContainer
){

  equipmentType.addEventListener(
    "change",
    ()=>{

      if(
        equipmentType.value ===
        "أخرى"
      ){

        otherEquipmentContainer.style.display =
          "block";

        if(otherEquipmentType){
          otherEquipmentType.focus();
        }

      }else{

        otherEquipmentContainer.style.display =
          "none";

        if(otherEquipmentType){
          otherEquipmentType.value = "";
        }

      }

    }
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

      showScreen(
        "requestScreen"
      );

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

const customerLogoutBtn =
  document.getElementById(
    "customerLogoutBtn"
  );

if(customerLogoutBtn){

  customerLogoutBtn.addEventListener(
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

        localStorage.removeItem(
          "currentOrder"
        );

        localStorage.removeItem(
          "currentRequestId"
        );

        localStorage.removeItem(
          "orderState"
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
        localStorage.removeItem(
          "currentOrder"
        );
        localStorage.removeItem(
          "currentRequestId"
        );
        localStorage.removeItem(
          "orderState"
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
console.log(
  "emailVerified:",
  user ? user.emailVerified : "لا يوجد مستخدم"
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
    "introScreen"
  );

  return;

}
    if(!savedRole){

  showScreen(
    "introScreen"
  );

  return;

}
    selectedRole =
      savedRole;
if(
  savedRole ===
  "customer"
){

  showScreen(
    "customerHomeScreen"
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
/* INTRO */
const introNextBtn =
  document.getElementById(
    "introNextBtn"
  );
if(introNextBtn){
  introNextBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "whyMa3daScreen"
      );
    }
  );
}
const skipIntroBtn =
  document.getElementById(
    "skipIntroBtn"
  );
if(skipIntroBtn){
  skipIntroBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "roleScreen"
      );
    }
  );
}
const whyMa3daNextBtn =
  document.getElementById(
    "whyMa3daNextBtn"
  );
if(whyMa3daNextBtn){
  whyMa3daNextBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "howMa3daScreen"
      );
    }
  );
}
const whyMa3daSkipBtn =
  document.getElementById(
    "whyMa3daSkipBtn"
  );
if(whyMa3daSkipBtn){
  whyMa3daSkipBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "roleScreen"
      );
    }
  );
}
const startMa3daBtn =
  document.getElementById(
    "startMa3daBtn"
  );

if(startMa3daBtn){

  startMa3daBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "roleScreen"
      );
    }
  );

}
const howMa3daSkipBtn =
  document.getElementById(
    "howMa3daSkipBtn"
  );
if(howMa3daSkipBtn){
  howMa3daSkipBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "roleScreen"
      );
    }
  );
}
const howMa3daBackBtn =
  document.getElementById(
    "howMa3daBackBtn"
  );
/* ================================
   السحب بين صفحات المقدمة
   ================================ */

const introScreens = [
  document.getElementById("introScreen"),
  document.getElementById("whyMa3daScreen"),
  document.getElementById("howMa3daScreen"),
  document.getElementById("howWorksScreen")
];

let swipeStartX = 0;
let swipeStartY = 0;

introScreens.forEach(screen => {

  if(!screen) return;

  screen.addEventListener(
    "touchstart",
    event => {

      const touch =
        event.changedTouches[0];

      swipeStartX =
        touch.clientX;

      swipeStartY =
        touch.clientY;

    },
    { passive: true }
  );

  screen.addEventListener(
    "touchend",
    event => {

      const touch =
        event.changedTouches[0];

      const diffX =
        touch.clientX - swipeStartX;

      const diffY =
        touch.clientY - swipeStartY;

      /* تجاهل السحب العمودي */

      if(
        Math.abs(diffX) < 60 ||
        Math.abs(diffX) <= Math.abs(diffY)
      ){
        return;
      }

      const activeScreen =
        document.querySelector(
          ".screen.active"
        );

      if(!activeScreen) return;

      const ids = [
        "introScreen",
        "whyMa3daScreen",
        "howMa3daScreen",
        "howWorksScreen"
      ];

      const currentIndex =
        ids.indexOf(
          activeScreen.id
        );

      if(currentIndex === -1) return;


      /* من اليمين إلى اليسار = التالي */

      if(diffX < 0){

        if(
          currentIndex <
          ids.length - 1
        ){

          showScreen(
            ids[currentIndex + 1]
          );

        }

      }


      /* من اليسار إلى اليمين = رجوع */

      if(diffX > 0){

        if(
          currentIndex > 0
        ){

          showScreen(
            ids[currentIndex - 1]
          );

        }

      }

    },
    { passive: true }
  );

});
const saveCustomerDataBtn =
  document.getElementById(
    "saveCustomerDataBtn"
  );

if(saveCustomerDataBtn){

  saveCustomerDataBtn.addEventListener(
    "click",
    async()=>{

      const name =
        document.getElementById(
          "customerNameInput"
        ).value.trim();

      const phone =
        document.getElementById(
          "customerPhoneInput"
        ).value.trim();

      const city =
        document.getElementById(
          "customerCityInput"
        ).value.trim();

      if(!name || !phone || !city){

        alert(
          "أكمل جميع البيانات أولًا"
        );

        return;

      }

      try{

        const user =
          window.ma3daGetCurrentUser
            ? await window.ma3daGetCurrentUser()
            : window.ma3daAuth?.currentUser;

        if(!user){

          alert(
            "يجب تسجيل الدخول أولًا"
          );

          return;

        }

        const customerRef =
          window.ma3daDoc(
            window.ma3daDB,
            "customers",
            user.uid
          );

        await window.ma3daSetDoc(
          customerRef,
          {
            name: name,
            phone: phone,
            city: city,
            email: user.email,
            customerId: user.uid,
            updatedAt: Date.now()
          }
        );

        console.log(
          "تم حفظ بيانات العميل"
        );

        showScreen(
  "customerHomeScreen"
);

      }catch(error){

        console.error(
          "خطأ في حفظ بيانات العميل:",
          error
        );

       alert(
  "خطأ Firebase: " +
  error.message
);

      }

    }
  );

}
/* ================================
   تحديد موقع العميل
   ================================ */

const getLocationBtn =
  document.getElementById(
    "getLocationBtn"
  );

if(getLocationBtn){

  getLocationBtn.addEventListener(
    "click",
    ()=>{

      if(!navigator.geolocation){

        alert(
          "جهازك لا يدعم تحديد الموقع."
        );

        return;

      }

      getLocationBtn.disabled = true;

      getLocationBtn.textContent =
        "📍 جاري تحديد موقعك...";

      navigator.geolocation.getCurrentPosition(

        position => {

          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          console.log(
            "موقع العميل:",
            latitude,
            longitude
          );

          document.getElementById(
            "locationInput"
          ).value =
            `${latitude}, ${longitude}`;

          getLocationBtn.disabled = false;

          getLocationBtn.textContent =
            "✅ تم تحديد موقعك";

        },

        error => {

          console.error(
            "خطأ تحديد الموقع:",
            error
          );
console.log(
  "كود خطأ الموقع:",
  error.code
);
          getLocationBtn.disabled = false;

          getLocationBtn.textContent =
            "📍 تحديد موقعي بدقة";

          alert(
            "تعذر تحديد موقعك.\n\n" +
            "تأكد من السماح للتطبيق باستخدام موقعك."
          );

        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }

      );

    }
  );

}
/* ================================
   CUSTOMER HOME
   الطلبات الحالية + السابقة + الإعدادات
   ================================ */


/* ================================
   فتح الطلبات الحالية
   ================================ */

const currentOrderBtn =
  document.getElementById(
    "currentOrderBtn"
  );

if(currentOrderBtn){

  currentOrderBtn.addEventListener(
    "click",
    async()=>{

      showScreen(
        "currentOrdersScreen"
      );

      await loadCustomerOrders(
        "current"
      );

    }
  );

}


/* ================================
   فتح الطلبات السابقة
   ================================ */

const previousOrdersBtn =
  document.getElementById(
    "previousOrdersBtn"
  );

if(previousOrdersBtn){

  previousOrdersBtn.addEventListener(
    "click",
    async()=>{

      showScreen(
        "previousOrdersScreen"
      );

      await loadCustomerOrders(
        "previous"
      );

    }
  );

}


/* ================================
   الطلبات الحالية
   ================================ */

async function loadCustomerOrders(type){

  const listId =
    type === "current"
      ? "currentOrdersList"
      : "previousOrdersList";

  const list =
    document.getElementById(
      listId
    );

  if(!list)
    return;

  list.innerHTML =
    "<p>جاري تحميل الطلبات...</p>";

  try{

    const user =
      window.ma3daGetCurrentUser
        ? await window.ma3daGetCurrentUser()
        : window.ma3daAuth?.currentUser;

    if(!user){

      list.innerHTML =
        "<p>يجب تسجيل الدخول أولاً.</p>";

      return;

    }

    if(
      !window.ma3daDB ||
      !window.ma3daCollection ||
      !window.ma3daGetDocs
    ){

      list.innerHTML =
        "<p>Firebase غير جاهز.</p>";

      return;

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

    const currentStatuses = [
      "searching",
      "accepted",
      "arrived",
      "working"
    ];

    const previousStatuses = [
      "completed",
      "rejected"
    ];

    const wantedStatuses =
      type === "current"
        ? currentStatuses
        : previousStatuses;

    const orders = [];

    snapshot.forEach(
      docSnapshot => {

        const data =
          docSnapshot.data();

        if(
          data.customerId ===
          user.uid &&
          wantedStatuses.includes(
            data.status
          )
        ){

          orders.push({

            id:
              docSnapshot.id,

            ...data

          });

        }

      }
    );

    orders.sort(
      (a,b)=>
        Number(
          b.createdAt || 0
        ) -
        Number(
          a.createdAt || 0
        )
    );


    /* لا توجد طلبات */

    if(!orders.length){

      list.innerHTML =
        type === "current"
          ? `
            <div class="empty-state">
              <div class="hero-icon">📋</div>
              <h3>لا توجد طلبات حالية</h3>
              <p>
                عندما تطلب معدة ستظهر هنا.
              </p>
            </div>
          `
          : `
            <div class="empty-state">
              <div class="hero-icon">🕘</div>
              <h3>لا توجد طلبات سابقة</h3>
              <p>
                ستظهر طلباتك المنتهية هنا.
              </p>
            </div>
          `;

      return;

    }


    list.innerHTML = "";


    orders.forEach(
      customerOrder => {

        const card =
          document.createElement(
            "div"
          );

        card.className =
          "customer-order-card";


        const statusText =
          getCustomerOrderStatusText(
            customerOrder.status
          );


        const statusClass =
          getCustomerOrderStatusClass(
            customerOrder.status
          );


        const date =
          customerOrder.createdAt
            ? new Date(
                customerOrder.createdAt
              ).toLocaleDateString(
                "ar-SA"
              )
            : "غير محدد";


        card.innerHTML = `

          <div class="customer-order-header">

            <strong>
              🚜 ${customerOrder.equipment || "معدة"}
            </strong>

            <span
              class="customer-order-status ${statusClass}"
            >
              ${statusText}
            </span>

          </div>


          <div class="customer-order-info">

            <div>
              📍
              <span>
                ${customerOrder.location || "غير محدد"}
              </span>
            </div>

            <div>
              ⏱️
              <span>
                ${customerOrder.duration || "غير محدد"}
              </span>
            </div>

            <div>
              👷
              <span>
                ${customerOrder.operator || "غير محدد"}
              </span>
            </div>

            <div>
              💰
              <span>
                ${Number(customerOrder.price || 0)}
                ريال
              </span>
            </div>

            <div>
              📅
              <span>
                ${date}
              </span>
            </div>

          </div>

        `;


        list.appendChild(
          card
        );

      }
    );


  }catch(error){

    console.error(
      "تعذر تحميل طلبات العميل:",
      error
    );

    list.innerHTML =
      `
        <div class="empty-state">
          <h3>تعذر تحميل الطلبات</h3>
          <p>
            حاول مرة أخرى.
          </p>
        </div>
      `;

  }

}


/* ================================
   حالة الطلب
   ================================ */

function getCustomerOrderStatusText(
  status
){

  const statuses = {

    searching:
      "جاري البحث عن معدة",

    accepted:
      "تم قبول الطلب",

    arrived:
      "المعدة وصلت",

    working:
      "جاري العمل",

    completed:
      "مكتمل",

    rejected:
      "مرفوض"

  };

  return (
    statuses[status] ||
    status ||
    "غير معروف"
  );

}


function getCustomerOrderStatusClass(
  status
){

  return (
    `status-${status || "unknown"}`
  );

}


/* ================================
   الرجوع من الطلبات الحالية
   ================================ */

const backFromCurrentOrdersBtn =
  document.getElementById(
    "backFromCurrentOrdersBtn"
  );

if(backFromCurrentOrdersBtn){

  backFromCurrentOrdersBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "customerHomeScreen"
      );

    }
  );

}


/* ================================
   الرجوع من الطلبات السابقة
   ================================ */

const backFromPreviousOrdersBtn =
  document.getElementById(
    "backFromPreviousOrdersBtn"
  );

if(backFromPreviousOrdersBtn){

  backFromPreviousOrdersBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "customerHomeScreen"
      );

    }
  );

}


/* ================================
   فتح الإعدادات
   ================================ */

const customerSettingsBtn =
  document.getElementById(
    "customerSettingsBtn"
  );

if(customerSettingsBtn){

  customerSettingsBtn.addEventListener(
    "click",
    async()=>{

      showScreen(
        "customerSettingsScreen"
      );

      await loadCustomerSettings();

    }
  );

}


/* ================================
   تحميل بيانات العميل
   ================================ */

async function loadCustomerSettings(){

  const nameInput =
    document.getElementById(
      "customerNameSettingsInput"
    );

  const emailInput =
    document.getElementById(
      "customerEmailSettingsInput"
    );

  const status =
    document.getElementById(
      "customerAccountStatus"
    );


  try{

    const user =
      window.ma3daGetCurrentUser
        ? await window.ma3daGetCurrentUser()
        : window.ma3daAuth?.currentUser;

    if(!user){

      alert(
        "يجب تسجيل الدخول أولاً"
      );

      showScreen(
        "roleScreen"
      );

      return;

    }


    if(emailInput){

      emailInput.value =
        user.email || "";

    }


    if(
      !window.ma3daDB ||
      !window.ma3daDoc ||
      !window.ma3daGetDoc
    ){

      return;

    }


    const customerRef =
      window.ma3daDoc(
        window.ma3daDB,
        "customers",
        user.uid
      );


    const snapshot =
      await window.ma3daGetDoc(
        customerRef
      );


    if(snapshot.exists()){

      const data =
        snapshot.data();


      if(nameInput){

        nameInput.value =
          data.name || "";

      }

      if(status){

        status.textContent =
          "نشط";

      }

    }else{

      if(nameInput){

        nameInput.value =
          "";

      }

    }


  }catch(error){

    console.error(
      "تعذر تحميل بيانات العميل:",
      error
    );

  }

}


/* ================================
   حفظ تعديل اسم العميل
   ================================ */

const saveCustomerSettingsBtn =
  document.getElementById(
    "saveCustomerSettingsBtn"
  );

if(saveCustomerSettingsBtn){

  saveCustomerSettingsBtn.addEventListener(
    "click",
    async()=>{

      const nameInput =
        document.getElementById(
          "customerNameSettingsInput"
        );

      const name =
        nameInput
          ?.value
          .trim();


      if(!name){

        alert(
          "أدخل الاسم أولاً"
        );

        if(nameInput)
          nameInput.focus();

        return;

      }


      try{

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


        const customerRef =
          window.ma3daDoc(
            window.ma3daDB,
            "customers",
            user.uid
          );


        const oldSnapshot =
          await window.ma3daGetDoc(
            customerRef
          );


        const oldData =
          oldSnapshot.exists()
            ? oldSnapshot.data()
            : {};


        await window.ma3daSetDoc(
          customerRef,
          {

            name:

              name,

            phone:

              oldData.phone || "",

            city:

              oldData.city || "",

            email:

              user.email || "",

            customerId:

              user.uid,

            updatedAt:

              Date.now()

          }
        );


        alert(
          "تم حفظ التعديلات بنجاح ✅"
        );


      }catch(error){

        console.error(
          "تعذر حفظ إعدادات العميل:",
          error
        );

        alert(
          "تعذر حفظ التعديلات في Firebase"
        );

      }

    }
  );

}


/* ================================
   تغيير كلمة المرور
   ================================ */

const changePasswordBtn =
  document.getElementById(
    "changePasswordBtn"
  );

if(changePasswordBtn){

  changePasswordBtn.addEventListener(
    "click",
    async()=>{

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


      if(!user.email){

        alert(
          "لا يوجد بريد إلكتروني مرتبط بالحساب"
        );

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


      try{

        await window.ma3daSendPasswordResetEmail(
          user.email
        );


        alert(
          "تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني 📧"
        );


      }catch(error){

        console.error(
          "تعذر إرسال رابط تغيير كلمة المرور:",
          error
        );

        alert(
          error?.message ||
          "تعذر إرسال رابط تغيير كلمة المرور"
        );

      }

    }
  );

}


/* ================================
   الرجوع من الإعدادات
   ================================ */

const backFromCustomerSettingsBtn =
  document.getElementById(
    "backFromCustomerSettingsBtn"
  );

if(backFromCustomerSettingsBtn){

  backFromCustomerSettingsBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "customerHomeScreen"
      );

    }
  );

}
/* ================================
   تعديل رقم الجوال
   ================================ */

const editPhoneBtn =
  document.getElementById(
    "editPhoneBtn"
  );

if(editPhoneBtn){

  editPhoneBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "editPhoneScreen"
      );

    }
  );

}


const backFromEditPhoneBtn =
  document.getElementById(
    "backFromEditPhoneBtn"
  );

if(backFromEditPhoneBtn){

  backFromEditPhoneBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "customerSettingsScreen"
      );

    }
  );

}
/* ================================
   تعديل البريد الإلكتروني
   ================================ */

const editEmailBtn =
  document.getElementById(
    "editEmailBtn"
  );

if(editEmailBtn){

  editEmailBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "editEmailScreen"
      );

    }
  );

}


const backFromEditEmailBtn =
  document.getElementById(
    "backFromEditEmailBtn"
  );

if(backFromEditEmailBtn){

  backFromEditEmailBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "customerSettingsScreen"
      );

    }
  );

}
/* ================================
   إعدادات
    اللغة + المظهر
   ================================ */

/* ================================
   اللغة
   ================================ */

const languageSettingsBtn =
  document.getElementById(
    "languageSettingsBtn"
  );

if(languageSettingsBtn){

  languageSettingsBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "languageSettingsScreen"
      );

    }
  );

}


const backFromLanguageSettingsBtn =
  document.getElementById(
    "backFromLanguageSettingsBtn"
  );

if(backFromLanguageSettingsBtn){

  backFromLanguageSettingsBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "customerSettingsScreen"
      );

    }
  );

}


const arabicLanguageBtn =
  document.getElementById(
    "arabicLanguageBtn"
  );

if(arabicLanguageBtn){

  arabicLanguageBtn.addEventListener(
    "click",
    ()=>{

      document.documentElement.lang =
        "ar";

      document.documentElement.dir =
        "rtl";

      localStorage.setItem(
        "ma3daLanguage",
        "ar"
      );

      alert(
        "تم اختيار اللغة العربية 🇸🇦"
      );

    }
  );

}


const englishLanguageBtn =
  document.getElementById(
    "englishLanguageBtn"
  );

if(englishLanguageBtn){

  englishLanguageBtn.addEventListener(
    "click",
    ()=>{

      alert(
        "اللغة الإنجليزية ستكون متاحة قريبًا 🌐"
      );

    }
  );

}


/* ================================
   المظهر
   ================================ */

const appearanceSettingsBtn =
  document.getElementById(
    "appearanceSettingsBtn"
  );

if(appearanceSettingsBtn){

  appearanceSettingsBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "appearanceSettingsScreen"
      );

    }
  );

}


const backFromAppearanceSettingsBtn =
  document.getElementById(
    "backFromAppearanceSettingsBtn"
  );

if(backFromAppearanceSettingsBtn){

  backFromAppearanceSettingsBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "customerSettingsScreen"
      );

    }
  );

}


const systemAppearanceBtn =
  document.getElementById(
    "systemAppearanceBtn"
  );

if(systemAppearanceBtn){

  systemAppearanceBtn.addEventListener(
    "click",
    ()=>{

      document.documentElement.removeAttribute(
        "data-theme"
      );

      localStorage.setItem(
        "ma3daTheme",
        "system"
      );

      alert(
        "تم اختيار المظهر التلقائي 📱"
      );

    }
  );

}


const lightAppearanceBtn =
  document.getElementById(
    "lightAppearanceBtn"
  );

if(lightAppearanceBtn){

  lightAppearanceBtn.addEventListener(
    "click",
    ()=>{

      document.documentElement.setAttribute(
        "data-theme",
        "light"
      );

      localStorage.setItem(
        "ma3daTheme",
        "light"
      );

      alert(
        "تم اختيار المظهر الفاتح ☀️"
      );

    }
  );

}


const darkAppearanceBtn =
  document.getElementById(
    "darkAppearanceBtn"
  );

if(darkAppearanceBtn){

  darkAppearanceBtn.addEventListener(
    "click",
    ()=>{

      document.documentElement.setAttribute(
        "data-theme",
        "dark"
      );

      localStorage.setItem(
        "ma3daTheme",
        "dark"
      );

      alert(
        "تم اختيار المظهر الداكن 🌙"
      );

    }
  );

}
/* ================================
   الدعم الفني
   ================================ */

const technicalSupportBtn =
  document.getElementById(
    "technicalSupportBtn"
  );

if(technicalSupportBtn){

  technicalSupportBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "technicalSupportScreen"
      );
    }
  );

}


const backFromTechnicalSupportBtn =
  document.getElementById(
    "backFromTechnicalSupportBtn"
  );

if(backFromTechnicalSupportBtn){

  backFromTechnicalSupportBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "customerHomeScreen"
      );
    }
  );

}
async function loadOperatorData(){

  const user =
    window.ma3daGetCurrentUser
      ? await window.ma3daGetCurrentUser()
      : window.ma3daAuth?.currentUser;

  if(!user){
    return false;
  }

  try{

    const ref =
      window.ma3daDoc(
        window.ma3daDB,
        "operators",
        user.uid
      );

    const snapshot =
      await window.ma3daGetDoc(ref);

    const emailInput =
      document.getElementById(
        "operatorEmailInput"
      );

    if(emailInput){
      emailInput.value =
        user.email || "";
    }

    if(!snapshot.exists()){
      return false;
    }

    const data =
      snapshot.data();

    document.getElementById(
      "operatorNameInput"
    ).value =
      data.name || "";

    document.getElementById(
      "operatorPhoneInput"
    ).value =
      data.phone || "";

    document.getElementById(
      "operatorCityInput"
    ).value =
      data.city || "";

    return true;

  }catch(error){

    console.error(
      "خطأ في تحميل بيانات صاحب المعدة:",
      error
    );

    return false;

  }

}


const saveOperatorDataBtn =
  document.getElementById(
    "saveOperatorDataBtn"
  );

if(saveOperatorDataBtn){

  saveOperatorDataBtn.addEventListener(
    "click",
    async()=>{

      const name =
        document.getElementById(
          "operatorNameInput"
        ).value.trim();

      const phone =
        document.getElementById(
          "operatorPhoneInput"
        ).value.trim();

      const city =
        document.getElementById(
          "operatorCityInput"
        ).value.trim();

      if(!name || !phone || !city){

        alert(
          "أكمل جميع البيانات أولًا"
        );

        return;

      }

      try{

        const user =
          window.ma3daGetCurrentUser
            ? await window.ma3daGetCurrentUser()
            : window.ma3daAuth?.currentUser;

        if(!user){

          alert(
            "يجب تسجيل الدخول أولًا"
          );

          return;

        }

        const operatorRef =
          window.ma3daDoc(
            window.ma3daDB,
            "operators",
            user.uid
          );

        await window.ma3daSetDoc(
          operatorRef,
          {
            name:name,
            phone:phone,
            city:city,
            email:user.email || "",
            operatorId:user.uid,
            updatedAt:Date.now()
          },
          { merge:true }
        );

        await loadOperatorHome();

        showScreen(
          "operatorHomeScreen"
        );

      }catch(error){

        console.error(
          "خطأ في حفظ بيانات صاحب المعدة:",
          error
        );

        alert(
          "تعذر حفظ البيانات:\n" +
          error.message
        );

      }

    }
  );

}


async function loadOperatorHome(){

  const user =
    window.ma3daGetCurrentUser
      ? await window.ma3daGetCurrentUser()
      : window.ma3daAuth?.currentUser;

  if(!user){
    return;
  }

  try{

    const operatorRef =
      window.ma3daDoc(
        window.ma3daDB,
        "operators",
        user.uid
      );

    const operatorSnapshot =
      await window.ma3daGetDoc(
        operatorRef
      );

    if(operatorSnapshot.exists()){

      const operatorData =
        operatorSnapshot.data();

      const name =
        document.getElementById(
          "operatorHomeName"
        );

      if(name){
        name.textContent =
          operatorData.name ||
          "صاحب المعدة";
      }

    }

    const equipmentRef =
      window.ma3daDoc(
        window.ma3daDB,
        "equipment",
        user.uid
      );

    const equipmentSnapshot =
      await window.ma3daGetDoc(
        equipmentRef
      );

    if(equipmentSnapshot.exists()){

      const equipment =
        equipmentSnapshot.data();

      document.getElementById(
        "operatorHomeEquipmentType"
      ).textContent =
        equipment.type || "-";

      document.getElementById(
        "operatorHomeEquipmentModel"
      ).textContent =
        equipment.model || "-";

      document.getElementById(
        "operatorHomeEquipmentCity"
      ).textContent =
        equipment.city || "-";

      document.getElementById(
        "operatorHomeEquipmentYear"
      ).textContent =
        equipment.year || "-";

      document.getElementById(
        "operatorHomeEquipmentPrice"
      ).textContent =
        equipment.hourlyPrice
          ? equipment.hourlyPrice + " ريال"
          : "-";

      const image =
        document.getElementById(
          "operatorHomeEquipmentImage"
        );

      if(image){

        if(equipment.image){

          image.src =
            equipment.image;

          image.style.display =
            "block";

        }else{

          image.style.display =
            "none";

        }

      }

    }

  }catch(error){

    console.error(
      "خطأ في تحميل الصفحة الرئيسية لصاحب المعدة:",
      error
    );

  }

}


const operatorNewRequestsBtn =
  document.getElementById(
    "operatorNewRequestsBtn"
  );

if(operatorNewRequestsBtn){

  operatorNewRequestsBtn.addEventListener(
    "click",
    async()=>{

      await loadLatestCustomerRequest();

      showScreen(
        "operatorScreen"
      );

    }
  );

}


const operatorCurrentOrderBtn =
  document.getElementById(
    "operatorCurrentOrderBtn"
  );

if(operatorCurrentOrderBtn){

  operatorCurrentOrderBtn.addEventListener(
    "click",
    ()=>{

      showScreen(
        "operatorAcceptedScreen"
      );

    }
  );

}


const operatorHomeLogoutBtn =
  document.getElementById(
    "operatorHomeLogoutBtn"
  );

if(operatorHomeLogoutBtn){

  operatorHomeLogoutBtn.addEventListener(
    "click",
    async()=>{

      try{

        await window.ma3daAuth.signOut();

      }catch(error){

        console.error(
          "خطأ في تسجيل الخروج:",
          error
        );

      }

      selectedRole = "";

      showScreen(
        "roleScreen"
      );

    }
  );

}
/* =========================================================
   MA3DA — OPERATOR DASHBOARD
========================================================= */

let operatorOrderWatcher = null;
let operatorTimerInterval = null;


/* ---------------------------------------------------------
   أدوات صاحب المعدة
--------------------------------------------------------- */

async function getOperatorCurrentUser(){

  if(!window.ma3daFirebaseReady)
    return null;

  await window.ma3daFirebaseReady;

  if(!window.ma3daGetCurrentUser)
    return null;

  return await window.ma3daGetCurrentUser();

}


async function getOperatorEquipment(){

  const user =
    await getOperatorCurrentUser();

  if(!user)
    return null;

  if(
    !window.ma3daDB ||
    !window.ma3daDoc ||
    !window.ma3daGetDoc
  )
    return null;

  const equipmentRef =
    window.ma3daDoc(
      window.ma3daDB,
      "equipment",
      user.uid
    );

  const snap =
    await window.ma3daGetDoc(
      equipmentRef
    );

  if(!snap.exists())
    return null;

  return snap.data();

}


/* ---------------------------------------------------------
   فتح لوحة صاحب المعدة
--------------------------------------------------------- */

async function openOperatorDashboard(){

  try{

    const user =
      await getOperatorCurrentUser();

    if(!user)
      return;

    const operatorRef =
      window.ma3daDoc(
        window.ma3daDB,
        "operators",
        user.uid
      );

    const operatorSnap =
      await window.ma3daGetDoc(
        operatorRef
      );

    if(!operatorSnap.exists()){

      showScreen(
        "operatorDataScreen"
      );

      return;

    }


    await loadOperatorDashboard();

    showScreen(
      "operatorHomeScreen"
    );

  }catch(error){

    console.error(
      "خطأ في فتح لوحة صاحب المعدة:",
      error
    );

  }

}


/* ---------------------------------------------------------
   تحميل الصفحة الرئيسية
--------------------------------------------------------- */

async function loadOperatorDashboard(){

  const user =
    await getOperatorCurrentUser();

  if(!user)
    return;


  /* بيانات صاحب المعدة */

  const operatorRef =
    window.ma3daDoc(
      window.ma3daDB,
      "operators",
      user.uid
    );

  const operatorSnap =
    await window.ma3daGetDoc(
      operatorRef
    );

  if(operatorSnap.exists()){

    const data =
      operatorSnap.data();

    const name =
      data.name ||
      "صاحب المعدة";

    const nameElement =
      document.getElementById(
        "operatorHomeName"
      );

    if(nameElement)
      nameElement.textContent = name;

  }


  /* بيانات المعدة */

  const equipment =
    await getOperatorEquipment();

  if(!equipment)
    return;


  const type =
    equipment.type || "-";

  const model =
    equipment.model || "-";

  const city =
    equipment.city || "-";

  const year =
    equipment.year || "-";

  const price =
    Number(equipment.hourlyPrice || 0);


  const typeElement =
    document.getElementById(
      "operatorHomeEquipmentType"
    );

  const modelElement =
    document.getElementById(
      "operatorHomeEquipmentModel"
    );

  const cityElement =
    document.getElementById(
      "operatorHomeEquipmentCity"
    );

  const yearElement =
    document.getElementById(
      "operatorHomeEquipmentYear"
    );

  const priceElement =
    document.getElementById(
      "operatorHomeEquipmentPrice"
    );

  const imageElement =
    document.getElementById(
      "operatorHomeEquipmentImage"
    );


  if(typeElement)
    typeElement.textContent = type;

  if(modelElement)
    modelElement.textContent = model;

  if(cityElement)
    cityElement.textContent = city;

  if(yearElement)
    yearElement.textContent = year;

  if(priceElement)
    priceElement.textContent =
      price.toLocaleString("ar-SA");


  if(imageElement){

    if(equipment.image){

      imageElement.src =
        equipment.image;

      imageElement.style.display =
        "block";

    }else{

      imageElement.removeAttribute(
        "src"
      );

      imageElement.style.display =
        "none";

    }

  }

}


/* ---------------------------------------------------------
   الطلبات الجديدة
--------------------------------------------------------- */

async function loadOperatorNewRequests(){

  const list =
    document.getElementById(
      "operatorNewRequestsList"
    );

  if(!list)
    return;


  list.innerHTML = `
    <div class="card center">
      <p>جاري تحميل الطلبات...</p>
    </div>
  `;


  try{

    if(
      !window.ma3daDB ||
      !window.ma3daGetDocs ||
      !window.ma3daCollection
    )
      throw new Error(
        "Firebase غير جاهز"
      );


    const equipment =
      await getOperatorEquipment();

    if(!equipment){

      list.innerHTML = `
        <div class="card center">
          <p>لم يتم العثور على بيانات المعدة.</p>
        </div>
      `;

      return;

    }


    const snapshot =
      await window.ma3daGetDocs(
        window.ma3daCollection(
          window.ma3daDB,
          "requests"
        )
      );


    const requests = [];


    snapshot.forEach(docSnap => {

      const data =
        docSnap.data();


      if(
        data.status === "searching" &&
        data.equipment === equipment.type
      ){

        requests.push({

          id: docSnap.id,

          ...data

        });

      }

    });


    requests.sort(
      (a,b) =>
        Number(b.createdAt || 0) -
        Number(a.createdAt || 0)
    );


    if(!requests.length){

      list.innerHTML = `
        <div class="card center">

          <div class="success-icon">
            ✓
          </div>

          <h3>
            لا توجد طلبات جديدة
          </h3>

          <p>
            سنعرض هنا طلبات العملاء
            المناسبة لمعدتك.
          </p>

        </div>
      `;

      return;

    }


    list.innerHTML = "";


    requests.forEach(request => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "card operator-new-request-card";


      const price =
        Number(request.price || 0);


      card.innerHTML = `

        <div class="request-title">

          <span>🚜</span>

          <div>

            <h2>
              ${request.equipment || "-"}
            </h2>

            <p>
              مع مشغل
            </p>

          </div>

        </div>


        <div class="operator-info">

          <div class="operator-info-row">

            <span>
              📍 موقع العمل
            </span>

            <strong>
              ${request.location || "-"}
            </strong>

          </div>


          <div class="operator-info-row">

            <span>
              ⏱️ مدة العمل
            </span>

            <strong>
              ${request.duration || "-"}
            </strong>

          </div>


          <div class="operator-info-row">

            <span>
              💰 السعر
            </span>

            <strong>
              ${price.toLocaleString("ar-SA")} ريال
            </strong>

          </div>

        </div>


        <div class="operator-notes">

          <span>
            📝 ملاحظات العميل
          </span>

          <p>
            ${request.notes || "لا توجد ملاحظات"}
          </p>

        </div>


        <div class="operator-buttons">

          <button
            class="reject-btn"
            type="button"
            data-reject-request="${request.id}"
          >
            رفض الطلب
          </button>

          <button
            class="accept-btn"
            type="button"
            data-accept-request="${request.id}"
          >
            قبول الطلب
          </button>

        </div>

      `;


      list.appendChild(card);

    });


  }catch(error){

    console.error(
      "خطأ في تحميل الطلبات الجديدة:",
      error
    );

    list.innerHTML = `
      <div class="card center">
        <p>
          تعذر تحميل الطلبات.
        </p>
      </div>
    `;

  }

}


/* ---------------------------------------------------------
   قبول طلب
--------------------------------------------------------- */

async function acceptOperatorRequest(
  requestId
){

  try{

    const user =
      await getOperatorCurrentUser();

    if(!user)
      return;


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


    if(!requestSnap.exists()){

      alert(
        "الطلب غير موجود."
      );

      return;

    }


    const request =
      requestSnap.data();


    if(
      request.status !==
      "searching"
    ){

      alert(
        "هذا الطلب لم يعد متاحًا."
      );

      await loadOperatorNewRequests();

      return;

    }


    const operatorRef =
      window.ma3daDoc(
        window.ma3daDB,
        "operators",
        user.uid
      );


    const operatorSnap =
      await window.ma3daGetDoc(
        operatorRef
      );


    const operatorData =
      operatorSnap.exists()
        ? operatorSnap.data()
        : {};


    const equipment =
      await getOperatorEquipment();


    await window.ma3daUpdateDoc(
      requestRef,
      {

        status:
          "accepted",

        operatorId:
          user.uid,

        operatorName:
          operatorData.name ||
          "صاحب المعدة",

        operatorPhone:
          operatorData.phone ||
          "",

        operatorRating:
          operatorData.rating ||
          "5.0",

        operatorEquipment:
          equipment
            ? equipment.model || ""
            : "",

        acceptedAt:
          Date.now(),

        acceptedCustomerLocation:
          request.location || ""

      }
    );


    localStorage.setItem(
      "currentRequestId",
      requestId
    );


    localStorage.setItem(
      "orderState",
      "accepted"
    );


    alert(
      "تم قبول الطلب بنجاح 🚜"
    );


    await loadOperatorCurrentOrder();


    showScreen(
      "operatorCurrentOrderScreen"
    );


  }catch(error){

    console.error(
      "خطأ في قبول الطلب:",
      error
    );

    alert(
      "تعذر قبول الطلب."
    );

  }

}


/* ---------------------------------------------------------
   رفض طلب
--------------------------------------------------------- */

async function rejectOperatorRequest(
  requestId
){

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

        status:
          "rejected",

        rejectedBy:
          "operator",

        rejectedAt:
          Date.now()

      }
    );


    await loadOperatorNewRequests();


  }catch(error){

    console.error(
      "خطأ في رفض الطلب:",
      error
    );

    alert(
      "تعذر رفض الطلب."
    );

  }

}


/* ---------------------------------------------------------
   الطلب الحالي
--------------------------------------------------------- */

async function loadOperatorCurrentOrder(){

  const requestId =
    localStorage.getItem(
      "currentRequestId"
    );


  if(!requestId){

    updateOperatorCurrentUI(
      null
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


    const snap =
      await window.ma3daGetDoc(
        requestRef
      );


    if(!snap.exists()){

      updateOperatorCurrentUI(
        null
      );

      return;

    }


    const data =
      snap.data();


    updateOperatorCurrentUI(
      data
    );


  }catch(error){

    console.error(
      "خطأ في الطلب الحالي:",
      error
    );

  }

}


/* ---------------------------------------------------------
   تحديث واجهة الطلب الحالي
--------------------------------------------------------- */

function updateOperatorCurrentUI(
  data
){

  const title =
    document.getElementById(
      "operatorCurrentOrderTitle"
    );

  const equipment =
    document.getElementById(
      "operatorCurrentEquipment"
    );

  const location =
    document.getElementById(
      "operatorCurrentLocation"
    );

  const duration =
    document.getElementById(
      "operatorCurrentDuration"
    );

  const price =
    document.getElementById(
      "operatorCurrentPrice"
    );

  const statusText =
    document.getElementById(
      "operatorCurrentStatusText"
    );

  const statusIcon =
    document.getElementById(
      "operatorCurrentStatusIcon"
    );

  const arrivedBtn =
    document.getElementById(
      "operatorArrivedBtn"
    );

  const startBtn =
    document.getElementById(
      "operatorStartWorkBtn"
    );

  const timerBox =
    document.getElementById(
      "operatorWorkTimerBox"
    );

  const endBtn =
    document.getElementById(
      "operatorEndWorkBtn"
    );


  if(!data){

    if(title)
      title.textContent =
        "لا يوجد طلب حالي";

    if(statusText)
      statusText.textContent =
        "لا يوجد طلب";

    if(statusIcon)
      statusIcon.textContent =
        "⚪";

    if(arrivedBtn)
      arrivedBtn.style.display =
        "none";

    if(startBtn)
      startBtn.style.display =
        "none";

    if(timerBox)
      timerBox.style.display =
        "none";

    if(endBtn)
      endBtn.style.display =
        "none";

    return;

  }


  if(equipment)
    equipment.textContent =
      data.equipment || "-";

  if(location)
    location.textContent =
      data.location || "-";

  if(duration)
    duration.textContent =
      data.duration || "-";

  if(price)
    price.textContent =
      `${Number(data.price || 0).toLocaleString("ar-SA")} ريال`;


  if(arrivedBtn)
    arrivedBtn.style.display =
      "none";

  if(startBtn)
    startBtn.style.display =
      "none";

  if(timerBox)
    timerBox.style.display =
      "none";

  if(endBtn)
    endBtn.style.display =
      "none";


  if(data.status === "accepted"){

    if(statusIcon)
      statusIcon.textContent =
        "🟡";

    if(statusText)
      statusText.textContent =
        "تم قبول الطلب — في الطريق إلى العميل";

    if(arrivedBtn)
      arrivedBtn.style.display =
        "block";

  }


  else if(data.status === "arrived"){

    if(statusIcon)
      statusIcon.textContent =
        "🟢";

    if(statusText)
      statusText.textContent =
        "وصلت إلى موقع العميل";

    if(startBtn)
      startBtn.style.display =
        "block";

  }


  else if(data.status === "working"){

    if(statusIcon)
      statusIcon.textContent =
        "🔵";

    if(statusText)
      statusText.textContent =
        "العمل جارٍ";

    if(timerBox)
      timerBox.style.display =
        "block";

    if(endBtn)
      endBtn.style.display =
        "block";


    startOperatorTimer(
      data.workStartedAt
    );

  }


  else if(data.status === "completed"){

    if(statusIcon)
      statusIcon.textContent =
        "✅";

    if(statusText)
      statusText.textContent =
        "تم إنهاء العمل";

  }

}


/* ---------------------------------------------------------
   زر وصلت
--------------------------------------------------------- */

async function operatorMarkArrived(){

  const requestId =
    localStorage.getItem(
      "currentRequestId"
    );

  if(!requestId){

    alert(
      "لا يوجد طلب حالي."
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

        status:
          "arrived",

        arrivedAt:
          Date.now()

      }
    );


    await loadOperatorCurrentOrder();

    alert(
      "تم تسجيل وصولك للعميل 🚜"
    );


  }catch(error){

    console.error(
      "خطأ في تسجيل الوصول:",
      error
    );

    alert(
      "تعذر تسجيل الوصول."
    );

  }

}


/* ---------------------------------------------------------
   بدء العمل
--------------------------------------------------------- */

async function operatorStartWork(){

  const requestId =
    localStorage.getItem(
      "currentRequestId"
    );

  if(!requestId)
    return;


  const startTime =
    Date.now();


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

        status:
          "working",

        workStartedAt:
          startTime

      }
    );


    localStorage.setItem(
      "orderState",
      "working"
    );


    startOperatorTimer(
      startTime
    );


    await loadOperatorCurrentOrder();


  }catch(error){

    console.error(
      "خطأ في بدء العمل:",
      error
    );

    alert(
      "تعذر بدء العمل."
    );

  }

}


/* ---------------------------------------------------------
   مؤقت صاحب المعدة
--------------------------------------------------------- */

function startOperatorTimer(
  startTime
){

  clearInterval(
    operatorTimerInterval
  );


  const timer =
    document.getElementById(
      "operatorTimer"
    );


  if(!timer)
    return;


  function update(){

    const elapsed =
      Math.max(
        0,
        Date.now() -
        Number(startTime || Date.now())
      );


    const totalSeconds =
      Math.floor(
        elapsed / 1000
      );


    const hours =
      Math.floor(
        totalSeconds / 3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );

    const seconds =
      totalSeconds % 60;


    timer.textContent =
      `${String(hours).padStart(2,"0")}:` +
      `${String(minutes).padStart(2,"0")}:` +
      `${String(seconds).padStart(2,"0")}`;

  }


  update();


  operatorTimerInterval =
    setInterval(
      update,
      1000
    );

}


/* ---------------------------------------------------------
   إنهاء العمل
--------------------------------------------------------- */

async function operatorFinishWork(){

  const requestId =
    localStorage.getItem(
      "currentRequestId"
    );

  if(!requestId)
    return;


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

        status:
          "completed",

        completedAt:
          Date.now()

      }
    );


    clearInterval(
      operatorTimerInterval
    );


    localStorage.setItem(
      "orderState",
      "completed"
    );


    await loadOperatorCurrentOrder();


    alert(
      "تم إنهاء العمل بنجاح ✅"
    );


  }catch(error){

    console.error(
      "خطأ في إنهاء العمل:",
      error
    );

    alert(
      "تعذر إنهاء العمل."
    );

  }

}


/* ---------------------------------------------------------
   الطلبات السابقة
--------------------------------------------------------- */

async function loadOperatorPreviousOrders(){

  const list =
    document.getElementById(
      "operatorPreviousOrdersList"
    );

  if(!list)
    return;


  list.innerHTML = `
    <div class="card center">
      <p>جاري تحميل الطلبات...</p>
    </div>
  `;


  try{

    const user =
      await getOperatorCurrentUser();

    if(!user)
      return;


    const snapshot =
      await window.ma3daGetDocs(
        window.ma3daCollection(
          window.ma3daDB,
          "requests"
        )
      );


    const requests = [];


    snapshot.forEach(docSnap => {

      const data =
        docSnap.data();


      if(
        data.operatorId === user.uid &&
        (
          data.status === "completed" ||
          data.status === "rejected"
        )
      ){

        requests.push({

          id: docSnap.id,

          ...data

        });

      }

    });


    requests.sort(
      (a,b) =>
        Number(b.completedAt || b.createdAt || 0) -
        Number(a.completedAt || a.createdAt || 0)
    );


    if(!requests.length){

      list.innerHTML = `
        <div class="card center">
          <p>
            لا توجد طلبات سابقة حتى الآن.
          </p>
        </div>
      `;

      return;

    }


    list.innerHTML = "";


    requests.forEach(request => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "card";


      const status =
        request.status === "completed"
          ? "مكتمل ✅"
          : "مرفوض ❌";


      card.innerHTML = `

        <h3>
          ${request.equipment || "-"}
        </h3>

        <div class="info-row">

          <span>
            الموقع
          </span>

          <strong>
            ${request.location || "-"}
          </strong>

        </div>

        <div class="info-row">

          <span>
            المدة
          </span>

          <strong>
            ${request.duration || "-"}
          </strong>

        </div>

        <div class="info-row">

          <span>
            المبلغ
          </span>

          <strong>
            ${Number(request.price || 0).toLocaleString("ar-SA")}
            ريال
          </strong>

        </div>

        <div class="info-row">

          <span>
            الحالة
          </span>

          <strong>
            ${status}
          </strong>

        </div>

      `;


      list.appendChild(card);

    });


  }catch(error){

    console.error(
      "خطأ في الطلبات السابقة:",
      error
    );

  }

}


/* ---------------------------------------------------------
   الدخل
--------------------------------------------------------- */

async function loadOperatorIncome(){

  const user =
    await getOperatorCurrentUser();

  if(!user)
    return;


  const snapshot =
    await window.ma3daGetDocs(
      window.ma3daCollection(
        window.ma3daDB,
        "requests"
      )
    );


  let totalIncome = 0;
  let completedCount = 0;
  let totalHours = 0;


  const completedRequests = [];


  snapshot.forEach(docSnap => {

    const data =
      docSnap.data();


    if(
      data.operatorId === user.uid &&
      data.status === "completed"
    ){

      const price =
        Number(data.price || 0);


      totalIncome += price;

      completedCount++;


      const hours =
        durationHours[
          data.duration
        ] || 0;


      totalHours += hours;


      completedRequests.push(
        data
      );

    }

  });


  const incomeElement =
    document.getElementById(
      "operatorTotalIncome"
    );

  const countElement =
    document.getElementById(
      "operatorCompletedCount"
    );

  const hoursElement =
    document.getElementById(
      "operatorTotalHours"
    );


  if(incomeElement)
    incomeElement.textContent =
      `${totalIncome.toLocaleString("ar-SA")} ريال`;

  if(countElement)
    countElement.textContent =
      completedCount;

  if(hoursElement)
    hoursElement.textContent =
      totalHours;


  const list =
    document.getElementById(
      "operatorIncomeList"
    );


  if(!list)
    return;


  list.innerHTML = "";


  completedRequests
    .sort(
      (a,b) =>
        Number(b.completedAt || 0) -
        Number(a.completedAt || 0)
    )
    .forEach(request => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "card";


      card.innerHTML = `

        <h3>
          ${request.equipment || "-"}
        </h3>

        <div class="info-row">

          <span>
            المبلغ
          </span>

          <strong>
            ${Number(request.price || 0).toLocaleString("ar-SA")}
            ريال
          </strong>

        </div>

        <div class="info-row">

          <span>
            المدة
          </span>

          <strong>
            ${request.duration || "-"}
          </strong>

        </div>

      `;


      list.appendChild(card);

    });

}


/* ---------------------------------------------------------
   التقييمات
--------------------------------------------------------- */

async function loadOperatorRatings(){

  const user =
    await getOperatorCurrentUser();

  if(!user)
    return;


  const snapshot =
    await window.ma3daGetDocs(
      window.ma3daCollection(
        window.ma3daDB,
        "ratings"
      )
    );


  let total = 0;
  let count = 0;


  const ratings = [];


  snapshot.forEach(docSnap => {

    const data =
      docSnap.data();


    if(
      data.operatorId === user.uid
    ){

      const rating =
        Number(data.rating || 0);


      if(rating > 0){

        total += rating;
        count++;

        ratings.push(
          data
        );

      }

    }

  });


  const average =
    count
      ? (total / count).toFixed(1)
      : "0.0";


  const averageElement =
    document.getElementById(
      "operatorAverageRating"
    );

  const countElement =
    document.getElementById(
      "operatorRatingCount"
    );


  if(averageElement)
    averageElement.textContent =
      average;

  if(countElement)
    countElement.textContent =
      `${count} تقييم`;


  const list =
    document.getElementById(
      "operatorRatingsList"
    );


  if(!list)
    return;


  list.innerHTML = "";


  ratings.forEach(rating => {

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "card";


    card.innerHTML = `

      <div class="info-row">

        <span>
          تقييم العميل
        </span>

        <strong>
          ${"⭐".repeat(
            Math.min(
              5,
              Number(rating.rating || 0)
            )
          )}
        </strong>

      </div>

      ${
        rating.comment
          ? `
            <p>
              ${rating.comment}
            </p>
          `
          : ""
      }

    `;


    list.appendChild(card);

  });

}


/* ---------------------------------------------------------
   تعديل المعدة
--------------------------------------------------------- */

async function loadOperatorEquipmentEditor(){

  const equipment =
    await getOperatorEquipment();

  if(!equipment)
    return;


  const type =
    document.getElementById(
      "operatorEquipmentTypeEdit"
    );

  const model =
    document.getElementById(
      "operatorEquipmentModelEdit"
    );

  const year =
    document.getElementById(
      "operatorEquipmentYearEdit"
    );

  const city =
    document.getElementById(
      "operatorEquipmentCityEdit"
    );

  const price =
    document.getElementById(
      "operatorEquipmentPriceEdit"
    );

  const availability =
    document.getElementById(
      "operatorEquipmentAvailabilityEdit"
    );

  const image =
    document.getElementById(
      "operatorEquipmentImagePreview"
    );


  if(type)
    type.value =
      equipment.type || "";

  if(model)
    model.value =
      equipment.model || "";

  if(year)
    year.value =
      equipment.year || "";

  if(city)
    city.value =
      equipment.city || "";

  if(price)
    price.value =
      equipment.hourlyPrice || "";

  if(availability)
    availability.value =
      equipment.availability ||
      "available";

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

}


/* ---------------------------------------------------------
   حفظ تعديل المعدة
--------------------------------------------------------- */

async function saveOperatorEquipmentChanges(){

  const user =
    await getOperatorCurrentUser();

  if(!user)
    return;


  const type =
    document.getElementById(
      "operatorEquipmentTypeEdit"
    ).value.trim();

  const model =
    document.getElementById(
      "operatorEquipmentModelEdit"
    ).value.trim();

  const year =
    document.getElementById(
      "operatorEquipmentYearEdit"
    ).value.trim();

  const city =
    document.getElementById(
      "operatorEquipmentCityEdit"
    ).value.trim();

  const price =
    Number(
      document.getElementById(
        "operatorEquipmentPriceEdit"
      ).value
    );

  const availability =
    document.getElementById(
      "operatorEquipmentAvailabilityEdit"
    ).value;


  if(
    !type ||
    !model ||
    !year ||
    !city ||
    !price
  ){

    alert(
      "أكمل بيانات المعدة."
    );

    return;

  }


  const equipmentRef =
    window.ma3daDoc(
      window.ma3daDB,
      "equipment",
      user.uid
    );


  const currentSnap =
    await window.ma3daGetDoc(
      equipmentRef
    );


  const current =
    currentSnap.exists()
      ? currentSnap.data()
      : {};


  const imageInput =
    document.getElementById(
      "operatorEquipmentImageEdit"
    );


  let image =
    current.image || "";


  if(
    imageInput &&
    imageInput.files &&
    imageInput.files[0]
  ){

    image =
      await resizeOperatorImage(
        imageInput.files[0]
      );

  }


  await window.ma3daSetDoc(
    equipmentRef,
    {

      ...current,

      type,

      model,

      year,

      city,

      hourlyPrice:
        price,

      availability,

      image,

      ownerId:
        user.uid,

      ownerEmail:
        user.email || ""

    }
  );


  alert(
    "تم حفظ بيانات المعدة بنجاح 🚜"
  );


  await loadOperatorDashboard();


  showScreen(
    "operatorHomeScreen"
  );

}


/* ---------------------------------------------------------
   ضغط الصورة
--------------------------------------------------------- */

function resizeOperatorImage(
  file
){

  return new Promise(
    resolve => {

      const reader =
        new FileReader();


      reader.onload = event => {

        const img =
          new Image();


        img.onload = () => {

          const maxWidth =
            1000;


          const scale =
            Math.min(
              1,
              maxWidth /
              img.width
            );


          const canvas =
            document.createElement(
              "canvas"
            );


          canvas.width =
            img.width * scale;

          canvas.height =
            img.height * scale;


          const ctx =
            canvas.getContext(
              "2d"
            );


          ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
          );


          resolve(
            canvas.toDataURL(
              "image/jpeg",
              .75
            )
          );

        };


        img.src =
          event.target.result;

      };


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* ---------------------------------------------------------
   إعدادات صاحب المعدة
--------------------------------------------------------- */

async function loadOperatorSettings(){

  const user =
    await getOperatorCurrentUser();

  if(!user)
    return;


  const ref =
    window.ma3daDoc(
      window.ma3daDB,
      "operators",
      user.uid
    );


  const snap =
    await window.ma3daGetDoc(
      ref
    );


  const data =
    snap.exists()
      ? snap.data()
      : {};


  const name =
    document.getElementById(
      "operatorSettingsName"
    );

  const phone =
    document.getElementById(
      "operatorSettingsPhone"
    );

  const city =
    document.getElementById(
      "operatorSettingsCity"
    );

  const email =
    document.getElementById(
      "operatorSettingsEmail"
    );


  if(name)
    name.value =
      data.name || "";

  if(phone)
    phone.value =
      data.phone || "";

  if(city)
    city.value =
      data.city || "";

  if(email)
    email.textContent =
      user.email || "-";

}


/* ---------------------------------------------------------
   حفظ الإعدادات
--------------------------------------------------------- */

async function saveOperatorSettings(){

  const user =
    await getOperatorCurrentUser();

  if(!user)
    return;


  const name =
    document.getElementById(
      "operatorSettingsName"
    ).value.trim();

  const phone =
    document.getElementById(
      "operatorSettingsPhone"
    ).value.trim();

  const city =
    document.getElementById(
      "operatorSettingsCity"
    ).value.trim();


  if(!name || !phone || !city){

    alert(
      "أكمل بيانات الحساب."
    );

    return;

  }


  await window.ma3daSetDoc(
    window.ma3daDoc(
      window.ma3daDB,
      "operators",
      user.uid
    ),
    {

      name,

      phone,

      city,

      email:
        user.email || "",

      operatorId:
        user.uid,

      updatedAt:
        Date.now()

    },
    {
      merge: true
    }
  );


  alert(
    "تم حفظ بيانات الحساب."
  );


  await loadOperatorDashboard();

}


/* =========================================================
   EVENTS
========================================================= */


/* الطلبات الجديدة */

document.addEventListener(
  "click",
  async event => {

    const acceptBtn =
      event.target.closest(
        "[data-accept-request]"
      );

    if(acceptBtn){

      await acceptOperatorRequest(
        acceptBtn.dataset.acceptRequest
      );

      return;

    }


    const rejectBtn =
      event.target.closest(
        "[data-reject-request]"
      );

    if(rejectBtn){

      await rejectOperatorRequest(
        rejectBtn.dataset.rejectRequest
      );

    }

  }
);


/* الرئيسية */

const operatorNewRequestsBtn =
  document.getElementById(
    "operatorNewRequestsBtn"
  );

if(operatorNewRequestsBtn){

  operatorNewRequestsBtn.addEventListener(
    "click",
    async () => {

      await loadOperatorNewRequests();

      showScreen(
        "operatorNewRequestsScreen"
      );

    }
  );

}


const operatorCurrentOrderBtn =
  document.getElementById(
    "operatorCurrentOrderBtn"
  );

if(operatorCurrentOrderBtn){

  operatorCurrentOrderBtn.addEventListener(
    "click",
    async () => {

      await loadOperatorCurrentOrder();

      showScreen(
        "operatorCurrentOrderScreen"
      );

    }
  );

}


const operatorPreviousOrdersBtn =
  document.getElementById(
    "operatorPreviousOrdersBtn"
  );

if(operatorPreviousOrdersBtn){

  operatorPreviousOrdersBtn.addEventListener(
    "click",
    async () => {

      await loadOperatorPreviousOrders();

      showScreen(
        "operatorPreviousOrdersScreen"
      );

    }
  );

}


/* معدتي */

const operatorEditEquipmentBtn =
  document.getElementById(
    "operatorEditEquipmentBtn"
  );

if(operatorEditEquipmentBtn){

  operatorEditEquipmentBtn.addEventListener(
    "click",
    async () => {

      await loadOperatorEquipmentEditor();

      showScreen(
        "operatorEquipmentScreen"
      );

    }
  );

}


const saveOperatorEquipmentBtn =
  document.getElementById(
    "saveOperatorEquipmentBtn"
  );

if(saveOperatorEquipmentBtn){

  saveOperatorEquipmentBtn.addEventListener(
    "click",
    saveOperatorEquipmentChanges
  );

}


/* الدخل */

const operatorIncomeBtn =
  document.getElementById(
    "operatorIncomeBtn"
  );

if(operatorIncomeBtn){

  operatorIncomeBtn.addEventListener(
    "click",
    async () => {

      await loadOperatorIncome();

      showScreen(
        "operatorIncomeScreen"
      );

    }
  );

}


/* التقييمات */

const operatorRatingsBtn =
  document.getElementById(
    "operatorRatingsBtn"
  );

if(operatorRatingsBtn){

  operatorRatingsBtn.addEventListener(
    "click",
    async () => {

      await loadOperatorRatings();

      showScreen(
        "operatorRatingsScreen"
      );

    }
  );

}


/* الإعدادات */

const operatorSettingsBtn =
  document.getElementById(
    "operatorSettingsBtn"
  );

if(operatorSettingsBtn){

  operatorSettingsBtn.addEventListener(
    "click",
    async () => {

      await loadOperatorSettings();

      showScreen(
        "operatorSettingsScreen"
      );

    }
  );

}


const saveOperatorSettingsBtn =
  document.getElementById(
    "saveOperatorSettingsBtn"
  );

if(saveOperatorSettingsBtn){

  saveOperatorSettingsBtn.addEventListener(
    "click",
    saveOperatorSettings
  );

}


/* تغيير كلمة المرور */

const operatorChangePasswordBtn =
  document.getElementById(
    "operatorChangePasswordBtn"
  );

if(operatorChangePasswordBtn){

  operatorChangePasswordBtn.addEventListener(
    "click",
    async () => {

      const user =
        await getOperatorCurrentUser();

      if(
        user &&
        user.email &&
        window.ma3daSendPasswordResetEmail
      ){

        await window.ma3daSendPasswordResetEmail(
          user.email
        );

        alert(
          "تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني."
        );

      }

    }
  );

}


/* الدعم */

const operatorSupportBtn =
  document.getElementById(
    "operatorSupportBtn"
  );

if(operatorSupportBtn){

  operatorSupportBtn.addEventListener(
    "click",
    () => {

      showScreen(
        "operatorSupportScreen"
      );

    }
  );

}


/* الدعم واتساب */

const operatorSupportWhatsAppBtn =
  document.getElementById(
    "operatorSupportWhatsAppBtn"
  );

if(operatorSupportWhatsAppBtn){

  operatorSupportWhatsAppBtn.addEventListener(
    "click",
    () => {

      window.open(
        "https://wa.me/966500000000",
        "_blank"
      );

    }
  );

}


/* وصلت */

const operatorArrivedBtn =
  document.getElementById(
    "operatorArrivedBtn"
  );

if(operatorArrivedBtn){

  operatorArrivedBtn.addEventListener(
    "click",
    operatorMarkArrived
  );

}


/* بدء العمل */

const operatorStartWorkBtn =
  document.getElementById(
    "operatorStartWorkBtn"
  );

if(operatorStartWorkBtn){

  operatorStartWorkBtn.addEventListener(
    "click",
    operatorStartWork
  );

}


/* إنهاء العمل */

const operatorEndWorkBtn =
  document.getElementById(
    "operatorEndWorkBtn"
  );

if(operatorEndWorkBtn){

  operatorEndWorkBtn.addEventListener(
    "click",
    operatorFinishWork
  );

}


/* الاتصال */

const operatorCallCustomerBtn =
  document.getElementById(
    "operatorCallCustomerBtn"
  );

if(operatorCallCustomerBtn){

  operatorCallCustomerBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "tel:0550000000";

    }
  );

}


/* المحادثة */

const operatorChatCustomerBtn =
  document.getElementById(
    "operatorChatCustomerBtn"
  );

if(operatorChatCustomerBtn){

  operatorChatCustomerBtn.addEventListener(
    "click",
    () => {

      showScreen(
        "chatScreen"
      );

    }
  );

}


/* =========================================================
   BACK BUTTONS
========================================================= */

const backOperatorNewRequests =
  document.getElementById(
    "backFromOperatorNewRequestsBtn"
  );

if(backOperatorNewRequests){

  backOperatorNewRequests.addEventListener(
    "click",
    () => {

      showScreen(
        "operatorHomeScreen"
      );

    }
  );

}


const backOperatorCurrent =
  document.getElementById(
    "backFromOperatorCurrentOrderBtn"
  );

if(backOperatorCurrent){

  backOperatorCurrent.addEventListener(
    "click",
    () => {

      clearInterval(
        operatorTimerInterval
      );

      showScreen(
        "operatorHomeScreen"
      );

    }
  );

}


const backOperatorPrevious =
  document.getElementById(
    "backFromOperatorPreviousOrdersBtn"
  );

if(backOperatorPrevious){

  backOperatorPrevious.addEventListener(
    "click",
    () => {

      showScreen(
        "operatorHomeScreen"
      );

    }
  );

}


const backOperatorEquipment =
  document.getElementById(
    "backFromOperatorEquipmentBtn"
  );

if(backOperatorEquipment){

  backOperatorEquipment.addEventListener(
    "click",
    async () => {

      await loadOperatorDashboard();

      showScreen(
        "operatorHomeScreen"
      );

    }
  );

}


const backOperatorIncome =
  document.getElementById(
    "backFromOperatorIncomeBtn"
  );

if(backOperatorIncome){

  backOperatorIncome.addEventListener(
    "click",
    () => {

      showScreen(
        "operatorHomeScreen"
      );

    }
  );

}


const backOperatorRatings =
  document.getElementById(
    "backFromOperatorRatingsBtn"
  );

if(backOperatorRatings){

  backOperatorRatings.addEventListener(
    "click",
    () => {

      showScreen(
        "operatorHomeScreen"
      );

    }
  );

}


const backOperatorSettings =
  document.getElementById(
    "backFromOperatorSettingsBtn"
  );

if(backOperatorSettings){

  backOperatorSettings.addEventListener(
    "click",
    () => {

      showScreen(
        "operatorHomeScreen"
      );

    }
  );

}


const backOperatorSupport =
  document.getElementById(
    "backFromOperatorSupportBtn"
  );

if(backOperatorSupport){

  backOperatorSupport.addEventListener(
    "click",
    () => {

      showScreen(
        "operatorHomeScreen"
      );

    }
  );

}


/* =========================================================
   تسجيل خروج صاحب المعدة
========================================================= */

const operatorHomeLogoutBtn =
  document.getElementById(
    "operatorHomeLogoutBtn"
  );

if(operatorHomeLogoutBtn){

  operatorHomeLogoutBtn.addEventListener(
    "click",
    async () => {

      try{

        clearInterval(
          operatorTimerInterval
        );


        if(window.ma3daAuth){

          await window.ma3daAuth.signOut();

        }


        localStorage.removeItem(
          "selectedRole"
        );

        localStorage.removeItem(
          "currentOrder"
        );

        localStorage.removeItem(
          "currentRequestId"
        );

        localStorage.removeItem(
          "orderState"
        );

        localStorage.removeItem(
          "acceptedOrder"
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

      }

    }
  );

}
