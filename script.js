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
 
  /* ننتظر Firebase بشكل صريح. */
 
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
 
    /* نحفظ الطلب محليًا فقط بعد نجاح Firebase. */
 
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
 
  localStorage.setItem("orderState", state);
 
}
 
function getOrderState(){
 
  return (
    localStorage.getItem("orderState") || ""
  );
 
}
 
/* LOAD ORDER */
 
function loadOrder(){
 
  const saved =
    localStorage.getItem("currentOrder");
 
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
 
    localStorage.removeItem("currentOrder");
 
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
    document.getElementById("matchedEquipment");
 
  const location =
    document.getElementById("matchedLocation");
 
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
    document.getElementById("workingEquipment");
 
  const location =
    document.getElementById("workingLocation");
 
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
    document.getElementById("operatorEquipment");
 
  const location =
    document.getElementById("operatorLocation");
 
  const duration =
    document.getElementById("operatorDuration");
 
  const price =
    document.getElementById("operatorPrice");
 
  const notes =
    document.getElementById("operatorNotes");
 
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
  document.getElementById("requestBtn");
 
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
 
      localStorage.setItem("selectedRole", "customer");
 
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
          localStorage.getItem("currentRequestId");
 
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
 
            localStorage.setItem("orderAccepted", "true");
 
            setOrderState(
              "accepted"
            );
 
            updateMatchedScreen();
 
            updateWorkingScreen();
 
            if(
              document.getElementById("searchingScreen")?.classList.contains(
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
              document.getElementById("arrivedCustomerEquipment");
 
            const arrivedLocation =
              document.getElementById("arrivedCustomerLocation");
 
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
 
            localStorage.removeItem("acceptedOrder");
 
            localStorage.removeItem("orderAccepted");
 
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
  document.getElementById("customerRoleBtn");
 
if(customerRoleBtn){
 
  customerRoleBtn.addEventListener(
    "click",
    ()=>{
 
      selectedRole =
        "customer";
 
      localStorage.setItem("selectedRole", "customer");
 
      const text =
        document.getElementById("phoneRoleText");
 
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
  document.getElementById("operatorRoleBtn");
 
if(operatorRoleBtn){
 
  operatorRoleBtn.addEventListener(
    "click",
    ()=>{
 
      selectedRole =
        "operator";
 
      localStorage.setItem("selectedRole", "operator");
 
      stopAcceptanceWatcher();
 
      const text =
        document.getElementById("phoneRoleText");
 
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
  document.getElementById("sendCodeBtn");
 
const createAccountBtn =
  document.getElementById("createAccountBtn");
 
const forgotPasswordBtn =
  document.getElementById("forgotPasswordBtn");
 
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
      document.getElementById("emailError")
 
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
  document.getElementById("sendResetPasswordBtn");
 
if(sendResetPasswordBtn){
 
  sendResetPasswordBtn.addEventListener(
    "click",
    async()=>{
 
      const resetEmail =
        document.getElementById("resetEmail");
 
      const email =
        resetEmail
          ?.value
          .trim();
 
      if(!email){
 
        alert(
          "أدخل بريدك الإلكتروني أولاً"
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
          email
        );
 
        alert(
          "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
        );
 
        showScreen(
          "phoneScreen"
        );
 
      }catch(error){
 
        console.error(
          "تعذر إرسال رابط استعادة كلمة المرور:",
          error
        );
 
        alert(
          "تعذر إرسال رابط استعادة كلمة المرور"
        );
 
      }
 
    }
  );
 
}
 
/* LOGIN */
 
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
 
        return;
 
      }
 
      const user =
        await window.ma3daLogin(
          email,
          password
        );
 
      if(!user)
        return;
 
      localStorage.setItem(
        "ma3daLoggedIn",
        "true"
      );
 
      const role =
        localStorage.getItem(
          "selectedRole"
        );
 
      if(role === "operator"){
 
        await openOperatorAfterLogin();
 
      }else{
 
        selectedRole =
          "customer";
 
        showScreen(
          "customerHomeScreen"
        );
 
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
 
      /* تم إرسال رابط التحقق من Firebase */
 
      alert(
        "تم إنشاء الحساب بنجاح ✅\n\n" +
        "تم إرسال رابط التحقق إلى بريدك الإلكتروني 📧\n\n" +
        "افتح البريد واضغط على رابط التحقق، ثم ارجع وسجّل الدخول."
      );
 
      /* نخرج المستخدم من شاشة الحساب الجديد */
 
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
    async()=>{

      const resetEmail =
        document.getElementById("resetEmail");

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
  document.getElementById("backFromForgotPasswordBtn");

if(backFromForgotPasswordBtn){

  backFromForgotPasswordBtn.addEventListener(
    "click",
    ()=>{

      const resetEmail =
        document.getElementById("resetEmail");

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

        localStorage.setItem("selectedRole", selectedRole);

        if(
          selectedRole ===
          "customer"
        ){

          showScreen(
            "customerDataScreen"
          );

          return;

        }

        if (
          selectedRole === "contractor"
        ) {

          if (
            typeof window.openContractorHome === "function"
          ) {

            await window.openContractorHome();

          } else {

            console.error(
              "openContractorHome غير موجود"
            );

            if (error) {
              error.textContent =
                "تعذر فتح صفحة المقاول، أعد تحميل الصفحة";
            }

          }

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

      /* تم إرسال رابط التحقق من Firebase */

      alert(
        "تم إنشاء الحساب بنجاح ✅\n\n" +
        "تم إرسال رابط التحقق إلى بريدك الإلكتروني 📧\n\n" +
        "افتح البريد واضغط على رابط التحقق، ثم ارجع وسجّل الدخول."
      );

      /* نخرج المستخدم من شاشة الحساب الجديد */

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
  document.getElementById("acceptRequestBtn");

const arrivedAtCustomerBtn =
  document.getElementById("arrivedAtCustomerBtn");

if(arrivedAtCustomerBtn){

  arrivedAtCustomerBtn.addEventListener(
    "click",
    async()=>{

      const requestId =
        localStorage.getItem("currentRequestId");

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
          document.getElementById("acceptedCustomerLocation");

        const arrivedLocation =
          document.getElementById("arrivedCustomerLocation");

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
        localStorage.getItem("currentRequestId");

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
          document.getElementById("acceptedCustomerLocation");

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

        localStorage.setItem("orderAccepted", "true");

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
  document.getElementById("rejectRequestBtn");

if(rejectRequestBtn){

  rejectRequestBtn.addEventListener(
    "click",
    async()=>{

      const requestId =
        localStorage.getItem("currentRequestId");

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

        localStorage.removeItem("acceptedOrder");

        localStorage.removeItem("orderAccepted");

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
  document.getElementById("saveEquipmentBtn");

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
    document.getElementById("equipmentImage");

  /* التحقق من نوع المعدة */

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

  /* التحقق من البيانات */

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
  document.getElementById("equipmentType");

const otherEquipmentContainer =
  document.getElementById("otherEquipmentContainer");

const otherEquipmentType =
  document.getElementById("otherEquipmentType");

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
  document.getElementById("trackingBtn");

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

/* =========================================================
   CHAT
   CUSTOMER + EQUIPMENT OWNER

   FIRESTORE PATH:
   requests/{requestId}/messages/{messageId}
========================================================= */
/* =========================================================
   CHAT
   CUSTOMER + EQUIPMENT OWNER + CONTRACTOR

   FIRESTORE PATH:
   requests/{requestId}/messages/{messageId}
========================================================= */


/* =========================================================
   CHAT VARIABLES
========================================================= */

let chatMessagesUnsubscribe = null;
let chatSending = false;


/* =========================================================
   GET CURRENT USER
========================================================= */

async function getChatCurrentUser(){

  try{

    if(window.ma3daFirebaseReady){

      await window.ma3daFirebaseReady;

    }

    if(
      typeof window.ma3daGetCurrentUser ===
      "function"
    ){

      const user =
        await window.ma3daGetCurrentUser();

      if(user){

        return user;

      }

    }

    if(
      window.ma3daAuth &&
      window.ma3daAuth.currentUser
    ){

      return window.ma3daAuth.currentUser;

    }

    return null;

  }catch(error){

    console.error(
      "CHAT USER ERROR:",
      error
    );

    return null;

  }

}


/* =========================================================
   GET CURRENT REQUEST ID
========================================================= */

function getChatRequestId(){

  const requestId =
    localStorage.getItem(
      "currentRequestId"
    );

  if(
    !requestId ||
    String(requestId).trim() === ""
  ){

    return null;

  }

  return String(
    requestId
  ).trim();

}


/* =========================================================
   GET CHAT MESSAGES COLLECTION

   requests/{requestId}/messages
========================================================= */

function getChatMessagesCollection(
  requestId
){

  if(
    !requestId ||
    !window.ma3daDB ||
    typeof window.ma3daCollection !==
      "function"
  ){

    return null;

  }

  return window.ma3daCollection(
    window.ma3daDB,
    "requests",
    requestId,
    "messages"
  );

}


/* =========================================================
   OPEN CHAT
========================================================= */

async function openMa3daChat(){

  try{

    const user =
      await getChatCurrentUser();

    if(!user){

      alert(
        "يجب تسجيل الدخول أولًا."
      );

      return;

    }

    const requestId =
      getChatRequestId();

    if(!requestId){

      alert(
        "لا يوجد طلب مرتبط بالمحادثة."
      );

      return;

    }

    showScreen(
      "chatScreen"
    );

    await startChatListener();

    setTimeout(
      ()=>{

        const input =
          document.getElementById(
            "chatInput"
          );

        if(input){

          input.focus();

        }

      },
      100
    );

  }catch(error){

    console.error(
      "OPEN CHAT ERROR:",
      error
    );

    alert(
      "تعذر فتح المحادثة."
    );

  }

}


/* =========================================================
   CUSTOMER CHAT BUTTON
========================================================= */

const chatBtn =
  document.getElementById(
    "chatBtn"
  );

if(chatBtn){

  chatBtn.addEventListener(
    "click",
    openMa3daChat
  );

}


/* =========================================================
   OPERATOR CHAT BUTTON
   IMPORTANT:
   THIS IS THE ONLY DECLARATION
   OF operatorChatCustomerBtn
========================================================= */

const operatorChatCustomerBtn =
  document.getElementById(
    "operatorChatCustomerBtn"
  );

if(operatorChatCustomerBtn){

  operatorChatCustomerBtn.addEventListener(
    "click",
    openMa3daChat
  );

}


/* =========================================================
   SEND CHAT MESSAGE
========================================================= */

async function sendChatMessage(){

  if(chatSending){

    return;

  }

  const input =
    document.getElementById(
      "chatInput"
    );

  if(!input){

    console.error(
      "CHAT: chatInput غير موجود."
    );

    return;

  }

  const text =
    input.value.trim();

  if(!text){

    return;

  }

  chatSending =
    true;

  const sendButton =
    document.getElementById(
      "sendChatBtn"
    );

  if(sendButton){

    sendButton.disabled =
      true;

  }

  try{

    if(window.ma3daFirebaseReady){

      await window.ma3daFirebaseReady;

    }

    const user =
      await getChatCurrentUser();

    if(!user){

      alert(
        "يجب تسجيل الدخول لإرسال الرسالة."
      );

      return;

    }

    const requestId =
      getChatRequestId();

    if(!requestId){

      alert(
        "لا يوجد طلب مرتبط بهذه المحادثة."
      );

      return;

    }

    if(
      !window.ma3daDB ||
      typeof window.ma3daCollection !==
        "function" ||
      typeof window.ma3daAddDoc !==
        "function"
    ){

      throw new Error(
        "أدوات Firestore غير جاهزة."
      );

    }

    const messagesCollection =
      getChatMessagesCollection(
        requestId
      );

    if(!messagesCollection){

      throw new Error(
        "تعذر إنشاء مسار رسائل الشات."
      );

    }

    await window.ma3daAddDoc(
      messagesCollection,
      {

        text:
          text,

        senderId:
          user.uid,

        senderRole:
          selectedRole || "",

        createdAt:
          Date.now()

      }
    );

    input.value =
      "";

    input.focus();

    await loadChatMessages();

  }catch(error){

    console.error(
      "SEND CHAT MESSAGE ERROR:",
      error
    );

    alert(
      "تعذر إرسال الرسالة:\n" +
      (
        error?.code ||
        ""
      ) +
      "\n" +
      (
        error?.message ||
        "خطأ غير معروف"
      )
    );

  }finally{

    chatSending =
      false;

    if(sendButton){

      sendButton.disabled =
        false;

    }

  }

}


/* =========================================================
   LOAD CHAT MESSAGES
========================================================= */

async function loadChatMessages(){

  try{

    if(window.ma3daFirebaseReady){

      await window.ma3daFirebaseReady;

    }

    const user =
      await getChatCurrentUser();

    if(!user){

      return;

    }

    const requestId =
      getChatRequestId();

    const messages =
      document.getElementById(
        "chatMessages"
      );

    if(!messages){

      console.error(
        "CHAT: chatMessages غير موجود."
      );

      return;

    }

    if(!requestId){

      messages.innerHTML = `
        <div class="message received">
          لا توجد محادثة مرتبطة بالطلب الحالي.
        </div>
      `;

      return;

    }

    if(
      !window.ma3daDB ||
      typeof window.ma3daCollection !==
        "function" ||
      typeof window.ma3daGetDocs !==
        "function"
    ){

      console.error(
        "CHAT: أدوات Firestore غير جاهزة."
      );

      return;

    }

    const messagesCollection =
      getChatMessagesCollection(
        requestId
      );

    if(!messagesCollection){

      return;

    }

    const snapshot =
      await window.ma3daGetDocs(
        messagesCollection
      );

    const chatMessages =
      [];

    snapshot.forEach(
      messageDoc=>{

        const data =
          messageDoc.data() || {};

        chatMessages.push({

          id:
            messageDoc.id,

          ...data

        });

      }
    );

    chatMessages.sort(
      (a,b)=>{

        return (
          Number(
            a.createdAt || 0
          ) -
          Number(
            b.createdAt || 0
          )
        );

      }
    );

    messages.innerHTML =
      "";

    if(
      chatMessages.length ===
      0
    ){

      messages.innerHTML = `
        <div class="message received">
          لا توجد رسائل بعد.
        </div>
      `;

      return;

    }

    chatMessages.forEach(
      data=>{

        const isMine =
          String(
            data.senderId || ""
          ) ===
          String(
            user.uid
          );

        const message =
          document.createElement(
            "div"
          );

        message.className =
          isMine
            ? "message sent"
            : "message received";

        message.textContent =
          data.text || "";

        messages.appendChild(
          message
        );

      }
    );

    messages.scrollTop =
      messages.scrollHeight;

  }catch(error){

    console.error(
      "LOAD CHAT MESSAGES ERROR:",
      error
    );

    const messages =
      document.getElementById(
        "chatMessages"
      );

    if(messages){

      messages.innerHTML = `
        <div class="message received">
          تعذر تحميل رسائل المحادثة.
        </div>
      `;

    }

  }

}


/* =========================================================
   STOP CHAT LISTENER
========================================================= */

function stopChatListener(){

  if(chatMessagesUnsubscribe){

    clearInterval(
      chatMessagesUnsubscribe
    );

    chatMessagesUnsubscribe =
      null;

  }

}


/* =========================================================
   START CHAT LISTENER
========================================================= */

async function startChatListener(){

  try{

    stopChatListener();

    if(window.ma3daFirebaseReady){

      await window.ma3daFirebaseReady;

    }

    const user =
      await getChatCurrentUser();

    if(!user){

      console.error(
        "CHAT: لا يوجد مستخدم مسجل."
      );

      return;

    }

    const requestId =
      getChatRequestId();

    if(!requestId){

      const messages =
        document.getElementById(
          "chatMessages"
        );

      if(messages){

        messages.innerHTML = `
          <div class="message received">
            لا توجد محادثة مرتبطة بالطلب الحالي.
          </div>
        `;

      }

      return;

    }

    /* أول تحميل */

    await loadChatMessages();

    /*
      نستخدم polling بدلاً من onSnapshot
      للحفاظ على توافق الكود الحالي.
    */

    chatMessagesUnsubscribe =
      setInterval(
        ()=>{

          const chatScreen =
            document.getElementById(
              "chatScreen"
            );

          if(
            !chatScreen ||
            !chatScreen.classList.contains(
              "active"
            )
          ){

            return;

          }

          loadChatMessages();

        },
        1500
      );

  }catch(error){

    console.error(
      "START CHAT LISTENER ERROR:",
      error
    );

  }

}


/* =========================================================
   SEND BUTTON
========================================================= */

document.addEventListener(
  "click",
  function(event){

    const sendButton =
      event.target.closest(
        "#sendChatBtn"
      );

    if(!sendButton){

      return;

    }

    event.preventDefault();

    sendChatMessage();

  }
);


/* =========================================================
   ENTER TO SEND
========================================================= */

document.addEventListener(
  "keydown",
  function(event){

    if(
      event.key !== "Enter" ||
      event.shiftKey
    ){

      return;

    }

    const input =
      event.target.closest(
        "#chatInput"
      );

    if(!input){

      return;

    }

    event.preventDefault();

    sendChatMessage();

  }
);

/* TRACKING */
 
function startTracking(){
 
  const marker =
    document.getElementById("equipmentMarker");
 
  const distance =
    document.getElementById("distanceText");
 
  const eta =
    document.getElementById("etaText");
 
  const status =
    document.getElementById("trackingStatus");
 
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
 
/* CUSTOMER WORKING TIMER */
 
function updateTimer(){
 
  if(!workStartTime)
    return;
 
  const elapsed =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          workStartTime
        ) / 1000
      )
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
    document.getElementById("timer");
 
  if(timer){
 
    timer.textContent =
      `${String(hours).padStart(2,"0")}:` +
      `${String(minutes).padStart(2,"0")}:` +
      `${String(seconds).padStart(2,"0")}`;
 
  }
 
}
 
function startCustomerWorkTimer(
  startTime
){
 
  clearInterval(
    timerInterval
  );
 
  workStartTime =
    Number(
      startTime ||
      Date.now()
    );
 
  updateTimer();
 
  timerInterval =
    setInterval(
      updateTimer,
      1000
    );
 
}
 
function stopCustomerWorkTimer(){
 
  clearInterval(
    timerInterval
  );
 
  timerInterval =
    null;
 
}
 
/* CUSTOMER CALL */
 
const callBtn =
  document.getElementById("callBtn");
 
if(callBtn){
 
  callBtn.addEventListener(
    "click",
    async()=>{
 
      try{
 
        const requestId =
          localStorage.getItem("currentRequestId");
 
        if(!requestId){
 
          alert(
            "لا يوجد طلب حالي."
          );
 
          return;
 
        }
 
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
 
        if(!snapshot.exists()){
 
          alert(
            "تعذر العثور على الطلب."
          );
 
          return;
 
        }
 
        const data =
          snapshot.data();
 
        const phone =
          data.operatorPhone ||
          "";
 
        if(!phone){
 
          alert(
            "رقم صاحب المعدة غير متوفر حاليًا."
          );
 
          return;
 
        }
 
        window.location.href =
          `tel:${phone}`;
 
      }catch(error){
 
        console.error(
          "تعذر الاتصال بصاحب المعدة:",
          error
        );
 
        alert(
          "تعذر الاتصال حاليًا."
        );
 
      }
 
    }
  );
 
}
 
/* CUSTOMER END WORK */
 
const customerStartWorkButton =
  document.getElementById("startWorkBtn");
 
if(customerStartWorkButton){
 
  customerStartWorkButton.style.display =
    "none";
 
  customerStartWorkButton.disabled =
    true;
 
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
            document.getElementById("confirmPaymentBtn");
 
          if(confirm)
            confirm.disabled =
              false;
 
        }
      );
 
    }
  );
 
const paymentBtn =
  document.getElementById("paymentBtn");
 
if(paymentBtn){
 
  paymentBtn.addEventListener(
    "click",
    ()=>{
 
      if(
        typeof stopAcceptanceWatcher ===
        "function"
      ){
 
        stopAcceptanceWatcher();
 
      }
 
      showScreen(
        "paymentScreen"
      );
 
    }
  );
 
}
 
const confirmPaymentBtn =
  document.getElementById("confirmPaymentBtn");
 
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
            document.getElementById("ratingBtn");
 
          if(ratingBtn)
            ratingBtn.disabled =
              false;
 
        }
      );
 
    }
  );
 
const ratingBtn =
  document.getElementById("ratingBtn");
 
if(ratingBtn){
 
  ratingBtn.addEventListener(
    "click",
    async()=>{
 
      if(!selectedRating){
 
        alert(
          "اختر التقييم أولًا."
        );
 
        return;
 
      }
 
      const requestId =
        localStorage.getItem("currentRequestId");
 
      try{
 
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
 
              rating:
                selectedRating,
 
              ratedAt:
                Date.now()
 
            }
          );
 
        }
 
        showScreen(
          "thankYouScreen"
        );
 
      }catch(error){
 
        console.error(
          "تعذر حفظ التقييم:",
          error
        );
 
        alert(
          "تعذر حفظ التقييم، حاول مرة أخرى."
        );
 
      }
 
    }
  );
 
}
 
/* NEW REQUEST */
 
const newRequestButtons =
  document.querySelectorAll(
    "#newRequestBtn, #thankYouNewRequestBtn"
  );
 
newRequestButtons.forEach(
  button=>{
 
    button.addEventListener(
      "click",
      ()=>{
 
        selectedPayment =
          "";
 
        selectedRating =
          0;
 
        showScreen(
          "requestScreen"
        );
 
      }
    );
 
  }
);
 
/* BACK ROLE */
 
const backRoleBtn =
  document.getElementById("backRoleBtn");
 
if(backRoleBtn){
 
  backRoleBtn.addEventListener(
    "click",
    ()=>{
 
      const email =
        document.getElementById("emailInput");
 
      const password =
        document.getElementById("passwordInput");
 
      const error =
        document.getElementById("emailError");
 
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
  document.getElementById("backPhoneBtn");
 
if(backPhoneBtn){
 
  backPhoneBtn.addEventListener(
    "click",
    ()=>{
 
      const otp =
        document.getElementById("otpInput");
 
      const error =
        document.getElementById("otpError");
 
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
 
/* LOGOUT HELPER */
 
async function ma3daLogout(){
 
  try{
 
    if(
      typeof stopAcceptanceWatcher ===
      "function"
    ){
 
      stopAcceptanceWatcher();
 
    }
 
    clearInterval(
      timerInterval
    );
 
    clearInterval(
      operatorTimerInterval
    );
 
    if(window.ma3daAuth){
 
      await window.ma3daAuth.signOut();
 
    }
 
    localStorage.removeItem("selectedRole");
 
    localStorage.removeItem("currentOrder");
 
    localStorage.removeItem("currentRequestId");
 
    localStorage.removeItem("orderState");
 
    localStorage.removeItem("acceptedOrder");
 
    localStorage.removeItem("workEnded");
 
    localStorage.removeItem("finalPrice");
 
    selectedRole =
      "";
 
    workStartTime =
      null;
 
    selectedPayment =
      "";
 
    selectedRating =
      0;
 
    showScreen(
      "roleScreen"
    );
 
  }catch(error){
 
    console.error(
      "خطأ في تسجيل الخروج:",
      error
    );
 
    alert(
      "تعذر تسجيل الخروج."
    );
 
  }
 
}
 
/* CUSTOMER LOGOUT */
 
const customerLogoutBtn =
  document.getElementById("customerLogoutBtn");
 
if(customerLogoutBtn){
 
  customerLogoutBtn.addEventListener(
    "click",
    ma3daLogout
  );
 
}
 
const logoutBtn =
  document.getElementById("logoutBtn");
 
if(logoutBtn){
 
  logoutBtn.addEventListener(
    "click",
    ma3daLogout
  );
 
}
 
/* BACK CUSTOMER REQUEST */
 
const backFromRequestBtn =
  document.getElementById("backFromRequestBtn");
 
if(backFromRequestBtn){
 
  backFromRequestBtn.addEventListener(
    "click",
    ()=>{
 
      showScreen(
        "customerHomeScreen"
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
      localStorage.getItem("selectedRole");
 
    console.log(
      "استعادة الجلسة:",
      user ? user.uid : "لا يوجد مستخدم",
      savedRole || "لا يوجد دور"
    );
 
    console.log(
      "emailVerified:",
      user ? user.emailVerified : "لا يوجد مستخدم"
    );
 
    if(
      user &&
      !user.emailVerified
    ){
 
      console.log(
        "المستخدم موجود لكن البريد غير موثق."
      );
 
      try{
 
        if(window.ma3daAuth){
 
          await window.ma3daAuth.signOut();
 
        }
 
      }catch(signOutError){
 
        console.error(
          "تعذر تسجيل الخروج من المستخدم غير الموثق:",
          signOutError
        );
 
      }
 
      localStorage.removeItem("selectedRole");
 
      selectedRole =
        "";
 
      showScreen(
        "roleScreen"
      );
 
      return;
 
    }
 
    if(!user){
 
      selectedRole =
        "";
 
      localStorage.removeItem("selectedRole");
 
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
 
    if(
      savedRole ===
      "operator"
    ){
 
      if(
        typeof openOperatorAfterLogin ===
        "function"
      ){
 
        await openOperatorAfterLogin();
 
      }else{
 
        await openOperatorDashboard();
 
      }
 
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
  document.getElementById("introNextBtn");
 
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
  document.getElementById("skipIntroBtn");
 
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
  document.getElementById("whyMa3daNextBtn");
 
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
  document.getElementById("whyMa3daSkipBtn");
 
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
  document.getElementById("startMa3daBtn");
 
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
  document.getElementById("howMa3daSkipBtn");
 
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
  document.getElementById("howMa3daBackBtn");
 
if(howMa3daBackBtn){
 
  howMa3daBackBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "whyMa3daScreen"
      );
    }
  );
 
}
 
/* SWIPE INTRO */
 
const introScreens = [
  document.getElementById("introScreen"),
  document.getElementById("whyMa3daScreen"),
  document.getElementById("howMa3daScreen"),
  document.getElementById("howWorksScreen")
];
 
let swipeStartX = 0;
let swipeStartY = 0;
 
introScreens.forEach(
  screen=>{
 
    if(!screen)
      return;
 
    screen.addEventListener(
      "touchstart",
      event=>{
 
        const touch =
          event.changedTouches[0];
 
        swipeStartX =
          touch.clientX;
 
        swipeStartY =
          touch.clientY;
 
      },
      {
        passive:true
      }
    );
 
    screen.addEventListener(
      "touchend",
      event=>{
 
        const touch =
          event.changedTouches[0];
 
        const diffX =
          touch.clientX -
          swipeStartX;
 
        const diffY =
          touch.clientY -
          swipeStartY;
 
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
 
        if(!activeScreen)
          return;
 
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
 
        if(currentIndex === -1)
          return;
 
        if(diffX < 0){
 
          if(
            currentIndex <
            ids.length - 1
          ){
 
            showScreen(
              ids[
                currentIndex + 1
              ]
            );
 
          }
 
        }
 
        if(diffX > 0){
 
          if(
            currentIndex > 0
          ){
 
            showScreen(
              ids[
                currentIndex - 1
              ]
            );
 
          }
 
        }
 
      },
      {
        passive:true
      }
    );
 
  }
);
 
/* CUSTOMER DATA */
 
const saveCustomerDataBtn =
  document.getElementById("saveCustomerDataBtn");
 
if(saveCustomerDataBtn){
 
  saveCustomerDataBtn.addEventListener(
    "click",
    async()=>{
 
      const name =
        document.getElementById("customerNameInput")?.value.trim();
 
      const phone =
        document.getElementById("customerPhoneInput")?.value.trim();
 
      const city =
        document.getElementById("customerCityInput")?.value.trim();
 
      if(
        !name ||
        !phone ||
        !city
      ){
 
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
 
            name,
 
            phone,
 
            city,
 
            email:
              user.email || "",
 
            customerId:
              user.uid,
 
            updatedAt:
              Date.now()
 
          },
          {
            merge:true
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
 
/* CUSTOMER LOCATION */
 
const getLocationBtn =
  document.getElementById("getLocationBtn");
 
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
 
      getLocationBtn.disabled =
        true;
 
      getLocationBtn.textContent =
        "📍 جاري تحديد موقعك...";
 
      navigator.geolocation.getCurrentPosition(
 
        position=>{
 
          const latitude =
            position.coords.latitude;
 
          const longitude =
            position.coords.longitude;
 
          console.log(
            "موقع العميل:",
            latitude,
            longitude
          );
 
          const input =
            document.getElementById("locationInput");
 
          if(input){
 
            input.value =
              `${latitude}, ${longitude}`;
 
          }
 
          getLocationBtn.disabled =
            false;
 
          getLocationBtn.textContent =
            "✅ تم تحديد موقعك";
 
        },
 
        error=>{
 
          console.error(
            "خطأ تحديد الموقع:",
            error
          );
 
          getLocationBtn.disabled =
            false;
 
          getLocationBtn.textContent =
            "📍 تحديد موقعي بدقة";
 
          alert(
            "تعذر تحديد موقعك.\n\n" +
            "تأكد من السماح للتطبيق باستخدام موقعك."
          );
 
        },
 
        {
 
          enableHighAccuracy:true,
 
          timeout:15000,
 
          maximumAge:0
 
        }
 
      );
 
    }
  );
 
}
 
/* CUSTOMER HOME */
 
const currentOrderBtn =
  document.getElementById("currentOrderBtn");
 
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
 
const previousOrdersBtn =
  document.getElementById("previousOrdersBtn");
 
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
 
async function loadCustomerOrders(
  type
){
 
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
 
    const snapshot =
      await window.ma3daGetDocs(
        window.ma3daCollection(
          window.ma3daDB,
          "requests"
        )
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
      docSnapshot=>{
 
        const data =
          docSnapshot.data();
 
        if(
          data.customerId === user.uid &&
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
 
    list.innerHTML =
      "";
 
    orders.forEach(
      customerOrder=>{
 
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
                ${customerOrder.operator || "مع مشغل"}
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
 
    list.innerHTML = `
      <div class="empty-state">
        <h3>تعذر تحميل الطلبات</h3>
        <p>
          حاول مرة أخرى.
        </p>
      </div>
    `;
 
  }
 
}
 
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
 
/* CUSTOMER ORDER BACK */
 
const backFromCurrentOrdersBtn =
  document.getElementById("backFromCurrentOrdersBtn");
 
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
 
const backFromPreviousOrdersBtn =
  document.getElementById("backFromPreviousOrdersBtn");
 
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
 
/* CUSTOMER SETTINGS */
 
const customerSettingsBtn =
  document.getElementById("customerSettingsBtn");
 
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
 
async function loadCustomerSettings(){
 
  const nameInput =
    document.getElementById("customerNameSettingsInput");
 
  const emailInput =
    document.getElementById("customerEmailSettingsInput");
 
  const status =
    document.getElementById("customerAccountStatus");
 
  try{
 
    const user =
      window.ma3daGetCurrentUser
        ? await window.ma3daGetCurrentUser()
        : window.ma3daAuth?.currentUser;
 
    if(!user){
 
      showScreen(
        "roleScreen"
      );
 
      return;
 
    }
 
    if(emailInput)
      emailInput.value =
        user.email || "";
 
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
 
      if(nameInput)
        nameInput.value =
          data.name || "";
 
      if(status)
        status.textContent =
          "نشط";
 
    }
 
  }catch(error){
 
    console.error(
      "تعذر تحميل بيانات العميل:",
      error
    );
 
  }
 
}
 
const saveCustomerSettingsBtn =
  document.getElementById("saveCustomerSettingsBtn");
 
if(saveCustomerSettingsBtn){
 
  saveCustomerSettingsBtn.addEventListener(
    "click",
    async()=>{
 
      const nameInput =
        document.getElementById("customerNameSettingsInput");
 
      const name =
        nameInput?.value.trim();
 
      if(!name){
 
        alert(
          "أدخل الاسم أولًا."
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
            "يجب تسجيل الدخول أولًا."
          );
 
          return;
 
        }
 
        const ref =
          window.ma3daDoc(
            window.ma3daDB,
            "customers",
            user.uid
          );
 
        await window.ma3daSetDoc(
          ref,
          {
 
            name,
 
            email:
              user.email || "",
 
            customerId:
              user.uid,
 
            updatedAt:
              Date.now()
 
          },
          {
            merge:true
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
          "تعذر حفظ التعديلات."
        );
 
      }
 
    }
  );
 
}
 
const changePasswordBtn =
  document.getElementById("changePasswordBtn");
 
if(changePasswordBtn){
 
  changePasswordBtn.addEventListener(
    "click",
    async()=>{
 
      const user =
        window.ma3daGetCurrentUser
          ? await window.ma3daGetCurrentUser()
          : window.ma3daAuth?.currentUser;
 
      if(
        !user ||
        !user.email
      ){
 
        alert(
          "لا يوجد بريد إلكتروني مرتبط بالحساب."
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
          error
        );
 
        alert(
          error.message ||
          "تعذر إرسال رابط تغيير كلمة المرور."
        );
 
      }
 
    }
  );
 
}
 
const backFromCustomerSettingsBtn =
  document.getElementById("backFromCustomerSettingsBtn");
 
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
 
/* EDIT PHONE / EMAIL */
 
const editPhoneBtn =
  document.getElementById("editPhoneBtn");
 
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
  document.getElementById("backFromEditPhoneBtn");
 
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
 
const editEmailBtn =
  document.getElementById("editEmailBtn");
 
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
  document.getElementById("backFromEditEmailBtn");
 
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
 
/* LANGUAGE */
 
const languageSettingsBtn =
  document.getElementById("languageSettingsBtn");
 
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
  document.getElementById("backFromLanguageSettingsBtn");
 
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
  document.getElementById("arabicLanguageBtn");
 
if(arabicLanguageBtn){
 
  arabicLanguageBtn.addEventListener(
    "click",
    ()=>{
 
      document.documentElement.lang =
        "ar";
 
      document.documentElement.dir =
        "rtl";
 
      localStorage.setItem("ma3daLanguage", "ar");
 
      alert(
        "تم اختيار اللغة العربية 🇸🇦"
      );
 
    }
  );
 
}
 
const englishLanguageBtn =
  document.getElementById("englishLanguageBtn");
 
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
 
/* APPEARANCE */
 
const appearanceSettingsBtn =
  document.getElementById("appearanceSettingsBtn");
 
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
  document.getElementById("backFromAppearanceSettingsBtn");
 
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
  document.getElementById("systemAppearanceBtn");
 
if(systemAppearanceBtn){
 
  systemAppearanceBtn.addEventListener(
    "click",
    ()=>{
 
      document.documentElement.removeAttribute(
        "data-theme"
      );
 
      localStorage.setItem("ma3daTheme", "system");
 
      alert(
        "تم اختيار المظهر التلقائي 📱"
      );
 
    }
  );
 
}
 
const lightAppearanceBtn =
  document.getElementById("lightAppearanceBtn");
 
if(lightAppearanceBtn){
 
  lightAppearanceBtn.addEventListener(
    "click",
    ()=>{
 
      document.documentElement.setAttribute(
        "data-theme",
        "light"
      );
 
      localStorage.setItem("ma3daTheme", "light");
 
      alert(
        "تم اختيار المظهر الفاتح ☀️"
      );
 
    }
  );
 
}
 
const darkAppearanceBtn =
  document.getElementById("darkAppearanceBtn");
 
if(darkAppearanceBtn){
 
  darkAppearanceBtn.addEventListener(
    "click",
    ()=>{
 
      document.documentElement.setAttribute(
        "data-theme",
        "dark"
      );
 
      localStorage.setItem("ma3daTheme", "dark");
 
      alert(
        "تم اختيار المظهر الداكن 🌙"
      );
 
    }
  );
 
}
 
/* TECHNICAL SUPPORT */
 
const technicalSupportBtn =
  document.getElementById("technicalSupportBtn");
 
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
  document.getElementById("backFromTechnicalSupportBtn");
 
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
 
/* OPERATOR DATA */
 
async function loadOperatorData(){
 
  const user =
    window.ma3daGetCurrentUser
      ? await window.ma3daGetCurrentUser()
      : window.ma3daAuth?.currentUser;
 
  if(!user)
    return false;
 
  try{
 
    const ref =
      window.ma3daDoc(
        window.ma3daDB,
        "operators",
        user.uid
      );
 
    const snapshot =
      await window.ma3daGetDoc(
        ref
      );
 
    const emailInput =
      document.getElementById("operatorEmailInput");
 
    if(emailInput)
      emailInput.value =
        user.email || "";
 
    if(!snapshot.exists())
      return false;
 
    const data =
      snapshot.data();
 
    const nameInput =
      document.getElementById("operatorNameInput");
 
    const phoneInput =
      document.getElementById("operatorPhoneInput");
 
    const cityInput =
      document.getElementById("operatorCityInput");
 
    if(nameInput)
      nameInput.value =
        data.name || "";
 
    if(phoneInput)
      phoneInput.value =
        data.phone || "";
 
    if(cityInput)
      cityInput.value =
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
  document.getElementById("saveOperatorDataBtn");
 
if(saveOperatorDataBtn){
 
  saveOperatorDataBtn.addEventListener(
    "click",
    async()=>{
 
      const name =
        document.getElementById("operatorNameInput")?.value.trim();
 
      const phone =
        document.getElementById("operatorPhoneInput")?.value.trim();
 
      const city =
        document.getElementById("operatorCityInput")?.value.trim();
 
      if(
        !name ||
        !phone ||
        !city
      ){
 
        alert(
          "أكمل جميع البيانات أولًا"
        );
 
        return;
 
      }
 
      try{
 
        const user =
          await getOperatorCurrentUser();
 
        if(!user){
 
          alert(
            "يجب تسجيل الدخول أولًا"
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
            merge:true
          }
        );
 
        await loadOperatorDashboard();
 
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
 
/* OPERATOR HOME */
 
async function loadOperatorHome(){
 
  await loadOperatorDashboard();
 
}
 
/* OPERATOR HELPERS */
 
let operatorOrderWatcher =
  null;
 
let operatorTimerInterval =
  null;
 
async function getOperatorCurrentUser(){
 
  try{
 
    if(window.ma3daFirebaseReady)
      await window.ma3daFirebaseReady;
 
    if(!window.ma3daGetCurrentUser)
      return null;
 
    return await window.ma3daGetCurrentUser();
 
  }catch(error){
 
    console.error(
      "تعذر الحصول على مستخدم صاحب المعدة:",
      error
    );
 
    return null;
 
  }
 
}
 
async function getOperatorEquipment(){
 
  const user =
    await getOperatorCurrentUser();
 
  if(!user)
    return null;
 
  const ref =
    window.ma3daDoc(
      window.ma3daDB,
      "equipment",
      user.uid
    );
 
  const snap =
    await window.ma3daGetDoc(
      ref
    );
 
  if(!snap.exists())
    return null;
 
  return snap.data();
 
}
 
/* OPEN OPERATOR DASHBOARD */
 
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
 
    const equipment =
      await getOperatorEquipment();
 
    if(!equipment){
 
      showScreen(
        "addEquipmentScreen"
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
 
    showScreen(
      "roleScreen"
    );
 
  }
 
}
 
/* OPERATOR DASHBOARD */
 
async function loadOperatorDashboard(){
 
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
 
  if(operatorSnap.exists()){
 
    const data =
      operatorSnap.data();
 
    const nameElement =
      document.getElementById("operatorHomeName");
 
    if(nameElement)
      nameElement.textContent =
        data.name ||
        "صاحب المعدة";
 
  }
 
  const equipment =
    await getOperatorEquipment();
 
  if(!equipment)
    return;
 
  const fields = {
 
    operatorHomeEquipmentType:
      equipment.type || "-",
 
    operatorHomeEquipmentModel:
      equipment.model || "-",
 
    operatorHomeEquipmentCity:
      equipment.city || "-",
 
    operatorHomeEquipmentYear:
      equipment.year || "-",
 
    operatorHomeEquipmentPrice:
      equipment.hourlyPrice
        ? `${Number(
            equipment.hourlyPrice
          ).toLocaleString("ar-SA")} ريال/ساعة`
        : "-"
 
  };
 
  Object.entries(fields)
    .forEach(
      ([id,value])=>{
 
        const element =
          document.getElementById(
            id
          );
 
        if(element)
          element.textContent =
            value;
 
      }
    );
 
  const image =
    document.getElementById("operatorHomeEquipmentImage");
 
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
 
/* OPERATOR NEW REQUESTS */
 
async function loadOperatorNewRequests(){
 
  const list =
    document.getElementById("operatorNewRequestsList");
 
  if(!list)
    return;
 
  list.innerHTML = `
    <div class="card center">
      <p>جاري تحميل الطلبات...</p>
    </div>
  `;
 
  try{
 
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
 
    snapshot.forEach(
      docSnap=>{
 
        const data =
          docSnap.data();
 
        if(
          data.status === "searching" &&
          data.equipment === equipment.type
        ){
 
          requests.push({
 
            id:
              docSnap.id,
 
            ...data
 
          });
 
        }
 
      }
    );
 
    requests.sort(
      (a,b)=>
        Number(
          b.createdAt || 0
        ) -
        Number(
          a.createdAt || 0
        )
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
            سنعرض هنا الطلبات المناسبة لمعدتك.
          </p>
 
        </div>
      `;
 
      return;
 
    }
 
    list.innerHTML =
      "";
 
    requests.forEach(
      request=>{
 
        const card =
          document.createElement(
            "div"
          );
 
        card.className =
          "card operator-new-request-card";
 
        const price =
          Number(
            request.price || 0
          );
 
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
 
        list.appendChild(
          card
        );
 
      }
    );
 
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
 
/* ACCEPT */
 
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
          Number(
            operatorData.rating || 5
          ),
 
        operatorEquipment:
          equipment?.model ||
          "",
 
        acceptedAt:
          Date.now()
 
      }
    );
 
    localStorage.setItem("currentRequestId", requestId);
 
    localStorage.setItem("orderState", "accepted");
 
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
 
/* REJECT */
 
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
 
/* CURRENT ORDER */
 
async function loadOperatorCurrentOrder(){
 
  const requestId =
    localStorage.getItem("currentRequestId");
 
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
 
/* CURRENT ORDER UI */
 
function updateOperatorCurrentUI(
  data
){
 
  const title =
    document.getElementById("operatorCurrentOrderTitle");
 
  const equipment =
    document.getElementById("operatorCurrentEquipment");
 
  const location =
    document.getElementById("operatorCurrentLocation");
 
  const duration =
    document.getElementById("operatorCurrentDuration");
 
  const price =
    document.getElementById("operatorCurrentPrice");
 
  const statusText =
    document.getElementById("operatorCurrentStatusText");
 
  const statusIcon =
    document.getElementById("operatorCurrentStatusIcon");
 
  const arrivedBtn =
    document.getElementById("operatorArrivedBtn");
 
  const startBtn =
    document.getElementById("operatorStartWorkBtn");
 
  const timerBox =
    document.getElementById("operatorWorkTimerBox");
 
  const endBtn =
    document.getElementById("operatorEndWorkBtn");
 
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
      `${Number(
        data.price || 0
      ).toLocaleString("ar-SA")} ريال`;
 
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
 
  if(
    data.status ===
    "accepted"
  ){
 
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
 
  else if(
    data.status ===
    "arrived"
  ){
 
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
 
  else if(
    data.status ===
    "working"
  ){
 
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
 
  else if(
    data.status ===
    "completed"
  ){
 
    if(statusIcon)
      statusIcon.textContent =
        "✅";
 
    if(statusText)
      statusText.textContent =
        "تم إنهاء العمل";
 
  }
 
}
 
/* OPERATOR ARRIVED */
 
async function operatorMarkArrived(){
 
  const requestId =
    localStorage.getItem("currentRequestId");
 
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
 
    localStorage.setItem("orderState", "arrived");
 
    await loadOperatorCurrentOrder();
 
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
 
/* OPERATOR START WORK */
 
async function operatorStartWork(){
 
  if(
    selectedRole !==
    "operator"
  ){
 
    console.warn(
      "محاولة بدء العمل من غير صاحب المعدة."
    );
 
    return;
 
  }
 
  const requestId =
    localStorage.getItem("currentRequestId");
 
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
      "arrived"
    ){
 
      alert(
        "لا يمكن بدء العمل قبل تسجيل الوصول."
      );
 
      return;
 
    }
 
    const startTime =
      Date.now();
 
    await window.ma3daUpdateDoc(
      requestRef,
      {
 
        status:
          "working",
 
        workStartedAt:
          startTime
 
      }
    );
 
    localStorage.setItem("orderState", "working");
 
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
 
/* OPERATOR TIMER */
 
function startOperatorTimer(
  startTime
){
 
  clearInterval(
    operatorTimerInterval
  );
 
  const timer =
    document.getElementById("operatorTimer");
 
  if(!timer)
    return;
 
  function update(){
 
    const elapsed =
      Math.max(
        0,
        Date.now() -
        Number(
          startTime ||
          Date.now()
        )
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
 
/* OPERATOR FINISH WORK */
 
async function operatorFinishWork(){
 
  if(
    selectedRole !==
    "operator"
  )
    return;
 
  const requestId =
    localStorage.getItem("currentRequestId");
 
  if(!requestId)
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
 
    if(!snapshot.exists()){
 
      alert(
        "الطلب غير موجود."
      );
 
      return;
 
    }
 
    const request =
      snapshot.data();
 
    if(
      request.status !==
      "working"
    ){
 
      alert(
        "لا يمكن إنهاء العمل الآن."
      );
 
      return;
 
    }
 
    const completedAt =
      Date.now();
 
    await window.ma3daUpdateDoc(
      requestRef,
      {
 
        status:
          "completed",
 
        completedAt
 
      }
    );
 
    clearInterval(
      operatorTimerInterval
    );
 
    localStorage.setItem("orderState", "completed");
 
    const finalPrice =
      Number(
        request.price || 0
      );
 
    localStorage.setItem(
      "finalPrice",
      String(
        finalPrice
      )
    );
 
    const priceElement =
      document.getElementById("finalPrice");
 
    if(priceElement)
      priceElement.textContent =
        `${finalPrice.toLocaleString("ar-SA")} ريال`;
 
    if(
      document.getElementById("operatorCompletedScreen")
    ){
 
      showScreen(
        "operatorCompletedScreen"
      );
 
    }else{
 
      showScreen(
        "operatorCurrentOrderScreen"
      );
 
    }
 
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
 
/* OPERATOR PREVIOUS ORDERS */
 
async function loadOperatorPreviousOrders(){
 
  const list =
    document.getElementById("operatorPreviousOrdersList");
 
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
 
    snapshot.forEach(
      docSnap=>{
 
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
 
            id:
              docSnap.id,
 
            ...data
 
          });
 
        }
 
      }
    );
 
    requests.sort(
      (a,b)=>
        Number(
          b.completedAt ||
          b.createdAt ||
          0
        ) -
        Number(
          a.completedAt ||
          a.createdAt ||
          0
        )
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
 
    list.innerHTML =
      "";
 
    requests.forEach(
      request=>{
 
        const card =
          document.createElement(
            "div"
          );
 
        card.className =
          "card";
 
        const status =
          request.status ===
          "completed"
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
              ${Number(
                request.price || 0
              ).toLocaleString("ar-SA")}
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
 
        list.appendChild(
          card
        );
 
      }
    );
 
  }catch(error){
 
    console.error(
      "خطأ في الطلبات السابقة:",
      error
    );
 
  }
 
}
 
/* OPERATOR INCOME */
 
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
 
  let totalIncome =
    0;
 
  let completedCount =
    0;
 
  let totalHours =
    0;
 
  const completedRequests =
    [];
 
  snapshot.forEach(
    docSnap=>{
 
      const data =
        docSnap.data();
 
      if(
        data.operatorId === user.uid &&
        data.status === "completed"
      ){
 
        const price =
          Number(
            data.price || 0
          );
 
        totalIncome +=
          price;
 
        completedCount++;
 
        const hours =
          durationHours[
            data.duration
          ] || 0;
 
        totalHours +=
          hours;
 
        completedRequests.push(
          data
        );
 
      }
 
    }
  );
 
  const incomeElement =
    document.getElementById("operatorTotalIncome");
 
  const countElement =
    document.getElementById("operatorCompletedCount");
 
  const hoursElement =
    document.getElementById("operatorTotalHours");
 
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
    document.getElementById("operatorIncomeList");
 
  if(!list)
    return;
 
  list.innerHTML =
    "";
 
  completedRequests
    .sort(
      (a,b)=>
        Number(
          b.completedAt || 0
        ) -
        Number(
          a.completedAt || 0
        )
    )
    .forEach(
      request=>{
 
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
              ${Number(
                request.price || 0
              ).toLocaleString("ar-SA")}
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
 
        list.appendChild(
          card
        );
 
      }
    );
 
}
 
/* OPERATOR RATINGS */
 
async function loadOperatorRatings(){
 
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
 
  let total =
    0;
 
  let count =
    0;
 
  const ratings =
    [];
 
  snapshot.forEach(
    docSnap=>{
 
      const data =
        docSnap.data();
 
      if(
        data.operatorId === user.uid &&
        data.status === "completed"
      ){
 
        const rating =
          Number(
            data.rating || 0
          );
 
        if(
          rating >= 1 &&
          rating <= 5
        ){
 
          total +=
            rating;
 
          count++;
 
          ratings.push(
            data
          );
 
        }
 
      }
 
    }
  );
 
  const average =
    count
      ? (
          total /
          count
        ).toFixed(1)
      : "0.0";
 
  const averageElement =
    document.getElementById("operatorAverageRating");
 
  const countElement =
    document.getElementById("operatorRatingCount");
 
  if(averageElement)
    averageElement.textContent =
      average;
 
  if(countElement)
    countElement.textContent =
      `${count} تقييم`;
 
  const list =
    document.getElementById("operatorRatingsList");
 
  if(!list)
    return;
 
  list.innerHTML =
    "";
 
  if(!ratings.length){
 
    list.innerHTML = `
      <div class="card center">
        <p>
          لا توجد تقييمات حتى الآن.
        </p>
      </div>
    `;
 
    return;
 
  }
 
  ratings
    .sort(
      (a,b)=>
        Number(
          b.ratedAt || 0
        ) -
        Number(
          a.ratedAt || 0
        )
    )
    .forEach(
      rating=>{
 
        const card =
          document.createElement(
            "div"
          );
 
        card.className =
          "card";
 
        const value =
          Number(
            rating.rating || 0
          );
 
        card.innerHTML = `
 
          <div class="info-row">
 
            <span>
              تقييم العميل
            </span>
 
            <strong>
              ${"⭐".repeat(
                Math.min(
                  5,
                  value
                )
              )}
            </strong>
 
          </div>
 
        `;
 
        list.appendChild(
          card
        );
 
      }
    );
 
}
 
/* OPERATOR EQUIPMENT EDITOR */
 
async function loadOperatorEquipmentEditor(){
 
  const equipment =
    await getOperatorEquipment();
 
  if(!equipment)
    return;
 
  const fields = {
 
    operatorEquipmentTypeEdit:
      equipment.type || "",
 
    operatorEquipmentModelEdit:
      equipment.model || "",
 
    operatorEquipmentYearEdit:
      equipment.year || "",
 
    operatorEquipmentCityEdit:
      equipment.city || "",
 
    operatorEquipmentPriceEdit:
      equipment.hourlyPrice || "",
 
    operatorEquipmentAvailabilityEdit:
      equipment.availability ||
      "available"
 
  };
 
  Object.entries(fields)
    .forEach(
      ([id,value])=>{
 
        const element =
          document.getElementById(
            id
          );
 
        if(element)
          element.value =
            value;
 
      }
    );
 
  const image =
    document.getElementById("operatorEquipmentImagePreview");
 
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
 
/* SAVE EQUIPMENT */
 
async function saveOperatorEquipmentChanges(){
 
  try{
 
    const user =
      await getOperatorCurrentUser();
 
    if(!user)
      return;
 
    const type =
      document.getElementById("operatorEquipmentTypeEdit")?.value.trim();
 
    const model =
      document.getElementById("operatorEquipmentModelEdit")?.value.trim();
 
    const year =
      document.getElementById("operatorEquipmentYearEdit")?.value.trim();
 
    const city =
      document.getElementById("operatorEquipmentCityEdit")?.value.trim();
 
    const price =
      Number(
        document.getElementById("operatorEquipmentPriceEdit")?.value || 0
      );
 
    const availability =
      document.getElementById("operatorEquipmentAvailabilityEdit")?.value ||
      "available";
 
    if(
      !type ||
      !model ||
      !year ||
      !city ||
      price <= 0
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
      document.getElementById("operatorEquipmentImageEdit");
 
    let image =
      current.image ||
      "";
 
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
 
    await loadOperatorDashboard();
 
    showScreen(
      "operatorHomeScreen"
    );
 
    alert(
      "تم حفظ بيانات المعدة بنجاح 🚜"
    );
 
  }catch(error){
 
    console.error(
      "خطأ في حفظ المعدة:",
      error
    );
 
    alert(
      "تعذر حفظ بيانات المعدة."
    );
 
  }
 
}
 
function resizeOperatorImage(
  file
){
 
  return new Promise(
    (resolve,reject)=>{
 
      const reader =
        new FileReader();
 
      reader.onload =
        event=>{
 
          const img =
            new Image();
 
          img.onload =
            ()=>{
 
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
                img.width *
                scale;
 
              canvas.height =
                img.height *
                scale;
 
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
 
          img.onerror =
            reject;
 
          img.src =
            event.target.result;
 
        };
 
      reader.onerror =
        reject;
 
      reader.readAsDataURL(
        file
      );
 
    }
  );
 
}
 
/* OPERATOR SETTINGS */
 
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
    document.getElementById("operatorSettingsName");
 
  const phone =
    document.getElementById("operatorSettingsPhone");
 
  const city =
    document.getElementById("operatorSettingsCity");
 
  const email =
    document.getElementById("operatorSettingsEmail");
 
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
 
async function saveOperatorSettings(){
 
  const user =
    await getOperatorCurrentUser();
 
  if(!user)
    return;
 
  const name =
    document.getElementById("operatorSettingsName")?.value.trim();
 
  const phone =
    document.getElementById("operatorSettingsPhone")?.value.trim();
 
  const city =
    document.getElementById("operatorSettingsCity")?.value.trim();
 
  if(
    !name ||
    !phone ||
    !city
  ){
 
    alert(
      "أكمل بيانات الحساب."
    );
 
    return;
 
  }
 
  try{
 
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
        merge:true
      }
    );
 
    await loadOperatorDashboard();
 
    alert(
      "تم حفظ بيانات الحساب."
    );
 
  }catch(error){
 
    console.error(
      "تعذر حفظ بيانات صاحب المعدة:",
      error
    );
 
    alert(
      "تعذر حفظ بيانات الحساب."
    );
 
  }
 
}
 
/* OPERATOR EVENTS */
 
document.addEventListener(
  "click",
  async event=>{
 
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
 
/* OPERATOR DASHBOARD BUTTONS */
 
const operatorNewRequestsBtn =
  document.getElementById("operatorNewRequestsBtn");
 
if(operatorNewRequestsBtn){
 
  operatorNewRequestsBtn.addEventListener(
    "click",
    async()=>{
 
      await loadOperatorNewRequests();
 
      showScreen(
        "operatorNewRequestsScreen"
      );
 
    }
  );
 
}
 
const operatorCurrentOrderBtn =
  document.getElementById("operatorCurrentOrderBtn");
 
if(operatorCurrentOrderBtn){
 
  operatorCurrentOrderBtn.addEventListener(
    "click",
    async()=>{
 
      await loadOperatorCurrentOrder();
 
      showScreen(
        "operatorCurrentOrderScreen"
      );
 
    }
  );
 
}
 
const operatorPreviousOrdersBtn =
  document.getElementById("operatorPreviousOrdersBtn");
 
if(operatorPreviousOrdersBtn){
 
  operatorPreviousOrdersBtn.addEventListener(
    "click",
    async()=>{
 
      await loadOperatorPreviousOrders();
 
      showScreen(
        "operatorPreviousOrdersScreen"
      );
 
    }
  );
 
}
 
/* EQUIPMENT BUTTON */
 
const operatorEditEquipmentBtn =
  document.getElementById("operatorEditEquipmentBtn");
 
if(operatorEditEquipmentBtn){
 
  operatorEditEquipmentBtn.addEventListener(
    "click",
    async()=>{
 
      await loadOperatorEquipmentEditor();
 
      if(
        document.getElementById("operatorEquipmentScreen")
      ){
 
        showScreen(
          "operatorEquipmentScreen"
        );
 
      }else{
 
        showScreen(
          "addEquipmentScreen"
        );
 
      }
 
    }
  );
 
}
 
const saveOperatorEquipmentBtn =
  document.getElementById("saveOperatorEquipmentBtn");
 
if(saveOperatorEquipmentBtn){
 
  saveOperatorEquipmentBtn.addEventListener(
    "click",
    saveOperatorEquipmentChanges
  );
 
}
 
/* INCOME */
 
const operatorIncomeBtn =
  document.getElementById("operatorIncomeBtn");
 
if(operatorIncomeBtn){
 
  operatorIncomeBtn.addEventListener(
    "click",
    async()=>{
 
      await loadOperatorIncome();
 
      showScreen(
        "operatorIncomeScreen"
      );
 
    }
  );
 
}
 
/* RATINGS */
 
const operatorRatingsBtn =
  document.getElementById("operatorRatingsBtn");
 
if(operatorRatingsBtn){
 
  operatorRatingsBtn.addEventListener(
    "click",
    async()=>{
 
      await loadOperatorRatings();
 
      showScreen(
        "operatorRatingsScreen"
      );
 
    }
  );
 
}
 
/* SETTINGS */
 
const operatorSettingsBtn =
  document.getElementById("operatorSettingsBtn");
 
if(operatorSettingsBtn){
 
  operatorSettingsBtn.addEventListener(
    "click",
    async()=>{
 
      await loadOperatorSettings();
 
      showScreen(
        "operatorSettingsScreen"
      );
 
    }
  );
 
}
 
const saveOperatorSettingsBtn =
  document.getElementById("saveOperatorSettingsBtn");
 
if(saveOperatorSettingsBtn){
 
  saveOperatorSettingsBtn.addEventListener(
    "click",
    saveOperatorSettings
  );
 
}
 
/* OPERATOR PASSWORD */
 
const operatorChangePasswordBtn =
  document.getElementById("operatorChangePasswordBtn");
 
if(operatorChangePasswordBtn){
 
  operatorChangePasswordBtn.addEventListener(
    "click",
    async()=>{
 
      try{
 
        const user =
          await getOperatorCurrentUser();
 
        if(
          !user ||
          !user.email
        ){
 
          alert(
            "لا يوجد بريد إلكتروني مرتبط بالحساب."
          );
 
          return;
 
        }
 
        await window.ma3daSendPasswordResetEmail(
          user.email
        );
 
        alert(
          "تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني."
        );
 
      }catch(error){
 
        console.error(
          error
        );
 
        alert(
          "تعذر إرسال رابط تغيير كلمة المرور."
        );
 
      }
 
    }
  );
 
}
 
/* OPERATOR SUPPORT */
 
const operatorSupportBtn =
  document.getElementById("operatorSupportBtn");
 
if(operatorSupportBtn){
 
  operatorSupportBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "operatorSupportScreen"
      );
    }
  );
 
}
 
/* لا يوجد رقم واتساب وهمي هنا. */
 
const operatorSupportWhatsAppBtn =
  document.getElementById("operatorSupportWhatsAppBtn");
 
if(operatorSupportWhatsAppBtn){
 
  operatorSupportWhatsAppBtn.addEventListener(
    "click",
    ()=>{
 
      alert(
        "سيتم ربط الدعم الفني قريبًا."
      );
 
    }
  );
 
}
 
/* OPERATOR ARRIVED / WORK */
 
const operatorArrivedBtn =
  document.getElementById("operatorArrivedBtn");
 
if(operatorArrivedBtn){
 
  operatorArrivedBtn.addEventListener(
    "click",
    operatorMarkArrived
  );
 
}
 
const operatorStartWorkBtn =
  document.getElementById("operatorStartWorkBtn");
 
if(operatorStartWorkBtn){
 
  operatorStartWorkBtn.addEventListener(
    "click",
    operatorStartWork
  );
 
}
 
const operatorEndWorkBtn =
  document.getElementById("operatorEndWorkBtn");
 
if(operatorEndWorkBtn){
 
  operatorEndWorkBtn.addEventListener(
    "click",
    operatorFinishWork
  );
 
}
 
/* OPERATOR CALL CUSTOMER */
 
const operatorCallCustomerBtn =
  document.getElementById("operatorCallCustomerBtn");
 
if(operatorCallCustomerBtn){
 
  operatorCallCustomerBtn.addEventListener(
    "click",
    async()=>{
 
      try{
 
        const requestId =
          localStorage.getItem("currentRequestId");
 
        if(!requestId){
 
          alert(
            "لا يوجد طلب حالي."
          );
 
          return;
 
        }
 
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
 
        if(!snapshot.exists()){
 
          alert(
            "تعذر العثور على الطلب."
          );
 
          return;
 
        }
 
        const data =
          snapshot.data();
 
        const phone =
          data.customerPhone ||
          "";
 
        if(!phone){
 
          alert(
            "رقم العميل غير متوفر حاليًا."
          );
 
          return;
 
        }
 
        window.location.href =
          `tel:${phone}`;
 
      }catch(error){
 
        console.error(
          "تعذر الاتصال بالعميل:",
          error
        );
 
        alert(
          "تعذر الاتصال حاليًا."
        );
 
      }
 
    }
  );
  
}
 
/* OPERATOR CHAT */
 
const operatorChatCustomerBtn =
  document.getElementById("operatorChatCustomerBtn");
 
if(operatorChatCustomerBtn){
 
  operatorChatCustomerBtn.addEventListener(
    "click",
    ()=>{
      showScreen(
        "chatScreen"
      );
    }
  );
 
}
 
/* BACK BUTTONS */
 
const backOperatorNewRequests =
  document.getElementById("backFromOperatorNewRequestsBtn");
 
if(backOperatorNewRequests){
 
  backOperatorNewRequests.addEventListener(
    "click",
    ()=>{
      showScreen(
        "operatorHomeScreen"
      );
    }
  );
 
}
 
const backOperatorCurrent =
  document.getElementById("backFromOperatorCurrentOrderBtn");
 
if(backOperatorCurrent){
 
  backOperatorCurrent.addEventListener(
    "click",
    ()=>{
      showScreen(
        "operatorHomeScreen"
      );
    }
  );
 
}
 
const backOperatorPrevious =
  document.getElementById("backFromOperatorPreviousOrdersBtn");
 
if(backOperatorPrevious){
 
  backOperatorPrevious.addEventListener(
    "click",
    ()=>{
      showScreen(
        "operatorHomeScreen"
      );
    }
  );
 
}
 
const backOperatorEquipment =
  document.getElementById("backFromOperatorEquipmentBtn");
 
if(backOperatorEquipment){
 
  backOperatorEquipment.addEventListener(
    "click",
    async()=>{
 
      await loadOperatorDashboard();
 
      showScreen(
        "operatorHomeScreen"
      );
 
    }
  );
 
}
 
const backOperatorIncome =
  document.getElementById("backFromOperatorIncomeBtn");
 
if(backOperatorIncome){
 
  backOperatorIncome.addEventListener(
    "click",
    ()=>{
      showScreen(
        "operatorHomeScreen"
      );
    }
  );
 
}
 
const backOperatorRatings =
  document.getElementById("backFromOperatorRatingsBtn");
 
if(backOperatorRatings){
 
  backOperatorRatings.addEventListener(
    "click",
    ()=>{
      showScreen(
        "operatorHomeScreen"
      );
    }
  );
 
}
 
const backOperatorSettings =
  document.getElementById("backFromOperatorSettingsBtn");
 
if(backOperatorSettings){
 
  backOperatorSettings.addEventListener(
    "click",
    ()=>{
      showScreen(
        "operatorHomeScreen"
      );
    }
  );
 
}
 
const backOperatorSupport =
  document.getElementById("backFromOperatorSupportBtn");
 
if(backOperatorSupport){
 
  backOperatorSupport.addEventListener(
    "click",
    ()=>{
      showScreen(
        "operatorHomeScreen"
      );
    }
  );
 
}
 
/* OPERATOR LOGOUT */
 
const operatorHomeLogoutBtn =
  document.getElementById("operatorHomeLogoutBtn");
 
if(operatorHomeLogoutBtn){
 
  operatorHomeLogoutBtn.addEventListener(
    "click",
    ma3daLogout
  );
 
}
/* =========================================================
   SUPPORT STAFF PORTAL
   بوابة موظفي الدعم
   ========================================================= */

const SUPPORT_STAFF_MODE =
  new URLSearchParams(window.location.search).get("staff") === "1";

let supportEmployee = null;


/* =========================================================
   فتح أي شاشة دعم
   ========================================================= */

function openSupportScreen(id){

  /*
    نستخدم querySelectorAll هنا مباشرة
    حتى نضمن أن جميع شاشات index.html موجودة
    حتى لو تم تحميل script.js قبل نهاية الصفحة.
  */

  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });

  const screen =
    document.getElementById(id);

  if(screen){

    screen.classList.add("active");

    window.scrollTo(
      0,
      0
    );

  }

}


/* =========================================================
   الحصول على حساب موظف الدعم
   ========================================================= */

async function getSupportEmployee(){

  const user =
    window.ma3daGetCurrentUser
      ? await window.ma3daGetCurrentUser()
      : window.ma3daAuth?.currentUser;

  if(!user)
    return null;
console.log("SUPPORT CHECK UID:", user.uid);
console.log("SUPPORT CHECK EMAIL:", user.email);

  /* -----------------------------------------
     التحقق من Custom Claims
     ----------------------------------------- */

  try{

    if(
      typeof user.getIdTokenResult ===
      "function"
    ){

      const token =
        await user.getIdTokenResult();

      const role =
        token?.claims?.role;

      if(
        role === "support" ||
        role === "admin"
      ){

        return {
          user,
          role
        };

      }

    }

  }catch(error){

    console.warn(
      "تعذر قراءة صلاحية الموظف من Firebase:",
      error
    );

  }


  /* -----------------------------------------
     التحقق من supportStaff/{uid}
     ----------------------------------------- */

  try{

    if(
      window.ma3daDB &&
      window.ma3daDoc &&
      window.ma3daGetDoc
    ){

      const ref =
        window.ma3daDoc(
          window.ma3daDB,
          "supportStaff",
          user.uid
        );


      const snapshot =
        await window.ma3daGetDoc(
          ref
        );


      if(snapshot.exists()){

        const data =
          snapshot.data() || {};


        const role =
          data.role ||
          "support";


        if(
          (
            role === "support" ||
            role === "admin"
          ) &&
          data.active !== false
        ){

          return {
            user,
            role,
            data
          };

        }

      }

    }

  }catch(error){

    console.error(
      "تعذر التحقق من حساب موظف الدعم:",
      error
    );

  }


  return null;

}


/* =========================================================
   حماية لوحة موظفي الدعم
   ========================================================= */

async function requireSupportEmployee(){

  const employee =
    await getSupportEmployee();


  if(!employee){

    supportEmployee =
      null;


    localStorage.removeItem(
      "supportEmployee"
    );


    openSupportScreen(
      "supportLoginScreen"
    );


    return null;

  }


  supportEmployee =
    employee;


  localStorage.setItem(
    "supportEmployee",
    JSON.stringify({

      uid:
        employee.user.uid,

      email:
        employee.user.email ||
        "",

      role:
        employee.role

    })
  );


  return employee;

}


/* =========================================================
   تسجيل دخول موظف الدعم
   ========================================================= */
async function supportLogin(){

  const email =
    document
      .getElementById(
        "supportEmailInput"
      )
      ?.value
      .trim();


  const password =
    document
      .getElementById(
        "supportPasswordInput"
      )
      ?.value;


  const error =
    document.getElementById(
      "supportLoginError"
    );


  if(error){

    error.textContent =
      "";

    error.style.color =
      "#b91c1c";

  }


  if(!email){

    if(error)
      error.textContent =
        "اكتب بريد الموظف.";

    return;

  }


  if(!password){

    if(error)
      error.textContent =
        "اكتب كلمة المرور.";

    return;

  }


  if(
    typeof window.ma3daLogin !==
    "function"
  ){

    if(error)
      error.textContent =
        "خدمة تسجيل الدخول غير جاهزة.";

    return;

  }


  const button =
    document.getElementById(
      "supportLoginBtn"
    );


  if(button){

    button.disabled =
      true;

    button.textContent =
      "جاري التحقق...";

  }


  try{

    await window.ma3daLogin(
      email,
      password
    );


    /*
      ننتظر قليلًا حتى يتأكد Firebase
      من تثبيت المستخدم الحالي بعد تسجيل الدخول
    */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          500
        )
    );


    /*
      نقرأ المستخدم مباشرة من Firebase
      بدل الاعتماد فقط على الدالة العامة
    */

    const currentUser =
      window.ma3daAuth?.currentUser;


    if(!currentUser){

      if(error)
        error.textContent =
          "تم تسجيل الدخول، لكن لم يتم التعرف على حساب الموظف. حاول مرة أخرى.";

      return;

    }


    /*
      نتحقق من موظف الدعم باستخدام
      UID المستخدم الحالي مباشرة
    */

    let employee = null;


    try{

      const ref =
        window.ma3daDoc(
          window.ma3daDB,
          "supportStaff",
          currentUser.uid
        );


      const snapshot =
        await window.ma3daGetDoc(
          ref
        );


      if(snapshot.exists()){

        const data =
          snapshot.data() || {};


        const role =
          data.role ||
          "support";


        if(
          (
            role === "support" ||
            role === "admin"
          ) &&
          data.active !== false
        ){

          employee = {

            user:
              currentUser,

            role,

            data

          };

        }

      }

    }catch(checkError){

      console.error(
        "خطأ قراءة بيانات موظف الدعم:",
        checkError
      );

    }


    if(!employee){

      if(error)
        error.textContent =
          "هذا الحساب ليس حساب موظف دعم مصرحًا له.";

      return;

    }


    supportEmployee =
      employee;


    localStorage.setItem(
      "supportEmployee",
      JSON.stringify({

        uid:
          employee.user.uid,

        email:
          employee.user.email ||
          email,

        role:
          employee.role

      })
    );


    openSupportDashboard();


  }catch(errorObject){

    console.error(
      "خطأ دخول موظف الدعم:",
      errorObject
    );


    if(error){

      error.textContent =
        errorObject?.message ||
        "تعذر تسجيل الدخول.";

    }

  }finally{

    if(button){

      button.disabled =
        false;

      button.textContent =
        "دخول الموظف";

    }

  }

}

/* =========================================================
   استعادة كلمة المرور
   ========================================================= */

async function supportResetPassword(){

  const email =
    document
      .getElementById(
        "supportResetEmailInput"
      )
      ?.value
      .trim();


  const message =
    document.getElementById(
      "supportResetMessage"
    );


  const button =
    document.getElementById(
      "supportResetBtn"
    );


  if(message){

    message.textContent =
      "";

    message.style.color =
      "#b91c1c";

  }


  if(!email){

    if(message)
      message.textContent =
        "اكتب بريد الموظف.";

    return;

  }


  if(
    typeof window.ma3daSendPasswordResetEmail !==
    "function"
  ){

    if(message)
      message.textContent =
        "خدمة الاستعادة غير جاهزة.";

    return;

  }


  if(button){

    button.disabled =
      true;

    button.textContent =
      "جاري الإرسال...";

  }


  try{

    await window.ma3daSendPasswordResetEmail(
      email
    );


    if(message){

      message.style.color =
        "#15803d";

      message.textContent =
        "تم إرسال رابط الاستعادة إلى البريد الإلكتروني.";

    }


  }catch(error){

    console.error(
      "خطأ استعادة كلمة مرور الموظف:",
      error
    );


    if(message){

      message.style.color =
        "#b91c1c";

      message.textContent =
        error?.message ||
        "تعذر إرسال رابط الاستعادة.";

    }


  }finally{

    if(button){

      button.disabled =
        false;

      button.textContent =
        "إرسال رابط الاستعادة";

    }

  }

}


/* =========================================================
   أقسام لوحة الدعم
   ========================================================= */

function supportSetSection(name){

  document
    .querySelectorAll(
      "[data-support-section]"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.supportSection ===
        name
      );

    });


  document
    .querySelectorAll(
      ".support-section"
    )
    .forEach(section => {

      section.classList.remove(
        "active"
      );

    });


  const sectionId =
    `supportSection${
      name.charAt(0).toUpperCase()
    }${name.slice(1)}`;


  const section =
    document.getElementById(
      sectionId
    );


  if(section){

    section.classList.add(
      "active"
    );

  }

}


/* =========================================================
   عرض قائمة
   ========================================================= */

function supportSetList(
  id,
  html
){

  const list =
    document.getElementById(
      id
    );


  if(list){

    list.innerHTML =
      html;

  }

}


/* =========================================================
   صف بيانات
   ========================================================= */

function supportRow(
  title,
  value
){

  return `
    <div class="support-row">

      <span>
        ${title}
      </span>

      <strong>
        ${value ?? "-"}
      </strong>

    </div>
  `;

}


/* =========================================================
   جلب Collection من Firestore
   ========================================================= */

async function supportGetCollection(
  name
){

  if(
    !window.ma3daDB ||
    !window.ma3daCollection ||
    !window.ma3daGetDocs
  ){

    console.warn(
      "Firebase غير جاهز لتحميل:",
      name
    );

    return [];

  }


  try{

    const snapshot =
      await window.ma3daGetDocs(
        window.ma3daCollection(
          window.ma3daDB,
          name
        )
      );


    const rows = [];


    snapshot.forEach(
      docSnap => {

        rows.push({

          id:
            docSnap.id,

          ...(docSnap.data() || {})

        });

      }
    );


    return rows;


  }catch(error){

    console.warn(
      `تعذر تحميل ${name}:`,
      error
    );


    return [];

  }

}


/* =========================================================
   الطلبات / التذاكر
   ========================================================= */

async function loadSupportTickets(){

  const rows =
    await supportGetCollection(
      "supportTickets"
    );


  const list =
    document.getElementById(
      "supportTicketsList"
    );


  const stat =
    document.getElementById(
      "supportStatTickets"
    );


  if(stat)
    stat.textContent =
      rows.length;


  if(!list)
    return;


  if(!rows.length){

    list.innerHTML =
      '<div class="support-empty">لا توجد طلبات دعم مسجلة حاليًا.</div>';

    return;

  }


  list.innerHTML =
    rows
      .slice(0,50)
      .map(row => `

        <div class="support-row">

          <div>

            <strong>
              ${
                row.subject ||
                row.title ||
                "طلب دعم"
              }
            </strong>

            <br>

            <small>
              ${
                row.customerEmail ||
                row.email ||
                row.customerId ||
                "مستخدم"
              }
            </small>

          </div>

          <span>
            ${
              row.status ||
              "مفتوح"
            }
          </span>

        </div>

      `)
      .join("");

}


/* =========================================================
   العملاء والمشغلين
   ========================================================= */

async function loadSupportUsers(){

  const users =
    await supportGetCollection(
      "users"
    );


  const customers =
    users.filter(
      row =>
        row.role === "customer" ||
        row.userType === "customer"
    );


  const operators =
    users.filter(
      row =>
        row.role === "operator" ||
        row.userType === "operator"
    );


  const customerList =
    document.getElementById(
      "supportCustomersList"
    );


  const operatorList =
    document.getElementById(
      "supportOperatorsList"
    );


  const customerStat =
    document.getElementById(
      "supportStatCustomers"
    );


  const operatorStat =
    document.getElementById(
      "supportStatOperators"
    );


  if(customerStat)
    customerStat.textContent =
      customers.length;


  if(operatorStat)
    operatorStat.textContent =
      operators.length;


  if(customerList){

    customerList.innerHTML =
      customers.length

        ? customers
            .slice(0,50)
            .map(row =>
              supportRow(

                row.name ||
                  "عميل",

                row.email ||
                  row.phone ||
                  row.id

              )
            )
            .join("")

        : '<div class="support-empty">لا توجد بيانات عملاء في مجموعة users.</div>';

  }


  if(operatorList){

    operatorList.innerHTML =
      operators.length

        ? operators
            .slice(0,50)
            .map(row =>
              supportRow(

                row.name ||
                  "صاحب معدة / مشغل",

                row.email ||
                  row.phone ||
                  row.id

              )
            )
            .join("")

        : '<div class="support-empty">لا توجد بيانات مشغلين في مجموعة users.</div>';

  }

}


/* =========================================================
   المعدات
   ========================================================= */

async function loadSupportEquipment(){

  const equipment =
    await supportGetCollection(
      "equipment"
    );


  const list =
    document.getElementById(
      "supportOperatorsList"
    );


  const stat =
    document.getElementById(
      "supportStatOperators"
    );


  if(stat)
    stat.textContent =
      equipment.length;


  if(!list)
    return;


  if(!equipment.length){

    list.innerHTML =
      '<div class="support-empty">لا توجد معدات مسجلة حاليًا.</div>';

    return;

  }


  list.innerHTML =
    equipment
      .slice(0,50)
      .map(row => `

        <div class="support-row">

          <div>

            <strong>

              ${
                row.type ||
                "معدة"
              }

              ${
                row.model ||
                ""
              }

            </strong>

            <br>

            <small>

              ${
                row.city ||
                "بدون مدينة"
              }

            </small>

          </div>


          <span>

            ${
              row.availability ===
              "available"

                ? "متاحة"

                : "غير متاحة"
            }

          </span>

        </div>

      `)
      .join("");

}


/* =========================================================
   الطلبات الحالية
   ========================================================= */

async function loadSupportOrders(){

  const rows =
    await supportGetCollection(
      "requests"
    );


  const current =
    rows.filter(
      row =>
        [
          "searching",
          "accepted",
          "arrived",
          "working"
        ].includes(
          row.status
        )
    );


  const list =
    document.getElementById(
      "supportOrdersList"
    );


  const stat =
    document.getElementById(
      "supportStatOrders"
    );


  if(stat)
    stat.textContent =
      current.length;


  if(!list)
    return;


  if(!current.length){

    list.innerHTML =
      '<div class="support-empty">لا توجد طلبات حالية.</div>';

    return;

  }


  list.innerHTML =
    current
      .slice(0,50)
      .map(row => `

        <div class="support-row">

          <div>

            <strong>

              ${
                row.equipment ||
                "طلب معدة"
              }

            </strong>

            <br>

            <small>

              ${
                row.location ||
                "بدون موقع"
              }

            </small>

          </div>


          <span>

            ${
              row.status ||
              "-"
            }

          </span>

        </div>

      `)
      .join("");

}


/* =========================================================
   المحادثات
   ========================================================= */

async function loadSupportChats(){

  const tickets =
    await supportGetCollection(
      "supportTickets"
    );


  const list =
    document.getElementById(
      "supportChatsList"
    );


  if(!list)
    return;


  if(!tickets.length){

    list.innerHTML =
      '<div class="support-empty">لا توجد محادثات دعم حاليًا.</div>';

    return;

  }


  list.innerHTML =
    tickets
      .slice(0,50)
      .map(row => `

        <div class="support-row">

          <div>

            <strong>

              ${
                row.subject ||
                row.title ||
                "محادثة دعم"
              }

            </strong>

            <br>

            <small>

              ${
                row.customerEmail ||
                row.email ||
                row.customerId ||
                "مستخدم"
              }

            </small>

          </div>


          <span>

            ${
              row.status ||
              "مفتوح"
            }

          </span>

        </div>

      `)
      .join("");

}


/* =========================================================
   البلاغات
   ========================================================= */

async function loadSupportReports(){

  const rows =
    await supportGetCollection(
      "reports"
    );


  const list =
    document.getElementById(
      "supportReportsList"
    );


  if(!list)
    return;


  if(!rows.length){

    list.innerHTML =
      '<div class="support-empty">لا توجد بلاغات أو مشاكل مسجلة.</div>';

    return;

  }


  list.innerHTML =
    rows
      .slice(0,50)
      .map(row => `

        <div class="support-row">

          <div>

            <strong>

              ${
                row.title ||
                row.subject ||
                "بلاغ"
              }

            </strong>

            <br>

            <small>

              ${
                row.description ||
                row.message ||
                "بدون وصف"
              }

            </small>

          </div>


          <span>

            ${
              row.status ||
              "مفتوح"
            }

          </span>

        </div>

      `)
      .join("");

}


/* =========================================================
   فتح لوحة موظف الدعم
   ========================================================= */

async function openSupportDashboard(){

  const employee =
    await requireSupportEmployee();


  if(!employee)
    return;


  const email =
    employee.user.email ||
    "";


  const emailElements = [

    document.getElementById(
      "supportEmployeeEmail"
    ),

    document.getElementById(
      "supportSettingsEmail"
    )

  ];


  emailElements.forEach(
    element => {

      if(element){

        element.textContent =
          email ||
          "موظف دعم";

      }

    }
  );


  const role =
    document.getElementById(
      "supportSettingsRole"
    );


  if(role){

    role.textContent =
      employee.role === "admin"
        ? "مدير دعم"
        : "موظف دعم";

  }


  openSupportScreen(
    "supportDashboardScreen"
  );


  /*
    نفتح قسم التذاكر افتراضيًا
  */

  supportSetSection(
    "tickets"
  );


  await Promise.all([

    loadSupportTickets(),

    loadSupportUsers(),

    loadSupportEquipment(),

    loadSupportOrders(),

    loadSupportChats(),

    loadSupportReports()

  ]);

}


/* =========================================================
   تسجيل الخروج
   ========================================================= */

async function supportLogout(){

  try{

    if(
      typeof window.ma3daLogout ===
      "function"
    ){

      await window.ma3daLogout();

    }

  }catch(error){

    console.error(
      "تعذر تسجيل خروج موظف الدعم:",
      error
    );

  }finally{

    supportEmployee =
      null;


    localStorage.removeItem(
      "supportEmployee"
    );


    openSupportScreen(
      "roleScreen"
    );

  }

}


/* =========================================================
   زر دخول موظفي الدعم من صفحة اختيار الدور
   ========================================================= */

function initSupportRoleButton(){

  const supportStaffBtn =
    document.getElementById(
      "supportStaffBtn"
    );


  if(
    supportStaffBtn &&
    !supportStaffBtn.dataset.supportReady
  ){

    supportStaffBtn.dataset.supportReady =
      "true";


    supportStaffBtn.addEventListener(
      "click",
      () => {

        openSupportScreen(
          "supportLoginScreen"
        );

      }
    );

  }

}


/* =========================================================
   تشغيل أزرار بوابة الدعم
   ========================================================= */

function initSupportPortal(){

  const loginButton =
    document.getElementById(
      "supportLoginBtn"
    );


  const forgotButton =
    document.getElementById(
      "supportForgotBtn"
    );


  const resetButton =
    document.getElementById(
      "supportResetBtn"
    );


  const backButton =
    document.getElementById(
      "supportBackBtn"
    );


  const forgotBackButton =
    document.getElementById(
      "supportForgotBackBtn"
    );


  const logoutButton =
    document.getElementById(
      "supportLogoutBtn"
    );


  const refreshButton =
    document.getElementById(
      "supportRefreshBtn"
    );


  /* -----------------------------------------
     زر دخول الموظف
     ----------------------------------------- */

  if(
    loginButton &&
    !loginButton.dataset.supportReady
  ){

    loginButton.dataset.supportReady =
      "true";


    loginButton.addEventListener(
      "click",
      supportLogin
    );

  }


  /* -----------------------------------------
     نسيت كلمة المرور
     ----------------------------------------- */

  if(
    forgotButton &&
    !forgotButton.dataset.supportReady
  ){

    forgotButton.dataset.supportReady =
      "true";


    forgotButton.addEventListener(
      "click",
      () => {

        openSupportScreen(
          "supportForgotScreen"
        );

      }
    );

  }


  /* -----------------------------------------
     إرسال رابط الاستعادة
     ----------------------------------------- */

  if(
    resetButton &&
    !resetButton.dataset.supportReady
  ){

    resetButton.dataset.supportReady =
      "true";


    resetButton.addEventListener(
      "click",
      supportResetPassword
    );

  }


  /* -----------------------------------------
     العودة من تسجيل دخول الدعم
     ----------------------------------------- */

  if(
    backButton &&
    !backButton.dataset.supportReady
  ){

    backButton.dataset.supportReady =
      "true";


    backButton.addEventListener(
      "click",
      () => {

        openSupportScreen(
          "roleScreen"
        );

      }
    );

  }


  /* -----------------------------------------
     العودة من صفحة نسيت كلمة المرور
     ----------------------------------------- */

  if(
    forgotBackButton &&
    !forgotBackButton.dataset.supportReady
  ){

    forgotBackButton.dataset.supportReady =
      "true";


    forgotBackButton.addEventListener(
      "click",
      () => {

        openSupportScreen(
          "supportLoginScreen"
        );

      }
    );

  }


  /* -----------------------------------------
     أقسام لوحة الدعم
     ----------------------------------------- */

  document
    .querySelectorAll(
      "[data-support-section]"
    )
    .forEach(button => {

      if(
        button.dataset.supportReady
      )
        return;


      button.dataset.supportReady =
        "true";


      button.addEventListener(
        "click",
        async () => {

          const section =
            button.dataset
              .supportSection;


          if(!section)
            return;


          supportSetSection(
            section
          );


          if(section === "tickets"){

            await loadSupportTickets();

          }


          if(section === "customers"){

            await loadSupportUsers();

          }


          if(section === "operators"){

            await loadSupportEquipment();

          }


          if(section === "orders"){

            await loadSupportOrders();

          }


          if(section === "chats"){

            await loadSupportChats();

          }


          if(section === "reports"){

            await loadSupportReports();

          }

        }
      );

    });


  /* -----------------------------------------
     تحديث لوحة الدعم
     ----------------------------------------- */

  if(
    refreshButton &&
    !refreshButton.dataset.supportReady
  ){

    refreshButton.dataset.supportReady =
      "true";


    refreshButton.addEventListener(
      "click",
      async () => {

        await openSupportDashboard();

      }
    );

  }


  /* -----------------------------------------
     تسجيل الخروج
     ----------------------------------------- */

  if(
    logoutButton &&
    !logoutButton.dataset.supportReady
  ){

    logoutButton.dataset.supportReady =
      "true";


    logoutButton.addEventListener(
      "click",
      supportLogout
    );

  }


  /* -----------------------------------------
     زر الدخول من صفحة اختيار الدور
     ----------------------------------------- */

  initSupportRoleButton();

}


/* =========================================================
   تشغيل البوابة بعد اكتمال HTML
   ========================================================= */

function startSupportPortal(){

  initSupportPortal();


  /*
    إذا دخل الموظف بالرابط:
    ?staff=1

    نفتح صفحة الدخول تلقائيًا.
  */

  if(SUPPORT_STAFF_MODE){

    const currentUser =
      window.ma3daGetCurrentUser
        ? window.ma3daGetCurrentUser()
        : Promise.resolve(
            window.ma3daAuth?.currentUser ||
            null
          );


    Promise.resolve(
      currentUser
    )
      .then(
        async user => {

          if(user){

            const employee =
              await getSupportEmployee();


            if(employee){

              supportEmployee =
                employee;


              await openSupportDashboard();


              return;

            }

          }


          openSupportScreen(
            "supportLoginScreen"
          );

        }
      )
      .catch(error => {

        console.error(
          "تعذر تشغيل بوابة موظفي الدعم:",
          error
        );


        openSupportScreen(
          "supportLoginScreen"
        );

      });

  }

}


/* =========================================================
   مهم جدًا:
   script.js يتم تحميله ديناميكيًا قبل نهاية index.html
   لذلك ننتظر DOM إذا لم يكن مكتملًا.
   ========================================================= */

if(
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    startSupportPortal,
    {
      once: true
    }
  );

}else{

  startSupportPortal();

}


/* =========================================================
   دعم إضافي إذا تم إنشاء زر الدعم بعد تحميل script.js
   ========================================================= */

setTimeout(
  () => {

    initSupportRoleButton();

  },
  500
);
/* =========================================================
   CONTRACTOR / PROJECT OWNER
   مِعدة
========================================================= */

(function () {

  "use strict";

  /* =========================================================
     CONTRACTOR STATE
  ========================================================= */

  let contractorCurrentOrderId =
    localStorage.getItem("contractorCurrentOrderId") || null;

  let contractorCurrentOrder =
    JSON.parse(
      localStorage.getItem("contractorCurrentOrder") || "null"
    );

  let contractorProfile =
    JSON.parse(
      localStorage.getItem("contractorProfile") || "null"
    );


  /* =========================================================
     HELPERS
  ========================================================= */

  function contractorShowScreen(screenId) {

    if (typeof showScreen === "function") {
      showScreen(screenId);
      return;
    }

    document
      .querySelectorAll(".screen")
      .forEach(screen => {
        screen.classList.remove("active");
      });

    const screen =
      document.getElementById(screenId);

    if (screen) {
      screen.classList.add("active");
    }
  }


  function getContractorUser() {

    if (
      typeof window.ma3daGetCurrentUser ===
      "function"
    ) {
      return window.ma3daGetCurrentUser();
    }

    if (window.ma3daAuth) {
      return window.ma3daAuth.currentUser || null;
    }

    return null;
  }


  function contractorSaveLocal(profile) {

    contractorProfile = profile;

    localStorage.setItem(
      "contractorProfile",
      JSON.stringify(profile)
    );
  }


  function contractorGetProfile() {

    return contractorProfile ||
      JSON.parse(
        localStorage.getItem(
          "contractorProfile"
        ) || "null"
      );
  }


  function contractorSetRole() {

    localStorage.setItem(
      "ma3daRole",
      "contractor"
    );

    localStorage.setItem(
      "userRole",
      "contractor"
    );

    localStorage.setItem(
      "currentRole",
      "contractor"
    );

    window.ma3daCurrentRole =
      "contractor";
  }


  
/* =========================================================
   CONTRACTOR ROLE BUTTON
========================================================= */

document.addEventListener(
  "click",
  function(event) {

    const contractorRoleBtn =
      event.target.closest(
        "#contractorRoleBtn"
      );

    if (!contractorRoleBtn)
      return;

    contractorSetRole();

   selectedRole = "contractor";
localStorage.setItem("selectedRole", "contractor");

    const phoneRoleText =
      document.getElementById(
        "phoneRoleText"
      );

    if (phoneRoleText) {

      phoneRoleText.textContent =
        "تسجيل الدخول كمقاول / صاحب مشروع";

    }

    const phoneTitle =
      document.querySelector(
        "#phoneScreen h1"
      );

    if (phoneTitle) {

      phoneTitle.textContent =
        "تسجيل الدخول";

    }

    contractorShowScreen(
      "phoneScreen"
    );

  }
);


  /* =========================================================
     LOAD CONTRACTOR PROFILE
  ========================================================= */

  async function loadContractorProfile() {

    const user =
      getContractorUser();

    if (!user) {
      return null;
    }

    try {

      const contractorRef =
        window.ma3daDoc(
          window.ma3daDB,
          "contractors",
          user.uid
        );

      const snapshot =
        await window.ma3daGetDoc(
          contractorRef
        );

      if (
        snapshot &&
        snapshot.exists()
      ) {

        const data =
          snapshot.data();

        contractorSaveLocal({
          ...data,
          uid: user.uid
        });

        fillContractorProfile(
          data
        );

        return data;
      }

    } catch (error) {

      console.error(
        "Contractor profile error:",
        error
      );

    }

    return null;
  }


  /* =========================================================
     FILL CONTRACTOR DATA
  ========================================================= */

  function fillContractorProfile(
    data
  ) {

    if (!data) {
      return;
    }

    const name =
      data.name ||
      data.contractorName ||
      "";

    const phone =
      data.phone ||
      "";

    const city =
      data.city ||
      "";

    const company =
      data.company ||
      data.companyName ||
      "";


    const nameInput =
      document.getElementById(
        "contractorNameInput"
      );

    const phoneInput =
      document.getElementById(
        "contractorPhoneInput"
      );

    const cityInput =
      document.getElementById(
        "contractorCityInput"
      );

    const companyInput =
      document.getElementById(
        "contractorCompanyInput"
      );


    if (nameInput) {
      nameInput.value = name;
    }

    if (phoneInput) {
      phoneInput.value = phone;
    }

    if (cityInput) {
      cityInput.value = city;
    }

    if (companyInput) {
      companyInput.value = company;
    }


    const homeName =
      document.getElementById(
        "contractorHomeName"
      );

    if (homeName) {
      homeName.textContent =
        name || "مقاول";
    }


    const settingsName =
      document.getElementById(
        "contractorSettingsName"
      );

    const settingsPhone =
      document.getElementById(
        "contractorSettingsPhone"
      );

    const settingsCity =
      document.getElementById(
        "contractorSettingsCity"
      );

    const settingsCompany =
      document.getElementById(
        "contractorSettingsCompany"
      );


    if (settingsName) {
      settingsName.value = name;
    }

    if (settingsPhone) {
      settingsPhone.value = phone;
    }

    if (settingsCity) {
      settingsCity.value = city;
    }

    if (settingsCompany) {
      settingsCompany.value = company;
    }

  }


  /* =========================================================
     SAVE CONTRACTOR DATA
  ========================================================= */

  const saveContractorDataBtn =
    document.getElementById(
      "saveContractorDataBtn"
    );

  if (saveContractorDataBtn) {

    saveContractorDataBtn.addEventListener(
      "click",
      async function () {

        const user =
          getContractorUser();

        if (!user) {

          alert(
            "يجب تسجيل الدخول أولاً."
          );

          return;
        }


        const name =
          document
            .getElementById(
              "contractorNameInput"
            )
            ?.value
            ?.trim();

        const phone =
          document
            .getElementById(
              "contractorPhoneInput"
            )
            ?.value
            ?.trim();

        const city =
          document
            .getElementById(
              "contractorCityInput"
            )
            ?.value
            ?.trim();

        const company =
          document
            .getElementById(
              "contractorCompanyInput"
            )
            ?.value
            ?.trim();


        if (!name) {

          alert(
            "اكتب اسمك."
          );

          return;
        }


        if (!phone) {

          alert(
            "اكتب رقم الجوال."
          );

          return;
        }


        if (!city) {

          alert(
            "اكتب المدينة."
          );

          return;
        }


        try {

          saveContractorDataBtn.disabled =
            true;

          saveContractorDataBtn.textContent =
            "جاري الحفظ...";


          const contractorData = {

            uid: user.uid,

            name: name,

            phone: phone,

            city: city,

            company: company,

            email:
              user.email || "",

            role:
              "contractor",

            updatedAt:
              new Date()

          };


          const contractorRef =
            window.ma3daDoc(
              window.ma3daDB,
              "contractors",
              user.uid
            );


          await window.ma3daSetDoc(
            contractorRef,
            contractorData,
            {
              merge: true
            }
          );


          contractorSaveLocal(
            contractorData
          );


          fillContractorProfile(
            contractorData
          );


          contractorShowScreen(
            "contractorHomeScreen"
          );


        } catch (error) {

          console.error(
            "Save contractor error:",
            error
          );

          alert(
            "تعذر حفظ بيانات المقاول."
          );

        } finally {

          saveContractorDataBtn.disabled =
            false;

          saveContractorDataBtn.textContent =
            "حفظ ومتابعة";

        }

      }
    );

  }


  /* =========================================================
     OPEN CONTRACTOR HOME
  ========================================================= */

  async function openContractorHome() {

    contractorSetRole();

    const profile =
      await loadContractorProfile();

    if (profile) {

      fillContractorProfile(
        profile
      );

      contractorShowScreen(
        "contractorHomeScreen"
      );

      return;
    }


    const localProfile =
      contractorGetProfile();

    if (localProfile) {

      fillContractorProfile(
        localProfile
      );

      contractorShowScreen(
        "contractorHomeScreen"
      );

      return;
    }


    contractorShowScreen(
      "contractorDataScreen"
    );

  }


  window.openContractorHome =
    openContractorHome;


  /* =========================================================
     NEW REQUEST
  ========================================================= */

  const contractorNewRequestBtn =
    document.getElementById(
      "contractorNewRequestBtn"
    );

  if (contractorNewRequestBtn) {

    contractorNewRequestBtn.addEventListener(
      "click",
      function () {

        contractorSetRole();

        contractorShowScreen(
          "contractorRequestScreen"
        );

      }
    );

  }


  /* =========================================================
     SUBMIT CONTRACTOR REQUEST
  ========================================================= */

  const submitContractorRequestBtn =
    document.getElementById(
      "submitContractorRequestBtn"
    );

  if (submitContractorRequestBtn) {

    submitContractorRequestBtn.addEventListener(
      "click",
      async function () {

        const user =
          getContractorUser();

        if (!user) {

          alert(
            "يجب تسجيل الدخول أولاً."
          );

          return;
        }


        const profile =
          contractorGetProfile();


        const location =
          document
            .getElementById(
              "contractorRequestLocation"
            )
            ?.value
            ?.trim();

        const equipment =
          document
            .getElementById(
              "contractorEquipmentType"
            )
            ?.value;

        const duration =
          document
            .getElementById(
              "contractorDuration"
            )
            ?.value;

        const operator =
          document
            .getElementById(
              "contractorOperator"
            )
            ?.value;

        const notes =
          document
            .getElementById(
              "contractorNotes"
            )
            ?.value
            ?.trim();


        if (!location) {

          alert(
            "اكتب موقع العمل."
          );

          return;
        }


        if (!equipment) {

          alert(
            "اختر نوع المعدة."
          );

          return;
        }


        if (!duration) {

          alert(
            "اختر مدة العمل."
          );

          return;
        }


        if (!operator) {

          alert(
            "اختر المشغل."
          );

          return;
        }


        /*
          الأسعار نفسها المستخدمة
          في نظام مِعدة الحالي.
        */

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


        const hours =
          durationHours[duration] ||
          1;

        const hourlyPrice =
          hourlyPrices[equipment] ||
          0;

        const price =
          hourlyPrice * hours;


        try {

          submitContractorRequestBtn.disabled =
            true;

          submitContractorRequestBtn.textContent =
            "جاري إرسال الطلب...";


          const requestData = {

            location: location,

            equipment: equipment,

            duration: duration,

            durationHours: hours,

            operator: operator,

            notes: notes,

            price: price,

            customerId: user.uid,

            customerEmail:
              user.email || "",

            requesterId:
              user.uid,

            requesterRole:
              "contractor",

            requesterType:
              "contractor",

            contractorId:
              user.uid,

            contractorName:
              profile?.name || "",

            contractorPhone:
              profile?.phone || "",

            contractorCity:
              profile?.city || "",

            contractorCompany:
              profile?.company || "",

            status:
              "searching",

            createdAt:
              new Date()

          };


          const requestsCollection =
            window.ma3daCollection(
              window.ma3daDB,
              "requests"
            );


          const result =
            await window.ma3daAddDoc(
              requestsCollection,
              requestData
            );


          contractorCurrentOrderId =
            result.id;


          contractorCurrentOrder = {

            id: result.id,

            ...requestData

          };


          localStorage.setItem(
            "contractorCurrentOrderId",
            result.id
          );


          localStorage.setItem(
            "contractorCurrentOrder",
            JSON.stringify(
              contractorCurrentOrder
            )
          );


          alert(
            "تم إرسال طلب المعدة بنجاح."
          );


          contractorShowScreen(
            "contractorCurrentOrdersScreen"
          );


          await loadContractorCurrentOrders();


        } catch (error) {

          console.error(
            "Contractor request error:",
            error
          );

          if (
            error?.code ===
            "permission-denied"
          ) {

            alert(
              "ليس لديك صلاحية لإرسال الطلب. تحقق من قواعد Firebase."
            );

          } else {

            alert(
              "تعذر إرسال الطلب حالياً."
            );

          }

        } finally {

          submitContractorRequestBtn.disabled =
            false;

          submitContractorRequestBtn.textContent =
            "إرسال طلب المعدة";

        }

      }
    );

  }


  /* =========================================================
     CANCEL NEW REQUEST
  ========================================================= */

  const cancelContractorRequestBtn =
    document.getElementById(
      "cancelContractorRequestBtn"
    );

  if (cancelContractorRequestBtn) {

    cancelContractorRequestBtn.addEventListener(
      "click",
      function () {

        contractorShowScreen(
          "contractorHomeScreen"
        );

      }
    );

  }


  /* =========================================================
     LOAD CURRENT ORDERS
  ========================================================= */

  async function loadContractorCurrentOrders() {

    const list =
      document.getElementById(
        "contractorCurrentOrdersList"
      );

    if (!list) {
      return;
    }


    const user =
      getContractorUser();

    if (!user) {
      return;
    }


    list.innerHTML = `
      <div class="card">
        <p>جاري تحميل الطلبات...</p>
      </div>
    `;


    try {

      const requestsRef =
        window.ma3daCollection(
          window.ma3daDB,
          "requests"
        );


      const snapshot =
        await window.ma3daGetDocs(
          requestsRef
        );


      const orders = [];


      snapshot.forEach(
        docSnap => {

          const data =
            docSnap.data();

          const requesterId =
            data.contractorId ||
            data.requesterId ||
            data.customerId;


          const role =
            data.requesterRole ||
            data.requesterType;


          if (
            requesterId === user.uid &&
            (
              role === "contractor" ||
              data.contractorId === user.uid
            )
          ) {

            const status =
              data.status || "";


            if (
              status !== "completed" &&
              status !== "cancelled" &&
              status !== "rejected"
            ) {

              orders.push({

                id: docSnap.id,

                ...data

              });

            }

          }

        }
      );


      orders.sort(
        (a, b) => {

          const aTime =
            a.createdAt?.seconds ||
            0;

          const bTime =
            b.createdAt?.seconds ||
            0;

          return bTime - aTime;

        }
      );


      if (!orders.length) {

        list.innerHTML = `
          <div class="card">
            <p>لا توجد طلبات حالية.</p>
          </div>
        `;

        return;
      }


      list.innerHTML =
        orders
          .map(
            order =>
              createContractorOrderCard(
                order
              )
          )
          .join("");


    } catch (error) {

      console.error(
        "Load contractor orders error:",
        error
      );

      list.innerHTML = `
        <div class="card">
          <p>تعذر تحميل الطلبات.</p>
        </div>
      `;

    }

  }


  /* =========================================================
     LOAD PREVIOUS ORDERS
  ========================================================= */

  async function loadContractorPreviousOrders() {

    const list =
      document.getElementById(
        "contractorPreviousOrdersList"
      );

    if (!list) {
      return;
    }


    const user =
      getContractorUser();

    if (!user) {
      return;
    }


    list.innerHTML = `
      <div class="card">
        <p>جاري تحميل الطلبات...</p>
      </div>
    `;


    try {

      const requestsRef =
        window.ma3daCollection(
          window.ma3daDB,
          "requests"
        );


      const snapshot =
        await window.ma3daGetDocs(
          requestsRef
        );


      const orders = [];


      snapshot.forEach(
        docSnap => {

          const data =
            docSnap.data();

          const requesterId =
            data.contractorId ||
            data.requesterId ||
            data.customerId;


          const role =
            data.requesterRole ||
            data.requesterType;


          if (
            requesterId === user.uid &&
            (
              role === "contractor" ||
              data.contractorId === user.uid
            )
          ) {

            const status =
              data.status || "";


            if (
              status === "completed" ||
              status === "cancelled" ||
              status === "rejected"
            ) {

              orders.push({

                id: docSnap.id,

                ...data

              });

            }

          }

        }
      );


      orders.sort(
        (a, b) => {

          const aTime =
            a.createdAt?.seconds ||
            0;

          const bTime =
            b.createdAt?.seconds ||
            0;

          return bTime - aTime;

        }
      );


      if (!orders.length) {

        list.innerHTML = `
          <div class="card">
            <p>لا توجد طلبات سابقة.</p>
          </div>
        `;

        return;
      }


      list.innerHTML =
        orders
          .map(
            order =>
              createContractorOrderCard(
                order,
                true
              )
          )
          .join("");


    } catch (error) {

      console.error(
        "Load contractor previous orders error:",
        error
      );

      list.innerHTML = `
        <div class="card">
          <p>تعذر تحميل الطلبات السابقة.</p>
        </div>
      `;

    }

  }


  /* =========================================================
     ORDER CARD
  ========================================================= */

  function createContractorOrderCard(
    order,
    previous = false
  ) {

    const statusText =
      getContractorStatusText(
        order.status
      );


    const price =
      order.price
        ? `${order.price} ريال`
        : "غير محدد";


    return `

      <div
        class="card contractor-order-card"
        data-contractor-order-id="${order.id}"
      >

        <h3>
          🚜 ${escapeContractorHtml(
            order.equipment || "-"
          )}
        </h3>


        <p>
          📍 ${escapeContractorHtml(
            order.location || "-"
          )}
        </p>


        <p>
          ⏱️ ${escapeContractorHtml(
            order.duration || "-"
          )}
        </p>


        <p>
          💰 ${price}
        </p>


        <p>
          الحالة:
          <strong>
            ${statusText}
          </strong>
        </p>


        <button
          type="button"
          class="main-btn"
          data-contractor-order-details="${order.id}"
        >
          عرض التفاصيل
        </button>

      </div>

    `;

  }


  /* =========================================================
     STATUS
  ========================================================= */

  function getContractorStatusText(
    status
  ) {

    const statuses = {

      searching:
        "جاري البحث عن معدة",

      accepted:
        "تم قبول الطلب",

      arrived:
        "المعدة وصلت",

      working:
        "العمل جارٍ",

      completed:
        "تم إكمال العمل",

      cancelled:
        "تم إلغاء الطلب",

      rejected:
        "تم رفض الطلب"

    };


    return (
      statuses[status] ||
      "جاري معالجة الطلب"
    );

  }


  /* =========================================================
     ORDER DETAILS
  ========================================================= */

  async function openContractorOrderDetails(
    orderId
  ) {

    if (!orderId) {
      return;
    }


    const user =
      getContractorUser();

    if (!user) {
      return;
    }


    try {

      const orderRef =
        window.ma3daDoc(
          window.ma3daDB,
          "requests",
          orderId
        );


      const snapshot =
        await window.ma3daGetDoc(
          orderRef
        );


      if (
        !snapshot.exists()
      ) {

        alert(
          "الطلب غير موجود."
        );

        return;
      }


      const order =
        snapshot.data();


      const requesterId =
        order.contractorId ||
        order.requesterId ||
        order.customerId;


      if (
        requesterId !== user.uid
      ) {

        alert(
          "لا يمكنك عرض هذا الطلب."
        );

        return;
      }


      contractorCurrentOrderId =
        orderId;


      contractorCurrentOrder = {

        id: orderId,

        ...order

      };


      localStorage.setItem(
        "contractorCurrentOrderId",
        orderId
      );


      localStorage.setItem(
        "contractorCurrentOrder",
        JSON.stringify(
          contractorCurrentOrder
        )
      );


      const status =
        document.getElementById(
          "contractorOrderStatus"
        );

      const equipment =
        document.getElementById(
          "contractorOrderEquipment"
        );

      const duration =
        document.getElementById(
          "contractorOrderDuration"
        );

      const location =
        document.getElementById(
          "contractorOrderLocation"
        );

      const operator =
        document.getElementById(
          "contractorOrderOperator"
        );

      const price =
        document.getElementById(
          "contractorOrderPrice"
        );


      if (status) {

        status.textContent =
          getContractorStatusText(
            order.status
          );

      }


      if (equipment) {

        equipment.textContent =
          order.equipment || "-";

      }


      if (duration) {

        duration.textContent =
          order.duration || "-";

      }


      if (location) {

        location.textContent =
          order.location || "-";

      }


      if (operator) {

        operator.textContent =
          order.operator || "-";

      }


      if (price) {

        price.textContent =
          order.price
            ? `${order.price} ريال`
            : "-";

      }


      contractorShowScreen(
        "contractorOrderDetailsScreen"
      );


    } catch (error) {

      console.error(
        "Contractor details error:",
        error
      );

      alert(
        "تعذر تحميل تفاصيل الطلب."
      );

    }

  }


  /* =========================================================
     CONTRACTOR EVENTS
  ========================================================= */

  document.addEventListener(
    "click",
    function (event) {

      const detailsBtn =
        event.target.closest(
          "[data-contractor-order-details]"
        );


      if (detailsBtn) {

        openContractorOrderDetails(
          detailsBtn.dataset
            .contractorOrderDetails
        );

        return;
      }

    }
  );


  /* =========================================================
     CURRENT ORDERS BUTTON
  ========================================================= */

  const contractorCurrentOrdersBtn =
    document.getElementById(
      "contractorCurrentOrdersBtn"
    );

  if (contractorCurrentOrdersBtn) {

    contractorCurrentOrdersBtn.addEventListener(
      "click",
      async function () {

        contractorShowScreen(
          "contractorCurrentOrdersScreen"
        );

        await loadContractorCurrentOrders();

      }
    );

  }


  /* =========================================================
     PREVIOUS ORDERS BUTTON
  ========================================================= */

  const contractorPreviousOrdersBtn =
    document.getElementById(
      "contractorPreviousOrdersBtn"
    );

  if (contractorPreviousOrdersBtn) {

    contractorPreviousOrdersBtn.addEventListener(
      "click",
      async function () {

        contractorShowScreen(
          "contractorPreviousOrdersScreen"
        );

        await loadContractorPreviousOrders();

      }
    );

  }


  /* =========================================================
     PROJECTS
  ========================================================= */

  const contractorProjectsBtn =
    document.getElementById(
      "contractorProjectsBtn"
    );

  if (contractorProjectsBtn) {

    contractorProjectsBtn.addEventListener(
      "click",
      async function () {

        contractorShowScreen(
          "contractorProjectsScreen"
        );

        await loadContractorProjects();

      }
    );

  }


  async function loadContractorProjects() {

    const list =
      document.getElementById(
        "contractorProjectsList"
      );

    if (!list) {
      return;
    }


    const user =
      getContractorUser();

    if (!user) {
      return;
    }


    list.innerHTML = `
      <div class="card">
        <p>جاري تحميل المشاريع...</p>
      </div>
    `;


    try {

      const requestsRef =
        window.ma3daCollection(
          window.ma3daDB,
          "requests"
        );


      const snapshot =
        await window.ma3daGetDocs(
          requestsRef
        );


      const orders = [];


      snapshot.forEach(
        docSnap => {

          const data =
            docSnap.data();


          const requesterId =
            data.contractorId ||
            data.requesterId ||
            data.customerId;


          if (
            requesterId === user.uid &&
            (
              data.requesterRole ===
                "contractor" ||
              data.requesterType ===
                "contractor" ||
              data.contractorId ===
                user.uid
            )
          ) {

            orders.push({

              id: docSnap.id,

              ...data

            });

          }

        }
      );


      if (!orders.length) {

        list.innerHTML = `
          <div class="card">
            <h3>🏗️ لا توجد مشاريع</h3>
            <p>
              عند إنشاء طلبات معدات ستظهر هنا.
            </p>
          </div>
        `;

        return;
      }


      list.innerHTML =
        orders
          .map(
            order => `

              <div class="card">

                <h3>
                  🏗️ مشروع
                </h3>

                <p>
                  🚜 ${escapeContractorHtml(
                    order.equipment || "-"
                  )}
                </p>

                <p>
                  📍 ${escapeContractorHtml(
                    order.location || "-"
                  )}
                </p>

                <p>
                  الحالة:
                  <strong>
                    ${getContractorStatusText(
                      order.status
                    )}
                  </strong>
                </p>

                <button
                  type="button"
                  class="main-btn"
                  data-contractor-order-details="${order.id}"
                >
                  عرض الطلب
                </button>

              </div>

            `
          )
          .join("");


    } catch (error) {

      console.error(
        "Contractor projects error:",
        error
      );

      list.innerHTML = `
        <div class="card">
          <p>تعذر تحميل المشاريع.</p>
        </div>
      `;

    }

  }


  /* =========================================================
     SETTINGS
  ========================================================= */

  const contractorSettingsBtn =
    document.getElementById(
      "contractorSettingsBtn"
    );

  if (contractorSettingsBtn) {

    contractorSettingsBtn.addEventListener(
      "click",
      async function () {

        const profile =
          contractorGetProfile();

        if (profile) {

          fillContractorProfile(
            profile
          );

        } else {

          await loadContractorProfile();

        }

        contractorShowScreen(
          "contractorSettingsScreen"
        );

      }
    );

  }


  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  const saveContractorSettingsBtn =
    document.getElementById(
      "saveContractorSettingsBtn"
    );

  if (saveContractorSettingsBtn) {

    saveContractorSettingsBtn.addEventListener(
      "click",
      async function () {

        const user =
          getContractorUser();

        if (!user) {

          alert(
            "يجب تسجيل الدخول."
          );

          return;
        }


        const name =
          document
            .getElementById(
              "contractorSettingsName"
            )
            ?.value
            ?.trim();

        const phone =
          document
            .getElementById(
              "contractorSettingsPhone"
            )
            ?.value
            ?.trim();

        const city =
          document
            .getElementById(
              "contractorSettingsCity"
            )
            ?.value
            ?.trim();

        const company =
          document
            .getElementById(
              "contractorSettingsCompany"
            )
            ?.value
            ?.trim();


        if (!name) {

          alert(
            "اكتب الاسم."
          );

          return;
        }


        try {

          saveContractorSettingsBtn.disabled =
            true;

          saveContractorSettingsBtn.textContent =
            "جاري الحفظ...";


          const data = {

            uid: user.uid,

            name: name,

            phone: phone,

            city: city,

            company: company,

            email:
              user.email || "",

            role:
              "contractor",

            updatedAt:
              new Date()

          };


          const contractorRef =
            window.ma3daDoc(
              window.ma3daDB,
              "contractors",
              user.uid
            );


          await window.ma3daSetDoc(
            contractorRef,
            data,
            {
              merge: true
            }
          );


          contractorSaveLocal(
            data
          );


          fillContractorProfile(
            data
          );


          alert(
            "تم حفظ التعديلات."
          );


        } catch (error) {

          console.error(
            "Contractor settings error:",
            error
          );

          alert(
            "تعذر حفظ التعديلات."
          );

        } finally {

          saveContractorSettingsBtn.disabled =
            false;

          saveContractorSettingsBtn.textContent =
            "حفظ التعديلات";

        }

      }
    );

  }


  /* =========================================================
     SETTINGS BACK
  ========================================================= */

  const contractorSettingsBackBtn =
    document.getElementById(
      "contractorSettingsBackBtn"
    );

  if (contractorSettingsBackBtn) {

    contractorSettingsBackBtn.addEventListener(
      "click",
      function () {

        contractorShowScreen(
          "contractorHomeScreen"
        );

      }
    );

  }


  /* =========================================================
     CURRENT ORDERS BACK
  ========================================================= */

  const contractorCurrentOrdersBackBtn =
    document.getElementById(
      "contractorCurrentOrdersBackBtn"
    );

  if (contractorCurrentOrdersBackBtn) {

    contractorCurrentOrdersBackBtn.addEventListener(
      "click",
      function () {

        contractorShowScreen(
          "contractorHomeScreen"
        );

      }
    );

  }


  /* =========================================================
     PREVIOUS ORDERS BACK
  ========================================================= */

  const contractorPreviousOrdersBackBtn =
    document.getElementById(
      "contractorPreviousOrdersBackBtn"
    );

  if (contractorPreviousOrdersBackBtn) {

    contractorPreviousOrdersBackBtn.addEventListener(
      "click",
      function () {

        contractorShowScreen(
          "contractorHomeScreen"
        );

      }
    );

  }


  /* =========================================================
     PROJECTS BACK
  ========================================================= */

  const contractorProjectsBackBtn =
    document.getElementById(
      "contractorProjectsBackBtn"
    );

  if (contractorProjectsBackBtn) {

    contractorProjectsBackBtn.addEventListener(
      "click",
      function () {

        contractorShowScreen(
          "contractorHomeScreen"
        );

      }
    );

  }


  /* =========================================================
     ORDER DETAILS BACK
  ========================================================= */

  const contractorOrderBackBtn =
    document.getElementById(
      "contractorOrderBackBtn"
    );

  if (contractorOrderBackBtn) {

    contractorOrderBackBtn.addEventListener(
      "click",
      function () {

        contractorShowScreen(
          "contractorCurrentOrdersScreen"
        );

        loadContractorCurrentOrders();

      }
    );

  }


  /* =========================================================
     ORDER CHAT
  ========================================================= */

  const contractorOrderChatBtn =
    document.getElementById(
      "contractorOrderChatBtn"
    );

  if (contractorOrderChatBtn) {

    contractorOrderChatBtn.addEventListener(
      "click",
      function () {

        /*
          نستخدم شاشة المحادثة الموجودة
          في مِعدة بدلاً من إنشاء شاشة جديدة.
        */

        if (
          typeof showScreen ===
          "function"
        ) {

          showScreen(
            "chatScreen"
          );

        } else {

          contractorShowScreen(
            "chatScreen"
          );

        }

      }
    );

  }


  /* =========================================================
     SUPPORT
  ========================================================= */

  const contractorSupportBtn =
    document.getElementById(
      "contractorSupportBtn"
    );

  if (contractorSupportBtn) {

    contractorSupportBtn.addEventListener(
      "click",
      function () {

        contractorShowScreen(
          "contractorSupportScreen"
        );

      }
    );

  }


  const contractorSupportBackBtn =
    document.getElementById(
      "contractorSupportBackBtn"
    );

  if (contractorSupportBackBtn) {

    contractorSupportBackBtn.addEventListener(
      "click",
      function () {

        contractorShowScreen(
          "contractorHomeScreen"
        );

      }
    );

  }


  const contractorSupportChatBtn =
    document.getElementById(
      "contractorSupportChatBtn"
    );

  if (contractorSupportChatBtn) {

    contractorSupportChatBtn.addEventListener(
      "click",
      function () {

        /*
          نفتح شاشة الشات الموجودة
          حالياً في التطبيق.
        */

        contractorShowScreen(
          "chatScreen"
        );

      }
    );

  }


  /* =========================================================
     CHANGE PASSWORD
  ========================================================= */

  const contractorChangePasswordBtn =
    document.getElementById(
      "contractorChangePasswordBtn"
    );

  if (contractorChangePasswordBtn) {

    contractorChangePasswordBtn.addEventListener(
      "click",
      function () {

        /*
          نستخدم شاشة تغيير كلمة المرور
          الموجودة أصلاً في التطبيق.
        */

        contractorShowScreen(
          "changePasswordScreen"
        );

      }
    );

  }


  /* =========================================================
     LOGOUT
  ========================================================= */

  const contractorHomeLogoutBtn =
    document.getElementById(
      "contractorHomeLogoutBtn"
    );

  if (contractorHomeLogoutBtn) {

    contractorHomeLogoutBtn.addEventListener(
      "click",
      async function () {

        try {

          if (
            window.ma3daAuth &&
            typeof window.ma3daAuth
              .signOut === "function"
          ) {

            await window.ma3daAuth.signOut();

          } else if (
            typeof window.ma3daSignOut ===
            "function"
          ) {

            await window.ma3daSignOut();

          }


          localStorage.removeItem(
            "ma3daRole"
          );

          localStorage.removeItem(
            "userRole"
          );

          localStorage.removeItem(
            "currentRole"
          );

          localStorage.removeItem(
            "contractorCurrentOrderId"
          );

          localStorage.removeItem(
            "contractorCurrentOrder"
          );

          localStorage.removeItem(
            "contractorProfile"
          );


          contractorProfile = null;

          contractorCurrentOrder = null;

          contractorCurrentOrderId = null;


          contractorShowScreen(
            "roleScreen"
          );


        } catch (error) {

          console.error(
            "Contractor logout error:",
            error
          );

          alert(
            "تعذر تسجيل الخروج."
          );

        }

      }
    );

  }


  /* =========================================================
     HTML ESCAPE
  ========================================================= */

  function escapeContractorHtml(
    value
  ) {

    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  /* =========================================================
     CONTRACTOR AUTO OPEN
  ========================================================= */

  async function contractorAutoOpen() {

    const role =
      localStorage.getItem(
        "ma3daRole"
      ) ||
      localStorage.getItem(
        "userRole"
      ) ||
      localStorage.getItem(
        "currentRole"
      );


    if (
      role !== "contractor"
    ) {
      return;
    }


    const user =
      getContractorUser();

    if (!user) {
      return;
    }


    /*
      لا نفتح لوحة المقاول بالقوة
      إذا كان التطبيق يعرض شاشة أخرى
      أثناء تسجيل الدخول.
    */

    const activeScreen =
      document.querySelector(
        ".screen.active"
      );


    if (
      activeScreen &&
      (
        activeScreen.id ===
          "roleScreen" ||
        activeScreen.id ===
          "phoneScreen" ||
        activeScreen.id ===
          "otpScreen"
      )
    ) {

      return;

    }


    const profile =
      await loadContractorProfile();


    if (profile) {

      fillContractorProfile(
        profile
      );

    }

  }


  /* =========================================================
     FIREBASE READY
  ========================================================= */

  if (
    window.ma3daFirebaseReady
  ) {

    Promise.resolve(
      window.ma3daFirebaseReady
    )
      .then(
        () => {

          contractorAutoOpen();

        }
      )
      .catch(
        () => {}
      );

  }


  /* =========================================================
     EXPOSE FUNCTIONS
  ========================================================= */

  window.loadContractorProfile =
    loadContractorProfile;

  window.loadContractorCurrentOrders =
    loadContractorCurrentOrders;

  window.loadContractorPreviousOrders =
    loadContractorPreviousOrders;

  window.loadContractorProjects =
    loadContractorProjects;

  window.openContractorOrderDetails =
    openContractorOrderDetails;


})();
/* =========================================================
   فتح صفحة موظفي الدعم من الصفحة الرئيسية
========================================================= */

document.addEventListener("click", function(event){

  const supportBtn =
    event.target.closest("#supportRoleBtn");

  if(!supportBtn)
    return;

  event.preventDefault();

  openSupportScreen("supportLoginScreen");

});
