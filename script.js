/* قراءة آمنة للمستندات المرتبطة بالمستخدم عبر استعلامات محددة بدل قراءة المجموعة كاملة. */
async function ma3daReadUserRows(collectionName, fields, uid){
  if(!uid || !window.ma3daDB || typeof window.ma3daCollection!=="function" || typeof window.ma3daQuery!=="function" || typeof window.ma3daWhere!=="function" || typeof window.ma3daGetDocs!=="function"){
    throw new Error("أدوات الاستعلام الآمن في Firebase غير جاهزة");
  }
  const collectionRef=window.ma3daCollection(window.ma3daDB,collectionName);
  // نفصل نتائج الاستعلامات: فشل حقل قديم/غير مسموح لا يلغي نتائج الحقول الأخرى.
  const results=await Promise.allSettled([...new Set(fields)].map(field=>
    window.ma3daGetDocs(window.ma3daQuery(collectionRef,window.ma3daWhere(field,"==",uid)))
  ));
  const rowsById=new Map();
  let succeeded=0;
  const failures=[];
  results.forEach((result,index)=>{
    if(result.status!=="fulfilled"){
      failures.push({field:[...new Set(fields)][index],error:result.reason});
      console.warn(`تعذر الاستعلام عن ${collectionName}.${[...new Set(fields)][index]} للمستخدم الحالي:`,result.reason);
      return;
    }
    succeeded++;
    result.value.forEach(docSnap=>rowsById.set(docSnap.id,{id:docSnap.id,...(docSnap.data()||{})}));
  });
  if(!succeeded && failures.length) throw failures[0].error;
  return [...rowsById.values()];
}

/*
============================================================
دليل تنظيم ملف script.js — مِعدة
01 — الصفحات التعريفية: وظائف المقدمة والتنقل التعريفي
02 — تسجيل الدخول والحسابات: اختيار الدور، الدخول، إنشاء الحساب، استعادة كلمة المرور
03 — وظائف العميل: الطلبات، الحساب، الإعدادات، دعم العميل
04 — وظائف صاحب المعدة: المعدات، الطلبات، الدخل، الإعدادات، دعم صاحب المعدة
05 — وظائف المقاول: البيانات، المشاريع، طلبات المعدات، الفواتير والدفعات
06 — وظائف الدعم الفني: حسابات الموظفين، لوحة الشكاوى، الردود وإغلاق الشكاوى
ملاحظة مهمة: العناوين توثيقية فقط؛ لم ننقل أي دالة أو نغيّر ترتيب التنفيذ أو منطق الوظائف.
============================================================
*/
console.log("MA3DA SCRIPT LOADED");

/* 00 — بداية الملف: تهيئة عامة مشتركة للتطبيق */
 
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
 
    const locationParts = String(order.location || "").trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*[,، ]\s*(-?\d+(?:\.\d+)?)\s*$/);
    const requestData = {
 
      location:
        order.location || "",
      locationLatitude: locationParts ? Number(locationParts[1]) : null,
      locationLongitude: locationParts ? Number(locationParts[2]) : null,
      locationCoordinates: locationParts ? { latitude: Number(locationParts[1]), longitude: Number(locationParts[2]) } : null,
 
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
      customerName: (document.getElementById("customerNameInput")?.value || document.getElementById("customerNameSettingsInput")?.value || "").trim(),
 
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
    equipment.textContent = order.equipment || "نوع المعدة";
 
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
 
/* 03 — وظائف العميل: نموذج طلب المعدة وإرسال الطلب */
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
 
/* 03/04 — متابعة قبول الطلب: ربط حالة الطلب بين العميل وصاحب المعدة */
/* ACCEPTANCE WATCHER */
 
function stopAcceptanceWatcher(){
 
  if(acceptanceWatcher){
 
    clearInterval(
      acceptanceWatcher
    );
 
    acceptanceWatcher=null;
 
  }
 
}
 
function ma3daCustomerCoordinates(data){
  const lat=Number(data?.locationLatitude ?? data?.latitude ?? data?.locationCoordinates?.latitude ?? data?.coordinates?.latitude);
  const lng=Number(data?.locationLongitude ?? data?.longitude ?? data?.locationCoordinates?.longitude ?? data?.coordinates?.longitude);
  if(Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180)return {lat,lng};
  const raw=String(data?.location||'');
  const match=raw.match(/(-?\d+(?:\.\d+)?)\s*[,، ]\s*(-?\d+(?:\.\d+)?)/);
  if(!match)return null;
  const parsedLat=Number(match[1]),parsedLng=Number(match[2]);
  return Math.abs(parsedLat)<=90&&Math.abs(parsedLng)<=180?{lat:parsedLat,lng:parsedLng}:null;
}

function ma3daOpenCustomerMap(data){
  const point=ma3daCustomerCoordinates(data||{});
  const location=String(data?.location||'').trim();
  const url=point
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.lat+','+point.lng)}&travelmode=driving`
    : location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : '';
  if(!url){alert('موقع العميل غير محفوظ كإحداثيات أو عنوان. اطلب من العميل تحديد موقعه بدقة.');return;}
  window.open(url,'_blank','noopener,noreferrer');
}

function ma3daNotifyCustomerStatus(requestId,data){
  const status=String(data?.status||'');
  const labels={accepted:'المعدة في الطريق إليك',arrived:'المعدة وصلت إلى موقعك',working:'بدأت المعدة العمل',completed:'انتهى العمل بالمعدة',invoice_pending:'انتهى العمل بالمعدة — يمكنك السداد الآن',invoice_issued:'صدرت فاتورة السداد لطلبك',payment_submitted:'تم تسجيل السداد وبانتظار التأكيد',paid:'تم تأكيد السداد',rejected:'تم رفض طلب المعدة'};
  const paymentStatus=String(data?.paymentStatus||'');
  const invoiceLabel=labels[status] || (paymentStatus==='paid'?'تم تأكيد السداد':paymentStatus==='payment_submitted'?'تم تسجيل السداد وبانتظار التأكيد':'');
  const token=`${requestId}:${status}:${paymentStatus}:${data?.invoiceNumber||''}`;
  const previous=localStorage.getItem('ma3daLastCustomerNotice:'+requestId);
  if(!invoiceLabel||previous===token)return;
  localStorage.setItem('ma3daLastCustomerNotice:'+requestId,token);
  const wasInitialized=localStorage.getItem('ma3daCustomerNoticeInitialized:'+requestId)==='1';
  localStorage.setItem('ma3daCustomerNoticeInitialized:'+requestId,'1');
  if(!wasInitialized)return;
  // Browser notifications work only while this page is active; closed-app push requires FCM/service-worker setup.
  if(document.visibilityState==='visible'){
    const toast=document.createElement('div');
    toast.setAttribute('role','status');
    toast.style.cssText='position:fixed;z-index:99999;bottom:18px;left:16px;right:16px;padding:14px 16px;background:#171717;color:#fff;border-radius:12px;box-shadow:0 6px 24px #0003;text-align:center;font-weight:700';
    toast.textContent=invoiceLabel+(data?.invoiceNumber?' — فاتورتك متاحة في «فواتيري»':'');
    document.body.appendChild(toast);setTimeout(()=>toast.remove(),6000);
  }
  if('Notification' in window&&Notification.permission==='granted'&&document.visibilityState!=='visible'){
    try{new Notification('مِعدة — تحديث طلبك',{body:invoiceLabel+(data?.invoiceNumber?' يمكنك مراجعة الفاتورة من «فواتيري».':''),tag:token});}catch(_){ }
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
 
          const data = snapshot.data();
          ma3daNotifyCustomerStatus(requestId,data);
 
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
                  data.operatorName || data.equipmentOwnerName || data.ownerName || "صاحب المعدة",
 
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
            const matchedOperatorName=document.getElementById('matchedOperatorName');
            const matchedOperatorType=document.getElementById('matchedOperatorType');
            let actualOwnerName=data.operatorName||data.equipmentOwnerName||data.ownerName||'';
            const ownerId=data.operatorId||data.equipmentOwnerId||data.ownerId||'';
            if(!actualOwnerName && ownerId && window.ma3daDB && window.ma3daDoc && window.ma3daGetDoc){
              try{const ownerSnap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'operators',ownerId));if(ownerSnap.exists()){const ownerProfile=ownerSnap.data()||{};actualOwnerName=ownerProfile.name||ownerProfile.fullName||ownerProfile.displayName||'';}}catch(ownerLookupError){console.warn('تعذر تحميل اسم صاحب المعدة:',ownerLookupError);}
            }
            if(matchedOperatorName)matchedOperatorName.textContent=actualOwnerName||'اسم صاحب المعدة المسجل';
            if(matchedOperatorType)matchedOperatorType.textContent=data.equipment||data.operatorEquipment||'نوع المعدة';
            const matchedRequestNotes=document.getElementById('matchedRequestNotes');
            if(matchedRequestNotes)matchedRequestNotes.textContent=String(data.notes||data.requestDetails||data.details||data.description||'لم يضف العميل تفاصيل إضافية للطلب.');
            const matchedLocation=document.getElementById('matchedLocation');
            if(matchedLocation)matchedLocation.textContent=String(data.location||data.workLocation||'موقع العمل المحدد في الطلب');
            window.ma3daActiveCustomerRequestData=data;
 
            updateWorkingScreen();
 
            const activeScreen=document.querySelector('.screen.active')?.id||'';
            if(activeScreen==='searchingScreen') showScreen('matchedScreen');
 
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
 
            if(['searchingScreen','matchedScreen','trackingScreen','arrivedCustomerScreen'].includes(document.querySelector('.screen.active')?.id||'')){
              showScreen("arrivedCustomerScreen");
            }
 
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
 
            if(['searchingScreen','matchedScreen','trackingScreen','arrivedCustomerScreen','workingScreen'].includes(document.querySelector('.screen.active')?.id||'')){
              showScreen("workingScreen");
            }
 
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
/* COMPLETED / PAYMENT REQUIRED */
if(
  data.status === "completed" ||
  data.status === "invoice_pending"
){
  clearInterval(timerInterval);
  setOrderState(data.status);

  if(data.status === "invoice_pending"){
    // انتهاء العمل يجب أن يظهر للعميل شاشة السداد مباشرة.
    const amount = document.getElementById("bookingPaymentAmount");
    if(amount){
      amount.textContent = "المبلغ المستحق: " +
        Number(data.finalPrice || data.price || 0).toLocaleString("ar-SA", {
          style: "currency",
          currency: "SAR"
        });
    }
    if(document.getElementById("paymentScreen")){
      showScreen("paymentScreen");
    }else{
      console.error("شاشة paymentScreen غير موجودة في index.html");
    }
  }else{
    const activeScreen = document.querySelector('.screen.active')?.id || '';
    if(['searchingScreen','matchedScreen','trackingScreen','arrivedCustomerScreen','workingScreen','completedScreen'].includes(activeScreen)){
      showScreen("completedScreen");
    }
  }
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
/* 02 — تسجيل الدخول والحسابات: اختيار نوع المستخدم */
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
 
/* 02 — تسجيل الدخول والحسابات: تسجيل الدخول بالبريد وكلمة المرور */
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
 
   if (selectedRole === "customer") {
  try {
    await Promise.resolve(window.ma3daFirebaseReady);
    const currentUser = window.ma3daAuth?.currentUser || user;
    if (!currentUser || !window.ma3daDB || !window.ma3daDoc || !window.ma3daGetDoc) {
      throw new Error("تعذر التحقق من حساب العميل الحالي");
    }
    const customerRef = window.ma3daDoc(window.ma3daDB, "customers", currentUser.uid);
    const customerSnapshot = await window.ma3daGetDoc(customerRef);
    if (customerSnapshot.exists()) {
      const data = customerSnapshot.data() || {};
      const nameInput = document.getElementById("customerNameInput");
      const phoneInput = document.getElementById("customerPhoneInput");
      const cityInput = document.getElementById("customerCityInput");
      if (nameInput) nameInput.value = data.name || "";
      if (phoneInput) phoneInput.value = data.phone || "";
      if (cityInput) cityInput.value = data.city || "";
      showScreen("customerHomeScreen");
    } else {
      showScreen("customerDataScreen");
    }
  } catch (customerRouteError) {
    // Authentication already succeeded. Do not strand the customer on the
    // login screen just because reading an optional profile failed.
    console.warn("Customer profile lookup failed after successful login:", customerRouteError);
    showScreen("customerDataScreen");
  }
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
 
/* 02 — تسجيل الدخول والحسابات: إنشاء حساب جديد والتحقق */
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
 
/* 04 — وظائف صاحب المعدة: فتح لوحة صاحب المعدة */
/* OPERATOR */
 
async function openOperatorScreen(){
 
  await displayMyEquipment();
 
  updateOperatorScreen();
 
  showScreen(
    "operatorScreen"
  );
 
}
/* 04 — وظائف صاحب المعدة: تحميل طلبات العملاء */
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
 
/* موقع العميل: الضغط على الموقع يفتح خرائط الهاتف بإحداثياته */
const operatorOpenCustomerMapBtn=document.getElementById('operatorOpenCustomerMapBtn');
if(operatorOpenCustomerMapBtn){
  operatorOpenCustomerMapBtn.addEventListener('click',async()=>{
    try{
      const requestId=localStorage.getItem('currentRequestId');
      if(!requestId) throw new Error('لا يوجد طلب حالي.');
      const snap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'requests',requestId));
      if(!snap.exists()) throw new Error('الطلب غير موجود.');
      const data=snap.data()||{};
      window.ma3daActiveRequestData=data;
      ma3daOpenCustomerMap(data);
    }catch(error){console.error('تعذر فتح موقع العميل:',error);alert(error.message||'تعذر فتح موقع العميل.');}
  });
}
const acceptedCustomerLocationElement=document.getElementById('acceptedCustomerLocation');
if(acceptedCustomerLocationElement){
  acceptedCustomerLocationElement.style.cursor='pointer';
  acceptedCustomerLocationElement.title='اضغط لفتح موقع العميل في الخرائط';
  acceptedCustomerLocationElement.addEventListener('click',async()=>{
    try{
      const requestId=localStorage.getItem('currentRequestId');
      if(!requestId)throw new Error('لا يوجد طلب حالي.');
      const snap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'requests',requestId));
      if(!snap.exists())throw new Error('الطلب غير موجود.');
      ma3daOpenCustomerMap(snap.data()||{});
    }catch(error){alert(error.message||'تعذر فتح موقع العميل.');}
  });
}

/* زر مخصص لفتح موقع العميل في Google Maps لصاحب المعدة */
const openAcceptedCustomerMapBtn=document.getElementById('openAcceptedCustomerMapBtn');
if(openAcceptedCustomerMapBtn){
  openAcceptedCustomerMapBtn.addEventListener('click',async()=>{
    openAcceptedCustomerMapBtn.disabled=true;
    try{
      const requestId=localStorage.getItem('currentRequestId');
      if(!requestId)throw new Error('لا يوجد طلب حالي.');
      if(window.ma3daFirebaseReady)await window.ma3daFirebaseReady;
      const snap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'requests',requestId));
      if(!snap.exists())throw new Error('الطلب غير موجود.');
      ma3daOpenCustomerMap(snap.data()||{});
    }catch(error){
      console.error('تعذر فتح موقع العميل في Google Maps:',error);
      alert(error.message||'تعذر فتح موقع العميل.');
    }finally{
      openAcceptedCustomerMapBtn.disabled=false;
    }
  });
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
          requestSnap.data() || {};
        let acceptedOwnerName = window.ma3daCurrentOperatorProfile?.name || "";
        try {
          const currentOwner = window.ma3daGetCurrentUser ? await window.ma3daGetCurrentUser() : window.ma3daAuth?.currentUser;
          if (!acceptedOwnerName && currentOwner?.uid) {
            const ownerProfileSnap = await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB, "operators", currentOwner.uid));
            if (ownerProfileSnap.exists()) { const profile = ownerProfileSnap.data() || {}; acceptedOwnerName = profile.name || profile.fullName || profile.displayName || ""; }
          }
        } catch (profileError) { console.warn("تعذر تحميل الاسم الحقيقي لصاحب المعدة:", profileError); }
 
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
            operatorName: acceptedOwnerName || requestData.operatorName || requestData.equipmentOwnerName || requestData.ownerName || "صاحب المعدة",
            operatorRating: "5"
          }
        );
 
        localStorage.setItem(
          "acceptedOrder",
          JSON.stringify({
 
            ...order,
 
            operatorName:
              acceptedOwnerName || requestData.operatorName || requestData.equipmentOwnerName || requestData.ownerName || "صاحب المعدة",
 
            operatorRating:
              "5"
 
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
 
        await loadOperatorCurrentOrder();
        showScreen("operatorCurrentOrderScreen");
 
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
 
/* 04 — وظائف صاحب المعدة: حفظ بيانات المعدات والتحقق منها */
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
    locationAddress: city,
 
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
  trackingBtn.addEventListener("click",async()=>{
    const requestId=localStorage.getItem('currentRequestId');
    if(!requestId){alert('لا يوجد طلب حالي.');return;}
    try{
      const snap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'requests',requestId));
      if(!snap.exists()){alert('تعذر العثور على الطلب.');return;}
      const data=snap.data()||{};
      const destination=ma3daCustomerCoordinates(data);
      if(!destination){alert('لا يمكن إنشاء مسار دقيق لأن موقع العمل غير محفوظ بإحداثيات العميل. حدّد الموقع بدقة في الطلب أولًا.');return;}
      let origin=null;
      // استخدم موقع الجهاز الحالي الحقيقي عند السماح به، وإلا فالموقع المسجل لصاحب المعدة.
      if(navigator.geolocation){
        try{origin=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude}),reject,{enableHighAccuracy:true,timeout:8000,maximumAge:30000}));}catch(_){origin=null;}
      }
      let ownerEquipment={};
      const ownerId=data.equipmentOwnerId||data.ownerId||data.operatorId||'';
      if(ownerId){try{const equipmentSnap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'equipment',ownerId));if(equipmentSnap.exists())ownerEquipment=equipmentSnap.data()||{};}catch(e){console.warn('تعذر قراءة موقع المعدة المسجل:',e);}}
      if(!origin){
        const lat=Number(data.equipmentLocationLatitude??data.ownerLocationLatitude??data.equipmentLatitude??data.equipmentCoordinates?.latitude??data.ownerEquipmentLocation?.latitude??ownerEquipment.latitude??ownerEquipment.lat??ownerEquipment.locationLatitude??ownerEquipment.coordinates?.latitude);
        const lng=Number(data.equipmentLocationLongitude??data.ownerLocationLongitude??data.equipmentLongitude??data.equipmentCoordinates?.longitude??data.ownerEquipmentLocation?.longitude??ownerEquipment.longitude??ownerEquipment.lng??ownerEquipment.locationLongitude??ownerEquipment.coordinates?.longitude);
        if(Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180&&(lat!==0||lng!==0))origin={lat,lng};
      }
      const originAddress=String(data.equipmentLocationAddress??data.ownerEquipmentAddress??data.equipmentAddress??data.ownerEquipmentLocation?.address??ownerEquipment.address??ownerEquipment.locationAddress??'').trim();
      const url=origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin.lat+','+origin.lng)}&destination=${encodeURIComponent(destination.lat+','+destination.lng)}&travelmode=driving`
        : originAddress
          ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(destination.lat+','+destination.lng)}&travelmode=driving`
          : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination.lat+','+destination.lng)}&travelmode=driving`;
      const status=document.getElementById('trackingStatus');
      const distance=document.getElementById('distanceText');
      const eta=document.getElementById('etaText');
      if(status)status.textContent=origin?'المسار من موقع المعدة الحالي إلى موقع العمل':'المسار إلى موقع العمل؛ لم يتوفر موقع حالي لصاحب المعدة';
      if(distance)distance.textContent=`موقع العمل: ${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`;
      if(eta)eta.textContent=origin?'الموقع الحالي عبر GPS':'الموقع المسجل أو الوجهة فقط';
      showScreen('trackingScreen');
      window.open(url,'_blank','noopener,noreferrer');
    }catch(error){console.error('تعذر تحميل مسار المعدة:',error);alert('تعذر تحميل المسار حاليًا.');}
  });
}
 
/* وظائف المحادثة المشتركة: العميل وصاحب المعدة — أبقيناها مشتركة لتجنب كسر الربط */
/* CHAT: CUSTOMER + EQUIPMENT OWNER */
let chatMessagesUnsubscribe = null;
// Keep the existing order-chat wiring; only make sender/receiver bubbles visually distinct.
(function ensureMa3daChatBubbleColors(){
  if(document.getElementById("ma3daChatBubbleColors")) return;
  const style=document.createElement("style");
  style.id="ma3daChatBubbleColors";
  style.textContent=`
    #chatMessages{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:4px!important;padding:12px!important;box-sizing:border-box!important}
    #chatMessages .message{display:block!important;box-sizing:border-box!important;flex:0 0 auto!important;width:fit-content!important;max-width:82%!important;padding:10px 14px!important;margin-top:6px!important;margin-bottom:6px!important;border-radius:16px!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;line-height:1.55!important;clear:none!important}
    #chatMessages .message.sent{align-self:flex-end!important;margin-left:18%!important;margin-right:0!important;background:#d9fdd3!important;color:#173b23!important;border:1px solid #b9e7b0!important;border-bottom-right-radius:5px!important;text-align:right!important}
    #chatMessages .message.received{align-self:flex-start!important;margin-right:18%!important;margin-left:0!important;background:#ffffff!important;color:#263238!important;border:1px solid #e1e5e8!important;border-bottom-left-radius:5px!important;text-align:right!important}
  `;
  document.head.appendChild(style);
})();
let chatSending = false;
 
function getMa3daActiveRole(){
  const savedRole = localStorage.getItem("selectedRole") || "";
  if (savedRole) selectedRole = savedRole;
  return selectedRole;
}
 
let ma3daChatReturnScreen='';
function openMa3daChat(){
  getMa3daActiveRole();
  const active=document.querySelector('.screen.active')?.id||'';
  ma3daChatReturnScreen=active==='chatScreen'?'':active;
  if(!ma3daChatReturnScreen)ma3daChatReturnScreen=getMa3daActiveRole()==='customer'?'matchedScreen':'operatorCurrentOrderScreen';
  showScreen("chatScreen");
  startChatListener();
  setTimeout(() => document.getElementById("chatInput")?.focus(), 100);
}
 
const chatBtn = document.getElementById("chatBtn");
if (chatBtn) chatBtn.addEventListener("click", openMa3daChat);
 
const operatorChatCustomerBtn = document.getElementById("operatorChatCustomerBtn");
if (operatorChatCustomerBtn) operatorChatCustomerBtn.addEventListener("click", openMa3daChat);
const operatorChatBtn = document.getElementById("operatorChatBtn");
if (operatorChatBtn) operatorChatBtn.addEventListener("click", openMa3daChat);
const backFromChatBtn = document.getElementById("backFromChatBtn");
if(backFromChatBtn)backFromChatBtn.addEventListener('click',()=>{
  if(chatMessagesUnsubscribe){chatMessagesUnsubscribe();chatMessagesUnsubscribe=null;}
  const role=getMa3daActiveRole();
  let target=ma3daChatReturnScreen;
  if(!target||target==='chatScreen')target=role==='customer'?'currentOrdersScreen':'operatorCurrentOrderScreen';
  if(!document.getElementById(target))target=role==='customer'?'customerHomeScreen':'operatorHomeScreen';
  showScreen(target);
  if(role==='customer'&&target==='currentOrdersScreen')loadCustomerOrders('current');
  if(role!=='customer'&&target==='operatorCurrentOrderScreen'&&typeof loadOperatorCurrentOrder==='function')loadOperatorCurrentOrder();
});
 
async function sendChatMessage(){
  if (chatSending) return;
 
  const input = document.getElementById("chatInput");
  if (!input) return;
 
  const messageText = input.value.trim();
  if (!messageText) return;
 
  chatSending = true;
  const sendButton = document.getElementById("sendChatBtn");
  if (sendButton) sendButton.disabled = true;
 
  try {
    if (window.ma3daFirebaseReady) await window.ma3daFirebaseReady;
 
    const user = window.ma3daGetCurrentUser
      ? await window.ma3daGetCurrentUser()
      : window.ma3daAuth?.currentUser;
 
    if (!user) {
      alert("يجب تسجيل الدخول لإرسال الرسائل.");
      return;
    }
 
    if (!window.ma3daDB || typeof window.ma3daCollection !== "function" || typeof window.ma3daAddDoc !== "function") {
      throw new Error("أدوات Firestore اللازمة لإرسال الرسالة غير جاهزة.");
    }
 
    const requestId = localStorage.getItem("currentRequestId");
    if (!requestId) {
      alert("لا يوجد طلب مرتبط بهذه المحادثة. افتح الطلب الحالي أولاً.");
      return;
    }
 
    const role = getMa3daActiveRole();
    const messagesCollection = window.ma3daCollection(
      window.ma3daDB, "requests", requestId, "messages"
    );
 
    await window.ma3daAddDoc(messagesCollection, {
      text: messageText,
      senderId: user.uid,
      senderRole: role,
      createdAt: Date.now(),
      createdAtServer: new Date()
    });
 
    input.value = "";
    input.focus();
  } catch (error) {
    console.error("تعذر إرسال الرسالة:", error);
    alert("تعذر إرسال الرسالة إلى Firebase.\n" + (error?.code || "") + "\n" + (error?.message || "يرجى المحاولة مرة أخرى."));
  } finally {
    chatSending = false;
    if (sendButton) sendButton.disabled = false;
  }
}
 
function startChatListener(){
  if (chatMessagesUnsubscribe) {
    chatMessagesUnsubscribe();
    chatMessagesUnsubscribe = null;
  }
 
  const requestId = localStorage.getItem("currentRequestId");
  if (!requestId) {
    console.warn("لا يوجد طلب مرتبط بالمحادثة حالياً.");
    return;
  }
 
  if (!window.ma3daDB || typeof window.ma3daCollection !== "function" ||
      typeof window.ma3daOnSnapshot !== "function" ||
      typeof window.ma3daQuery !== "function" ||
      typeof window.ma3daOrderBy !== "function") {
    console.error("أدوات الشات في Firebase غير جاهزة.");
    return;
  }
 
  const messagesCollection = window.ma3daCollection(
    window.ma3daDB, "requests", requestId, "messages"
  );
  const messagesQuery = window.ma3daQuery(
    messagesCollection, window.ma3daOrderBy("createdAt", "asc")
  );
 
  // Resolve the authenticated user before classifying messages, so a late Firebase auth
  // initialization does not incorrectly put every message on the same side.
  const resolveCurrentUid = async () => {
    try {
      if (window.ma3daFirebaseReady) await window.ma3daFirebaseReady;
      const user = window.ma3daGetCurrentUser
        ? await window.ma3daGetCurrentUser()
        : window.ma3daAuth?.currentUser;
      return user?.uid || window.ma3daAuth?.currentUser?.uid || "";
    } catch (error) {
      console.warn("تعذر تحديد المستخدم الحالي للشات:", error);
      return window.ma3daAuth?.currentUser?.uid || "";
    }
  };
  let chatCurrentUid = "";
  void resolveCurrentUid().then(uid => { chatCurrentUid = uid; });

  chatMessagesUnsubscribe = window.ma3daOnSnapshot(messagesQuery, snapshot => {
    const container = document.getElementById("chatMessages");
    if (!container) return;
 
    const role = getMa3daActiveRole();
    const currentUid = chatCurrentUid || window.ma3daAuth?.currentUser?.uid || "";
    container.replaceChildren();
    snapshot.forEach(messageDoc => {
      const data = messageDoc.data();
      const bubble = document.createElement("div");
      const senderId = data.senderId || data.uid || data.userId || "";
      const senderRole = String(data.senderRole || data.role || "").toLowerCase();
      // Use UID when both sides have one; legacy messages fall back to role.
      const isOwnMessage = senderId && currentUid
        ? String(senderId) === String(currentUid)
        : (senderRole ? senderRole === String(role || "").toLowerCase() : false);
      bubble.className = isOwnMessage ? "message sent" : "message received";
      // Set the bubble colors inline as well as in CSS so another stylesheet cannot
      // accidentally make both sides green. Keep the existing sender-side logic.
      bubble.style.setProperty("display", "block", "important");
      bubble.style.setProperty("width", "fit-content", "important");
      bubble.style.setProperty("max-width", "82%", "important");
      bubble.style.setProperty("padding", "10px 14px", "important");
      bubble.style.setProperty("margin-top", "6px", "important");
      bubble.style.setProperty("margin-bottom", "6px", "important");
      bubble.style.setProperty("border-radius", "16px", "important");
      bubble.style.setProperty("white-space", "pre-wrap", "important");
      bubble.style.setProperty("overflow-wrap", "anywhere", "important");
      bubble.style.setProperty("box-sizing", "border-box", "important");
      bubble.style.setProperty("text-align", "right", "important");
      if (isOwnMessage) {
        bubble.style.setProperty("align-self", "flex-end", "important");
        bubble.style.setProperty("margin-left", "18%", "important");
        bubble.style.setProperty("margin-right", "0", "important");
        bubble.style.setProperty("background-color", "#d9fdd3", "important");
        bubble.style.setProperty("background", "#d9fdd3", "important");
        bubble.style.setProperty("color", "#173b23", "important");
        bubble.style.setProperty("border", "1px solid #b9e7b0", "important");
        bubble.style.setProperty("border-bottom-right-radius", "5px", "important");
      } else {
        bubble.style.setProperty("align-self", "flex-start", "important");
        bubble.style.setProperty("margin-right", "18%", "important");
        bubble.style.setProperty("margin-left", "0", "important");
        bubble.style.setProperty("background-color", "#ffffff", "important");
        bubble.style.setProperty("background", "#ffffff", "important");
        bubble.style.setProperty("color", "#263238", "important");
        bubble.style.setProperty("border", "1px solid #e1e5e8", "important");
        bubble.style.setProperty("border-bottom-left-radius", "5px", "important");
      }
      bubble.textContent = data.text || data.message || "";
      container.appendChild(bubble);
    });
    container.scrollTop = container.scrollHeight;
  }, error => {
    console.error("تعذر استقبال رسائل الشات:", error);
    alert("تعذر تحميل رسائل المحادثة. تحقق من اتصال Firebase وصلاحيات Firestore.");
  });
}
 
/* Send button: delegated listener supports buttons rendered later. */
document.addEventListener("click", event => {
  const button = event.target.closest("#sendChatBtn");
  if (!button) return;
  event.preventDefault();
  void sendChatMessage();
});
 
document.addEventListener("keydown", event => {
  if (event.key !== "Enter" || event.shiftKey) return;
  if (!event.target.closest("#chatInput")) return;
  event.preventDefault();
  void sendChatMessage();
});
 
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
 
/* 03/04 — وظائف مالية مشتركة: الدفع وإغلاق الطلب */
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
 
      showScreen(
        "paymentScreen"
      );
 
    }
  );
 
}
 
const startBookingPaymentBtn=document.getElementById('startBookingPaymentBtn');
if(startBookingPaymentBtn){
  startBookingPaymentBtn.addEventListener('click',async()=>{
    const feedback=document.getElementById('bookingPaymentFeedback');
    const requestId=localStorage.getItem('currentRequestId');
    if(!requestId){if(feedback)feedback.textContent='تعذر تحديد الطلب الحالي. افتح الطلب من جديد.';return;}
    if(typeof window.ma3daStartBookingPayment!=='function'){
      if(feedback)feedback.textContent='بوابة الدفع الإلكتروني غير مربوطة بالمشروع بعد. لم يتم خصم أي مبلغ ولم يُسجّل السداد.';
      return;
    }
    startBookingPaymentBtn.disabled=true;
    try{
      await window.ma3daStartBookingPayment({requestId});
    }catch(error){
      console.error('تعذر بدء السداد الإلكتروني:',error);
      if(feedback)feedback.textContent=error?.message||'تعذر بدء عملية السداد. لم يتم تأكيد الدفع.';
    }finally{startBookingPaymentBtn.disabled=false;}
  });
}

const confirmPaymentBtn =
  document.getElementById("confirmPaymentBtn");
 
if(confirmPaymentBtn){
  confirmPaymentBtn.addEventListener("click", async ()=>{
    // لا يسمح زر السداد بتجاوز الفاتورة إلى التقييم.
    if(window.ma3daOpenCustomerFinance){ window.ma3daOpenCustomerFinance(); return; }
    alert('افتح «فواتيري والمدفوعات» للتحقق من الفاتورة والسداد قبل التقييم.');
  });
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
 
          const requestSnapshot = await window.ma3daGetDoc(requestRef);
          if(!requestSnapshot.exists()){
            alert("تعذر العثور على الطلب.");
            return;
          }
          const requestData = requestSnapshot.data() || {};
          if(requestData.paymentStatus !== "paid" || requestData.status !== "paid"){
            alert("تقييم المعدة متاح بعد تأكيد سداد الفاتورة بالكامل.");
            return;
          }

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
 
/* أزرار الرجوع للقائمة الرئيسية بعد التقييم أو إنهاء العمل */
const thankYouHomeBtn=document.getElementById("thankYouHomeBtn");
if(thankYouHomeBtn){
  thankYouHomeBtn.addEventListener("click",()=>{
    showScreen("customerHomeScreen");
  });
}
const operatorCompletedHomeBtn=document.getElementById("operatorCompletedHomeBtn");
if(operatorCompletedHomeBtn){
  operatorCompletedHomeBtn.addEventListener("click",async()=>{
    try{
      if(typeof loadOperatorHome==="function") await loadOperatorHome();
    }catch(error){
      console.error("تعذر تحديث الصفحة الرئيسية لصاحب المعدة:",error);
    }
    showScreen("operatorHomeScreen");
  });
}

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
 
/* 01 — الصفحات التعريفية: مقدمة مِعدة والتنقل بين الشرائح */
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
 
/* 03 — وظائف العميل: بيانات الحساب */
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
 
/* 03 — وظائف العميل: الصفحة الرئيسية وطلبات العميل */
/* CUSTOMER HOME */
if(document.getElementById('currentOrderBtn')){
  const customerOrdersStartup=()=>{if((localStorage.getItem('selectedRole')||selectedRole)==='customer')startCustomerOrdersRealtime();};
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')customerOrdersStartup();});
}
 
const currentOrderBtn =
  document.getElementById("currentOrderBtn");
 
if(currentOrderBtn){
 
  currentOrderBtn.addEventListener(
    "click",
    async()=>{
 
      showScreen(
        "currentOrdersScreen"
      );
 
      await loadCustomerOrders("current");
      startCustomerOrdersRealtime();
 
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
 
      await loadCustomerOrders("previous");
      startCustomerOrdersRealtime();
 
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
 
    const customerRequestRows = await ma3daReadUserRows("requests", ["customerId", "requesterId"], user.uid);
 
    const currentStatuses = [
      "searching", "accepted", "arrived", "working", "in_progress",
      "duration_expired", "invoice_pending", "invoice_issued", "payment_pending",
      "payment_submitted", "paid"
    ];
 
    const previousStatuses = ["rejected", "cancelled"];
 
    const wantedStatuses =
      type === "current"
        ? currentStatuses
        : previousStatuses;
 
    const orders = [];
 
    customerRequestRows.forEach(
      data=>{
 
        const docSnapshot = { id: data.id };
 
        const financiallyOpen=Number(data.remainingBalance??data.invoiceAmount??data.price??0)>0 || !['paid','settled'].includes(String(data.paymentStatus||data.settlementStatus||''));
        const belongsInCurrent=type==='current'&&(currentStatuses.includes(String(data.status||''))||(data.status==='completed'&&financiallyOpen));
        const belongsInPrevious=type==='previous'&&(previousStatuses.includes(String(data.status||''))||(data.status==='completed'&&!financiallyOpen));
        if(data.customerId===user.uid&&(belongsInCurrent||belongsInPrevious)){
 
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
          <button type="button" class="main-btn" data-customer-open-order="${customerOrder.id}">فتح الطلب ومتابعته</button>
 
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
 
/* فتح الطلب من قائمة الطلبات الحالية/السابقة */
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-customer-open-order]');
  if(!button)return;
  const requestId=button.dataset.customerOpenOrder;
  if(!requestId)return;
  localStorage.setItem('currentRequestId',requestId);
  try{
    const snap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'requests',requestId));
    if(!snap.exists()){alert('تعذر العثور على الطلب.');return;}
    const data=snap.data()||{};
    order={location:data.location||'',equipment:data.equipment||'',duration:data.duration||'',operator:data.operator||'',notes:data.notes||'',price:Number(data.price||0)};
    localStorage.setItem('currentOrder',JSON.stringify(order));
    if(typeof startAcceptanceWatcher==='function')startAcceptanceWatcher();
    const screenByStatus={searching:'searchingScreen',accepted:'matchedScreen',arrived:'arrivedCustomerScreen',working:'workingScreen',completed:'completedScreen',invoice_pending:'paymentScreen',invoice_issued:'paymentScreen',payment_pending:'paymentScreen',payment_submitted:'paymentScreen',paid:'ratingScreen'};
    const target=screenByStatus[String(data.status||'')]||'matchedScreen';
    if(target==='paymentScreen'){
      const amount=document.getElementById('bookingPaymentAmount');
      if(amount)amount.textContent='المبلغ المستحق: '+(Number(data.finalPrice||data.price||0).toLocaleString('ar-SA',{style:'currency',currency:'SAR'}));
    }
    if(target==='arrivedCustomerScreen'){
      const e=document.getElementById('arrivedCustomerEquipment');if(e)e.textContent=data.equipment||'المعدة';
      const l=document.getElementById('arrivedCustomerLocation');if(l)l.textContent=data.location||'موقعك';
    }
    if(target==='matchedScreen'){updateMatchedScreen();updateWorkingScreen();}
    if(target==='workingScreen'){updateWorkingScreen();}
    showScreen(target);
  }catch(error){console.error('تعذر فتح طلب العميل:',error);alert('تعذر تحميل تفاصيل الطلب. تحقق من الاتصال.');}
});

/* 03 — وظائف العميل: تحديث الطلبات الحالية آليًا من Firebase */
let customerOrdersRealtimeUnsubscribe=null;
let customerOrdersRealtimeUserId='';
async function startCustomerOrdersRealtime(){
  try{
    const user=window.ma3daGetCurrentUser?await window.ma3daGetCurrentUser():window.ma3daAuth?.currentUser;
    if(!user?.uid||!window.ma3daDB||typeof window.ma3daCollection!=='function'||typeof window.ma3daOnSnapshot!=='function')return;
    if(customerOrdersRealtimeUnsubscribe&&customerOrdersRealtimeUserId===user.uid)return;
    if(customerOrdersRealtimeUnsubscribe){customerOrdersRealtimeUnsubscribe();customerOrdersRealtimeUnsubscribe=null;}
    customerOrdersRealtimeUserId=user.uid;
    customerOrdersRealtimeUnsubscribe=window.ma3daOnSnapshot(window.ma3daCollection(window.ma3daDB,'requests'),snapshot=>{
      const currentActive=document.getElementById('currentOrdersScreen')?.classList.contains('active');
      const previousActive=document.getElementById('previousOrdersScreen')?.classList.contains('active');
      let currentChanged=false,previousChanged=false;
      snapshot.forEach(doc=>{
        const data=doc.data()||{};
        if(data.customerId!==user.uid)return;
        const id=doc.id;
        ma3daNotifyCustomerStatus(id,data);
        if(id===localStorage.getItem('currentRequestId')){
          localStorage.setItem('currentOrder',JSON.stringify({location:data.location||'',equipment:data.equipment||'',duration:data.duration||'',operator:data.operator||'',notes:data.notes||'',price:Number(data.price||0)}));
        }
        if(['rejected','cancelled'].includes(String(data.status||''))||(data.status==='completed'&&Number(data.remainingBalance??data.invoiceAmount??data.price??0)<=0&&(data.paymentStatus==='paid'||data.settlementStatus==='settled')))previousChanged=true;
        else currentChanged=true;
      });
      if(currentActive&&currentChanged)loadCustomerOrders('current');
      if(previousActive&&previousChanged)loadCustomerOrders('previous');
    },error=>console.error('Customer orders realtime listener failed:',error));
  }catch(error){console.warn('تعذر تفعيل تحديث طلبات العميل المباشر:',error);}
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
 
/* 03 — وظائف العميل: الإعدادات */
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
 
/* 03-A — وظائف العميل: الدعم الفني الخاص بالعميل */
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
 
/* 04 — وظائف صاحب المعدة: البيانات الشخصية */
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
 
        if(window.ma3daFirebaseReady)
          await window.ma3daFirebaseReady;
 
        if(!window.ma3daDB || typeof window.ma3daDoc !== "function" || typeof window.ma3daSetDoc !== "function"){
          throw new Error("خدمات Firebase لحفظ بيانات صاحب المعدة غير جاهزة.");
        }
 
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
 
        localStorage.setItem("operatorProfile", JSON.stringify({ name, phone, city, email: user.email || "", operatorId: user.uid }));
 
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
 
/* 04 — وظائف صاحب المعدة: الصفحة الرئيسية */
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
  const user=await getOperatorCurrentUser();
  if(!user?.uid) return null;

  // لا نفترض أن معرّف وثيقة المعدة يساوي UID؛ قد تكون الوثيقة ذات معرّف تلقائي.
  const rows=await ma3daReadUserRows("equipment",["ownerId","operatorId","userId"],user.uid);
  if(rows.length){
    rows.sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0));
    return rows[0];
  }

  // توافق مع السجل القديم equipment/{uid} إذا كانت قواعد القراءة تسمح به.
  try{
    const ref=window.ma3daDoc(window.ma3daDB,"equipment",user.uid);
    const snap=await window.ma3daGetDoc(ref);
    if(snap.exists()){
      const data=snap.data()||{};
      if(data.ownerId===user.uid||data.operatorId===user.uid||data.userId===user.uid) return {id:snap.id,...data};
    }
  }catch(error){console.warn("تعذر قراءة سجل المعدة القديم؛ تم فحص سجلات المالك أولًا.",error);}
  return null;
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
    const operatorUser =
      await getOperatorCurrentUser();
 
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
 
/* 04 — وظائف صاحب المعدة: لوحة التحكم والطلبات الحالية */
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
 
/* OPERATOR NEW REQUESTS: CUSTOMER + PROJECT REQUESTS */
let operatorRequestTab = "customers";

function setOperatorRequestTab(tab){
  operatorRequestTab = tab === "projects" ? "projects" : "customers";
  const customerTab = document.getElementById("operatorCustomerRequestsTab");
  const projectTab = document.getElementById("operatorProjectRequestsTab");
  const customerPanel = document.getElementById("operatorCustomerRequestsPanel");
  const projectPanel = document.getElementById("operatorProjectRequestsPanel");
  if(customerTab){customerTab.classList.toggle("is-active",operatorRequestTab === "customers");customerTab.setAttribute("aria-selected",String(operatorRequestTab === "customers"));}
  if(projectTab){projectTab.classList.toggle("is-active",operatorRequestTab === "projects");projectTab.setAttribute("aria-selected",String(operatorRequestTab === "projects"));}
  if(customerPanel) customerPanel.hidden = operatorRequestTab !== "customers";
  if(projectPanel) projectPanel.hidden = operatorRequestTab !== "projects";
}

function operatorRequestDateValue(value){
  if(value && typeof value.toMillis === "function") return value.toMillis();
  if(value && typeof value.seconds === "number") return value.seconds * 1000;
  if(value instanceof Date) return value.getTime();
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function renderOperatorRequestCards(list, requests, kind){
  if(!list) return;
  if(!requests.length){
    list.innerHTML = `<div class="card center"><div class="success-icon">✓</div><h3>${kind === "projects" ? "لا توجد طلبات مشاريع جديدة" : "لا توجد طلبات عملاء جديدة"}</h3><p>${kind === "projects" ? "ستظهر هنا طلبات المقاولين وأصحاب المشاريع الموجهة لمعدتك." : "ستظهر هنا طلبات الأفراد المناسبة لمعدتك."}</p></div>`;
    return;
  }
  list.innerHTML = "";
  requests.forEach(request=>{
    const card = document.createElement("div");
    card.className = "card operator-new-request-card";
    const price = Number(request.price || 0);
    const projectLine = kind === "projects" ? `<div class="operator-info-row"><span>🏗️ اسم المشروع</span><strong>${request.projectName || "مشروع بدون اسم"}</strong></div>` : "";
    const requester = kind === "projects" ? (request.contractorName || request.contractorCompany || "مقاول / صاحب مشروع") : (request.customerName || request.requesterName || "عميل");
    card.innerHTML = `
      <div class="request-title"><span>${kind === "projects" ? "🏗️" : "🚜"}</span><div><h2>${request.equipment || "معدة"}</h2><p>${kind === "projects" ? "طلب مشروع" : "طلب عميل"}</p></div></div>
      <div class="operator-info">
        <div class="operator-info-row"><span>👤 مقدم الطلب</span><strong>${requester}</strong></div>
        ${projectLine}
        <div class="operator-info-row"><span>📍 موقع العمل</span><strong>${request.location || request.projectCity || "-"}</strong></div>
        <div class="operator-info-row"><span>⏱️ مدة العمل</span><strong>${request.duration || "-"}</strong></div>
        <div class="operator-info-row"><span>💰 السعر</span><strong>${price.toLocaleString("ar-SA")} ريال</strong></div>
        <div class="operator-info-row"><span>📌 حالة الطلب</span><strong>${request.status === "extension_requested" ? "طلب تمديد بانتظار موافقتك" : "بانتظار قبولك"}</strong></div>
        ${kind === "projects" && request.paymentPlan ? `<div class="operator-info-row"><span>💳 طريقة الدفع</span><strong>${({half_half:"50% مقدّمًا و50% عند انتهاء العمل",four_installments:"أربع دفعات",full_upfront:"كامل المبلغ مقدّمًا",full_end:"كامل المبلغ عند انتهاء العمل",cash:"نقدًا مع توثيق الاستلام"})[request.paymentPlan] || request.paymentPlan}</strong></div><div class="operator-info-row"><span>🗓️ جدول العمل</span><strong>${request.dailyStartTime || "—"} - ${request.dailyEndTime || "—"} · أيام التشغيل: ${(request.workDays || []).map(Number).join("، ") || "—"}</strong></div><div class="operator-info-row"><span>📅 البداية والنهاية</span><strong>${request.scheduledStartAt?new Date(operatorRequestDateValue(request.scheduledStartAt)).toLocaleString("ar-SA"):"—"} — ${request.scheduledEndAt?new Date(operatorRequestDateValue(request.scheduledEndAt)).toLocaleString("ar-SA"):"—"}</strong></div><div class="operator-info-row"><span>🧾 شروط التسوية</span><strong>${request.paymentTerms || "—"}</strong></div>` : ""}
      </div>
      <div class="operator-notes"><span>📝 ملاحظات ${kind === "projects" ? "المشروع" : "العميل"}</span><p>${request.notes || "لا توجد ملاحظات"}</p></div>
      <div class="operator-buttons">${request.status === "extension_requested" ? `<button class="reject-btn" type="button" data-reject-extension="${request.id}">رفض التمديد</button><button class="accept-btn" type="button" data-approve-extension="${request.id}">الموافقة على التمديد</button>` : `<button class="reject-btn" type="button" data-reject-request="${request.id}">رفض الطلب</button><button class="accept-btn" type="button" data-accept-request="${request.id}">قبول الطلب</button>`}</div>`;
    list.appendChild(card);
  });
}

async function loadOperatorNewRequests(){
  const customerList = document.getElementById("operatorNewRequestsList");
  const projectList = document.getElementById("operatorProjectRequestsList");
  const refreshButton = document.getElementById("refreshOperatorRequestsBtn");
  const updatedLabel = document.getElementById("operatorRequestsLastUpdated");
  if(!customerList && !projectList) return;
  if(refreshButton){refreshButton.disabled=true;refreshButton.innerHTML='<span aria-hidden="true">⟳</span> جارٍ التحديث...';}
  if(customerList) customerList.innerHTML='<div class="card center"><p>جاري تحميل طلبات العملاء...</p></div>';
  if(projectList) projectList.innerHTML='<div class="card center"><p>جاري تحميل طلبات المشاريع...</p></div>';
  try{
    const user = await getOperatorCurrentUser();
    if(!user || !user.uid){
      const message='<div class="card center"><p>سجّل الدخول أولاً لعرض الطلبات.</p></div>';
      if(customerList) customerList.innerHTML=message;
      if(projectList) projectList.innerHTML=message;
      return;
    }
    const equipment = await getOperatorEquipment();
    if(!equipment){
      const message='<div class="card center"><p>لم يتم العثور على بيانات المعدة. تأكد من حفظ بيانات معدتك أولاً.</p></div>';
      if(customerList) customerList.innerHTML=message;
      if(projectList) projectList.innerHTML=message;
      return;
    }
    const ownerRequestRows = await ma3daReadUserRows("requests", ["equipmentOwnerId", "ownerId", "operatorId"], user.uid);
    const customerRequests=[];
    const projectRequests=[];
    ownerRequestRows.forEach(data=>{
      data = data || {};
      const eligibleStatus = data.status === "searching" || (data.status === "extension_requested" && !!(data.projectId || data.contractorId));
      if(!eligibleStatus) return;
      const targetedOwner = data.equipmentOwnerId || data.ownerId || data.operatorId || "";
      const ownerMatches = targetedOwner ? targetedOwner === user.uid : (data.equipment === equipment.type || data.equipmentType === equipment.type || data.equipment === equipment.name);
      if(!ownerMatches) return;
      const role=String(data.requesterRole || data.requesterType || data.role || "").toLowerCase();
      const legacyContractorRequest=!data.projectId&&(role==='contractor'||role==='project'||!!data.contractorId);
      if(legacyContractorRequest)return;
      const isProjectRequest=!!data.projectId&&(role==='contractor'||role==='project'||role==='project_manager'||!!data.contractorId);
      const request={...data};
      (isProjectRequest ? projectRequests : customerRequests).push(request);
    });
    const sortNewest=(a,b)=>operatorRequestDateValue(b.createdAt)-operatorRequestDateValue(a.createdAt);
    customerRequests.sort(sortNewest);
    projectRequests.sort(sortNewest);
    renderOperatorRequestCards(customerList,customerRequests,"customers");
    renderOperatorRequestCards(projectList,projectRequests,"projects");
    if(updatedLabel){
      updatedLabel.textContent='آخر تحديث: '+new Date().toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"});
    }
  }catch(error){
    console.error("خطأ في تحميل طلبات صاحب المعدة:",error);
    const message='<div class="card center"><h3>تعذر تحميل الطلبات</h3><p>تحقق من الاتصال وصلاحيات قراءة الطلبات في Firebase، ثم اضغط تحديث الطلبات.</p></div>';
    if(customerList) customerList.innerHTML=message;
    if(projectList) projectList.innerHTML=message;
    if(updatedLabel) updatedLabel.textContent='لم يكتمل التحديث. حاول مرة أخرى.';
  }finally{
    if(refreshButton){refreshButton.disabled=false;refreshButton.innerHTML='<span aria-hidden="true">⟳</span> تحديث الطلبات';}
  }
}

/* 04 — وظائف صاحب المعدة: طلبات المشاريع الحالية والسابقة، مستقلة عن طلبات العملاء */
let operatorProjectOrdersFilter = "current";

function setOperatorProjectOrdersFilter(filter){
  operatorProjectOrdersFilter = filter === "previous" ? "previous" : "current";
  const currentTab=document.getElementById("operatorProjectCurrentTab");
  const previousTab=document.getElementById("operatorProjectPreviousTab");
  const currentPanel=document.getElementById("operatorProjectCurrentPanel");
  const previousPanel=document.getElementById("operatorProjectPreviousPanel");
  if(currentTab){currentTab.classList.toggle("is-active",operatorProjectOrdersFilter==="current");currentTab.setAttribute("aria-selected",String(operatorProjectOrdersFilter==="current"));}
  if(previousTab){previousTab.classList.toggle("is-active",operatorProjectOrdersFilter==="previous");previousTab.setAttribute("aria-selected",String(operatorProjectOrdersFilter==="previous"));}
  if(currentPanel)currentPanel.hidden=operatorProjectOrdersFilter!=="current";
  if(previousPanel)previousPanel.hidden=operatorProjectOrdersFilter!=="previous";
}

function renderOwnerProjectOrderCards(list, requests, previous){
  if(!list)return;
  if(!requests.length){
    list.innerHTML=`<div class="card center"><div class="success-icon">${previous?'✓':'🏗️'}</div><h3>${previous?'لا توجد طلبات مشاريع سابقة':'لا توجد طلبات مشاريع حالية'}</h3><p>${previous?'ستظهر هنا طلبات المشاريع بعد انتهاء العمل أو إغلاقها.':'تنتقل طلبات المشروع إلى هنا مباشرة بعد قبولك لها، وتبقى هنا حتى انتهاء العمل.'}</p></div>`;
    return;
  }
  list.innerHTML="";
  requests.forEach(r=>{
    const card=document.createElement("article");card.className="card operator-new-request-card";
    const esc=v=>String(v??"—").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const statusLabels={accepted:"مقبول — بانتظار بدء التشغيل",working:"قيد التشغيل",duration_expired:"انتهت المدة — بانتظار الإنهاء",completed:"منتهي",paid:"مدفوع",rejected:"مرفوض",cancelled:"ملغي",extension_requested:"طلب تمديد بانتظار المراجعة"};
    const planLabels={half_half:"50% مقدّمًا و50% عند الانتهاء",four_installments:"أربع دفعات",full_upfront:"كامل المبلغ مقدّمًا",full_end:"كامل المبلغ عند الانتهاء",cash:"نقدًا مع توثيق الاستلام"};
    const pending=(r.paymentLedger||[]).filter(x=>x.status==="pending_owner_review");
    const canStart=!previous&&r.status==="accepted"&&["scheduled","awaiting_acceptance"].includes(String(r.workStatus||""));
    const canFinish=!previous&&(["working","duration_expired"].includes(String(r.status||""))||["working","duration_expired"].includes(String(r.workStatus||"")));
    const canStage=!previous&&r.paymentPlan==="four_installments"&&r.status!=="completed";
    const startBtn=canStart?`<button type="button" class="accept-btn" data-owner-project-start="${esc(r.id)}">بدء تشغيل المعدة</button>`:"";
    const finishBtn=canFinish?`<button type="button" class="accept-btn" data-owner-project-complete="${esc(r.id)}">تأكيد انتهاء العمل</button>`:"";
    const stageBtn=canStage?`<button type="button" class="back-btn" data-owner-project-stage-due="${esc(r.id)}">اعتماد إنجاز المرحلة التالية</button>`:"";
    card.innerHTML=`
      <div class="request-title"><span>🏗️</span><div><h2>${esc(r.projectName||"مشروع بدون اسم")}</h2><p>طلب مشروع مستقل عن طلبات العملاء</p></div></div>
      <div class="operator-info">
        <div class="operator-info-row"><span>🚜 المعدة</span><strong>${esc(r.equipment||r.equipmentType||"معدة")}</strong></div>
        <div class="operator-info-row"><span>👤 مسؤول المشروع</span><strong>${esc(r.contractorName||r.contractorCompany||r.requesterName||"مسؤول المشروع")}</strong></div>
        <div class="operator-info-row"><span>📍 موقع المشروع</span><strong>${esc(r.location||r.projectCity||"—")}</strong></div>
        <div class="operator-info-row"><span>📌 حالة الطلب</span><strong>${esc(statusLabels[r.status]||r.status||"—")}</strong></div>
        <div class="operator-info-row"><span>💰 قيمة الاتفاق</span><strong>${Number(r.price||0).toLocaleString("ar-SA")} ريال</strong></div>
        <div class="operator-info-row"><span>💵 المدفوع</span><strong>${Number(r.paidTotal||0).toLocaleString("ar-SA")} ريال</strong></div>
        <div class="operator-info-row"><span>🧾 المتبقي</span><strong>${Number(r.remainingBalance??r.price??0).toLocaleString("ar-SA")} ريال</strong></div>
        <div class="operator-info-row"><span>💳 خطة الدفع</span><strong>${esc(planLabels[r.paymentPlan]||r.paymentPlan||"—")}</strong></div>
        <div class="operator-info-row"><span>🗓️ أوقات التشغيل</span><strong>${esc(r.dailyStartTime||"—")} - ${esc(r.dailyEndTime||"—")}</strong></div>
        <div class="operator-info-row"><span>📅 المدة</span><strong>${r.scheduledStartAt?new Date(operatorRequestDateValue(r.scheduledStartAt)).toLocaleString("ar-SA"):"—"} — ${r.scheduledEndAt?new Date(operatorRequestDateValue(r.scheduledEndAt)).toLocaleString("ar-SA"):"—"}</strong></div>
      </div>
      <div class="operator-notes"><span>📝 ملاحظات المشروع</span><p>${esc(r.notes||"لا توجد ملاحظات")}</p></div>
      ${pending.length?`<div class="card"><strong>إثباتات سداد بانتظار المراجعة</strong>${pending.map(x=>`<p>${Number(x.amount||0).toLocaleString("ar-SA")} ريال — ${esc(x.reference||"دون مرجع")}</p>`).join("")}<p>افتح صفحة الدخل والفواتير المشتركة لتأكيد الإثباتات.</p></div>`:""}
      ${!previous?`<div class="operator-buttons">${startBtn}${finishBtn}${stageBtn}</div>`:`<div class="operator-buttons"><span class="muted">تاريخ الانتهاء: ${r.workCompletedAt?new Date(operatorRequestDateValue(r.workCompletedAt)).toLocaleString("ar-SA"):r.completedAt?new Date(operatorRequestDateValue(r.completedAt)).toLocaleString("ar-SA"):"غير مسجل"}</span></div>`}`;
    list.appendChild(card);
  });
}

async function loadOperatorProjectOrders(){
  const currentList=document.getElementById("operatorProjectCurrentList");
  const previousList=document.getElementById("operatorProjectPreviousList");
  const updated=document.getElementById("operatorProjectOrdersUpdated");
  if(!currentList&&!previousList)return;
  if(currentList)currentList.innerHTML='<div class="card center"><p>جاري تحميل الطلبات الحالية...</p></div>';
  if(previousList)previousList.innerHTML='<div class="card center"><p>جاري تحميل الطلبات السابقة...</p></div>';
  try{
    const user=await getOperatorCurrentUser();
    if(!user?.uid){const msg='<div class="card center"><p>سجّل الدخول بحساب صاحب المعدة لعرض طلبات المشاريع.</p></div>';if(currentList)currentList.innerHTML=msg;if(previousList)previousList.innerHTML=msg;return;}
    const ownerProjectRows=await ma3daReadUserRows("requests", ["equipmentOwnerId", "ownerId", "operatorId"], user.uid);
    const current=[],previous=[];
    ownerProjectRows.forEach(d=>{
      d=d||{};
      const owner=d.equipmentOwnerId||d.ownerId||d.operatorId||"";
      const role=String(d.requesterRole||d.requesterType||d.role||"").toLowerCase();
      const isProject=!!d.projectId&&(role==="contractor"||role==="project"||role==="project_manager"||!!d.contractorId);
      if(owner!==user.uid||!isProject)return;
      const r={...d};
      if(["completed","rejected","cancelled"].includes(String(d.status||"")))previous.push(r);
      else if(["accepted","working","duration_expired","extension_requested"].includes(String(d.status||"")))current.push(r);
    });
    const sort=(a,b)=>operatorRequestDateValue(b.acceptedAt||b.createdAt)-operatorRequestDateValue(a.acceptedAt||a.createdAt);
    current.sort(sort);previous.sort((a,b)=>operatorRequestDateValue(b.workCompletedAt||b.completedAt||b.updatedAt||b.createdAt)-operatorRequestDateValue(a.workCompletedAt||a.completedAt||a.updatedAt||a.createdAt));
    renderOwnerProjectOrderCards(currentList,current,false);renderOwnerProjectOrderCards(previousList,previous,true);
  }catch(error){
    console.error("تعذر تحميل طلبات المشاريع لصاحب المعدة:",error);
    const msg='<div class="card center"><h3>تعذر تحميل طلبات المشاريع</h3><p>تحقق من الاتصال وصلاحيات Firebase ثم حدّث الصفحة.</p></div>';
    if(currentList)currentList.innerHTML=msg;if(previousList)previousList.innerHTML=msg;if(updated)updated.textContent="تعذر التحديث";
  }
}

async function operatorDecideProjectWorkState(requestId, action){
  const user=await getOperatorCurrentUser();if(!user?.uid)throw new Error('سجّل الدخول بحساب صاحب المعدة.');
  const ref=window.ma3daDoc(window.ma3daDB,'requests',requestId);const snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');const r=snap.data()||{};
  if(!r.projectId)throw new Error('هذا الإجراء مخصص لطلبات المشاريع.');if((r.equipmentOwnerId||r.ownerId||r.operatorId)!==user.uid)throw new Error('لا تملك صلاحية إدارة هذا الطلب.');const now=new Date();
  if(action==='start'){
    if(r.status!=='accepted'||!['scheduled','awaiting_acceptance'].includes(String(r.workStatus||'')))throw new Error('لا يمكن بدء التشغيل في حالة الطلب الحالية.');
    await window.ma3daUpdateDoc(ref,{status:'working',workStatus:'working',workStartedAt:now,workStartedBy:user.uid,updatedAt:now});return;
  }
  if(action==='complete'){
    if(!['working','duration_expired'].includes(String(r.status||''))&&!['working','duration_expired'].includes(String(r.workStatus||'')))throw new Error('لا يمكن إنهاء العمل قبل بدء التشغيل.');
    const plannedEnd=r.scheduledEndAt?.toDate?r.scheduledEndAt.toDate():new Date(r.scheduledEndAt||0);
    if(r.status!=='duration_expired'&&r.workStatus!=='duration_expired'&&Number.isFinite(plannedEnd.getTime())&&plannedEnd.getTime()>Date.now())throw new Error('لم تنتهِ المدة المتفق عليها. الإنهاء المبكر يحتاج مراجعة موظف الدعم.');
    if(typeof window.ma3daRunTransaction!=='function')throw new Error('المعاملات المالية الآمنة غير متاحة.');
    await window.ma3daRunTransaction(async tx=>{
      const rs=await tx.get(ref);if(!rs.exists())throw new Error('الطلب غير موجود.');const current=rs.data()||{};if((current.equipmentOwnerId||current.ownerId||current.operatorId)!==user.uid)throw new Error('لا تملك صلاحية إدارة هذا الطلب.');
      const schedule=Array.isArray(current.paymentSchedule)?current.paymentSchedule.map(x=>({...x})):[];
      if(current.paymentPlan==='full_end'&&schedule[0]&&schedule[0].status!=='paid')schedule[0]={...schedule[0],status:'due',dueAt:now};
      if(current.paymentPlan==='half_half'&&schedule[1]&&schedule[1].status!=='paid')schedule[1]={...schedule[1],status:'due',dueAt:now};
      if(current.paymentPlan==='cash'&&schedule[0]&&schedule[0].status!=='paid')schedule[0]={...schedule[0],status:'due',dueAt:now,requiresReceiptVerification:true};
      if(current.paymentPlan==='four_installments'){const next=schedule.findIndex(x=>x.status==='not_due');if(next>=0&&schedule.slice(0,next).every(x=>x.status==='paid'))schedule[next]={...schedule[next],status:'due',dueAt:now,ownerMarkedStageComplete:true};}
      const q=window.ma3daQuery(window.ma3daCollection(window.ma3daDB,'projectInvoices'),window.ma3daWhere('requestId','==',requestId));const is=await tx.get(q);const invoices=[];is.forEach(d=>{const x=d.data()||{};if(x.invoiceKind==='agreement_installment')invoices.push({id:d.id,...x});});
      const patch={status:'completed',workStatus:'completed',workCompletedAt:now,workCompletedBy:user.uid,paymentSchedule:schedule,settlementStatus:Number(current.remainingBalance??current.price??0)>0?'needs_settlement':(current.settlementStatus||'settled'),requestClosed:Number(current.remainingBalance??current.price??0)<=0,updatedAt:now};
      tx.update(ref,patch);
      for(const inv of invoices){const item=schedule.find(x=>Number(x.installment)===Number(inv.installmentIndex));if(!item)continue;const dueAt=item.dueAt||((item.status==='due'&&(item.ownerMarkedStageComplete||['work_completion','cash_verification_at_completion'].includes(item.dueRule)))?now:inv.dueAt||null);tx.update(window.ma3daDoc(window.ma3daDB,'projectInvoices',inv.id),{dueAt:dueAt||null,paymentStatus:item.status==='paid'?'paid':(item.status==='due'?'unpaid':inv.paymentStatus),updatedAt:now});}
    });return;
  }
  if(action==='stage'){
    if(r.paymentPlan!=='four_installments')throw new Error('الدفعات المرحلية غير مفعلة لهذا الاتفاق.');
    const preview=Array.isArray(r.paymentSchedule)?r.paymentSchedule:[];const previewNext=preview.findIndex(x=>x.status==='not_due');if(previewNext<0)throw new Error('لا توجد مرحلة تالية لاستحقاقها.');if(preview.slice(0,previewNext).some(x=>x.status!=='paid'))throw new Error('لا يمكن استحقاق المرحلة التالية قبل تأكيد سداد المرحلة السابقة.');
    if(!confirm('تأكيد إنجاز '+(preview[previewNext].label||'المرحلة التالية')+' وجعل دفعتها مستحقة للمقاول؟'))return;
    if(typeof window.ma3daRunTransaction!=='function')throw new Error('المعاملات المالية الآمنة غير متاحة.');
    await window.ma3daRunTransaction(async tx=>{
      const rs=await tx.get(ref);if(!rs.exists())throw new Error('الطلب غير موجود.');const current=rs.data()||{};if((current.equipmentOwnerId||current.ownerId||current.operatorId)!==user.uid)throw new Error('لا تملك صلاحية إدارة هذا الطلب.');if(current.paymentPlan!=='four_installments')throw new Error('خطة الدفعات لا تسمح بهذا الإجراء.');
      const schedule=Array.isArray(current.paymentSchedule)?current.paymentSchedule.map(x=>({...x})):[];const next=schedule.findIndex(x=>x.status==='not_due');if(next<0||schedule.slice(0,next).some(x=>x.status!=='paid'))throw new Error('تغيرت حالة الدفعات؛ حدّث الطلب وحاول مجددًا.');
      const q=window.ma3daQuery(window.ma3daCollection(window.ma3daDB,'projectInvoices'),window.ma3daWhere('requestId','==',requestId));const is=await tx.get(q);const invoice=[];is.forEach(d=>{const x=d.data()||{};if(x.invoiceKind==='agreement_installment'&&Number(x.installmentIndex)===Number(schedule[next].installment))invoice.push({id:d.id,...x});});if(!invoice.length)throw new Error('فاتورة القسط التالي غير موجودة؛ لم يتم تغيير الاستحقاق.');
      schedule[next]={...schedule[next],status:'due',dueAt:now,ownerMarkedStageComplete:true};tx.update(ref,{paymentSchedule:schedule,updatedAt:now});for(const inv of invoice)tx.update(window.ma3daDoc(window.ma3daDB,'projectInvoices',inv.id),{dueAt:now,paymentStatus:'unpaid',status:'issued',updatedAt:now});
    });return;
  }
}
document.addEventListener('click',async event=>{
  const start=event.target.closest('[data-owner-project-start]');const finish=event.target.closest('[data-owner-project-complete]');const stage=event.target.closest('[data-owner-project-stage-due]');if(!start&&!finish&&!stage)return;
  const button=start||finish||stage;button.disabled=true;try{await operatorDecideProjectWorkState(button.dataset.ownerProjectStart||button.dataset.ownerProjectComplete||button.dataset.ownerProjectStageDue,start?'start':finish?'complete':'stage');alert(start?'تم تسجيل بدء التشغيل.':finish?'تم إنهاء العمل وتحديث حالة التسوية.':'تم تحديث استحقاق المرحلة.');await loadOperatorNewRequests();await loadOperatorProjectOrders();}catch(error){console.error('Project work lifecycle:',error);alert(error.message||'تعذر تحديث حالة العمل.');}finally{button.disabled=false;}
});

async function operatorDecideProjectPayment(){throw new Error('مسار تأكيد الدفعات المنفصل مؤرشف. افتح الفاتورة المشتركة وأكّد الإثبات منها لتحديث السجلات المالية معًا.');}
document.addEventListener('click',async event=>{const approve=event.target.closest('[data-owner-approve-project-payment]');const reject=event.target.closest('[data-owner-reject-project-payment]');if(!approve&&!reject)return;const button=approve||reject;button.disabled=true;try{await operatorDecideProjectPayment(button.dataset.ownerApproveProjectPayment||button.dataset.ownerRejectProjectPayment,button.dataset.ledgerId,!!approve);alert(approve?'تم تأكيد الدفعة وتحديث الرصيد.':'تم رفض إثبات الدفعة وإعادتها للمقاول.');await loadOperatorNewRequests();}catch(error){console.error('Project payment review:',error);alert(error.message||'تعذر مراجعة الدفعة.');}finally{button.disabled=false;}});

/* Tabs and manual refresh update the lists only; the full page is not reloaded. */
document.addEventListener("click",event=>{
  const tab=event.target.closest("[data-operator-request-tab]");
  if(tab){setOperatorRequestTab(tab.dataset.operatorRequestTab);return;}
  if(event.target.closest("#refreshOperatorRequestsBtn")) loadOperatorNewRequests();
});

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
      requestSnap.data() || {};
    let customerProfile = {};
    if (request.customerId && window.ma3daDoc && window.ma3daGetDoc) {
      try {
        const customerSnap = await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB, "customers", request.customerId));
        if (customerSnap.exists()) customerProfile = customerSnap.data() || {};
      } catch (customerProfileError) { console.warn("تعذر تحميل بيانات العميل:", customerProfileError); }
    }
 
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
 
    const requestRole=String(request.requesterRole || request.requesterType || request.role || '').toLowerCase();
    const isProjectRequest = !!request.projectId && (requestRole === 'contractor' || requestRole === 'project' || requestRole === 'project_manager' || !!request.contractorId);
    if(isProjectRequest && (!request.scheduledStartAt || !request.scheduledEndAt || !Array.isArray(request.workDays) || !request.workDays.length || !request.dailyStartTime || !request.dailyEndTime || !request.paymentTerms || !Array.isArray(request.paymentSchedule) || !request.paymentSchedule.length)){
      alert('لا يمكن قبول الطلب: بيانات الجدول أو شروط الدفع أو خطة الدفعات غير مكتملة.');return;
    }
    if(isProjectRequest && (!request.equipmentOwnerId || request.equipmentOwnerId !== user.uid)){
      alert('لا يمكن قبول طلب مشروع دون ربطه بصاحب المعدة الصحيح.');return;
    }
    const acceptedPaymentSchedule=isProjectRequest?(request.paymentSchedule||[]).map((item,index)=>({...item,status:(item.dueRule==='on_acceptance'||(request.paymentPlan==='four_installments'&&index===0))?'due':item.status||'not_due'})):request.paymentSchedule;
    await window.ma3daUpdateDoc(
      requestRef,
      {
 
        status:
          "accepted",
        ...(isProjectRequest ? {agreementStatus:'accepted',agreementAcceptedAt:new Date(),agreementAcceptedBy:user.uid,paymentSchedule:acceptedPaymentSchedule,workStatus:'scheduled',acceptedTermsVersion:request.agreementVersion||1} : {}),
 
        operatorId:
          user.uid,
 
        operatorName:
          operatorData.name ||
          "صاحب المعدة",
 
        operatorPhone:
          operatorData.phone ||
          "",
        customerName: request.customerName || request.customerFullName || customerProfile.name || customerProfile.fullName || customerProfile.displayName || "العميل",
 
        operatorRating:
          Number(
            operatorData.rating || 5
          ),
 
        operatorEquipment:
          equipment?.type || equipment?.equipmentType || equipment?.name || equipment?.model || request.equipment || "",
        equipmentLocationAddress: equipment?.locationAddress || equipment?.address || equipment?.location || equipment?.city || "",
        equipmentLocationLatitude: Number.isFinite(Number(equipment?.latitude ?? equipment?.locationLatitude ?? equipment?.coordinates?.latitude)) ? Number(equipment?.latitude ?? equipment?.locationLatitude ?? equipment?.coordinates?.latitude) : null,
        equipmentLocationLongitude: Number.isFinite(Number(equipment?.longitude ?? equipment?.locationLongitude ?? equipment?.coordinates?.longitude)) ? Number(equipment?.longitude ?? equipment?.locationLongitude ?? equipment?.coordinates?.longitude) : null,
 
        acceptedAt:
          Date.now(),
        agreedDuration: request.duration || "",
        agreedPrice: Number(request.price || 0),
        agreedHourlyPrice: Number(request.hourlyPrice || 0),
        agreementVersion: 1,
        extensionStatus: "none",
        workStatus: "scheduled"
 
      }
    );
    if(isProjectRequest){
      const acceptedSchedule=(acceptedPaymentSchedule||[]).map((item,index)=>({...item,status:(item.dueRule==='on_acceptance'||index===0&&request.paymentPlan==='four_installments')?'due':item.status||'not_due'}));
      await window.ma3daCreateSharedProjectInvoices(requestId,{...request,operatorId:user.uid},acceptedSchedule);
    }
 
    localStorage.setItem("currentRequestId", requestId);
 
    localStorage.setItem("orderState", "accepted");
 
    if(isProjectRequest){
      await loadOperatorProjectOrders();
      setOperatorProjectOrdersFilter("current");
      showScreen("operatorProjectOrdersScreen");
    }else{
      await loadOperatorCurrentOrder();
      showScreen("operatorCurrentOrderScreen");
    }
 
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
    const user=await getOperatorCurrentUser();
    if(!user?.uid){alert('سجّل الدخول بحساب صاحب المعدة.');return;}
    const requestRef =
      window.ma3daDoc(
        window.ma3daDB,
        "requests",
        requestId
      );
 
    const snap=await window.ma3daGetDoc(requestRef);
    if(!snap.exists()){alert('الطلب غير موجود.');return;}
    const data=snap.data()||{};
    const targetedOwner=data.equipmentOwnerId||data.ownerId||data.operatorId||'';
    if(targetedOwner && targetedOwner!==user.uid){alert('لا تملك صلاحية رفض هذا الطلب.');return;}
    if(data.projectId && data.agreementStatus==='accepted'){alert('لا يمكن رفض طلب مشروع بعد قبول الاتفاق؛ استخدم مسار الإنهاء المبكر عبر الدعم.');return;}
    await window.ma3daUpdateDoc(
      requestRef,
      {
        status:'rejected',agreementStatus:data.projectId?'rejected':(data.agreementStatus||''),
        rejectedBy:user.uid,rejectedAt:new Date(),updatedAt:new Date()
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
 
    let data = snap.data() || {};
    if (!data.customerName && !data.customerFullName && data.customerId && window.ma3daDoc && window.ma3daGetDoc) {
      try {
        const customerSnap = await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB, "customers", data.customerId));
        if (customerSnap.exists()) {
          const customerProfile = customerSnap.data() || {};
          data = { ...data, customerName: customerProfile.name || customerProfile.fullName || customerProfile.displayName || "العميل" };
        }
      } catch (customerProfileError) { console.warn("تعذر تحميل اسم العميل:", customerProfileError); }
    }
    updateOperatorCurrentUI(data);
 
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
 
  const customerName = document.getElementById("operatorCurrentCustomerName");
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
 
    if(arrivedBtn){ arrivedBtn.style.display = "none"; arrivedBtn.disabled = true; }
 
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
  if(customerName)
    customerName.textContent = data.customerName || data.customerFullName || data.name || data.customerDisplayName || "العميل";
  window.ma3daActiveRequestData = data;
  ma3daUpdateArrivalEligibility(data);
 
  if(duration)
    duration.textContent =
      data.duration || "-";
 
  if(price)
    price.textContent =
      `${Number(
        data.price || 0
      ).toLocaleString("ar-SA")} ريال`;
 
  if(arrivedBtn){
    arrivedBtn.style.display = "none";
    arrivedBtn.disabled = true;
  }
 
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
 
    if(arrivedBtn){
      arrivedBtn.style.display = "block";
      ma3daUpdateArrivalEligibility(data);
    }
 
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
 

/* مِعدة 2026 — تحقق حقيقي من وصول صاحب المعدة (GPS + مسافة كيلومتر) */
let ma3daOwnerPosition = null;
let ma3daArrivalDistanceKm = null;
function ma3daDistanceKm(a,b){
  if(!a||!b)return Infinity;
  const rad=v=>v*Math.PI/180;
  const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);
  const x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
}
function ma3daUpdateArrivalEligibility(data){
  const btn=document.getElementById('operatorArrivedBtn');
  const feedback=document.getElementById('operatorDistanceFeedback');
  const target=ma3daCustomerCoordinates(data||window.ma3daActiveRequestData||{});
  const distance=target&&ma3daOwnerPosition?ma3daDistanceKm(ma3daOwnerPosition,target):Infinity;
  ma3daArrivalDistanceKm=distance;
  const eligible=Number.isFinite(distance)&&distance<=1&&Number(ma3daOwnerPosition?.accuracy||Infinity)<=100&&String((data||{}).status||'accepted')==='accepted';
  if(btn){btn.disabled=!eligible;btn.setAttribute('aria-disabled',String(!eligible));}
  if(feedback){
    if(!target)feedback.textContent='موقع العميل غير محفوظ بإحداثيات دقيقة؛ لا يمكن تأكيد الوصول حتى يحدد العميل موقعه بدقة.';
    else if(!ma3daOwnerPosition)feedback.textContent='اضغط «التحقق من المسافة» للسماح بتحديد موقعك والتحقق من أنك ضمن كيلومتر واحد.';
    else feedback.textContent=eligible?`أنت ضمن نطاق الوصول (${(distance*1000).toFixed(0)} متر). يمكنك تأكيد الوصول.`:`أنت على بُعد ${(distance).toFixed(2)} كم من العميل. زر الوصول سيتاح عند دخول نطاق 1 كم.`;
  }
  return eligible;
}
function ma3daGetOwnerPosition(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){reject(new Error('هذا الجهاز لا يدعم تحديد الموقع.'));return;}
    navigator.geolocation.getCurrentPosition(
      p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy}),
      e=>reject(new Error(e.code===1?'اسمح للتطبيق بالوصول إلى موقعك للتحقق من المسافة.':'تعذر تحديد موقعك بدقة. حاول مرة أخرى في مكان مفتوح.')),
      {enableHighAccuracy:true,timeout:20000,maximumAge:0}
    );
  });
}
const operatorCheckDistanceBtn=document.getElementById('operatorCheckDistanceBtn');
if(operatorCheckDistanceBtn){operatorCheckDistanceBtn.addEventListener('click',async()=>{
  const original=operatorCheckDistanceBtn.textContent;
  operatorCheckDistanceBtn.disabled=true;operatorCheckDistanceBtn.textContent='جارٍ التحقق من موقعك…';
  try{
    ma3daOwnerPosition=await ma3daGetOwnerPosition();
    let latest=window.ma3daActiveRequestData||{};
    const id=localStorage.getItem('currentRequestId');
    if(id&&window.ma3daDB&&window.ma3daDoc&&window.ma3daGetDoc){const snap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'requests',id));if(snap.exists())latest=window.ma3daActiveRequestData=snap.data()||latest;}
    if(!ma3daCustomerCoordinates(latest)){throw new Error('موقع العميل غير محفوظ كإحداثيات دقيقة؛ لا يمكن حساب المسافة بأمان.');}
    ma3daUpdateArrivalEligibility(latest);
  }catch(error){ma3daOwnerPosition=null;ma3daUpdateArrivalEligibility(window.ma3daActiveRequestData||{});alert(error.message||'تعذر التحقق من المسافة.');}
  finally{operatorCheckDistanceBtn.disabled=false;operatorCheckDistanceBtn.textContent=original;}
});}
const operatorCustomerMapBtn=document.getElementById('operatorCustomerMapBtn');
if(operatorCustomerMapBtn){operatorCustomerMapBtn.addEventListener('click',async()=>{
  try{
    const id=localStorage.getItem('currentRequestId');if(!id)throw new Error('لا يوجد طلب حالي.');
    if(window.ma3daFirebaseReady)await window.ma3daFirebaseReady;
    const snap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'requests',id));
    if(!snap.exists())throw new Error('الطلب غير موجود.');
    ma3daOpenCustomerMap(snap.data()||{});
  }catch(error){alert(error.message||'تعذر فتح موقع العميل.');}
});}

/* OPERATOR ARRIVED */
 
async function operatorMarkArrived(){
  const requestId=localStorage.getItem('currentRequestId');
  let latestData=window.ma3daActiveRequestData||{};
  try{
    if(!requestId)throw new Error('لا يوجد طلب حالي.');
    const latestSnap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'requests',requestId));
    if(!latestSnap.exists())throw new Error('الطلب غير موجود.');
    latestData=window.ma3daActiveRequestData=latestSnap.data()||{};
    ma3daOwnerPosition=await ma3daGetOwnerPosition();
  }catch(error){alert(error.message||'تعذر التحقق من الموقع الحالي.');return;}
  const targetPoint=ma3daCustomerCoordinates(latestData);
  if(latestData.status!=='accepted'||!targetPoint||!ma3daOwnerPosition||ma3daOwnerPosition.accuracy>100||ma3daDistanceKm(ma3daOwnerPosition,targetPoint)>1){
    ma3daUpdateArrivalEligibility(latestData);
    alert('لا يمكن تأكيد الوصول إلا عند وجود إحداثيات دقيقة للعميل، وسماح الموقع، ودقة GPS مناسبة، وأن تكون على بُعد كيلومتر واحد أو أقل.');
    return;
  }
 
 
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
          "invoice_pending",
        paymentStatus:
          "unpaid",
        workStatus:
          "completed",
        completedAt,
        workCompletedAt: completedAt,
        finalPrice: Number(request.finalPrice || request.price || 0),
        updatedAt: new Date()
 
      }
    );
 
    clearInterval(
      operatorTimerInterval
    );
 
    localStorage.setItem("orderState", "invoice_pending");
    const ownerEndNotice=document.createElement('div');
    ownerEndNotice.setAttribute('role','status');
    ownerEndNotice.style.cssText='position:fixed;z-index:99999;bottom:18px;left:16px;right:16px;padding:14px 16px;background:#171717;color:#fff;border-radius:12px;text-align:center;font-weight:700';
    ownerEndNotice.textContent='انتهى العمل. تم إشعار حالة الطلب، والسداد الآن بانتظار العميل.';
    document.body.appendChild(ownerEndNotice);setTimeout(()=>ownerEndNotice.remove(),6500);
 
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
 
/* 04 — وظائف صاحب المعدة: طلبات العملاء الحالية والسابقة في صفحة واحدة */
let operatorCustomerOrdersFilter = "current";

function setOperatorCustomerOrdersFilter(filter){
  operatorCustomerOrdersFilter = filter === "previous" ? "previous" : "current";
  const currentTab=document.getElementById("operatorCustomerCurrentTab");
  const previousTab=document.getElementById("operatorCustomerPreviousTab");
  const currentPanel=document.getElementById("operatorCustomerCurrentPanel");
  const previousPanel=document.getElementById("operatorCustomerPreviousPanel");
  if(currentTab){currentTab.classList.toggle("is-active",operatorCustomerOrdersFilter==="current");currentTab.setAttribute("aria-selected",String(operatorCustomerOrdersFilter==="current"));}
  if(previousTab){previousTab.classList.toggle("is-active",operatorCustomerOrdersFilter==="previous");previousTab.setAttribute("aria-selected",String(operatorCustomerOrdersFilter==="previous"));}
  if(currentPanel)currentPanel.hidden=operatorCustomerOrdersFilter!=="current";
  if(previousPanel)previousPanel.hidden=operatorCustomerOrdersFilter!=="previous";
}

function renderOwnerCustomerOrderCards(list, requests, previous){
  if(!list)return;
  if(!requests.length){
    list.innerHTML=`<div class="card center"><div class="success-icon">${previous?'✓':'🚜'}</div><h3>${previous?'لا توجد طلبات عملاء سابقة':'لا توجد طلبات عملاء حالية'}</h3><p>${previous?'ستظهر هنا الطلبات بعد اكتمالها أو رفضها.':'ستظهر هنا طلبات العملاء المقبولة أو الجاري تنفيذها.'}</p></div>`;
    return;
  }
  list.innerHTML="";
  requests.forEach(r=>{
    const esc=v=>String(v??"—").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const card=document.createElement("article");
    card.className="card operator-new-request-card";
    const statusLabels={accepted:"مقبول",arrived:"وصلت المعدة",working:"قيد العمل",completed:"مكتمل",rejected:"مرفوض",cancelled:"ملغي",in_progress:"قيد التنفيذ"};
    card.innerHTML=`
      <div class="request-title"><span>🚜</span><div><h2>${esc(r.equipment||r.equipmentType||"معدة")}</h2><p>طلب عميل</p></div></div>
      <div class="operator-info">
        <div class="operator-info-row"><span>👤 العميل</span><strong>${esc(r.customerName||r.requesterName||"عميل")}</strong></div>
        <div class="operator-info-row"><span>📍 الموقع</span><strong>${esc(r.location||"—")}</strong></div>
        <div class="operator-info-row"><span>⏱️ المدة</span><strong>${esc(r.duration||"—")}</strong></div>
        <div class="operator-info-row"><span>💰 المبلغ</span><strong>${Number(r.price||0).toLocaleString("ar-SA")} ريال</strong></div>
        <div class="operator-info-row"><span>📌 الحالة</span><strong>${esc(statusLabels[r.status]||r.status||"—")}</strong></div>
      </div>
      ${!previous?`<button type="button" class="main-btn" data-owner-customer-open="${esc(r.id)}">عرض تفاصيل الطلب</button>`:`<div class="operator-current-status"><strong>${r.status==="completed"?"تم إكمال الطلب":"انتهى الطلب دون إكمال"}</strong></div>`}`;
    list.appendChild(card);
  });
}

async function loadOperatorCustomerOrders(){
  const currentList=document.getElementById("operatorCustomerCurrentList");
  const previousList=document.getElementById("operatorCustomerPreviousList");
  const updated=document.getElementById("operatorCustomerOrdersUpdated");
  if(!currentList&&!previousList)return;
  if(currentList)currentList.innerHTML='<div class="card center"><p>جاري تحميل الطلبات الحالية...</p></div>';
  if(previousList)previousList.innerHTML='<div class="card center"><p>جاري تحميل الطلبات السابقة...</p></div>';
  try{
    const user=await getOperatorCurrentUser();
    if(!user?.uid){const msg='<div class="card center"><p>سجّل الدخول بحساب صاحب المعدة لعرض طلبات العملاء.</p></div>';if(currentList)currentList.innerHTML=msg;if(previousList)previousList.innerHTML=msg;return;}
    const ownerCustomerRows=await ma3daReadUserRows("requests", ["equipmentOwnerId", "ownerId", "operatorId"], user.uid);
    const current=[],previous=[];
    ownerCustomerRows.forEach(d=>{
      d=d||{};
      const owner=d.equipmentOwnerId||d.ownerId||d.operatorId||"";
      const role=String(d.requesterRole||d.requesterType||d.role||"").toLowerCase();
      const isProject=!!d.projectId&&(role==="contractor"||role==="project"||role==="project_manager"||!!d.contractorId);
      if(owner!==user.uid||isProject)return;
      const r={...d};
      if(["completed","rejected","cancelled"].includes(String(d.status||"")))previous.push(r);
      else if(["accepted","arrived","working","in_progress","duration_expired"].includes(String(d.status||"")))current.push(r);
    });
    const sort=(a,b)=>operatorRequestDateValue(b.acceptedAt||b.createdAt)-operatorRequestDateValue(a.acceptedAt||a.createdAt);
    current.sort(sort);
    previous.sort((a,b)=>operatorRequestDateValue(b.completedAt||b.updatedAt||b.createdAt)-operatorRequestDateValue(a.completedAt||a.updatedAt||a.createdAt));
    renderOwnerCustomerOrderCards(currentList,current,false);
    renderOwnerCustomerOrderCards(previousList,previous,true);
  }catch(error){
    console.error("تعذر تحميل طلبات العملاء لصاحب المعدة:",error);
    const msg='<div class="card center"><h3>تعذر تحميل الطلبات</h3><p>تحقق من الاتصال ثم أعد فتح الصفحة.</p></div>';
    if(currentList)currentList.innerHTML=msg;if(previousList)previousList.innerHTML=msg;
  }
}

window.loadOperatorCustomerOrders=loadOperatorCustomerOrders;

document.addEventListener("click",event=>{
  const tab=event.target.closest("[data-owner-customer-filter]");
  if(tab){setOperatorCustomerOrdersFilter(tab.dataset.ownerCustomerFilter);return;}
  if(event.target.closest("#refreshOperatorCustomerOrdersBtn")){loadOperatorCustomerOrders();return;}
  const open=event.target.closest("[data-owner-customer-open]");
  if(open){localStorage.setItem("currentRequestId",open.dataset.ownerCustomerOpen);loadOperatorCurrentOrder().then(()=>showScreen("operatorCurrentOrderScreen"));}
});

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
 
    const previousRows = await ma3daReadUserRows("requests", ["operatorId", "equipmentOwnerId", "ownerId"], user.uid);
 
    const requests = [];
 
    previousRows.forEach(
      data=>{
        data = data || {};
 
        if(
          data.operatorId === user.uid &&
          (
            data.status === "completed" ||
            data.status === "rejected"
          )
        ){
 
          requests.push({ ...data });
 
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
 
/* 04 — وظائف صاحب المعدة: الدخل والفواتير */
/* OPERATOR INCOME */
 
async function loadOperatorIncome(){
 
  const user =
    await getOperatorCurrentUser();
 
  if(!user)
    return;
 
  let incomeRows;
  try{
    incomeRows=await ma3daReadUserRows("requests",["operatorId","equipmentOwnerId","ownerId"],user.uid);
  }catch(error){
    console.error("تعذر تحميل دخل صاحب المعدة:",error);
    const list=document.getElementById("operatorIncomeList");
    if(list) list.innerHTML='<div class="card center"><h3>تعذر تحميل الدخل</h3><p>تحقق من صلاحيات قراءة طلباتك في Firebase ثم أعد المحاولة.</p></div>';
    const total=document.getElementById("operatorTotalIncome");if(total)total.textContent="—";
    const count=document.getElementById("operatorCompletedCount");if(count)count.textContent="—";
    const hours=document.getElementById("operatorTotalHours");if(hours)hours.textContent="—";
    return;
  }
 
  let totalIncome =
    0;
 
  let completedCount =
    0;
 
  let totalHours =
    0;
 
  const completedRequests =
    [];
 
  incomeRows.forEach(
    data=>{
      data = data || {};
 
      if(
        (data.operatorId===user.uid || data.equipmentOwnerId===user.uid || data.ownerId===user.uid) &&
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
 
/* 04 — وظائف صاحب المعدة: الإعدادات */
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
 
const operatorCustomerOrdersBtn=document.getElementById("operatorCustomerOrdersBtn");
if(operatorCustomerOrdersBtn){
  operatorCustomerOrdersBtn.addEventListener("click",async()=>{
    setOperatorCustomerOrdersFilter("current");
    await loadOperatorCustomerOrders();
    showScreen("operatorCustomerOrdersScreen");
  });
}
const backOperatorCustomerOrdersBtn=document.getElementById("backFromOperatorCustomerOrdersBtn");
if(backOperatorCustomerOrdersBtn){backOperatorCustomerOrdersBtn.addEventListener("click",()=>showScreen("operatorHomeScreen"));}
 
/* صفحة طلبات المشاريع الحالية والسابقة — مستقلة عن طلبات العملاء */
const operatorProjectOrdersBtn=document.getElementById("operatorProjectOrdersBtn");
if(operatorProjectOrdersBtn){operatorProjectOrdersBtn.addEventListener("click",async()=>{await loadOperatorProjectOrders();setOperatorProjectOrdersFilter("current");showScreen("operatorProjectOrdersScreen");});}
const backOperatorProjectOrdersBtn=document.getElementById("backFromOperatorProjectOrdersBtn");
if(backOperatorProjectOrdersBtn){backOperatorProjectOrdersBtn.addEventListener("click",()=>showScreen("operatorHomeScreen"));}
document.addEventListener("click",event=>{
  const tab=event.target.closest("[data-owner-project-filter]");
  if(tab){setOperatorProjectOrdersFilter(tab.dataset.ownerProjectFilter);return;}
  if(event.target.closest("#refreshOperatorProjectOrdersBtn"))loadOperatorProjectOrders();
});

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
 
/* 04-A — وظائف صاحب المعدة: الدعم الفني الخاص بصاحب المعدة */
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
 
      const form = document.getElementById("operatorSupportTicketForm");
      if (form) form.scrollIntoView({ behavior: "smooth", block: "center" });
 
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
 
/* OPERATOR CHAT: handler is registered in the shared chat section above. */
 
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
 
/* 06 — وظائف الدعم الفني: بوابة موظفي الدعم وإدارة الشكاوى */
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
        role === "admin" ||
        role === "owner"
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
          "هذا الحساب ليس حساب موظف دعم مصرحًا له. استخدم بوابة الدخول المخصصة لحسابك.";
 
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
   PROJECT EARLY-CLOSE REVIEW — support employee only
========================================================= */
async function loadSupportProjectClosures(){
  const target=document.getElementById('supportProjectClosuresList');if(!target)return;
  target.innerHTML='<div class="support-card">جارٍ تحميل طلبات الإنهاء المبكر…</div>';
  try{
    const employee=await requireSupportEmployee();if(!employee){target.innerHTML='<div class="support-card">سجّل الدخول بحساب موظف الدعم.</div>';return;}
    const snapshot=await window.ma3daGetDocs(window.ma3daCollection(window.ma3daDB,'requests'));
    const rows=[];const disputes=[];snapshot.forEach(doc=>{const r=doc.data()||{};if(!r.projectId)return;const row={id:doc.id,...r};if(r.earlyFinishStatus==='pending_support')rows.push(row);(Array.isArray(r.paymentDisputes)?r.paymentDisputes:[]).forEach(d=>{if(d.status==='pending_support')disputes.push({...row,dispute:d});});});
    if(!rows.length&&!disputes.length){target.innerHTML='<div class="support-card">لا توجد طلبات إنهاء مبكر أو نزاعات دفعات معلقة.</div>';return;}
    const closures=rows.map(r=>`<div class="ma3da-closure-card"><h3>${supportEscapeHtml(r.projectName||'مشروع')} — ${supportEscapeHtml(r.equipment||'معدة')}</h3><p><strong>نوع المراجعة:</strong> إنهاء مبكر</p><p><strong>المقاول:</strong> ${supportEscapeHtml(r.contractorName||r.contractorCompany||r.contractorId||'—')}</p><p><strong>صاحب المعدة:</strong> ${supportEscapeHtml(r.operatorName||r.equipmentOwnerId||'—')}</p><p><strong>السبب:</strong> ${supportEscapeHtml(r.earlyFinishRequest?.reason||'—')}</p><p><strong>القيمة المتفق عليها:</strong> ${Number(r.price||0).toLocaleString('ar-SA')} ريال</p><p><strong>المدفوع المسجل:</strong> ${Number(r.paidTotal||0).toLocaleString('ar-SA')} ريال — <strong>المتبقي:</strong> ${Number(r.remainingBalance??r.price??0).toLocaleString('ar-SA')} ريال</p><p><strong>شروط التسوية المتفق عليها:</strong> ${supportEscapeHtml(r.settlementPolicy||r.paymentTerms||'لم تُسجل')}</p><button class="support-btn" type="button" data-support-approve-early-finish="${r.id}">اعتماد إنهاء العمل ومراجعة التسوية</button><button class="support-btn support-danger" type="button" data-support-reject-early-finish="${r.id}">رفض الإنهاء واستمرار الطلب</button></div>`).join('');
    const disputeHtml=disputes.map(row=>`<div class="ma3da-closure-card"><h3>${supportEscapeHtml(row.projectName||'مشروع')} — ${supportEscapeHtml(row.equipment||'معدة')}</h3><p><strong>نوع المراجعة:</strong> نزاع دفعة</p><p><strong>الدفعة:</strong> ${supportEscapeHtml(row.dispute.label||('دفعة '+(Number(row.dispute.installmentIndex)+1)))}</p><p><strong>المبلغ محل النزاع:</strong> ${Number(row.dispute.amount||0).toLocaleString('ar-SA')} ريال</p><p><strong>السبب:</strong> ${supportEscapeHtml(row.dispute.reason||'—')}</p><p><strong>شروط التسوية:</strong> ${supportEscapeHtml(row.settlementPolicy||row.paymentTerms||'لم تُسجل')}</p><button class="support-btn" type="button" data-support-uphold-payment-dispute="${row.id}" data-dispute-id="${supportEscapeHtml(row.dispute.id)}">تثبيت الاستحقاق حسب الاتفاق</button><button class="support-btn support-danger" type="button" data-support-settle-payment-dispute="${row.id}" data-dispute-id="${supportEscapeHtml(row.dispute.id)}">تسجيل مبلغ تسوية متفق عليه</button></div>`).join('');
    target.innerHTML=(closures?'<h3>طلبات الإنهاء المبكر</h3>'+closures:'')+(disputeHtml?'<h3>نزاعات الدفعات</h3>'+disputeHtml:'');
  }catch(error){console.error('Load support project closures:',error);target.innerHTML='<div class="support-card">تعذر تحميل طلبات الإنهاء المبكر. تحقق من صلاحيات قراءة requests.</div>';}
}
function supportEscapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
async function decideSupportProjectEarlyFinish(requestId,approve){
  const employee=await requireSupportEmployee();if(!employee?.user?.uid)throw new Error('يجب تسجيل الدخول بصفة موظف دعم.');
  const ref=window.ma3daDoc(window.ma3daDB,'requests',requestId);const snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('طلب المشروع غير موجود.');
  const r=snap.data()||{};if(!r.projectId||r.earlyFinishStatus!=='pending_support')throw new Error('هذا الطلب ليس بانتظار مراجعة الدعم.');
  const now=new Date();
  if(approve){await window.ma3daUpdateDoc(ref,{status:'completed',workStatus:'completed_early',earlyFinishStatus:'approved',earlyFinishDecision:{decidedBy:employee.user.uid,decidedByEmail:employee.user.email||'',decidedAt:now,decision:'approved'},settlementStatus:'needs_settlement',settlementReviewRequired:true,updatedAt:now});}
  else{const restoredStatus=['duration_expired','working'].includes(String(r.earlyFinishRequest?.previousStatus||''))?r.earlyFinishRequest.previousStatus:'working';await window.ma3daUpdateDoc(ref,{status:restoredStatus,workStatus:restoredStatus==='duration_expired'?'duration_expired':'working',earlyFinishStatus:'rejected',earlyFinishDecision:{decidedBy:employee.user.uid,decidedByEmail:employee.user.email||'',decidedAt:now,decision:'rejected'},settlementReviewRequired:false,updatedAt:now});}
}
async function decideSupportProjectPaymentDispute(requestId,disputeId,action){
  const employee=await requireSupportEmployee();if(!employee?.user?.uid)throw new Error('يجب تسجيل الدخول بصفة موظف دعم.');
  const ref=window.ma3daDoc(window.ma3daDB,'requests',requestId);const snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('طلب المشروع غير موجود.');const r=snap.data()||{};
  const disputes=Array.isArray(r.paymentDisputes)?r.paymentDisputes.slice():[];const di=disputes.findIndex(d=>d.id===disputeId&&d.status==='pending_support');if(di<0)throw new Error('النزاع غير موجود أو سبق البت فيه.');
  const schedule=Array.isArray(r.paymentSchedule)?r.paymentSchedule.map(x=>({...x})):[];const index=Number(disputes[di].installmentIndex);const item=schedule[index];if(!item)throw new Error('الدفعة المرتبطة بالنزاع غير موجودة.');const now=new Date();let price=Number(r.price||0);let remaining=Number(r.remainingBalance??price-Number(r.paidTotal||0));
  if(action==='settle'){
    const minimum=Number(item.paidAmount||0);const agreed=Number(prompt(`أدخل قيمة الدفعة النهائية المتفق عليها من الطرفين (لا تقل عن المدفوع ${minimum.toFixed(2)} ريال):`,String(item.amount||minimum)));if(!Number.isFinite(agreed)||agreed<minimum||agreed>Number(item.amount||0))throw new Error('قيمة التسوية غير صحيحة؛ لا يمكن تسجيل استرداد تلقائي من هذا المسار.');
    price=Math.round((price+agreed-Number(item.amount||0))*100)/100;schedule[index]={...item,amount:agreed,status:agreed<=minimum?'paid':'due',settlementAgreedAmount:agreed,settlementAgreedAt:now,reviewStatus:'settled_by_support_agreement'};disputes[di]={...disputes[di],status:'resolved',decision:'settled_by_agreement',agreedAmount:agreed,decidedBy:employee.user.uid,decidedAt:now};
  }else{
    schedule[index]={...item,status:Number(item.amount||0)>Number(item.paidAmount||0)?'due':'paid',reviewStatus:'upheld_after_dispute'};disputes[di]={...disputes[di],status:'resolved',decision:'upheld',decidedBy:employee.user.uid,decidedAt:now};
  }
  remaining=Math.max(0,Math.round((price-Number(r.paidTotal||0))*100)/100);const hasOpenDispute=disputes.some(d=>d.status==='pending_support');
  await window.ma3daUpdateDoc(ref,{paymentDisputes:disputes,paymentSchedule:schedule,price,remainingBalance:remaining,settlementStatus:hasOpenDispute?'disputed':(remaining>0?'needs_settlement':'settled'),settlementReviewRequired:hasOpenDispute||r.earlyFinishStatus==='pending_support',updatedAt:now});
}
document.addEventListener('click',async event=>{
  const uphold=event.target.closest('[data-support-uphold-payment-dispute]');const settle=event.target.closest('[data-support-settle-payment-dispute]');if(!uphold&&!settle)return;const button=uphold||settle;
  if(!confirm(uphold?'تثبيت استحقاق الدفعة وفق الاتفاق؟':'تسجيل قيمة تسوية اتفق عليها الطرفان؟'))return;button.disabled=true;
  try{await decideSupportProjectPaymentDispute(button.dataset.supportUpholdPaymentDispute||button.dataset.supportSettlePaymentDispute,button.dataset.disputeId,uphold?'uphold':'settle');alert('تم تسجيل قرار مراجعة النزاع. لم يُنفذ أي استرداد إلكتروني.');await loadSupportProjectClosures();}catch(error){console.error('Support payment dispute decision:',error);alert(error.message||'تعذر حفظ قرار النزاع.');}finally{button.disabled=false;}
});

document.addEventListener('click',async event=>{
  const approve=event.target.closest('[data-support-approve-early-finish]');const reject=event.target.closest('[data-support-reject-early-finish]');if(!approve&&!reject)return;
  const button=approve||reject;if(!confirm(approve?'اعتماد إنهاء العمل المبكر؟ سيُغلق العمل وتبقى التسوية المالية للمراجعة؛ لن يُنفذ استرداد تلقائي.':'رفض الإنهاء المبكر وإبقاء العمل مستمرًا؟'))return;
  button.disabled=true;try{await decideSupportProjectEarlyFinish(button.dataset.supportApproveEarlyFinish||button.dataset.supportRejectEarlyFinish,!!approve);alert(approve?'تم اعتماد الإنهاء، وتم إبقاء التسوية بحالة تحتاج مراجعة.':'تم رفض الإنهاء، والطلب مستمر.');await loadSupportProjectClosures();await loadSupportOrders();}catch(error){console.error('Support early finish decision:',error);alert(error.message||'تعذر حفظ القرار.');}finally{button.disabled=false;}
});

/* =========================================================
   مركز إدارة المعلومات — مالك المنصة فقط
   الأرقام تُقرأ من سجلات Firestore؛ لا تُستخدم أرقام تجريبية.
   ========================================================= */
async function loadOwnerInformationCenter(){
  const employee = supportEmployee;
  if(!employee || employee.role !== "owner"){
    alert("هذا المركز مخصص لمالك منصة مِعدة فقط.");
    supportSetSection("tickets");
    return;
  }
  const statusEl=document.getElementById("ownerInfoStatus");
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
  const safe=v=>String(v??"—").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString("ar-SA",{minimumFractionDigits:2,maximumFractionDigits:2})+" ر.س";
  if(!window.ma3daOwnerOnlineListenerStarted && typeof window.ma3daListenOnlineUsers==="function"){
    window.ma3daOwnerOnlineListenerStarted=true;
    window.ma3daListenOnlineUsers((count,error)=>{
      const onlineEl=document.getElementById("ownerInfoOnlineUsers");
      if(!onlineEl)return;
      if(error){
        onlineEl.textContent="تعذر التحميل";
        console.warn("تعذر تحميل عدد المتصلين الآن:",error);
      }else if(Number.isFinite(count)){
        onlineEl.textContent=String(count);
      }else{
        onlineEl.textContent="—";
      }
    });
  }
  if(statusEl)statusEl.textContent="جارٍ قراءة بيانات المنصة…";
  try{
    if(!window.ma3daDB||typeof window.ma3daCollection!=="function"||typeof window.ma3daGetDocs!=="function")throw new Error("اتصال قاعدة البيانات غير جاهز.");
    const read=async name=>{try{const snap=await window.ma3daGetDocs(window.ma3daCollection(window.ma3daDB,name));const rows=[];snap.forEach(d=>rows.push({id:d.id,...(d.data()||{})}));return rows;}catch(e){console.warn('Owner dashboard collection unavailable:',name,e);return null;}};
    const names=["customers","contractors","operators","projects","equipment","requests","supportTickets","supportStaff","projectInvoices"];
    const result=await Promise.all(names.map(read));const data=Object.fromEntries(names.map((n,i)=>[n,result[i]]));
    const list=n=>Array.isArray(data[n])?data[n]:[];
    const available=n=>Array.isArray(data[n]);
    const customerRows=list("customers"), contractorRows=list("contractors"), operatorRows=list("operators"), projectRows=list("projects"), equipmentRows=list("equipment"), requestRows=list("requests"), ticketRows=list("supportTickets"), staffRows=list("supportStaff"), invoiceRows=list("projectInvoices");
    const ownerIds=new Set(equipmentRows.map(x=>x.ownerId||x.userId||x.createdBy||x.operatorId).filter(Boolean));
    const successfulStatuses=new Set(["completed","paid","settled","success","successful"]);
    const failedStatuses=new Set(["rejected","cancelled","canceled","failed","expired"]);
    const successful=requestRows.filter(x=>successfulStatuses.has(String(x.status||"").toLowerCase())||String(x.paymentStatus||"").toLowerCase()==="paid");
    const failed=requestRows.filter(x=>failedStatuses.has(String(x.status||"").toLowerCase()));
    const isPaid=x=>String(x.paymentStatus||x.status||"").toLowerCase()==="paid"||String(x.paymentStatus||x.status||"").toLowerCase()==="settled";
    const amountOf=x=>{for(const k of ["paidAmount","paidTotal","amountPaid","amount","totalAmount","invoiceAmount","finalAmount"]){const v=Number(x?.[k]);if(x?.[k]!==undefined&&x?.[k]!==null&&Number.isFinite(v)&&v>=0)return v;}return 0;};
    // Total incoming is based on records explicitly marked paid, not merely requested prices.
    const paidInvoices=invoiceRows.filter(isPaid);const paidRequests=requestRows.filter(isPaid);
    const revenueRecords=paidInvoices.length?paidInvoices:paidRequests;
    const revenue=revenueRecords.reduce((sum,x)=>sum+amountOf(x),0);
    const commissionKeys=["commissionAmount","appCommission","platformCommission","commission","commissionTotal"];
    const commissionRecords=[...requestRows,...invoiceRows];
    const commissions=commissionRecords.reduce((sum,x)=>{for(const k of commissionKeys){if(x[k]!==undefined&&x[k]!==null&&Number.isFinite(Number(x[k])))return sum+Math.max(0,Number(x[k]));}return sum;},0);
    set("ownerInfoRevenue",available("projectInvoices")||available("requests")?money(revenue):"غير متاح");
    set("ownerInfoCommissions",available("requests")||available("projectInvoices")?money(commissions):"غير متاح");
    set("ownerInfoRequests",requestRows.length.toLocaleString("ar-SA"));
    if(statusEl)statusEl.textContent="تم تحميل السجلات المتاحة. افتح أي قسم لعرض التفاصيل.";

    const details=document.getElementById("ownerAdminDetails"),title=document.getElementById("ownerAdminDetailsTitle"),content=document.getElementById("ownerAdminDetailsContent");
    const dateText=x=>{const v=x?.updatedAt||x?.createdAt||x?.created_at||x?.timestamp;if(!v)return "التاريخ غير مسجل";const d=v?.toDate?v.toDate():new Date(v);return Number.isNaN(d.getTime())?"التاريخ غير مسجل":d.toLocaleString("ar-SA");};
    const record=(heading,sub="",extra="")=>`<article class="owner-admin-record"><strong>${safe(heading)}</strong>${sub?`<span>${safe(sub)}</span>`:""}${extra?`<small>${safe(extra)}</small>`:""}</article>`;
    const empty=msg=>`<div class="owner-admin-empty">${safe(msg)}</div>`;
    const listHtml=(rows,headingFn,subFn,extraFn,emptyMsg)=>rows.length?rows.map(x=>record(headingFn(x),subFn?subFn(x):"",extraFn?extraFn(x):dateText(x))).join(""):empty(emptyMsg);
    const subcard=(label,value,view)=>`<button type="button" class="owner-admin-subcard" data-owner-view="${safe(view)}">${safe(label)}<strong>${safe(value)}</strong></button>`;
    const openView=async view=>{
      if(!details||!title||!content)return;
      details.hidden=false;let html="";
      if(view==="users"){
        title.textContent="المستخدمون";
        html=`<div class="owner-admin-subcards">${subcard("عدد العملاء",available("customers")?customerRows.length.toLocaleString("ar-SA"):"غير متاح","customers")}${subcard("أصحاب المعدات",available("contractors")?contractorRows.length.toLocaleString("ar-SA"):"غير متاح","contractors")}${subcard("عدد المعدات",available("equipment")?equipmentRows.length.toLocaleString("ar-SA"):"غير متاح","equipment")}${subcard("مسؤولو المشاريع",available("operators")?operatorRows.length.toLocaleString("ar-SA"):"غير متاح","operators")}${subcard("المشاريع القائمة",projectRows.filter(x=>!['completed','closed','cancelled','canceled','archived'].includes(String(x.status||'').toLowerCase())).length.toLocaleString("ar-SA"),"projectsCurrent")}${subcard("المشاريع السابقة",projectRows.filter(x=>['completed','closed','cancelled','canceled','archived'].includes(String(x.status||'').toLowerCase())).length.toLocaleString("ar-SA"),"projectsPrevious")}</div><p>اختر أي بطاقة لعرض البيانات التفصيلية.</p>`;
      }else if(view==="customers"){
        title.textContent="العملاء وبياناتهم";html=listHtml(customerRows,x=>x.name||x.fullName||x.displayName||x.email||x.id,x=>x.phone||x.mobile||x.email||"بيانات التواصل غير مسجلة",x=>`المعرّف: ${x.id}`,"لا توجد بيانات عملاء في مجموعة customers أو تعذرت قراءتها.");
      }else if(view==="contractors"){
        title.textContent="أصحاب المعدات وبياناتهم";html=listHtml(contractorRows,x=>x.name||x.fullName||x.displayName||x.email||x.id,x=>x.phone||x.mobile||x.email||"بيانات التواصل غير مسجلة",x=>`المعدات المرتبطة بالمعرّف: ${equipmentRows.filter(e=>(e.ownerId||e.userId||e.createdBy||e.operatorId)===x.id).length} · المعرّف: ${x.id}`,"لا توجد بيانات أصحاب معدات في مجموعة contractors أو تعذرت قراءتها.");
      }else if(view==="equipment"){
        title.textContent="المعدات المسجلة";html=listHtml(equipmentRows,x=>x.name||x.equipmentName||x.title||x.id,x=>x.ownerName||x.ownerId||x.userId||"المالك غير محدد",x=>`الحالة: ${x.status||"غير محددة"} · المعرّف: ${x.id}`,"لا توجد معدات مسجلة أو تعذرت قراءتها.");
      }else if(view==="operators"){
        title.textContent="مسؤولو المشاريع";html=listHtml(operatorRows,x=>x.name||x.fullName||x.displayName||x.email||x.id,x=>x.phone||x.mobile||x.email||"بيانات التواصل غير مسجلة",x=>`المعرّف: ${x.id}`,"لا توجد بيانات مسؤولي مشاريع أو تعذرت قراءتها.");
      }else if(view==="projectsCurrent"||view==="projectsPrevious"||view==="projects"){
        const previous=view==="projectsPrevious";title.textContent=previous?"المشاريع السابقة":"المشاريع القائمة";const rows=projectRows.filter(x=>{const done=['completed','closed','cancelled','canceled','archived'].includes(String(x.status||'').toLowerCase());return view==="projects"?true:previous?done:!done;});html=listHtml(rows,x=>x.name||x.title||x.projectName||x.id,x=>`الحالة: ${x.status||"غير محددة"}`,x=>`المعرّف: ${x.id}`,"لا توجد مشاريع ضمن هذا القسم.");
      }else if(view==="complaints"){
        title.textContent="الشكاوى وموظفو الدعم";html=`<div class="owner-admin-subcards">${subcard("عدد الشكاوى",available("supportTickets")?ticketRows.length.toLocaleString("ar-SA"):"غير متاح","tickets")}${subcard("موظفو الدعم",available("supportStaff")?staffRows.filter(x=>x.active!==false&&x.role!=="owner").length.toLocaleString("ar-SA"):"غير متاح","staff")}${subcard("التصعيدات الواردة","عرض التصعيدات","escalations")}</div><p>اختر الشكاوى أو موظفي الدعم أو التصعيدات الواردة لعرض التفاصيل.</p>`;
      }else if(view==="tickets"){
        title.textContent="الشكاوى";html=listHtml(ticketRows,x=>x.subject||x.title||x.category||"شكوى",x=>x.message||x.description||"لا يوجد وصف مسجل",x=>`الحالة: ${x.status||"غير محددة"} · المعرّف: ${x.id}`,"لا توجد شكاوى مسجلة أو تعذرت قراءتها.");
      }else if(view==="staff"){
        title.textContent="إحصائيات موظفي الدعم وتقييماتهم";const staffOnly=staffRows.filter(x=>x.role!=="owner");html=staffOnly.length?staffOnly.map(x=>{const sid=x.id||x.uid;const solved=ticketRows.filter(t=>String(t.closedBy||t.assignedTo||t.supportStaffId||"")===String(sid)&&(String(t.status||"").toLowerCase().match(/closed|resolved|complete|completed|مغلقة|مغلق|تم الحل/))).length;const rated=ticketRows.filter(t=>String(t.supportStaffId||t.closedBy||t.assignedTo||"")===String(sid)&&Number(t.supportRating)>0);const avg=rated.length?(rated.reduce((s,t)=>s+Number(t.supportRating),0)/rated.length).toFixed(2):"لا توجد تقييمات";return record(x.name||x.fullName||x.displayName||x.email||sid,`الشكاوى التي حلّها: ${solved} · متوسط التقييم: ${avg}${rated.length?" / 5":""}`,`عدد التقييمات: ${rated.length} · ملاحظات الجمهور: ${x.publicFeedback||x.feedback||x.notes||x.customerFeedback||"لا توجد ملاحظات مسجلة"} · الحالة: ${x.active===false?"غير نشط":"نشط"}`)}).join(""):empty("لا توجد بيانات موظفي دعم أو تعذرت قراءتها.");
      }else if(view==="notes"){
        title.textContent="الملاحظات اليومية لمالك التطبيق";
        html='<div class="owner-admin-record"><label for="ownerDailyNoteInput">ملاحظة اليوم</label><textarea id="ownerDailyNoteInput" rows="4" maxlength="5000" placeholder="اكتب ملاحظاتك عن أداء العمل أو التطبيق..."></textarea><button id="ownerDailyNoteSaveBtn" class="support-btn support-primary" type="button">حفظ الملاحظة</button><p id="ownerDailyNoteFeedback" role="status"></p></div><div id="ownerDailyNotesList" class="owner-admin-record">جارٍ تحميل الملاحظات...</div>';
        content.innerHTML=html;
        // اربط زر الحفظ قبل قراءة السجل؛ فتعذر القراءة لا يجب أن يعطّل الزر نفسه.
        const save=document.getElementById("ownerDailyNoteSaveBtn");
        if(save)save.onclick=async()=>{
          const field=document.getElementById("ownerDailyNoteInput"),feedback=document.getElementById("ownerDailyNoteFeedback"),textValue=(field?.value||"").trim();
          if(!textValue){if(feedback)feedback.textContent="اكتب الملاحظة أولًا.";return;}
          save.disabled=true;
          try{
            const u=window.ma3daGetCurrentUser?await window.ma3daGetCurrentUser():window.ma3daAuth?.currentUser;
            if(!u)throw new Error("يجب تسجيل الدخول كمالك المنصة.");
            await window.ma3daAddDoc(window.ma3daCollection(window.ma3daDB,"ownerDailyNotes"),{text:textValue,createdBy:u.uid,createdByEmail:u.email||"",createdAt:new Date(),createdAtMs:Date.now()});
            if(feedback)feedback.textContent="تم حفظ الملاحظة.";
            openView("notes");
          }catch(e){
            console.error("تعذر حفظ الملاحظة اليومية:",e);
            if(feedback)feedback.textContent=e.code==="permission-denied"?"رفضت قواعد Firebase حفظ الملاحظة (permission-denied). تحقق من صلاحية مالك التطبيق لمجموعة ownerDailyNotes.":(e.message||"تعذر حفظ الملاحظة.");
          }finally{save.disabled=false;}
        };
        try{
          const ns=await window.ma3daGetDocs(window.ma3daCollection(window.ma3daDB,"ownerDailyNotes"));
          const notes=[];ns.forEach(d=>notes.push({id:d.id,...(d.data()||{})}));
          notes.sort((a,b)=>Number(b.createdAtMs||0)-Number(a.createdAtMs||0));
          const list=document.getElementById("ownerDailyNotesList");
          if(list)list.innerHTML=notes.length?notes.map(n=>`<article class="owner-admin-record"><strong>${safe(n.createdByEmail||"مالك التطبيق")} · ${safe(n.createdAtMs?new Date(n.createdAtMs).toLocaleString("ar-SA"):"")}</strong><span style="white-space:pre-wrap">${safe(n.text||"")}</span></article>`).join(""):"لا توجد ملاحظات محفوظة بعد.";
        }catch(e){
          console.error("تعذر تحميل الملاحظات اليومية:",e);
          const list=document.getElementById("ownerDailyNotesList");
          if(list)list.textContent=e.code==="permission-denied"?"رفضت قواعد Firebase قراءة الملاحظات (permission-denied). تحقق من صلاحية مالك التطبيق لمجموعة ownerDailyNotes.":"تعذر تحميل الملاحظات اليومية: "+(e.message||"خطأ غير معروف.");
        }
        details.scrollIntoView({behavior:"smooth",block:"start"});return;
      }else if(view==="escalations"){
        title.textContent="التصعيدات الواردة من موظفي الدعم";
        try{
          const es=await window.ma3daGetDocs(window.ma3daCollection(window.ma3daDB,"supportEscalations"));
          const rows=[];es.forEach(d=>rows.push({id:d.id,...(d.data()||{})}));
          rows.sort((a,b)=>Number(b.createdAtMs||0)-Number(a.createdAtMs||0));
          html=rows.length?rows.map(x=>`<article class="owner-admin-record"><strong>${safe(x.ticketSubject||"شكوى")} · ${safe(x.status||"open")==="open"?"مفتوحة":"قيد المتابعة"}</strong><span>موظف الدعم: ${safe(x.staffName||x.staffEmail||x.staffId||"غير محدد")}</span><span>سبب التصعيد: ${safe(x.reason||"—")}</span><small>رقم الشكوى: ${safe(x.ticketId||"—")} · ${safe(x.createdAtMs?new Date(x.createdAtMs).toLocaleString("ar-SA"):"")}</small><label>ملاحظة مالك التطبيق</label><textarea data-escalation-note="${safe(x.id)}" rows="2" maxlength="2000" placeholder="اكتب الإجراء أو الملاحظة"></textarea><button type="button" class="support-btn support-primary" data-save-escalation-note="${safe(x.id)}">حفظ الملاحظة</button></article>`).join(""):"لا توجد تصعيدات حتى الآن.";
        }catch(e){
          console.error("تعذر تحميل التصعيدات:",e);
          html=`<div class="owner-admin-empty">${safe(e.code==="permission-denied"?"رفضت قواعد Firebase قراءة التصعيدات (permission-denied). تحقق من صلاحية مالك التطبيق لمجموعة supportEscalations.":"تعذر تحميل التصعيدات: "+(e.message||"خطأ غير معروف."))}</div>`;
        }
      }else if(view==="requests"){
        title.textContent="الطلبات الناجحة وغير الناجحة";html=`<div class="owner-admin-subcards">${subcard("عدد الطلبات الناجحة",successful.length.toLocaleString("ar-SA"),"requestsSuccess")}${subcard("عدد الطلبات غير الناجحة",failed.length.toLocaleString("ar-SA"),"requestsFailed")}</div>`;
      }else if(view==="requestsSuccess"||view==="requestsFailed"){
        const rows=view==="requestsSuccess"?successful:failed;title.textContent=view==="requestsSuccess"?"الطلبات الناجحة":"الطلبات غير الناجحة";html=listHtml(rows,x=>x.equipmentName||x.title||x.requestType||x.id,x=>`الحالة: ${x.status||"غير محددة"} · المبلغ: ${money(amountOf(x))}`,x=>`المعرّف: ${x.id}`,"لا توجد طلبات في هذا القسم.");
      }else if(view==="money"){
        title.textContent="إجمالي المبالغ الداخلة عبر التطبيق";html=`<div class="owner-admin-record"><strong>${money(revenue)}</strong><span>المجموع من السجلات المتاحة المعلّمة بأنها مدفوعة.</span><small>${paidInvoices.length?"المصدر: projectInvoices":"المصدر: requests"}. لا تشمل هذه القيمة السجلات التي لم تسجل حالة دفع مؤكدة.</small></div>`;
      }else if(view==="commissions"){
        title.textContent="إجمالي عمولات التطبيق";html=`<div class="owner-admin-record"><strong>${money(commissions)}</strong><span>مجموع حقول العمولات الصريحة الموجودة في سجلات الطلبات والفواتير.</span><small>إذا كانت قاعدة البيانات لا تحفظ العمولة في حقول مثل commissionAmount أو appCommission أو platformCommission أو commission، فسيظهر صفرًا حتى يُعتمد اسم حقل العمولة الفعلي.</small></div>`;
      }
      content.innerHTML=html;
      details.scrollIntoView({behavior:"smooth",block:"start"});
    };
    document.querySelectorAll('[data-owner-view]').forEach(btn=>{if(btn.dataset.ownerBound==='1')return;btn.dataset.ownerBound='1';btn.addEventListener('click',()=>openView(btn.dataset.ownerView));});
    const close=document.getElementById("ownerAdminDetailsClose");if(close&&close.dataset.ownerBound!=='1'){close.dataset.ownerBound='1';close.addEventListener('click',()=>{details.hidden=true;});}
    const refresh=document.getElementById("ownerPortalRefreshBtn");if(refresh&&refresh.dataset.ownerBound!=='1'){refresh.dataset.ownerBound='1';refresh.addEventListener('click',()=>loadOwnerInformationCenter());}
    // Attach handlers to nested detail cards rendered after the first click.
    if(content&&content.dataset.ownerDelegation!=='1'){
      content.dataset.ownerDelegation='1';content.addEventListener('click',async e=>{const b=e.target.closest('[data-owner-view]');if(b){openView(b.dataset.ownerView);return;}const saveEsc=e.target.closest('[data-save-escalation-note]');if(saveEsc){try{const id=saveEsc.dataset.saveEscalationNote;const field=content.querySelector(`[data-escalation-note="${id}"]`);const u=window.ma3daGetCurrentUser?await window.ma3daGetCurrentUser():window.ma3daAuth?.currentUser;if(!u)throw new Error("يجب تسجيل الدخول كمالك المنصة.");await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,"supportEscalations",id),{ownerNote:(field?.value||"").trim(),ownerNoteBy:u.uid,ownerNoteAt:new Date(),status:"reviewed"});alert("تم حفظ ملاحظة التصعيد.");}catch(err){console.error(err);alert("تعذر حفظ الملاحظة. تحقق من صلاحيات Firebase.");}}});
    }
  }catch(error){
    console.error("Owner information center load failed:",error);
    if(statusEl)statusEl.textContent="تعذر تحميل البيانات. تحقق من اتصال Firebase وصلاحيات القراءة.";
  }
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
 
    loadSupportReports(),
    loadSupportProjectClosures()
 
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
   تسجيل دخول مالك المنصة — بوابة مستقلة عن موظفي الدعم
   ========================================================= */
async function ownerPortalLogin(){
  const email = document.getElementById("ownerPortalEmailInput")?.value?.trim();
  const password = document.getElementById("ownerPortalPasswordInput")?.value;
  const error = document.getElementById("ownerPortalLoginError");
  const button = document.getElementById("ownerPortalLoginBtn");
  if(error) error.textContent = "";
  if(!email){ if(error) error.textContent = "اكتب البريد الإلكتروني لمالك المنصة."; return; }
  if(!password){ if(error) error.textContent = "اكتب كلمة المرور."; return; }
  if(typeof window.ma3daLogin !== "function"){
    if(error) error.textContent = "خدمة تسجيل الدخول غير جاهزة.";
    return;
  }
  if(button){ button.disabled = true; button.textContent = "جاري التحقق..."; }
  try{
    await window.ma3daLogin(email, password);
    await new Promise(resolve => setTimeout(resolve, 500));
    const currentUser = window.ma3daAuth?.currentUser;
    if(!currentUser) throw new Error("تعذر التعرف على حساب مالك المنصة.");
    const ref = window.ma3daDoc(window.ma3daDB, "supportStaff", currentUser.uid);
    const snapshot = await window.ma3daGetDoc(ref);
    const data = snapshot.exists() ? (snapshot.data() || {}) : {};
    if(data.role !== "owner" || data.active === false){
      try{ if(typeof window.ma3daLogout === "function") await window.ma3daLogout(); }catch(_e){}
      throw new Error("هذا الحساب ليس حساب مالك منصة مفعّلًا.");
    }
    supportEmployee = { user: currentUser, role: "owner", data };
    localStorage.setItem("supportEmployee", JSON.stringify({uid: currentUser.uid, email: currentUser.email || email, role: "owner"}));
    openSupportScreen("ownerPortalDashboardScreen");
    await loadOwnerInformationCenter();
  }catch(err){
    console.error("خطأ دخول مالك المنصة:", err);
    if(error) error.textContent = err?.message || "تعذر تسجيل الدخول.";
  }finally{
    if(button){ button.disabled = false; button.textContent = "دخول مالك المنصة"; }
  }
}

/* =========================================================
   زر دخول موظفي الدعم من صفحة اختيار الدور
   ========================================================= */
 
function initHiddenOwnerPortalEntry(){
  const roleScreen = document.getElementById("roleScreen");
  const trigger = roleScreen?.querySelector(".hero-icon");
  if(!trigger || trigger.dataset.ownerPortalReady) return;
  trigger.dataset.ownerPortalReady = "true";
  let taps = 0;
  let resetHandle;
  trigger.addEventListener("click", () => {
    taps += 1;
    clearTimeout(resetHandle);
    resetHandle = setTimeout(() => { taps = 0; }, 2200);
    if(taps >= 7){
      taps = 0;
      clearTimeout(resetHandle);
      openSupportScreen("ownerPortalLoginScreen");
      const error = document.getElementById("ownerPortalLoginError");
      if(error) error.textContent = "أدخل بيانات حساب مالك المنصة المصرح به.";
    }
  });
}

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

          if(section === "ownerInfo" && supportEmployee?.role !== "owner"){
            alert("هذا القسم مخصص لمالك المنصة فقط.");
            return;
          }
 
          supportSetSection(
            section
          );
          if(section === "ownerInfo") await loadOwnerInformationCenter();
 
 
          if(section === "tickets"){
 
            await loadSupportTickets();
 
          }
 
 
          if(section === "customers"){
 
            await loadSupportUsers();
 
          }
 
 
          if(section === "operators"){
 
            await loadSupportEquipment();
 
          }

          if(section === "equipmentEdits"){
            if(typeof window.ma3daLoadPendingEquipmentEdits === 'function') await window.ma3daLoadPendingEquipmentEdits();
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
          if(section === "projectClosures"){
            await loadSupportProjectClosures();
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
  initHiddenOwnerPortalEntry();
  const ownerLoginBtn = document.getElementById("ownerPortalLoginBtn");
  if(ownerLoginBtn && !ownerLoginBtn.dataset.ownerPortalReady){
    ownerLoginBtn.dataset.ownerPortalReady = "true";
    ownerLoginBtn.addEventListener("click", ownerPortalLogin);
  }
  const ownerBackBtn = document.getElementById("ownerPortalBackBtn");
  if(ownerBackBtn && !ownerBackBtn.dataset.ownerPortalReady){
    ownerBackBtn.dataset.ownerPortalReady = "true";
    ownerBackBtn.addEventListener("click", () => openSupportScreen("roleScreen"));
  }
  const ownerLogout = document.getElementById("ownerPortalLogoutBtn");
  if(ownerLogout && !ownerLogout.dataset.ownerPortalReady){
    ownerLogout.dataset.ownerPortalReady = "true";
    ownerLogout.addEventListener("click", supportLogout);
  }
 
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
 
  /* 05 — وظائف المقاول: تحميل بيانات المقاول وحسابه */
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
  await getContractorUser();
 
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
  console.error("Save contractor error:", error);

  alert(
    "سبب فشل الحفظ:\n" +
    (error?.code || "بدون رمز") +
    "\n" +
    (error?.message || "خطأ غير معروف")
  );
}
        
        finally {
 
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
 
  /* 05 — وظائف المقاول: الصفحة الرئيسية والتنقل */
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
     CONTRACTOR PROJECT + NEARBY EQUIPMENT FLOW
     New flow: save a project first, then choose a nearby machine.
     Requests still use requests/{requestId}; chat path is unchanged.
  ========================================================= */
  let contractorSelectedProject = null;
  let contractorEditingProjectId = null;
  let contractorProjectFilter = 'current';
  let contractorProjectMap = null;
  let contractorProjectMarker = null;
  let contractorNearbyEquipmentCache = [];

  function contractorLoadLeaflet(){
    if(window.L)return window.L;
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-ma3da-leaflet]');
      const tag=existing||document.createElement('script');
      let settled=false;
      const finish=(error)=>{
        if(settled)return;
        settled=true;
        clearTimeout(timeoutId);
        tag.removeEventListener('load',onLoad);
        tag.removeEventListener('error',onError);
        if(error)reject(error);
        else if(window.L)resolve(window.L);
        else reject(new Error('Leaflet unavailable'));
      };
      const onLoad=()=>finish(window.L?null:new Error('Leaflet unavailable'));
      const onError=()=>finish(new Error('Map library failed'));
      const timeoutId=setTimeout(()=>finish(new Error('Map library timed out')),8000);
      tag.addEventListener('load',onLoad,{once:true});
      tag.addEventListener('error',onError,{once:true});
      if(!existing){
        tag.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        tag.async=true;
        tag.dataset.ma3daLeaflet='1';
        document.head.appendChild(tag);
      }else if(existing.dataset.ma3daLeafletLoaded==='1'){
        finish(window.L?null:new Error('Leaflet unavailable'));
      }
    });
  }

  async function contractorInitProjectMap(){
    const mapEl=document.getElementById('contractorProjectMap');
    if(!mapEl)return;
    try{
      const L=await contractorLoadLeaflet();
      if(!contractorProjectMap){
        contractorProjectMap=L.map(mapEl).setView([24.7136,46.6753],5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(contractorProjectMap);
        contractorProjectMap.on('click',event=>contractorSetProjectCoordinates(event.latlng.lat,event.latlng.lng,true));
      }
      const lat=Number(document.getElementById('contractorProjectLat')?.value);
      const lng=Number(document.getElementById('contractorProjectLng')?.value);
      if(Number.isFinite(lat)&&Number.isFinite(lng)&&lat!==0&&lng!==0){contractorProjectMap.setView([lat,lng],13);contractorSetProjectCoordinates(lat,lng,false);}
      setTimeout(()=>contractorProjectMap.invalidateSize(),150);
    }catch(error){
      console.warn('Project map unavailable:',error);
      mapEl.innerHTML='<div style="padding:18px">تعذر تحميل الخريطة. تأكد من الاتصال بالإنترنت، أو استخدم زر تحديد موقعي الحالي.</div>';
    }
  }

  function contractorSetProjectCoordinates(lat,lng,moveMap){
    const latInput=document.getElementById('contractorProjectLat');
    const lngInput=document.getElementById('contractorProjectLng');
    if(latInput)latInput.value=Number(lat).toFixed(6);
    if(lngInput)lngInput.value=Number(lng).toFixed(6);
    if(window.L&&contractorProjectMap){
      if(contractorProjectMarker)contractorProjectMarker.setLatLng([lat,lng]);
      else contractorProjectMarker=window.L.marker([lat,lng]).addTo(contractorProjectMap);
      if(moveMap)contractorProjectMap.setView([lat,lng],14);
    }
  }

  async function contractorStartProjectForm(project=null){
    contractorEditingProjectId=project?.id||null;
    contractorSelectedProject=project||null;
    const values={
      contractorProjectName:project?.name||project?.projectName||'',
      contractorProjectCity:project?.city||contractorGetProfile()?.city||'',
      contractorProjectLocationText:project?.address||project?.location||'',
      contractorProjectLat:project?.latitude??project?.coordinates?.latitude??'',
      contractorProjectLng:project?.longitude??project?.coordinates?.longitude??'',
      contractorProjectNotes:project?.notes||''
    };
    Object.entries(values).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.value=value;});
    const heading=document.querySelector('#contractorRequestScreen .hero h1');
    if(heading)heading.textContent=project?'تعديل بيانات المشروع':'إنشاء مشروعك';
    const submit=document.getElementById('submitContractorRequestBtn');
    if(submit)submit.textContent=project?'حفظ تعديلات المشروع':'حفظ المشروع';
    contractorShowScreen('contractorRequestScreen');
    contractorInitProjectMap().catch(error=>console.warn('Project map initialization skipped:',error));
  }
  const contractorCreateProjectBtn=document.getElementById('contractorCreateProjectBtn');
  if(contractorCreateProjectBtn)contractorCreateProjectBtn.addEventListener('click',()=>contractorStartProjectForm());

  const contractorUseMyLocationBtn=document.getElementById('contractorUseMyLocationBtn');
  if(contractorUseMyLocationBtn)contractorUseMyLocationBtn.addEventListener('click',()=>{
    if(!navigator.geolocation){alert('تحديد الموقع غير مدعوم في هذا المتصفح.');return;}
    contractorUseMyLocationBtn.disabled=true;contractorUseMyLocationBtn.textContent='جارٍ تحديد الموقع…';
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat=pos.coords.latitude,lng=pos.coords.longitude;contractorSetProjectCoordinates(lat,lng,true);
      if(contractorProjectMap)contractorProjectMap.setView([lat,lng],14);
      if(window.L&&!contractorProjectMap)contractorInitProjectMap().then(()=>contractorSetProjectCoordinates(lat,lng,true));
      contractorUseMyLocationBtn.disabled=false;contractorUseMyLocationBtn.textContent='📍 استخدام موقعي الحالي';
    },err=>{alert('تعذر تحديد الموقع. اسمح للمتصفح باستخدام الموقع أو اختر نقطة على الخريطة.');contractorUseMyLocationBtn.disabled=false;contractorUseMyLocationBtn.textContent='📍 استخدام موقعي الحالي';},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
  });

  const submitContractorRequestBtn=document.getElementById('submitContractorRequestBtn');
  if(submitContractorRequestBtn)submitContractorRequestBtn.addEventListener('click',async()=>{
    const user=await getContractorUser();if(!user || !user.uid){alert('يجب تسجيل الدخول أولاً.');return;}
    const name=document.getElementById('contractorProjectName')?.value.trim();
    const city=document.getElementById('contractorProjectCity')?.value.trim();
    const address=document.getElementById('contractorProjectLocationText')?.value.trim()||'';
    const lat=Number(document.getElementById('contractorProjectLat')?.value);
    const lng=Number(document.getElementById('contractorProjectLng')?.value);
    const notes=document.getElementById('contractorProjectNotes')?.value.trim()||'';
    if(!name||!city){alert('اكتب اسم المشروع والمدينة.');return;}
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat===0||lng===0){alert('حدد موقع المشروع على الخريطة أو استخدم موقعك الحالي.');return;}
    if(!window.ma3daAddDoc||!window.ma3daCollection){alert('قاعدة البيانات غير جاهزة.');return;}
    submitContractorRequestBtn.disabled=true;submitContractorRequestBtn.textContent='جارٍ حفظ المشروع…';
    const editingId=contractorEditingProjectId;
    const returnProjectFilter=editingId?contractorProjectFilter:'current';
    try{
      const profile=contractorGetProfile()||{};const now=new Date();
      const projectData={contractorId:user.uid,ownerId:user.uid,contractorName:profile.name||'',contractorPhone:profile.phone||'',contractorCompany:profile.company||'',name,projectName:name,city,location:address||city,address,latitude:lat,longitude:lng,coordinates:{latitude:lat,longitude:lng},notes,status:editingId?(contractorSelectedProject?.status||'active'):'active',updatedAt:now};
      if(editingId){
        await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'projects',editingId),projectData);
        alert('تم تحديث بيانات المشروع بنجاح.');
      }else{
        projectData.createdAt=now;
        await window.ma3daAddDoc(window.ma3daCollection(window.ma3daDB,'projects'),projectData);
        alert('تم حفظ المشروع بنجاح. افتحه من المشاريع الحالية لطلب معدة خاصة به.');
      }
      contractorEditingProjectId=null;contractorSelectedProject=null;
      contractorShowScreen('contractorProjectsScreen');contractorSetProjectFilter(returnProjectFilter);
    }catch(error){console.error('Save contractor project error:',error);alert(error?.code==='permission-denied'?'لا توجد صلاحية لحفظ أو تعديل المشاريع في Firebase.':'تعذر حفظ المشروع. تحقق من الاتصال وقواعد Firebase.');}
    finally{submitContractorRequestBtn.disabled=false;submitContractorRequestBtn.textContent='حفظ المشروع';}
  });

  const cancelContractorRequestBtn=document.getElementById('cancelContractorRequestBtn');
  if(cancelContractorRequestBtn)cancelContractorRequestBtn.addEventListener('click',async()=>{contractorEditingProjectId=null;contractorShowScreen('contractorProjectsScreen');await loadContractorProjects();});
  const contractorPickerBackBtn=document.getElementById('contractorPickerBackBtn');
  if(contractorPickerBackBtn)contractorPickerBackBtn.addEventListener('click',async()=>{contractorShowScreen('contractorProjectsScreen');await loadContractorProjects();});
  const contractorRefreshTrackingBtn=document.getElementById('contractorRefreshTrackingBtn');if(contractorRefreshTrackingBtn)contractorRefreshTrackingBtn.addEventListener('click',loadContractorProjectRequestTracking);
    const contractorRefreshEquipmentBtn=document.getElementById('contractorRefreshEquipmentBtn');
  if(contractorRefreshEquipmentBtn)contractorRefreshEquipmentBtn.addEventListener('click',loadContractorNearbyEquipment);
  const contractorEquipmentTypeSelect=document.getElementById('contractorEquipmentType');
  if(contractorEquipmentTypeSelect)contractorEquipmentTypeSelect.addEventListener('change',renderContractorNearbyEquipment);

  function contractorCoordinatesForEquipment(data){
    const lat=Number(data.latitude??data.lat??data.locationLatitude??data.coordinates?.latitude??data.location?.latitude);
    const lng=Number(data.longitude??data.lng??data.lon??data.locationLongitude??data.coordinates?.longitude??data.location?.longitude);
    return Number.isFinite(lat)&&Number.isFinite(lng)&&lat!==0&&lng!==0?{lat,lng}:null;
  }
  function contractorDistanceKm(a,b){
    const rad=n=>n*Math.PI/180;const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);
    const q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
    return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
  }
  async function loadContractorNearbyEquipment(){
    const list=document.getElementById('contractorNearbyEquipmentList');if(!list)return;
    if(!contractorSelectedProject){list.innerHTML='<div class="card">اختر مشروعًا أولاً.</div>';return;}
    list.innerHTML='<div class="card">جارٍ تحميل المعدات…</div>';
    try{
      const snap=await window.ma3daGetDocs(window.ma3daCollection(window.ma3daDB,'equipment'));
      const projectPoint={lat:Number(contractorSelectedProject.latitude),lng:Number(contractorSelectedProject.longitude)};
      contractorNearbyEquipmentCache=[];
      snap.forEach(docSnap=>{
        const d=docSnap.data()||{};if(docSnap.id===getContractorUser()?.uid&&!d.ownerId)return;
        const ownerId=d.ownerId||d.operatorId||d.userId||(docSnap.id!==getContractorUser()?.uid?docSnap.id:'');
        const type=d.type||d.equipmentType||d.name||'';
        const availability=d.availability||d.status||'';
        if(d.equipmentStatus==='cancelled'||availability==='unavailable'||d.isAvailable===false||d.availability===false)return;
        if(d.verificationStatus&&d.verificationStatus!=='verified'&&d.verificationStatus!=='approved')return;
        const point=contractorCoordinatesForEquipment(d);
        const distance=point?contractorDistanceKm(projectPoint,point):null;
        const sameCity=String(d.city||'').trim().toLowerCase()===String(contractorSelectedProject.city||'').trim().toLowerCase() && !!d.city;
        contractorNearbyEquipmentCache.push({id:docSnap.id,...d,ownerId,type,_distanceKm:distance,_sameCity:sameCity,_point:point});
      });
      contractorNearbyEquipmentCache.sort((a,b)=>{
        if(a._distanceKm==null&&b._distanceKm!=null)return 1;if(a._distanceKm!=null&&b._distanceKm==null)return -1;
        if(a._distanceKm==null&&b._distanceKm==null&&a._sameCity!==b._sameCity)return a._sameCity?-1:1;
        return (a._distanceKm??999999)-(b._distanceKm??999999);
      });
      renderContractorNearbyEquipment();
    }catch(error){console.error('Load nearby contractor equipment error:',error);list.innerHTML='<div class="card">تعذر تحميل المعدات. تحقق من صلاحيات قراءة مجموعة equipment في Firebase.</div>';}
  }
  function renderContractorNearbyEquipment(){
    const list=document.getElementById('contractorNearbyEquipmentList');if(!list)return;
    const filter=document.getElementById('contractorEquipmentType')?.value||'';
    const rows=contractorNearbyEquipmentCache.filter(item=>!filter||item.type===filter||item.equipmentType===filter||item.name===filter);
    const equipmentSelect=document.getElementById('contractorSelectedEquipment');
    if(equipmentSelect){const previous=equipmentSelect.value;equipmentSelect.innerHTML='<option value="">اختر المعدة المطلوبة</option>'+rows.map(item=>{const label=[item.type||item.equipmentType||item.name||'معدة',item.model].filter(Boolean).join(' — ');return `<option value="${escapeContractorHtml(item.id)}">${escapeContractorHtml(label)}${item.city?' — '+escapeContractorHtml(item.city):''}</option>`;}).join('');if(rows.some(item=>item.id===previous))equipmentSelect.value=previous;}
    if(!rows.length){list.innerHTML='<div class="card"><h3>لا توجد معدات مطابقة حالياً</h3><p>جرّب نوعًا آخر أو حدّث قائمة المعدات. تظهر المسافة عندما تكون إحداثيات المعدة محفوظة في ملف صاحبها.</p></div>';return;}
    list.innerHTML=rows.map(item=>{
      const distance=item._distanceKm==null?(item._sameCity?'في مدينة المشروع — الإحداثيات غير متاحة':'المسافة غير متاحة'): `${item._distanceKm.toFixed(1)} كم من المشروع`;
      const title=[item.type||item.equipmentType||item.name||'معدة',item.model].filter(Boolean).join(' — ');
      const price=Number(item.hourlyPrice||item.price||0);
      const image=item.image||item.imageUrl||item.photo||'';
      const location=item.city||item.location||'المدينة غير محددة';
      return `<div class="contractor-equipment-card">${image?`<img src="${escapeContractorHtml(image)}" alt="صورة المعدة">`:''}<h3>🚜 ${escapeContractorHtml(title)}</h3><p>📍 ${escapeContractorHtml(location)}</p><p class="contractor-distance">${escapeContractorHtml(distance)}</p><p>💰 ${price?`${price} ريال / ساعة`:'السعر غير محدد'}</p><p>⭐ ${escapeContractorHtml(item.rating??item.averageRating??'غير متوفر')}</p><button type="button" class="back-btn" data-contractor-choose-equipment="${escapeContractorHtml(item.id)}">اختيار هذه المعدة</button></div>`;
    }).join('');
  }
  // New project workflow helpers: cent-safe totals and calendar/work-day calculations.
  function ma3daProjectCents(value){return Math.round((Number(value)||0)*100);}
  function ma3daProjectMoney(cents){return Math.round(Number(cents)||0)/100;}
  function ma3daProjectEndDate(start, count, unit){
    const end=new Date(start);
    if(unit==='weeks')end.setDate(end.getDate()+count*7);
    else if(unit==='months'){const day=end.getDate();end.setDate(1);end.setMonth(end.getMonth()+count);const lastDay=new Date(end.getFullYear(),end.getMonth()+1,0).getDate();end.setDate(Math.min(day,lastDay));}
    else end.setDate(end.getDate()+count);
    return end;
  }
  function ma3daCountProjectWorkDays(start, end, workDays){
    const active=new Set((Array.isArray(workDays)?workDays:[]).map(Number));
    let total=0;const cursor=new Date(start);cursor.setHours(0,0,0,0);
    const limit=new Date(end);limit.setHours(0,0,0,0);
    for(;cursor<limit;cursor.setDate(cursor.getDate()+1)){if(active.has(cursor.getDay()))total++;}
    return total;
  }
  function ma3daBuildProjectPaymentSchedule(total, plan){
    const totalCents=ma3daProjectCents(total);let amounts=[],labels=[],dueRules=[];
    if(plan==='half_half'){
      const first=Math.round(totalCents/2);amounts=[first,totalCents-first];labels=['الدفعة الأولى — 50% مقدّمًا','الدفعة الثانية — 50% عند انتهاء العمل'];dueRules=['on_acceptance','work_completion'];
    }else if(plan==='four_installments'){
      const base=Math.floor(totalCents/4);amounts=[base,base,base,totalCents-base*3];labels=['الدفعة الأولى من أربع دفعات','الدفعة الثانية من أربع دفعات','الدفعة الثالثة من أربع دفعات','الدفعة الرابعة من أربع دفعات'];dueRules=['on_acceptance','scheduled_installment_2','scheduled_installment_3','work_completion'];
    }else if(plan==='full_upfront'){
      amounts=[totalCents];labels=['كامل المبلغ مقدّمًا'];dueRules=['on_acceptance'];
    }else if(plan==='cash'){
      amounts=[totalCents];labels=['فاتورة السداد النقدي — عند الاستحقاق والتوثيق'];dueRules=['cash_verification_at_completion'];
    }else{
      amounts=[totalCents];labels=['كامل المبلغ عند انتهاء العمل'];dueRules=['work_completion'];
    }
    return amounts.map((cents,index)=>({installment:index+1,label:labels[index],amount:ma3daProjectMoney(cents),amountCents:cents,status:dueRules[index]==='on_acceptance'?'due':'not_due',dueRule:dueRules[index],paidAmount:0,paidAt:null,receiptReference:'',reviewStatus:'unpaid'}));
  }

  async function ma3daCreateSharedProjectInvoices(requestId, request, schedule){
    if(!window.ma3daDB||typeof window.ma3daAddDoc!=='function'||typeof window.ma3daGetDocs!=='function')throw new Error('خدمة الفواتير غير جاهزة.');
    const invoiceCollection=window.ma3daCollection(window.ma3daDB,'projectInvoices');
    const existingSnap=await window.ma3daGetDocs(invoiceCollection);
    const existing=[];existingSnap.forEach(doc=>{const d=doc.data()||{};if(d.requestId===requestId&&d.invoiceKind==='agreement_installment')existing.push({...d,id:doc.id});});
    const createdIds=[];const total=Math.round(Number(request.price||0)*100)/100;
    const start=request.scheduledStartAt?.toDate?request.scheduledStartAt.toDate():new Date(request.scheduledStartAt||Date.now());
    const end=request.scheduledEndAt?.toDate?request.scheduledEndAt.toDate():new Date(request.scheduledEndAt||start.getTime());
    for(let index=0;index<schedule.length;index++){
      const item=schedule[index];const prior=existing.find(x=>Number(x.installmentIndex)===index+1);
      if(prior){createdIds.push(prior.id);continue;}
      let dueAt=null;
      if(item.dueRule==='on_acceptance')dueAt=new Date();
      else if(item.dueRule==='work_completion'||item.dueRule==='cash_verification_at_completion')dueAt=end;
      else if(item.dueRule==='scheduled_installment_2')dueAt=new Date(start.getTime()+(end.getTime()-start.getTime())/3);
      else if(item.dueRule==='scheduled_installment_3')dueAt=new Date(start.getTime()+2*(end.getTime()-start.getTime())/3);
      const invoiceNumber='M3-P-'+requestId+'-'+(index+1);
      const stableInvoiceId='M3P_'+String(requestId).replace(/[^a-zA-Z0-9_-]/g,'_')+'_'+(index+1);
      const invoiceRef=window.ma3daDoc(window.ma3daDB,'projectInvoices',stableInvoiceId);
      await window.ma3daRunTransaction(async tx=>{const already=await tx.get(invoiceRef);if(already.exists())return;tx.set(invoiceRef,{
        invoiceKind:'agreement_installment',invoiceNumber,requestId,projectId:request.projectId||'',projectName:request.projectName||'',
        contractorId:request.contractorId||request.requesterId||request.customerId||'',contractorName:request.contractorName||'',
        ownerId:request.equipmentOwnerId||request.ownerId||request.operatorId||'',equipmentOwnerId:request.equipmentOwnerId||request.ownerId||request.operatorId||'',
        equipment:request.equipment||'معدة',equipmentId:request.equipmentId||'',equipmentModel:request.equipmentModel||'',
        installmentIndex:index+1,installmentCount:schedule.length,installmentLabel:item.label,paymentPlan:request.paymentPlan||'',
        invoiceAmount:Math.round(Number(item.amount||0)*100)/100,agreementTotal:total,paidAmount:0,remainingAmount:Math.round(Number(item.amount||0)*100)/100,
        currency:'SAR',description:`${item.label} — ${request.equipment||'معدة'} — ${request.projectName||'مشروع'}`,
        dueRule:item.dueRule,dueAt:dueAt||null,paymentMethod:request.paymentPlan==='cash'?'cash':'gateway',
        status:'issued',paymentStatus:'unpaid',settlementStatus:'settlement_pending',paymentEvents:[],financialPolicyVersion:'ma3da-finance-v1',createdBy:request.contractorId||request.requesterId||'',createdAt:new Date(),updatedAt:new Date(),schemaVersion:5
      });
      });
      if(invoiceRef?.id)createdIds.push(invoiceRef.id);
    }
    await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'requests',requestId),{paymentInvoiceIds:createdIds,paymentInvoicesCreatedAt:new Date(),paymentInvoiceSchemaVersion:4,updatedAt:new Date()});
    return createdIds;
  }
  window.ma3daCreateSharedProjectInvoices=ma3daCreateSharedProjectInvoices;

  async function escalateActiveTicket(){
    if(!activeTicket?.id) { setFeedback('supportTicketReplyFeedback','افتح شكوى من القائمة أولًا قبل التصعيد.'); return; }
    const reason=prompt('اشرح لمالك التطبيق سبب التصعيد وما الذي تعذر حله:');
    if(reason===null)return;
    if(!reason.trim()){setFeedback('supportTicketReplyFeedback','اكتب سبب التصعيد قبل الإرسال.');return;}
    const button=$('supportTicketEscalateBtn');if(button){button.disabled=true;button.textContent='جارٍ إرسال التصعيد...';}
    try{
      const user=await getUser();
      if(!window.ma3daDB||typeof window.ma3daAddDoc!=='function'||typeof window.ma3daCollection!=='function')throw new Error('خدمة Firebase غير جاهزة.');
      await window.ma3daAddDoc(window.ma3daCollection(window.ma3daDB,'supportEscalations'),{
        ticketId:activeTicket.id, ticketSubject:activeTicket.subject||activeTicket.title||'شكوى',
        ticketDescription:activeTicket.message||activeTicket.description||'',
        requesterId:activeTicket.requesterId||activeTicket.userId||'',
        staffId:user.uid, staffEmail:user.email||'', staffName:supportEmployee?.data?.name||user.email||'موظف الدعم',
        reason:reason.trim(), status:'open', createdAt:new Date(), createdAtMs:Date.now()
      });
      setFeedback('supportTicketReplyFeedback','تم إرسال التصعيد إلى مالك التطبيق.');
      alert('تم تصعيد الشكوى إلى مالك التطبيق.');
    }catch(err){
      console.error('تعذر تصعيد الشكوى:',err);
      const msg=err.code==='permission-denied'?'رفضت قواعد Firebase إنشاء التصعيد (permission-denied). يلزم السماح لموظف الدعم النشط بإنشاء مستند في supportEscalations.':(err.message||'تعذر إرسال التصعيد.');
      setFeedback('supportTicketReplyFeedback',msg);alert(msg);
    }finally{if(button){button.disabled=false;button.textContent='تصعيد إلى مالك التطبيق';}}
  }

  document.addEventListener('click',async event=>{
    const chooseButton=event.target.closest('[data-contractor-choose-equipment]');
    const submitButton=event.target.closest('#contractorSubmitProjectEquipmentRequestBtn');
    if(!chooseButton&&!submitButton)return;
    const equipmentSelect=document.getElementById('contractorSelectedEquipment');
    if(chooseButton){if(equipmentSelect)equipmentSelect.value=chooseButton.dataset.contractorChooseEquipment;equipmentSelect?.scrollIntoView({behavior:'smooth',block:'center'});equipmentSelect?.focus();return;}
    const selectedEquipmentId=equipmentSelect?.value||'';
    const equipment=contractorNearbyEquipmentCache.find(row=>row.id===selectedEquipmentId);if(!equipment){alert('اختر المعدة المطلوبة من خانة اختيار المعدة أولًا.');return;}if(!contractorSelectedProject)return;
    const button=submitButton;
    const user=await getContractorUser();if(!user || !user.uid){alert('يجب تسجيل الدخول أولاً.');return;}
    const startValue=document.getElementById('contractorScheduledStartAt')?.value||'';
    const startAt=startValue?new Date(startValue):null;
    const durationUnit=document.getElementById('contractorDurationUnit')?.value||'days';
    const durationCount=Math.max(1,Math.min(365,Number(document.getElementById('contractorDurationCount')?.value||1)));
    const dailyStartTime=document.getElementById('contractorDailyStartTime')?.value||'';
    const dailyEndTime=document.getElementById('contractorDailyEndTime')?.value||'';
    const workDays=[...document.querySelectorAll('input[name="contractorWorkday"]:checked')].map(el=>Number(el.value)).sort((a,b)=>a-b);
    const paymentPlan=document.getElementById('contractorPaymentPlan')?.value||'';
    const installmentCount=4;
    const paymentTerms=document.getElementById('contractorPaymentTerms')?.value.trim()||'';
    const operator=document.getElementById('contractorOperator')?.value||'مع مشغل';
    const notes=document.getElementById('contractorNotes')?.value.trim()||'';
    if(!startAt||Number.isNaN(startAt.getTime())){alert('حدد تاريخ ووقت بداية العمل بشكل صحيح.');return;}
    if(!dailyStartTime||!dailyEndTime||dailyEndTime<=dailyStartTime){alert('وقت نهاية التشغيل اليومي يجب أن يكون بعد وقت البداية.');return;}
    if(!workDays.length){alert('حدد يوم تشغيل واحدًا على الأقل.');return;}
    if(!paymentPlan||!paymentTerms){alert('اختر طريقة الدفع واكتب شروط الدفع والتسوية قبل إرسال الطلب.');return;}
    const hoursPerWorkday=(()=>{const [sh,sm]=dailyStartTime.split(':').map(Number);const [eh,em]=dailyEndTime.split(':').map(Number);return (eh*60+em-sh*60-sm)/60;})();
    const hourlyPrice=Number(equipment.hourlyPrice||equipment.price||0);
    const durationLabel=durationUnit==='weeks'?`${durationCount} أسبوع`:durationUnit==='months'?`${durationCount} شهر`:`${durationCount} يوم`;
    if(!Number.isInteger(durationCount)||durationCount<1||durationCount>365){alert('أدخل مدة من يوم إلى 365 يومًا/أسبوعًا/شهرًا.');return;}
    const exclusiveEnd=ma3daProjectEndDate(startAt,durationCount,durationUnit);exclusiveEnd.setHours(0,0,0,0);
    const scheduleEnd=new Date(exclusiveEnd);scheduleEnd.setDate(scheduleEnd.getDate()-1);const [endHour,endMinute]=dailyEndTime.split(':').map(Number);scheduleEnd.setHours(endHour,endMinute,0,0);
    const startDay=new Date(startAt);startDay.setHours(0,0,0,0);
    const scheduledWorkDays=ma3daCountProjectWorkDays(startDay,exclusiveEnd,workDays);
    if(scheduledWorkDays<=0){alert('المدة المختارة لا تحتوي أي يوم تشغيل حسب جدولك. عدّل تاريخ البداية أو مدة المشروع أو أيام التشغيل.');return;}
    const hours=hoursPerWorkday*scheduledWorkDays;const price=ma3daProjectMoney(ma3daProjectCents(hourlyPrice*hours));
    if(!Number.isFinite(price)||price<=0){alert('تعذر احتساب القيمة. تحقق من سعر الساعة وجدول التشغيل.');return;}
    button.disabled=true;button.textContent='جارٍ إرسال الطلب…';
    try{
      const profile=contractorGetProfile()||{};const paymentSchedule=ma3daBuildProjectPaymentSchedule(price,paymentPlan);const requestData={location:contractorSelectedProject.address||contractorSelectedProject.city,projectId:contractorSelectedProject.id,projectName:contractorSelectedProject.name||contractorSelectedProject.projectName||'',projectCity:contractorSelectedProject.city,projectLatitude:contractorSelectedProject.latitude,projectLongitude:contractorSelectedProject.longitude,projectCoordinates:contractorSelectedProject.coordinates,equipment:equipment.type||equipment.equipmentType||equipment.name||'معدة',equipmentId:equipment.id,equipmentOwnerId:equipment.ownerId||equipment.operatorId||equipment.userId||'',equipmentModel:equipment.model||'',equipmentImage:equipment.image||equipment.imageUrl||'',equipmentCity:equipment.city||'',equipmentLatitude:contractorCoordinatesForEquipment(equipment)?.lat??null,equipmentLongitude:contractorCoordinatesForEquipment(equipment)?.lng??null,distanceKm:equipment._distanceKm,duration:durationLabel,durationUnit,durationCount,durationHours:hours,scheduledStartAt:startAt,scheduledEndAt:scheduleEnd,dailyStartTime,dailyEndTime,workDays,scheduledWorkDays,restDays:[0,1,2,3,4,5,6].filter(day=>!workDays.includes(day)),hoursPerWorkday,operator,notes,price,originalPrice:price,hourlyPrice,paymentPlan,installmentCount,paymentTerms,paymentStatus:'unpaid',paymentSchedule,paymentLedger:[],paidTotal:0,remainingBalance:price,financialPolicyVersion:'ma3da-finance-v1',agreementVersion:1,agreementStatus:'awaiting_owner_decision',extensionStatus:'none',extensionHistory:[],workStatus:'awaiting_acceptance',earlyFinishStatus:'none',earlyFinishHistory:[],settlementPolicy:paymentTerms,customerId:user.uid,customerEmail:user.email||'',requesterId:user.uid,requesterRole:'contractor',requesterType:'contractor',contractorId:user.uid,contractorName:profile.name||'',contractorPhone:profile.phone||'',contractorCity:profile.city||'',contractorCompany:profile.company||'',status:'searching',createdAt:new Date(),updatedAt:new Date()};
      const result=await window.ma3daAddDoc(window.ma3daCollection(window.ma3daDB,'requests'),requestData);
      const trackingSection=document.getElementById('contractorProjectTrackingSection');
      if(trackingSection)trackingSection.hidden=false;
      alert('تم إرسال طلب المعدة لهذا المشروع بنجاح. ستظهر حالة الطلب في قسم المتابعة أسفل الصفحة.');
      await loadContractorProjectRequestTracking();
      document.getElementById('contractorProjectTrackingSection')?.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){console.error('Send selected equipment request error:',error);alert(error?.code==='permission-denied'?'لا توجد صلاحية لإرسال الطلب في Firebase.':'تعذر إرسال الطلب حالياً.');}
    finally{button.disabled=false;button.textContent='إرسال طلب المعدة';}
  });

  /* =========================================================
     PROJECT REQUEST LIFECYCLE: EXTENSIONS + AGREEMENT AUDIT
     This replaces the old implicit hourly-only project request behavior.
  ========================================================= */
  async function contractorRequestProjectExtension(requestId, extraCount, extraUnit, reason){
    const user=await getContractorUser();if(!user?.uid)throw new Error('سجّل الدخول أولًا.');
    const ref=window.ma3daDoc(window.ma3daDB,'requests',requestId);const snap=await window.ma3daGetDoc(ref);
    if(!snap.exists())throw new Error('طلب المعدة غير موجود.');const r=snap.data()||{};
    if((r.contractorId||r.requesterId||r.customerId)!==user.uid)throw new Error('لا تملك صلاحية طلب تمديد هذا الطلب.');
    if(!r.projectId)throw new Error('التمديد متاح لطلبات المشاريع فقط.');
    if(!(['working','duration_expired'].includes(String(r.status||'')) || ['working','duration_expired'].includes(String(r.workStatus||''))))throw new Error('لا يمكن طلب التمديد إلا بعد بدء التشغيل أو انتهاء المدة مع استمرار العمل.');
    if(r.extensionStatus==='pending')throw new Error('يوجد طلب تمديد بانتظار رد صاحب المعدة.');
    const count=Math.max(1,Math.min(365,Number(extraCount||1)));const unit=['days','weeks','months'].includes(extraUnit)?extraUnit:'days';
    const originalEnd=r.scheduledEndAt?.toDate?r.scheduledEndAt.toDate():new Date(r.scheduledEndAt||Date.now());const end=ma3daProjectEndDate(originalEnd,count,unit);
    const workDays=Array.isArray(r.workDays)?r.workDays.map(Number):[0,1,2,3,4];const startDay=new Date(originalEnd);startDay.setDate(startDay.getDate()+1);startDay.setHours(0,0,0,0);const endExclusive=new Date(end);endExclusive.setDate(endExclusive.getDate()+1);endExclusive.setHours(0,0,0,0);let addedDays=0;for(let d=new Date(startDay);d<endExclusive;d.setDate(d.getDate()+1)){if(workDays.includes(d.getDay()))addedDays++;}
    if(addedDays<=0)throw new Error('مدة التمديد لا تشمل أيام تشغيل وفق الجدول المسجل. اختر مدة أخرى.');
    const extensionHours=addedDays*Number(r.hoursPerWorkday||10);const extensionAmount=Math.round(extensionHours*Number(r.agreedHourlyPrice??r.hourlyPrice??0)*100)/100;
    await window.ma3daUpdateDoc(ref,{status:'extension_requested',extensionStatus:'pending',extensionRequest:{requestedBy:user.uid,requestedAt:new Date(),count,unit,reason:String(reason||'').slice(0,500),fromEndAt:originalEnd,toEndAt:end,addedWorkDays:addedDays,addedHours:extensionHours,proposedAmount:extensionAmount,priceBasis:'original_hourly_price'},updatedAt:new Date()});
  }
  async function operatorDecideProjectExtension(requestId, approve){
    const user=await getOperatorCurrentUser();if(!user?.uid)throw new Error('سجّل الدخول بحساب صاحب المعدة.');
    const ref=window.ma3daDoc(window.ma3daDB,'requests',requestId);const snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('طلب المعدة غير موجود.');const r=snap.data()||{};
    if((r.equipmentOwnerId||r.ownerId||r.operatorId)!==user.uid)throw new Error('لا تملك صلاحية الرد على هذا التمديد.');
    if(r.extensionStatus!=='pending'||!r.extensionRequest)throw new Error('لا يوجد طلب تمديد معلق.');
    const now=new Date();const ext=r.extensionRequest;
    if(approve){
      const oldEnd=ext.fromEndAt?.toDate?ext.fromEndAt.toDate():new Date(ext.fromEndAt);const newEnd=ext.toEndAt?.toDate?ext.toEndAt.toDate():new Date(ext.toEndAt);
      const baseEnd=r.scheduledEndAt?.toDate?r.scheduledEndAt.toDate():new Date(r.scheduledEndAt||oldEnd);
      const agreedPrice=Math.round(Number(r.agreedPrice??r.price??0)*100)/100;const added=Math.round(Number(ext.proposedAmount||0)*100)/100;
      const updatedTotal=ma3daProjectMoney(ma3daProjectCents(r.price||0)+ma3daProjectCents(added));const updatedRemaining=ma3daProjectMoney(ma3daProjectCents(r.remainingBalance??Math.max(0,Number(r.price||0)-Number(r.paidTotal||0)))+ma3daProjectCents(added));const paymentSchedule=[...(Array.isArray(r.paymentSchedule)?r.paymentSchedule:[]),{installment:(Array.isArray(r.paymentSchedule)?r.paymentSchedule.length:0)+1,label:'قيمة التمديد',amount:added,amountCents:ma3daProjectCents(added),status:r.paymentPlan==='full_upfront'?'due':'not_due',dueRule:'extension_completion',paidAmount:0,paidAt:null,reviewStatus:'unpaid'}];
      await window.ma3daUpdateDoc(ref,{status:'accepted',extensionStatus:'approved',scheduledEndAt:newEnd,extensionHistory:[...(Array.isArray(r.extensionHistory)?r.extensionHistory:[]),{...ext,approvedBy:user.uid,approvedAt:now,approvedAmount:added,previousEndAt:baseEnd}],paymentSchedule,price:updatedTotal,remainingBalance:updatedRemaining,expectedTotalAfterExtension:updatedTotal,extensionApprovedAt:now,extensionApprovedBy:user.uid,workStatus:'working',agreementVersion:Number(r.agreementVersion||1)+1,updatedAt:now});
    }else{
      await window.ma3daUpdateDoc(ref,{status:(r.status==='duration_expired'||r.workStatus==='duration_expired'?'duration_expired':r.workStatus==='working'?'working':'accepted'),extensionStatus:'rejected',extensionDecision:{decidedBy:user.uid,decidedAt:now,reason:'رفض صاحب المعدة للتمديد'},supportReviewRequired:false,updatedAt:now});
    }
  }
  document.addEventListener('click',async event=>{
    const approve=event.target.closest('[data-approve-extension]');const reject=event.target.closest('[data-reject-extension]');if(!approve&&!reject)return;
    const btn=approve||reject;btn.disabled=true;
    try{await operatorDecideProjectExtension(btn.dataset.approveExtension||btn.dataset.rejectExtension,!!approve);alert(approve?'تمت الموافقة على التمديد وتحديث نهاية المدة والقيمة.':'تم رفض التمديد وتسجيل الحالة لمراجعة الدعم.');await loadOperatorNewRequests();}
    catch(err){console.error('Project extension decision failed:',err);alert(err.message||'تعذر حفظ قرار التمديد.');}
    finally{btn.disabled=false;}
  });

  async function loadContractorProjectRequestTracking(){
    const target=document.getElementById('contractorProjectEquipmentTracking');if(!target||!contractorSelectedProject)return;
    try{
      const user=await getContractorUser();if(!user?.uid){target.innerHTML='<div class="card">سجّل الدخول لعرض طلبات المشروع.</div>';return;}
      const requestCollection=window.ma3daCollection(window.ma3daDB,'requests');
      const requestQuery=window.ma3daQuery&&window.ma3daWhere
        ? window.ma3daQuery(requestCollection,window.ma3daWhere('projectId','==',contractorSelectedProject.id))
        : requestCollection;
      const snap=await window.ma3daGetDocs(requestQuery);const rows=[];
      snap.forEach(doc=>{const r=doc.data()||{};if(r.projectId===contractorSelectedProject.id&&(r.contractorId||r.requesterId||r.customerId)===user.uid)rows.push({id:doc.id,...r});});
      const trackingSection=document.getElementById('contractorProjectTrackingSection');
      if(trackingSection)trackingSection.hidden=rows.length===0;
      if(!rows.length){target.innerHTML='<div class="card">بعد إرسال طلب المعدة، ستظهر متابعته هنا.</div>';return;}
      const now=Date.now();
      for(const r of rows){
        const endMs=operatorRequestDateValue(r.scheduledEndAt);
        if(r.status==='accepted'&&r.projectId&&r.workStatus==='working'&&endMs&&endMs<now&&r.extensionStatus!=='pending'&&r.workStatus!=='completed_early'){
          // Mark expiry as a reviewable state only; never auto-complete or extend a contract.
          try{await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'requests',r.id),{status:'duration_expired',durationExpiredAt:new Date(),workStatus:'duration_expired',updatedAt:new Date()});r.status='duration_expired';r.workStatus='duration_expired';}catch(expiryError){console.warn('Could not mark project duration expiry:',expiryError);}
        }
      }
      const money=n=>`${Number(n||0).toLocaleString('ar-SA',{maximumFractionDigits:2})} ريال`;
      target.innerHTML=rows.sort((a,b)=>operatorRequestDateValue(b.createdAt)-operatorRequestDateValue(a.createdAt)).map(r=>{
        const endDate=r.scheduledEndAt?.toDate?r.scheduledEndAt.toDate():r.scheduledEndAt?new Date(r.scheduledEndAt):null;
        const paid=Number(r.paidTotal||0);const remaining=Number(r.remainingBalance??Math.max(0,Number(r.price||0)-paid));
        const schedule=Array.isArray(r.paymentSchedule)?r.paymentSchedule:[];
        const paymentHtml=schedule.length?'<h4>خطة الدفعات</h4>'+schedule.map((p,i)=>{const statusText=({due:'مستحقة',not_due:'غير مستحقة',pending_review:'بانتظار مراجعة صاحب المعدة',paid:'مدفوعة',disputed:'متنازع عليها'})[p.status]||p.status||'—';const dueAmount=Math.max(0,Number(p.amount||0)-Number(p.paidAmount||0));return `<div class="ma3da-payment-line"><strong>${escapeContractorHtml(p.label||('الدفعة '+(i+1)))}</strong><p>${money(dueAmount)} — ${escapeContractorHtml(statusText)}</p>${p.status==='due'?`<button type="button" class="back-btn" data-project-payment-submit="${escapeContractorHtml(r.id)}" data-installment-index="${i}">إرسال إثبات الدفعة للمراجعة</button>`:''}${['due','pending_review','paid'].includes(p.status)?`<button type="button" class="back-btn" data-project-payment-dispute="${escapeContractorHtml(r.id)}" data-installment-index="${i}">اعتراض على هذه الدفعة</button>`:''}</div>`;}).join(''):'<p>لا توجد خطة دفعات مسجلة.</p>';
        const canExtend=(['working','duration_expired'].includes(String(r.status||''))||['working','duration_expired'].includes(String(r.workStatus||'')))&&r.extensionStatus!=='pending'&&!['approved','pending_support'].includes(r.earlyFinishStatus);
        const canEarlyFinish=(['working','duration_expired'].includes(String(r.status||''))||['working','duration_expired'].includes(String(r.workStatus||'')))&&!['pending_support','approved'].includes(r.earlyFinishStatus);
        return `<div class="contractor-tracking-item"><h3>${escapeContractorHtml(r.equipment||'معدة')} — ${escapeContractorHtml(r.equipmentModel||'')}</h3><p><strong>الحالة:</strong> ${escapeContractorHtml(({searching:'بانتظار صاحب المعدة',accepted:'مقبول — بانتظار التشغيل/مستمر',working:'قيد التشغيل',duration_expired:'انتهت المدة — بانتظار قرار الأطراف',extension_requested:'طلب تمديد معلّق',rejected:'مرفوض',completed:'منتهٍ',cancelled:'ملغى'})[r.status]||r.status||'—')}</p><p><strong>المدة:</strong> ${escapeContractorHtml(r.duration||'—')} · ${escapeContractorHtml(r.dailyStartTime||'—')}–${escapeContractorHtml(r.dailyEndTime||'—')}</p><p><strong>أيام التشغيل:</strong> ${escapeContractorHtml((r.workDays||[]).map(d=>['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][Number(d)]||'').filter(Boolean).join('، ')||'—')}</p><p><strong>نهاية المدة:</strong> ${endDate&&!Number.isNaN(endDate.getTime())?escapeContractorHtml(endDate.toLocaleString('ar-SA')):'—'}</p><p><strong>القيمة المتفق عليها:</strong> ${money(r.price)} · <strong>المدفوع:</strong> ${money(paid)} · <strong>المتبقي:</strong> ${money(remaining)}</p><p><strong>طريقة الدفع:</strong> ${escapeContractorHtml(({half_half:'50% مقدّمًا و50% عند انتهاء العمل',four_installments:'أربع دفعات',full_upfront:'كامل المبلغ مقدّمًا',full_end:'كامل المبلغ عند انتهاء العمل',cash:'نقدًا مع توثيق الاستلام'})[r.paymentPlan]||r.paymentPlan||'—')}</p><p><strong>شروط التسوية:</strong> ${escapeContractorHtml(r.settlementPolicy||r.paymentTerms||'—')}</p>${paymentHtml}${r.extensionStatus==='pending'?'<p>طلب التمديد بانتظار صاحب المعدة. لا تتغير المدة أو القيمة قبل الموافقة.</p>':r.extensionStatus==='rejected'?'<p>رُفض التمديد. تواصل مع صاحب المعدة والدعم إذا استمر العمل.</p>':''}${r.earlyFinishStatus==='pending_support'?'<p>طلب الإنهاء المبكر بانتظار قرار موظف الدعم.</p>':''}${r.earlyFinishStatus==='approved'?'<p>اعتمد الدعم إنهاء العمل؛ التسوية المالية ما زالت بحاجة إلى مراجعة.</p>':''}${canExtend?`<button type="button" class="main-btn" data-contractor-extend="${escapeContractorHtml(r.id)}">طلب تمديد المدة</button>`:''}${canEarlyFinish?`<button type="button" class="back-btn" data-contractor-early-finish="${escapeContractorHtml(r.id)}">طلب إنهاء مبكر عبر الدعم</button>`:''}</div>`;
      }).join('');
    }catch(err){console.error('Project request tracking failed:',err);const trackingSection=document.getElementById('contractorProjectTrackingSection');if(trackingSection)trackingSection.hidden=false;target.innerHTML='<div class="card">تعذر تحميل متابعة الطلب الآن. اضغط تحديث للمحاولة مجددًا.</div>';}
  }

  document.addEventListener('click',async event=>{
    const pay=event.target.closest('[data-project-payment-submit]');const early=event.target.closest('[data-contractor-early-finish]');const dispute=event.target.closest('[data-project-payment-dispute]');if(!pay&&!early&&!dispute)return;
    const button=pay||early||dispute;button.disabled=true;
    try{
      const user=await getContractorUser();if(!user?.uid)throw new Error('سجّل الدخول أولًا.');
      const requestId=pay?pay.dataset.projectPaymentSubmit:early?early.dataset.contractorEarlyFinish:dispute.dataset.projectPaymentDispute;const ref=window.ma3daDoc(window.ma3daDB,'requests',requestId);const snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');const r=snap.data()||{};
      if((r.contractorId||r.requesterId||r.customerId)!==user.uid||!r.projectId)throw new Error('لا تملك صلاحية هذا الطلب.');
      if(pay){if(typeof window.ma3daOpenProjectInvoicePayment!=='function')throw new Error('افتح صفحة الفواتير المشتركة لتسجيل الدفعة.');await window.ma3daOpenProjectInvoicePayment(requestId,Number(pay.dataset.installmentIndex));return;}
      if(dispute){
        const index=Number(dispute.dataset.installmentIndex);const schedule=Array.isArray(r.paymentSchedule)?r.paymentSchedule.slice():[];const item=schedule[index];if(!item||!['due','pending_review','paid'].includes(item.status))throw new Error('لا يمكن الاعتراض على هذه الدفعة في حالتها الحالية.');
        const reason=prompt('اكتب سبب الاعتراض على الدفعة؛ سيبقى المبلغ محل مراجعة الدعم:','');if(reason===null)return;if(!reason.trim())throw new Error('اكتب سبب الاعتراض.');
        const disputes=Array.isArray(r.paymentDisputes)?r.paymentDisputes.slice():[];if(disputes.some(d=>Number(d.installmentIndex)===index&&d.status==='pending_support'))throw new Error('يوجد اعتراض قائم على هذه الدفعة.');
        const amount=Math.max(0,Number(item.amount||0)-Number(item.paidAmount||0));const entry={id:`${Date.now()}_${index}`,installmentIndex:index,label:item.label||`الدفعة ${index+1}`,amount:amount||Number(item.amount||0),reason:reason.trim().slice(0,1000),requestedBy:user.uid,requestedAt:new Date(),status:'pending_support'};disputes.push(entry);schedule[index]={...item,status:'disputed',disputeId:entry.id};const ledger=(Array.isArray(r.paymentLedger)?r.paymentLedger:[]).map(x=>Number(x.installmentIndex)===index&&x.status==='pending_owner_review'?{...x,status:'disputed'}:x);
        await window.ma3daUpdateDoc(ref,{paymentDisputes:disputes,paymentSchedule:schedule,paymentLedger:ledger,settlementStatus:'disputed',settlementReviewRequired:true,updatedAt:new Date()});alert('تم تعليق مراجعة الدفعة وإرسال الاعتراض للدعم.');
      }else if(pay){
        const index=Number(pay.dataset.installmentIndex);const schedule=Array.isArray(r.paymentSchedule)?r.paymentSchedule.slice():[];const item=schedule[index];if(!item||item.status!=='due')throw new Error('هذه الدفعة ليست مستحقة الآن.');
        const dueAmount=Math.max(0,Number(item.amount||0)-Number(item.paidAmount||0));const amount=Number(prompt(`المتبقي من الدفعة: ${dueAmount.toFixed(2)} ريال. أدخل المبلغ الذي حولته:`,String(dueAmount)));if(!Number.isFinite(amount)||amount<=0||amount>dueAmount)throw new Error('قيمة الدفعة غير صحيحة.');
        const reference=prompt('أدخل رقم مرجع التحويل أو ملاحظة الإثبات. لا يتم التحقق من التحويل إلكترونيًا هنا:','');if(reference===null)return;
        const ledger=Array.isArray(r.paymentLedger)?r.paymentLedger.slice():[];const entry={id:`${Date.now()}_${index}`,installmentIndex:index,amount,reference:String(reference).slice(0,160),submittedBy:user.uid,submittedAt:new Date(),status:'pending_owner_review'};ledger.push(entry);schedule[index]={...item,status:'pending_review',submittedAmount:amount,submittedAt:new Date(),receiptReference:String(reference).slice(0,160)};
        await window.ma3daUpdateDoc(ref,{paymentLedger:ledger,paymentSchedule:schedule,paymentStatus:'pending_review',updatedAt:new Date()});alert('تم تسجيل إثبات الدفعة للمراجعة. لم يُعتبر المبلغ مدفوعًا بعد.');
      }else{
        if(!['accepted','working','duration_expired'].includes(String(r.status||'')))throw new Error('لا يمكن طلب الإنهاء المبكر في حالة الطلب الحالية.');
        if(['pending_support','approved'].includes(r.earlyFinishStatus))throw new Error('يوجد طلب إنهاء مبكر قائم أو معتمد.');
        const reason=prompt('اشرح سبب طلب إنهاء العمل قبل الموعد، مع ذكر ما تم إنجازه وأي اتفاق على التسوية:','');if(reason===null)return;if(!reason.trim())throw new Error('اكتب سبب الإنهاء المبكر.');
        await window.ma3daUpdateDoc(ref,{earlyFinishStatus:'pending_support',earlyFinishRequest:{requestedBy:user.uid,requestedByRole:'contractor',requestedAt:new Date(),previousStatus:r.status||'working',reason:reason.trim().slice(0,1000)},settlementReviewRequired:true,updatedAt:new Date()});alert('أُرسل طلب الإنهاء إلى موظفي الدعم. سيبقى الطلب مفتوحًا حتى يراجع الدعم السبب والتسوية.');
      }
      await loadContractorProjectRequestTracking();
    }catch(error){console.error('Project payment/early finish action:',error);alert(error.message||'تعذر حفظ الإجراء.');}finally{button.disabled=false;}
  });

  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-contractor-extend]');if(!button)return;
    const countText=prompt('كم مدة التمديد؟ أدخل عدد الأيام أو الأسابيع أو الأشهر:','1');if(countText===null)return;
    const count=Number(countText);if(!Number.isFinite(count)||count<1||count>365){alert('أدخل مدة صحيحة من 1 إلى 365.');return;}
    const unitText=prompt('اكتب وحدة المدة: days للأيام، weeks للأسابيع، months للأشهر','days');if(unitText===null)return;
    const reason=prompt('سبب طلب التمديد (اختياري):','');button.disabled=true;
    try{await contractorRequestProjectExtension(button.dataset.contractorExtend,count,unitText,reason);alert('أُرسل طلب التمديد لصاحب المعدة. لن تتغير المدة أو القيمة حتى يوافق.');await loadContractorProjectRequestTracking();}
    catch(err){console.error('Request extension failed:',err);alert(err.message||'تعذر إرسال طلب التمديد.');}finally{button.disabled=false;}
  });

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
 
        contractorProjectFilter = 'current';
        contractorShowScreen(
          "contractorProjectsScreen"
        );
        contractorSetProjectFilter('current');
 
      }
    );
 
  }
 
 
  function contractorIsPreviousProject(project){
    const status=String(project.status||'active').toLowerCase();
    return ['completed','complete','closed','cancelled','canceled','previous','archived','منتهي','مكتمل','ملغي','ملغى','سابق'].includes(status);
  }
  function contractorSetProjectFilter(filter){
    contractorProjectFilter=filter==='previous'?'previous':'current';
    document.querySelectorAll('[data-contractor-project-filter]').forEach(btn=>{
      const active=btn.dataset.contractorProjectFilter===contractorProjectFilter;
      btn.setAttribute('aria-pressed',String(active));btn.classList.toggle('main-btn',active);btn.classList.toggle('back-btn',!active);
    });
    loadContractorProjects();
  }
  document.querySelectorAll('[data-contractor-project-filter]').forEach(btn=>btn.addEventListener('click',()=>contractorSetProjectFilter(btn.dataset.contractorProjectFilter)));

  /* 05 — وظائف المقاول: المشاريع الحالية والسابقة */
async function loadContractorProjects() {
    const list=document.getElementById('contractorProjectsList');if(!list)return;
    const user=await getContractorUser();if(!user || !user.uid){list.innerHTML='<div class="card">سجّل الدخول لعرض مشاريعك.</div>';return;}
    list.innerHTML='<div class="card"><p>جارٍ تحميل المشاريع…</p></div>';
    try{
      const all=await ma3daReadUserRows('projects', ['contractorId','ownerId','userId'], user.uid);
      all.sort((a,b)=>{const at=a.createdAt?.seconds??(a.createdAt instanceof Date?a.createdAt.getTime()/1000:Number(a.createdAt)||0);const bt=b.createdAt?.seconds??(b.createdAt instanceof Date?b.createdAt.getTime()/1000:Number(b.createdAt)||0);return bt-at;});
      const projects=all.filter(project=>contractorProjectFilter==='previous'?contractorIsPreviousProject(project):!contractorIsPreviousProject(project));
      if(!projects.length){list.innerHTML=contractorProjectFilter==='previous'?'<div class="card"><h3>لا توجد مشاريع سابقة</h3><p>ستظهر هنا المشاريع التي تم إنهاؤها.</p></div>':'<div class="card"><h3>لا توجد مشاريع حالية</h3><p>أنشئ مشروعك أولًا، ثم افتحه لطلب معدة مرتبطة به.</p><button type="button" class="main-btn" id="contractorCreateFirstProjectBtn">＋ إنشاء مشروعك</button></div>';const first=document.getElementById('contractorCreateFirstProjectBtn');if(first)first.addEventListener('click',()=>contractorStartProjectForm());return;}
      list.innerHTML=projects.map(project=>{
        const previous=contractorIsPreviousProject(project);
        const location=[project.city,project.address||project.location].filter(Boolean).join(' — ')||'الموقع غير محدد';
        const mapLink=project.latitude&&project.longitude?`<a href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(project.latitude)}&mlon=${encodeURIComponent(project.longitude)}#map=15/${encodeURIComponent(project.latitude)}/${encodeURIComponent(project.longitude)}" target="_blank" rel="noopener">عرض الموقع على الخريطة</a>`:'لا توجد إحداثيات محفوظة';
        return `<div class="card"><h3>🏗️ ${escapeContractorHtml(project.name||project.projectName||'مشروع بدون اسم')}</h3><p>📍 ${escapeContractorHtml(location)}</p><p>الحالة: ${previous?'مشروع سابق':'مشروع حالي'}</p><p>${mapLink}</p><button type="button" class="main-btn" data-contractor-edit-project="${escapeContractorHtml(project.id)}">تعديل بيانات المشروع</button>${previous?'':`<button type="button" class="main-btn" data-contractor-project-request="${escapeContractorHtml(project.id)}">طلب معدة لهذا المشروع</button><button type="button" class="back-btn" data-contractor-complete-project="${escapeContractorHtml(project.id)}">نقل إلى المشاريع السابقة</button>`}</div>`;
      }).join('');
    }catch(error){console.error('Load contractor projects error:',error);list.innerHTML='<div class="card"><p>تعذر تحميل المشاريع. تأكد من صلاحيات قراءة مجموعة projects في Firebase.</p></div>';}
  }

  document.addEventListener('click',async event=>{
    const editButton=event.target.closest('[data-contractor-edit-project]');
    if(editButton){
      try{const user=await getContractorUser();const ref=window.ma3daDoc(window.ma3daDB,'projects',editButton.dataset.contractorEditProject);const snap=await window.ma3daGetDoc(ref);if(!snap.exists()||(snap.data().contractorId||snap.data().ownerId||snap.data().userId)!==user?.uid){alert('تعذر فتح المشروع أو لا تملك صلاحية الوصول إليه.');return;}await contractorStartProjectForm({id:snap.id,...snap.data()});}
      catch(error){console.error('Edit contractor project error:',error);alert('تعذر فتح بيانات المشروع للتعديل.');}return;
    }
    const completeButton=event.target.closest('[data-contractor-complete-project]');
    if(completeButton){
      if(!confirm('هل تريد نقل هذا المشروع إلى المشاريع السابقة؟'))return;
      try{const user=await getContractorUser();const ref=window.ma3daDoc(window.ma3daDB,'projects',completeButton.dataset.contractorCompleteProject);const snap=await window.ma3daGetDoc(ref);if(!snap.exists()||(snap.data().contractorId||snap.data().ownerId||snap.data().userId)!==user?.uid){alert('لا تملك صلاحية تعديل هذا المشروع.');return;}const requestRows=await ma3daReadUserRows('requests',['contractorId','requesterId'],user.uid);let openWork=false;requestRows.forEach(r=>{r=r||{};if(r.projectId===completeButton.dataset.contractorCompleteProject&&(r.contractorId||r.requesterId)===user.uid){const requestStatus=String(r.status||'');const unfinished=!['completed','rejected','cancelled'].includes(requestStatus);const settlementNeedsReview=['needs_settlement','disputed','under_review'].includes(String(r.settlementStatus||''));const unsettled=['rejected','cancelled'].includes(requestStatus)?(Number(r.paidTotal||0)>0||settlementNeedsReview):(Number(r.remainingBalance??r.price??0)>0||settlementNeedsReview);if(unfinished||unsettled)openWork=true;}});if(openWork){alert('لا يمكن نقل المشروع إلى المشاريع السابقة قبل إنهاء جميع طلبات المعدات وتسوية الأرصدة المتبقية.');return;}await window.ma3daUpdateDoc(ref,{status:'completed',updatedAt:new Date()});await loadContractorProjects();}
      catch(error){console.error('Complete contractor project error:',error);alert('تعذر تحديث حالة المشروع.');}return;
    }
    const button=event.target.closest('[data-contractor-project-request]');if(!button)return;
    try{
      const user=await getContractorUser();const ref=window.ma3daDoc(window.ma3daDB,'projects',button.dataset.contractorProjectRequest);const snap=await window.ma3daGetDoc(ref);
      if(!snap.exists()||(snap.data().contractorId||snap.data().ownerId||snap.data().userId)!==user?.uid){alert('تعذر فتح المشروع أو لا تملك صلاحية الوصول إليه.');return;}
      const project={id:snap.id,...snap.data()};if(contractorIsPreviousProject(project)){alert('لا يمكن طلب معدة من مشروع سابق. افتح مشروعًا حاليًا أو أنشئ مشروعًا جديدًا.');return;}
      contractorSelectedProject=project;
      const title=document.getElementById('contractorPickerProjectName');if(title)title.textContent=project.name||project.projectName||'مشروعك';
      const loc=document.getElementById('contractorPickerProjectLocation');if(loc)loc.textContent=`📍 ${project.city||''} ${project.address||project.location||''}`;
      contractorShowScreen('contractorEquipmentPickerScreen');await loadContractorNearbyEquipment();await loadContractorProjectRequestTracking();
    }catch(error){console.error('Open project equipment picker error:',error);alert('تعذر فتح المشروع.');}
  });

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
        contractorShowScreen("contractorSettingsPrefsScreen");
 
      }
    );
 
  }
 
 
  const contractorDataBackBtn=document.getElementById('contractorDataBackBtn');
  if(contractorDataBackBtn)contractorDataBackBtn.addEventListener('click',()=>contractorShowScreen('contractorHomeScreen'));
  const contractorDataBtn=document.getElementById('contractorDataBtn');
  if(contractorDataBtn)contractorDataBtn.addEventListener('click',async()=>{const profile=contractorGetProfile();if(profile)fillContractorProfile(profile);else await loadContractorProfile();contractorShowScreen('contractorDataScreen');});
  const contractorAccountBtn=document.getElementById('contractorAccountBtn');
  if(contractorAccountBtn)contractorAccountBtn.addEventListener('click',async()=>{const user=await getContractorUser();const email=document.getElementById('contractorAccountEmail');if(email)email.textContent=user?.email||'غير متوفر';contractorShowScreen('contractorAccountScreen');});
  const contractorAccountChangePasswordBtn=document.getElementById('contractorAccountChangePasswordBtn');
  if(contractorAccountChangePasswordBtn)contractorAccountChangePasswordBtn.addEventListener('click',()=>document.getElementById('contractorChangePasswordBtn')?.click());
  const contractorAccountLogoutBtn=document.getElementById('contractorAccountLogoutBtn');
  if(contractorAccountLogoutBtn)contractorAccountLogoutBtn.addEventListener('click',()=>document.getElementById('contractorHomeLogoutBtn')?.click());
  const contractorAccountBackBtn=document.getElementById('contractorAccountBackBtn');
  if(contractorAccountBackBtn)contractorAccountBackBtn.addEventListener('click',()=>contractorShowScreen('contractorHomeScreen'));
  const contractorSettingsPrefsBackBtn=document.getElementById('contractorSettingsPrefsBackBtn');
  if(contractorSettingsPrefsBackBtn)contractorSettingsPrefsBackBtn.addEventListener('click',()=>contractorShowScreen('contractorHomeScreen'));
  const contractorNotificationsSetting=document.getElementById('contractorNotificationsSetting');
  if(contractorNotificationsSetting){contractorNotificationsSetting.checked=localStorage.getItem('ma3daContractorNotifications')!=='false';contractorNotificationsSetting.addEventListener('change',()=>localStorage.setItem('ma3daContractorNotifications',String(contractorNotificationsSetting.checked)));}

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
            "contractorProfile"
          );
 
 
          contractorProfile = null;
 
 
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
 
  window.loadContractorProjects =
    loadContractorProjects;

  window.loadContractorNearbyEquipment =
    loadContractorNearbyEquipment;

 
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

/* =========================================================
   MA3DA — MULTI-EQUIPMENT MANAGEMENT
   Added without changing requests/chat paths or existing roles.
   Firestore collection: equipment
   Legacy equipment/{uid} records remain supported.
========================================================= */
(function installMa3daEquipmentManager(){
  if (window.__ma3daEquipmentManagerInstalled) return;
  window.__ma3daEquipmentManagerInstalled = true;

  let managerSelectedEquipmentId = null;
  let managerSelectedEquipmentData = null;
  let managerEquipmentCache = [];
  let managerImageData = "";

  const managerStyle = `
  #ma3daEquipmentManagerScreen{direction:rtl;text-align:right;max-width:820px;margin:0 auto;padding:16px;color:#171717}
  #ma3daEquipmentManagerScreen .mam-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
  #ma3daEquipmentManagerScreen h2,#ma3daEquipmentManagerScreen h3{margin:0 0 10px}
  #ma3daEquipmentManagerScreen .mam-muted{color:#666;font-size:14px;line-height:1.7}
  #ma3daEquipmentManagerScreen .mam-card{background:#fffdf8;border:1px solid #eadfc5;border-radius:16px;padding:14px;margin:12px 0;box-shadow:0 3px 12px #00000008}
  #ma3daEquipmentManagerScreen .mam-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  #ma3daEquipmentManagerScreen .mam-field{display:flex;flex-direction:column;gap:6px;margin:8px 0;font-size:14px}
  #ma3daEquipmentManagerScreen .mam-field input,#ma3daEquipmentManagerScreen .mam-field select{box-sizing:border-box;width:100%;min-height:44px;border:1px solid #ddd2b8;border-radius:10px;padding:9px;background:#fff;font:inherit;color:#171717}
  #ma3daEquipmentManagerScreen .mam-btn{border:0;border-radius:10px;padding:11px 14px;min-height:42px;font:inherit;font-weight:700;cursor:pointer}
  #ma3daEquipmentManagerScreen .mam-primary{background:#c49a35;color:#171717}
  #ma3daEquipmentManagerScreen .mam-secondary{background:#f2ead8;color:#171717}
  #ma3daEquipmentManagerScreen .mam-danger{background:#fbe7e4;color:#8d1b12}
  #ma3daEquipmentManagerScreen .mam-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  #ma3daEquipmentManagerScreen .mam-equipment{display:grid;grid-template-columns:100px 1fr;gap:12px;align-items:start}
  #ma3daEquipmentManagerScreen .mam-photo{width:100px;height:86px;object-fit:cover;border-radius:12px;background:#f2ead8}
  #ma3daEquipmentManagerScreen .mam-status{display:inline-block;border-radius:20px;background:#f2ead8;padding:4px 9px;font-size:12px;margin:4px 0}
  #ma3daEquipmentManagerScreen .mam-empty{text-align:center;padding:24px 12px;color:#666}
  #ma3daEquipmentManagerScreen .mam-preview{max-width:180px;max-height:140px;object-fit:contain;border-radius:12px;display:none;margin-top:8px}
  @media(max-width:520px){#ma3daEquipmentManagerScreen .mam-grid{grid-template-columns:1fr}#ma3daEquipmentManagerScreen .mam-equipment{grid-template-columns:82px 1fr}#ma3daEquipmentManagerScreen .mam-photo{width:82px;height:76px}#ma3daEquipmentManagerScreen .mam-top{align-items:flex-start;flex-direction:column}}
  `;

  function managerEscape(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }

  function managerGetScreen(){
    let screen = document.getElementById("ma3daEquipmentManagerScreen");
    if(screen) return screen;
    if(!document.getElementById("ma3daEquipmentManagerStyles")){
      const style = document.createElement("style");
      style.id = "ma3daEquipmentManagerStyles";
      style.textContent = managerStyle;
      document.head.appendChild(style);
    }
    screen = document.createElement("section");
    screen.id = "ma3daEquipmentManagerScreen";
    screen.className = "screen";
    screen.innerHTML = `
      <div class="mam-top"><div><h2>معداتي</h2><div class="mam-muted">إضافة معداتك وتعديل بياناتها وإيقاف المعدات التي لم تعد ترغب بعرضها.</div></div><button type="button" class="mam-btn mam-secondary" id="mamBackBtn">رجوع</button></div>
      <div class="mam-actions"><button type="button" class="mam-btn mam-primary" id="mamAddBtn">＋ إضافة معدة جديدة</button><button type="button" class="mam-btn mam-secondary" id="mamRefreshBtn">تحديث القائمة</button></div>
      <div id="mamEquipmentList"><div class="mam-empty">جارٍ تحميل المعدات…</div></div>
      <div class="mam-card" id="mamEditorCard" style="display:none">
        <h3 id="mamEditorTitle">إضافة معدة</h3>
        <p class="mam-muted" id="mamEditorNote">ستُحفظ المعدة الجديدة بحالة قيد المراجعة.</p>
        <div class="mam-grid">
          <label class="mam-field">نوع المعدة<input id="mamType" maxlength="80" required placeholder="مثال: بوكلين"></label>
          <label class="mam-field">الموديل<input id="mamModel" maxlength="100" required placeholder="مثال: CAT 320"></label>
          <label class="mam-field">سنة الصنع<input id="mamYear" inputmode="numeric" maxlength="4" required placeholder="2022"></label>
          <label class="mam-field">المدينة<input id="mamCity" maxlength="80" required placeholder="الرياض"></label>
          <label class="mam-field">رقم المعدة / اللوحة<input id="mamPlate" maxlength="60" placeholder="اختياري"></label>
          <label class="mam-field">السعر بالساعة (ريال)<input id="mamPrice" type="number" min="1" step="1" required placeholder="250"></label>
          <label class="mam-field">حالة التوفر<select id="mamAvailability"><option value="available">متاحة</option><option value="unavailable">غير متاحة</option></select></label>
          <label class="mam-field">صورة المعدة<input id="mamImageFile" type="file" accept="image/*"><img class="mam-preview" id="mamImagePreview" alt="معاينة صورة المعدة"></label>
        </div>
        <div class="mam-actions"><button type="button" class="mam-btn mam-primary" id="mamSaveBtn">حفظ</button><button type="button" class="mam-btn mam-secondary" id="mamCancelEditBtn">إلغاء</button></div>
      </div>`;
    const host = document.querySelector("main") || document.body;
    host.appendChild(screen);
    screen.querySelector("#mamBackBtn").addEventListener("click",()=>{
      managerShowScreen("operatorHomeScreen");
    });
    screen.querySelector("#mamAddBtn").addEventListener("click",()=>managerOpenEditor(null));
    screen.querySelector("#mamRefreshBtn").addEventListener("click",managerLoadEquipment);
    screen.querySelector("#mamCancelEditBtn").addEventListener("click",()=>{screen.querySelector("#mamEditorCard").style.display="none";});
    screen.querySelector("#mamSaveBtn").addEventListener("click",managerSaveEquipment);
    screen.querySelector("#mamImageFile").addEventListener("change", async event=>{
      const file = event.target.files && event.target.files[0];
      managerImageData = "";
      const preview = screen.querySelector("#mamImagePreview");
      if(!file){preview.style.display="none";return;}
      if(!file.type.startsWith("image/")){alert("اختر ملف صورة صالحًا.");event.target.value="";return;}
      try{
        if(typeof resizeOperatorImage === "function") managerImageData = await resizeOperatorImage(file);
        else managerImageData = await managerReadImage(file);
        preview.src = managerImageData;
        preview.style.display = "block";
      }catch(error){console.error("تعذر تجهيز صورة المعدة:",error);alert("تعذر قراءة الصورة. جرّب صورة أخرى.");}
    });
    screen.querySelector("#mamEquipmentList").addEventListener("click", async event=>{
      const button = event.target.closest("button[data-mam-action]");
      if(!button) return;
      const id = button.dataset.id;
      const item = managerEquipmentCache.find(row=>row.id===id);
      if(!item) return;
      if(button.dataset.mamAction === "edit") managerOpenEditor(item);
      if(button.dataset.mamAction === "toggle") await managerToggleAvailability(item);
      if(button.dataset.mamAction === "cancel") await managerCancelEquipment(item);
    });
    return screen;
  }

  function managerReadImage(file){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload=()=>resolve(String(reader.result||""));
      reader.onerror=reject;
      reader.readAsDataURL(file);
    });
  }

  async function managerCurrentUser(){
    if(window.ma3daFirebaseReady) await window.ma3daFirebaseReady;
    return window.ma3daGetCurrentUser ? await window.ma3daGetCurrentUser() : window.ma3daAuth?.currentUser || null;
  }

  async function managerLoadEquipment(){
    const screen = managerGetScreen();
    const list = screen.querySelector("#mamEquipmentList");
    list.innerHTML = '<div class="mam-empty">جارٍ تحميل المعدات…</div>';
    try{
      const user = await managerCurrentUser();
      if(!user) throw new Error("يجب تسجيل الدخول أولًا.");
      if(!window.ma3daDB || typeof window.ma3daGetDocs !== "function" || typeof window.ma3daCollection !== "function") throw new Error("اتصال قاعدة البيانات غير جاهز.");
      const rows=await ma3daReadUserRows("equipment", ["ownerId", "operatorId", "userId"], user.uid);
      // Keep compatibility with the older equipment/{uid} document when it is readable.
      try {
        const legacyRef=window.ma3daDoc(window.ma3daDB,"equipment",user.uid);
        const legacySnap=await window.ma3daGetDoc(legacyRef);
        if(legacySnap.exists()&&!rows.some(item=>item.id===legacySnap.id)){
          const legacyData=legacySnap.data()||{};
          if(legacyData.ownerId===user.uid||legacyData.operatorId===user.uid||legacyData.userId===user.uid) rows.push({id:legacySnap.id,...legacyData});
        }
      } catch(legacyError) { console.warn("Legacy equipment record was not readable; continuing with owner-scoped equipment rows.",legacyError); }
      managerEquipmentCache=rows;
      if(!rows.length){list.innerHTML='<div class="mam-card mam-empty">لا توجد معدات مسجلة حتى الآن. اضغط «إضافة معدة جديدة» للبدء.</div>';return;}
      list.innerHTML=rows.map(item=>{
        const cancelled=item.equipmentStatus==="cancelled";
        const availability=item.availability==="available"&&!cancelled;
        const review=item.editStatus==="pending"?"يوجد تعديل بانتظار المراجعة":(item.editStatus==="rejected"?"رُفض التعديل — "+(item.editReviewNote||"راجع الدعم"):item.verificationStatus==="rejected"?"رُفضت الإضافة — "+(item.verificationReviewNote||"راجع الدعم"):item.verificationStatus==="verified"?"تم اعتماد المعدة":item.editStatus==="approved"?"تم اعتماد آخر تعديل":"قيد المراجعة");
        const photo=item.image?`<img class="mam-photo" src="${managerEscape(item.image)}" alt="صورة المعدة">`:'<div class="mam-photo" style="display:flex;align-items:center;justify-content:center">🚜</div>';
        return `<article class="mam-card"><div class="mam-equipment">${photo}<div><h3>${managerEscape(item.type||"معدة")}${item.model?" — "+managerEscape(item.model):""}</h3><div class="mam-muted">السنة: ${managerEscape(item.year||"—")} · المدينة: ${managerEscape(item.city||"—")}</div><div class="mam-muted">رقم المعدة: ${managerEscape(item.plateNumber||item.equipmentNumber||"غير مسجل")}</div><div class="mam-muted">السعر: ${managerEscape(item.hourlyPrice||0)} ريال/ساعة</div><span class="mam-status">${cancelled?"ملغاة":(availability?"متاحة":"غير متاحة")}</span> <span class="mam-status">${managerEscape(review)}</span></div></div><div class="mam-actions"><button type="button" class="mam-btn mam-secondary" data-mam-action="edit" data-id="${managerEscape(item.id)}">تعديل</button>${cancelled?"":`<button type="button" class="mam-btn mam-secondary" data-mam-action="toggle" data-id="${managerEscape(item.id)}">${availability?"جعلها غير متاحة":"جعلها متاحة"}</button><button type="button" class="mam-btn mam-danger" data-mam-action="cancel" data-id="${managerEscape(item.id)}">إلغاء المعدة</button>`}</div></article>`;
      }).join("");
    }catch(error){
      console.error("تعذر تحميل قائمة المعدات:",error);
      list.innerHTML=`<div class="mam-card mam-empty">تعذر تحميل المعدات. ${managerEscape(error.message||"")}</div>`;
    }
  }

  function managerOpenEditor(item){
    const screen=managerGetScreen();
    managerSelectedEquipmentId=item?item.id:null;
    managerSelectedEquipmentData=item||null;
    managerImageData=item?.image||"";
    screen.querySelector("#mamEditorTitle").textContent=item?"تعديل بيانات المعدة":"إضافة معدة جديدة";
    screen.querySelector("#mamEditorNote").textContent=item?"سيُرسل التعديل إلى موظفي الدعم للمراجعة، ولن تُستبدل البيانات الحالية قبل الموافقة.":"ستُضاف المعدة بحالة قيد المراجعة حتى يتم التحقق منها.";
    const values={mamType:item?.type||"",mamModel:item?.model||"",mamYear:item?.year||"",mamCity:item?.city||"",mamPlate:item?.plateNumber||item?.equipmentNumber||"",mamPrice:item?.hourlyPrice||"",mamAvailability:item?.availability||"available"};
    Object.entries(values).forEach(([id,value])=>{const field=screen.querySelector("#"+id);if(field)field.value=value;});
    const preview=screen.querySelector("#mamImagePreview");
    if(managerImageData){preview.src=managerImageData;preview.style.display="block";}else{preview.removeAttribute("src");preview.style.display="none";}
    screen.querySelector("#mamImageFile").value="";
    screen.querySelector("#mamEditorCard").style.display="block";
    screen.querySelector("#mamEditorCard").scrollIntoView({behavior:"smooth",block:"start"});
  }

  async function managerSaveEquipment(){
    const screen=managerGetScreen();
    const button=screen.querySelector("#mamSaveBtn");
    const type=screen.querySelector("#mamType").value.trim();
    const model=screen.querySelector("#mamModel").value.trim();
    const year=screen.querySelector("#mamYear").value.trim();
    const city=screen.querySelector("#mamCity").value.trim();
    const plateNumber=screen.querySelector("#mamPlate").value.trim();
    const hourlyPrice=Number(screen.querySelector("#mamPrice").value||0);
    const availability=screen.querySelector("#mamAvailability").value;
    if(!type||!model||!year||!city||hourlyPrice<=0){alert("أكمل نوع المعدة والموديل والسنة والمدينة والسعر الصحيح.");return;}
    if(!window.ma3daAddDoc||!window.ma3daCollection||!window.ma3daSetDoc){alert("أدوات حفظ المعدات غير جاهزة. أعد تحميل الصفحة.");return;}
    button.disabled=true;button.textContent="جارٍ الحفظ…";
    try{
      const user=await managerCurrentUser();
      if(!user)throw new Error("يجب تسجيل الدخول أولًا.");
      const now=Date.now();
      const base={type,model,year,city,plateNumber,hourlyPrice,availability,image:managerImageData||"",ownerId:user.uid,ownerEmail:user.email||"",updatedAt:now};
      if(managerSelectedEquipmentId){
        const existing=managerSelectedEquipmentData||{};
        const pendingChanges={...base,requestedAt:now,requestedBy:user.uid};
        const ref=window.ma3daDoc(window.ma3daDB,"equipment",managerSelectedEquipmentId);
        await window.ma3daSetDoc(ref,{...existing,ownerId:user.uid,ownerEmail:user.email||existing.ownerEmail||"",pendingChanges,editStatus:"pending",editRequestedAt:now},{merge:true});
        alert("تم إرسال التعديلات إلى موظفي الدعم للمراجعة. ستبقى البيانات الحالية كما هي حتى الموافقة.");
      }else{
        await window.ma3daAddDoc(window.ma3daCollection(window.ma3daDB,"equipment"),{...base,createdAt:now,verificationStatus:"pending",equipmentStatus:"active",editStatus:"none"});
        alert("تمت إضافة المعدة وإرسالها للمراجعة.");
      }
      screen.querySelector("#mamEditorCard").style.display="none";
      await managerLoadEquipment();
      if(typeof displayMyEquipment==="function") await displayMyEquipment();
    }catch(error){
      console.error("تعذر حفظ المعدة:",error);
      alert("تعذر حفظ بيانات المعدة. تأكد من الاتصال وصلاحيات Firebase.");
    }finally{button.disabled=false;button.textContent="حفظ";}
  }

  async function managerToggleAvailability(item){
    try{
      const user=await managerCurrentUser();
      if(!user)throw new Error("يجب تسجيل الدخول أولًا.");
      const ref=window.ma3daDoc(window.ma3daDB,"equipment",item.id);
      await window.ma3daUpdateDoc(ref,{availability:item.availability==="available"?"unavailable":"available",updatedAt:Date.now(),ownerId:user.uid});
      await managerLoadEquipment();
      if(typeof displayMyEquipment==="function") await displayMyEquipment();
    }catch(error){console.error("تعذر تغيير توفر المعدة:",error);alert("تعذر تغيير حالة المعدة.");}
  }

  async function managerCancelEquipment(item){
    if(!confirm("هل تريد إلغاء هذه المعدة؟ سيتم إيقافها مع الاحتفاظ بسجلها والطلبات السابقة."))return;
    try{
      const user=await managerCurrentUser();
      if(!user)throw new Error("يجب تسجيل الدخول أولًا.");
      const ref=window.ma3daDoc(window.ma3daDB,"equipment",item.id);
      await window.ma3daUpdateDoc(ref,{availability:"unavailable",equipmentStatus:"cancelled",cancelledAt:Date.now(),updatedAt:Date.now(),ownerId:user.uid});
      await managerLoadEquipment();
      if(typeof displayMyEquipment==="function") await displayMyEquipment();
      alert("تم إيقاف المعدة مع الاحتفاظ بسجلها.");
    }catch(error){console.error("تعذر إلغاء المعدة:",error);alert("تعذر إلغاء المعدة.");}
  }

  // Keep future navigation compatible with this screen even though the original
  // showScreen() captured a static NodeList before this screen was created.
  if(typeof showScreen === "function" && !window.__ma3daDynamicScreenNavigation){
    const previousShowScreen = showScreen;
    showScreen = function(id){
      document.querySelectorAll(".screen").forEach(node=>node.classList.remove("active"));
      previousShowScreen(id);
    };
    window.__ma3daDynamicScreenNavigation = true;
  }

  function managerShowScreen(id){
    document.querySelectorAll(".screen").forEach(node=>node.classList.remove("active"));
    const target=document.getElementById(id);
    if(target)target.classList.add("active");
    window.scrollTo(0,0);
  }

  function managerOpen(){
    managerGetScreen();
    managerShowScreen("ma3daEquipmentManagerScreen");
    managerLoadEquipment();
  }

  // Replace the old single-equipment editor button handler so it cannot overwrite equipment/{uid}.
  function managerBindOwnerButton(){
    const oldButton=document.getElementById("operatorEditEquipmentBtn");
    if(oldButton && !oldButton.dataset.ma3daManagerBound){
      const newButton=oldButton.cloneNode(true);
      newButton.dataset.ma3daManagerBound="true";
      oldButton.replaceWith(newButton);
      newButton.addEventListener("click",event=>{event.preventDefault();managerOpen();});
    }
    const oldSave=document.getElementById("saveOperatorEquipmentBtn");
    if(oldSave && !oldSave.dataset.ma3daManagerBound){
      const newSave=oldSave.cloneNode(true);
      newSave.dataset.ma3daManagerBound="true";
      oldSave.replaceWith(newSave);
      newSave.addEventListener("click",event=>{event.preventDefault();managerOpen();});
    }
  }

  // Expose a safe entry point and bind after the current page DOM has been created.
  window.openMa3daEquipmentManager=managerOpen;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",managerBindOwnerButton,{once:true});
  else managerBindOwnerButton();
})();


/* =========================================================
   RESTORE SUPPORT SCREENS FROM SCRIPT 12 WHEN INDEX LACKS THEM
   This only creates missing support UI; it does not touch other pages.
========================================================= */
(function restoreMa3daSupportScreens(){
  if (document.getElementById("ma3daSupportHomeScreen")) return;
  const style = document.createElement("style");
  style.id = "ma3da-support-restored-styles";
  style.textContent = "\n.ma3da-support-screen{direction:rtl;text-align:right;max-width:820px;margin:0 auto;padding:16px;color:#171717}\n.ma3da-support-grid{display:grid;grid-template-columns:1fr;gap:10px;margin:14px 0}\n.ma3da-support-choice,.ma3da-support-card{display:block;width:100%;box-sizing:border-box;background:#fffdf8;border:1px solid #eadfc5;border-radius:16px;padding:16px;margin:10px 0;color:#171717;font:inherit}\n.ma3da-support-choice{text-align:right;cursor:pointer}.ma3da-support-choice strong,.ma3da-support-choice span{display:block}.ma3da-support-choice span{margin-top:6px;color:#6b6254}\n.ma3da-support-screen label{display:block;font-weight:600;margin:12px 0 6px}\n.ma3da-support-screen input,.ma3da-support-screen select,.ma3da-support-screen textarea{box-sizing:border-box;width:100%;padding:12px;border:1px solid #d8cfbc;border-radius:10px;background:#fff;color:#171717;font:inherit}\n.ma3da-support-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.ma3da-support-actions button{flex:1;min-width:120px}\n.ma3da-ticket-feedback{font-weight:600;min-height:1.4em}.ma3da-ticket-thread{max-height:48vh;overflow:auto}\n.ma3da-ticket-message{padding:10px 12px;border-radius:12px;margin:8px 0;max-width:92%;white-space:pre-wrap;overflow-wrap:anywhere}\n.ma3da-ticket-message.requester{background:#f5eddc;margin-right:auto}.ma3da-ticket-message.support{background:#e9f3ed;margin-left:auto}\n.ma3da-ticket-message small{display:block;color:#716753;margin-top:5px}.ma3da-ticket-empty{padding:18px;text-align:center;color:#746b5b;background:#fff;border-radius:10px}\n";
  document.head.appendChild(style);
  const host = document.querySelector("main") || document.body;
  const wrapper = document.createElement("div");
  wrapper.id = "ma3daSupportScreensRestored";
  wrapper.innerHTML = "<section id=\"ma3daSupportHomeScreen\" class=\"screen ma3da-support-screen\">\n  <button type=\"button\" class=\"back-btn\" data-ma3da-support-back>← رجوع</button>\n  <div class=\"hero\"><div class=\"hero-icon\">🛟</div><h1>إدارة الشكاوى</h1><p>قدّم شكوى جديدة، وتابع الشكاوى الحالية، أو راجع الشكاوى السابقة.</p></div>\n  <div class=\"ma3da-support-grid\">\n    <button class=\"ma3da-support-choice\" type=\"button\" id=\"ma3daNewComplaintOpenBtn\"><strong>＋ شكوى جديدة</strong><span>إرسال شكوى جديدة مع رقم الطلب ونوع المشكلة والتفاصيل.</span></button>\n    <button class=\"ma3da-support-choice\" type=\"button\" data-open-ma3da-complaints=\"current\"><strong>◷ الشكاوى الحالية</strong><span>تابع الشكاوى التي ما زالت قيد المعالجة وتواصل مع الدعم.</span></button>\n    <button class=\"ma3da-support-choice\" type=\"button\" data-open-ma3da-complaints=\"previous\"><strong>✓ الشكاوى السابقة</strong><span>راجع الشكاوى التي أغلقها فريق الدعم والمحادثات السابقة.</span></button>\n  </div>\n  <p id=\"ma3daSupportHomeFeedback\" class=\"ma3da-ticket-feedback\" role=\"status\" aria-live=\"polite\"></p>\n</section>\n<section id=\"ma3daNewComplaintScreen\" class=\"screen ma3da-support-screen\">\n  <button type=\"button\" class=\"back-btn\" data-ma3da-support-home>← العودة لمركز الدعم</button>\n  <div class=\"hero\"><div class=\"hero-icon\">📝</div><h1>شكوى جديدة</h1><p>أدخل التفاصيل حتى يتمكن فريق الدعم من مساعدتك.</p></div>\n  <div class=\"ma3da-support-card\">\n    <label for=\"ma3daComplaintOrderNumber\">رقم الطلب (اختياري)</label><input id=\"ma3daComplaintOrderNumber\" type=\"text\" placeholder=\"مثال: رقم الطلب أو معرّفه\">\n    <label for=\"ma3daComplaintCategory\">نوع الشكوى *</label><select id=\"ma3daComplaintCategory\"><option value=\"مشكلة في الطلب\">مشكلة في الطلب</option><option value=\"مشكلة في الحساب\">مشكلة في الحساب</option><option value=\"مشكلة في المعدة\">مشكلة في المعدة</option><option value=\"مشكلة تقنية\">مشكلة تقنية</option><option value=\"بلاغ\">بلاغ</option><option value=\"استفسار\">استفسار</option><option value=\"اقتراح\">اقتراح</option><option value=\"أخرى\">أخرى</option></select>\n    <label for=\"ma3daComplaintSubject\">عنوان الشكوى *</label><input id=\"ma3daComplaintSubject\" type=\"text\" maxlength=\"120\" placeholder=\"اكتب عنوانًا مختصرًا للشكوى\">\n    <label for=\"ma3daComplaintMessage\">تفاصيل الشكوى *</label><textarea id=\"ma3daComplaintMessage\" rows=\"5\" maxlength=\"5000\" placeholder=\"اشرح المشكلة بالتفصيل...\"></textarea>\n    <p id=\"ma3daNewComplaintFeedback\" class=\"ma3da-ticket-feedback\" role=\"status\" aria-live=\"polite\"></p>\n    <div class=\"ma3da-support-actions\"><button id=\"ma3daSubmitComplaintBtn\" class=\"main-btn\" type=\"button\">إرسال الشكوى</button><button class=\"back-btn\" type=\"button\" data-ma3da-support-home>إلغاء</button></div>\n  </div>\n</section>\n<section id=\"ma3daComplaintListScreen\" class=\"screen ma3da-support-screen\">\n  <button type=\"button\" class=\"back-btn\" data-ma3da-support-home>← مركز الدعم</button>\n  <div class=\"hero\"><div class=\"hero-icon\">📋</div><h1 id=\"ma3daComplaintListTitle\">الشكاوى الحالية</h1><p>افتح أي شكوى للاطلاع على تفاصيلها ومحادثتها.</p></div>\n  <div class=\"ma3da-support-actions\"><button id=\"ma3daCurrentComplaintsTab\" class=\"main-btn\" type=\"button\" data-ma3da-complaints-tab=\"current\">الشكاوى الحالية</button><button id=\"ma3daPreviousComplaintsTab\" class=\"back-btn\" type=\"button\" data-ma3da-complaints-tab=\"previous\">الشكاوى السابقة</button><button id=\"ma3daRefreshComplaintsBtn\" class=\"back-btn\" type=\"button\">تحديث</button></div>\n  <p id=\"ma3daComplaintListFeedback\" class=\"ma3da-ticket-feedback\" role=\"status\" aria-live=\"polite\"></p><div id=\"ma3daComplaintList\" aria-live=\"polite\"><div class=\"ma3da-ticket-empty\">جارٍ تحميل الشكاوى...</div></div>\n</section>\n<section id=\"ma3daComplaintChatScreen\" class=\"screen ma3da-support-screen\">\n  <button type=\"button\" class=\"back-btn\" id=\"ma3daComplaintChatBackBtn\">← العودة إلى الشكاوى</button>\n  <div class=\"hero\"><div class=\"hero-icon\">💬</div><h1 id=\"ma3daComplaintChatTitle\">محادثة الشكوى</h1><p id=\"ma3daComplaintChatMeta\">جارٍ تحميل التفاصيل...</p></div>\n  <div class=\"ma3da-support-card\"><h3 id=\"ma3daComplaintChatSubject\">تفاصيل الشكوى</h3><p id=\"ma3daComplaintChatDescription\"></p><div id=\"ma3daComplaintMessages\" class=\"ma3da-ticket-thread\" aria-live=\"polite\"></div>\n    <label for=\"ma3daComplaintReplyInput\">اكتب ردك</label><textarea id=\"ma3daComplaintReplyInput\" rows=\"3\" maxlength=\"4000\" placeholder=\"اكتب رسالتك لفريق الدعم...\"></textarea><p id=\"ma3daComplaintChatFeedback\" class=\"ma3da-ticket-feedback\" role=\"status\" aria-live=\"polite\"></p><button id=\"ma3daComplaintSendReplyBtn\" class=\"main-btn\" type=\"button\">إرسال الرسالة</button>\n  </div>\n</section>";
  host.appendChild(wrapper);
})();

/* =========================================================
   MA3DA SUPPORT CENTER — complaints lifecycle + two-way chat
   Collections: supportTickets and supportTickets/{ticketId}/messages
   Existing order chat path is intentionally untouched.
========================================================= */
(function initMa3daSupportCenter(){
  if (window.__ma3daSupportCenterV2Bound) return;
  window.__ma3daSupportCenterV2Bound = true;

  const $ = id => document.getElementById(id);
  function ensureStaffConversationPanel(){
    if($('supportTicketConversation')) return $('supportTicketConversation');
    const dashboard=$('supportDashboardScreen');
    if(!dashboard) return null;
    const panel=document.createElement('section');
    panel.id='supportTicketConversation';
    panel.className='support-panel';
    panel.hidden=true;
    panel.style.cssText='margin-top:16px;padding:18px;';
    panel.innerHTML='<h2 id="supportTicketConversationTitle">محادثة الشكوى</h2><p id="supportTicketConversationMeta"></p><p id="supportTicketConversationDescription" style="white-space:pre-wrap"></p><div id="supportTicketConversationMessages" class="ma3da-ticket-thread" aria-live="polite"></div><label for="supportTicketReplyInput">الرد على مقدم الشكوى</label><textarea id="supportTicketReplyInput" class="support-input" rows="3" maxlength="4000" placeholder="اكتب ردك هنا..."></textarea><p id="supportTicketReplyFeedback" role="status" aria-live="polite"></p><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="supportTicketSendReplyBtn" class="support-btn support-primary" type="button">إرسال الرد</button><button id="supportTicketEscalateBtn" class="support-btn" type="button">تصعيد إلى مالك التطبيق</button><button id="supportTicketCloseBtn" class="support-btn support-danger" type="button">إغلاق الشكوى</button><button id="supportTicketConversationHideBtn" class="support-btn" type="button">إخفاء المحادثة</button></div>';
    dashboard.appendChild(panel);
    return panel;
  }
  function ensureRequesterRatingArea(){
    const card=$('ma3daComplaintSendReplyBtn')?.parentElement;
    if(!card || $('ma3daSupportStaffRating')) return;
    const area=document.createElement('div');
    area.id='ma3daSupportStaffRating';
    area.style.cssText='margin-top:16px;padding:14px;border:1px solid #eadfc5;border-radius:12px;background:#fffdf8;';
    area.hidden=true;
    area.innerHTML='<h3>قيّم موظف الدعم</h3><p>بعد إغلاق الشكوى، قيّم تجربتك مع موظف الدعم.</p><div id="ma3daSupportRatingStars" role="group" aria-label="تقييم موظف الدعم" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-support-rating="1" aria-label="نجمة واحدة">☆</button><button type="button" data-support-rating="2" aria-label="نجمتان">☆</button><button type="button" data-support-rating="3" aria-label="ثلاث نجوم">☆</button><button type="button" data-support-rating="4" aria-label="أربع نجوم">☆</button><button type="button" data-support-rating="5" aria-label="خمس نجوم">☆</button></div><textarea id="ma3daSupportRatingComment" rows="2" maxlength="1000" placeholder="ملاحظتك (اختياري)" style="width:100%;box-sizing:border-box;margin-top:8px"></textarea><p id="ma3daSupportRatingFeedback" role="status" aria-live="polite"></p><button id="ma3daSubmitSupportRatingBtn" class="main-btn" type="button">إرسال التقييم</button>';
    card.appendChild(area);
  }
  let selectedSupportRating=0;
  let activeTicket = null;
  let activeTicketMessagesUnsub = null;
  let activeUserMessagesUnsub = null;
  let activeUserTicketUnsub = null;
  let activeListKind = 'current';
  let currentUserRole = 'customer';
  let userTicketsCache = [];

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalizeDate = value => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d;
  };
  const dateLabel = value => { const d=normalizeDate(value); return d ? d.toLocaleString('ar-SA') : '—'; };
  const isClosed = ticket => ['closed','resolved','complete','completed','مغلقة','مغلق','تم الحل'].includes(String(ticket.status||'').toLowerCase());
  const statusLabel = ticket => isClosed(ticket) ? 'مغلقة' : (String(ticket.status||'').toLowerCase()==='replied' ? 'بانتظار متابعة صاحب الشكوى' : (ticket.status==='in_progress' ? 'قيد المعالجة' : 'جديدة / قيد المعالجة'));
  const setText = (id, value) => { const el=$(id); if(el) el.textContent=value ?? ''; };
  const setFeedback = (id, value) => setText(id, value);

  async function waitForFirebase(){
    await Promise.resolve(window.ma3daFirebaseReady);
    if (!window.ma3daDB || !window.ma3daAuth || typeof window.ma3daCollection!=='function' || typeof window.ma3daGetDocs!=='function') throw new Error('خدمة Firebase غير جاهزة');
  }
  async function getUser(){
    await waitForFirebase();
    const user=window.ma3daAuth.currentUser || (typeof window.ma3daGetCurrentUser==='function' ? await window.ma3daGetCurrentUser() : null);
    if(!user?.uid) throw new Error('يرجى تسجيل الدخول أولًا.');
    return user;
  }
  function detectRole(){
    const current = (typeof selectedRole==='string' ? selectedRole : '').toLowerCase();
    if (current.includes('contract')) return 'contractor';
    if (current.includes('operator') || current.includes('owner')) return 'operator';
    const active = document.querySelector('.screen.active')?.id || '';
    if (active.toLowerCase().includes('contractor')) return 'contractor';
    if (active.toLowerCase().includes('operator')) return 'operator';
    return currentUserRole || 'customer';
  }
  function stopUserListener(){ if(activeUserMessagesUnsub){try{activeUserMessagesUnsub();}catch(_){} activeUserMessagesUnsub=null;} if(activeUserTicketUnsub){try{activeUserTicketUnsub();}catch(_){} activeUserTicketUnsub=null;} }
  function stopStaffListener(){ if(activeTicketMessagesUnsub){try{activeTicketMessagesUnsub();}catch(_){} activeTicketMessagesUnsub=null;} }
  function show(id){ if(typeof showScreen==='function') showScreen(id); else { document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); $(id)?.classList.add('active'); window.scrollTo(0,0); } }
  function ensureSupportLandingScreen(){
    let screen=$('ma3daSupportLandingScreen');
    if(screen) return screen;
    screen=document.createElement('section');
    screen.id='ma3daSupportLandingScreen';
    screen.className='screen ma3da-support-screen';
    screen.innerHTML='<button type="button" class="back-btn" data-ma3da-support-landing-back>← رجوع</button>'+
      '<div class="hero"><div class="hero-icon">🛟</div><h1>الدعم الفني</h1><p>نحن هنا لمساعدتك، لا تتردد بالتواصل معنا.</p></div>'+
      '<div class="ma3da-support-grid"><button type="button" class="ma3da-support-choice" data-open-ma3da-complaint-center>'+
      '<strong>📋 إدارة الشكاوى</strong><span>قدّم شكوى جديدة، وتابع الشكاوى الحالية، وراجع الشكاوى السابقة.</span></button></div>';
    const host=document.querySelector('main')||document.body;
    host.appendChild(screen);
    return screen;
  }
  function roleHomeScreen(){
    return currentUserRole==='operator'?'operatorHomeScreen':currentUserRole==='contractor'?'contractorHomeScreen':'customerHomeScreen';
  }
  function ticketMessagesPath(ticketId){ return window.ma3daCollection(window.ma3daDB,'supportTickets',ticketId,'messages'); }
  function renderMessages(targetId, messages, readOnly){
    const target=$(targetId); if(!target) return;
    if(!messages.length){ target.innerHTML='<div class="ma3da-ticket-empty">لا توجد رسائل بعد. اكتب رسالتك لبدء المحادثة.</div>'; return; }
    target.innerHTML=messages.map(m=>{
      const role=String(m.senderRole||'requester').toLowerCase();
      const cls=(role==='support'||role==='admin'||role==='staff')?'support':'requester';
      const who=cls==='support'?'موظف الدعم':'صاحب الشكوى';
      return `<div class="ma3da-ticket-message ${cls}"><strong>${who}</strong><div>${escapeHtml(m.text||m.message||'')}</div><small>${escapeHtml(dateLabel(m.createdAt))}</small></div>`;
    }).join('');
    target.scrollTop=target.scrollHeight;
    if(readOnly) target.setAttribute('aria-label','محادثة مغلقة للقراءة فقط');
  }
  function mergeLegacyMessages(ticket, messages){
    const all=[...(messages||[])];
    if(ticket.message && !all.some(m=>(m.text||m.message)===ticket.message)) all.unshift({text:ticket.message,senderRole:'requester',createdAt:ticket.createdAt});
    if(Array.isArray(ticket.replies)) ticket.replies.forEach(r=>{
      const text=typeof r==='string'?r:(r.text||r.message||'');
      if(text && !all.some(m=>(m.text||m.message)===text)) all.push({text,senderRole:r.senderRole||r.role||'support',createdAt:r.createdAt||ticket.lastReplyAt});
    });
    if(ticket.lastReply && !all.some(m=>(m.text||m.message)===ticket.lastReply)) all.push({text:ticket.lastReply,senderRole:'support',createdAt:ticket.lastReplyAt});
    all.sort((a,b)=>(normalizeDate(a.createdAt)?.getTime()||0)-(normalizeDate(b.createdAt)?.getTime()||0));
    return all;
  }
  async function getTicketMessages(ticket){
    let rows=[];
    try{
      const snap=await window.ma3daGetDocs(ticketMessagesPath(ticket.id));
      snap.forEach(d=>rows.push({id:d.id,...(d.data()||{})}));
    }catch(err){ console.warn('تعذر قراءة رسائل الشكوى:',err); }
    return mergeLegacyMessages(ticket,rows);
  }
  async function getOwnTickets(user){
    // Query by requesterId so Firestore rules can restrict each user to their own tickets.
    const q=window.ma3daQuery(window.ma3daCollection(window.ma3daDB,'supportTickets'),window.ma3daWhere('requesterId','==',user.uid));
    const snap=await window.ma3daGetDocs(q);
    const rows=[]; snap.forEach(d=>rows.push({id:d.id,...(d.data()||{})}));
    rows.sort((a,b)=>(normalizeDate(b.createdAt)?.getTime()||0)-(normalizeDate(a.createdAt)?.getTime()||0));
    return rows;
  }
  /* 06-A — شكاوى العميل/المستخدم: قائمة الشكاوى الحالية والسابقة */
async function loadOwnTickets(kind=activeListKind){
    activeListKind=kind;
    setFeedback('ma3daComplaintListFeedback','جارٍ تحميل الشكاوى...');
    const list=$('ma3daComplaintList'); if(list) list.innerHTML='<div class="ma3da-ticket-empty">جارٍ تحميل الشكاوى...</div>';
    try{
      const user=await getUser(); currentUserRole=detectRole();
      userTicketsCache=await getOwnTickets(user);
      const rows=userTicketsCache.filter(t=>kind==='previous'?isClosed(t):!isClosed(t));
      setText('ma3daComplaintListTitle',kind==='previous'?'الشكاوى السابقة':'الشكاوى الحالية');
      $('ma3daCurrentComplaintsTab')?.classList.toggle('main-btn',kind==='current');
      $('ma3daCurrentComplaintsTab')?.classList.toggle('back-btn',kind!=='current');
      $('ma3daPreviousComplaintsTab')?.classList.toggle('main-btn',kind==='previous');
      $('ma3daPreviousComplaintsTab')?.classList.toggle('back-btn',kind!=='previous');
      if(list) list.innerHTML=rows.length?rows.map(t=>`<article class="ma3da-ticket-row"><h3>${escapeHtml(t.subject||t.title||t.category||'شكوى')}</h3><div class="ma3da-ticket-meta"><span>${escapeHtml(t.category||'استفسار')}</span><span>رقم الشكوى: ${escapeHtml(t.id)}</span><span>تاريخ: ${escapeHtml(dateLabel(t.createdAt))}</span><span class="ma3da-ticket-pill">${escapeHtml(statusLabel(t))}</span></div><p>${escapeHtml(t.message||t.description||'')}</p><button class="main-btn" type="button" data-open-ma3da-ticket="${escapeHtml(t.id)}">فتح ${kind==='previous'?'الشكوى السابقة':'الشكوى'}</button></article>`).join(''):'<div class="ma3da-ticket-empty">لا توجد شكاوى في هذا القسم.</div>';
      setFeedback('ma3daComplaintListFeedback','');
    }catch(err){ console.error('تعذر تحميل شكاوى المستخدم:',err); if(list) list.innerHTML='<div class="ma3da-ticket-empty">تعذر تحميل الشكاوى. تأكد من تسجيل الدخول وصلاحيات قراءة شكاواك في Firebase.</div>'; setFeedback('ma3daComplaintListFeedback',err.message||'تعذر تحميل الشكاوى.'); }
  }
  function ensureRequesterRatingArea(){
    const card=$('ma3daComplaintSendReplyBtn')?.parentElement;
    if(!card || $('ma3daSupportStaffRating')) return;
    const area=document.createElement('div');area.id='ma3daSupportStaffRating';area.hidden=true;
    area.style.cssText='margin-top:16px;padding:14px;border:1px solid #eadfc5;border-radius:12px;background:#fffdf8;';
    area.innerHTML='<h3>قيّم موظف الدعم</h3><p>بعد إغلاق الشكوى، قيّم تجربتك مع موظف الدعم.</p><div role="group" aria-label="تقييم موظف الدعم" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-support-rating="1" aria-label="نجمة واحدة">☆</button><button type="button" data-support-rating="2" aria-label="نجمتان">☆</button><button type="button" data-support-rating="3" aria-label="ثلاث نجوم">☆</button><button type="button" data-support-rating="4" aria-label="أربع نجوم">☆</button><button type="button" data-support-rating="5" aria-label="خمس نجوم">☆</button></div><textarea id="ma3daSupportRatingComment" rows="2" maxlength="1000" placeholder="ملاحظتك (اختياري)" style="width:100%;box-sizing:border-box;margin-top:8px"></textarea><p id="ma3daSupportRatingFeedback" role="status" aria-live="polite"></p><button id="ma3daSubmitSupportRatingBtn" class="main-btn" type="button">إرسال التقييم</button>';
    card.appendChild(area);
  }
  async function submitRequesterSupportRating(){
    if(!activeTicket || !isClosed(activeTicket)){setFeedback('ma3daSupportRatingFeedback','يمكن تقييم موظف الدعم بعد إغلاق الشكوى فقط.');return;}
    if(!selectedSupportRating){setFeedback('ma3daSupportRatingFeedback','اختر عدد النجوم أولًا.');return;}
    if(activeTicket.supportRating){setFeedback('ma3daSupportRatingFeedback','تم تسجيل تقييمك لهذه الشكوى مسبقًا.');return;}
    try{
      const user=await getUser();
      await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'supportTickets',activeTicket.id),{supportRating:selectedSupportRating,supportRatingComment:($('ma3daSupportRatingComment')?.value||'').trim(),supportRatedAt:new Date(),supportRatedBy:user.uid,supportStaffId:activeTicket.closedBy||activeTicket.assignedTo||''});
      activeTicket.supportRating=selectedSupportRating;
      setFeedback('ma3daSupportRatingFeedback','شكرًا لك، تم حفظ تقييم موظف الدعم.');
      $('ma3daSubmitSupportRatingBtn').disabled=true;
    }catch(err){console.error('تعذر حفظ تقييم موظف الدعم:',err);setFeedback('ma3daSupportRatingFeedback',err.code==='permission-denied'?'رفضت قواعد Firebase حفظ التقييم. يلزم السماح لصاحب الشكوى بتحديث حقول التقييم فقط.':'تعذر حفظ التقييم. حاول مرة أخرى.');}
  }
  async function openUserTicket(ticketId){
    stopUserListener();
    ensureRequesterRatingArea();
    try{
      const user=await getUser();
      const ticket=userTicketsCache.find(t=>t.id===ticketId) || (await getOwnTickets(user)).find(t=>t.id===ticketId);
      if(!ticket || (ticket.requesterId!==user.uid && ticket.userId!==user.uid)) throw new Error('لم يتم العثور على الشكوى ضمن شكاواك.');
      activeTicket={...ticket};
      show('ma3daComplaintChatScreen');
      setText('ma3daComplaintChatTitle',ticket.subject||ticket.title||'محادثة الشكوى');
      setText('ma3daComplaintChatMeta',`رقم الشكوى: ${ticket.id} · ${ticket.category||'استفسار'} · ${statusLabel(ticket)}`);
      setText('ma3daComplaintChatSubject',ticket.subject||ticket.category||'تفاصيل الشكوى');
      setText('ma3daComplaintChatDescription',`${ticket.message||ticket.description||''}${ticket.orderNumber?`\nرقم الطلب: ${ticket.orderNumber}`:''}`);
      const closed=isClosed(ticket);
      const ratingArea=$('ma3daSupportStaffRating');
      if(ratingArea){ratingArea.hidden=!closed;selectedSupportRating=0;const comment=$('ma3daSupportRatingComment');if(comment)comment.value=ticket.supportRatingComment||'';const submit=$('ma3daSubmitSupportRatingBtn');if(submit)submit.disabled=!!ticket.supportRating;setFeedback('ma3daSupportRatingFeedback',ticket.supportRating?`تم تسجيل تقييمك: ${ticket.supportRating} من 5.`:'');document.querySelectorAll('[data-support-rating]').forEach(star=>{const n=Number(star.dataset.supportRating)||0;star.textContent=n<=(ticket.supportRating||0)?'★':'☆';star.disabled=!!ticket.supportRating;star.style.fontSize='24px';star.style.color=n<=(ticket.supportRating||0)?'#b88922':'#777';});}
      $('ma3daComplaintReplyInput').disabled=closed; $('ma3daComplaintSendReplyBtn').disabled=closed;
      $('ma3daComplaintReplyInput').placeholder=closed?'هذه الشكوى مغلقة ولا يمكن إرسال رسائل جديدة.':'اكتب رسالتك لفريق الدعم...';
      const render=async snap=>{
        let msgs=[]; snap.forEach(d=>msgs.push({id:d.id,...(d.data()||{})}));
        const merged=mergeLegacyMessages(ticket,msgs); renderMessages('ma3daComplaintMessages',merged,closed);
      };
      const messagesRef=ticketMessagesPath(ticket.id);
      if(typeof window.ma3daOnSnapshot==='function') {
        activeUserMessagesUnsub=window.ma3daOnSnapshot(messagesRef,render,err=>setFeedback('ma3daComplaintChatFeedback','تعذر تحديث المحادثة: '+(err.message||'')));
        // متابعة وثيقة الشكوى مباشرة حتى يظهر الإغلاق للعميل فورًا، حتى لو لم يحدّث الصفحة.
        activeUserTicketUnsub=window.ma3daOnSnapshot(window.ma3daDoc(window.ma3daDB,'supportTickets',ticket.id),snap=>{
          if(!snap || !snap.exists()) return;
          const latest={id:ticket.id,...(snap.data()||{})};
          if(latest.requesterId!==user.uid) return;
          const becameClosed=!isClosed(activeTicket)&&isClosed(latest);
          activeTicket={...activeTicket,...latest};
          const nowClosed=isClosed(latest);
          const reply=$('ma3daComplaintReplyInput'), send=$('ma3daComplaintSendReplyBtn');
          if(reply){reply.disabled=nowClosed;reply.placeholder=nowClosed?'تم إغلاق الشكوى. لا يمكن إرسال رسائل جديدة.':'اكتب رسالتك لفريق الدعم...';}
          if(send) send.disabled=nowClosed;
          const closeNotice=nowClosed?'تم إغلاق الشكوى من فريق الدعم. يمكنك الآن تقييم موظف الدعم.':'';
          setFeedback('ma3daComplaintChatFeedback',closeNotice || (nowClosed?'هذه الشكوى مغلقة. يمكنك الاطلاع على المحادثة السابقة.':''));
          const area=$('ma3daSupportStaffRating'); if(area) area.hidden=!nowClosed;
          if(becameClosed && typeof window.Notification==='function' && Notification.permission==='granted' && document.visibilityState!=='visible'){
            try{new Notification('مِعدة — تم إغلاق الشكوى',{body:'تم إغلاق شكواك. افتح الدعم الفني لتقييم موظف الدعم.',tag:'ma3da-ticket-closed-'+ticket.id});}catch(_){ }
          }
          const submit=$('ma3daSubmitSupportRatingBtn'); if(submit) submit.disabled=!!latest.supportRating;
          document.querySelectorAll('[data-support-rating]').forEach(star=>{const n=Number(star.dataset.supportRating)||0;star.textContent=n<=(latest.supportRating||0)?'★':'☆';star.disabled=!!latest.supportRating;});
          if(latest.supportRating) setFeedback('ma3daSupportRatingFeedback',`تم تسجيل تقييمك: ${latest.supportRating} من 5.`);
        },err=>console.warn('تعذر متابعة حالة الشكوى مباشرة:',err));
      } else renderMessages('ma3daComplaintMessages',await getTicketMessages(ticket),closed);
      setFeedback('ma3daComplaintChatFeedback',closed?'تم إغلاق الشكوى. يمكنك الاطلاع على المحادثة السابقة وتقييم موظف الدعم.':'');
    }catch(err){setFeedback('ma3daComplaintChatFeedback',err.message||'تعذر فتح الشكوى.');}
  }
  async function sendMessage(ticketId,text,role){
    const user=await getUser();
    const message={text,senderId:user.uid,senderEmail:user.email||'',senderRole:role,createdAt:new Date()};
    await window.ma3daAddDoc(ticketMessagesPath(ticketId),message);
    const ticketRef=window.ma3daDoc(window.ma3daDB,'supportTickets',ticketId);
    // إرسال الرسالة هو الإجراء الأساسي؛ لا نُظهر فشل الرد إذا رفضت القواعد تحديث بيانات الحالة فقط.
    if(role==='support'){
      try{
        await window.ma3daUpdateDoc(ticketRef,{status:'replied',lastReply:text,lastReplyAt:new Date(),lastMessage:text,lastMessageAt:new Date()});
      }catch(statusError){console.warn('أُرسلت رسالة الدعم لكن تعذر تحديث حالة الشكوى:',statusError);}
    }
  }
  async function submitNewComplaint(){
    const btn=$('ma3daSubmitComplaintBtn'); const feedback=$('ma3daNewComplaintFeedback');
    const orderNumber=$('ma3daComplaintOrderNumber')?.value.trim()||'';
    const category=$('ma3daComplaintCategory')?.value||'استفسار';
    const subject=$('ma3daComplaintSubject')?.value.trim()||'';
    const message=$('ma3daComplaintMessage')?.value.trim()||'';
    if(!subject||!message){setFeedback('ma3daNewComplaintFeedback','اكتب عنوان الشكوى وتفاصيلها قبل الإرسال.');return;}
    if(btn){btn.disabled=true;btn.textContent='جارٍ إرسال الشكوى...';}
    try{
      const user=await getUser();
      const role=detectRole();
      const ticket={requesterId:user.uid,userId:user.uid,requesterEmail:user.email||'',requesterRole:role,requesterName:user.displayName||'',orderNumber,category,subject,title:subject,message,status:'open',createdAt:new Date(),source:role+'-support-center',lastMessage:message,lastMessageAt:new Date()};
      const ref=await window.ma3daAddDoc(window.ma3daCollection(window.ma3daDB,'supportTickets'),ticket);
      // Seed the conversation with the original complaint so both sides see it in the thread.
      await window.ma3daAddDoc(ticketMessagesPath(ref.id),{text:message,senderId:user.uid,senderEmail:user.email||'',senderRole:'requester',createdAt:new Date()});
      $('ma3daComplaintOrderNumber').value=''; $('ma3daComplaintSubject').value=''; $('ma3daComplaintMessage').value='';
      setFeedback('ma3daNewComplaintFeedback','تم إرسال الشكوى بنجاح. ستجدها الآن ضمن الشكاوى الحالية.');
      await loadOwnTickets('current');
      setTimeout(()=>{show('ma3daComplaintListScreen');},500);
    }catch(err){console.error('فشل إنشاء الشكوى:',err);setFeedback('ma3daNewComplaintFeedback',err.code==='permission-denied'?'رفضت قواعد Firebase إنشاء الشكوى أو رسالتها الأولى. نحتاج مراجعة القواعد المحددة لمجموعة supportTickets.':(err.message||'تعذر إرسال الشكوى. حاول مرة أخرى.'));}
    finally{if(btn){btn.disabled=false;btn.textContent='إرسال الشكوى';}}
  }
  async function sendUserReply(){
    const input=$('ma3daComplaintReplyInput'); const text=(input?.value||'').trim();
    if(!activeTicket || !text) {setFeedback('ma3daComplaintChatFeedback','اكتب رسالة أولًا.');return;}
    if(isClosed(activeTicket)){setFeedback('ma3daComplaintChatFeedback','هذه الشكوى مغلقة.');return;}
    const btn=$('ma3daComplaintSendReplyBtn'); if(btn)btn.disabled=true;
    try{await sendMessage(activeTicket.id,text,'requester');if(input)input.value='';setFeedback('ma3daComplaintChatFeedback','تم إرسال رسالتك.');}
    catch(err){console.error(err);setFeedback('ma3daComplaintChatFeedback',err.code==='permission-denied'?'تعذر إرسال الرسالة بسبب صلاحيات رسائل الشكوى في Firebase.':(err.message||'تعذر إرسال الرسالة.'));}
    finally{if(btn)btn.disabled=false;}
  }

  // Staff side: render tickets with an explicit action to open the actual conversation.
  /* 06-B — موظفو الدعم: عرض الشكاوى والرد عليها وإغلاقها */
async function staffTicketRows(){
    const rows=await (async()=>{
      const snap=await window.ma3daGetDocs(window.ma3daCollection(window.ma3daDB,'supportTickets'));
      const a=[];snap.forEach(d=>a.push({id:d.id,...(d.data()||{})}));
      a.sort((x,y)=>(normalizeDate(y.createdAt)?.getTime()||0)-(normalizeDate(x.createdAt)?.getTime()||0));return a;
    })();
    return rows;
  }
  async function renderStaffTickets(targetId){
    const target=$(targetId);if(!target)return;
    try{
      const allRows=await staffTicketRows();
      const completedView=targetId==='supportCompletedTicketsList';
      const rows=allRows.filter(t=>completedView?isClosed(t):!isClosed(t));
      setText('supportStatTickets',allRows.filter(t=>!isClosed(t)).length);
      target.innerHTML=rows.length?rows.slice(0,100).map(t=>`<div class="support-row"><div><strong>${escapeHtml(t.subject||t.title||t.category||'طلب دعم')}</strong><br><small>${escapeHtml(t.requesterName||t.requesterEmail||t.customerEmail||t.requesterId||'مستخدم')} · ${escapeHtml(t.requesterRole||'')}</small><br><small>رقم الشكوى: ${escapeHtml(t.id)} · ${escapeHtml(t.orderNumber?'رقم الطلب: '+t.orderNumber:'بدون رقم طلب')}</small></div><div><span class="ma3da-ticket-pill">${escapeHtml(statusLabel(t))}</span><br><button class="support-btn support-primary" type="button" data-open-staff-ticket="${escapeHtml(t.id)}">${completedView?'عرض المحادثة':'فتح المحادثة'}</button></div></div>`).join(''):'<div class="support-empty">'+(completedView?'لا توجد طلبات دعم مكتملة حتى الآن.':'لا توجد شكاوى مفتوحة.')+'</div>';
    }catch(err){console.error(err);target.innerHTML='<div class="support-empty">تعذر تحميل الشكاوى. تحقق من صلاحيات موظف الدعم.</div>';}
  }
  async function openStaffTicket(ticketId){
    stopStaffListener();
    ensureStaffConversationPanel();
    try{
      const rows=await staffTicketRows();const ticket=rows.find(t=>t.id===ticketId);if(!ticket)throw new Error('الشكوى غير موجودة.');
      activeTicket={...ticket};
      const panel=$('supportTicketConversation');
      if(panel){panel.hidden=false;panel.classList.add('active');bindStaffConversationActions();}
      setText('supportTicketConversationTitle',ticket.subject||ticket.title||'محادثة الشكوى');
      setText('supportTicketConversationMeta',`رقم الشكوى: ${ticket.id} · ${ticket.requesterEmail||ticket.requesterId||''} · ${statusLabel(ticket)}`);
      setText('supportTicketConversationDescription',`${ticket.category||''}${ticket.orderNumber?' · رقم الطلب: '+ticket.orderNumber:''}\n${ticket.message||''}`);
      $('supportTicketReplyInput').disabled=isClosed(ticket);$('supportTicketSendReplyBtn').disabled=isClosed(ticket);$('supportTicketCloseBtn').disabled=isClosed(ticket);
      const ref=ticketMessagesPath(ticket.id);
      const render=snap=>{let msgs=[];snap.forEach(d=>msgs.push({id:d.id,...(d.data()||{})}));renderMessages('supportTicketConversationMessages',mergeLegacyMessages(ticket,msgs),isClosed(ticket));};
      if(typeof window.ma3daOnSnapshot==='function')activeTicketMessagesUnsub=window.ma3daOnSnapshot(ref,render,err=>setFeedback('supportTicketReplyFeedback','تعذر تحديث الرسائل: '+(err.message||'')));
      else renderMessages('supportTicketConversationMessages',await getTicketMessages(ticket),isClosed(ticket));
      panel?.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){setFeedback('supportTicketReplyFeedback',err.message||'تعذر فتح المحادثة.');}
  }
  // ربط مباشر لأزرار محادثة موظف الدعم؛ يمنع اعتمادها على مستمع النقر العام فقط.
  function bindStaffConversationActions(){
    const actions={
      supportTicketSendReplyBtn:sendStaffReply,
      supportTicketEscalateBtn:escalateStaffTicket,
      supportTicketCloseBtn:closeStaffTicket,
      supportTicketConversationHideBtn:()=>{
        const panel=$('supportTicketConversation');
        if(panel){panel.hidden=true;panel.classList.remove('active');}
        stopStaffListener();
      }
    };
    Object.entries(actions).forEach(([id,action])=>{
      const button=$(id);if(!button)return;
      button.onclick=async event=>{
        event.preventDefault();event.stopPropagation();
        if(button.dataset.processing==='true')return;
        button.dataset.processing='true';
        try{await action();}
        catch(error){
          console.error('خطأ في زر محادثة الدعم:',id,error);
          setFeedback('supportTicketReplyFeedback',error?.message||'تعذر تنفيذ العملية.');
        }finally{button.dataset.processing='false';}
      };
    });
  }

  // التصعيد ضمن نطاق مركز الدعم حتى يستخدم الشكوى المفتوحة الحالية فعليًا.
  async function escalateStaffTicket(){
    if(!activeTicket?.id){setFeedback('supportTicketReplyFeedback','افتح شكوى من القائمة أولًا قبل التصعيد.');return;}
    const reason=prompt('اشرح لمالك التطبيق سبب التصعيد وما الذي تعذر حله:');
    if(reason===null)return;
    if(!reason.trim()){setFeedback('supportTicketReplyFeedback','اكتب سبب التصعيد قبل الإرسال.');return;}
    const button=$('supportTicketEscalateBtn');
    if(button){button.disabled=true;button.textContent='جارٍ إرسال التصعيد...';}
    try{
      const user=await getUser();
      await waitForFirebase();
      if(!window.ma3daDB||typeof window.ma3daAddDoc!=='function'||typeof window.ma3daCollection!=='function')throw new Error('خدمة Firebase غير جاهزة.');
      await window.ma3daAddDoc(window.ma3daCollection(window.ma3daDB,'supportEscalations'),{
        ticketId:activeTicket.id,
        ticketSubject:activeTicket.subject||activeTicket.title||'شكوى',
        ticketDescription:activeTicket.message||activeTicket.description||'',
        requesterId:activeTicket.requesterId||activeTicket.userId||'',
        staffId:user.uid,staffEmail:user.email||'',
        staffName:supportEmployee?.data?.name||user.email||'موظف الدعم',
        reason:reason.trim(),status:'open',createdAt:new Date(),createdAtMs:Date.now()
      });
      setFeedback('supportTicketReplyFeedback','تم إرسال التصعيد إلى مالك التطبيق.');
      alert('تم تصعيد الشكوى إلى مالك التطبيق.');
    }catch(err){
      console.error('تعذر تصعيد الشكوى:',err);
      const msg=err?.code==='permission-denied'
        ?'رفضت قواعد Firebase إنشاء التصعيد. تأكد من السماح لموظف الدعم بإنشاء مستند في supportEscalations.'
        :(err?.message||'تعذر إرسال التصعيد.');
      setFeedback('supportTicketReplyFeedback',msg);alert(msg);
    }finally{
      if(button){button.disabled=false;button.textContent='تصعيد إلى مالك التطبيق';}
    }
  }

  async function sendStaffReply(){
    const input=$('supportTicketReplyInput');const text=(input?.value||'').trim();
    if(!activeTicket||!text){setFeedback('supportTicketReplyFeedback','اكتب الرد أولًا.');return;}
    if(isClosed(activeTicket)){setFeedback('supportTicketReplyFeedback','هذه الشكوى مغلقة.');return;}
    const btn=$('supportTicketSendReplyBtn');if(btn)btn.disabled=true;
    try{await sendMessage(activeTicket.id,text,'support');if(input)input.value='';setFeedback('supportTicketReplyFeedback','تم إرسال الرد لصاحب الشكوى.');await renderStaffTickets('supportChatsList');await renderStaffTickets('supportTicketsList');}
    catch(err){console.error(err);setFeedback('supportTicketReplyFeedback',err.code==='permission-denied'?'تعذر إرسال الرد بسبب صلاحيات رسائل الشكوى في Firebase.':'تعذر إرسال الرد.');}
    finally{if(btn)btn.disabled=false;}
  }
  async function closeStaffTicket(){
    if(!activeTicket)return;
    if(isClosed(activeTicket))return;
    try{
      const user=await getUser();
      // Staff authorization is still enforced by Firestore rules.
      await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'supportTickets',activeTicket.id),{status:'closed',closedAt:new Date(),closedBy:user.uid,closedByEmail:user.email||''});
      activeTicket.status='closed';setFeedback('supportTicketReplyFeedback','تم إغلاق الشكوى ونقلها إلى الشكاوى السابقة.');
      $('supportTicketReplyInput').disabled=true;$('supportTicketSendReplyBtn').disabled=true;$('supportTicketCloseBtn').disabled=true;
      await renderStaffTickets('supportChatsList');await renderStaffTickets('supportTicketsList');
      setTimeout(()=>{const p=$('supportTicketConversation');if(p)p.hidden=true;},900);
    }catch(err){console.error(err);setFeedback('supportTicketReplyFeedback',err.code==='permission-denied'?'رفضت قواعد Firebase إغلاق الشكوى. تأكد من السماح لموظف الدعم المصرح له بتحديث status.':'تعذر إغلاق الشكوى.');}
  }

  async function renderSupportRatings(){
    const target=$('supportRatingsList');if(!target)return;
    target.innerHTML='<div class="support-empty">جارٍ تحميل التقييمات...</div>';
    try{
      const rows=(await staffTicketRows()).filter(t=>Number(t.supportRating)>=1&&Number(t.supportRating)<=5);
      target.innerHTML=rows.length?rows.map(t=>`<article class="support-row" style="display:block;margin:10px 0;padding:14px"><strong>${escapeHtml(t.subject||t.category||'شكوى')}</strong><p>رقم الشكوى: ${escapeHtml(t.id)}</p><p>تقييم مقدم الشكوى: <strong>${'★'.repeat(Number(t.supportRating))}${'☆'.repeat(5-Number(t.supportRating))}</strong> (${Number(t.supportRating)}/5)</p><p>الموظف: ${escapeHtml(t.closedByEmail||t.supportStaffId||t.assignedTo||'غير محدد')}</p><p>${escapeHtml(t.supportRatingComment||'لا توجد ملاحظات.')}</p></article>`).join(''):'<div class="support-empty">لا توجد تقييمات مسجلة حتى الآن.</div>';
    }catch(err){console.error(err);target.innerHTML='<div class="support-empty">تعذر تحميل التقييمات. تحقق من صلاحيات قراءة الشكاوى.</div>';}
  }

  // 06-C — مراجعة تعديلات المعدات المرسلة من أصحابها.
  async function loadPendingEquipmentEdits(){
    const target=$('supportEquipmentEditsList'); if(!target)return;
    target.innerHTML='<div class="support-empty">جارٍ تحميل التعديلات المعلّقة...</div>';
    try{
      await waitForFirebase();
      const snap=await window.ma3daGetDocs(window.ma3daCollection(window.ma3daDB,'equipment'));
      const rows=[];snap.forEach(d=>{const x=d.data()||{};if((x.editStatus==='pending'&&x.pendingChanges)||((x.verificationStatus==='pending'||!x.verificationStatus)&&!x.pendingChanges&&x.equipmentStatus!=='cancelled'))rows.push({id:d.id,...x,_reviewKind:x.pendingChanges?'edit':'new'});});
      rows.sort((a,b)=>(Number(b.editRequestedAt||b.createdAt||b.requestedAt||0)-Number(a.editRequestedAt||a.createdAt||a.requestedAt||0)));
      target.innerHTML=rows.length?rows.map(x=>{
        const c=x.pendingChanges||x;
        const fields=[['نوع المعدة','type'],['الموديل','model'],['سنة الصنع','year'],['المدينة','city'],['رقم المعدة/اللوحة','plateNumber'],['السعر بالساعة','hourlyPrice'],['التوفر','availability'],['الصورة','image']];
        const changes=fields.filter(([label,key])=>c[key]!==undefined && (key!=='image'||c[key]!==x.image)).map(([label,key])=>`<p><strong>${escapeHtml(label)}:</strong> ${key==='image'?(c[key]?'تم إرفاق صورة':'لم تُرفق صورة'):escapeHtml(key==='availability'?(c[key]==='available'?'متاحة':'غير متاحة'):c[key])}</p>`).join('');
        const photo=c.image?`<img src="${escapeHtml(c.image)}" alt="صورة المعدة المقترحة" style="max-width:180px;max-height:120px;object-fit:contain;border-radius:10px">`:'';
        const isEdit=x._reviewKind==='edit';
        return `<article class="support-row" style="display:block;margin:12px 0;padding:16px"><h3>${escapeHtml(x.type||'معدة')} — ${escapeHtml(x.model||'')}</h3><p>صاحب المعدة: ${escapeHtml(x.ownerEmail||x.ownerId||'—')}</p><p>${isEdit?'مراجعة تعديل بيانات معدة موجودة.':'طلب إضافة معدة جديدة؛ لن تصبح معتمدة قبل موافقة الدعم.'}</p><h4>${isEdit?'التعديلات المقترحة':'بيانات المعدة'}</h4>${changes||'<p>لا توجد بيانات إضافية.</p>'}${photo}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${isEdit?`<button class="support-btn support-primary" type="button" data-approve-equipment-edit="${escapeHtml(x.id)}">الموافقة على التعديل</button><button class="support-btn support-danger" type="button" data-reject-equipment-edit="${escapeHtml(x.id)}">رفض التعديل</button>`:`<button class="support-btn support-primary" type="button" data-approve-new-equipment="${escapeHtml(x.id)}">اعتماد المعدة</button><button class="support-btn support-danger" type="button" data-reject-new-equipment="${escapeHtml(x.id)}">رفض الإضافة</button>`}</div></article>`;
      }).join(''):'<div class="support-empty">لا توجد إضافات أو تعديلات معدات بانتظار المراجعة.</div>';
    }catch(err){console.error('تعذر تحميل تعديلات المعدات:',err);target.innerHTML='<div class="support-empty">تعذر تحميل التعديلات. تحقق من صلاحيات قراءة equipment في Firebase.</div>';}
  }
  async function decideEquipmentEdit(id,approve){
    try{
      const user=await getUser();
      const ref=window.ma3daDoc(window.ma3daDB,'equipment',id);
      const snap=await window.ma3daGetDoc(ref);
      if(!snap.exists())throw new Error('المعدة غير موجودة.');
      const item=snap.data()||{};
      if(item.editStatus!=='pending'||!item.pendingChanges)throw new Error('هذا التعديل لم يعد معلّقًا. حدّث القائمة.');
      const now=new Date();
      if(approve){
        const c=item.pendingChanges;
        const allowed={type:c.type,model:c.model,year:c.year,city:c.city,plateNumber:c.plateNumber,equipmentNumber:c.equipmentNumber,hourlyPrice:c.hourlyPrice,availability:c.availability,image:c.image};
        Object.keys(allowed).forEach(k=>{if(allowed[k]===undefined)delete allowed[k];});
        await window.ma3daUpdateDoc(ref,{...allowed,pendingChanges:null,editStatus:'approved',editReviewedAt:now,editReviewedBy:user.uid,editReviewNote:'تمت الموافقة على التعديل',updatedAt:Date.now()});
        alert('تمت الموافقة على التعديل وتحديث بيانات المعدة المعتمدة.');
      }else{
        const reason=prompt('اكتب سبب رفض التعديل ليظهر لصاحب المعدة:');
        if(reason===null)return;
        if(!reason.trim())throw new Error('سبب الرفض مطلوب حتى يعرف صاحب المعدة ما الذي يحتاج إلى تصحيح.');
        await window.ma3daUpdateDoc(ref,{pendingChanges:null,editStatus:'rejected',editReviewedAt:now,editReviewedBy:user.uid,editReviewNote:reason.trim(),ownerNotice:{type:'equipment_edit_rejected',message:reason.trim(),createdAt:now,read:false}});
        alert('تم رفض التعديل وإرسال سبب الرفض لصاحب المعدة.');
      }
      await loadPendingEquipmentEdits();
      if(typeof loadSupportEquipment==='function')await loadSupportEquipment();
    }catch(err){console.error('تعذر اتخاذ قرار تعديل المعدة:',err);alert(err.code==='permission-denied'?'رفضت قواعد Firebase حفظ قرار الدعم. يلزم السماح لموظف الدعم المصرح له بتحديث مستند المعدة.':(err.message||'تعذر حفظ القرار.'));}
  }

  async function decideNewEquipment(id,approve){
    try{
      const user=await getUser();
      const ref=window.ma3daDoc(window.ma3daDB,'equipment',id);
      const snap=await window.ma3daGetDoc(ref);
      if(!snap.exists())throw new Error('المعدة غير موجودة.');
      const item=snap.data()||{};
      if(item.pendingChanges || (item.verificationStatus!=='pending' && item.verificationStatus==='verified'))throw new Error('هذه المعدة لم تعد بانتظار الاعتماد.');
      let reason='';
      if(!approve){reason=prompt('اكتب سبب رفض إضافة المعدة ليظهر لصاحبها:');if(reason===null)return;if(!reason.trim())throw new Error('سبب الرفض مطلوب.');}
      const now=new Date();
      await window.ma3daUpdateDoc(ref,approve?{verificationStatus:'verified',equipmentStatus:'active',verificationReviewedAt:now,verificationReviewedBy:user.uid,verificationReviewNote:'تم اعتماد المعدة',ownerNotice:{type:'equipment_approved',message:'تم اعتماد معدتك من الدعم الفني.',createdAt:now,read:false}}:{verificationStatus:'rejected',equipmentStatus:'rejected',verificationReviewedAt:now,verificationReviewedBy:user.uid,verificationReviewNote:reason.trim(),ownerNotice:{type:'equipment_rejected',message:reason.trim(),createdAt:now,read:false}});
      alert(approve?'تم اعتماد المعدة وأصبحت موثقة.':'تم رفض إضافة المعدة وإرسال السبب لصاحبها.');
      await loadPendingEquipmentEdits();
      if(typeof loadSupportEquipment==='function')await loadSupportEquipment();
    }catch(err){console.error('تعذر مراجعة إضافة المعدة:',err);alert(err.message||'تعذر حفظ قرار الدعم.');}
  }

  window.ma3daLoadPendingEquipmentEdits = loadPendingEquipmentEdits;

  // Override the old simple ticket lists so staff can actually open conversations.
  loadSupportTickets = async function(){ await renderStaffTickets('supportTicketsList'); await renderStaffTickets('supportCompletedTicketsList'); };
  loadSupportChats = async function(){ await renderStaffTickets('supportChatsList'); };

  document.addEventListener('click',async event=>{
    const el=event.target.closest('button');if(!el)return;
    if(el.id==='supportDashboardBackBtn'){event.preventDefault();show('roleScreen');return;}
    if(el.id==='supportLogoutNavBtn'){event.preventDefault();const logout=document.getElementById('supportLogoutBtn');if(logout)logout.click();return;}
    if(el.matches('[data-support-section]')){
      const name=el.dataset.supportSection;
      if(name==='completedTickets'){supportSetSection(name);await renderStaffTickets('supportCompletedTicketsList');return;}
      if(name==='tickets'){supportSetSection(name);await renderStaffTickets('supportTicketsList');return;}
      if(name==='equipmentEdits'){supportSetSection(name);await loadPendingEquipmentEdits();return;}
      if(name==='projectClosures'){supportSetSection(name);if(typeof loadSupportProjectClosures==='function')await loadSupportProjectClosures();return;}
      if(name==='ratings'){supportSetSection(name);await renderSupportRatings();return;}
    }
    if(el.id==='supportThemeSelect')return;

    // Connect the existing support buttons in the current Index to the restored complaint center.
    // Keep the original support screens and all other sections intact.
    if(el.id==='technicalSupportBtn' || el.id==='operatorSupportBtn' || el.id==='contractorSupportBtn'){
      event.preventDefault();
      currentUserRole = el.id==='operatorSupportBtn' ? 'operator' : (el.id==='contractorSupportBtn' ? 'contractor' : 'customer');
      ensureSupportLandingScreen();
      show('ma3daSupportLandingScreen');
      return;
    }
    if(el.matches('[data-open-ma3da-support]')){
      event.preventDefault();currentUserRole=el.id.includes('operator')?'operator':el.id.includes('contractor')?'contractor':detectRole();
      ensureSupportLandingScreen();show('ma3daSupportLandingScreen');return;
    }
    if(el.matches('[data-ma3da-support-landing-back]')){show(roleHomeScreen());return;}
    if(el.matches('[data-open-ma3da-complaint-center]')){show('ma3daSupportHomeScreen');setFeedback('ma3daSupportHomeFeedback','');return;}
    if(el.matches('[data-ma3da-support-back]')){show('ma3daSupportLandingScreen');return;}
    if(el.id==='ma3daNewComplaintOpenBtn'){show('ma3daNewComplaintScreen');return;}
    if(el.matches('[data-ma3da-support-home]')){show('ma3daSupportHomeScreen');return;}
    if(el.matches('[data-open-ma3da-complaints]')){await loadOwnTickets(el.dataset.openMa3daComplaints);show('ma3daComplaintListScreen');return;}
    if(el.matches('[data-ma3da-complaints-tab]')){await loadOwnTickets(el.dataset.ma3daComplaintsTab);return;}
    if(el.id==='ma3daRefreshComplaintsBtn'){await loadOwnTickets(activeListKind);return;}
    if(el.id==='ma3daSubmitComplaintBtn'){await submitNewComplaint();return;}
    if(el.matches('[data-open-ma3da-ticket]')){await openUserTicket(el.dataset.openMa3daTicket);return;}
    if(el.id==='ma3daComplaintChatBackBtn'){stopUserListener();await loadOwnTickets(activeListKind);show('ma3daComplaintListScreen');return;}
    if(el.id==='ma3daComplaintSendReplyBtn'){await sendUserReply();return;}
    if(el.matches('[data-open-staff-ticket]')){await openStaffTicket(el.dataset.openStaffTicket);return;}
    if(el.id==='supportEquipmentEditsRefreshBtn'){await loadPendingEquipmentEdits();return;}
    if(el.matches('[data-approve-equipment-edit]')){await decideEquipmentEdit(el.dataset.approveEquipmentEdit,true);return;}
    if(el.matches('[data-reject-equipment-edit]')){await decideEquipmentEdit(el.dataset.rejectEquipmentEdit,false);return;}
    if(el.matches('[data-approve-new-equipment]')){await decideNewEquipment(el.dataset.approveNewEquipment,true);return;}
    if(el.matches('[data-reject-new-equipment]')){await decideNewEquipment(el.dataset.rejectNewEquipment,false);return;}
    if(el.id==='supportTicketEscalateBtn'){await escalateStaffTicket();return;}
    if(el.id==='supportTicketSendReplyBtn'){await sendStaffReply();return;}
    if(el.id==='supportTicketCloseBtn'){await closeStaffTicket();return;}
    if(el.id==='supportTicketConversationHideBtn'){const panel=$('supportTicketConversation');if(panel){panel.hidden=true;panel.classList.remove('active');}stopStaffListener();return;}
    if(el.matches('[data-support-rating]')){selectedSupportRating=Number(el.dataset.supportRating)||0;document.querySelectorAll('[data-support-rating]').forEach(star=>{const n=Number(star.dataset.supportRating)||0;star.textContent=n<=selectedSupportRating?'★':'☆';star.style.color=n<=selectedSupportRating?'#b88922':'#777';star.style.fontSize='24px';});return;}
    if(el.id==='ma3daSubmitSupportRatingBtn'){await submitRequesterSupportRating();return;}
  });

  // Page-level refresh hooks: refresh only the currently displayed support data.
  window.ma3daRefreshSupportCenter = async function(screenId){
    if(screenId==='ma3daComplaintListScreen') return loadOwnTickets(activeListKind);
    if(screenId==='ma3daComplaintChatScreen' && activeTicket?.id) return openUserTicket(activeTicket.id);
    if(screenId==='ma3daSupportHomeScreen' || screenId==='ma3daSupportLandingScreen') return;
  };

  // Keep old submit buttons inert so users cannot create duplicate tickets through the retired form.
  document.querySelectorAll('[data-ma3da-support-submit], #contractorSupportSubmitBtn').forEach(btn=>{btn.disabled=true;btn.title='استخدم مركز دعم مِعدة لإرسال شكوى جديدة';});
})();

/* 03/04/05 — وظائف الفواتير والدفعات المشتركة: العميل وصاحب المعدة والمقاول */
/* Ma3da: invoice and income helpers */

function showIncomeTab(tab) {
  const customers = document.getElementById("ownerCustomerInvoices");
  const projects = document.getElementById("ownerProjectInvoices");

  if (customers) customers.hidden = tab !== "customer";
  if (projects) projects.hidden = tab !== "projects";
}

function showContractorTab(tab) {
  const payments = document.getElementById("contractorPaymentsList");
  const invoices = document.getElementById("contractorInvoicesList");

  if (payments) payments.hidden = tab !== "payments";
  if (invoices) invoices.hidden = tab !== "invoices";
}

function calculateMa3daCommission(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("قيمة المبلغ غير صحيحة");
  }

  return Math.round(value * 0.10 * 100) / 100;
}

function calculateOwnerNet(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("قيمة المبلغ غير صحيحة");
  }

  return Math.round((value - calculateMa3daCommission(value)) * 100) / 100;
}

function calculateProjectStageCommission(stageAmount) {
  return calculateMa3daCommission(stageAmount);
}

async function canCloseRequestAfterInvoice(requestId) {
  if (
    !requestId ||
    !window.ma3daDB ||
    !window.ma3daFirebaseReady ||
    !window.ma3daDoc ||
    !window.ma3daGetDoc
  ) {
    return false;
  }

  try {
    await Promise.resolve(window.ma3daFirebaseReady);

    const requestRef = window.ma3daDoc(
      window.ma3daDB,
      "requests",
      requestId
    );

    const snapshot = await window.ma3daGetDoc(requestRef);

    if (!snapshot.exists()) return false;

    const data = snapshot.data();

    return (
      data.paymentStatus === "paid" &&
      data.invoiceStatus === "issued" &&
      Boolean(data.invoiceId)
    );
  } catch (error) {
    console.error("تعذر التحقق من الفاتورة:", error);
    return false;
  }
}


/* Ma3da: minute-based usage calculation (SAR, rounded to halalas). */
function calculateMa3daUsageAmount(hourlyPrice, workedMinutes) {
  const rate = Number(hourlyPrice);
  const minutes = Number(workedMinutes);
  if (!Number.isFinite(rate) || rate < 0 || !Number.isFinite(minutes) || minutes < 0) {
    throw new Error("سعر الساعة أو مدة التشغيل غير صحيحة");
  }
  return Math.round((rate * minutes / 60 + Number.EPSILON) * 100) / 100;
}
window.calculateMa3daUsageAmount = calculateMa3daUsageAmount;


/* =========================================================
   MA3DA CONTRACTOR INVOICES + PAYMENT LEDGER (INITIAL PHASE)
   Payment records entered by contractor remain pending until
   a finance-authorized workflow verifies them. This module does
   not collect money or claim that a gateway payment occurred.
========================================================= */
(function ma3daContractorFinanceModule(){
  'use strict';
  const $f = id => document.getElementById(id);
  let financeMode = 'contractor';
  let ownerFinanceSubpage = 'menu';
  let cachedInvoices = [];
  let cachedPayments = [];
  let cachedProjects = [];
  let cachedRequests = [];
  let cachedAllRequests = [];
  let cachedManagerRequests = [];
  let cachedPhases = [];
  let financeInvoicesUnsub=null, financePaymentsUnsub=null;
  let financeInvoiceSnapshotReady=false, financePaymentSnapshotReady=false;
  let financeRealtimeRefreshQueued=false;
  const money = n => (Number(n)||0).toLocaleString('ar-SA',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' ر.س';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const say = (id, message, error=false) => { const el=$f(id); if(el){el.textContent=message;el.style.color=error?'#a12622':'#356b37';} };
  const getUser = async () => {
    if(typeof window.ma3daGetCurrentUser === 'function') return await window.ma3daGetCurrentUser();
    return window.ma3daAuth?.currentUser || null;
  };
  const col = name => window.ma3daCollection(window.ma3daDB,name);
  const readAll = async name => {
    const snap=await window.ma3daGetDocs(col(name)); const rows=[];
    snap.forEach(d=>rows.push({id:d.id,...(d.data()||{})})); return rows;
  };
  const when = v => {
    try { const d=v?.toDate?v.toDate():(v instanceof Date?v:new Date(v)); return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('ar-SA'); }
    catch(_){return '—';}
  };
  function statusLabel(status){
    return ({issued:'صادرة — بانتظار السداد',partial:'مدفوعة جزئيًا',paid:'مسددة بالكامل',pending_verification:'بانتظار التحقق من السداد',verified:'تم التحقق من السداد',rejected:'مرفوضة بعد المراجعة',settlement_pending:'بانتظار تسوية مستحق صاحب المعدة',settled:'تم تحويل مستحق صاحب المعدة',completion_announced:'إعلان انتهاء قديم — بانتظار مراجعة صاحب المعدة',completion_requested:'بانتظار مراجعة صاحب المعدة',disputed:'قيد المراجعة — توجد ملاحظة أو خلاف',approved_for_invoice:'معتمدة — جاهزة لإصدار الفاتورة',invoice_issued:'الفاتورة مرسلة — بانتظار السداد',payment_submitted:'تم تسجيل السداد — بانتظار تأكيد الاستلام',partial_payment_confirmed:'تم تأكيد دفعة جزئية',payment_confirmed:'تم تأكيد سداد المرحلة'})[status] || status || 'غير محددة';
  }
  function showScreen(id){
    if(typeof window.showScreen==='function') window.showScreen(id);
    else { document.querySelectorAll('.screen').forEach(el=>el.classList.remove('active')); $f(id)?.classList.add('active'); }
  }
  window.ma3daOpenCustomerFinance = () => openFinance('customer');
  function setOwnerFinanceSubpage(page){
    ownerFinanceSubpage=page||'menu';
    const menu=$f('ownerFinancePagesNav'), toolbar=$f('ownerFinancePageToolbar');
    const customer=ownerFinanceSubpage==='customers', projects=ownerFinanceSubpage==='contractors';
    if(menu)menu.hidden=ownerFinanceSubpage!=='menu';
    if(toolbar)toolbar.hidden=ownerFinanceSubpage==='menu';
    if($f('ownerBookingInvoiceCard'))$f('ownerBookingInvoiceCard').hidden=!customer;
    if($f('bookingInvoicesList'))$f('bookingInvoicesList').hidden=!customer;
    if($f('bookingInvoiceGatewayNotice'))$f('bookingInvoiceGatewayNotice').hidden=!customer;
    if($f('ownerIssueInvoiceCard'))$f('ownerIssueInvoiceCard').hidden=true; // نظام المراحل القديم مؤرشف
    if($f('contractorInvoicesList'))$f('contractorInvoicesList').hidden=!projects;
    if($f('financeScreenTitle'))$f('financeScreenTitle').textContent=customer?'فواتير العملاء':projects?'فواتير المقاولين':'فواتير التأجير ومستحقاتي';
    if($f('financeScreenSubtitle'))$f('financeScreenSubtitle').textContent=customer?'فواتير طلبات التأجير الخاصة بالعملاء وحالة السداد.':projects?'فواتير مراحل المشاريع والدفعات والمبالغ المستحقة.':'اختر نوع الفواتير التي تريد مراجعتها.';
  }
  function openFinance(mode){
    financeMode=['owner','customer'].includes(mode)?mode:'contractor';
    showScreen('contractorFinanceScreen');
    const owner=financeMode==='owner'; const customer=financeMode==='customer';
    if($f('financeScreenTitle'))$f('financeScreenTitle').textContent=owner?'فواتير التأجير ومستحقاتي':customer?'فواتيري والمدفوعات':'فواتير المشروع والسداد';
    if($f('financeScreenSubtitle'))$f('financeScreenSubtitle').textContent=owner?'أصدر فاتورة الطلب بعد انتهاء العمل، وتابع حالة السداد ومستحقاتك.':customer?'راجع فواتيرك ومبالغها وحالة الدفع من مكان واحد.':'استعرض فواتير المشروع والدفعات وحالة السداد.';
    if($f('ownerIssueInvoiceCard'))$f('ownerIssueInvoiceCard').hidden=true; // النظام المرحلي القديم مؤرشف وغير نشط
    if($f('ownerBookingInvoiceCard'))$f('ownerBookingInvoiceCard').hidden=!owner;
    if($f('bookingInvoicesList'))$f('bookingInvoicesList').hidden=!customer;
    if($f('bookingInvoiceGatewayNotice'))$f('bookingInvoiceGatewayNotice').hidden=!(customer||owner);
    if($f('contractorInvoicesList'))$f('contractorInvoicesList').hidden=customer;
    if($f('contractorStageManagerCard'))$f('contractorStageManagerCard').hidden=true; // النظام المرحلي القديم مؤرشف وغير نشط
    if($f('contractorCreateInvoiceCard'))$f('contractorCreateInvoiceCard').hidden=true;
    if($f('contractorSubmitPaymentCard'))$f('contractorSubmitPaymentCard').hidden=owner||customer;
    if($f('ownerFinancePagesNav'))$f('ownerFinancePagesNav').hidden=!owner;
    if($f('ownerFinancePageToolbar'))$f('ownerFinancePageToolbar').hidden=true;
    if(owner){
      setOwnerFinanceSubpage('menu');
    }else{
      ownerFinanceSubpage='';
      if($f('ownerFinancePagesNav'))$f('ownerFinancePagesNav').hidden=true;
      if($f('ownerFinancePageToolbar'))$f('ownerFinancePageToolbar').hidden=true;
      if($f('ownerIssueInvoiceCard'))$f('ownerIssueInvoiceCard').hidden=true;
      if($f('ownerBookingInvoiceCard'))$f('ownerBookingInvoiceCard').hidden=!customer;
      if($f('bookingInvoicesList'))$f('bookingInvoicesList').hidden=!customer;
      if($f('bookingInvoiceGatewayNotice'))$f('bookingInvoiceGatewayNotice').hidden=!customer;
      if($f('contractorInvoicesList'))$f('contractorInvoicesList').hidden=customer;
    }
    return loadFinance().catch(err=>{console.error('Load Ma3da finance failed:',err);say(owner?'ownerInvoiceFeedback':'contractorPaymentFeedback','تعذر تحميل بيانات الفواتير. تحقق من الاتصال وصلاحيات Firebase.',true);throw err;});
  }
  window.ma3daOpenProjectInvoicePayment=async(requestId,zeroBasedIndex)=>{
    await openFinance('contractor');
    const invoice=cachedInvoices.find(i=>i.requestId===requestId&&i.invoiceKind==='agreement_installment'&&Number(i.installmentIndex)===Number(zeroBasedIndex)+1);
    if(!invoice)throw new Error('لم تُنشأ الفاتورة المشتركة لهذا القسط بعد؛ حدّث الفواتير أو تواصل مع الدعم.');
    if(invoice.paymentStatus==='paid')throw new Error('هذا القسط مسدد بالفعل.');
    const select=$f('contractorPaymentInvoice');if(select)select.value=invoice.id;const summary=paymentSummary(invoice);
    if($f('contractorPaymentAmount'))$f('contractorPaymentAmount').value=String(Math.max(0,summary.remaining-summary.pending).toFixed(2));
    if($f('contractorSubmitPaymentCard'))$f('contractorSubmitPaymentCard').hidden=false;$f('contractorSubmitPaymentCard')?.scrollIntoView?.({behavior:'smooth',block:'start'});
    say('contractorPaymentFeedback','تسجيل الإثبات يتم من الفاتورة المشتركة، ويُحدّث سجل الدفعات والطلب معًا بعد المراجعة.');
  };
  function ensureFinanceRealtimeUpdates(){
    if(typeof window.ma3daOnSnapshot!=='function'||!window.ma3daDB)return;
    const refreshAfterChange=()=>{
      if(!financeInvoiceSnapshotReady){financeInvoiceSnapshotReady=true;return;}
      if(!financePaymentSnapshotReady){financePaymentSnapshotReady=true;return;}
      if(financeRealtimeRefreshQueued)return;
      financeRealtimeRefreshQueued=true;
      Promise.resolve().then(()=>{financeRealtimeRefreshQueued=false;loadFinance().catch(err=>console.error('Realtime invoice refresh failed:',err));});
    };
    if(!financeInvoicesUnsub){
      financeInvoicesUnsub=window.ma3daOnSnapshot(window.ma3daCollection(window.ma3daDB,'projectInvoices'),refreshAfterChange,err=>console.warn('Shared invoice live updates unavailable:',err));
    }
    if(!financePaymentsUnsub){
      financePaymentsUnsub=window.ma3daOnSnapshot(window.ma3daCollection(window.ma3daDB,'projectInvoicePayments'),refreshAfterChange,err=>console.warn('Payment live updates unavailable:',err));
    }
  }
  async function loadFinance(){
    const user=await getUser();
    if(!user?.uid){say(financeMode==='owner'?'ownerInvoiceFeedback':'contractorPaymentFeedback','سجّل الدخول أولًا لعرض الفواتير.',true);return;}
    if(!window.ma3daDB || typeof window.ma3daGetDocs!=='function' || typeof window.ma3daCollection!=='function') throw new Error('Firebase is not ready');
    const projectFields=financeMode==='owner'?['ownerId','userId']:financeMode==='contractor'?['contractorId','ownerId','userId']:[];
    const requestFields=financeMode==='owner'?['equipmentOwnerId','ownerId','operatorId']:financeMode==='customer'?['customerId','requesterId']:['contractorId','requesterId'];
    const invoiceFields=financeMode==='owner'?['ownerId','equipmentOwnerId']:financeMode==='customer'?['customerId']:['contractorId'];
    const paymentFields=financeMode==='customer'?['customerId','submittedBy']:financeMode==='owner'?['ownerId','submittedBy']:['contractorId','submittedBy'];
    const phaseFields=financeMode==='owner'?['ownerId']:['contractorId'];
    const [projects,invoices,payments,requests,phaseRows]=await Promise.all([
      projectFields.length?ma3daReadUserRows('projects',projectFields,user.uid):Promise.resolve([]),
      ma3daReadUserRows('projectInvoices',invoiceFields,user.uid),
      ma3daReadUserRows('projectInvoicePayments',paymentFields,user.uid).catch(err=>{console.warn('Related payment rows are not readable yet.',err);return []; }),
      ma3daReadUserRows('requests',requestFields,user.uid),
      ma3daReadUserRows('projectPhaseTasks',phaseFields,user.uid).catch(err=>{console.warn('Project phase tasks are not readable yet; check Firestore rules.',err);return [];})
    ]);
    cachedProjects=projects.filter(p=>(p.contractorId||p.ownerId||p.userId)===user.uid);
    cachedAllRequests=requests;
    const bookingRows=requests.filter(r=>{
      const ownerId=r.equipmentOwnerId||r.ownerId||r.operatorId||'';
      if(financeMode==='customer') return r.customerId===user.uid && !!r.invoiceNumber;
      if(financeMode==='owner') return ownerId===user.uid && ['invoice_pending','invoice_issued','payment_pending','paid','completed'].includes(String(r.status||'')) && (r.invoiceNumber || ['invoice_pending','completed'].includes(String(r.status||'')));
      return false;
    });
    renderBookingInvoices(bookingRows);
    cachedManagerRequests=requests.filter(r=>!!r.projectId && (r.contractorId===user.uid || r.requesterId===user.uid || r.customerId===user.uid) && (r.requesterRole==='contractor'||r.requesterType==='contractor'||!!r.contractorId) && !['rejected','cancelled','مرفوض','ملغي'].includes(String(r.status||'').toLowerCase()));
    cachedRequests=requests.filter(r=>{
      const isProject=!!(r.projectId && (r.requesterRole==='contractor'||r.requesterType==='contractor'||r.contractorId));
      const ownerId=r.equipmentOwnerId||r.ownerId||r.operatorId||'';
      const accepted=['accepted','arrived','working','completed','complete','invoice_pending','invoice_issued','payment_pending','paid','تم القبول','قيد العمل','مكتمل'].includes(String(r.status||'').toLowerCase());
      return isProject && ownerId===user.uid && accepted;
    });
    cachedInvoices=invoices.filter(i=>{const activeKind=i.invoiceKind==='agreement_installment'||i.invoiceKind==='customer_booking';if(!activeKind)return false;if(financeMode==='owner')return (i.ownerId===user.uid||i.equipmentOwnerId===user.uid);if(financeMode==='customer')return i.customerId===user.uid;return i.invoiceKind==='agreement_installment'&&i.contractorId===user.uid;});
    cachedPhases=phaseRows.filter(ph=>financeMode==='owner'?ph.ownerId===user.uid:ph.contractorId===user.uid);
    const invoiceIds=new Set(cachedInvoices.map(i=>i.id));
    cachedPayments=payments.filter(p=>invoiceIds.has(p.invoiceId));
    renderOwnerRequestOptions(); renderInvoiceOptions(); renderInvoiceCards(); renderStageOptions(); renderOwnerPhaseOptions(); renderProjectStageCards(); renderOwnerWalletSummary();
    ensureFinanceRealtimeUpdates();
  }
  function renderOwnerWalletSummary(){
    const card=$f('ma3daOwnerWalletSummary'),metrics=$f('ma3daOwnerWalletMetrics');
    if(!card||!metrics)return;
    const visible=financeMode==='owner';card.hidden=!visible;if(!visible)return;
    const ownerInvoices=cachedInvoices.filter(i=>i.invoiceKind==='agreement_installment');
    const outstanding=ownerInvoices.reduce((sum,i)=>sum+Math.max(0,Number(i.remainingAmount??i.invoiceAmount??0)),0);
    const pending=cachedPayments.filter(p=>p.status==='pending_verification').reduce((sum,p)=>sum+Number(p.amount||0),0);
    const confirmed=cachedPayments.filter(p=>['verified','confirmed'].includes(p.status)).reduce((sum,p)=>sum+Number(p.amount||0),0);
    const disputed=ownerInvoices.filter(i=>['disputed','under_review'].includes(i.settlementStatus||i.paymentStatus)).reduce((sum,i)=>sum+Math.max(0,Number(i.remainingAmount??i.invoiceAmount??0)),0);
    metrics.innerHTML=`<p><strong>الرصيد المتاح للتحويل:</strong> غير متاح حتى ربط نظام تسويات وتحويلات فعلي</p><p><strong>المستحقات غير المسددة:</strong> ${money(outstanding)}</p><p><strong>المبالغ قيد التحقق:</strong> ${money(pending)}</p><p><strong>الدفعات المؤكدة:</strong> ${money(confirmed)}</p><p><strong>مبالغ محل اعتراض:</strong> ${money(disputed)}</p>`;
  }
  function renderBookingInvoices(rows){
    const list=$f('bookingInvoicesList');
    if(list){
      if(!rows.length){list.innerHTML='<div class="card"><h3>لا توجد فواتير طلبات حتى الآن</h3><p>ستظهر الفاتورة هنا بعد إصدارها. الطلب المنتهي يبقى مفتوحًا ماليًا حتى تأكيد السداد من بوابة دفع موثوقة.</p></div>';}
      else {list.innerHTML='<h3>فواتير طلبات التأجير</h3>'+rows.sort((a,b)=>Number(b.invoiceIssuedAt||b.workCompletedAt||b.completedAt||0)-Number(a.invoiceIssuedAt||a.workCompletedAt||a.completedAt||0)).map(r=>{
        const amount=Number(r.invoiceAmount||r.finalAmount||r.price||0);
        const state=r.paymentStatus==='paid'?'مسددة ومؤكدة':r.invoiceStatus==='issued'?'الفاتورة صادرة — بانتظار الدفع':r.status==='invoice_pending'?'بانتظار إصدار الفاتورة':'بانتظار التسوية';
        const sharedInvoice=cachedInvoices.find(i=>i.id===r.sharedInvoiceId||i.requestId===r.id&&i.invoiceKind==='customer_booking');
        const invoicePayments=sharedInvoice?cachedPayments.filter(p=>p.invoiceId===sharedInvoice.id):[];
        const confirmButtons=financeMode==='owner'?invoicePayments.filter(p=>p.status==='pending_verification').map(p=>`<div class="ma3da-finance-row"><p>إثبات سداد: ${money(p.amount)} — ${esc(p.reference||'بدون مرجع')}</p><button class="main-btn" type="button" data-owner-confirm-payment="${esc(p.id)}">تأكيد استلام الدفعة</button></div>`).join(''):'';
        const issueButton='';
        const payButton='';
        const payNotice='';
        return `<div class="ma3da-finance-row"><h3>${esc(r.invoiceNumber||'فاتورة لم تصدر بعد')}</h3><p><strong>رقم الطلب:</strong> ${esc(r.id)}</p><p><strong>المعدة:</strong> ${esc(r.equipment||'معدة')}</p><p><strong>الموقع:</strong> ${esc(r.location||'—')}</p><p><strong>تاريخ الفاتورة:</strong> ${when(r.invoiceIssuedAt||r.workCompletedAt||r.completedAt)}</p><p><strong>قيمة الفاتورة:</strong> ${money(amount)}</p><p><strong>حالة الفاتورة والسداد:</strong> <span class="ma3da-finance-status">${esc(state)}</span></p><p><strong>حالة الطلب:</strong> ${esc(r.requestClosed?'مغلق ماليًا':'مفتوح حتى تأكيد السداد')}</p>${issueButton}${payButton}${payNotice}${confirmButtons}</div>`;
      }).join('');}
    }
    const select=$f('ownerBookingInvoiceRequest');
    if(select){const eligible=rows.filter(r=>!r.invoiceNumber&&(r.status==='invoice_pending'||r.status==='completed'));select.innerHTML='<option value="">اختر طلبًا انتهى العمل فيه</option>'+eligible.map(r=>`<option value="${esc(r.id)}">${esc(r.equipment||'معدة')} — ${esc(r.location||'الموقع غير محدد')} — ${money(r.price||0)}</option>`).join('');if(!eligible.length)select.innerHTML='<option value="">لا توجد طلبات بانتظار إصدار فاتورة</option>';}
  }
  async function submitBookingPaymentProof(requestId){
    try{
      const user=await getUser();if(!user?.uid)throw new Error('سجّل الدخول أولًا.');
      if(typeof window.ma3daRunTransaction!=='function'||typeof window.ma3daNewPaymentRef!=='function')throw new Error('طبقة المعاملات المالية غير جاهزة.');
      const requestRef=window.ma3daDoc(window.ma3daDB,'requests',requestId);
      const paymentRef=window.ma3daNewPaymentRef();
      const cachedInvoice=cachedInvoices.find(i=>i.requestId===requestId&&i.invoiceKind==='customer_booking');
      const cachedPaid=cachedInvoice?cachedPayments.filter(x=>x.invoiceId===cachedInvoice.id&&['verified','confirmed'].includes(x.status)).reduce((n,x)=>n+Number(x.amount||0),0):0;
      const cachedPending=cachedInvoice?cachedPayments.filter(x=>x.invoiceId===cachedInvoice.id&&x.status==='pending_verification').reduce((n,x)=>n+Number(x.amount||0),0):0;
      const suggested=Math.max(0,Number(cachedInvoice?.invoiceAmount||0)-cachedPaid-cachedPending);
      const raw=prompt('أدخل مبلغ إثبات السداد (ريال سعودي):',suggested.toFixed(2));if(raw===null)return;const amount=Math.round(Number(raw)*100)/100;if(!Number.isFinite(amount)||amount<=0||amount>suggested)throw new Error('أدخل مبلغًا صحيحًا لا يتجاوز المتبقي الظاهر.');
      const reference=(prompt('رقم مرجع التحويل أو وصف السداد النقدي (اختياري):','')||'').trim();
      await window.ma3daRunTransaction(async tx=>{
        const rs=await tx.get(requestRef);if(!rs.exists())throw new Error('الطلب غير موجود.');const request=rs.data()||{};
        if(request.customerId!==user.uid)throw new Error('هذه الفاتورة ليست مرتبطة بحسابك.');
        if(!request.sharedInvoiceId)throw new Error('الفاتورة المشتركة غير جاهزة؛ اطلب من صاحب المعدة إصدارها.');
        const invoiceRef=window.ma3daDoc(window.ma3daDB,'projectInvoices',request.sharedInvoiceId);const ins=await tx.get(invoiceRef);if(!ins.exists())throw new Error('تعذر العثور على الفاتورة المشتركة.');const invoice={...ins.data(),id:ins.id};
        if(invoice.invoiceKind!=='customer_booking'||invoice.requestId!==requestId)throw new Error('الفاتورة لا تطابق طلب العميل.');
        if(invoice.paymentStatus==='paid')throw new Error('الفاتورة مسددة بالفعل.');
        const q=window.ma3daQuery(window.ma3daCollection(window.ma3daDB,'projectInvoicePayments'),window.ma3daWhere('invoiceId','==',invoice.id));const snaps=await tx.get(q);const rows=[];snaps.forEach(d=>rows.push({...d.data(),id:d.id}));
        const paid=rows.filter(x=>['verified','confirmed'].includes(x.status)).reduce((n,x)=>n+Number(x.amount||0),0);const pending=rows.filter(x=>x.status==='pending_verification').reduce((n,x)=>n+Number(x.amount||0),0);const remaining=Math.max(0,Math.round((Number(invoice.invoiceAmount||0)-paid-pending)*100)/100);if(remaining<=0)throw new Error('المبلغ المتبقي مغطى بدفعات مؤكدة أو معلقة.');
        if(amount>remaining+0.009)throw new Error('تغير الرصيد أثناء التسجيل؛ أعد فتح الفاتورة وتحقق من المتبقي.');const now=new Date();
        tx.set(paymentRef,{invoiceId:invoice.id,invoiceKind:'customer_booking',invoiceNumber:invoice.invoiceNumber||'',requestId,customerId:user.uid,ownerId:invoice.ownerId||invoice.equipmentOwnerId||'',amount,currency:'SAR',reference,method:'manual_receipt',status:'pending_verification',submittedBy:user.uid,submittedAt:now,note:'إثبات يدوي غير مؤكد؛ لا يُعد السداد نهائيًا إلا بعد مراجعة صاحب المعدة.',schemaVersion:5});
        const ledger=(Array.isArray(request.paymentLedger)?request.paymentLedger:[]).filter(x=>x.paymentId!==paymentRef.id&&x.id!==paymentRef.id);ledger.push({id:paymentRef.id,paymentId:paymentRef.id,invoiceId:invoice.id,amount,reference,status:'pending_owner_review',submittedAt:now,submittedBy:user.uid});
        tx.update(requestRef,{paymentLedger:ledger,paymentStatus:'pending_review',lastPaymentSubmittedAt:now,updatedAt:now});tx.update(invoiceRef,{paymentStatus:'payment_submitted',lastPaymentSubmittedAt:now,updatedAt:now});
      });
      alert('تم تسجيل إثبات السداد للمراجعة فقط؛ لم يتم تأكيد وصول المال أو تنفيذ دفع إلكتروني.');await loadFinance();
    }catch(err){if(err.message!=='أُلغي تسجيل إثبات السداد.')console.error('Submit booking payment proof failed:',err);if(err.message!=='أُلغي تسجيل إثبات السداد.')alert(err.message||'تعذر تسجيل إثبات السداد.');}
  }
  async function issueBookingInvoice(requestIdFromButton){
    const btn=$f('ownerIssueBookingInvoiceBtn');if(btn)btn.disabled=true;
    try{
      const user=await getUser();if(!user?.uid)throw new Error('سجّل الدخول أولًا.');
      if(typeof window.ma3daRunTransaction!=='function'||typeof window.ma3daNewInvoiceRef!=='function')throw new Error('طبقة المعاملات المالية غير جاهزة.');
      const requestId=requestIdFromButton||$f('ownerBookingInvoiceRequest')?.value;if(!requestId)throw new Error('اختر الطلب أولًا.');
      const ref=window.ma3daDoc(window.ma3daDB,'requests',requestId);const invoiceRef=window.ma3daNewInvoiceRef();const now=new Date();
      await window.ma3daRunTransaction(async tx=>{
        const snap=await tx.get(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');const r=snap.data()||{};
        const ownerId=r.equipmentOwnerId||r.ownerId||r.operatorId||'';if(ownerId!==user.uid)throw new Error('لا تملك صلاحية إصدار فاتورة لهذا الطلب.');
        if(r.invoiceNumber||r.sharedInvoiceId)throw new Error('صدرت فاتورة لهذا الطلب بالفعل.');if(!['invoice_pending','completed'].includes(String(r.status||'')))throw new Error('لا تصدر الفاتورة إلا بعد تسجيل انتهاء العمل.');
        const amount=Number(requestIdFromButton?(r.price||0):$f('ownerBookingInvoiceAmount')?.value);if(!Number.isFinite(amount)||amount<=0)throw new Error('أدخل مبلغًا صحيحًا للفاتورة.');const finalAmount=Math.round(amount*100)/100;const invoiceNumber='M3-B-'+Date.now();const description=($f('ownerBookingInvoiceDescription')?.value||'').trim()||'فاتورة تأجير '+(r.equipment||'معدة');
        tx.set(invoiceRef,{invoiceKind:'customer_booking',invoiceNumber,requestId,customerId:r.customerId||'',customerEmail:r.customerEmail||'',ownerId,equipmentOwnerId:ownerId,ownerEmail:user.email||'',equipment:r.equipment||'معدة',equipmentId:r.equipmentId||'',projectName:r.projectName||'',invoiceAmount:finalAmount,paidAmount:0,remainingAmount:finalAmount,currency:'SAR',description,paymentMethod:'manual_receipt',status:'issued',paymentStatus:'unpaid',settlementStatus:'settlement_pending',paymentEvents:[],createdBy:user.uid,createdAt:now,updatedAt:now,schemaVersion:5,financialPolicyVersion:'ma3da-finance-v1'});
        tx.update(ref,{invoiceNumber,sharedInvoiceId:invoiceRef.id,invoiceAmount:finalAmount,invoiceDescription:description,invoiceStatus:'issued',paymentStatus:'unpaid',paidTotal:0,remainingBalance:finalAmount,invoiceIssuedAt:now,invoiceIssuedBy:user.uid,updatedAt:now,status:'invoice_issued',requestClosed:false,financialPolicyVersion:'ma3da-finance-v1'});
      });
      say('ownerBookingInvoiceFeedback','صدرت الفاتورة المشتركة وحُفظ رابطها مع الطلب في معاملة واحدة. لا يعني ذلك تحصيلًا إلكترونيًا.');if($f('ownerBookingInvoiceAmount'))$f('ownerBookingInvoiceAmount').value='';if($f('ownerBookingInvoiceDescription'))$f('ownerBookingInvoiceDescription').value='';await loadFinance();
    }catch(err){console.error('Issue booking invoice failed:',err);say('ownerBookingInvoiceFeedback',err.message||'تعذر إصدار الفاتورة.',true);}finally{if(btn)btn.disabled=false;}
  }
  function renderOwnerRequestOptions(){
    const el=$f('ownerInvoiceRequest');if(!el)return;
    el.innerHTML='<option value="">اختر طلب المشروع</option>'+cachedRequests.map(r=>`<option value="${esc(r.id)}">${esc(r.projectName||'مشروع')} — ${esc(r.equipment||'معدة')} — ${money(r.price||0)}</option>`).join('');
    if(!cachedRequests.length)el.innerHTML='<option value="">لا توجد طلبات مشروع مؤهلة لإصدار فاتورة</option>';
  }
  function stageName(n){return ({1:'المرحلة الأولى',2:'المرحلة الثانية',3:'المرحلة الثالثة',4:'المرحلة الرابعة'})[Number(n)]||'مرحلة غير محددة';}
  function renderStageOptions(){
    const projects=$f('contractorStageProject');
    if(projects){const current=projects.value;projects.innerHTML='<option value="">اختر المشروع</option>'+cachedProjects.map(p=>`<option value="${esc(p.id)}">${esc(p.name||p.projectName||'مشروع بدون اسم')}</option>`).join('');if(cachedProjects.some(p=>p.id===current))projects.value=current;}
    renderManagerRequestOptions();
  }
  function renderManagerRequestOptions(){
    const projectId=$f('contractorStageProject')?.value||'';const el=$f('contractorStageRequest');if(!el)return;
    const rows=cachedManagerRequests.filter(r=>!projectId||r.projectId===projectId);
    el.innerHTML='<option value="">اختر طلب المعدة</option>'+rows.map(r=>`<option value="${esc(r.id)}">${esc(r.projectName||'مشروع')} — ${esc(r.equipment||'معدة')} — ${esc(r.equipmentOwnerName||r.ownerName||'صاحب المعدة')}</option>`).join('');
    if(!rows.length)el.innerHTML='<option value="">لا توجد طلبات معدات مرتبطة بالمشروع</option>';
  }
  function renderOwnerPhaseOptions(){
    const el=$f('ownerPhaseTask');if(!el)return;
    const rows=cachedPhases.filter(p=>['completion_requested','completion_announced','disputed','approved_for_invoice'].includes(p.status)&&!p.invoiceId);
    el.innerHTML='<option value="">اختر المرحلة</option>'+rows.map(p=>`<option value="${esc(p.id)}">${esc(p.projectName||'مشروع')} — ${esc(p.stageName||stageName(p.stageNumber))} — ${esc(statusLabel(p.status))}</option>`).join('');
    if(!rows.length)el.innerHTML='<option value="">لا توجد مراحل بانتظار المراجعة أو الفاتورة</option>';
    syncOwnerInvoiceFields();
  }
  function renderProjectStageCards(){
    const el=$f('contractorProjectStagesList');if(!el)return;
    if(!cachedPhases.length){el.innerHTML='<div class="ma3da-finance-row"><p>ستظهر هنا طلبات اعتماد انتهاء المراحل، وقرارات المراجعة، والفواتير وحالة السداد.</p></div>';return;}
    el.innerHTML='<h3>سجل مراحل المشروع</h3>'+[...cachedPhases].sort((a,b)=>Number(b.stageNumber||0)-Number(a.stageNumber||0)).map(p=>`<div class="ma3da-finance-row"><strong>${esc(p.projectName||'مشروع')} — ${esc(p.stageName||stageName(p.stageNumber))}</strong><p>المعدة: ${esc(p.equipment||'معدة')}</p><p>الحالة: <span class="ma3da-finance-status">${esc(statusLabel(p.status))}</span></p>${p.invoiceNumber?`<p>الفاتورة: ${esc(p.invoiceNumber)}</p>`:''}</div>`).join('');
  }
  async function announceStageCompletion(){
    const btn=$f('contractorAnnounceStageBtn');if(btn)btn.disabled=true;
    try{
      const user=await getUser();if(!user?.uid)throw new Error('سجّل الدخول أولًا.');
      const projectId=$f('contractorStageProject')?.value;const requestId=$f('contractorStageRequest')?.value;const stageNumber=Number($f('contractorStageNumber')?.value);
      const project=cachedProjects.find(p=>p.id===projectId);const request=cachedManagerRequests.find(r=>r.id===requestId);
      if(!project)throw new Error('اختر مشروعًا تملكه أو تديره.');
      if(!request||request.projectId!==projectId)throw new Error('اختر طلب معدة تابعًا للمشروع المحدد.');
      const contractorId=request.contractorId||request.requesterId||request.customerId;
      if(contractorId!==user.uid)throw new Error('لا تملك صلاحية إعلان انتهاء هذه المرحلة.');
      const ownerId=request.equipmentOwnerId||request.ownerId||request.operatorId||'';if(!ownerId)throw new Error('طلب المعدة لا يحتوي على معرّف صاحب المعدة.');
      if(![1,2,3,4].includes(stageNumber))throw new Error('اختر مرحلة من المراحل الأربع.');
      if(stageNumber>1){
        const previous=cachedPhases.find(p=>p.requestId===request.id&&Number(p.stageNumber)===stageNumber-1);
        if(!previous||previous.status!=='payment_confirmed')throw new Error(`لا يمكن إنهاء ${stageName(stageNumber)} قبل تأكيد سداد ${stageName(stageNumber-1)} لهذا الطلب.`);
      }
      if(cachedPhases.some(p=>p.requestId===request.id&&Number(p.stageNumber)===stageNumber&&p.status!=='cancelled'))throw new Error('سبق تسجيل هذه المرحلة لهذا الطلب.');
      await window.ma3daAddDoc(col('projectPhaseTasks'),{
        projectId,projectName:project.name||project.projectName||request.projectName||'مشروع',
        contractorId:user.uid,contractorName:project.contractorName||request.contractorName||'',
        ownerId,requestId:request.id,equipment:request.equipment||'معدة',equipmentId:request.equipmentId||'',
        stageNumber,stageName:stageName(stageNumber),status:'completion_requested',
        announcedBy:user.uid,announcedAt:new Date(),ownerNotifiedAt:new Date(),invoiceId:null,invoiceNumber:null,
        schemaVersion:1,createdAt:new Date(),updatedAt:new Date()
      });
      say('contractorStageFeedback',`تم إرسال طلب اعتماد انتهاء ${stageName(stageNumber)} لصاحب المعدة. لن تصدر الفاتورة حتى يراجع الأعمال ويعتمد المرحلة.`);
      await loadFinance();
    }catch(err){console.error('Announce project stage failed:',err);say('contractorStageFeedback',err.message||'تعذر إعلان انتهاء المرحلة. تحقق من صلاحيات Firebase.',true);}
    finally{if(btn)btn.disabled=false;}
  }
  function renderInvoiceOptions(){
    const el=$f('contractorPaymentInvoice');if(!el)return;
    el.innerHTML='<option value="">اختر الفاتورة</option>'+cachedInvoices.filter(i=>i.contractorId).map(i=>`<option value="${esc(i.id)}">${esc(i.invoiceNumber||i.id)} — ${esc(i.projectName||'مشروع')} — ${money(i.invoiceAmount)}</option>`).join('');
    if(!cachedInvoices.some(i=>i.contractorId))el.innerHTML='<option value="">لا توجد فواتير مستحقة مرتبطة بحسابك</option>';
  }
  function paymentSummary(invoice){
    const rows=cachedPayments.filter(p=>p.invoiceId===invoice.id);
    const verified=rows.filter(p=>['verified','confirmed'].includes(p.status));
    const paid=verified.reduce((sum,p)=>sum+Number(p.amount||0),0);
    const pending=rows.filter(p=>p.status==='pending_verification').reduce((sum,p)=>sum+Number(p.amount||0),0);
    return {paid,pending,remaining:Math.max(0,Number(invoice.invoiceAmount||0)-paid)};
  }
  function renderInvoiceCards(){
    const list=$f('contractorInvoicesList');if(!list)return;
    const activeInvoices=cachedInvoices.filter(i=>i.invoiceKind==='agreement_installment');
    if(!activeInvoices.length){list.innerHTML=`<div class="card"><h3>${financeMode==='owner'?'لا توجد فواتير مشاريع حتى الآن':'لا توجد فواتير مشاريع واردة حتى الآن'}</h3><p>${financeMode==='owner'?'ستظهر هنا فواتير اتفاقيات تأجير المعدات للمشاريع.':'ستظهر هنا الفواتير المشتركة لاتفاقيات تأجير المعدات للمشاريع.'}</p></div>`;return;}
    const sorted=[...activeInvoices].sort((a,b)=>{
      const toTime=v=>{try{return (v?.toDate?v.toDate():new Date(v||0)).getTime()||0}catch(_){return 0}};
      return toTime(b.createdAt)-toTime(a.createdAt);
    });
    list.innerHTML='<div class="card"><h3>'+(financeMode==='owner'?'فواتير معداتي ومستحقاتي':'الفواتير المطلوب سدادها')+'</h3><p>راجع قيمة الفاتورة والدفعات وحالة السداد من هنا.</p>'+sorted.map(inv=>{
      const s=paymentSummary(inv); const st=s.remaining<=0?'paid':s.paid>0?'partial':(s.pending>0?'pending_verification':'issued');
      const payRows=cachedPayments.filter(p=>p.invoiceId===inv.id).map(p=>`<div class="ma3da-finance-row"><strong>دفعة: ${money(p.amount)}</strong><p>الحالة: <span class="ma3da-finance-status">${esc(statusLabel(p.status))}</span></p><p>المرجع: ${esc(p.reference||'—')}</p>${financeMode==='owner'&&p.status==='pending_verification'?`<button type="button" class="main-btn" data-owner-confirm-payment="${esc(p.id)}">تأكيد استلام الدفعة</button>`:''}</div>`).join('');
      const counterparty=financeMode==='owner'?`<p><strong>مسؤول المشروع:</strong> ${esc(inv.contractorName||inv.contractorEmail||'المقاول')}</p>`:`<p><strong>صاحب المعدة:</strong> ${esc(inv.ownerName||inv.ownerEmail||'صاحب المعدة')}</p>`;
      return `<div class="ma3da-finance-row"><h3>${esc(inv.invoiceNumber||'فاتورة')}</h3>${counterparty}<p><strong>المشروع:</strong> ${esc(inv.projectName||'—')}</p>${inv.stageNumber?`<p><strong>المرحلة:</strong> ${esc(inv.stageName||stageName(inv.stageNumber))}</p>`:''}<p><strong>المعدة:</strong> ${esc(inv.equipment||'—')}</p><p><strong>تاريخ الإصدار:</strong> ${when(inv.createdAt)}</p><p><strong>التفاصيل:</strong> ${esc(inv.description||'—')}</p><p><strong>قيمة الفاتورة:</strong> ${money(inv.invoiceAmount)}</p><p><strong>المدفوع المؤكد:</strong> ${money(s.paid)}</p><p><strong>دفعات بانتظار التحقق:</strong> ${money(s.pending)}</p><p><strong>المتبقي:</strong> ${money(s.remaining)}</p>${inv.invoiceKind==='agreement_installment'?`<p><strong>الدفعة:</strong> ${esc(inv.installmentLabel||`${inv.installmentIndex||''} من ${inv.installmentCount||''}`)}</p><p><strong>تاريخ الاستحقاق:</strong> ${when(inv.dueAt)}</p>`:''}${financeMode==='owner'?`<p><strong>حالة التسوية:</strong> ${esc(statusLabel(inv.settlementStatus||'settlement_pending'))}</p>`:''}<p>الحالة: <span class="ma3da-finance-status">${esc(statusLabel(st))}</span></p>${inv.paymentMethod==='gateway'&&s.remaining>0&&financeMode==='owner'?`<p class="muted">وسائل الدفع الإلكتروني (Apple Pay، مدى، Visa وMastercard) تتطلب ربط بوابة الدفع وتأكيدها الموثوق؛ لم تُفعّل عملية دفع غير مربوطة.</p>`:''}${financeMode==='contractor'&&s.remaining>0&&inv.paymentMethod==='cash'?`<button type="button" class="main-btn" data-finance-pay-invoice="${esc(inv.id)}">توثيق سداد نقدي لهذه الفاتورة</button>`:''}${financeMode==='contractor'&&s.remaining>0&&inv.paymentMethod!=='cash'?`<p class="muted">الدفع الإلكتروني غير مفعّل حتى ربط بوابة دفع وتأكيد العملية منها؛ لا تسجّل زرًا بديلًا على أنه دفع ناجح.</p>`:''}${payRows?'<details><summary>تفاصيل الدفعات</summary>'+payRows+'</details>':''}</div>`;
    }).join('')+'</div>';
  }
  async function reviewOwnerPhase(decision){
    const approveBtn=$f('ownerApprovePhaseBtn');const disputeBtn=$f('ownerDisputePhaseBtn');
    if(approveBtn)approveBtn.disabled=true;if(disputeBtn)disputeBtn.disabled=true;
    try{
      const user=await getUser();if(!user?.uid)throw new Error('سجّل الدخول أولًا.');
      const phaseId=$f('ownerPhaseTask')?.value;
      const phase=cachedPhases.find(p=>p.id===phaseId);
      if(!phase||phase.invoiceId)throw new Error('اختر مرحلة موجودة ولم تصدر فاتورتها.');
      if(phase.ownerId!==user.uid)throw new Error('هذه المرحلة ليست مرتبطة بحسابك.');
      if(!['completion_requested','completion_announced','disputed'].includes(phase.status))throw new Error('هذه المرحلة ليست بانتظار المراجعة؛ تحقق من حالتها.');
      const note=($f('ownerPhaseReviewNote')?.value||'').trim();
      if(decision==='disputed'&&!note)throw new Error('اكتب الملاحظة أو سبب الخلاف قبل تسجيله.');
      const nextStatus=decision==='approve'?'approved_for_invoice':'disputed';
      const patch={status:nextStatus,reviewedBy:user.uid,reviewedAt:new Date(),reviewNote:note,updatedAt:new Date()};
      if(decision==='disputed'){patch.disputeNote=note;patch.disputedAt=new Date();}
      else {patch.approvedForInvoiceAt=new Date();patch.disputeNote='';}
      await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'projectPhaseTasks',phase.id),patch);
      say('ownerInvoiceFeedback',decision==='approve'?'تم اعتماد انتهاء المرحلة. يمكنك الآن إصدار الفاتورة من قسم إصدار فاتورة المرحلة المعتمدة.':'تم تسجيل الملاحظة/الخلاف. بقيت المرحلة قيد المراجعة ولن تصدر لها فاتورة حتى تُعتمد.');
      await loadFinance();
      const issueFields=$f('ownerInvoiceIssueFields');if(issueFields)issueFields.hidden=decision!=='approve';
    }catch(err){console.error('Owner phase review failed:',err);say('ownerInvoiceFeedback',err.message||'تعذرت مراجعة المرحلة. تحقق من صلاحيات Firebase.',true);}
    finally{if(approveBtn)approveBtn.disabled=false;if(disputeBtn)disputeBtn.disabled=false;}
  }
  function syncOwnerInvoiceFields(){
    const phaseId=$f('ownerPhaseTask')?.value;
    const phase=cachedPhases.find(p=>p.id===phaseId);
    const fields=$f('ownerInvoiceIssueFields');
    if(fields)fields.hidden=!(phase&&phase.status==='approved_for_invoice'&&!phase.invoiceId);
    const note=$f('ownerPhaseReviewNote');
    if(note&&phase?.status==='disputed'&&!note.value)note.value=phase.disputeNote||phase.reviewNote||'';
  }
  async function issueOwnerInvoice(){
    const btn=$f('ownerIssueInvoiceBtn');if(btn)btn.disabled=true;
    let invoiceCreated=false;
    try{
      const user=await getUser();if(!user?.uid)throw new Error('سجّل الدخول أولًا.');
      const phaseId=$f('ownerPhaseTask')?.value;
      const phase=cachedPhases.find(p=>p.id===phaseId);
      if(!phase||phase.status!=='approved_for_invoice'||phase.invoiceId)throw new Error('لا يمكن إصدار الفاتورة قبل اعتماد انتهاء المرحلة من صاحب المعدة.');
      if(phase.ownerId!==user.uid)throw new Error('هذه المرحلة ليست مرتبطة بحسابك.');
      const request=cachedAllRequests.find(r=>r.id===phase.requestId);
      if(!request)throw new Error('تعذر العثور على طلب المعدة المرتبط بهذه المرحلة.');
      const amount=Number($f('ownerPhaseInvoiceAmount')?.value);
      if(!Number.isFinite(amount)||amount<=0)throw new Error('أدخل مبلغًا صحيحًا للفاتورة.');
      const description=($f('ownerInvoiceDescription')?.value||'').trim()||`فاتورة ${phase.stageName||stageName(phase.stageNumber)} — ${phase.projectName||'مشروع'}`;
      const invoiceNumber=`M3-${Date.now()}`;
      const invoiceRef=await window.ma3daAddDoc(col('projectInvoices'),{
        phaseTaskId:phase.id,stageNumber:Number(phase.stageNumber),stageName:phase.stageName||stageName(phase.stageNumber),
        requestId:request.id,projectId:phase.projectId,projectName:phase.projectName||request.projectName||'مشروع',
        contractorId:phase.contractorId,contractorName:phase.contractorName||request.contractorName||'',contractorEmail:request.contractorEmail||'',
        ownerId:user.uid,ownerEmail:user.email||'',ownerName:request.ownerName||'',equipmentOwnerId:user.uid,
        equipment:phase.equipment||request.equipment||'معدة',equipmentId:phase.equipmentId||request.equipmentId||'',
        invoiceNumber,invoiceAmount:Math.round(amount*100)/100,description,currency:'SAR',
        status:'issued',paymentStatus:'awaiting_payment',settlementStatus:'settlement_pending',
        createdBy:user.uid,createdAt:new Date(),updatedAt:new Date(),schemaVersion:3
      });
      invoiceCreated=true;
      await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'projectPhaseTasks',phase.id),{
        status:'invoice_issued',invoiceId:invoiceRef.id,invoiceNumber,invoiceAmount:Math.round(amount*100)/100,
        invoiceIssuedAt:new Date(),updatedAt:new Date()
      });
      $f('ownerPhaseInvoiceAmount').value='';$f('ownerInvoiceDescription').value='';
      say('ownerInvoiceFeedback',`تم إرسال فاتورة ${phase.stageName||stageName(phase.stageNumber)} لمسؤول المشروع وحفظها في سجل الطرفين. لم يتم تحصيل أي مبلغ بعد.`);
      await loadFinance();
    }catch(err){console.error('Issue phase invoice failed:',err);say('ownerInvoiceFeedback',(invoiceCreated?'أُنشئت الفاتورة لكن تعذر تحديث حالة المرحلة. ':'')+(err.message||'تعذر إصدار الفاتورة. تحقق من صلاحيات Firebase.'),true);}
    finally{if(btn)btn.disabled=false;}
  }
  async function confirmPaymentReceived(paymentId){
    try{
      const user=await getUser(); if(!user?.uid) throw new Error('سجّل الدخول أولًا.');
      if(financeMode!=='owner') throw new Error('تأكيد الاستلام متاح لصاحب المعدة فقط.');
      if(typeof window.ma3daRunTransaction!=='function') throw new Error('يلزم تحديث طبقة Firebase للمعاملات المالية الآمنة.');
      const paymentRef=window.ma3daDoc(window.ma3daDB,'projectInvoicePayments',paymentId);
      const result=await window.ma3daRunTransaction(async tx=>{
        const ps=await tx.get(paymentRef); if(!ps.exists()) throw new Error('الدفعة غير موجودة.');
        const payment={...ps.data(),id:ps.id};
        if(payment.status!=='pending_verification') throw new Error('تمت مراجعة هذه الدفعة مسبقًا أو لم تعد معلقة.');
        const invoiceRef=window.ma3daDoc(window.ma3daDB,'projectInvoices',payment.invoiceId);
        const is=await tx.get(invoiceRef); if(!is.exists()) throw new Error('الفاتورة المرتبطة بالدفعة غير موجودة.');
        const invoice={...is.data(),id:is.id};
        if((invoice.ownerId||invoice.equipmentOwnerId)!==user.uid || (payment.ownerId && payment.ownerId!==user.uid)) throw new Error('لا تملك صلاحية تأكيد هذه الفاتورة.');
        if(!['agreement_installment','customer_booking'].includes(invoice.invoiceKind)) throw new Error('نوع الفاتورة غير معتمد في المسار المالي الحالي.');
        const requestRef=invoice.requestId?window.ma3daDoc(window.ma3daDB,'requests',invoice.requestId):null;
        const rs=requestRef?await tx.get(requestRef):null;
        const request=rs&&rs.exists()?(rs.data()||{}):null;
        const invoicePaymentsQuery=window.ma3daQuery(window.ma3daCollection(window.ma3daDB,'projectInvoicePayments'),window.ma3daWhere('invoiceId','==',invoice.id));
        const ips=await tx.get(invoicePaymentsQuery);
        const invPayments=[];ips.forEach(d=>invPayments.push({...d.data(),id:d.id}));
        const requestPaymentsQuery=invoice.requestId?window.ma3daQuery(window.ma3daCollection(window.ma3daDB,'projectInvoicePayments'),window.ma3daWhere('requestId','==',invoice.requestId)):null;
        const rps=requestPaymentsQuery?await tx.get(requestPaymentsQuery):null;
        const reqPayments=[];if(rps)rps.forEach(d=>reqPayments.push({...d.data(),id:d.id}));
        const amount=Math.round(Number(payment.amount||0)*100)/100; if(!Number.isFinite(amount)||amount<=0) throw new Error('قيمة الدفعة غير صحيحة.');
        const totalBefore=invPayments.filter(x=>x.id!==payment.id&&['verified','confirmed'].includes(x.status)).reduce((n,x)=>n+Number(x.amount||0),0);
        const pendingOthers=invPayments.filter(x=>x.id!==payment.id&&x.status==='pending_verification').reduce((n,x)=>n+Number(x.amount||0),0);
        const invoiceTotal=Math.round(Number(invoice.invoiceAmount||0)*100)/100;
        if(totalBefore+amount>invoiceTotal+0.009) throw new Error('تأكيد هذه الدفعة سيتجاوز قيمة الفاتورة. راجع الدفعات المسجلة.');
        if(totalBefore+pendingOthers+amount>invoiceTotal+0.009) throw new Error('مجموع الدفعات المؤكدة والمعلقة يتجاوز قيمة الفاتورة؛ عالج الإثباتات المعلقة أولًا.');
        const now=new Date(); const totalAfter=Math.round((totalBefore+amount)*100)/100; const invoiceRemaining=Math.max(0,Math.round((invoiceTotal-totalAfter)*100)/100);
        const events=Array.isArray(invoice.paymentEvents)?invoice.paymentEvents.slice():[];
        const ledger=request&&Array.isArray(request.paymentLedger)?request.paymentLedger.slice():[];
        const li=ledger.findIndex(x=>x.id===payment.id||x.paymentId===payment.id);
        const ledgerEntry={id:payment.id,paymentId:payment.id,invoiceId:invoice.id,amount,reference:payment.reference||'',status:'confirmed',submittedBy:payment.submittedBy||payment.customerId||payment.contractorId||'',submittedAt:payment.submittedAt||now,reviewedBy:user.uid,verifiedAt:now};
        if(li>=0) ledger[li]={...ledger[li],...ledgerEntry}; else ledger.push(ledgerEntry);
        let requestPatch=null;
        if(request){
          const paidAcrossRequest=reqPayments.filter(x=>x.id!==payment.id&&['verified','confirmed'].includes(x.status)).reduce((n,x)=>n+Number(x.amount||0),0)+amount;
          const isBooking=invoice.invoiceKind==='customer_booking';
          const requestTotal=isBooking?invoiceTotal:Number(request.price||request.agreementTotal||invoice.agreementTotal||invoiceTotal);
          const requestPaid=Math.round(paidAcrossRequest*100)/100; const remaining=Math.max(0,Math.round((requestTotal-requestPaid)*100)/100);
          let schedule=Array.isArray(request.paymentSchedule)?request.paymentSchedule.map(x=>({...x})):[];
          if(!isBooking && Number(invoice.installmentIndex)>0){
            const idx=schedule.findIndex(x=>Number(x.installment)===Number(invoice.installmentIndex));
            if(idx>=0){const paidOnInvoice=totalAfter;schedule[idx]={...schedule[idx],paidAmount:paidOnInvoice,status:invoiceRemaining<=0?'paid':'due',paidAt:invoiceRemaining<=0?now:(schedule[idx].paidAt||null),reviewStatus:invoiceRemaining<=0?'confirmed':'partial'};}
          }
          const canClose=isBooking?remaining<=0:(remaining<=0&&['completed','complete','invoice_issued','paid'].includes(String(request.status||'')));
          requestPatch={paymentLedger:ledger,paidTotal:requestPaid,remainingBalance:remaining,paymentStatus:remaining<=0?'paid':(requestPaid>0?'partially_paid':'unpaid'),paymentSchedule:schedule,settlementStatus:remaining<=0?'settled':'needs_settlement',requestClosed:canClose,lastPaymentConfirmedAt:now,updatedAt:now};
          if(isBooking&&remaining<=0){requestPatch.status='paid';requestPatch.invoiceStatus='paid';requestPatch.paymentStatus='paid';}
        }
        tx.update(paymentRef,{status:'verified',verifiedBy:user.uid,verifiedAt:now,verificationMethod:'owner_confirmed_receipt',updatedAt:now});
        tx.update(invoiceRef,{paymentStatus:invoiceRemaining<=0?'paid':'partially_paid',paidAmount:totalAfter,remainingAmount:invoiceRemaining,settlementStatus:invoiceRemaining<=0?'settled':'settlement_pending',lastPaymentConfirmedAt:now,paymentEvents:[...events,{type:'payment_confirmed',paymentId:payment.id,amount,verifiedBy:user.uid,verifiedAt:now,method:payment.reference?'cash_or_transfer_receipt':'manual_receipt_review'}],updatedAt:now});
        if(requestRef&&requestPatch) tx.update(requestRef,requestPatch);
        return {invoiceRemaining,requestRemaining:requestPatch?.remainingBalance??null};
      });
      say('ownerInvoiceFeedback','تم تأكيد الإثبات وتحديث الدفعة والفاتورة والطلب ضمن معاملة Firebase واحدة. هذا تأكيد يدوي للاستلام، وليس تحصيلًا إلكترونيًا.');
      await loadFinance();
    }catch(err){console.error('Confirm payment receipt failed:',err);say('ownerInvoiceFeedback',err.message||'تعذر تأكيد استلام الدفعة. تحقق من الصلاحيات والاتصال.',true);}
  }
  async function submitPayment(invoiceIdFromButton){
    const btn=$f('contractorSubmitPaymentBtn');if(btn)btn.disabled=true;
    try{
      const user=await getUser();if(!user?.uid)throw new Error('سجّل الدخول أولًا.');
      if(typeof window.ma3daRunTransaction!=='function'||typeof window.ma3daNewPaymentRef!=='function')throw new Error('طبقة المعاملات المالية غير جاهزة.');
      const invoiceId=invoiceIdFromButton||$f('contractorPaymentInvoice')?.value;const invoiceCached=cachedInvoices.find(i=>i.id===invoiceId);if(!invoiceCached)throw new Error('اختر فاتورة واردة تخص أحد مشاريعك.');if(invoiceCached.contractorId!==user.uid)throw new Error('هذه الفاتورة ليست مرتبطة بحسابك.');
      const amount=Math.round(Number($f('contractorPaymentAmount')?.value)*100)/100;const reference=($f('contractorPaymentReference')?.value||'').trim();if(!Number.isFinite(amount)||amount<=0)throw new Error('أدخل قيمة دفعة صحيحة.');
      const invoiceRef=window.ma3daDoc(window.ma3daDB,'projectInvoices',invoiceId);const requestRef=invoiceCached.requestId?window.ma3daDoc(window.ma3daDB,'requests',invoiceCached.requestId):null;const paymentRef=window.ma3daNewPaymentRef();
      await window.ma3daRunTransaction(async tx=>{
        const ins=await tx.get(invoiceRef);if(!ins.exists())throw new Error('الفاتورة غير موجودة.');const invoice={...ins.data(),id:ins.id};if(invoice.contractorId!==user.uid)throw new Error('هذه الفاتورة ليست مرتبطة بحسابك.');if(invoice.paymentStatus==='paid')throw new Error('الفاتورة مسددة بالفعل.');
        let request=null;if(requestRef){const rs=await tx.get(requestRef);if(!rs.exists())throw new Error('طلب المشروع المرتبط بالفاتورة غير موجود.');request=rs.data()||{};if(request.contractorId!==user.uid)throw new Error('الطلب لا يتبع حساب المقاول الحالي.');}
        const q=window.ma3daQuery(window.ma3daCollection(window.ma3daDB,'projectInvoicePayments'),window.ma3daWhere('invoiceId','==',invoiceId));const snaps=await tx.get(q);const rows=[];snaps.forEach(d=>rows.push({...d.data(),id:d.id}));
        const paid=rows.filter(x=>['verified','confirmed'].includes(x.status)).reduce((n,x)=>n+Number(x.amount||0),0);const pending=rows.filter(x=>x.status==='pending_verification').reduce((n,x)=>n+Number(x.amount||0),0);const remaining=Math.max(0,Math.round((Number(invoice.invoiceAmount||0)-paid-pending)*100)/100);if(amount>remaining+0.009)throw new Error('قيمة الدفعة تتجاوز المتبقي بعد احتساب الدفعات المعلقة.');
        if(invoice.invoiceKind==='agreement_installment'&&request){const idx=(Array.isArray(request.paymentSchedule)?request.paymentSchedule:[]).findIndex(x=>Number(x.installment)===Number(invoice.installmentIndex));if(idx>=0){const item=request.paymentSchedule[idx];if(item.status!=='due')throw new Error(item.status==='paid'?'هذا القسط مسدد بالفعل.':'لم يحِن موعد استحقاق هذا القسط بعد.');}}
        if(invoice.dueAt){const due=invoice.dueAt?.toDate?invoice.dueAt.toDate():new Date(invoice.dueAt);if(Number.isFinite(due.getTime())&&due.getTime()>Date.now())throw new Error('لم يحِن موعد استحقاق هذه الدفعة بعد.');}
        const now=new Date();tx.set(paymentRef,{invoiceId,invoiceKind:invoice.invoiceKind||'agreement_installment',contractorId:user.uid,ownerId:invoice.ownerId||invoice.equipmentOwnerId||'',projectId:invoice.projectId||'',requestId:invoice.requestId||'',projectName:invoice.projectName||'',invoiceNumber:invoice.invoiceNumber||'',installmentIndex:invoice.installmentIndex||null,amount,currency:'SAR',reference,method:'manual_receipt',status:'pending_verification',submittedBy:user.uid,submittedAt:now,note:'إثبات يدوي غير مؤكد؛ لا يعتبر تحصيلًا إلكترونيًا.',schemaVersion:5});
        const ledger=request&&Array.isArray(request.paymentLedger)?request.paymentLedger.slice():[];ledger.push({id:paymentRef.id,paymentId:paymentRef.id,invoiceId,installmentIndex:Math.max(0,Number(invoice.installmentIndex||1)-1),amount,reference,status:'pending_owner_review',submittedAt:now,submittedBy:user.uid});
        if(request){const schedule=(Array.isArray(request.paymentSchedule)?request.paymentSchedule.map(x=>({...x})):[]);const idx=schedule.findIndex(x=>Number(x.installment)===Number(invoice.installmentIndex));if(idx>=0)schedule[idx]={...schedule[idx],status:'pending_review',submittedAmount:Math.round((Number(schedule[idx].submittedAmount||0)+amount)*100)/100,submittedAt:now,receiptReference:reference};tx.update(requestRef,{paymentLedger:ledger,paymentSchedule:schedule,paymentStatus:'pending_review',updatedAt:now});}
        tx.update(invoiceRef,{paymentStatus:'payment_submitted',lastPaymentSubmittedAt:now,updatedAt:now});
      });
      if($f('contractorPaymentAmount'))$f('contractorPaymentAmount').value='';if($f('contractorPaymentReference'))$f('contractorPaymentReference').value='';say('contractorPaymentFeedback','تم تسجيل إثبات السداد للمراجعة فقط، وتحديث الطلب والفاتورة معًا. لم يتم تنفيذ تحصيل إلكتروني.');await loadFinance();
    }catch(err){console.error('Submit payment record failed:',err);say('contractorPaymentFeedback',err.message||'تعذر تسجيل الدفعة. تحقق من الصلاحيات والاتصال.',true);}finally{if(btn)btn.disabled=false;}
  }
  document.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.id==='contractorFinanceBtn'){openFinance('contractor');return;}
    if(target.id==='contractorProjectStageBtn'){openFinance('contractor');return;}
    if(target.id==='operatorFinanceBtn'){openFinance('owner');return;}
    if(target.id==='openOwnerCustomerInvoicesBtn'){setOwnerFinanceSubpage('customers');return;}
    if(target.id==='openOwnerContractorInvoicesBtn'){setOwnerFinanceSubpage('contractors');return;}
    if(target.id==='ownerFinanceMenuBackBtn'){showScreen('operatorHomeScreen');return;}
    if(target.id==='ownerFinanceSubpageBackBtn'){setOwnerFinanceSubpage('menu');return;}
    if(target.id==='ownerFinanceMenuRefreshBtn'||target.id==='ownerFinanceSubpageRefreshBtn'){loadFinance().catch(err=>{console.error('Refresh Ma3da finance failed:',err);say('ownerInvoiceFeedback','تعذر تحديث الفواتير. تحقق من الاتصال.',true);});return;}
    if(target.id==='customerFinanceBtn'){openFinance('customer');return;}
    if(target.id==='contractorFinanceBackBtn'){
      if(financeMode==='owner'&&ownerFinanceSubpage!=='menu'){setOwnerFinanceSubpage('menu');return;}
      showScreen(financeMode==='owner'?'operatorHomeScreen':financeMode==='customer'?'customerHomeScreen':'contractorHomeScreen');return;
    }
    if(target.id==='ownerIssueInvoiceBtn'){say('ownerInvoiceFeedback','نظام فواتير المراحل القديم مؤرشف. استخدم الفاتورة المشتركة المنشأة من اتفاق المشروع.',true);return;}
    if(target.id==='ownerApprovePhaseBtn'){say('ownerInvoiceFeedback','اعتماد المراحل القديم غير نشط في المسار المالي المعتمد.',true);return;}
    if(target.id==='ownerDisputePhaseBtn'){say('ownerInvoiceFeedback','اعتراضات فواتير المراحل القديمة مؤرشفة؛ استخدم مسار اعتراضات دفعات الاتفاق.',true);return;}
    if(target.id==='contractorAnnounceStageBtn'){say('contractorStageFeedback','نظام فواتير المراحل القديم غير نشط. تُدار دفعات المشروع من الفواتير المشتركة.',true);return;}
    const confirmPaymentButton=target.closest('[data-owner-confirm-payment]');
    if(confirmPaymentButton){confirmPaymentReceived(confirmPaymentButton.getAttribute('data-owner-confirm-payment'));return;}
    if(target.id==='contractorCreateInvoiceBtn'){return;}
    if(target.id==='contractorSubmitPaymentBtn'){submitPayment();return;}
    const payInvoiceButton=target.closest('[data-finance-pay-invoice]');
    if(payInvoiceButton){
      const invoiceId=payInvoiceButton.getAttribute('data-finance-pay-invoice');
      const select=$f('contractorPaymentInvoice');if(select)select.value=invoiceId;
      const amount=$f('contractorPaymentAmount');
      const invoice=cachedInvoices.find(i=>i.id===invoiceId);const summary=invoice?paymentSummary(invoice):null;
      if(amount&&summary)amount.value=String(summary.remaining.toFixed(2));
      $f('contractorSubmitPaymentCard')?.scrollIntoView?.({behavior:'smooth',block:'start'});
      if($f('contractorSubmitPaymentCard'))$f('contractorSubmitPaymentCard').hidden=false;
      say('contractorPaymentFeedback','أدخل مرجع التحويل إن وجد، ثم أرسل الدفعة للمراجعة. هذا لا ينفذ دفعًا إلكترونيًا.');
      return;
    }
  });
  $f('contractorStageProject')?.addEventListener('change',renderManagerRequestOptions);
  $f('ownerPhaseTask')?.addEventListener('change',syncOwnerInvoiceFields);
  window.ma3daRefreshFinance = () => loadFinance();
})();




/* =========================================================
   MA3DA — Context-aware Back + Refresh toolbar
   Additive enhancement: preserves existing page-specific back handlers.
========================================================= */
(function initMa3daUniversalPageToolbar(){
  if (window.__ma3daUniversalPageToolbarV1) return;
  window.__ma3daUniversalPageToolbarV1 = true;

  const history = window.__ma3daScreenHistory || (window.__ma3daScreenHistory = []);
  let lastActive = document.querySelector('.screen.active');

  const style = document.createElement('style');
  style.id = 'ma3da-universal-toolbar-styles';
  style.textContent = `
    .ma3da-page-toolbar{direction:rtl;display:flex;gap:9px;align-items:center;width:100%;box-sizing:border-box;margin:0 auto 12px;padding:0 0 2px;}
    .ma3da-page-toolbar button{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;flex:0 1 auto!important;min-width:112px!important;min-height:42px!important;padding:9px 13px!important;border-radius:10px!important;border:1px solid #b58a35!important;font-family:inherit!important;font-size:15px!important;font-weight:700!important;line-height:1.25!important;white-space:nowrap!important;cursor:pointer!important;box-shadow:0 1px 3px #0000000d!important;}
    .ma3da-page-toolbar .ma3da-page-back{background:#171717!important;color:#fff!important;border-color:#171717!important;}
    .ma3da-page-toolbar .ma3da-page-refresh{background:#b58a35!important;color:#fff!important;border-color:#a57b2b!important;}
    .ma3da-page-toolbar button:focus-visible{outline:3px solid #d9bd78!important;outline-offset:3px!important;}
    .ma3da-page-toolbar button:disabled{opacity:.7!important;cursor:wait!important;}
    .ma3da-page-toolbar .ma3da-toolbar-icon{font-size:18px;line-height:1;flex:0 0 auto;}
    .ma3da-page-toolbar .ma3da-toolbar-label{display:inline-block;}
    .ma3da-page-refresh-status{direction:rtl;margin:0 0 12px;font-size:13px;line-height:1.5;color:#716753;min-height:0;}
    .ma3da-page-refresh-status:empty{display:none;}
    @media(max-width:380px){.ma3da-page-toolbar{gap:7px}.ma3da-page-toolbar button{min-width:0!important;min-height:40px!important;padding:8px 10px!important;font-size:14px!important;gap:6px!important}.ma3da-page-toolbar .ma3da-toolbar-icon{font-size:17px}}
  `;
  document.head.appendChild(style);

  function getActiveScreen(){ return document.querySelector('.screen.active'); }
  function isBackButton(button){
    if(!button || button.dataset.ma3daGlobalRefresh) return false;
    const label=(button.innerText||button.textContent||'').replace(/\s+/g,' ').trim();
    const id=(button.id||'').toLowerCase();
    const dataBack=button.hasAttribute('data-ma3da-support-back') || button.hasAttribute('data-ma3da-support-home') || button.hasAttribute('data-ma3da-support-landing-back');
    return dataBack || /^back/.test(id) || /رجوع|الرجوع|عودة|العودة|مركز الدعم|العودة للرئيسية|العودة للصفحة السابقة/.test(label);
  }
  function visibleInScreen(button, screen){
    if(!button || !screen.contains(button) || button.hidden || button.closest('[hidden]')) return false;
    return true;
  }
  function findExistingBack(screen){
    const buttons=[...screen.querySelectorAll('button')];
    return buttons.find(b=>visibleInScreen(b,screen)&&isBackButton(b)) || null;
  }
  function backFallback(currentId){
    const groups={
      customer:['customerDataScreen','customerHomeScreen','currentOrdersScreen','previousOrdersScreen','customerSettingsScreen','editPhoneScreen','editEmailScreen','changePasswordScreen','languageSettingsScreen','appearanceSettingsScreen','technicalSupportScreen','requestScreen','searchingScreen','matchedScreen','chatScreen','trackingScreen','arrivedScreen','workingScreen','completedScreen','paymentScreen','ratingScreen','thankYouScreen'],
      operator:['operatorDataScreen','operatorHomeScreen','operatorEquipmentScreen','operatorNewRequestsScreen','operatorCurrentOrderScreen','operatorCustomerOrdersScreen','operatorProjectOrdersScreen','operatorIncomeScreen','operatorRatingsScreen','operatorSettingsScreen','operatorSupportScreen','operatorCompletedScreen','operatorScreen','operatorAcceptedScreen','operatorArrivedScreen'],
      contractor:['contractorDataScreen','contractorHomeScreen','contractorRequestScreen','contractorEquipmentPickerScreen','contractorProjectsScreen','contractorFinanceScreen','contractorSettingsScreen','contractorAccountScreen','contractorSettingsPrefsScreen','contractorSupportScreen'],
      support:['supportLoginScreen','supportForgotScreen','supportDashboardScreen']
    };
    for(const ids of Object.values(groups)) if(ids.includes(currentId)){
      if(currentId==='supportForgotScreen') return 'supportLoginScreen';
      if(currentId==='contractorEquipmentPickerScreen') return 'contractorProjectsScreen';
      if(currentId==='contractorRequestScreen') return 'contractorProjectsScreen';
      if(currentId==='editPhoneScreen'||currentId==='editEmailScreen'||currentId==='changePasswordScreen'||currentId==='languageSettingsScreen'||currentId==='appearanceSettingsScreen') return 'customerSettingsScreen';
      if(['searchingScreen','matchedScreen','chatScreen','trackingScreen','arrivedScreen','workingScreen','completedScreen','paymentScreen','ratingScreen','thankYouScreen'].includes(currentId)) return 'customerHomeScreen';
      if(['operatorCurrentOrderScreen','operatorCustomerOrdersScreen','operatorProjectOrdersScreen','operatorNewRequestsScreen','operatorEquipmentScreen','operatorIncomeScreen','operatorRatingsScreen','operatorSettingsScreen','operatorCompletedScreen','operatorScreen','operatorAcceptedScreen','operatorArrivedScreen'].includes(currentId)) return 'operatorHomeScreen';
      if(currentId==='contractorSupportScreen'||currentId==='contractorSettingsScreen'||currentId==='contractorAccountScreen'||currentId==='contractorSettingsPrefsScreen'||currentId==='contractorFinanceScreen') return 'contractorHomeScreen';
      if(currentId==='supportDashboardScreen'||currentId==='supportForgotScreen') return 'supportLoginScreen';
      if(currentId==='customerDataScreen'||currentId==='operatorDataScreen'||currentId==='contractorDataScreen') return 'roleScreen';
      return ids[1] || 'roleScreen';
    }
    if(currentId==='whyMa3daScreen') return 'introScreen';
    if(currentId==='howMa3daScreen') return 'whyMa3daScreen';
    if(currentId==='howWorksScreen') return 'howMa3daScreen';
    if(currentId==='roleScreen') return 'introScreen';
    if(currentId==='phoneScreen'||currentId==='otpScreen') return 'roleScreen';
    if(currentId==='ma3daSupportHomeScreen') return 'ma3daSupportLandingScreen';
    if(currentId==='ma3daNewComplaintScreen'||currentId==='ma3daComplaintListScreen') return 'ma3daSupportHomeScreen';
    if(currentId==='ma3daComplaintChatScreen') return 'ma3daComplaintListScreen';
    return 'roleScreen';
  }
  function showScreenWithoutHistory(id){
    const target=document.getElementById(id);
    if(!target || !target.classList.contains('screen')) return false;
    document.querySelectorAll('.screen.active').forEach(s=>s.classList.remove('active'));
    target.classList.add('active');
    lastActive=target;
    window.scrollTo({top:0,behavior:'auto'});
    return true;
  }
  function universalBack(){
    const current=getActiveScreen();
    if(!current) return;
    let targetId='';
    while(history.length && !targetId){
      const candidate=history.pop();
      if(candidate && candidate!==current.id && document.getElementById(candidate)?.classList.contains('screen')) targetId=candidate;
    }
    if(!targetId) targetId=backFallback(current.id);
    if(targetId) showScreenWithoutHistory(targetId);
  }

  const refreshMap={
    customerHomeScreen:()=>typeof window.loadLatestCustomerRequest==='function'?window.loadLatestCustomerRequest():null,
    currentOrdersScreen:()=>typeof window.loadCustomerOrders==='function'?window.loadCustomerOrders('current'):null,
    previousOrdersScreen:()=>typeof window.loadCustomerOrders==='function'?window.loadCustomerOrders('previous'):null,
    customerSettingsScreen:()=>typeof window.loadCustomerSettings==='function'?window.loadCustomerSettings():null,
    operatorDataScreen:()=>typeof window.loadOperatorData==='function'?window.loadOperatorData():null,
    operatorHomeScreen:()=>typeof window.loadOperatorHome==='function'?window.loadOperatorHome():null,
    operatorNewRequestsScreen:()=>typeof window.loadOperatorNewRequests==='function'?window.loadOperatorNewRequests():null,
    operatorCurrentOrderScreen:()=>typeof window.loadOperatorCurrentOrder==='function'?window.loadOperatorCurrentOrder():null,
    operatorCustomerOrdersScreen:()=>typeof window.loadOperatorCustomerOrders==='function'?window.loadOperatorCustomerOrders():null,
    operatorProjectOrdersScreen:()=>typeof window.loadOperatorProjectOrders==='function'?window.loadOperatorProjectOrders():null,
    operatorIncomeScreen:()=>typeof window.loadOperatorIncome==='function'?window.loadOperatorIncome():null,
    operatorRatingsScreen:()=>typeof window.loadOperatorRatings==='function'?window.loadOperatorRatings():null,
    operatorEquipmentScreen:()=>typeof window.loadOperatorEquipmentEditor==='function'?window.loadOperatorEquipmentEditor():null,
    operatorSettingsScreen:()=>typeof window.loadOperatorSettings==='function'?window.loadOperatorSettings():null,
    contractorDataScreen:()=>typeof window.loadContractorProfile==='function'?window.loadContractorProfile():null,
    contractorHomeScreen:async()=>{if(typeof window.loadContractorProfile==='function')await window.loadContractorProfile();},
    contractorProjectsScreen:()=>typeof window.loadContractorProjects==='function'?window.loadContractorProjects():null,
    contractorEquipmentPickerScreen:()=>typeof window.loadContractorNearbyEquipment==='function'?window.loadContractorNearbyEquipment():null,
    contractorFinanceScreen:()=>typeof window.ma3daRefreshFinance==='function'?window.ma3daRefreshFinance():null,
    ma3daComplaintListScreen:()=>typeof window.ma3daRefreshSupportCenter==='function'?window.ma3daRefreshSupportCenter('ma3daComplaintListScreen'):null,
    ma3daComplaintChatScreen:()=>typeof window.ma3daRefreshSupportCenter==='function'?window.ma3daRefreshSupportCenter('ma3daComplaintChatScreen'):null
  };

  async function refreshScreen(screen, button, status){
    if(!screen || button.disabled) return;
    const oldLabel=button.querySelector('.ma3da-toolbar-label')?.textContent || 'تحديث';
    button.disabled=true;
    button.querySelector('.ma3da-toolbar-icon').textContent='⟳';
    button.querySelector('.ma3da-toolbar-label').textContent='جارٍ التحديث…';
    status.textContent='جارٍ تحديث بيانات هذه الصفحة…';
    try{
      const existing=[...screen.querySelectorAll('button')].find(b=>{
        if(b===button || b.dataset.ma3daGlobalRefresh || b.disabled || !visibleInScreen(b,screen)) return false;
        const id=(b.id||'').toLowerCase();
        const label=(b.innerText||b.textContent||'').replace(/\s+/g,' ').trim();
        return id.includes('refresh') || id.includes('reload') || id.includes('update') || /^تحديث(\s|$|ال|\s)/.test(label) || /^تحديث القائمة$/.test(label);
      });
      if(existing){
        existing.click();
        status.textContent='تم إرسال طلب تحديث بيانات الصفحة.';
      }else{
        const refresh=refreshMap[screen.id];
        if(typeof refresh==='function'){
          await refresh();
          status.textContent='تم تنفيذ تحديث بيانات الصفحة.';
        }else if(['ma3daSupportHomeScreen','ma3daSupportLandingScreen','technicalSupportScreen','operatorSupportScreen','contractorSupportScreen','introScreen','whyMa3daScreen','howMa3daScreen','howWorksScreen','roleScreen','phoneScreen','otpScreen','requestScreen','searchingScreen','matchedScreen','chatScreen','trackingScreen','arrivedScreen','workingScreen','completedScreen','paymentScreen','ratingScreen','thankYouScreen','contractorRequestScreen','contractorSettingsScreen','contractorAccountScreen','contractorSettingsPrefsScreen','supportLoginScreen','supportForgotScreen'].includes(screen.id)){
          status.textContent='هذه الصفحة لا تحتوي على بيانات مستقلة تحتاج إلى تحديث.';
        }else{
          status.textContent='لا توجد وظيفة تحديث مستقلة لهذه الصفحة. لم يتم مسح أي بيانات كتبتها.';
        }
      }
    }catch(error){
      console.error('Ma3da page refresh failed:',screen.id,error);
      status.textContent='تعذر تحديث البيانات. تحقق من الاتصال ثم حاول مرة أخرى.';
    }finally{
      button.disabled=false;
      button.querySelector('.ma3da-toolbar-icon').textContent='⟳';
      button.querySelector('.ma3da-toolbar-label').textContent=oldLabel==='جارٍ التحديث…'?'تحديث':oldLabel;
    }
  }

  const noToolbarScreenIds = new Set([
    // Introductory / authentication screens
    'introScreen','whyMa3daScreen','howMa3daScreen','howWorksScreen',
    'roleScreen','phoneScreen','otpScreen',
    // Main home pages for each marketplace role
    'customerHomeScreen','contractorHomeScreen','operatorHomeScreen'
  ]);
  // These screens update through the existing live/polling listeners; do not show a manual refresh button.
  const noRefreshToolbarScreenIds = new Set([
    'matchedScreen','operatorAcceptedScreen','chatScreen'
  ]);
  function hasOwnRefreshControl(screen){
    return [...screen.querySelectorAll('button,[role="button"]')].some(b=>{
      if(!visibleInScreen(b,screen)) return false;
      const id=(b.id||'').toLowerCase();
      const label=(b.innerText||b.textContent||'').replace(/\s+/g,' ').trim();
      return id.includes('refresh') || id.includes('reload') || id.includes('update') ||
        /^(تحديث|تحديث القائمة|إعادة تحميل|اعادة تحميل)(\s|$)/.test(label) || /refresh|reload|update/i.test(label);
    });
  }
  function addToolbar(screen){
    if(!screen || screen.dataset.ma3daToolbarReady==='true') return;
    screen.dataset.ma3daToolbarReady='true';
    if(noToolbarScreenIds.has(screen.id)) return;

    const hasRefresh=hasOwnRefreshControl(screen);
    const suppressRefresh=noRefreshToolbarScreenIds.has(screen.id);
    const toolbar=document.createElement('div');
    toolbar.className='ma3da-page-toolbar';
    toolbar.setAttribute('role','group');
    toolbar.setAttribute('aria-label',hasRefresh?'الرجوع':'الرجوع وتحديث بيانات الصفحة');

    let back=findExistingBack(screen);
    if(back){
      back.classList.add('ma3da-page-back');
      back.setAttribute('aria-label',back.textContent.trim()||'رجوع');
      toolbar.appendChild(back);
    }else{
      back=document.createElement('button');
      back.type='button';
      back.className='ma3da-page-back';
      back.innerHTML='<span class="ma3da-toolbar-icon" aria-hidden="true">➜</span><span class="ma3da-toolbar-label">رجوع</span>';
      back.addEventListener('click',universalBack);
      toolbar.appendChild(back);
    }

    let status=null;
    if(!hasRefresh && !suppressRefresh){
      const refresh=document.createElement('button');
      refresh.type='button';
      refresh.className='ma3da-page-refresh';
      refresh.dataset.ma3daGlobalRefresh='true';
      refresh.innerHTML='<span class="ma3da-toolbar-icon" aria-hidden="true">⟳</span><span class="ma3da-toolbar-label">تحديث</span>';
      refresh.setAttribute('aria-label','تحديث بيانات الصفحة');
      status=document.createElement('p');
      status.className='ma3da-page-refresh-status';
      status.setAttribute('role','status');
      status.setAttribute('aria-live','polite');
      refresh.addEventListener('click',()=>refreshScreen(screen,refresh,status));
      toolbar.appendChild(refresh);
    }
    screen.insertBefore(toolbar,screen.firstChild);
    if(status) screen.insertBefore(status,toolbar.nextSibling);
  }

  function processScreens(root=document){
    if(root.matches?.('.screen')) addToolbar(root);
    root.querySelectorAll?.('.screen').forEach(addToolbar);
  }
  processScreens();
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='childList') record.addedNodes.forEach(node=>{if(node.nodeType===1)processScreens(node);});
    }
    const active=getActiveScreen();
    if(active && active!==lastActive){
      if(lastActive?.id && lastActive.id!==active.id){history.push(lastActive.id);if(history.length>80)history.splice(0,history.length-80);}
      lastActive=active;
    }
  });
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
})();

// مظهر موظف الدعم: تفضيل محلي للواجهة فقط، دون تغيير بيانات Firebase.
(function setupSupportThemePreference(){
  const apply=theme=>{const root=document.getElementById('supportDashboardScreen');if(!root)return;root.classList.toggle('support-theme-light',theme==='light');};
  document.addEventListener('change',event=>{if(event.target?.id!=='supportThemeSelect')return;const theme=event.target.value==='light'?'light':'gold';try{localStorage.setItem('ma3daSupportTheme',theme);}catch(_){}apply(theme);});
  document.addEventListener('DOMContentLoaded',()=>{let theme='gold';try{theme=localStorage.getItem('ma3daSupportTheme')||'gold';}catch(_){}const select=document.getElementById('supportThemeSelect');if(select)select.value=theme;apply(theme);});
})();
/* ==========================================
   مساعد مِعدة الذكي — الجزء الأول
   قاعدة المعرفة والأسئلة المحوّلة للدعم
   ========================================== */
(function ma3daSmartAssistant() {
  if (window.__ma3daSmartAssistantBound) return;
  window.__ma3daSmartAssistantBound = true;

  const $ = (id) => document.getElementById(id);

  const launcher = $("ma3daAiLauncher");
  const panel = $("ma3daAiPanel");
  const toggle = $("ma3daAiToggle");
  const close = $("ma3daAiClose");
  const form = $("ma3daAiForm");
  const input = $("ma3daAiInput");
  const messages = $("ma3daAiMessages");
  const status = $("ma3daAiStatus");
  const send = $("ma3daAiSend");

  if (!launcher || !panel || !form || !input || !messages) {
    console.error("مساعد مِعدة: عناصر الواجهة غير موجودة في index.");
    return;
  }

  const escapeText = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  function addMessage(text, type = "assistant") {
    const item = document.createElement("div");
    item.className = "ma3da-ai-message " + type;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  function setStatus(text) {
    status.textContent = text || "";
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[ًٌٍَُِّْـ]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/[؟?!.,،؛:]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function similarity(first, second) {
    const a = new Set(normalize(first).split(" ").filter(Boolean));
    const b = new Set(normalize(second).split(" ").filter(Boolean));

    if (!a.size || !b.size) return 0;

    let common = 0;
    for (const word of a) {
      if (b.has(word)) common++;
    }

    return common / (a.size + b.size - common);
  }

  function currentRole() {
    const active = document.querySelector(".screen.active");

    if (active?.id === "customerHomeScreen") return "customer";
    if (active?.id === "operatorHomeScreen") return "operator";
    if (active?.id === "contractorHomeScreen") return "contractor";

    return "user";
  }

  function getDatabaseHelpers() {
    const db = window.ma3daDB;
    const user = window.ma3daAuth?.currentUser;

    if (
      !db ||
      !user ||
      typeof window.ma3daCollection !== "function" ||
      typeof window.ma3daGetDocs !== "function" ||
      typeof window.ma3daAddDoc !== "function"
    ) {
      throw new Error(
        "تعذر الاتصال بقاعدة البيانات. تأكد من تسجيل الدخول وجاهزية Firebase."
      );
    }

    return { db, user };
  }

  async function readCollection(collectionName) {
    const { db } = getDatabaseHelpers();
    const collection = window.ma3daCollection(db, collectionName);
    const snapshot = await window.ma3daGetDocs(collection);
    const results = [];

    snapshot.forEach((document) => {
      results.push({
        id: document.id,
        ...document.data()
      });
    });

    return results;
  }

  async function forwardToSupport(question) {
    const { db, user } = getDatabaseHelpers();

    const record = {
      question,
      role: currentRole(),
      requesterId: user.uid,
      requesterEmail: user.email || "",
      status: "open",
      source: "smart-assistant",
      answer: "",
      knowledgeSuggestion: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const reference = await window.ma3daAddDoc(
      window.ma3daCollection(db, "ma3daAssistantQuestions"),
      record
    );

    return reference.id;
  }

  async function answerQuestion(question) {
    send.disabled = true;
    setStatus("جارٍ البحث في الإجابات المعتمدة...");

    try {
      const records = await readCollection("ma3daAssistantKnowledge");

      const approved = records.filter((record) =>
        record.status === "approved" &&
        record.active !== false &&
        String(record.answer || "").trim()
      );

      let bestMatch = null;
      let bestScore = 0;

      for (const record of approved) {
        const alternatives = [
          record.question || "",
          ...(Array.isArray(record.aliases) ? record.aliases : [])
        ];

        for (const alternative of alternatives) {
          const score = similarity(question, alternative);

          if (score > bestScore) {
            bestScore = score;
            bestMatch = record;
          }
        }
      }

      // لا نجيب إلا من قاعدة المعرفة المعتمدة.
      if (bestMatch && bestScore >= 0.42) {
        addMessage(bestMatch.answer, "assistant");
        setStatus("الإجابة من قاعدة المعرفة المعتمدة.");
        return;
      }

      // السؤال غير المعروف يتحول تلقائيًا إلى الدعم.
      addMessage(
        "لم أجد إجابة معتمدة لسؤالك. سأحوّله تلقائيًا إلى فريق الدعم.",
        "assistant"
      );

      setStatus("جارٍ تحويل السؤال إلى فريق الدعم...");

      const questionId = await forwardToSupport(question);

      addMessage(
        "تم تسجيل سؤالك. رقم المتابعة: " + questionId,
        "assistant"
      );

      setStatus("تم إرسال السؤال إلى صندوق أسئلة المساعد المستقل.");

    } catch (error) {
      console.error("Ma3da Smart Assistant:", error);

      addMessage(
        error.message || "تعذر إكمال الطلب. حاول مرة أخرى لاحقًا.",
        "assistant"
      );

      setStatus("تعذر إتمام العملية.");
    } finally {
      send.disabled = false;
    }
  }

  toggle?.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));

    if (!panel.hidden) input.focus();
  });

  close?.addEventListener("click", () => {
    panel.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");
    input.value = "";

    await answerQuestion(question);
  });
})();

/* =====================================================
   مساعد مِعدة — ربط صندوق الدعم وإدارة المالك
   متوافق مع معرّفات index الحالية
   الأسئلة منفصلة عن supportTickets
   ===================================================== */
(function ma3daAiAdminModule() {
  if (window.__ma3daAiAdminBound) return;
  window.__ma3daAiAdminBound = true;

  const $ = (id) => document.getElementById(id);

  let selectedQuestionId = null;
  let knowledgeCache = [];

  const QUESTIONS = "ma3daAssistantQuestions";
  const KNOWLEDGE = "ma3daAssistantKnowledge";

  function getDb() {
    if (!window.ma3daDB || !window.ma3daAuth?.currentUser) {
      throw new Error("يجب تسجيل الدخول أولًا.");
    }
    return window.ma3daDB;
  }

  function getHelpers() {
    const names = [
      "ma3daCollection",
      "ma3daDoc",
      "ma3daGetDocs",
      "ma3daAddDoc",
      "ma3daUpdateDoc",
      "ma3daDeleteDoc"
    ];

    const missing = names.filter(
      (name) => typeof window[name] !== "function"
    );

    if (missing.length) {
      throw new Error(
        "دوال Firebase غير متاحة: " + missing.join("، ")
      );
    }

    return window;
  }

  async function getAll(collectionName) {
    const h = getHelpers();
    const snapshot = await h.ma3daGetDocs(
      h.ma3daCollection(getDb(), collectionName)
    );

    const result = [];
    snapshot.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() });
    });

    return result;
  }

  async function addRecord(collectionName, data) {
    const h = getHelpers();

    return h.ma3daAddDoc(
      h.ma3daCollection(getDb(), collectionName),
      data
    );
  }

  async function updateRecord(collectionName, id, data) {
    const h = getHelpers();

    return h.ma3daUpdateDoc(
      h.ma3daDoc(getDb(), collectionName, id),
      data
    );
  }

  async function deleteRecord(collectionName, id) {
    const h = getHelpers();

    return h.ma3daDeleteDoc(
      h.ma3daDoc(getDb(), collectionName, id)
    );
  }

  function getCurrentSupportEmployee() {
    // supportEmployee مُعرّف كمتغير عام في script.js وليس مضمونًا
    // أن يكون منشورًا على window؛ اقرأ المصدرين لتفادي رفض الصلاحية خطأً.
    return (
      (typeof supportEmployee !== "undefined" && supportEmployee) ||
      window.supportEmployee ||
      null
    );
  }

  function isOwner() {
    /*
     * يعتمد التحقق أولًا على الدور الذي أثبته تسجيل الدخول المخصص للمالك.
     * بقاء تحقق Firestore الأمني مطلوبًا لحماية قاعدة البيانات.
     */
    const employee = getCurrentSupportEmployee();
    const ownerScreen = $("ownerPortalDashboardScreen");
    const ownerScreenActive =
      ownerScreen?.classList.contains("active");

    return Boolean(
      employee?.role === "owner" ||
      (
        ownerScreenActive &&
        window.ma3daAuth?.currentUser
      )
    );
  }

  function isSupportStaff() {
    const employee = getCurrentSupportEmployee();

    return Boolean(
      employee?.role &&
      employee.role !== "owner"
    );
  }

  function canUseSupport() {
    return isOwner() || isSupportStaff();
  }

  function showFeedback(message) {
    const target = $("ma3daAiSupportFeedback");
    if (target) target.textContent = message || "";
  }

  function makeButton(text, onClick, className = "support-btn") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
  }

  function makeCard() {
    const card = document.createElement("article");
    card.className = "support-row ma3da-ai-admin-card";
    return card;
  }

  function formatDate(value) {
    if (!value) return "غير محدد";

    const date = value?.toDate
      ? value.toDate()
      : value instanceof Date
        ? value
        : value?.seconds
          ? new Date(value.seconds * 1000)
          : null;

    return date && !Number.isNaN(date.getTime())
      ? date.toLocaleString("ar-SA")
      : "غير محدد";
  }

  /* -----------------------------------------------------
     1 — ربط قائمة التنقل بقسم الأسئلة الموجود في index
     ----------------------------------------------------- */

  function setupSupportNavigation() {
    const screen = $("supportDashboardScreen");
    const section = $("supportSectionAiQuestions");

    if (!screen || !section) return;

    let navButton = screen.querySelector(
      '[data-support-section="aiQuestions"]'
    );

    if (!navButton) {
      const equipmentButton = screen.querySelector(
        '[data-support-section="equipmentEdits"]'
      );

      navButton = makeButton(
        "أسئلة المساعد الذكي",
        () => activateSupportSection(),
        "support-btn"
      );

      navButton.dataset.supportSection = "aiQuestions";

      if (equipmentButton?.parentElement) {
        equipmentButton.insertAdjacentElement(
          "afterend",
          navButton
        );
      } else {
        screen.querySelector(".support-nav")?.appendChild(navButton);
      }
    }

    navButton.addEventListener("click", () => {
      activateSupportSection();
    });

    function activateSupportSection() {
      if (!canUseSupport()) {
        alert("هذه الصفحة مخصصة لموظفي الدعم.");
        return;
      }

      screen.querySelectorAll(".support-section").forEach((item) => {
        item.classList.toggle("active", item === section);
      });

      screen.querySelectorAll("[data-support-section]").forEach((item) => {
        item.classList.toggle(
          "active",
          item.dataset.supportSection === "aiQuestions"
        );
      });

      loadSupportQuestions();
    }

    // توحيد معرّفات الأزرار مع عناصر index الحالية.
    $("ma3daAiSupportRefresh")?.addEventListener(
      "click",
      loadSupportQuestions
    );

    $("ma3daAiSendReply")?.addEventListener(
      "click",
      sendSupportReply
    );

    $("ma3daAiCloseQuestion")?.addEventListener(
      "click",
      closeSupportQuestion
    );

    window.ma3daAiOpenSupport = activateSupportSection;
  }

  /* -----------------------------------------------------
     2 — قائمة الأسئلة التي تحتاج إلى رد موظف الدعم
     ----------------------------------------------------- */

  async function loadSupportQuestions() {
    const target = $("ma3daAiSupportList");
    if (!target) return;

    if (!canUseSupport()) {
      target.textContent = "غير مصرح لك بعرض هذه الأسئلة.";
      return;
    }

    target.textContent = "جارٍ تحميل الأسئلة...";

    try {
      const records = await getAll(QUESTIONS);

      const filtered = records
        .filter((item) => {
          const status = item.status || "open";
          return status === "open" || status === "answered";
        })
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      target.replaceChildren();

      if (!filtered.length) {
        target.textContent = "لا توجد أسئلة مفتوحة حاليًا.";
        clearReplyForm();
        return;
      }

      filtered.forEach((item) => {
        const card = makeCard();

        const title = document.createElement("strong");
        title.textContent = item.question || "سؤال بدون نص";

        const meta = document.createElement("p");
        meta.textContent =
          "نوع الحساب: " + (item.role || "غير محدد") +
          " — الحالة: " + (item.status || "open") +
          " — تاريخ السؤال: " + formatDate(item.createdAt);

        const lastAnswer = document.createElement("p");
        lastAnswer.textContent = item.lastAnswer
          ? "آخر رد: " + item.lastAnswer
          : "لم يُرسل رد بعد.";

        const openButton = makeButton(
          "الرد على هذا السؤال",
          () => selectQuestion(item)
        );

        card.append(title, meta, lastAnswer, openButton);
        target.appendChild(card);
      });
    } catch (error) {
      console.error("Ma3da AI support questions:", error);
      target.textContent =
        error.message || "تعذر تحميل الأسئلة.";
    }
  }

  function selectQuestion(item) {
    selectedQuestionId = item.id;

    const box = $("ma3daAiReplyBox");
    const title = $("ma3daAiReplyTitle");
    const question = $("ma3daAiReplyQuestion");
    const reply = $("ma3daAiReplyText");
    const suggest = $("ma3daAiSuggestKnowledge");

    if (!box || !title || !question || !reply || !suggest) {
      alert("عناصر الرد غير مكتملة في index.");
      return;
    }

    title.textContent = "الرد على السؤال";
    question.textContent = item.question || "";
    reply.value = item.lastAnswer || item.answer || "";
    suggest.checked = false;
    box.hidden = false;
    showFeedback("");

    box.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }

  function clearReplyForm() {
    selectedQuestionId = null;

    if ($("ma3daAiReplyBox")) {
      $("ma3daAiReplyBox").hidden = true;
    }

    if ($("ma3daAiReplyText")) {
      $("ma3daAiReplyText").value = "";
    }

    if ($("ma3daAiSuggestKnowledge")) {
      $("ma3daAiSuggestKnowledge").checked = false;
    }
  }

  /* -----------------------------------------------------
     3 — حفظ رد الدعم دون اعتماده تلقائيًا
     ----------------------------------------------------- */

  async function sendSupportReply() {
    if (!canUseSupport()) {
      alert("غير مصرح لك بإرسال الرد.");
      return;
    }

    if (!selectedQuestionId) {
      showFeedback("اختر سؤالًا من القائمة أولًا.");
      return;
    }

    const reply = $("ma3daAiReplyText");
    const suggest = $("ma3daAiSuggestKnowledge");

    const text = reply?.value.trim() || "";
    if (!text) {
      showFeedback("اكتب الرد قبل الحفظ.");
      reply?.focus();
      return;
    }

    const user = window.ma3daAuth?.currentUser;
    if (!user) {
      showFeedback("انتهت جلسة الدخول. سجل الدخول مرة أخرى.");
      return;
    }

    const questionId = selectedQuestionId;
    showFeedback("جارٍ حفظ الرد...");

    try {
      const questionRecords = await getAll(QUESTIONS);
      const record = questionRecords.find(
        (item) => item.id === questionId
      );

      if (!record) {
        throw new Error("السؤال غير موجود.");
      }

      const patch = {
        status: "answered",
        lastAnswer: text,
        updatedAt: new Date(),
        lastAnsweredBy: user.uid
      };

      // لا نضع الإجابة في قاعدة المعرفة المعتمدة.
      // نحفظها كاقتراح ينتظر موافقة المالك فقط.
      if (suggest?.checked) {
        patch.pendingAnswer = {
          text,
          submittedBy: user.uid,
          status: "pending",
          submittedAt: new Date()
        };
      }

      await updateRecord(QUESTIONS, questionId, patch);

      showFeedback(
        suggest?.checked
          ? "تم حفظ الرد وإرساله للمالك كمقترح غير معتمد."
          : "تم حفظ الرد. لم تتم إضافته إلى قاعدة المعرفة."
      );

      await loadSupportQuestions();
    } catch (error) {
      console.error("Ma3da AI save reply:", error);
      showFeedback(error.message || "تعذر حفظ الرد.");
    }
  }

  /* -----------------------------------------------------
     4 — إغلاق السؤال دون حذفه
     ----------------------------------------------------- */

  async function closeSupportQuestion() {
    if (!canUseSupport()) {
      alert("غير مصرح لك بإغلاق السؤال.");
      return;
    }

    if (!selectedQuestionId) {
      showFeedback("اختر سؤالًا أولًا.");
      return;
    }

    try {
      await updateRecord(QUESTIONS, selectedQuestionId, {
        status: "closed",
        updatedAt: new Date()
      });

      showFeedback("تم إغلاق السؤال.");
      clearReplyForm();
      await loadSupportQuestions();
    } catch (error) {
      console.error(error);
      showFeedback(error.message || "تعذر إغلاق السؤال.");
    }
  }

  /* -----------------------------------------------------
     5 — إنشاء إدارة المساعد داخل لوحة المالك الموجودة
     ----------------------------------------------------- */

  function setupOwnerPage() {
    const ownerScreen = $("ownerPortalDashboardScreen");
    if (!ownerScreen) return;

    let section = $("ma3daAiOwnerSection");

    if (!section) {
      section = document.createElement("section");
      section.id = "ma3daAiOwnerSection";
      section.className = "owner-admin-details";
      section.hidden = true;

      section.innerHTML = `
        <div class="owner-admin-details-head">
          <h2>إدارة المساعد الذكي</h2>
          <button type="button"
                  class="support-btn"
                  id="ma3daAiOwnerClose">
            إغلاق
          </button>
        </div>

        <p class="support-subtitle">
          إدارة الإجابات المعتمدة ومراجعة اقتراحات موظفي الدعم.
          لا تُنشر الإجابات المقترحة إلا بعد موافقة المالك.
        </p>

        <div class="owner-admin-subcards">
          <div class="owner-admin-subcard">
            إجمالي الأسئلة
            <strong id="ma3daAiStatQuestions">0</strong>
          </div>
          <div class="owner-admin-subcard">
            اقتراحات تنتظر الموافقة
            <strong id="ma3daAiStatPending">0</strong>
          </div>
          <div class="owner-admin-subcard">
            إجابات معتمدة ونشطة
            <strong id="ma3daAiStatKnowledge">0</strong>
          </div>
        </div>

        <h3>اقتراحات موظفي الدعم</h3>
        <div id="ma3daAiPendingAnswers" class="support-list">
          جارٍ التحميل...
        </div>

        <hr>

        <h3>إضافة إجابة أو تعديل إجابة موجودة</h3>
        <form id="ma3daAiKnowledgeForm">
          <input type="hidden" id="ma3daAiKnowledgeId">

          <label for="ma3daAiKnowledgeQuestion">السؤال</label>
          <input id="ma3daAiKnowledgeQuestion"
                 class="support-input"
                 maxlength="500"
                 required>

          <label for="ma3daAiKnowledgeAnswer">الإجابة</label>
          <textarea id="ma3daAiKnowledgeAnswer"
                    class="support-input"
                    rows="5"
                    maxlength="5000"
                    required></textarea>

          <label for="ma3daAiKnowledgeAliases">
            كلمات أو صيغ بديلة (افصل بينها بفاصلة)
          </label>
          <input id="ma3daAiKnowledgeAliases"
                 class="support-input"
                 placeholder="مثال: كيف أطلب معدة، طلب معدة">

          <button type="submit" class="support-btn support-primary">
            حفظ الإجابة المعتمدة
          </button>

          <button type="button"
                  class="support-btn"
                  id="ma3daAiKnowledgeReset">
            إلغاء التعديل
          </button>
        </form>

        <hr>

        <h3>قاعدة المعرفة</h3>
        <label for="ma3daAiKnowledgeSearch">البحث في الأسئلة والإجابات</label>
        <input id="ma3daAiKnowledgeSearch"
               class="support-input"
               placeholder="اكتب كلمة للبحث">

        <div id="ma3daAiKnowledgeList" class="support-list">
          جارٍ تحميل الإجابات...
        </div>

        <p id="ma3daAiOwnerFeedback" role="status" aria-live="polite"></p>
      `;

      const grid = ownerScreen.querySelector(".owner-admin-grid");
      const details = $("ownerAdminDetails");

      if (details) {
        details.insertAdjacentElement("afterend", section);
      } else if (grid) {
        grid.insertAdjacentElement("afterend", section);
      } else {
        ownerScreen.querySelector(".owner-admin-card")
          ?.appendChild(section);
      }
    }

    let entry = $("ma3daAiOwnerEntry");

    if (!entry) {
      entry = makeButton(
        "إدارة المساعد الذكي",
        openOwnerPanel,
        "owner-admin-cardlink"
      );
      entry.id = "ma3daAiOwnerEntry";

      const label = document.createElement("span");
      label.innerHTML =
        "<strong>إدارة المساعد الذكي</strong>" +
        "<small>الأسئلة والإجابات والاعتمادات</small>";

      entry.replaceChildren(label);

      const grid = ownerScreen.querySelector(".owner-admin-grid");
      grid?.appendChild(entry);
    }

    $("ma3daAiOwnerClose")?.addEventListener("click", () => {
      section.hidden = true;
    });

    $("ma3daAiKnowledgeForm")?.addEventListener(
      "submit",
      saveKnowledge
    );

    $("ma3daAiKnowledgeReset")?.addEventListener(
      "click",
      resetKnowledgeForm
    );

    $("ma3daAiKnowledgeSearch")?.addEventListener(
      "input",
      () => renderKnowledge(knowledgeCache)
    );

    window.ma3daAiOpenOwner = openOwnerPanel;
  }

  async function openOwnerPanel() {
    if (!isOwner()) {
      alert(
        "تعذر التحقق من صلاحية المالك. افتح لوحة المالك من تسجيل الدخول المخصص لها."
      );
      return;
    }

    const section = $("ma3daAiOwnerSection");
    if (!section) {
      alert("تعذر العثور على قسم إدارة المساعد في لوحة المالك.");
      return;
    }

    section.hidden = false;

    try {
      await refreshOwnerPage();
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } catch (error) {
      console.error(error);
      const feedback = $("ma3daAiOwnerFeedback");
      if (feedback) {
        feedback.textContent =
          error.message || "تعذر تحميل إدارة المساعد.";
      }
    }
  }

  async function refreshOwnerPage() {
    if (!isOwner()) {
      throw new Error("صلاحيات المالك مطلوبة.");
    }

    const [questions, knowledge] = await Promise.all([
      getAll(QUESTIONS),
      getAll(KNOWLEDGE)
    ]);

    knowledgeCache = knowledge;

    $("ma3daAiStatQuestions").textContent = questions.length;

    $("ma3daAiStatPending").textContent = questions.filter(
      (item) => item.pendingAnswer?.status === "pending"
    ).length;

    $("ma3daAiStatKnowledge").textContent = knowledge.filter(
      (item) =>
        item.status === "approved" &&
        item.active !== false
    ).length;

    renderPendingAnswers(questions);
    renderKnowledge(knowledge);
  }

  /* -----------------------------------------------------
     6 — اعتماد اقتراح الدعم بعد موافقة المالك
     ----------------------------------------------------- */

  function renderPendingAnswers(questions) {
    const target = $("ma3daAiPendingAnswers");
    if (!target) return;

    target.replaceChildren();

    const pending = questions.filter(
      (item) => item.pendingAnswer?.status === "pending"
    );

    if (!pending.length) {
      target.textContent = "لا توجد اقتراحات تنتظر الموافقة.";
      return;
    }

    pending.forEach((item) => {
      const card = makeCard();

      const question = document.createElement("strong");
      question.textContent = "السؤال: " + (item.question || "");

      const answer = document.createElement("p");
      answer.textContent =
        "اقتراح موظف الدعم: " + (item.pendingAnswer.text || "");

      const approve = makeButton(
        "الموافقة والنشر",
        async () => {
          if (!isOwner()) {
            alert("الموافقة متاحة للمالك فقط.");
            return;
          }

          const approvedAnswer = item.pendingAnswer.text;
          const approvedQuestion = item.question || "";

          if (!approvedQuestion.trim() || !approvedAnswer.trim()) {
            alert("السؤال أو الإجابة فارغ.");
            return;
          }

          try {
            await addRecord(KNOWLEDGE, {
              question: approvedQuestion,
              answer: approvedAnswer,
              aliases: [],
              status: "approved",
              active: true,
              approvedBy: window.ma3daAuth.currentUser.uid,
              approvedAt: new Date(),
              createdAt: new Date()
            });

            await updateRecord(QUESTIONS, item.id, {
              pendingAnswer: {
                ...item.pendingAnswer,
                status: "approved",
                reviewedBy: window.ma3daAuth.currentUser.uid,
                reviewedAt: new Date()
              },
              updatedAt: new Date()
            });

            await refreshOwnerPage();

            $("ma3daAiOwnerFeedback").textContent =
              "تم اعتماد الإجابة وإضافتها إلى قاعدة المعرفة.";
          } catch (error) {
            alert("تعذر اعتماد الإجابة: " + error.message);
          }
        },
        "support-btn support-primary"
      );

      const reject = makeButton(
        "رفض الاقتراح",
        async () => {
          if (!isOwner()) {
            alert("رفض الاقتراح متاح للمالك فقط.");
            return;
          }

          try {
            await updateRecord(QUESTIONS, item.id, {
              pendingAnswer: {
                ...item.pendingAnswer,
                status: "rejected",
                reviewedBy: window.ma3daAuth.currentUser.uid,
                reviewedAt: new Date()
              },
              updatedAt: new Date()
            });

            await refreshOwnerPage();

            $("ma3daAiOwnerFeedback").textContent =
              "تم رفض الاقتراح. لم يُنشر ضمن الإجابات.";
          } catch (error) {
            alert("تعذر رفض الاقتراح: " + error.message);
          }
        }
      );

      card.append(question, answer, approve, reject);
      target.appendChild(card);
    });
  }

  /* -----------------------------------------------------
     7 — عرض الإجابات المعتمدة والتحكم بها
     ----------------------------------------------------- */

  function renderKnowledge(records) {
    const target = $("ma3daAiKnowledgeList");
    if (!target) return;

    const search = (
      $("ma3daAiKnowledgeSearch")?.value || ""
    ).trim().toLowerCase();

    target.replaceChildren();

    const filtered = records.filter((item) => {
      const text = (
        (item.question || "") + " " +
        (item.answer || "") + " " +
        (Array.isArray(item.aliases) ? item.aliases.join(" ") : "")
      ).toLowerCase();

      return text.includes(search);
    });

    if (!filtered.length) {
      target.textContent = "لا توجد إجابات مطابقة.";
      return;
    }

    filtered.forEach((item) => {
      const card = makeCard();

      const question = document.createElement("strong");
      question.textContent = item.question || "سؤال بدون عنوان";

      const answer = document.createElement("p");
      answer.textContent = item.answer || "";

      const status = document.createElement("p");
      status.textContent =
        "الحالة: " +
        (item.status === "approved" ? "معتمدة" : "غير معتمدة") +
        " — " +
        (item.active === false ? "متوقفة" : "نشطة");

      const edit = makeButton("تعديل", () => {
        if (!isOwner()) {
          alert("التعديل متاح للمالك فقط.");
          return;
        }

        $("ma3daAiKnowledgeId").value = item.id;
        $("ma3daAiKnowledgeQuestion").value = item.question || "";
        $("ma3daAiKnowledgeAnswer").value = item.answer || "";
        $("ma3daAiKnowledgeAliases").value =
          Array.isArray(item.aliases)
            ? item.aliases.join("، ")
            : "";

        $("ma3daAiKnowledgeForm").scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });

      const toggleActive = makeButton(
        item.active === false ? "تفعيل الإجابة" : "إيقاف الإجابة",
        async () => {
          if (!isOwner()) {
            alert("تغيير الحالة متاح للمالك فقط.");
            return;
          }

          try {
            await updateRecord(KNOWLEDGE, item.id, {
              active: item.active === false,
              updatedAt: new Date()
            });

            await refreshOwnerPage();
          } catch (error) {
            alert("تعذر تغيير حالة الإجابة: " + error.message);
          }
        }
      );

      const deleteButton = makeButton(
        "حذف",
        async () => {
          if (!isOwner()) {
            alert("الحذف متاح للمالك فقط.");
            return;
          }

          if (!confirm("هل تريد حذف هذه الإجابة نهائيًا؟")) return;

          try {
            await deleteRecord(KNOWLEDGE, item.id);
            await refreshOwnerPage();
          } catch (error) {
            alert("تعذر حذف الإجابة: " + error.message);
          }
        },
        "support-btn support-danger"
      );

      card.append(
        question,
        answer,
        status,
        edit,
        toggleActive,
        deleteButton
      );

      target.appendChild(card);
    });
  }

  /* -----------------------------------------------------
     8 — إضافة إجابة أو حفظ تعديل المالك
     ----------------------------------------------------- */

  async function saveKnowledge(event) {
    event.preventDefault();

    if (!isOwner()) {
      alert("إضافة وتعديل الإجابات متاحان للمالك فقط.");
      return;
    }

    const id = $("ma3daAiKnowledgeId").value.trim();
    const question = $("ma3daAiKnowledgeQuestion").value.trim();
    const answer = $("ma3daAiKnowledgeAnswer").value.trim();

    const aliases = $("ma3daAiKnowledgeAliases").value
      .split(/[،,]/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (!question || !answer) {
      $("ma3daAiOwnerFeedback").textContent =
        "أدخل السؤال والإجابة أولًا.";
      return;
    }

    try {
      const data = {
        question,
        answer,
        aliases,
        status: "approved",
        active: true,
        updatedAt: new Date()
      };

      if (id) {
        await updateRecord(KNOWLEDGE, id, data);
      } else {
        await addRecord(KNOWLEDGE, {
          ...data,
          approvedBy: window.ma3daAuth.currentUser.uid,
          approvedAt: new Date(),
          createdAt: new Date()
        });
      }

      resetKnowledgeForm();
      await refreshOwnerPage();

      $("ma3daAiOwnerFeedback").textContent =
        id
          ? "تم تعديل الإجابة المعتمدة."
          : "تمت إضافة الإجابة واعتمادها.";
    } catch (error) {
      console.error(error);
      $("ma3daAiOwnerFeedback").textContent =
        error.message || "تعذر حفظ الإجابة.";
    }
  }

  function resetKnowledgeForm() {
    $("ma3daAiKnowledgeForm")?.reset();

    if ($("ma3daAiKnowledgeId")) {
      $("ma3daAiKnowledgeId").value = "";
    }

    if ($("ma3daAiOwnerFeedback")) {
      $("ma3daAiOwnerFeedback").textContent = "";
    }
  }

  window.ma3daAiResetKnowledgeForm = resetKnowledgeForm;
  window.ma3daAiLoadSupportQuestions = loadSupportQuestions;

  /* -----------------------------------------------------
     9 — التشغيل وربط عناصر index
     ----------------------------------------------------- */

  function init() {
    setupSupportNavigation();
    setupOwnerPage();
  }

  init();

  document.addEventListener("DOMContentLoaded", init);

  // بعض الصفحات قد تُنشأ لاحقًا بعد تسجيل الدخول.
  window.addEventListener("load", init);
})();


/* MA3DA — ATHAR RIYADH BRAND IMAGE FIX */
(function installMa3daAtharBrandImage(){
  if (window.__ma3daAtharBrandImageInstalled) return;
  window.__ma3daAtharBrandImageInstalled = true;

  // صورة الهوية مضمّنة داخل script.js لتفادي اختلاف اسم الملف أو مساره.
  const atharImage = "8268CD44-F38B-4DC9-AD13-0854C60A304F.png";
  const style = document.createElement("style");
  style.id = "ma3daAtharBrandImageStyles";
  style.textContent = `
    .ma3da-athar-intro-image {
      display:block; width:min(100%, 560px); height:auto; max-height:340px;
      object-fit:contain; margin:0 auto 18px; border-radius:18px;
      filter:drop-shadow(0 10px 22px rgba(0,0,0,.18));
    }
    .ma3da-athar-bg { position:relative !important; isolation:isolate; }
    .ma3da-athar-bg::before {
      content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
      background-image:var(--ma3da-athar-background); background-repeat:no-repeat;
      background-position:center; background-size:cover; opacity:.14;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  function applyAtharBrandImage() {
    // الصفحات التعريفية الأربع: الصورة بدل أيقونة المعدة الحالية.
    ["introScreen", "whyMa3daScreen", "howMa3daScreen", "howWorksScreen"].forEach(id => {
      const screen = document.getElementById(id);
      if (!screen) return;
      const heroIcon = screen.querySelector(".hero-icon");
      if (!heroIcon || heroIcon.querySelector(".ma3da-athar-intro-image")) return;
      const image = document.createElement("img");
      image.className = "ma3da-athar-intro-image";
      image.src = atharImage;
      image.alt = "هوية آثار السينمائية — الرياض وجبال طويق والمعدات الثقيلة";
      heroIcon.replaceWith(image);
    });

    // خلفية سينمائية شفافة للصفحات الرئيسية المطلوبة، دون حجب عناصر الواجهة.
    ["customerHomeScreen", "operatorHomeScreen", "contractorHomeScreen"].forEach(id => {
      const screen = document.getElementById(id);
      if (!screen) return;
      screen.classList.add("ma3da-athar-bg");
      screen.style.setProperty("--ma3da-athar-background", `url("${atharImage}")`);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyAtharBrandImage, { once:true });
  } else {
    applyAtharBrandImage();
  }
  // إعادة التطبيق عند ظهور الصفحات إذا كانت بعض عناصرها تُنشأ لاحقًا.
  let atharApplyQueued = false;
  const observer = new MutationObserver(() => {
    if (atharApplyQueued) return;
    atharApplyQueued = true;
    Promise.resolve().then(() => {
      atharApplyQueued = false;
      applyAtharBrandImage();
    });
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });
})();

/* =====================================================
   مِعدة | إدارة خلفيات التطبيق — مدمجة داخل مركز التحكم الشامل
   ===================================================== */
(function Ma3daBackgroundManager() {
  "use strict";

  const COLLECTION = "ma3daSettings";
  const DOC_ID = "brandBackground";
  const PANEL_ID = "ma3daControlCenterBackgroundPanel";
  let selectedImage = "";
  let savedImage = "";
  let initializedPanel = false;
  let savedPageBackgrounds = {};

  const $ = id => document.getElementById(id);

  function addStyles() {
    if ($("ma3daOwnerBackgroundStyles")) return;

    const style = document.createElement("style");
    style.id = "ma3daOwnerBackgroundStyles";
    style.textContent = `
      /* الهوية البيضاء والذهبية لمركز التحكم الشامل */
      #ma3daControlCenter {
        direction: rtl !important;
        color: #242424 !important;
        background: #fff !important;
        border: 1px solid #d7bd82 !important;
        border-radius: 22px !important;
        box-shadow: 0 14px 38px rgba(30, 24, 12, .08) !important;
      }
      #ma3daControlCenter [data-cc-panel],
      #ma3daControlCenter .ma3da-cc-card,
      #ma3daControlCenter .ma3da-cc-section,
      #ma3daControlCenter .ma3da-cc-history-item,
      #${PANEL_ID},
      #${PANEL_ID} .bg-panel {
        color: #242424 !important;
        background: #fff !important;
        border: 1px solid #e5d7b5 !important;
        border-radius: 16px !important;
        box-shadow: 0 6px 20px rgba(30, 24, 12, .045) !important;
      }
      #ma3daControlCenter [data-cc-tab] {
        color: #5c4a25 !important;
        background: #fff !important;
        border: 1px solid #d7bd82 !important;
        border-radius: 12px !important;
      }
      #ma3daControlCenter [data-cc-tab].active {
        color: #fff !important;
        background: #b8954a !important;
        border-color: #b8954a !important;
      }
      #ma3daControlCenter input:not([type="range"]),
      #ma3daControlCenter select,
      #ma3daControlCenter textarea {
        color: #242424 !important;
        background: #fff !important;
        border: 1px solid #d9c79c !important;
        border-radius: 10px !important;
      }
      #ma3daControlCenter button {
        border-color: #c5a45e;
      }
      #${PANEL_ID} {
        direction: rtl;
        text-align: right;
        padding: 18px;
        margin-top: 14px;
      }
      #${PANEL_ID} .bg-panel {
        max-width: 760px;
        margin: 0 auto;
        padding: 20px;
      }
      #${PANEL_ID} .bg-preview {
        height: 230px;
        margin: 15px 0;
        border: 1px dashed #b8954a;
        border-radius: 14px;
        background: #fffdf8 center/cover no-repeat;
        display: grid;
        place-items: center;
        color: #6d5a32;
      }
      #${PANEL_ID} button {
        font: inherit;
        border: 1px solid #c5a45e;
        border-radius: 11px;
        padding: 11px 16px;
        margin: 6px 3px;
        cursor: pointer;
        background: #fff;
        color: #5c4a25;
      }
      #${PANEL_ID} .bg-publish {
        background: #b8954a;
        border-color: #b8954a;
        color: #fff;
      }
      #${PANEL_ID} .bg-status {
        min-height: 25px;
        margin-top: 12px;
        color: #5c4a25;
      }
      .ma3da-published-background {
        background-image:
          linear-gradient(
            rgba(255,255,255,var(--ma3da-bg-overlay,.84)),
            rgba(255,255,255,var(--ma3da-bg-overlay,.84))
          ),
          var(--ma3da-published-bg) !important;
        background-position: center !important;
        background-size: cover !important;
        background-repeat: no-repeat !important;
      }
    `;
    document.head.appendChild(style);
  }

  function status(message) {
    const el = $("ma3daBgStatus");
    if (el) el.textContent = message;
  }

  async function verifyOwner() {
    await window.ma3daFirebaseReady;
    const user = window.ma3daGetCurrentUser
      ? await window.ma3daGetCurrentUser()
      : window.ma3daAuth?.currentUser;

    if (!user?.uid) throw new Error("سجّل الدخول بحساب مالك التطبيق أولًا.");

    const ref = window.ma3daDoc(
      window.ma3daDB,
      "supportStaff",
      user.uid
    );
    const snapshot = await window.ma3daGetDoc(ref);
    const data = snapshot.exists() ? snapshot.data() : {};

    if (data.role !== "owner" || data.active === false) {
      throw new Error("إدارة الخلفيات مخصصة لمالك التطبيق فقط.");
    }
    return user;
  }

  function applyBackground(image, opacity = 16, pageId = "all") {
    if (!image) return;
    const screens = document.querySelectorAll(".screen[id]");
    const targets = pageId === "all"
      ? screens
      : Array.from(screens).filter(screen => screen.id === pageId);
    targets.forEach(screen => {
      if (screen.id === PANEL_ID || screen.id === "ma3daControlCenter") return;
      screen.style.setProperty("--ma3da-published-bg", 'url("' + image + '")');
      screen.style.setProperty("--ma3da-bg-overlay", String(1 - Number(opacity) / 100));
      screen.classList.add("ma3da-published-background");
    });
  }

  function clearBackground(pageId = "all") {
    const targets = pageId === "all"
      ? document.querySelectorAll(".screen[id]")
      : Array.from(document.querySelectorAll(".screen[id]")).filter(screen => screen.id === pageId);
    targets.forEach(screen => {
      screen.classList.remove("ma3da-published-background");
      screen.style.removeProperty("--ma3da-published-bg");
      screen.style.removeProperty("--ma3da-bg-overlay");
    });
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          const maxSize = 1200;
          const scale = Math.min(
            1,
            maxSize / Math.max(image.width, image.height)
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          canvas.getContext("2d").drawImage(
            image, 0, 0, canvas.width, canvas.height
          );

          let quality = 0.75;
          let result = canvas.toDataURL("image/jpeg", quality);
          while (result.length > 650000 && quality > 0.35) {
            quality -= 0.08;
            result = canvas.toDataURL("image/jpeg", quality);
          }
          if (result.length > 650000) {
            reject(new Error("حجم الصورة كبير؛ اختر صورة أصغر."));
            return;
          }
          resolve(result);
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function loadSavedBackground() {
    try {
      await window.ma3daFirebaseReady;
      if (!window.ma3daDB || !window.ma3daDoc || !window.ma3daGetDoc) return;

      const ref = window.ma3daDoc(window.ma3daDB, COLLECTION, DOC_ID);
      const snapshot = await window.ma3daGetDoc(ref);
      if (!snapshot.exists()) return;

      const data = snapshot.data() || {};
      savedImage = data.imageData || "";
      savedPageBackgrounds = data.pageBackgrounds || {};
      if (savedImage && data.allPages !== false) {
        applyBackground(savedImage, data.opacity ?? 16, "all");
      }
      Object.entries(savedPageBackgrounds).forEach(([pageId, entry]) => {
        if (entry?.imageData) applyBackground(entry.imageData, entry.opacity ?? 16, pageId);
        else clearBackground(pageId);
      });
      if (savedImage && data.allPages !== false) {
        const preview = $("ma3daBgPreview");
        if (preview) {
          preview.style.backgroundImage = 'url("' + savedImage + '")';
          preview.textContent = "";
        }
        const opacity = $("ma3daBgOpacity");
        const opacityValue = $("ma3daBgOpacityValue");
        if (opacity) opacity.value = String(data.opacity ?? 16);
        if (opacityValue) opacityValue.textContent = String(data.opacity ?? 16) + "%";
      }
    } catch (error) {
      console.warn("تعذر تحميل خلفية مِعدة:", error);
    }
  }

  async function publishBackground() {
    const button = $("ma3daBgPublish");
    try {
      const user = await verifyOwner();
      if (!selectedImage) {
        status("اختر صورة أولًا.");
        return;
      }

      if (button) button.disabled = true;
      status("جارٍ حفظ الخلفية...");

      const ref = window.ma3daDoc(window.ma3daDB, COLLECTION, DOC_ID);
      const opacity = Number($("ma3daBgOpacity")?.value || 16);
      const pageId = $("ma3daBgPageSelect")?.value || "all";
      const snap = await window.ma3daGetDoc(ref);
      const existing = snap.exists() ? (snap.data() || {}) : {};
      const pageBackgrounds = { ...(existing.pageBackgrounds || {}) };
      if (pageId === "all") {
        await window.ma3daSetDoc(ref, {
          imageData: selectedImage, opacity, allPages: true,
          pageBackgrounds, updatedAtMs: Date.now(), updatedBy: user.uid
        }, { merge: true });
        savedImage = selectedImage;
        applyBackground(savedImage, opacity, "all");
        status("تم حفظ الخلفية وتطبيقها على جميع الصفحات.");
      } else {
        pageBackgrounds[pageId] = { imageData: selectedImage, opacity };
        await window.ma3daSetDoc(ref, {
          pageBackgrounds, updatedAtMs: Date.now(), updatedBy: user.uid
        }, { merge: true });
        savedPageBackgrounds = pageBackgrounds;
        applyBackground(selectedImage, opacity, pageId);
        status("تم حفظ الخلفية للصفحة المحددة فقط.");
      }
    } catch (error) {
      console.error("Background publish error:", error);
      status(error.message || "تعذر الحفظ. تحقق من صلاحيات Firebase.");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function selectBackgroundTab() {
    const center = $("ma3daControlCenter");
    if (!center) return;

    center.querySelectorAll("[data-cc-tab]").forEach(button => {
      const active = button.dataset.ccTab === "backgrounds";
      button.classList.toggle("active", active);
    });
    center.querySelectorAll("[data-cc-panel]").forEach(panel => {
      panel.hidden = panel.dataset.ccPanel !== "backgrounds";
    });
  }

  function ensureBackgroundPanel() {
    const center = $("ma3daControlCenter");
    if (!center) throw new Error("تعذر العثور على مركز التحكم الشامل.");

    addStyles();

    let tab = center.querySelector('[data-cc-tab="backgrounds"]');
    if (!tab) {
      tab = document.createElement("button");
      tab.type = "button";
      tab.dataset.ccTab = "backgrounds";
      tab.textContent = "إدارة الخلفيات";
      const firstTab = center.querySelector("[data-cc-tab]");
      if (firstTab?.parentElement) firstTab.parentElement.appendChild(tab);
      else center.prepend(tab);
    }
    if (tab.dataset.ma3daBackgroundBound !== "1") {
      tab.addEventListener("click", openBackgroundPage);
      tab.dataset.ma3daBackgroundBound = "1";
    }

    let panel = $(PANEL_ID);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.dataset.ccPanel = "backgrounds";
      panel.hidden = true;
      panel.innerHTML = `
        <div class="bg-panel">
          <h3 style="text-align:center;color:#a98638;margin-top:0">
            مِعدة | إدارة خلفيات التطبيق
          </h3>
          <p>اختر الصفحة أولًا. يمكنك تطبيق الخلفية على صفحة واحدة أو على جميع الصفحات.</p>
          <label for="ma3daBgPageSelect">الصفحة المستهدفة</label>
          <select id="ma3daBgPageSelect" style="display:block;width:100%;margin:8px 0 14px;padding:10px;border-radius:10px;border:1px solid #d9c79c;background:#fff;color:#242424">
            <option value="all">جميع الصفحات</option>
          </select>
          <button id="ma3daBgDelete" type="button">حذف خلفية الصفحة المحددة</button>
          <label for="ma3daBgFile">اختر صورة الخلفية</label>
          <input id="ma3daBgFile" type="file" accept="image/*"
            style="display:block;width:100%;margin:12px 0">

          <div id="ma3daBgPreview" class="bg-preview">
            ستظهر معاينة الصورة هنا
          </div>

          <label for="ma3daBgOpacity">
            درجة وضوح الصورة:
            <span id="ma3daBgOpacityValue">16%</span>
          </label>
          <input id="ma3daBgOpacity" type="range" min="5" max="45" value="16"
            style="display:block;width:100%">

          <div style="text-align:center;margin-top:12px">
            <button id="ma3daBgPublish" class="bg-publish" type="button">حفظ ونشر الخلفية</button>
            <button id="ma3daBgRestore" type="button">معاينة الخلفية المحفوظة</button>
          </div>
          <div id="ma3daBgStatus" class="bg-status" role="status"></div>
        </div>
      `;

      const lastPanel = center.querySelector("[data-cc-panel]:last-of-type");
      if (lastPanel?.parentElement === center) lastPanel.after(panel);
      else center.appendChild(panel);
    }

    if (!initializedPanel) {
      initializedPanel = true;

      $("ma3daBgFile")?.addEventListener("change", async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          status("الملف المحدد ليس صورة.");
          return;
        }
        try {
          selectedImage = await compressImage(file);
          const preview = $("ma3daBgPreview");
          if (preview) {
            preview.style.backgroundImage = 'url("' + selectedImage + '")';
            preview.textContent = "";
          }
          status("تم تجهيز الصورة للمعاينة.");
        } catch (error) {
          status(error.message || "تعذر تجهيز الصورة.");
        }
      });

      $("ma3daBgOpacity")?.addEventListener("input", event => {
        const value = Number(event.target.value);
        const valueLabel = $("ma3daBgOpacityValue");
        if (valueLabel) valueLabel.textContent = value + "%";
        if (selectedImage) applyBackground(selectedImage, value);
      });

      const pageSelect = $("ma3daBgPageSelect");
      if (pageSelect) {
        const seen = new Set(Array.from(pageSelect.options).map(option => option.value));
        document.querySelectorAll(".screen[id]").forEach(screen => {
          if (!screen.id || screen.id === PANEL_ID || screen.id === "ma3daControlCenter" || seen.has(screen.id)) return;
          const option = document.createElement("option");
          option.value = screen.id;
          option.textContent = (screen.getAttribute("aria-label") || screen.querySelector("h1,h2")?.textContent || screen.id).trim().slice(0, 80);
          pageSelect.appendChild(option);
          seen.add(screen.id);
        });
        pageSelect.addEventListener("change", async () => {
          const pageId = pageSelect.value;
          const entry = pageId === "all" ? null : savedPageBackgrounds[pageId];
          const image = pageId === "all" ? savedImage : (entry?.imageData || "");
          const preview = $("ma3daBgPreview");
          if (preview) {
            preview.style.backgroundImage = image ? 'url("' + image + '")' : "";
            preview.textContent = image ? "" : "لا توجد خلفية محفوظة لهذه الصفحة";
          }
          if (entry?.opacity != null && $("ma3daBgOpacity")) $("ma3daBgOpacity").value = String(entry.opacity);
          if ($("ma3daBgOpacityValue") && $("ma3daBgOpacity")) $("ma3daBgOpacityValue").textContent = $("ma3daBgOpacity").value + "%";
        });
      }

      $("ma3daBgDelete")?.addEventListener("click", async () => {
        try {
          const user = await verifyOwner();
          const pageId = $("ma3daBgPageSelect")?.value || "all";
          const ref = window.ma3daDoc(window.ma3daDB, COLLECTION, DOC_ID);
          const snap = await window.ma3daGetDoc(ref);
          const existing = snap.exists() ? (snap.data() || {}) : {};
          const pageBackgrounds = { ...(existing.pageBackgrounds || {}) };
          if (pageId === "all") {
            await window.ma3daSetDoc(ref, { imageData: "", allPages: false, updatedAtMs: Date.now(), updatedBy: user.uid }, { merge: true });
            savedImage = "";
            clearBackground("all");
          } else {
            pageBackgrounds[pageId] = { imageData: "", opacity: Number($("ma3daBgOpacity")?.value || 16) };
            await window.ma3daSetDoc(ref, { pageBackgrounds, updatedAtMs: Date.now(), updatedBy: user.uid }, { merge: true });
            savedPageBackgrounds = pageBackgrounds;
            clearBackground(pageId);
          }
          const preview = $("ma3daBgPreview");
          if (preview) { preview.style.backgroundImage = ""; preview.textContent = "لا توجد خلفية محفوظة لهذه الصفحة"; }
          status(pageId === "all" ? "تم حذف الخلفية العامة فقط." : "تم حذف خلفية الصفحة المحددة فقط.");
        } catch (error) {
          status(error.message || "تعذر حذف الخلفية.");
        }
      });

      $("ma3daBgPublish")?.addEventListener("click", publishBackground);

      $("ma3daBgRestore")?.addEventListener("click", () => {
        if (!savedImage) {
          status("لا توجد خلفية محفوظة.");
          return;
        }
        selectedImage = savedImage;
        const preview = $("ma3daBgPreview");
        if (preview) {
          preview.style.backgroundImage = 'url("' + savedImage + '")';
          preview.textContent = "";
        }
        status("تمت معاينة الخلفية المحفوظة.");
      });
    }

    return panel;
  }

  async function openBackgroundPage() {
    try {
      await verifyOwner();
      ensureBackgroundPanel();
      selectBackgroundTab();
      await loadSavedBackground();
      $("ma3daControlCenter")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } catch (error) {
      console.error("فتح إدارة الخلفيات:", error);
      alert(error.message || "تعذر فتح إدارة الخلفيات.");
    }
  }

  // يفتح قسم الخلفيات من داخل مركز التحكم، ولا ينشئ صفحة منفصلة.
  window.ma3daOpenBackgroundManager = openBackgroundPage;
  window.ma3daEnsureBackgroundPanel = ensureBackgroundPanel;

  function initialize() {
    // لا نقرأ إعدادات الخلفية عند تشغيل التطبيق؛ القراءة تتم فقط
    // بعد التحقق من صلاحية المالك عند فتح تبويب إدارة الخلفيات.
    addStyles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
  window.addEventListener("load", initialize, { once: true });
})();

/* =========================================================
   MA3DA | OWNER CONTROL CENTER
   إضافة مستقلة — لا تستبدل أي كود سابق
========================================================= */
(function Ma3daOwnerControlCenter() {
  "use strict";

  const COLLECTION = "ma3daSettings";
  const DOC_ID = "ownerControlCenter";
  const HISTORY = "ma3daSettingsHistory";
  const CAMPAIGNS = "marketingCampaigns";

  const $ = id => document.getElementById(id);

  let currentSettings = {};
  let originalTexts = {};
  let initialized = false;

  const textTargets = {
    introTitle: "#introScreen .hero h1",
    customerTitle: "#customerHomeScreen .hero h1",
    operatorTitle: "#operatorHomeScreen .hero h1",
    supportTitle: "#supportLandingScreen .hero h1"
  };

  const textFields = {
    introTitle: "ccIntroTitle",
    customerTitle: "ccCustomerTitle",
    operatorTitle: "ccOperatorTitle",
    supportTitle: "ccSupportTitle"
  };

  const priceFields = {
    "بوكلين": "ccPriceBackhoe",
    "شيول": "ccPriceLoader",
    "قلاب": "ccPriceTruck",
    "كرين": "ccPriceCrane",
    "حفار": "ccPriceExcavator",
    "بلدوزر": "ccPriceBulldozer"
  };

  function status(message, error = false) {
    const el = $("ccMainStatus");
    if (!el) return;
    el.textContent = message;
    el.dataset.error = error ? "1" : "0";
  }

  function campaignStatus(message) {
    const el = $("ccCampaignStatus");
    if (el) el.textContent = message;
  }

  async function getOwner() {
    await window.ma3daFirebaseReady;

    const user = await window.ma3daGetCurrentUser();

    if (!user?.uid) {
      throw new Error("يجب تسجيل الدخول بحساب مالك التطبيق.");
    }

    const ref = window.ma3daDoc(
      window.ma3daDB,
      "supportStaff",
      user.uid
    );

    const snap = await window.ma3daGetDoc(ref);

    if (!snap.exists()) {
      throw new Error("حساب المالك غير مسجل في قاعدة البيانات.");
    }

    const data = snap.data() || {};

    if (data.role !== "owner" || data.active === false) {
      throw new Error("ليس لديك صلاحية استخدام مركز التحكم.");
    }

    return user;
  }

  function getDefaultSettings() {
    return {
      texts: {
        introTitle: "",
        customerTitle: "",
        operatorTitle: "",
        supportTitle: ""
      },
      design: {
        primary: "#111111",
        gold: "#c8a45b",
        fontScale: "1",
        radius: "16"
      },
      prices: {
        "بوكلين": 250,
        "شيول": 220,
        "قلاب": 180,
        "كرين": 350,
        "حفار": 250,
        "بلدوزر": 300
      },
      finance: {
        commission: 0,
        vat: 15,
        invoicePrefix: "M3",
        invoiceFooter: ""
      },
      pageCustomization: {}
    };
  }

  function mergeSettings(data) {
    const defaults = getDefaultSettings();

    return {
      ...defaults,
      ...data,
      texts: { ...defaults.texts, ...(data?.texts || {}) },
      design: { ...defaults.design, ...(data?.design || {}) },
      prices: { ...defaults.prices, ...(data?.prices || {}) },
      finance: { ...defaults.finance, ...(data?.finance || {}) },
      pageCustomization: { ...(data?.pageCustomization || {}) }
    };
  }

  function applyTexts(texts) {
    Object.entries(textTargets).forEach(([key, selector]) => {
      const element = document.querySelector(selector);
      if (!element) return;

      if (!originalTexts[key]) {
        originalTexts[key] = element.textContent;
      }

      const value = String(texts[key] || "").trim();

      if (value) {
        element.textContent = value;
      } else if (originalTexts[key]) {
        element.textContent = originalTexts[key];
      }
    });
  }

  function applyDesign(design) {
    const root = document.documentElement;

    root.style.setProperty(
      "--ma3da-admin-primary",
      design.primary || "#111111"
    );

    root.style.setProperty(
      "--ma3da-admin-gold",
      design.gold || "#c8a45b"
    );

    root.style.setProperty(
      "--ma3da-admin-font-scale",
      String(design.fontScale || 1)
    );

    root.style.setProperty(
      "--ma3da-admin-radius",
      `${Number(design.radius || 16)}px`
    );
  }

  function applyPrices(prices) {
    // ربط الأسعار بالكائن الموجود في التطبيق.
    if (typeof hourlyPrices === "undefined") return;

    Object.entries(prices || {}).forEach(([name, value]) => {
      const price = Number(value);

      if (
        Object.prototype.hasOwnProperty.call(hourlyPrices, name) &&
        Number.isFinite(price) &&
        price >= 0
      ) {
        hourlyPrices[name] = price;
      }
    });
  }

  function applySettings(settings) {
    currentSettings = mergeSettings(settings);

    applyTexts(currentSettings.texts);
    applyDesign(currentSettings.design);
    applyPrices(currentSettings.prices);
    applyPageCustomizations(currentSettings.pageCustomization);

    window.ma3daControlSettings = currentSettings;
  }

  function readForm() {
    const defaults = getDefaultSettings();

    const texts = {};
    Object.entries(textFields).forEach(([key, id]) => {
      texts[key] = $(id)?.value.trim() || "";
    });

    const prices = {};
    Object.entries(priceFields).forEach(([name, id]) => {
      const value = Number($(id)?.value);
      prices[name] = Number.isFinite(value) && value >= 0
        ? value
        : defaults.prices[name];
    });

    return {
      texts,
      design: {
        primary: $("ccPrimaryColor")?.value || "#111111",
        gold: $("ccGoldColor")?.value || "#c8a45b",
        fontScale: $("ccFontScale")?.value || "1",
        radius: $("ccCardRadius")?.value || "16"
      },
      prices,
      pageCustomization: { ...(currentSettings.pageCustomization || {}) },
      finance: {
        commission: Math.max(
          0,
          Math.min(100, Number($("ccCommission")?.value || 0))
        ),
        vat: Math.max(
          0,
          Math.min(100, Number($("ccVat")?.value || 15))
        ),
        invoicePrefix: $("ccInvoicePrefix")?.value.trim() || "M3",
        invoiceFooter: $("ccInvoiceFooter")?.value.trim() || ""
      }
    };
  }

  function fillForm(settings) {
    const s = mergeSettings(settings);

    Object.entries(textFields).forEach(([key, id]) => {
      if ($(id)) $(id).value = s.texts[key] || "";
    });

    if ($("ccPrimaryColor")) {
      $("ccPrimaryColor").value = s.design.primary;
    }

    if ($("ccGoldColor")) {
      $("ccGoldColor").value = s.design.gold;
    }

    if ($("ccFontScale")) {
      $("ccFontScale").value = String(s.design.fontScale);
    }

    if ($("ccCardRadius")) {
      $("ccCardRadius").value = String(s.design.radius);
    }

    Object.entries(priceFields).forEach(([name, id]) => {
      if ($(id)) $(id).value = s.prices[name];
    });

    if ($("ccCommission")) {
      $("ccCommission").value = s.finance.commission;
    }

    if ($("ccVat")) {
      $("ccVat").value = s.finance.vat;
    }

    if ($("ccInvoicePrefix")) {
      $("ccInvoicePrefix").value = s.finance.invoicePrefix;
    }

    if ($("ccInvoiceFooter")) {
      $("ccInvoiceFooter").value = s.finance.invoiceFooter;
    }
  }

  const PAGE_CATEGORIES = [
    { label: "المقدمة", test: id => /intro|whyMa3da|howMa3da|howWorks|startMa3da/i.test(id) },
    { label: "صفحات العميل", test: id => /customer|matched|request|order|previousOrders/i.test(id) },
    { label: "صفحات صاحب المعدة", test: id => /operator|owner|equipment/i.test(id) },
    { label: "صفحات المشاريع", test: id => /contractor|project/i.test(id) },
    { label: "الدخول والتسجيل", test: id => /login|register|signup|phone|password|auth/i.test(id) }
  ];
  let pageDraft = {};
  let selectedPageId = "";
  let selectedElementSelector = "";

  function editableElements(page) {
    if (!page) return [];
    return Array.from(page.querySelectorAll("h1,h2,h3,h4,p,label,button,a,[role='button'],.hero-title,.support-title,.support-subtitle"))
      .filter(el => !el.closest("#ma3daControlCenter") && !el.closest("#ma3daControlCenterBackgroundPanel") && (el.textContent || "").trim())
      .slice(0, 250);
  }

  function stableSelector(el, root) {
    if (el.id) return "#" + CSS.escape(el.id);
    const parts = [];
    let node = el;
    while (node && node !== root && parts.length < 8) {
      let part = node.tagName.toLowerCase();
      if (node.classList.length) part += "." + Array.from(node.classList).slice(0, 2).map(c => CSS.escape(c)).join(".");
      const siblings = node.parentElement ? Array.from(node.parentElement.children).filter(x => x.tagName === node.tagName) : [];
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      parts.unshift(part);
      node = node.parentElement;
    }
    return "#" + CSS.escape(root.id) + " " + parts.join(" > ");
  }

  function pageLabel(page) {
    return (page.getAttribute("aria-label") || page.querySelector("h1,h2")?.textContent || page.id).trim().replace(/\s+/g, " ").slice(0, 80);
  }

  function applyPageCustomizations(all) {
    Object.entries(all || {}).forEach(([pageId, config]) => {
      const page = document.getElementById(pageId);
      if (!page || !config) return;
      Object.entries(config.elements || {}).forEach(([selector, item]) => {
        let el;
        try { el = document.querySelector(selector); } catch (_) { return; }
        if (!el || !page.contains(el)) return;
        if (typeof item.text === "string") el.textContent = item.text;
        if (item.fontFamily) el.style.fontFamily = item.fontFamily;
        if (item.fontSize) el.style.fontSize = item.fontSize + "px";
        if (item.color) el.style.color = item.color;
        if (item.bold != null) el.style.fontWeight = item.bold ? "800" : "400";
        if (item.italic != null) el.style.fontStyle = item.italic ? "italic" : "normal";
        if (item.align) el.style.textAlign = item.align;
      });
    });
  }

  function ensurePageCustomizationPanel() {
    const center = $("ma3daControlCenter");
    if (!center) return;
    let tab = center.querySelector('[data-cc-tab="page-customization"]');
    if (!tab) {
      tab = document.createElement("button");
      tab.type = "button";
      tab.dataset.ccTab = "page-customization";
      tab.textContent = "تخصيص الصفحات";
      center.querySelector(".ma3da-cc-tabs")?.appendChild(tab);
      tab.addEventListener("click", () => activateTab("page-customization"));
    }
    let panel = center.querySelector('[data-cc-panel="page-customization"]');
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "ma3da-cc-panel";
      panel.dataset.ccPanel = "page-customization";
      panel.hidden = true;
      panel.innerHTML = `
        <h3>تخصيص كل صفحة بشكل مستقل</h3>
        <p>اختر المجموعة ثم الصفحة والعنصر. التعديلات هنا خاصة بالصفحة المختارة ولا تغيّر بقية الصفحات.</p>
        <label for="ccPageCategory">مجموعة الصفحات</label><select id="ccPageCategory" style="display:block;width:100%;padding:10px;margin:6px 0 12px"></select>
        <label for="ccPageSelect">الصفحة</label><select id="ccPageSelect" style="display:block;width:100%;padding:10px;margin:6px 0 12px"></select>
        <label for="ccElementSelect">العنصر المراد تعديله</label><select id="ccElementSelect" style="display:block;width:100%;padding:10px;margin:6px 0 12px"></select>
        <label for="ccElementText">النص</label><textarea id="ccElementText" rows="3" maxlength="1500" style="width:100%;padding:10px;margin:6px 0 12px"></textarea>
        <label for="ccElementFont">نوع الخط</label><select id="ccElementFont" style="display:block;width:100%;padding:10px;margin:6px 0 12px"><option value="inherit">خط التطبيق الحالي</option><option value="Arial, sans-serif">Arial</option><option value="Tahoma, sans-serif">Tahoma</option><option value="'Cairo', sans-serif">Cairo</option><option value="'Noto Sans Arabic', sans-serif">Noto Sans Arabic</option><option value="serif">Serif</option></select>
        <label for="ccElementSize">حجم الخط (px)</label><input id="ccElementSize" type="number" min="8" max="72" value="16" style="display:block;width:100%;padding:10px;margin:6px 0 12px">
        <label for="ccElementColor">لون النص</label><input id="ccElementColor" type="color" value="#242424" style="display:block;margin:6px 0 12px">
        <label><input id="ccElementBold" type="checkbox"> عريض</label> <label><input id="ccElementItalic" type="checkbox"> مائل</label>
        <label for="ccElementAlign">محاذاة النص</label><select id="ccElementAlign" style="display:block;width:100%;padding:10px;margin:6px 0 12px"><option value="right">يمين</option><option value="center">وسط</option><option value="left">يسار</option></select>
        <button type="button" id="ccPagePreview">معاينة العنصر</button> <button type="button" id="ccPageSave">حفظ تخصيص هذه الصفحة</button>
        <p id="ccPageStatus" role="status" aria-live="polite"></p>`;
      center.appendChild(panel);
    }
    const category = $("ccPageCategory"), pageSelect = $("ccPageSelect");
    if (!category || !pageSelect || category.dataset.ready === "1") return;
    category.dataset.ready = "1";
    PAGE_CATEGORIES.forEach((item, index) => {
      const option = document.createElement("option"); option.value = String(index); option.textContent = item.label; category.appendChild(option);
    });
    const pages = Array.from(document.querySelectorAll(".screen[id]"))
      .filter(page => page.id !== "ma3daControlCenter" && page.id !== "ma3daControlCenterBackgroundPanel" && !page.id.startsWith("ma3daControlCenter"));
    function refreshPages() {
      const cat = PAGE_CATEGORIES[Number(category.value)] || PAGE_CATEGORIES[0];
      pageSelect.replaceChildren();
      pages.filter(page => cat.test(page.id)).forEach(page => {
        const option = document.createElement("option"); option.value = page.id; option.textContent = pageLabel(page); pageSelect.appendChild(option);
      });
      if (!pageSelect.options.length) pages.forEach(page => { const o = document.createElement("option"); o.value = page.id; o.textContent = pageLabel(page); pageSelect.appendChild(o); });
      selectedPageId = pageSelect.value || ""; refreshElements();
    }
    function loadElement() {
      const page = document.getElementById(pageSelect.value);
      selectedPageId = pageSelect.value;
      selectedElementSelector = $("ccElementSelect")?.value || "";
      const el = page && selectedElementSelector ? (() => { try { return document.querySelector(selectedElementSelector); } catch (_) { return null; } })() : null;
      const saved = pageDraft[selectedPageId]?.elements?.[selectedElementSelector] || {};
      if ($("ccElementText")) $("ccElementText").value = saved.text ?? el?.textContent ?? "";
      if ($("ccElementFont")) $("ccElementFont").value = saved.fontFamily || "inherit";
      if ($("ccElementSize")) $("ccElementSize").value = saved.fontSize || parseInt(el?.style.fontSize, 10) || 16;
      if ($("ccElementColor")) $("ccElementColor").value = saved.color || el?.style.color || "#242424";
      if ($("ccElementBold")) $("ccElementBold").checked = saved.bold ?? (el?.style.fontWeight === "800" || el?.style.fontWeight === "bold");
      if ($("ccElementItalic")) $("ccElementItalic").checked = saved.italic ?? (el?.style.fontStyle === "italic");
      if ($("ccElementAlign")) $("ccElementAlign").value = saved.align || el?.style.textAlign || "right";
    }
    function refreshElements() {
      const page = document.getElementById(pageSelect.value), select = $("ccElementSelect");
      if (!select) return;
      select.replaceChildren();
      editableElements(page).forEach(el => {
        const selector = stableSelector(el, page);
        const option = document.createElement("option"); option.value = selector;
        option.textContent = `${el.tagName.toLowerCase()} — ${(el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 70)}`;
        select.appendChild(option);
      });
      loadElement();
    }
    category.addEventListener("change", refreshPages);
    pageSelect.addEventListener("change", refreshElements);
    $("ccElementSelect")?.addEventListener("change", loadElement);
    function readElementEditor() {
      return { text: $("ccElementText")?.value || "", fontFamily: $("ccElementFont")?.value || "inherit", fontSize: Math.max(8, Math.min(72, Number($("ccElementSize")?.value || 16))), color: $("ccElementColor")?.value || "#242424", bold: !!$("ccElementBold")?.checked, italic: !!$("ccElementItalic")?.checked, align: $("ccElementAlign")?.value || "right" };
    }
    function applyEditorPreview() {
      const page = document.getElementById(pageSelect.value); let el;
      try { el = document.querySelector($("ccElementSelect")?.value || ""); } catch (_) {}
      if (!page || !el || !page.contains(el)) return;
      const data = readElementEditor(); el.textContent = data.text; el.style.fontFamily = data.fontFamily; el.style.fontSize = data.fontSize + "px"; el.style.color = data.color; el.style.fontWeight = data.bold ? "800" : "400"; el.style.fontStyle = data.italic ? "italic" : "normal"; el.style.textAlign = data.align;
      const statusEl = $("ccPageStatus"); if (statusEl) statusEl.textContent = "معاينة محلية فقط؛ اضغط حفظ لاعتمادها.";
    }
    $("ccPagePreview")?.addEventListener("click", applyEditorPreview);
    $("ccPageSave")?.addEventListener("click", async () => {
      try {
        const user = await getOwner(); const pageId = pageSelect.value; const selector = $("ccElementSelect")?.value || "";
        if (!pageId || !selector) throw new Error("اختر صفحة وعنصرًا أولًا.");
        const page = document.getElementById(pageId); let el;
        try { el = document.querySelector(selector); } catch (_) {}
        if (!page || !el || !page.contains(el)) throw new Error("تعذر العثور على العنصر داخل الصفحة المختارة.");
        const updated = { ...(currentSettings.pageCustomization || {}) };
        const pageConfig = { ...(updated[pageId] || {}), elements: { ...((updated[pageId] || {}).elements || {}) } };
        pageConfig.elements[selector] = readElementEditor(); updated[pageId] = pageConfig;
        const ref = window.ma3daDoc(window.ma3daDB, COLLECTION, DOC_ID);
        await window.ma3daSetDoc(ref, { pageCustomization: updated, updatedBy: user.uid, updatedByEmail: user.email || "", updatedAt: new Date(), updatedAtMs: Date.now() }, { merge: true });
        currentSettings = mergeSettings({ ...currentSettings, pageCustomization: updated }); pageDraft = updated; applyPageCustomizations(updated); window.ma3daControlSettings = currentSettings;
        const statusEl = $("ccPageStatus"); if (statusEl) statusEl.textContent = `تم حفظ تخصيص صفحة «${pageLabel(page)}» فقط.`;
      } catch (error) { const statusEl = $("ccPageStatus"); if (statusEl) statusEl.textContent = error.message || "تعذر حفظ تخصيص الصفحة."; }
    });
    pageDraft = { ...(currentSettings.pageCustomization || {}) };
    refreshPages();
  }

  async function loadSettings() {
    await getOwner();

    const ref = window.ma3daDoc(
      window.ma3daDB,
      COLLECTION,
      DOC_ID
    );

    const snap = await window.ma3daGetDoc(ref);

    const settings = snap.exists()
      ? snap.data()
      : getDefaultSettings();

    fillForm(settings);
    applySettings(settings);
    pageDraft = { ...(mergeSettings(settings).pageCustomization || {}) };
    ensurePageCustomizationPanel();

    status("تم تحميل إعدادات مركز التحكم.");
  }

  function activateTab(name) {
    document.querySelectorAll("[data-cc-tab]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.ccTab === name
      );
    });

    document.querySelectorAll("[data-cc-panel]").forEach(panel => {
      panel.hidden = panel.dataset.ccPanel !== name;
    });
  }

  async function saveSettings() {
    try {
      const user = await getOwner();
      const settings = readForm();

      const docRef = window.ma3daDoc(
        window.ma3daDB,
        COLLECTION,
        DOC_ID
      );

      // الاحتفاظ بنسخة سابقة قبل اعتماد التعديل.
      if (Object.keys(currentSettings).length) {
        await window.ma3daAddDoc(
          window.ma3daCollection(window.ma3daDB, HISTORY),
          {
            settings: currentSettings,
            changedBy: user.uid,
            changedByEmail: user.email || "",
            createdAt: new Date(),
            createdAtMs: Date.now()
          }
        );
      }

      await window.ma3daSetDoc(
        docRef,
        {
          ...settings,
          updatedBy: user.uid,
          updatedByEmail: user.email || "",
          updatedAt: new Date(),
          updatedAtMs: Date.now(),
          version: 1
        },
        { merge: true }
      );

      applySettings(settings);
      fillForm(settings);

      status("تم حفظ الإعدادات واعتمادها بنجاح.");

    } catch (error) {
      console.error("MA3DA control save:", error);
      status(error.message || "تعذر حفظ الإعدادات.", true);
    }
  }

  function previewTexts() {
    const values = {};

    Object.entries(textFields).forEach(([key, id]) => {
      values[key] = $(id)?.value.trim() || "";
    });

    applyTexts(values);
    status("هذه معاينة محلية للنصوص. اضغط حفظ لاعتمادها.");
  }

  function previewDesign() {
    const design = {
      primary: $("ccPrimaryColor")?.value,
      gold: $("ccGoldColor")?.value,
      fontScale: $("ccFontScale")?.value,
      radius: $("ccCardRadius")?.value
    };

    applyDesign(design);

    const preview = $("ccDesignPreview");

    if (preview) {
      preview.style.background = design.primary;
      preview.style.color = "#ffffff";
      preview.style.borderColor = design.gold;
      preview.style.borderRadius = `${Number(design.radius)}px`;
      preview.style.fontSize = `${Number(design.fontScale)}em`;
      preview.style.border = `2px solid ${design.gold}`;
    }

    status("تم تطبيق معاينة التصميم محلياً.");
  }

  function resetPreview() {
    applySettings(currentSettings);
    fillForm(currentSettings);

    const preview = $("ccDesignPreview");

    if (preview) {
      preview.removeAttribute("style");
    }

    status("تم إلغاء المعاينة.");
  }

  async function publishCampaign() {
    const button = $("ccCampaignPublish");

    try {
      const user = await getOwner();

      const title = $("ccCampaignTitle")?.value.trim() || "";
      const body = $("ccCampaignBody")?.value.trim() || "";
      const audience = $("ccCampaignAudience")?.value || "all";
      const link = $("ccCampaignLink")?.value.trim() || "";

      if (!title || !body) {
        campaignStatus("اكتب عنوان الإعلان ونصه أولاً.");
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "جارٍ حفظ الحملة...";
      }

      await window.ma3daAddDoc(
        window.ma3daCollection(window.ma3daDB, CAMPAIGNS),
        {
          title,
          body,
          audience,
          link,
          status: "awaiting_fcm_backend",
          deliveryProvider: "firebase-cloud-messaging",
          deliveryEnabled: false,
          createdBy: user.uid,
          createdByEmail: user.email || "",
          createdAt: new Date(),
          createdAtMs: Date.now()
        }
      );

      campaignStatus(
        "تم حفظ الحملة. لم تُرسل إلى الأجهزة بعد؛ يلزم ربط خدمة FCM الخلفية."
      );

      $("ccCampaignTitle").value = "";
      $("ccCampaignBody").value = "";
      $("ccCampaignLink").value = "";

    } catch (error) {
      console.error("MA3DA campaign:", error);
      campaignStatus(error.message || "تعذر حفظ الحملة.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "نشر الحملة";
      }
    }
  }

  async function loadHistory() {
    const target = $("ccHistoryList");
    if (!target) return;

    target.textContent = "جارٍ تحميل سجل التعديلات...";

    try {
      await getOwner();

      const snap = await window.ma3daGetDocs(
        window.ma3daCollection(window.ma3daDB, HISTORY)
      );

      const records = [];

      snap.forEach(doc => {
        records.push({
          id: doc.id,
          ...doc.data()
        });
      });

      records.sort(
        (a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0)
      );

      target.replaceChildren();

      if (!records.length) {
        target.textContent = "لا توجد تعديلات سابقة.";
        return;
      }

      records.slice(0, 50).forEach(record => {
        const item = document.createElement("article");
        item.className = "ma3da-cc-history-item";

        const heading = document.createElement("strong");
        heading.textContent = "تعديل محفوظ";

        const details = document.createElement("p");
        details.textContent =
          (record.changedByEmail || record.changedBy || "مالك التطبيق") +
          " · " +
          new Date(
            Number(record.createdAtMs || 0)
          ).toLocaleString("ar-SA");

        const restore = document.createElement("button");
        restore.type = "button";
        restore.textContent = "استعادة هذه النسخة";

        restore.addEventListener("click", async () => {
          if (!confirm("هل تريد استعادة هذه الإعدادات؟")) return;

          try {
            await getOwner();

            const previous = mergeSettings(record.settings || {});

            fillForm(previous);

            await saveSettings();

            status("تمت استعادة الإعدادات المحفوظة.");

          } catch (error) {
            status(error.message || "تعذرت الاستعادة.", true);
          }
        });

        item.append(heading, details, restore);
        target.appendChild(item);
      });

    } catch (error) {
      target.textContent =
        error.message || "تعذر تحميل سجل التعديلات.";
    }
  }

  async function openCenter() {
    const page = $("ma3daControlCenter");
    const dashboard = $("ownerPortalDashboardScreen");

    try {
      await getOwner();

      if (!page || !dashboard) {
        throw new Error("تعذر العثور على لوحة مالك التطبيق.");
      }

      // إخفاء عناصر لوحة المالك فقط، مع إبقاء الحاوية التي تحتوي مركز التحكم ظاهرة.
      [
        ".owner-admin-toolbar",
        "#ownerInfoStatus",
        ".owner-admin-metrics",
        ".owner-admin-grid",
        "#ownerAdminDetails",
        "#ma3daControlCenterEntryWrap"
      ].forEach(selector => {
        dashboard.querySelectorAll(selector).forEach(element => {
          element.hidden = true;
        });
      });

      page.hidden = false;
      await loadSettings();
      ensurePageCustomizationPanel();
      activateTab("texts");

      // تجهيز تبويب الخلفيات داخل المركز، مع الإبقاء على الصفحة الحالية.
      if (typeof window.ma3daEnsureBackgroundPanel === "function") {
        window.ma3daEnsureBackgroundPanel();
      }

      page.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } catch (error) {
      console.error("MA3DA control center open:", error);
      if (page) page.hidden = true;

      [
        ".owner-admin-toolbar",
        "#ownerInfoStatus",
        ".owner-admin-metrics",
        ".owner-admin-grid",
        "#ma3daControlCenterEntryWrap"
      ].forEach(selector => {
        dashboard?.querySelectorAll(selector).forEach(element => {
          element.hidden = false;
        });
      });

      alert(error.message || "تعذر فتح مركز التحكم.");
    }
  }

  function closeCenter() {
    const page = $("ma3daControlCenter");
    const dashboard = $("ownerPortalDashboardScreen");

    if (page) page.hidden = true;
    if (!dashboard) return;

    [
      ".owner-admin-toolbar",
      "#ownerInfoStatus",
      ".owner-admin-metrics",
      ".owner-admin-grid",
      "#ma3daControlCenterEntryWrap"
    ].forEach(selector => {
      dashboard.querySelectorAll(selector).forEach(element => {
        element.hidden = false;
      });
    });

    const details = $("ownerAdminDetails");
    if (details) details.hidden = true;

    dashboard.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function initialize() {
    if (initialized) return;

    if (!$("ma3daControlCenterOpen")) return;

    initialized = true;

    $("ma3daControlCenterOpen").addEventListener(
      "click",
      openCenter
    );

    $("ma3daCCBack")?.addEventListener("click", closeCenter);

    document.querySelectorAll("[data-cc-tab]").forEach(button => {
      button.addEventListener("click", () => {
        activateTab(button.dataset.ccTab);
      });
    });

    $("ccSaveSettings")?.addEventListener("click", saveSettings);
    $("ccPreviewTexts")?.addEventListener("click", previewTexts);
    $("ccResetPreview")?.addEventListener("click", resetPreview);
    $("ccCampaignPublish")?.addEventListener("click", publishCampaign);
    $("ccRefreshHistory")?.addEventListener("click", loadHistory);

    [
      "ccPrimaryColor",
      "ccGoldColor",
      "ccFontScale",
      "ccCardRadius"
    ].forEach(id => {
      $(id)?.addEventListener("input", previewDesign);
      $(id)?.addEventListener("change", previewDesign);
    });

    console.log("MA3DA OWNER CONTROL CENTER READY");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }

  window.addEventListener("load", initialize, { once: true });

})();
