/*قراءة آمنة للمستندات المرتبطة بالمستخدم عبر استعلامات محددة بدل قراءة المجموعة كاملة. */
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
دليل تنظيم ملف script.js — آثار
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

/* ATHAR — المظهر الفاتح ثابت، ولا يوجد تبديل داكن/فاتح. */
(function initAtharFixedLightAppearance(){
  document.documentElement.setAttribute('data-theme','light');
  try { localStorage.removeItem('ma3daTheme'); } catch (_) {}
})();


/* ATHAR — نافذة كتابة داخل التطبيق للأسباب والملاحظات المطلوبة */
window.ma3daRequestText = function ma3daRequestText(title, placeholder){
  return new Promise(resolve=>{
    const previous=document.getElementById('atharTextEntryDialog');
    if(previous)previous.remove();
    if(!document.getElementById('atharTextEntryDialogStyles')){
      const style=document.createElement('style');
      style.id='atharTextEntryDialogStyles';
      style.textContent=`
        #atharTextEntryDialog{position:fixed!important;inset:0!important;z-index:2147483647!important;display:grid!important;place-items:center!important;padding:18px!important;background:rgba(0,0,0,.68)!important;isolation:isolate!important;direction:inherit!important}
        #atharTextEntryDialog .athar-entry-card{box-sizing:border-box;width:min(100%,520px);max-height:calc(100dvh - 36px);overflow:auto;padding:22px;border:2px solid var(--athar-identity-accent,#c8a45b);border-radius:20px;background:var(--athar-identity-surface,#fffdf8);color:var(--athar-identity-text,#171717);box-shadow:0 24px 80px #0008}
        #atharTextEntryDialog h3{margin:0 0 14px;font-size:18px;line-height:1.7;color:inherit}
        #atharTextEntryDialog textarea{box-sizing:border-box;display:block;width:100%;min-height:150px;padding:14px;border:1.5px solid var(--athar-identity-accent,#c8a45b);border-radius:13px;background:transparent;color:inherit;font:inherit;line-height:1.7;resize:vertical}
        #atharTextEntryDialog textarea:focus{outline:3px solid color-mix(in srgb,var(--athar-identity-accent,#c8a45b) 35%,transparent);outline-offset:2px}
        #atharTextEntryDialog .athar-entry-actions{display:flex;gap:10px;margin-top:16px}
        #atharTextEntryDialog button{flex:1;min-height:48px;padding:9px 14px;border-radius:12px;border:1px solid var(--athar-identity-accent,#c8a45b);font:inherit;font-weight:800;cursor:pointer}
        #atharTextEntryDialog .athar-entry-submit{background:var(--athar-button-bg,#c8a45b);color:var(--athar-button-text,#171717)}
        #atharTextEntryDialog .athar-entry-cancel{background:transparent;color:inherit}
      `;
      (document.head||document.documentElement).appendChild(style);
    }
    const english=document.documentElement.lang==='en';
    const enTitles={'اكتب سبب رفض التعديل ليظهر لصاحب المعدة:':'Enter the reason for rejecting the equipment edit:','اكتب سبب رفض التعديل':'Enter the reason for rejecting the equipment edit:'};
    const enPlaceholders={'اكتب سبب الرفض وما المطلوب تعديله...':'Explain the reason for rejection and what needs to be corrected...'};
    const wrap=document.createElement('div');wrap.id='atharTextEntryDialog';wrap.setAttribute('role','presentation');
    const card=document.createElement('section');card.className='athar-entry-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');
    const heading=document.createElement('h3');heading.textContent=english?(enTitles[title]||title):title;
    const field=document.createElement('textarea');field.maxLength=2000;field.required=true;field.placeholder=english?(enPlaceholders[placeholder]||placeholder||'Write the reason here...'):(placeholder||'');field.setAttribute('aria-label',heading.textContent);
    const actions=document.createElement('div');actions.className='athar-entry-actions';
    const cancel=document.createElement('button');cancel.type='button';cancel.className='athar-entry-cancel';cancel.textContent=english?'Cancel':'إلغاء';
    const submit=document.createElement('button');submit.type='button';submit.className='athar-entry-submit';submit.textContent=english?'Submit':'إرسال';
    actions.append(cancel,submit);card.append(heading,field,actions);wrap.appendChild(card);(document.body||document.documentElement).appendChild(wrap);
    let finished=false;const done=value=>{if(finished)return;finished=true;document.removeEventListener('keydown',onKey,true);wrap.remove();resolve(value);};
    const onKey=e=>{if(e.key==='Escape'){e.preventDefault();done(null);}else if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();submit.click();}};
    cancel.addEventListener('click',()=>done(null));wrap.addEventListener('click',e=>{if(e.target===wrap)done(null);});
    submit.addEventListener('click',()=>{const value=field.value.trim();if(!value){field.focus();field.setCustomValidity(english?'Please enter the rejection reason.':'هذا الحقل مطلوب.');field.reportValidity();return;}done(value);});
    field.addEventListener('input',()=>field.setCustomValidity(''));document.addEventListener('keydown',onKey,true);requestAnimationFrame(()=>field.focus());
  });
};


/* 00 — بداية الملف: تهيئة عامة مشتركة للتطبيق */
 
const screens =
  document.querySelectorAll(".screen");
 
function showScreen(id){
  // Include dynamically-created screens (such as the available-equipment screen).
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  const screen=document.getElementById(id);
  if(screen){
    screen.classList.add("active");
    window.scrollTo(0,0);
    return true;
  }
  console.error("ATHAR: الشاشة المطلوبة غير موجودة:",id);
  return false;
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
 
function setOrderState(state){
 
  localStorage.setItem("orderState", state);
 
}
 
function getOrderState(){
 
  return (
    localStorage.getItem("orderState") || ""
  );
 
}
 
/* LOAD ORDER */
 
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
  const labels={owner_decision_pending:'طلبك بانتظار موافقة صاحب المعدة',owner_accepted:'وافق صاحب المعدة — بانتظار الحجز',booking_confirmed:'تم تأكيد الحجز التجريبي',owner_arrived:'صاحب المعدة وصل إلى الموقع',otp_verified:'تم التحقق من رمز العميل',working:'بدأ تنفيذ العمل',completed_pending_customer:'انتهى العمل — بانتظار تأكيد العميل',disputed:'الطلب قيد مراجعة الدعم',completed:'اكتمل العمل والتسوية',rated:'اكتمل الطلب والتقييم',rejected:'تم رفض طلب المعدة'};
  const paymentStatus=String(data?.paymentStatus||'');
  const invoiceLabel=labels[status] || '';
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
    try{new Notification('آثار — تحديث طلبك',{body:invoiceLabel+(data?.invoiceNumber?' يمكنك مراجعة الفاتورة من «فواتيري».':''),tag:token});}catch(_){ }
  }
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
        if(await atharHandleSubmittedRegistration(user)) return;
        let pendingRegistration = null;
        try { pendingRegistration = JSON.parse(localStorage.getItem("atharPendingRegistration") || "null"); } catch (_) {}
        if (pendingRegistration && pendingRegistration.uid === user.uid) {
          const customerNameField = document.getElementById("customerNameInput");
          const customerPhoneField = document.getElementById("customerPhoneInput");
          const operatorNameField = document.getElementById("operatorNameInput");
          const operatorPhoneField = document.getElementById("operatorPhoneInput");
          const contractorNameField = document.getElementById("contractorNameInput");
          const contractorPhoneField = document.getElementById("contractorPhoneInput");
          if (customerNameField && !customerNameField.value) customerNameField.value = pendingRegistration.name || user.displayName || "";
          if (customerPhoneField && !customerPhoneField.value) customerPhoneField.value = pendingRegistration.phone || "";
          if (operatorNameField && !operatorNameField.value) operatorNameField.value = pendingRegistration.name || user.displayName || "";
          if (operatorPhoneField && !operatorPhoneField.value) operatorPhoneField.value = pendingRegistration.phone || "";
          if (contractorNameField && !contractorNameField.value) contractorNameField.value = pendingRegistration.name || user.displayName || "";
          if (contractorPhoneField && !contractorPhoneField.value) contractorPhoneField.value = pendingRegistration.phone || "";
        }
 
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
      let pending = null; try { pending = JSON.parse(localStorage.getItem("atharPendingRegistration") || "null"); } catch (_) {}
      if (pending?.uid !== currentUser.uid) pending = null;
      const customerName = data.name || data.fullName || data.displayName || currentUser.displayName || pending?.name || "مستخدم";
      if (nameInput) nameInput.value = data.name || data.fullName || pending?.name || "";
      if (phoneInput) phoneInput.value = data.phone || pending?.phone || "";
      if (cityInput) cityInput.value = data.city || "";
      const greeting = document.getElementById("customerHomeName");
      if (greeting) greeting.textContent = customerName;
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
  const pending=atharGetPendingRegistration();
  if(pending?.newRegistration && pending.uid===user.uid && pending.role==="contractor"){
    const n=document.getElementById("contractorNameInput"),ph=document.getElementById("contractorPhoneInput");
    if(n)n.value=pending.name||user.displayName||""; if(ph)ph.value=pending.phone||"";
    localStorage.setItem("contractorProfile",JSON.stringify({uid:user.uid,name:pending.name||user.displayName||"",phone:pending.phone||"",email:user.email||pending.email||"",role:"contractor"}));
    localStorage.setItem("ma3daRole","contractor");localStorage.setItem("userRole","contractor");
    document.getElementById("contractorCreateProjectBtn")?.click();
    return;
  }
 
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
          const pending=atharGetPendingRegistration();
          if(pending?.newRegistration && pending.uid===user.uid && pending.role==="operator"){
            const n=document.getElementById("operatorNameInput"),ph=document.getElementById("operatorPhoneInput");
            if(n)n.value=pending.name||user.displayName||""; if(ph)ph.value=pending.phone||"";
            const equipmentNext=document.getElementById("saveEquipmentBtn");if(equipmentNext)equipmentNext.textContent="إنشاء الحساب";
            showScreen("addEquipmentScreen");
            return;
          }
 
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
 
/* 02 — التسجيل الجديد والتحقق التجريبي من الجوال */
const submitCreateAccountBtn = document.getElementById("submitCreateAccountBtn");
const backToLoginFromRegisterBtn = document.getElementById("backToLoginFromRegisterBtn");

if (createAccountBtn) {
  createAccountBtn.addEventListener("click", () => {
    const error = document.getElementById("registerAccountError");
    if (error) error.textContent = "";
    showScreen("createAccountScreen");
    if(typeof atharUpdateRegisterRoleLabel==="function") atharUpdateRegisterRoleLabel();
  });
}

if (backToLoginFromRegisterBtn) {
  backToLoginFromRegisterBtn.addEventListener("click", () => {
    showScreen("phoneScreen");
  });
}

const registerAgreementAccepted = document.getElementById("registerAgreementAccepted");
const registerAgreementStatus = document.getElementById("registerAgreementStatus");
const registerAgreementVersion = "ATHAR-TERMS-1.0";
function refreshRegistrationAgreement() {
  const accepted = !!registerAgreementAccepted?.checked;
  if (submitCreateAccountBtn) submitCreateAccountBtn.disabled = !accepted;
  if (registerAgreementStatus) registerAgreementStatus.textContent = accepted
    ? "تم تحديد الموافقة. يمكنك إكمال إنشاء الحساب."
    : "الموافقة مطلوبة لإتمام إنشاء الحساب.";
}
function renderRoleAgreementTerms() {
  const target = document.getElementById("atharRoleTerms");
  if (!target) return;
  const role = selectedRole || localStorage.getItem("selectedRole") || "customer";
  const terms = {
    customer: ["أؤكد أن تفاصيل الطلب والموقع والمدة صحيحة، وأراجع السعر والفاتورة قبل التأكيد، وألتزم بالسداد وشروط الإلغاء المتفق عليها."],
    operator: ["أؤكد صحة بيانات المعدة وتوافرها وامتلاكي أو حيازتي النظامية لحق تأجيرها، وألتزم بالسعر والمدة ومتطلبات التشغيل والسلامة."],
    contractor: ["أؤكد صحة بيانات المشروع وموقعه واحتياجاته، وألتزم بتوثيق التمديدات والتغييرات والوفاء بالاتفاقات المالية ومتطلبات الموقع التي تقع ضمن مسؤوليتي."]
  };
  const label = role === "operator" ? "صاحب المعدة" : role === "contractor" ? "المقاول أو صاحب المشروع" : "العميل";
  target.replaceChildren();
  const heading = document.createElement("h4"); heading.textContent = `أحكام إضافية — ${label}`;
  const paragraph = document.createElement("p"); paragraph.textContent = terms[role]?.[0] || terms.customer[0];
  target.append(heading, paragraph);
}
registerAgreementAccepted?.addEventListener("change", refreshRegistrationAgreement);
if (createAccountBtn) createAccountBtn.addEventListener("click", () => setTimeout(renderRoleAgreementTerms, 0));
refreshRegistrationAgreement();
renderRoleAgreementTerms();

function atharGetPendingRegistration(){
  try { return JSON.parse(localStorage.getItem("atharPendingRegistration") || "null"); }
  catch (_) { return null; }
}
function atharSetPendingRegistration(value){
  try { localStorage.setItem("atharPendingRegistration", JSON.stringify(value)); }
  catch(error){ console.warn("تعذر حفظ متابعة التسجيل محلياً:",error); }
}
function atharIsNewRegistration(user){
  const pending=atharGetPendingRegistration();
  return !!(pending && pending.newRegistration===true && user?.uid && pending.uid===user.uid);
}
function atharShowRegistrationSubmitted(message){
  const note=document.querySelector('#atharRegistrationSubmittedScreen .hero p');
  if(note&&message)note.textContent=message;
  if(typeof showScreen==='function') showScreen('atharRegistrationSubmittedScreen');
  else document.getElementById('atharRegistrationSubmittedScreen')?.classList.add('active');
}
async function atharHandleSubmittedRegistration(user){
  const item=atharGetPendingRegistration();
  if(!item||item.uid!==user?.uid||item.stage!=='submitted'||!['operator','contractor'].includes(item.role))return false;
  try{
    await Promise.resolve(window.ma3daFirebaseReady);
    const snap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'registrationRequests',user.uid));
    if(snap.exists()){
      const data=snap.data()||{};
      if(data.status==='owner_approved'){
        localStorage.removeItem('atharPendingRegistration');
        return false;
      }
      const statusMessage=data.status==='owner_rejected'?'تم رفض التسجيل نهائياً. سبب الرفض: '+(data.ownerReason||'يرجى التواصل مع الدعم.'):
        data.status==='support_rejected'?'رفض موظف الدعم التسجيل مبدئياً. السبب: '+(data.supportReason||'يرجى التواصل مع الدعم.'):
        'تسجيلك مكتمل، وهو الآن ضمن المراجعة المبدئية لدى موظفي الدعم ثم الاعتماد النهائي من مالك التطبيق.';
      atharShowRegistrationSubmitted(statusMessage);
      return true;
    }
  }catch(error){console.warn('تعذر قراءة حالة التسجيل المرسل:',error);}
  atharShowRegistrationSubmitted('تم إرسال تسجيلك. تعذر تحديث الحالة الآن؛ حاول لاحقاً.');
  return true;
}
function atharFileAsDataUrl(file){
  return new Promise((resolve,reject)=>{
    if(!file){resolve("");return;}
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||""));
    reader.onerror=()=>reject(new Error("تعذر قراءة أحد المرفقات."));
    reader.readAsDataURL(file);
  });
}

// بيانات التسجيل المؤقتة: كلمة المرور تبقى في الذاكرة فقط ولا تُحفظ في التخزين المحلي.
let atharRegistrationDraft=null;
async function atharCreateFinalRegistration({role,personalData,equipment=null,project=null}){
  const draft=atharRegistrationDraft;
  if(!draft||draft.role!==role)throw new Error("انتهت بيانات التسجيل المؤقتة. ارجع إلى صفحة التسجيل وابدأ من جديد.");
  let user=window.ma3daAuth?.currentUser||null;
  if(user&&user.email?.toLowerCase()!==draft.email)throw new Error("يوجد حساب آخر مسجل الدخول. سجّل الخروج ثم أعد التسجيل.");
  if(!user){
    user=await window.ma3daCreateAccount(draft.email,draft.password,draft.name,{accepted:true,version:registerAgreementVersion,role,deferSignOut:true});
  }
  if(!user?.uid)throw new Error("تعذر إنشاء الحساب. تحقق من البريد الإلكتروني وحاول مرة أخرى.");
  const now=Date.now();
  const request={
    uid:user.uid,role,registrationType:role==="operator"?"equipment_owner":"project_owner",
    personalData:{...personalData,email:draft.email},
    ...(equipment?{equipment:{...equipment,ownerId:user.uid,operatorId:user.uid}}:{}),
    ...(project?{project:{...project,contractorId:user.uid,ownerId:user.uid}}:{}),
    status:"pending_support",stage:"submitted",submittedAt:now,
    createdAt:draft.createdAt||now,updatedAt:now
  };
  await window.ma3daSetDoc(window.ma3daDoc(window.ma3daDB,"registrationRequests",user.uid),request,{merge:true});
  atharSetPendingRegistration({uid:user.uid,name:draft.name,phone:draft.phone,email:draft.email,role,newRegistration:true,stage:"submitted",createdAt:draft.createdAt||now,submittedAt:now});
  atharRegistrationDraft=null;
  try{await window.ma3daSignOut?.();}catch(signOutError){console.warn("تعذر تسجيل الخروج بعد إرسال طلب التسجيل:",signOutError);}
  atharShowRegistrationSubmitted();
}
function atharUpdateRegisterRoleLabel(){
  const role=selectedRole||localStorage.getItem("selectedRole")||"customer";
  const target=document.getElementById("registerRoleDescription");
  if(target) target.textContent=role==='operator'?'صفة الحساب: صاحب معدة — بعد التالي تنتقل إلى إضافة المعدة.':role==='contractor'?'صفة الحساب: صاحب / مسؤول مشروع — بعد التالي تنتقل إلى إنشاء المشروع.':'صفة الحساب: عميل';
  if(submitCreateAccountBtn) submitCreateAccountBtn.textContent=['operator','contractor'].includes(role)?'التالي':'إنشاء الحساب';
}
atharUpdateRegisterRoleLabel();

if (submitCreateAccountBtn) {
  submitCreateAccountBtn.addEventListener("click", async () => {
    const value = id => (document.getElementById(id)?.value || "").trim();
    const fullName = value("registerFullName");
    const email = value("registerEmail").toLowerCase();
    const phone = value("registerPhone").replace(/[\s()-]/g, "");
    const phoneCode = value("registerPhoneCode");
    const password = document.getElementById("registerPassword")?.value || "";
    const passwordConfirm = document.getElementById("registerPasswordConfirm")?.value || "";
    const error = document.getElementById("registerAccountError");
    const fail = message => { if (error) error.textContent = message; };

    if (error) error.textContent = "";
    if (!registerAgreementAccepted?.checked) {
      fail("يجب قراءة اتفاقية الاستخدام والموافقة عليها قبل إنشاء الحساب.");
      refreshRegistrationAgreement();
      return;
    }
    if (!fullName || !email || !phone || !phoneCode || !password || !passwordConfirm) {
      fail("أكمل جميع الحقول قبل إنشاء الحساب."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fail("أدخل بريدًا إلكترونيًا صحيحًا."); return;
    }
    if (!/^(05\d{8}|\+9665\d{8}|9665\d{8})$/.test(phone)) {
      fail("أدخل رقم جوال سعودي صحيحًا يبدأ بـ 05 أو +9665."); return;
    }
    if (phoneCode !== "1234") {
      fail("رمز التحقق غير صحيح. استخدم الرمز التجريبي 1234."); return;
    }
    if (password.length < 6) {
      fail("كلمة المرور يجب أن تكون 6 أحرف أو أكثر."); return;
    }
    if (password !== passwordConfirm) {
      fail("كلمتا المرور غير متطابقتين."); return;
    }
    if (typeof window.ma3daCreateAccount !== "function") {
      fail("Firebase لم يجهز بعد، أعد تحميل الصفحة."); return;
    }

    const registrationRole = selectedRole || localStorage.getItem("selectedRole") || "customer";
    if (["operator","contractor"].includes(registrationRole)) {
      atharRegistrationDraft={name:fullName,email,phone,password,role:registrationRole,createdAt:Date.now()};
      atharSetPendingRegistration({name:fullName,phone,email,role:registrationRole,newRegistration:true,stage:"personal_data_completed",createdAt:atharRegistrationDraft.createdAt});
      if (registrationRole === "operator") {
        const equipmentNext=document.getElementById("saveEquipmentBtn");if(equipmentNext)equipmentNext.textContent="إنشاء الحساب";
        const operatorName=document.getElementById("operatorNameInput");const operatorPhone=document.getElementById("operatorPhoneInput");
        if(operatorName)operatorName.value=fullName;if(operatorPhone)operatorPhone.value=phone;
        localStorage.setItem("ma3daRole","operator");localStorage.setItem("userRole","operator");
        showScreen("addEquipmentScreen");
      } else {
        const profile={name:fullName,phone,email,role:"contractor"};
        localStorage.setItem("contractorProfile",JSON.stringify(profile));
        localStorage.setItem("ma3daRole","contractor");localStorage.setItem("userRole","contractor");localStorage.setItem("selectedRole","contractor");
        const createProjectButton=document.getElementById("contractorCreateProjectBtn");
        if(createProjectButton)createProjectButton.click();
        else {fail("تعذر فتح نموذج إنشاء المشروع الموجود. تحقق من تحميل صفحة المشاريع.");return;}
      }
      return;
    }

    submitCreateAccountBtn.disabled = true;
    submitCreateAccountBtn.textContent = "جارٍ إنشاء الحساب...";
    try {
      const user = await window.ma3daCreateAccount(email, password, fullName, {
        accepted: true,
        version: registerAgreementVersion,
        role: selectedRole || localStorage.getItem("selectedRole") || "customer"
      });
      if (!user) {
        fail("تعذر إنشاء الحساب. راجع رسالة الخطأ ثم حاول مرة أخرى.");
        return;
      }
      const registrationRole = selectedRole || localStorage.getItem("selectedRole") || "customer";
      const pendingRegistration = {
        uid: user.uid,
        name: fullName,
        phone,
        role: registrationRole,
        email,
        newRegistration: ["operator", "contractor"].includes(registrationRole),
        stage: "personal_data_completed",
        createdAt: Date.now()
      };
      atharSetPendingRegistration(pendingRegistration);

      const loginEmail = document.getElementById("emailInput");
      const loginPassword = document.getElementById("passwordInput");
      if (loginEmail) loginEmail.value = email;
      if (loginPassword) loginPassword.value = password;

      if (registrationRole === "operator") {
        // التالي لصاحب المعدة يفتح نموذج إضافة المعدة الموجود نفسه مباشرة.
        const equipmentNext=document.getElementById("saveEquipmentBtn");if(equipmentNext)equipmentNext.textContent="إنشاء الحساب";
        const operatorName = document.getElementById("operatorNameInput");
        const operatorPhone = document.getElementById("operatorPhoneInput");
        if (operatorName) operatorName.value = fullName;
        if (operatorPhone) operatorPhone.value = phone;
        localStorage.setItem("ma3daRole", "operator");
        localStorage.setItem("userRole", "operator");
        showScreen("addEquipmentScreen");
      } else if (registrationRole === "contractor") {
        // التالي لصاحب المشروع يفتح نموذج إنشاء المشروع الموجود نفسه مباشرة.
        const profile = { uid: user.uid, name: fullName, phone, email, role: "contractor" };
        localStorage.setItem("contractorProfile", JSON.stringify(profile));
        localStorage.setItem("ma3daRole", "contractor");
        localStorage.setItem("userRole", "contractor");
        localStorage.setItem("selectedRole", "contractor");
        const createProjectButton = document.getElementById("contractorCreateProjectBtn");
        if (createProjectButton) {
          createProjectButton.click();
        } else {
          fail("تعذر فتح نموذج إنشاء المشروع الموجود. تحقق من تحميل صفحة المشاريع.");
          return;
        }
      } else {
        alert("تم إنشاء الحساب بنجاح.\n\nأرسلنا رابط توثيق إلى بريدك الإلكتروني. افتح الرسالة واضغط رابط التحقق، ثم سجّل الدخول.\n\nتم قبول رمز الجوال التجريبي 1234.");
        showScreen("phoneScreen");
      }
    } catch (createError) {
      console.error("خطأ في واجهة إنشاء الحساب:", createError);
      fail(createError?.message || "تعذر إنشاء الحساب. حاول مرة أخرى.");
    } finally {
      submitCreateAccountBtn.disabled = !registerAgreementAccepted?.checked;
      const currentRole = selectedRole || localStorage.getItem("selectedRole") || "customer";
      submitCreateAccountBtn.textContent = ["operator", "contractor"].includes(currentRole) ? "التالي" : "إنشاء الحساب";
    }
  });
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
 
  const isNewOperatorRegistration=!!(atharRegistrationDraft?.newRegistration!==false && atharRegistrationDraft?.role==="operator");
  const user = isNewOperatorRegistration ? null : (window.ma3daGetCurrentUser ? await window.ma3daGetCurrentUser() : window.ma3daAuth?.currentUser);
 
  if(!isNewOperatorRegistration&&!user){
    alert("يجب تسجيل الدخول أولاً");
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
      user?.uid || "",
 
    ownerEmail:
      user?.email || atharRegistrationDraft?.email || ""
 
  };
 
  const saveNewRegistrationEquipment=async()=>{
    if(!isNewOperatorRegistration)return false;
    await atharCreateFinalRegistration({
      role:"operator",
      personalData:{name:atharRegistrationDraft.name,phone:atharRegistrationDraft.phone,city,email:atharRegistrationDraft.email},
      equipment:{...equipment,image:equipment.image||""}
    });
    return true;
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
      if(await saveNewRegistrationEquipment()) return;
 
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
          if(await saveNewRegistrationEquipment()) return;
 
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
    if(await atharHandleSubmittedRegistration(user)) return;
 
    if(
      savedRole ===
      "customer"
    ){
 
      showScreen(
        "customerHomeScreen"
      );
 
      return;
 
    }
 
    if(savedRole === "contractor"){
      const pending=atharGetPendingRegistration();
      if(pending?.newRegistration && pending.uid===user.uid && pending.role==="contractor"){
        const n=document.getElementById("contractorNameInput"),ph=document.getElementById("contractorPhoneInput");
        if(n)n.value=pending.name||user.displayName||""; if(ph)ph.value=pending.phone||"";
        localStorage.setItem("contractorProfile",JSON.stringify({uid:user.uid,name:pending.name||user.displayName||"",phone:pending.phone||"",email:user.email||pending.email||"",role:"contractor"}));
        localStorage.setItem("ma3daRole","contractor");localStorage.setItem("userRole","contractor");
        document.getElementById("contractorCreateProjectBtn")?.click();
        return;
      }
      if(typeof window.openContractorHome==="function"){await window.openContractorHome();return;}
    }

    if(
      savedRole ===
      "operator"
    ){
      const pending=atharGetPendingRegistration();
      if(pending?.newRegistration && pending.uid===user.uid && pending.role==="operator"){
        const n=document.getElementById("operatorNameInput"),ph=document.getElementById("operatorPhoneInput");
        if(n)n.value=pending.name||user.displayName||""; if(ph)ph.value=pending.phone||"";
        const equipmentNext=document.getElementById("saveEquipmentBtn");if(equipmentNext)equipmentNext.textContent="إنشاء الحساب";
        showScreen("addEquipmentScreen");
        return;
      }
 
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
 
/* 01 — الصفحات التعريفية: مقدمة آثار والتنقل بين الشرائح */
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
        const homeName = document.getElementById("customerHomeName");
        if (homeName) homeName.textContent = name || user.displayName || "مستخدم";
        try { const pending = JSON.parse(localStorage.getItem("atharPendingRegistration") || "null"); if (pending?.uid === user.uid) localStorage.removeItem("atharPendingRegistration"); } catch (_) {}
 
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
    const screenByStatus={owner_decision_pending:'searchingScreen',owner_accepted:'atharBookingScreen',booking_confirmed:'matchedScreen',owner_arrived:'arrivedCustomerScreen',otp_verified:'arrivedCustomerScreen',working:'workingScreen',completed_pending_customer:'completedScreen',disputed:'completedScreen',completed:'completedScreen',rated:'thankYouScreen',rejected:'roleScreen',searching:'searchingScreen',accepted:'matchedScreen',arrived:'arrivedCustomerScreen'};
    const target=screenByStatus[String(data.status||'')]||'matchedScreen';
    if(target==='atharBookingScreen'){const details=document.getElementById('atharBookingDetails');if(details)details.textContent=`${data.orderNumber||''} · ${data.equipment||'معدة'} · ${data.duration||''} · ${Number(data.reservedAmount||data.price||0).toLocaleString('ar-SA')} ريال`;}
    if(target==='arrivedCustomerScreen'){const panel=document.getElementById('atharCustomerOtpArrivalPanel');if(panel){panel.hidden=false;const code=document.getElementById('atharCustomerOtpArrival');if(code)code.textContent=data.otpCodeCustomer||'------';}

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
    customerOrdersRealtimeUnsubscribe=window.ma3daOnSnapshot(window.ma3daQuery(window.ma3daCollection(window.ma3daDB,'requests'),window.ma3daWhere('customerId','==',user.uid)),snapshot=>{
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
 
/* LANGUAGE — اختيار اللغة يتم من رمزي 🌐 و ع في شاشة اختيار الدور. */
const arabicLanguageBtn = document.getElementById("arabicLanguageBtn");
const englishLanguageBtn = document.getElementById("englishLanguageBtn");

/* ATHAR — ترجمة واجهة التطبيق: النصوص الثابتة والديناميكية الشائعة */
const atharEnglishDictionary={
  "بوابة موظفي الدعم":"Support Staff Portal","أنا عميل":"I am a Customer","أنا صاحب معدة / مشغل":"I am an Equipment Owner / Operator","أنا مقاول أو صاحب مشروع":"I am a Contractor / Project Owner","بوابة أصحاب المعدات":"Equipment Owners Portal","بوابة أصحاب ومسؤولي المشاريع":"Contractors & Projects Portal","مسؤوليتنا":"Our Responsibility","حقوقنا":"Our Responsibility","رؤيتنا":"Our Vision","من نحن":"About Us","تواصل معنا":"Contact Us","آثار ATHAR":"ATHAR","جميع الحقوق محفوظة لآثار ATHAR – 2026":"All rights reserved to ATHAR – 2026","إغلاق":"Close","إلغاء":"Cancel","حفظ":"Save","حفظ التعديل":"Save Changes","حفظ الملاحظة":"Save Note","تعديل الملاحظة":"Edit Note","إرسال":"Send","إرسال الرد":"Send Reply","رجوع":"Back","الرجوع":"Back","التالي":"Next","ابدأ الآن":"Get Started","تسجيل الدخول":"Log In","إنشاء حساب جديد":"Create New Account","تسجيل جديد":"Sign Up","البريد الإلكتروني":"Email Address","كلمة المرور":"Password","تأكيد كلمة المرور":"Confirm Password","الاسم الكامل":"Full Name","رقم الجوال":"Mobile Number","رقم الهاتف":"Phone Number","نسيت كلمة المرور؟":"Forgot Password?","إرسال رابط التغيير":"Send Reset Link","اللغة":"Language","اختر لغة التطبيق":"Choose App Language","العربية":"Arabic","استخدام التطبيق باللغة العربية":"Use the app in Arabic","Use the app in English":"Use the app in English","المظهر":"Appearance","اختر مظهر التطبيق المناسب لك":"Choose your preferred app appearance","تلقائي":"System Default","استخدام مظهر الجهاز":"Use device appearance","فاتح":"Light","المظهر الفاتح":"Light appearance","داكن":"Dark","المظهر الداكن":"Dark appearance","الإعدادات":"Settings","الدعم الفني":"Technical Support","طلب معدة":"Request Equipment","الطلبات الحالية":"Current Requests","الطلبات السابقة":"Previous Requests","المشاريع":"Projects","الرئيسية":"Home","حسابي":"My Account","تسجيل الخروج":"Log Out","حفظ الملاحظة":"Save Note","ملاحظة اليوم":"Today's Note","اكتب ملاحظاتك عن أداء العمل أو التطبيق...":"Write your notes about work or app performance...","اكتب الملاحظة أولًا.":"Please enter a note first.","تم حفظ الملاحظة.":"Note saved.","تم تعديل الملاحظة وحفظها.":"Note updated and saved.","تعذر حفظ الملاحظة.":"Could not save the note.","لا توجد ملاحظات محفوظة بعد.":"No saved notes yet.","التصعيدات الواردة من موظفي الدعم":"Escalations from Support Staff","سبب التصعيد":"Escalation Reason","ملاحظة مالك التطبيق":"App Owner Note","اكتب الإجراء أو الملاحظة":"Enter an action or note","تعديل التعديل":"Edit","تم حفظ ملاحظة التصعيد.":"Escalation note saved.","تعذر حفظ الملاحظة. تحقق من صلاحيات Firebase.":"Could not save the note. Check Firebase permissions.","اشرح لمالك التطبيق سبب التصعيد وما الذي تعذر حله:":"Explain why you are escalating this issue to the app owner and what could not be resolved:","اكتب سبب التصعيد بالتفصيل...":"Describe the escalation reason in detail...","اكتب سبب رفض التعديل ليظهر لصاحب المعدة:":"Enter the reason for rejecting the equipment owner's changes:","اكتب سبب الرفض وما المطلوب تعديله...":"Explain why the changes were rejected and what needs to be corrected...","سبب الرفض مطلوب حتى يعرف صاحب المعدة ما الذي يحتاج إلى تصحيح.":"A rejection reason is required so the equipment owner knows what to correct.","تم رفض التعديل وإرسال سبب الرفض لصاحب المعدة.":"Changes rejected. The reason was sent to the equipment owner.","تم تصعيد الشكوى إلى مالك التطبيق.":"The complaint has been escalated to the app owner.","تم إرسال التصعيد إلى مالك التطبيق.":"The escalation has been sent to the app owner.","الملاحظات اليومية لمالك التطبيق":"App Owner Daily Notes","حالة الطلب":"Request Status","الحالة":"Status","المبلغ":"Amount","المدة":"Duration","الموقع":"Location","نوع المعدة":"Equipment Type","السعر":"Price","الاسم":"Name","المدينة":"City","التفاصيل":"Details","الوصف":"Description","المرفقات":"Attachments","رقم الشكوى":"Ticket Number","الشكاوى":"Complaints","الشكاوى السابقة":"Previous Complaints","الشكاوى الحالية":"Open Complaints","موظف الدعم":"Support Agent","مالك التطبيق":"App Owner","مفتوحة":"Open","مغلقة":"Closed","قيد المتابعة":"In Progress","تم الحل":"Resolved","جارٍ التحميل...":"Loading...","جارٍ تحميل الملاحظات...":"Loading notes...","لا توجد بيانات":"No data available","لا توجد نتائج":"No results found","لم يتم العثور على نتائج":"No results found","تأكيد":"Confirm","حذف":"Delete","تعديل":"Edit","إضافة":"Add","اعتماد":"Approve","رفض":"Reject","سبب الرفض":"Rejection Reason","سبب التصعيد":"Escalation Reason","تم بنجاح":"Completed successfully","حدث خطأ":"An error occurred","حاول مرة أخرى":"Please try again","المعلومات الشخصية":"Personal Information","تغيير كلمة المرور":"Change Password","تغيير البريد الإلكتروني":"Change Email","تغيير رقم الجوال":"Change Mobile Number","المساعدة":"Help","اتصل بنا":"Contact Us","الأسئلة الشائعة":"Frequently Asked Questions","الفواتير":"Invoices","المدفوعات":"Payments","التقييمات":"Ratings","الدخل":"Income","المعدات":"Equipment","صاحب المعدة":"Equipment Owner","المقاول":"Contractor","العميل":"Customer","مشروع جديد":"New Project","إنشاء مشروع":"Create Project","المشاريع الحالية":"Current Projects","المشاريع السابقة":"Previous Projects","عرض الموقع على الخريطة":"View Location on Map","لا توجد مشاريع حالية":"No current projects","لا توجد مشاريع سابقة":"No previous projects","حفظ البيانات":"Save Data","تحديث":"Refresh","بحث":"Search","اكتب هنا":"Type here","اختر":"Select","اختر نوع المعدة":"Select equipment type","اختر مدة العمل":"Select work duration","اكتب موقع العمل":"Enter work location","لا توجد ملاحظات":"No notes","المظهر التلقائي":"Automatic appearance","تم اختيار المظهر الداكن":"Dark appearance selected","تم اختيار المظهر الفاتح":"Light appearance selected","تم اختيار المظهر التلقائي":"System appearance selected","تم اختيار اللغة العربية":"Arabic language selected","تم اختيار اللغة الإنجليزية":"English language selected","تم إرسال الرد لصاحب الشكوى.":"Your reply has been sent to the complainant.","اكتب الرد أولًا.":"Please enter a reply first.","هذه الشكوى مغلقة.":"This complaint is closed.","لا يوجد طلب حالي.":"There is no current request.","الطلب غير موجود.":"Request not found.","لا توجد معدات مسجلة":"No equipment registered","لا توجد طلبات":"No requests","المبلغ المستحق":"Amount Due","المجموع":"Total","المتبقي":"Remaining","ريال":"SAR","ساعة":"hour","ساعات":"hours","يوم كامل":"Full day","بدون مشغل":"Without operator","مع مشغل":"With operator","قبول الطلب":"Accept Request","رفض الطلب":"Reject Request","المعدة في الطريق إليك":"The equipment is on its way","المعدة وصلت إلى موقعك":"The equipment has arrived at your location","بدأت المعدة العمل":"The equipment has started working","انتهى العمل بالمعدة":"Work with the equipment has been completed","تم رفض طلبك من صاحب المعدة":"Your request was rejected by the equipment owner","الرؤية":"Vision","مسؤوليتنا":"Our Responsibility","نحن في آثار":"At ATHAR","يمكنك التواصل مع فريق آثار عبر قنوات الدعم المعتمدة داخل التطبيق.":"You can contact the ATHAR team through the support channels available in the app.","آثار منصة رقمية تربط العملاء بأصحاب المعدات والمشغلين وأصحاب المشاريع في مكان واحد.":"ATHAR is a digital platform connecting customers, equipment owners, operators, and project owners in one place.","نسعى في آثار إلى تسهيل الوصول إلى الخدمات والمعدات ودعم إنجاز المشاريع بكفاءة وثقة.":"ATHAR aims to make services and equipment easier to access and help projects move forward efficiently and reliably."
};
Object.assign(atharEnglishDictionary,{
"أهلاً بك في آثار":"Welcome to ATHAR","معداتك الثقيلة":"Your Heavy Equipment","أقرب وأسهل مما تتوقع":"Closer and Easier Than You Expect","اطلب المعدة المناسبة لمشروعك":"Request the Right Equipment for Your Project","وتابع طلبك بكل سهولة":"Track Your Request Easily","ما هي آثار؟":"What is ATHAR?","منصة تربطك بأصحاب المعدات الثقيلة والمشغلين، وتساعدك في طلب المعدة التي تحتاجها بسهولة.":"A platform connecting you with heavy equipment owners and operators, making it easy to request the equipment you need.","لماذا آثار؟":"Why ATHAR?","لأننا نسهّل عليك الوصول إلى المعدات الثقيلة وأصحابها في مكان واحد وبطريقة أسرع وأسهل.":"We make it faster and easier to find heavy equipment and its owners in one place.","كيف تعمل آثار؟":"How Does ATHAR Work?","اختر نوع المعدة التي تحتاجها":"Choose the equipment you need","أرسل طلبك":"Submit your request","وتواصل مع المشغل المناسب":"Connect with the right operator","ابدأ الآن 🚜":"Get Started 🚜","مرحبًا بك في آثار":"Welcome to ATHAR","اختر طريقة استخدامك للتطبيق":"Choose how you want to use the app","تسجيل الدخول للمتابعة":"Log in to continue","📧 البريد الإلكتروني":"📧 Email address","🔐 كلمة المرور":"🔐 Password","← الرجوع":"← Back","أنشئ حسابك الآن":"Create your account","ابدأ رحلتك واترك أثرك معنا":"Start your journey and leave your mark with us","سنرسل إليك رابط توثيق البريد الإلكتروني.":"We will send you an email verification link.","رمز التحقق":"Verification code","رمز تجريبي مؤقت:":"Temporary test code:","— لا يتم إرسال SMS فعلي في هذه المرحلة.":"— No actual SMS is sent at this stage.","اتفاقية استخدام آثار ATHAR":"ATHAR Terms of Use","يرجى قراءة الاتفاقية كاملة والموافقة عليها قبل إنشاء الحساب.":"Please read and accept the full agreement before creating your account.","قراءة اتفاقية الاستخدام كاملة":"Read the full terms of use","الموافقة مطلوبة لإتمام إنشاء الحساب.":"Your agreement is required to complete account creation.","لديك حساب؟ تسجيل الدخول":"Already have an account? Log in","أكمل بياناتك":"Complete your details","أدخل بياناتك لإكمال حسابك في آثار":"Enter your details to complete your ATHAR account","👤 الاسم":"👤 Name","📱 رقم الجوال":"📱 Mobile number","📍 المدينة":"📍 City","حفظ ومتابعة":"Save and Continue","أدخل رمز التحقق":"Enter verification code","← تغيير رقم الجوال":"← Change mobile number","أضف معدتك":"Add Your Equipment","أدخل بيانات المعدة لتبدأ استقبال الطلبات":"Enter your equipment details to start receiving requests","🚜 نوع المعدة":"🚜 Equipment type","اختر نوع المعدة":"Select equipment type","بوكلين":"Excavator","شيول":"Wheel Loader","قلاب":"Dump Truck","كرين":"Crane","حفار":"Backhoe","بلدوزر":"Bulldozer","جريدر":"Motor Grader","مدحلة":"Road Roller","رافعة شوكية":"Forklift","رافعة تلسكوبية":"Telehandler","لودر":"Loader","حفار صغير":"Mini Excavator","سطحة":"Flatbed Truck","ناقلة معدات":"Equipment Transporter","وايت ماء":"Water Tanker","مضخة خرسانة":"Concrete Pump","ماكينة فرش أسفلت":"Asphalt Paver","أخرى":"Other","✏️ اذكر نوع المعدة":"✏️ Specify equipment type","🏷️ الماركة / الموديل":"🏷️ Brand / Model","📷 صورة المعدة":"📷 Equipment photo","📅 سنة الصنع":"📅 Year of manufacture","🟢 حالة المعدة":"🟢 Equipment status","متاحة الآن":"Available now","غير متاحة":"Unavailable","💰 سعر الإيجار بالساعة":"💰 Hourly rental price","السعر بالريال السعودي لكل ساعة":"Price in Saudi Riyals per hour","حفظ المعدة":"Save Equipment","توثيق حسابك":"Verify Your Account","أكمل توثيق حسابك لتتمكن من استقبال الطلبات":"Complete account verification to receive requests","حالة التوثيق":"Verification status","لم يتم تقديم طلب التوثيق":"No verification request submitted","بيانات صاحب المعدة":"Equipment owner details","المستندات المطلوبة":"Required documents","🪪 صورة الهوية":"🪪 ID photo","📄 مستند ملكية المعدة":"📄 Equipment ownership document","صور المعدة":"Equipment photos","📷 صورة المعدة من الأمام":"📷 Front view of equipment","📷 صورة المعدة من الجانب":"📷 Side view of equipment","📷 صورة إضافية للمعدة":"📷 Additional equipment photo","إرسال طلب التوثيق":"Submit verification request","تحتاج معدة؟":"Need Equipment?","اطلب معدتك بسهولة وسرعة":"Request equipment easily and quickly","طلب معدة جديدة":"New Equipment Request","الطلبات":"Requests","تابع طلباتك الحالية":"Track your current requests","عرض سجل طلباتك السابقة":"View your previous request history","فواتيري ومدفوعاتي":"My Invoices & Payments","راجع فواتيرك وحالة السداد":"Review your invoices and payment status","إدارة حسابك وتفضيلات التطبيق":"Manage your account and app preferences","نحن هنا لمساعدتك":"We are here to help","تغطية واسعة":"Wide Coverage","في جميع المدن":"Across all cities","توصيل سريع":"Fast Delivery","في الوقت المحدد":"On Time","معدات موثوقة":"Reliable Equipment","من مالكيها مباشرة":"Directly from Owners","أدخل بياناتك لإكمال حساب صاحب المعدة":"Enter your details to complete your equipment owner account","بعزم الرجال… نبني وطناً ونصنع إنجازاً.":"With determination, we build a nation and achieve great things.","أنت متصل":"You are Online","ستصلك طلبات العملاء القريبة منك":"Nearby customer requests will reach you","الطلبات الجديدة":"New Requests","طلبات العملاء التي تنتظر قبولك":"Customer requests awaiting your acceptance","الطلبات الحالية والسابقة في صفحة واحدة":"Current and previous requests in one place","طلبات المشاريع":"Project Requests","الطلبات الحالية والسابقة لمسؤولي المشاريع، بشكل مستقل عن طلبات العملاء":"Current and previous project-owner requests, separate from customer requests","معدتي":"My Equipment","عرض المعدة":"View Equipment","الموديل":"Model","السعر بالساعة":"Hourly Rate","حسابي":"My Account","متابعة دخلك من الأعمال":"Track your work income","فواتير التأجير ومستحقاتي":"Rental Invoices & My Dues","إصدار فاتورة لمسؤول المشروع ومتابعة مستحقات معداتي":"Issue invoices to project owners and track equipment payments","تقييمات العملاء لك":"Customer Ratings","إدارة بيانات حسابك":"Manage your account details","🚪 تسجيل الخروج":"🚪 Log Out","عرض وإدارة بيانات معدتك":"View and manage your equipment details","حالة المعدة":"Equipment status","✏️ تعديل بيانات المعدة":"✏️ Edit Equipment Details","اختر نوع الطلب لعرض طلبات العملاء أو طلبات المشاريع الموجهة لمعدتك":"Choose a request type to view customer or project requests for your equipment","🚜 طلبات العملاء":"🚜 Customer Requests","🏗️ طلبات المشاريع":"🏗️ Project Requests","لم يتم التحديث بعد":"Not updated yet","⟳ تحديث الطلبات":"⟳ Refresh Requests","جاري تحميل طلبات العملاء...":"Loading customer requests...","جاري تحميل طلبات المشاريع...":"Loading project requests...","تفاصيل الطلب":"Request Details","طلب مقبول · جاهز للتنفيذ":"Request Accepted · Ready to Start","اسم المعدة":"Equipment Name","اسم العميل المسجل":"Registered Customer Name","المدة":"Duration","المبلغ":"Amount","موقع العميل":"Customer Location","📍 موقع العميل — فتح Google Maps":"📍 Customer Location — Open Google Maps","💬 المحادثة":"💬 Chat","📞 الاتصال":"📞 Call","جاري تحميل الحالة...":"Loading status...","📍 التحقق المكاني من موقعي":"📍 Verify My Location","يجب التحقق من موقعك الفعلي قبل تأكيد الوصول.":"Verify your actual location before confirming arrival.","🚜 وصلت إلى موقع العميل":"🚜 Arrived at Customer Location","▶️ بدأت العمل":"▶️ Start Work","انتهى العمل":"Work Completed","تابع طلبات العملاء الحالية وسجل الطلبات السابقة من صفحة واحدة":"Track current customer requests and previous requests from one page","جاري تحميل الطلبات الحالية...":"Loading current requests...","جاري تحميل الطلبات السابقة...":"Loading previous requests...","إدارة طلبات مسؤولي المشاريع بشكل مستقل عن طلبات العملاء":"Manage project-owner requests separately from customer requests","ملخص دخلك من أعمالك في آثار":"Your ATHAR Work Income Summary","إجمالي الدخل":"Total Income","أعمال مكتملة":"Completed Jobs","إجمالي الساعات":"Total Hours","تقييمات العملاء لأعمالك":"Customer Ratings for Your Work","تعديل رقم الجوال":"Edit Mobile Number","تعديل البريد الإلكتروني":"Edit Email Address","كيف يمكننا مساعدتك؟":"How can we help you?","إذا واجهت مشكلة في الطلبات أو الحساب أو المعدة، تواصل معنا وسنساعدك.":"If you have an issue with requests, your account, or equipment, contact us and we will help.","💬 التواصل مع الدعم":"💬 Contact Support","إرسال طلب إلى فريق الدعم":"Send a Request to Support","مشكلة في المعدة":"Equipment Issue","مشكلة في الطلبات":"Request Issue","مشكلة في الحساب":"Account Issue","استفسار":"Inquiry","بلاغ":"Report","تفاصيل المشكلة":"Issue Details","إرسال إلى الدعم":"Send to Support","جاري تحميل الطلبات...":"Loading requests..."
});

/* ATHAR — استكمال قاموس الواجهة الإنجليزية */
Object.assign(atharEnglishDictionary, {"الصفحة الرئيسية":"Home Page","الرئيسية":"Home","بوابة العميل":"Customer Portal","بوابة صاحب المعدة":"Equipment Owner Portal","بوابة المشاريع":"Projects Portal","طلب معدة":"Request Equipment","طلباتي":"My Requests","طلباتي الحالية":"My Current Requests","طلباتي السابقة":"My Previous Requests","طلبات العملاء":"Customer Requests","طلبات المعدات":"Equipment Requests","طلبات المشاريع":"Project Requests","إضافة معدة":"Add Equipment","إضافة معدة جديدة":"Add New Equipment","تعديل المعدة":"Edit Equipment","تعديل بيانات المعدة":"Edit Equipment Details","الموافقة على التعديل":"Approve Edit","رفض التعديل":"Reject Edit","اعتماد المعدة":"Approve Equipment","رفض الإضافة":"Reject Addition","مراجعة التعديلات":"Review Edits","التعديلات المقترحة":"Proposed Changes","بيانات المعدة":"Equipment Details","نوع المعدة":"Equipment Type","الموديل":"Model","سنة الصنع":"Year of Manufacture","المدينة":"City","رقم المعدة/اللوحة":"Equipment / Plate Number","السعر بالساعة":"Hourly Rate","التوفر":"Availability","متاحة":"Available","غير متاحة":"Unavailable","تم إرفاق صورة":"Image Attached","لم تُرفق صورة":"No Image Attached","صاحب المعدة":"Equipment Owner","صاحب المعدة:":"Equipment Owner:","مراجعة تعديل بيانات معدة موجودة.":"Review changes to an existing equipment listing.","طلب إضافة معدة جديدة؛ لن تصبح معتمدة قبل موافقة الدعم.":"New equipment submission; it will not be approved until support reviews it.","لا توجد إضافات أو تعديلات معدات بانتظار المراجعة.":"There are no equipment submissions or edits awaiting review.","تعذر تحميل التعديلات. تحقق من صلاحيات قراءة equipment في Firebase.":"Could not load edits. Check Firebase equipment read permissions.","المعدة غير موجودة.":"Equipment not found.","هذا التعديل لم يعد معلّقًا. حدّث القائمة.":"This edit is no longer pending. Refresh the list.","سبب الرفض مطلوب حتى يعرف صاحب المعدة ما الذي يحتاج إلى تصحيح.":"A rejection reason is required so the equipment owner knows what to correct.","تمت الموافقة على التعديل وتحديث بيانات المعدة المعتمدة.":"The edit was approved and the equipment details were updated.","تم رفض التعديل وإرسال سبب الرفض لصاحب المعدة.":"The edit was rejected and the reason was sent to the equipment owner.","اكتب سبب رفض التعديل ليظهر لصاحب المعدة:":"Enter the reason for rejecting the equipment edit:","اكتب سبب الرفض وما المطلوب تعديله...":"Explain the rejection reason and what needs to be corrected...","إلغاء":"Cancel","إرسال":"Submit","إرسال الطلب":"Submit Request","حفظ":"Save","حفظ التعديلات":"Save Changes","حفظ الملاحظة":"Save Note","تعديل الملاحظة":"Edit Note","حفظ التعديل":"Save Edit","حذف":"Delete","إغلاق":"Close","رجوع":"Back","تحديث":"Refresh","بحث":"Search","ابحث":"Search","اختر":"Select","اختر نوع المعدة":"Select equipment type","اختر المدينة":"Select city","اختر المدة":"Select duration","ملاحظات":"Notes","الملاحظات":"Notes","التفاصيل":"Details","تفاصيل الطلب":"Request Details","تفاصيل المعدة":"Equipment Details","تفاصيل المشروع":"Project Details","تفاصيل المشكلة":"Issue Details","جارٍ تحميل التعديلات المعلّقة...":"Loading pending edits...","جارٍ تحميل الطلبات...":"Loading requests...","جاري تحميل الطلبات...":"Loading requests...","جارٍ التحميل...":"Loading...","جاري التحميل...":"Loading...","جارٍ الحفظ...":"Saving...","جارٍ الإرسال...":"Sending...","جاري الإرسال...":"Sending...","تم الحفظ بنجاح":"Saved successfully","تم الحفظ بنجاح ✅":"Saved successfully ✅","تم إرسال الطلب بنجاح":"Request submitted successfully","تعذر الحفظ":"Could not save","تعذر الإرسال":"Could not send","حدث خطأ غير متوقع.":"An unexpected error occurred.","حاول مرة أخرى.":"Please try again.","يجب تسجيل الدخول أولًا.":"You must log in first.","يجب تسجيل الدخول أولًا":"You must log in first.","غير محدد":"Not specified","غير معروف":"Unknown","لا توجد بيانات":"No data available","لا توجد نتائج":"No results found","لا توجد طلبات":"No requests","لا توجد ملاحظات.":"No notes.","لا توجد ملاحظات":"No notes","لا توجد بيانات إضافية.":"No additional details.","أكمل جميع البيانات أولًا":"Please complete all fields first.","أكمل جميع الحقول قبل إنشاء الحساب.":"Complete all fields before creating an account.","البريد الإلكتروني غير صحيح":"Invalid email address","رقم الهاتف غير صحيح":"Invalid phone number","كلمة المرور":"Password","تأكيد كلمة المرور":"Confirm Password","الاسم الكامل":"Full Name","رقم الجوال":"Mobile Number","البريد الإلكتروني":"Email Address","نسيت كلمة المرور؟":"Forgot Password?","تسجيل الدخول":"Log In","تسجيل الخروج":"Log Out","إنشاء حساب جديد":"Create New Account","إنشاء الحساب":"Create Account","تسجيل جديد":"Sign Up","ابدأ الآن":"Get Started","عميل":"Customer","صاحب معدة":"Equipment Owner","مشغل":"Operator","مقاول":"Contractor","صاحب مشروع":"Project Owner","المشاريع":"Projects","العملاء":"Customers","المعدات":"Equipment","الحساب":"Account","حسابي":"My Account","الإعدادات":"Settings","الدعم الفني":"Technical Support","مركز الدعم":"Support Center","بوابة موظفي الدعم":"Support Staff Portal","موظف الدعم":"Support Agent","المستخدم":"User","المستخدم الحالي":"Current User","رقم الطلب":"Request Number","رقم الشكوى":"Ticket Number","رقم المعدة":"Equipment Number","الموقع":"Location","الموقع:":"Location:","المدة":"Duration","المدة:":"Duration:","المبلغ":"Amount","المبلغ:":"Amount:","المبلغ المستحق:":"Amount Due:","الحالة":"Status","الحالة:":"Status:","تاريخ الإنشاء":"Created At","تاريخ الطلب":"Request Date","تاريخ التحديث":"Updated At","الوقت":"Time","السعر":"Price","الإجمالي":"Total","الكمية":"Quantity","الوصف":"Description","الاسم":"Name","رقم التواصل":"Contact Number","اتصل":"Call","عرض التفاصيل":"View Details","فتح الموقع":"Open Location","تحديد موقعي":"Set My Location","تحديد موقعي بدقة":"Set My Precise Location","الموقع الحالي":"Current Location","الموقع المسجل":"Saved Location","جاري البحث عن معدة":"Searching for equipment","تم قبول الطلب":"Request Accepted","المعدة وصلت":"Equipment Arrived","جاري العمل":"Work in Progress","مكتمل":"Completed","مرفوض":"Rejected","تم رفض الطلب":"Request Rejected","تم قبول الطلب بنجاح 🚜":"Request accepted successfully 🚜","تعذر قبول الطلب في Firebase":"Could not accept the request in Firebase","تعذر رفض الطلب في Firebase":"Could not reject the request in Firebase","تم رفض طلب المعدة":"The equipment request was rejected","لا توجد طلبات عملاء":"There are no customer requests","لا يوجد طلب searching حالي":"There is no active searching request","ملخص دخلك من أعمالك في آثار":"Your ATHAR Work Income Summary","إجمالي الدخل":"Total Income","أعمال مكتملة":"Completed Jobs","إجمالي الساعات":"Total Hours","تقييمات العملاء لأعمالك":"Customer Ratings for Your Work","التقييم":"Rating","التقييمات":"Ratings","تقييم مقدم الشكوى:":"Requester Rating:","الموظف:":"Staff Member:","لا توجد تقييمات مسجلة حتى الآن.":"No ratings have been recorded yet.","تعذر تحميل التقييمات. تحقق من صلاحيات قراءة الشكاوى.":"Could not load ratings. Check support ticket read permissions.","كيف يمكننا مساعدتك؟":"How can we help you?","إذا واجهت مشكلة في الطلبات أو الحساب أو المعدة، تواصل معنا وسنساعدك.":"If you have an issue with requests, your account, or equipment, contact us and we will help.","التواصل مع الدعم":"Contact Support","إرسال طلب إلى فريق الدعم":"Send a Request to Support","مشكلة في المعدة":"Equipment Issue","مشكلة في الطلبات":"Request Issue","مشكلة في الحساب":"Account Issue","استفسار":"Inquiry","بلاغ":"Report","إرسال إلى الدعم":"Send to Support","افتح شكوى من القائمة أولًا قبل التصعيد.":"Open a ticket from the list before escalating.","اشرح لمالك التطبيق سبب التصعيد وما الذي تعذر حله:":"Explain to the platform owner why you are escalating and what could not be resolved:","اكتب سبب التصعيد بالتفصيل...":"Describe the reason for escalation in detail...","سبب التصعيد:":"Escalation Reason:","تم إرسال الرد لصاحب الشكوى.":"Your reply has been sent to the requester.","تم إغلاق الشكوى ونقلها إلى الشكاوى السابقة.":"The ticket has been closed and moved to previous tickets.","هذه الشكوى مغلقة.":"This ticket is closed.","اكتب الرد أولًا.":"Please write a reply first.","إغلاق الشكوى":"Close Ticket","إرسال الرد":"Send Reply","الردود":"Replies","الشكاوى الحالية":"Current Tickets","الشكاوى السابقة":"Previous Tickets","لا توجد شكاوى":"No tickets","فاتورتي":"My Invoices","فواتيري":"My Invoices","فواتيري والمدفوعات":"My Invoices & Payments","الفواتير":"Invoices","المدفوعات":"Payments","السداد":"Payment","إثبات السداد":"Payment Proof","المبلغ المدفوع":"Amount Paid","المبلغ المتبقي":"Remaining Amount","تأكيد السداد":"Confirm Payment","تم تأكيد السداد":"Payment Confirmed","تم تسجيل السداد وبانتظار التأكيد":"Payment submitted and awaiting confirmation","بوابة الدفع الإلكتروني غير مربوطة بالمشروع بعد. لم يتم خصم أي مبلغ ولم يُسجّل السداد.":"The online payment gateway is not connected yet. No payment has been charged or recorded.","تعذر بدء عملية السداد. لم يتم تأكيد الدفع.":"Could not start payment. Payment has not been confirmed.","مسؤوليتنا":"Our Responsibility","رؤيتنا":"Our Vision","من نحن":"About Us","تواصل معنا":"Contact Us","ثقتكم أمانة":"Your Trust Is Our Responsibility","أثرٌ يواكب طموح وطن":"An Impact That Matches Our Nation’s Ambition","آثار ATHAR — منصة تجمع أطراف الإنجاز":"ATHAR — A Platform Connecting the People Behind Every Achievement","نسعد بتواصلكم":"We Welcome Your Feedback","شعارنا:":"Our Motto:","آثار… نبني اليوم ما يبقى غدًا.":"ATHAR… Building Today What Lasts Tomorrow.","جميع الحقوق محفوظة لآثار ATHAR – 2026":"All rights reserved to ATHAR – 2026","تم اختيار اللغة العربية 🇸🇦":"Arabic language selected 🇸🇦","English language selected 🇬🇧":"English language selected 🇬🇧","تم اختيار المظهر التلقائي 📱":"System appearance selected 📱","تم اختيار المظهر الفاتح ☀️":"Light appearance selected ☀️","تم اختيار المظهر الداكن 🌙":"Dark appearance selected 🌙","المظهر الداكن":"Dark Appearance","المظهر الفاتح":"Light Appearance","تلقائي":"System Default","فاتح":"Light","داكن":"Dark","اللغة":"Language","اختر لغة التطبيق":"Choose App Language","العربية":"Arabic","الإنجليزية":"English","استخدام التطبيق باللغة العربية":"Use the app in Arabic","استخدام التطبيق باللغة الإنجليزية":"Use the app in English"});
/* ATHAR — استكمال ترجمة بوابات الدخول وإزالة كلمة «التطبيق» من شاشة اختيار الدخول */
Object.assign(atharEnglishDictionary,{
"اختر طريقة استخدامك للتطبيق":"Choose how you want to use the app",
"اختر طريقة استخدامك":"Choose how you want to continue",
"مرحباً بك":"Welcome",
"مرحبًا":"Welcome",
"أهلاً":"Hello",
"أهلاً بك":"Welcome",
"الدخول":"Login",
"دخول":"Log In",
"بوابة الدخول":"Login Portal",
"بوابة العميل":"Customer Portal",
"بوابة صاحب المعدة":"Equipment Owner Portal",
"بوابة المقاول":"Contractor Portal",
"بوابة المشاريع":"Projects Portal",
"دخول العميل":"Customer Login",
"دخول صاحب المعدة":"Equipment Owner Login",
"دخول المقاول":"Contractor Login",
"دخول موظف الدعم":"Support Staff Login",
"تسجيل الدخول إلى حسابك":"Log in to your account",
"سجل الدخول للمتابعة":"Log in to continue",
"أدخل بريدك الإلكتروني":"Enter your email address",
"أدخل كلمة المرور":"Enter your password",
"البريد الإلكتروني أو رقم الجوال":"Email address or mobile number",
"البريد أو رقم الجوال":"Email or mobile number",
"ليس لديك حساب؟":"Don't have an account?",
"ليس لديك حساب":"Don't have an account",
"إنشاء حساب":"Create Account",
"إنشاء حسابك":"Create Your Account",
"إنشاء حساب جديد":"Create a New Account",
"ابدأ بإنشاء حسابك":"Start by creating your account",
"العودة":"Go Back",
"عودة":"Back",
"متابعة":"Continue",
"المتابعة":"Continue",
"الدخول إلى الحساب":"Access Account",
"الدخول إلى حسابك":"Log in to your account",
"تأكيد كلمة المرور":"Confirm Password",
"أعد كتابة كلمة المرور":"Re-enter your password",
"كلمة المرور الجديدة":"New Password",
"نسيت كلمة المرور":"Forgot Password",
"استعادة كلمة المرور":"Reset Password",
"إعادة تعيين كلمة المرور":"Reset Password",
"أرسل رابط استعادة كلمة المرور":"Send Password Reset Link",
"سيتم إرسال رابط إلى بريدك الإلكتروني":"A link will be sent to your email address",
"تحقق من بريدك الإلكتروني":"Check your email",
"تم إرسال رابط التحقق":"Verification link sent",
"لم يصلك الرمز؟":"Didn't receive the code?",
"إعادة إرسال الرمز":"Resend Code",
"إعادة الإرسال":"Resend",
"تحقق":"Verify",
"تأكيد الرمز":"Confirm Code",
"رمز التحقق":"Verification Code",
"أدخل رمز التحقق المرسل إليك":"Enter the verification code sent to you",
"رقم الجوال":"Mobile Number",
"أدخل رقم الجوال":"Enter your mobile number",
"الاسم":"Name",
"الاسم الكامل":"Full Name",
"أدخل اسمك الكامل":"Enter your full name",
"الموافقة على الشروط والأحكام":"I agree to the Terms and Conditions",
"أوافق على اتفاقية الاستخدام":"I agree to the Terms of Use",
"الشروط والأحكام":"Terms and Conditions",
"اتفاقية الاستخدام":"Terms of Use",
"عرض كلمة المرور":"Show Password",
"إخفاء كلمة المرور":"Hide Password",
"يرجى إدخال البريد الإلكتروني":"Please enter your email address",
"يرجى إدخال كلمة المرور":"Please enter your password",
"يرجى إدخال رقم الجوال":"Please enter your mobile number",
"يرجى إدخال الاسم الكامل":"Please enter your full name",
"بيانات الدخول غير صحيحة":"The login details are incorrect",
"البريد الإلكتروني غير صحيح":"The email address is invalid",
"كلمة المرور قصيرة جدًا":"The password is too short",
"كلمتا المرور غير متطابقتين":"The passwords do not match",
"تم تسجيل الدخول بنجاح":"Logged in successfully",
"تم إنشاء الحساب بنجاح":"Account created successfully",
"حدث خطأ أثناء تسجيل الدخول":"An error occurred while logging in",
"تعذر تسجيل الدخول":"Unable to log in",
"الحساب غير موجود":"Account not found",
"هذا الحساب غير مفعل":"This account is not active",
"يرجى المحاولة مرة أخرى":"Please try again",
"اختر نوع الحساب":"Choose Account Type",
"اختر طريقة الدخول":"Choose a Login Method",
"عميل":"Customer",
"صاحب معدة":"Equipment Owner",
"مشغل":"Operator",
"مقاول":"Contractor",
"صاحب مشروع":"Project Owner",
"موظف دعم":"Support Agent",
"مالك المنصة":"Platform Owner"
});


/* ATHAR — قاموس واجهة موسّع للصفحات الثابتة */
Object.assign(atharEnglishDictionary,{"آثار | ATHAR":"ATHAR | ATHAR","آثار":"ATHAR","👤 بوابة العملاء والمقاولين":"👤 Customer & Contractor Portal","🚜 بوابة أصحاب المعدات":"🚜 Equipment Owners Portal","🏗️ بوابة أصحاب ومسؤولي المشاريع":"🏗️ Project Owners & Managers Portal","التطبيق":"App","سيتم إضافة محتوى هذا القسم هنا.":"Content for this section will be added here.","الحساب":"Account","الصفحة الرئيسية":"Home Page","طلبات العملاء":"Customer Requests","سنة الصنع":"Year of Manufacture","0 ريال":"SAR 0","0 تقييم":"0 Ratings","حفظ التعديلات":"Save Changes","🔐 تغيير كلمة المرور":"🔐 Change Password","نوع الطلب":"Request Type","تابع حالة طلباتك الحالية":"Track the status of your current requests","معلومات الحساب":"Account Information","حالة الحساب":"Account Status","نشط":"Active","حدّث رقم الجوال المرتبط بحسابك":"Update the mobile number linked to your account","رقم الجوال الجديد":"New Mobile Number","حفظ رقم الجوال":"Save Mobile Number","حدّث البريد الإلكتروني المرتبط بحسابك":"Update the email address linked to your account","البريد الإلكتروني الجديد":"New Email Address","حفظ البريد الإلكتروني":"Save Email Address","سنرسل رابطًا إلى بريدك الإلكتروني لتغيير كلمة المرور":"We will send a link to your email address to change your password","جاري التحميل...":"Loading...","إرسال رابط التغيير 📧":"Send Change Link 📧","إذا واجهت مشكلة أو لديك استفسار حول آثار، تواصل معنا وسنساعدك.":"If you have an issue or a question about ATHAR, contact us and we will help.","التواصل مع الدعم":"Contact Support","تواصل معنا مباشرة":"Contact us directly","مشكلة في الطلب":"Request Issue","اطلب معدتك الآن":"Request Equipment Now","معدة قريبة منك، في الوقت الذي تحتاجها فيه.":"Equipment near you, whenever you need it.","📍 موقع العمل":"📍 Work Location","📍 تحديد موقعي بدقة":"📍 Set My Exact Location","اختر المعدة":"Choose Equipment","⏱️ مدة العمل":"⏱️ Work Duration","اختر المدة":"Choose Duration","ساعة واحدة":"One Hour","4 ساعات":"4 Hours","8 ساعات":"8 Hours","👷 المشغل":"👷 Operator","📝 ملاحظات":"📝 Notes","اطلب الآن":"Request Now","جاري البحث عن معدة قريبة...":"Searching for nearby equipment...","نبحث عن مشغل متاح بالقرب منك":"Looking for an available operator near you","طلبك تحت المتابعة":"Your Request Is Being Processed","تفاصيل صاحب المعدة :":"Equipment Owner Details:","ف":"F","اسم صاحب المعدة المسجل":"Registered Equipment Owner Name","موقع العمل في الطلب":"Work Location in the Request","موقع العمل المحدد في الطلب":"Specified Work Location","تفاصيل الطلب التي كتبها العميل":"Request Details Entered by the Customer","🗺️ تتبع المعدة عبر Google Maps":"🗺️ Track Equipment with Google Maps","ص":"O","🟢 متصل الآن":"🟢 Online Now","تتبع المعدة":"Track Equipment","2.4 كم":"2.4 km","8 دقائق":"8 minutes","وصلت المعدة 🚜":"Equipment Has Arrived 🚜","وصل صاحب المعدة إلى موقع العمل.":"The equipment owner has arrived at the work location.","بانتظار بدء المشغل للعمل...":"Waiting for the operator to start work...","العمل جارٍ":"Work in Progress","📞 اتصال":"📞 Call","إنهاء العمل":"Finish Work","تم إنهاء العمل":"Work Completed","1,000 ريال":"SAR 1,000","الانتقال للدفع":"Proceed to Payment","تم تسجيل انتهاء العمل بنجاح.":"Work completion was recorded successfully.","المبلغ المستحق لك":"Amount Due","الفاتورة والسداد":"Invoice & Payment","فتح فواتيري والمدفوعات":"Open My Invoices & Payments","قيّم تجربتك":"Rate Your Experience","كيف كانت تجربتك مع آثار؟":"How was your experience with ATHAR?","إرسال التقييم":"Submit Rating","شكرًا لك ❤️":"Thank You ❤️","تم استلام تقييمك بنجاح.":"Your rating has been received successfully.","طلب جديد":"New Request","يوجد عميل قريب منك":"There is a customer nearby","📏 المسافة":"📏 Distance","💰 السعر التقديري":"💰 Estimated Price","📝 ملاحظات العميل":"📝 Customer Notes","🚜 معدتي":"🚜 My Equipment","ستصلك الطلبات القريبة منك":"Nearby requests will appear here","تم قبول الطلب 🚜":"Request Accepted 🚜","📞 اتصال بالعميل":"📞 Call Customer","💬 محادثة مع العميل":"💬 Chat with Customer","وصلت إلى موقع العميل 🚜":"I Have Arrived at the Customer's Location 🚜","▶️ بدء العمل":"▶️ Start Work","بيانات المقاول":"Contractor Details","أكمل بيانات حسابك للمتابعة":"Complete your account details to continue","الاسم الكامل *":"Full Name *","المدينة *":"City *","اسم المؤسسة أو الشركة":"Organization or Company Name","العودة":"Back","🪪 بياناتي":"🪪 My Details","عرض بيانات المقاول وتحديثها.":"View and update contractor details.","فتح بياناتي":"Open My Details","🏗️ مشاريعي":"🏗️ My Projects","إنشاء مشاريع متعددة وإدارة الحالية والسابقة وطلب المعدات من داخل المشروع الحالي.":"Create multiple projects, manage current and previous projects, and request equipment from the active project.","عرض مشاريعي":"View My Projects","🧾 الفواتير والمستحقات":"🧾 Invoices & Dues","إدارة فواتير المشاريع والدفعات وعمولة آثار.":"Manage project invoices, payments, and ATHAR commission.","فتح الفواتير":"Open Invoices","⚙️ الإعدادات":"⚙️ Settings","تفضيلات استخدام التطبيق.":"App preferences.","فتح الإعدادات":"Open Settings","👤 الحساب":"👤 Account","معلومات الحساب وتسجيل الدخول.":"Account information and sign-in.","إدارة الحساب":"Manage Account","🛟 الدعم الفني":"🛟 Technical Support","تواصل مع فريق دعم آثار.":"Contact ATHAR Support.","حدد موقع مشروعك أولاً، ثم اختر المعدة المناسبة من المعدات القريبة.":"First, set your project location, then choose suitable equipment nearby.","اسم المشروع *":"Project Name *","وصف الموقع / العنوان":"Location Description / Address","حدد موقع المشروع على الخريطة أو استخدم موقعك الحالي. نحتاج الإحداثيات لعرض المعدات القريبة بدقة.":"Set the project location on the map or use your current location. We need the coordinates to show nearby equipment accurately.","خط العرض":"Latitude","خط الطول":"Longitude","📍 استخدام موقعي الحالي":"📍 Use My Current Location","تفاصيل المشروع (اختياري)":"Project Details (Optional)","حفظ المشروع":"Save Project","إلغاء والعودة إلى مشاريعي":"Cancel and Return to My Projects","اختر المعدة المناسبة":"Choose Suitable Equipment","المعدات المتاحة بالقرب من مشروعك":"Equipment Available Near Your Project","ملخص المشروع":"Project Summary","راجع المعدات المرتبطة بالمشروع وحالة تشغيلها قبل طلب معدة إضافية.":"Review the equipment linked to the project and its operating status before requesting additional equipment.","طلب معدة لهذا المشروع":"Request Equipment for This Project","اختيار المعدة المطلوبة *":"Select Required Equipment *","جارٍ تحميل المعدات المتاحة…":"Loading available equipment…","اختر المعدة من القائمة، ويمكنك مراجعة تفاصيلها في البطاقات أسفل الطلب.":"Choose equipment from the list. You can review its details in the cards below the request.","تاريخ ووقت بداية العمل *":"Work Start Date and Time *","وحدة المدة *":"Duration Unit *","أيام":"Days","أسابيع":"Weeks","أشهر":"Months","عدد المدة *":"Duration Quantity *","أيام التشغيل *":"Operating Days *","الأحد":"Sunday","الاثنين":"Monday","الثلاثاء":"Tuesday","الأربعاء":"Wednesday","الخميس":"Thursday","الجمعة":"Friday","السبت":"Saturday","وقت بداية التشغيل اليومي *":"Daily Operating Start Time *","وقت نهاية التشغيل اليومي *":"Daily Operating End Time *","المشغل *":"Operator *","طريقة السداد المتفق عليها *":"Agreed Payment Method *","شروط الدفع والتسوية *":"Payment and Settlement Terms *","ملاحظات لصاحب المعدة":"Notes for Equipment Owner","تحديث المعدات القريبة":"Refresh Nearby Equipment","إرسال طلب المعدة":"Send Equipment Request","جارٍ تحميل المعدات القريبة…":"Loading nearby equipment…","🚜 متابعة المعدة بعد القبول":"🚜 Equipment Tracking After Acceptance","مشاريعي":"My Projects","＋ إنشاء مشروعك":"＋ Create a Project","العودة للوحة المقاول":"Return to Contractor Dashboard","الفواتير والمستحقات":"Invoices & Dues","سجل الفواتير المشترك والدفعات والرصيد المستحق.":"Shared invoice, payment, and outstanding balance records.","اختر نوع الفواتير التي تريد مراجعتها.":"Choose the type of invoices you want to review.","فواتير العملاء":"Customer Invoices","فواتير طلبات تأجير المعدات للعملاء وحالة السداد":"Invoices for customer equipment rental requests and payment status","فواتير المقاولين":"Contractor Invoices","فواتير اتفاقات المعدات والدفعات والمستحقات":"Equipment agreements, payments, and dues invoices","← رجوع":"← Back","⟳ تحديث":"⟳ Refresh","← رجوع للفواتير":"← Back to Invoices","المشروع *":"Project *","جارٍ تحميل المشاريع…":"Loading projects…","رقم الفاتورة (اختياري)":"Invoice Number (Optional)","قيمة الفاتورة بالريال *":"Invoice Amount in SAR *","وصف الفاتورة *":"Invoice Description *","حفظ الفاتورة":"Save Invoice","توثيق سداد نقدي / تحويل للمراجعة":"Record Cash Payment / Transfer for Review","الفاتورة *":"Invoice *","حمّل الفواتير أولًا":"Load invoices first","قيمة الدفعة بالريال *":"Payment Amount in SAR *","مرجع التحويل أو ملاحظة":"Transfer Reference or Note","إرسال إثبات السداد للمراجعة":"Submit Payment Proof for Review","إصدار فاتورة طلب عميل":"Issue Customer Request Invoice","الطلب المنتهي *":"Completed Request *","جارٍ تحميل الطلبات…":"Loading requests…","المبلغ النهائي بالريال *":"Final Amount in SAR *","تفاصيل الفاتورة":"Invoice Details","إصدار الفاتورة للطرفين":"Issue Invoice to Both Parties","الدفع عبر آثار":"Pay through ATHAR","لا توجد فواتير لطلباتك حتى الآن.":"There are no invoices for your requests yet.","محفظة صاحب المعدة":"Equipment Owner Wallet","ملخص المستحقات والتحصيلات المسجلة في الفواتير المشتركة.":"Summary of dues and collections recorded in shared invoices.","ستظهر فواتير مشاريعك هنا.":"Your project invoices will appear here.","الحساب والإعدادات":"Account & Settings","تحديث بيانات المقاول":"Update Contractor Details","الاسم *":"Name *","المؤسسة أو الشركة":"Organization or Company","إدارة حساب الدخول في آثار":"Manage Your ATHAR Sign-in Account","البريد الإلكتروني:":"Email:","تفضيلات استخدام التطبيق":"App Preferences","تفعيل تنبيهات الطلبات داخل التطبيق":"Enable In-App Request Notifications","يمكن تعديل تفضيل التنبيهات لاحقًا عند تفعيل نظام الإشعارات.":"You can change notification preferences later when the notification system is enabled.","أرسل استفسارك أو بلاغك إلى فريق دعم آثار":"Send your inquiry or report to the ATHAR Support Team","مشكلة تقنية":"Technical Issue","مشكلة في طلب معدة":"Equipment Request Issue","اقتراح":"Suggestion","تفاصيل الرسالة *":"Message Details *","فتح المحادثة الحالية":"Open Current Conversation","لوحة تحكم آثار":"ATHAR Control Panel","الإدارة العامة للمنصة":"Platform Administration","جارٍ تجهيز لوحة التحكم…":"Preparing the Control Panel…","إجمالي المبالغ الداخلة عبر التطبيق":"Total Amounts Received through the App","ريال سعودي · السجلات المدفوعة المتاحة":"Saudi Riyals · Available Paid Records","إجمالي عمولات التطبيق":"Total App Commissions","ريال سعودي · العمولات المسجلة صراحة":"Saudi Riyals · Explicitly Recorded Commissions","إجمالي الطلبات":"Total Requests","الناجحة وغير الناجحة":"Successful and Unsuccessful","المتصلون الآن":"Currently Online","عدد المستخدمين المتصلين حاليًا":"Number of Users Currently Online","المستخدمون":"Users","العملاء وأصحاب المعدات ومسؤولو المشاريع":"Customers, Equipment Owners, and Project Managers","الشكاوى وموظفو الدعم":"Complaints & Support Staff","الشكاوى وتقييمات الموظفين والتصعيدات الواردة":"Complaints, Staff Ratings, and Incoming Escalations","الطلبات الناجحة والطلبات غير الناجحة":"Successful and Unsuccessful Requests","الملاحظات اليومية":"Daily Notes","سجل يومي لمراجعة أداء التطبيق والعمل":"Daily Log for Reviewing App and Work Performance","مركز التحكم الشامل":"Comprehensive Control Center","إدارة التصميم والنصوص والأسعار والفواتير والحملات":"Manage Design, Text, Prices, Invoices, and Campaigns","جميع إعدادات منصة آثار في مكان واحد":"All ATHAR Platform Settings in One Place","العودة ←":"Back ←","الهويات والأزرار":"Identities & Buttons","المالية والفواتير":"Finance & Invoices","الإشعارات والتسويق":"Notifications & Marketing","إدارة الهويات والأزرار":"Manage Identities & Buttons","هويات آثار الموسمية":"ATHAR Seasonal Identities","اختر الهوية التي تريد تفعيلها على المنصة بالكامل. يتغير المظهر تلقائيًا في جميع الصفحات، ويظل محفوظًا بعد تحديث التطبيق وتسجيل الخروج والدخول.":"Choose the identity you want to activate across the platform. It updates across all pages and remains active after refreshing or signing out and back in.","عيد الفطر":"Eid al-Fitr","تفعيل الهوية":"Activate Identity","اليوم الوطني":"National Day","يوم التأسيس":"Founding Day","عيد الأضحى":"Eid al-Adha","هوية آثار الأساسية":"ATHAR Default Identity","إلغاء الهوية الموسمية والعودة للمظهر الأصلي":"Deactivate Seasonal Identity and Return to the Original Design","العودة للهوية الأساسية":"Return to Default Identity","جارٍ تحميل الهوية النشطة…":"Loading Active Identity…","السياسة المالية":"Financial Policy","عمولة تطبيق آثار (%)":"ATHAR App Commission (%)","ضريبة القيمة المضافة (%)":"Value Added Tax (%)","بادئة رقم الفاتورة":"Invoice Number Prefix","ملاحظة أسفل الفاتورة":"Invoice Footer Note","الحملات والإشعارات":"Campaigns & Notifications","مركز الحملات التسويقية":"Marketing Campaign Center","عنوان الإعلان":"Ad Title","نص الإعلان":"Ad Text","الجمهور المستهدف":"Target Audience","جميع المستخدمين":"All Users","العملاء":"Customers","أصحاب المعدات":"Equipment Owners","مديرو المشاريع":"Project Managers","رابط الصفحة عند الضغط على الإشعار":"Page Link When Notification Is Tapped","نشر الحملة":"Publish Campaign","السجل":"Log","تحديث السجل":"Refresh Log","لا توجد تعديلات معروضة.":"No changes to display.","حفظ واعتماد الإعدادات":"Save and Approve Settings","إلغاء المعاينة":"Cancel Preview","نهاية مركز التحكم الشامل":"End of Comprehensive Control Center","إغلاق ✕":"Close ✕","دخول مالك المنصة":"Platform Owner Login","بوابة خاصة بمالك منصة آثار.":"Private portal for the ATHAR platform owner.","دخول موظفي الدعم":"Support Staff Login","دخول الموظف":"Staff Login","استعادة كلمة مرور موظف الدعم":"Reset Support Staff Password","إرسال رابط الاستعادة":"Send Reset Link","العودة لتسجيل الدخول":"Return to Login","آثار | مركز الدعم":"ATHAR | Support Center","موظف دعم":"Support Agent","➜ رجوع":"➜ Back","طلبات الدعم المفتوحة":"Open Support Requests","مراجعة تعديلات المعدات":"Review Equipment Changes","أسئلة المساعد الذكي":"AI Assistant Questions","إنهاء مبكر للمشاريع":"Early Project Termination","طلبات الدعم المكتملة":"Completed Support Requests","تقييمي":"My Rating","افتح الشكوى لمحادثة مقدمها مباشرة، ثم أغلقها بعد إتمام الحل.":"Open a complaint to chat directly with its creator, then close it once resolved.","راجع البيانات السابقة والتعديلات المقترحة قبل اعتماد القرار.":"Review the previous data and proposed changes before approving a decision.","إعادة تحميل التعديلات":"Reload Changes","أسئلة المساعد الذكي التي تحتاج تدخل موظف الدعم":"AI Assistant Questions Requiring Support Staff Intervention","هنا تظهر الأسئلة التي لم يجد المساعد لها إجابة معتمدة. أجب عن السؤال، ثم أغلقه بعد حلّه. لا تُعتمد إجابتك في قاعدة المعرفة إلا بموافقة المالك.":"Questions without an approved assistant answer appear here. Reply and close each question once resolved. Your answer enters the knowledge base only after owner approval.","تحديث الأسئلة":"Refresh Questions","جارٍ تحميل الأسئلة...":"Loading questions...","الرد على السؤال":"Reply to Question","الرد":"Reply","اقتراح الرد للمالك لاعتماده ضمن إجابات المساعد":"Suggest the reply to the owner for approval as an assistant answer","حفظ الرد":"Save Reply","إغلاق السؤال":"Close Question","أرشيف الشكاوى التي انتهت معالجتها وأُغلقت.":"Archive of complaints that have been handled and closed.","سيتم عرض التقييمات المسجلة هنا.":"Recorded ratings will be displayed here.","البريد:":"Email:","الصلاحية:":"Permission:","لون الواجهة":"Interface Color","ذهبي وأسود":"Gold and Black","بيانات العملاء":"Customer Data","أصحاب المعدات والمعدات":"Equipment Owners & Equipment","محادثات الدعم":"Support Conversations","البلاغات والمشاكل":"Reports & Issues","استعادة كلمة المرور":"Password Recovery","أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.":"Enter your email address and we will send you a password reset link.","مساعد آثار الذكي":"ATHAR AI Assistant","كيف أستطيع مساعدتك؟":"How can I help you?","أهلًا بك في آثار. اكتب سؤالك وسأبحث في الإجابات المعتمدة. إذا لم أجد إجابة موثوقة، سأحوّل سؤالك إلى فريق الدعم.":"Welcome to ATHAR. Type your question and I will search approved answers. If I cannot find a reliable answer, I will forward your question to the support team.","الأسئلة التي لم يجد المساعد لها إجابة معتمدة":"Questions Without an Approved Assistant Answer","الأسئلة الجديدة":"New Questions","تم الرد":"Answered","المغلقة":"Closed","إغلاق المحادثة":"Close Conversation","صفحة إدارة المالك فقط":"Owner Management Page Only","إدارة المساعد الذكي":"Manage AI Assistant","إدارة قاعدة المعرفة واعتماد إجابات الدعم":"Manage the Knowledge Base and Approve Support Answers","الأسئلة المحوّلة للدعم":"Questions Forwarded to Support","إجابات تنتظر اعتمادك":"Answers Awaiting Your Approval","الإجابات المعتمدة":"Approved Answers","إضافة سؤال وإجابة":"Add a Question and Answer","السؤال":"Question","الإجابة":"Answer","أسئلة بديلة (افصل بينها بفاصلة)":"Alternative Questions (Separate with Commas)","حفظ واعتماد الإجابة":"Save and Approve Answer","إلغاء التعديل":"Cancel Edit","إجابات الدعم بانتظار اعتمادك":"Support Answers Awaiting Your Approval","قاعدة المعرفة":"Knowledge Base","1. طبيعة المنصة":"1. Nature of the Platform","آثار ATHAR منصة إلكترونية لتنظيم التواصل وطلبات تأجير المعدات الثقيلة والخدمات المرتبطة بالمشاريع. ولا يعني عرض المعدة أو التحقق من بياناتها أن المنصة تضمن حالتها أو أداءها إلا في حدود ما تعلنه صراحة.":"ATHAR is an electronic platform for coordinating communication, heavy equipment rental requests, and project-related services. Listing equipment or verifying its information does not mean the platform guarantees its condition or performance, except to the extent expressly stated.","2. الحساب وصحة البيانات":"2. Accounts and Accuracy of Information","يلتزم المستخدم بتقديم بيانات صحيحة ومحدثة، والمحافظة على سرية بيانات الدخول، وعدم انتحال صفة الغير أو تقديم مستندات غير صحيحة.":"Users must provide accurate and up-to-date information, keep their login credentials confidential, and must not impersonate others or submit false documents.","3. التزامات العميل":"3. Customer Obligations","يلتزم العميل بدقة بيانات المعدة المطلوبة والموقع والمدة وطبيعة العمل، ومراجعة السعر والفاتورة وشروط الطلب قبل التأكيد، وسداد المبالغ المستحقة وفق الاتفاق.":"The customer must provide accurate details about the requested equipment, location, duration, and nature of the work; review the price, invoice, and request terms before confirmation; and pay amounts due under the agreement.","4. التزامات صاحب المعدة":"4. Equipment Owner Obligations","يلتزم صاحب المعدة بصحة بيانات المعدة وتوافرها وسعرها، وتقديم ما يثبت ملكيتها أو حقه في استخدامها عند الطلب، والالتزام بالاتفاق ومتطلبات الصيانة والسلامة والتشغيل التي تقع عليه نظامًا أو تعاقدًا.":"The equipment owner must ensure that equipment details, availability, and pricing are accurate; provide proof of ownership or the right to use the equipment when requested; and comply with the agreement and applicable maintenance, safety, and operating requirements.","5. التزامات المقاول وصاحب المشروع":"5. Contractor and Project Owner Obligations","يلتزم بتقديم بيانات صحيحة عن المشروع وموقعه ومدته واحتياجاته، وتوثيق طلبات المعدات والتمديدات والتغييرات، والوفاء بالالتزامات المالية ومتطلبات الموقع التي تقع ضمن مسؤوليته.":"The contractor or project owner must provide accurate information about the project, its location, duration, and needs; document equipment requests, extensions, and changes; and meet the financial obligations and site requirements under their responsibility.","6. الطلبات والاتفاقات":"6. Requests and Agreements","إنشاء الطلب لا يعني قبوله. ويجب على الأطراف مراجعة تفاصيل السعر والمدة ونطاق العمل قبل اعتماد الاتفاق. ولا يُعتد بالتغيير الجوهري إلا بعد موافقة الأطراف المعنية وتوثيقه.":"Creating a request does not mean it has been accepted. The parties must review the price, duration, and scope of work before approving the agreement. A material change is valid only after the relevant parties approve and document it.","7. الأسعار والفواتير والعمولات":"7. Prices, Invoices, and Commissions","تُعرض الأسعار والرسوم والعمولات وآلية احتسابها والطرف الملزم بها قبل اعتماد العملية. وإصدار الفاتورة لا يعني سدادها، ولا يُسجل الدفع ناجحًا إلا بعد تأكيده بالطريقة المعتمدة.":"Prices, fees, commissions, their calculation method, and the responsible party must be displayed before a transaction is approved. Issuing an invoice does not mean it has been paid; a payment is recorded as successful only after confirmation through the approved method.","8. الإلغاء والتأخير والنزاعات":"8. Cancellations, Delays, and Disputes","تسري شروط الإلغاء المعلنة والمتفق عليها. ويجب توثيق الخلافات عبر قنوات الدعم. ومراجعة المنصة للشكوى لا تحل محل الجهات القضائية أو المختصة ولا تعفي أي طرف من مسؤولياته.":"Published and agreed cancellation terms apply. Disputes must be documented through support channels. The platform's review of a complaint does not replace judicial or competent authorities and does not release any party from its responsibilities.","9. السلامة والمسؤولية":"9. Safety and Liability","يلتزم كل طرف بالأنظمة ومتطلبات السلامة والتصاريح التي تقع ضمن مسؤوليته. ويتحمل كل طرف تبعات أفعاله وإخلاله بالتزاماته وفق الأنظمة والعقود، ولا يعفي هذا الاتفاق من مسؤولية لا يجوز نظامًا الإعفاء منها.":"Each party must comply with the laws, safety requirements, and permits under its responsibility. Each party is liable for its actions and breaches under applicable laws and contracts. This agreement does not waive liability that cannot legally be excluded.","10. الخصوصية والبيانات":"10. Privacy and Data","تُعالج البيانات اللازمة لتشغيل الخدمات والتحقق من الحسابات وتنفيذ الطلبات والفوترة والدعم وفق سياسة الخصوصية والأنظمة المعمول بها. ويُستخدم الموقع عند الحاجة وبحسب إذن المستخدم وإعدادات جهازه.":"Data required to operate the services, verify accounts, process requests, issue invoices, and provide support is processed in accordance with the privacy policy and applicable laws. Location is used when necessary and subject to the user's permission and device settings.","11. التقييمات والمحتوى":"11. Ratings and Content","يجب أن تكون التقييمات صادقة وألا تتضمن إساءة أو تضليلًا أو انتهاكًا لحقوق الآخرين أو نشر بياناتهم دون مسوغ.":"Ratings must be honest and must not contain abuse, misleading information, violations of others' rights, or disclosure of their data without a valid basis.","12. التحقق من المعدات":"12. Equipment Verification","إتمام التحقق يعني تنفيذ إجراء التحقق المحدد فقط، ولا يمثل ضمانًا مطلقًا لسلامة المعدة أو صلاحيتها لكل استخدام.":"Completing verification means only that the specified verification procedure was carried out. It is not an absolute guarantee of the equipment's safety or suitability for every use.","13. تعليق الحساب والاعتراض":"13. Account Suspension and Appeals","يجوز تقييد الحساب عند وجود مخالفة أو إساءة استخدام أو اشتباه جدي، مع مراعاة إبلاغ المستخدم وإتاحة الاعتراض متى كان ذلك ممكنًا ومناسبًا، دون إهدار حقوقه النظامية.":"An account may be restricted in cases of violations, misuse, or serious suspicion. Where possible and appropriate, the user will be notified and given an opportunity to appeal, without prejudice to their legal rights.","14. الملكية الفكرية":"14. Intellectual Property","تظل حقوق العلامات والتصاميم والبرمجيات والمحتوى المملوك للمنصة لأصحابها، ولا يجوز استخدامها تجاريًا دون إذن. ويمنح المستخدم المنصة حق استخدام المحتوى الذي يرفعه بالقدر اللازم لتقديم الخدمة.":"Rights to the platform's trademarks, designs, software, and owned content remain with their respective owners and may not be used commercially without permission. Users grant the platform the right to use uploaded content to the extent necessary to provide the service.","15. تعديل الاتفاقية":"15. Amendments to the Agreement","قد تُحدّث الاتفاقية عند تطوير الخدمات أو استجابة للمتطلبات النظامية. ويُطلب قبول إصدار جديد قبل استخدام الخدمة متى كان التغيير جوهريًا أو كانت الموافقة الجديدة مطلوبة.":"This agreement may be updated as services develop or in response to legal requirements. Acceptance of a new version may be required before using the service when a change is material or renewed consent is required.","16. الدعم والشكاوى":"16. Support and Complaints","يمكن التواصل مع الدعم عبر القنوات المتاحة، مع تقديم رقم الطلب والمعلومات اللازمة. ولا يمنع ذلك المستخدم من اللجوء إلى الجهات المختصة.":"Support can be contacted through the available channels by providing the request number and necessary information. This does not prevent users from contacting the competent authorities.","17. أحكام عامة":"17. General Provisions","تخضع الاتفاقية للأنظمة المعمول بها في المملكة العربية السعودية بالقدر المنطبق، ولا تنتقص من أي حق إلزامي للمستهلك أو المستخدم.":"This agreement is governed by the applicable laws of the Kingdom of Saudi Arabia and does not diminish any mandatory rights of consumers or users.","إصدار الاتفاقية: ATHAR-TERMS-1.0 — تاريخ السريان عند اعتماد الإصدار.":"Agreement Version: ATHAR-TERMS-1.0 — Effective date: upon approval of this version.","هذه صياغة تشغيلية أولية، ويجب مراجعتها واعتمادها قانونيًا قبل النشر النهائي وفق الأنظمة السعودية، بما فيها أنظمة التجارة الإلكترونية وحماية البيانات الشخصية.":"This is an initial operational draft and must be legally reviewed and approved before final publication in accordance with Saudi regulations, including e-commerce and personal data protection laws.","قرأت اتفاقية الاستخدام والشروط والأحكام وأوافق عليها.":"I have read and agree to the ATHAR Terms of Use and Conditions.","إنشاء الحساب":"Create Account","🔢 رمز التحقق":"🔢 Verification Code","👤 الاسم الكامل":"👤 Full Name","تُعرض الفاتورة وحالة السداد في صفحة «فواتيري والمدفوعات». لن نعرض طريقة دفع غير مربوطة ببوابة معتمدة، ولن يُغلق الطلب قبل تأكيد السداد من مزود الدفع.":"The invoice and payment status are shown on the “My Invoices & Payments” page. We will not display a payment method that is not connected to an approved gateway, and the request will not be closed until the payment provider confirms payment.","تُحسب أيام التشغيل وفق جدول العمل وأيام الراحة التي تحددها، ولا تُحتسب أيام الراحة ضمن أيام التشغيل.":"Operating days are calculated according to the work schedule and the rest days you specify. Rest days are not counted as operating days.","50% مقدّمًا و50% عند انتهاء العمل":"50% in advance and 50% upon completion","أربع دفعات بمواعيد استحقاق محددة":"Four installments with specified due dates","دفع كامل مقدّمًا قبل بدء التشغيل":"Full payment in advance before operations begin","دفع كامل عند انتهاء العمل":"Full payment upon completion","الدفع النقدي (كاش) مع توثيق وتأكيد الاستلام":"Cash payment with documented and confirmed receipt","بعد قبول صاحب المعدة، تُنشأ فواتير الدفعات تلقائيًا في سجل موحّد يظهر للطرفين. لا يُثبت السداد الإلكتروني إلا بعد تأكيد موثوق من بوابة الدفع، والكاش يحتاج توثيقًا ومراجعة.":"After the equipment owner accepts, installment invoices are automatically created in a shared record visible to both parties. Electronic payment is recorded only after reliable confirmation from the payment gateway. Cash payments require documentation and review.","بعد إرسال الطلب ستظهر حالته هنا، وبعد قبول صاحب المعدة تظهر متابعة التشغيل والتمديد والدفعات والرصيد.":"After you submit the request, its status will appear here. Once the equipment owner accepts, you can track operations, extensions, installments, and the balance.","لا توجد طلبات معدات لهذا المشروع حتى الآن.":"There are no equipment requests for this project yet.","⟳ تحديث متابعة المعدة":"⟳ Refresh Equipment Tracking","العودة للمشروع":"Return to Project","أنشئ أكثر من مشروع، وأدر المشاريع الحالية والسابقة. طلب المعدة يبدأ من المشروع الحالي فقط.":"Create multiple projects and manage current and previous projects. Equipment requests can only be started from the current project.","إنشاء فاتورة مشروع (إيقاف — الفواتير تُنشأ تلقائيًا بعد قبول الطلب)":"Create Project Invoice (Disabled — invoices are created automatically after request acceptance)","يُسجّل إنشاء الفاتورة كبيان مالي داخل آثار، ولا يعني بحد ذاته تحصيل المبلغ أو إصدار فاتورة ضريبية معتمدة.":"Creating an invoice records a financial entry in ATHAR. It does not by itself mean that payment has been collected or that an approved tax invoice has been issued.","هذا المسار لتوثيق الكاش أو التحويل فقط. لا يُعدّ المبلغ مدفوعًا حتى يؤكد صاحب المعدة الاستلام؛ الدفع الإلكتروني يتطلب بوابة دفع مربوطة.":"This option is only for documenting cash or bank transfers. The amount is not considered paid until the equipment owner confirms receipt. Electronic payments require a connected payment gateway.","لا يُغلق الطلب عند انتهاء العمل. اختر الطلب المنتهي، راجع القيمة، ثم أرسل الفاتورة لتظهر لدى العميل وصاحب المعدة.":"The request is not closed when work ends. Select the completed request, review the amount, and send the invoice so it appears for both the customer and equipment owner.","تظهر الفواتير وحالة السداد هنا. الدفع الإلكتروني الفعلي لا يُفعّل إلا بعد ربط بوابة دفع معتمدة والتحقق من إشعار الدفع من البوابة؛ لا تعتمد على صورة تحويل أو ضغط زر من أحد الطرفين كتأكيد سداد.":"Invoices and payment statuses appear here. Actual electronic payments are enabled only after connecting an approved payment gateway and verifying its payment notification. A transfer screenshot or a button press by either party is not proof of payment.","الرصيد القابل للتحويل لا يُعرض كأموال مضمونة إلا عند وجود تسوية مالية فعلية وسجل تحويلات موثّق.":"A transferable balance is not shown as guaranteed funds unless an actual financial settlement and a verified transfer record exist.","بوابة مالك المنصة: لا يوجد رابط ظاهر لها في خيارات الاستخدام":"Platform Owner Portal: no visible link is provided in the usage options","حقول توافق داخلية لإبقاء وحدة الإعدادات الحالية سليمة":"Internal compatibility fields to keep the current settings module working","هذه إعدادات السياسة المستقبلية. لن تتغير الفواتير القديمة أو تُعاد حساباتها تلقائياً عند تعديل هذه القيم.":"These settings define future policy. Existing invoices will not be changed or recalculated when these values are edited.","يتطلب التسليم الفعلي إلى شاشة الجوال ربط Firebase Cloud Messaging وخادم إرسال آمن وتسجيل رموز أجهزة المستخدمين. حفظ الحملة هنا لا يعني أنها أُرسلت بالفعل.":"Actual delivery to mobile devices requires Firebase Cloud Messaging, a secure sending server, and registration of user device tokens. Saving a campaign here does not mean it has been sent.","سجل التعديلات":"Change Log","مراجعة الإعدادات السابقة ومن قام بالتعديل.":"Review previous settings and see who made each change.","بوابة دخول مالك المنصة المستقلة والمخفية":"Separate Hidden Platform Owner Login Portal","هذه البوابة مخصصة لموظفي آثار المصرح لهم فقط.":"This portal is restricted to authorized ATHAR staff only.","مراجعة طلبات الإنهاء واتخاذ القرار وفق الصلاحيات الحالية. لا يُنفذ هذا القسم دفعًا أو استردادًا تلقائيًا.":"Review termination requests and make decisions according to current permissions. This section does not automatically issue payments or refunds.","تظهر هنا تقييمات وملاحظات مقدمي الشكاوى على موظف الدعم عند توفر بيانات التقييم المرتبطة في النظام.":"Ratings and feedback submitted by complainants about support staff will appear here when the related rating data is available in the system.","تُدار صلاحيات الموظفين من مجموعة":"Staff permissions are managed through the","في Firebase.":"group in Firebase.","صفحة صندوق أسئلة المساعد لموظفي الدعم":"Assistant Question Inbox for Support Staff","إرسال الرد للمالك لمراجعته كإجابة مقترحة لقاعدة المعرفة":"Send the reply to the owner for review as a suggested knowledge-base answer","فتح بوابة موظفي الدعم":"Open Support Staff Portal","معلومات منصة آثار":"ATHAR Platform Information","معلومات المنصة":"Platform Information","اكتب اسمك الكامل":"Enter your full name","05xxxxxxxx أو +9665xxxxxxxx":"05xxxxxxxx or +9665xxxxxxxx","أدخل رمز التحقق 1234":"Enter verification code 1234","6 أحرف على الأقل":"At least 6 characters","اكتب اسمك":"Enter your name","مثال: جدة":"Example: Jeddah","اكتب نوع المعدة":"Enter equipment type","مثال: كوماتسو PC200":"Example: Komatsu PC200","مثال: 250":"Example: 250","الصفحة الرئيسية لصاحب المعدة":"Equipment Owner Home Page","نوع الطلبات":"Request Type","طلبات العملاء الحالية والسابقة":"Current and Previous Customer Requests","طلبات المشاريع الحالية والسابقة":"Current and Previous Project Requests","اكتب تفاصيل المشكلة أو استفسارك هنا":"Enter details of your issue or inquiry here","اضغط لتحديد موقع العمل":"Tap to set the work location","أي ملاحظات إضافية":"Any additional notes","اكتب رسالتك...":"Type your message...","مثال: مشروع إنشاء مبنى سكني":"Example: Residential Building Construction Project","الحي أو الشارع أو علامة قريبة":"Neighborhood, street, or nearby landmark","يُحدد من الخريطة":"Set on the map","وصف مختصر للمشروع أو ملاحظات مهمة":"Brief project description or important notes","اكتب مواعيد الاستحقاق وشروط التوثيق والاعتراض والإلغاء والاسترداد":"Enter due dates and the terms for documentation, disputes, cancellation, and refunds","تفاصيل إضافية (اختياري)":"Additional Details (Optional)","تصنيف المشاريع":"Project Categories","يُنشأ تلقائيًا إذا تركته فارغًا":"Generated automatically if left blank","مثال: 25000":"Example: 25,000","مثال: دفعة تأجير معدات لشهر أكتوبر":"Example: Equipment rental installment for October","قيمة الدفعة المستلمة":"Received Payment Amount","رقم تحويل أو تفاصيل مختصرة":"Transfer number or brief details","المبلغ المتفق عليه":"Agreed Amount","مدة التشغيل وأي تفاصيل متفق عليها":"Operating duration and any agreed details","اكتب كيف يمكننا مساعدتك...":"Tell us how we can help...","لوحة تحكم مالك المنصة":"Platform Owner Dashboard","اختيار هوية آثار":"Choose ATHAR Identity","مثلاً: عروض آثار الجديدة":"For example: New ATHAR Offers","اكتب رسالتك التسويقية هنا":"Enter your marketing message here","اختياري":"Optional","بريد مالك المنصة":"Platform Owner Email","بريد الموظف":"Staff Email","تحديث البيانات":"Refresh Data","أقسام مركز الدعم":"Support Center Sections","اكتب ردك على السؤال":"Enter your answer to the question","فتح مساعد آثار الذكي":"Open ATHAR AI Assistant","محادثة المساعد الذكي":"AI Assistant Conversation","إغلاق المساعد":"Close Assistant","اكتب سؤالك هنا...":"Type your question here...","اكتب ردك للمستخدم":"Enter your reply to the user","ابحث في الأسئلة والإجابات":"Search questions and answers"});

(function initAtharEnglishTranslation(){
  const originalNodes=new WeakMap();
  const originalAttrs=new WeakMap();
  const normalize=value=>String(value||'').replace(/\s+/g,' ').trim();
  function translateText(value){const raw=String(value??'');const key=normalize(raw);if(!key)return value;if(atharEnglishDictionary[key]){const lead=raw.match(/^\s*/)?.[0]||'';const tail=raw.match(/\s*$/)?.[0]||'';return lead+atharEnglishDictionary[key]+tail;}let result=raw;const phrasePairs=[["اختر طريقة استخدامك للتطبيق","Choose how you want to continue"],["تسجيل الدخول للمتابعة","Log in to continue"],["تسجيل الدخول إلى حسابك","Log in to your account"],["ليس لديك حساب؟","Don't have an account?"],["لديك حساب؟","Already have an account?"],["أدخل بياناتك","Enter your details"],["أدخل بريدك الإلكتروني","Enter your email address"],["أدخل كلمة المرور","Enter your password"]];for(const [ar,en] of phrasePairs){if(result.includes(ar))result=result.replaceAll(ar,en);}if(result!==String(value))return result;const prefixes=[["الحالة: ","Status: "],["المبلغ: ","Amount: "],["موظف الدعم: ","Support Agent: "],["سبب التصعيد: ","Escalation reason: "],["رقم الشكوى: ","Ticket number: "],["صاحب المعدة: ","Equipment owner: "],["الموقع: ","Location: "],["المدة: ","Duration: "],["المبلغ المستحق: ","Amount due: "],["رقم الطلب: ","Order number: "],["رقم الطلب ","Order number "],["سعر الساعة: ","Hourly rate: "],["الحجز: ","Reservation: "],["الوقت الفعلي: ","Actual time: "],["قيمة العمل: ","Work value: "],["المبلغ المحجوز/التقديري: ","Reserved/estimated amount: "],["المبلغ الإضافي المطلوب: ","Additional amount due: "],["المبلغ الزائد المسترد تجريبيًا: ","Test refund amount: "],["النهائي: ","Final: "],["العميل: ","Customer: "],["التاريخ: ","Date: "],["أنت على بعد ","You are "]];for(const [ar,en] of prefixes){if(result.includes(ar))result=result.replaceAll(ar,en);}if(result!==String(value))return result;return value;}
  window.ma3daTranslateText=value=>translateText(value);
  function translateNewAttributes(root){const attrs=['placeholder','aria-label','title'];const nodes=[];if(root.nodeType===1)nodes.push(root);if(root.querySelectorAll)nodes.push(...root.querySelectorAll('input,textarea,button,[aria-label],[title]'));nodes.forEach(el=>attrs.forEach(attr=>{if(!el.hasAttribute?.(attr))return;let saved=originalAttrs.get(el);if(!saved){saved={};originalAttrs.set(el,saved);}if(saved[attr]===undefined)saved[attr]=el.getAttribute(attr);el.setAttribute(attr,translateText(saved[attr]));}));}

  function applyLanguage(language){const english=language==='en';document.documentElement.lang=english?'en':'ar';document.documentElement.dir=english?'ltr':'rtl';document.documentElement.dataset.atharLanguage=english?'en':'ar';
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){if(!node.nodeValue||!normalize(node.nodeValue))return NodeFilter.FILTER_REJECT;const parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,input,select,[contenteditable="true"],[data-no-translate]'))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});
    let node;while((node=walker.nextNode())){if(!originalNodes.has(node))originalNodes.set(node,node.nodeValue);const original=originalNodes.get(node);node.nodeValue=english?translateText(original):original;}
    const attrs=['placeholder','aria-label','title'];document.querySelectorAll('input,textarea,button,[aria-label],[title]').forEach(el=>{attrs.forEach(attr=>{if(!el.hasAttribute(attr))return;let saved=originalAttrs.get(el);if(!saved){saved={};originalAttrs.set(el,saved);}if(saved[attr]===undefined)saved[attr]=el.getAttribute(attr);el.setAttribute(attr,english?translateText(saved[attr]):saved[attr]);});});
    document.querySelectorAll('.screen').forEach(screen=>screen.classList.toggle('athar-english-screen',english));
  }
  window.ma3daSetLanguage=language=>{const selected=language==='en'?'en':'ar';localStorage.setItem('ma3daLanguage',selected);applyLanguage(selected);};
  window.ma3daApplySavedLanguage=()=>applyLanguage(localStorage.getItem('ma3daLanguage')||'ar');
  const observer=new MutationObserver(records=>{if((localStorage.getItem('ma3daLanguage')||'ar')!=='en')return;for(const record of records){if(record.type==='childList'){record.addedNodes.forEach(node=>{if(node.nodeType===1){const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let textNode;while((textNode=walker.nextNode())){if(!originalNodes.has(textNode))originalNodes.set(textNode,textNode.nodeValue);const raw=originalNodes.get(textNode);textNode.nodeValue=translateText(raw);}translateNewAttributes(node);}else if(node.nodeType===3){if(!originalNodes.has(node))originalNodes.set(node,node.nodeValue);node.nodeValue=translateText(originalNodes.get(node));}});}else if(record.type==='characterData'){const n=record.target;let original=originalNodes.get(n);if(original===undefined||n.nodeValue!==translateText(original)){original=n.nodeValue;originalNodes.set(n,original);}const translated=translateText(original);if(n.nodeValue!==translated)n.nodeValue=translated;}}});
  if(document.body)observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  const saved=localStorage.getItem('ma3daLanguage')||'ar';applyLanguage(saved);
})();

if(arabicLanguageBtn){arabicLanguageBtn.addEventListener('click',()=>{window.ma3daSetLanguage?.('ar');alert('تم اختيار اللغة العربية 🇸🇦');});}
if(englishLanguageBtn){englishLanguageBtn.addEventListener('click',()=>{window.ma3daSetLanguage?.('en');alert('English language selected 🇬🇧');});}

/* ATHAR — اختصارات اللغة فقط: 🌐 للإنجليزية و ع للعربية */
(function initAtharRoleLanguageControls(){
  function mount(){
    const roleScreen=document.getElementById('roleScreen');
    if(!roleScreen || roleScreen.querySelector('.athar-role-quick-controls')) return;
    if(!document.getElementById('atharRoleLanguageControlsStyle')){
      const style=document.createElement('style');
      style.id='atharRoleLanguageControlsStyle';
      style.textContent=`
        #roleScreen{position:relative!important;padding-top:58px!important}
        #roleScreen .athar-role-quick-controls{position:absolute;z-index:30;top:12px;inset-inline-end:14px;display:flex;align-items:center;gap:8px;direction:ltr}
        #roleScreen .athar-role-quick-controls button{width:40px;height:40px;min-width:40px;padding:0;border:1px solid var(--athar-identity-accent,#c8a45b);border-radius:50%;background:var(--athar-identity-surface,#fffdf8);color:var(--athar-identity-text,#171717);font-family:inherit;font-size:17px;font-weight:800;line-height:1;display:grid;place-items:center;box-shadow:0 3px 12px #00000014;cursor:pointer}
        #roleScreen .athar-role-quick-controls button[aria-pressed="true"]{background:var(--athar-button-bg,#c8a45b);color:var(--athar-button-text,#171717);border-color:var(--athar-button-border,var(--athar-identity-accent,#c8a45b))}
        #roleScreen .athar-role-quick-controls button:focus-visible{outline:3px solid var(--athar-identity-accent,#c8a45b);outline-offset:3px}
      `;
      (document.head||document.documentElement).appendChild(style);
    }
    const bar=document.createElement('div');
    bar.className='athar-role-quick-controls';
    bar.setAttribute('data-no-translate','true');
    bar.setAttribute('aria-label','Language controls');
    const english=document.createElement('button');
    english.type='button'; english.textContent='🌐';
    english.setAttribute('aria-label','English'); english.title='English';
    english.addEventListener('click',()=>{window.ma3daSetLanguage?.('en');update();});
    const arabic=document.createElement('button');
    arabic.type='button'; arabic.textContent='ع';
    arabic.setAttribute('aria-label','العربية'); arabic.title='العربية';
    arabic.addEventListener('click',()=>{window.ma3daSetLanguage?.('ar');update();});
    function update(){
      let lang='ar'; try{lang=localStorage.getItem('ma3daLanguage')||'ar';}catch(_){}
      english.setAttribute('aria-pressed',lang==='en'?'true':'false');
      arabic.setAttribute('aria-pressed',lang==='ar'?'true':'false');
    }
    bar.append(english,arabic);
    const hero=roleScreen.querySelector('.hero');
    if(hero) roleScreen.insertBefore(bar,hero); else roleScreen.prepend(bar);
    update();
    window.addEventListener('storage',e=>{if(e.key==='ma3daLanguage')update();});
    const observer=new MutationObserver(update);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-athar-language']});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();

/* تم حذف إعدادات المظهر الداكن/الفاتح بالكامل؛ المظهر الفاتح ثابت. */

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
        const pendingRegistration=atharGetPendingRegistration();
        if(pendingRegistration?.newRegistration && pendingRegistration.uid===user.uid && pendingRegistration.role==="operator"){
          atharSetPendingRegistration({...pendingRegistration,name,phone,city,stage:"personal_data_completed"});
          showScreen("addEquipmentScreen");
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
        try { const pending = JSON.parse(localStorage.getItem("atharPendingRegistration") || "null"); if (pending?.uid === user.uid) localStorage.removeItem("atharPendingRegistration"); } catch (_) {}
 
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
 
    const registeredOperatorName =
      data.name || data.fullName || data.displayName || window.ma3daAuth?.currentUser?.displayName || "صاحب المعدة";

    const nameElement = document.getElementById("operatorHomeName");
    if (nameElement) nameElement.textContent = registeredOperatorName;

    const accountNameElement = document.getElementById("atharOperatorAccountName");
    if (accountNameElement) accountNameElement.textContent = registeredOperatorName;
 
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
 
/* آثار 2026 — تحقق حقيقي من وصول صاحب المعدة (GPS + مسافة كيلومتر) */
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
    alert("هذا المركز مخصص لمالك منصة آثار فقط.");
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
      details.hidden=false;let html="";const registrationPanel=document.getElementById('ownerRegistrationPanel');if(registrationPanel)registrationPanel.hidden=true;
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
        title.textContent="الشكاوى وموظفو الدعم";html=`<div class="owner-admin-subcards">${subcard("عدد الشكاوى",available("supportTickets")?ticketRows.length.toLocaleString("ar-SA"):"غير متاح","tickets")}${subcard("موظفو الدعم",available("supportStaff")?staffRows.filter(x=>x.active!==false&&x.role!=="owner").length.toLocaleString("ar-SA"):"غير متاح","staff")}${subcard("التصعيدات الواردة","عرض التصعيدات","escalations")}</div><h3>مراجعة التسجيلات الجديدة</h3><p>تظهر هنا الحسابات التي اجتازت المراجعة المبدئية لدى الدعم، لاعتمادها النهائي ومراجعة صورها ومستنداتها.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="support-btn support-primary" id="ownerFinalRegistrationsBtn">الاعتماد النهائي للمسجلين الجدد</button><button type="button" class="support-btn" id="ownerRegistrationMonitoringBtn">مراقبة الدعم وطلبات التسجيل المتعثرة</button></div><p>اختر أحد القسمين لمراجعة بيانات المسجل وصوره واتخاذ القرار النهائي.</p>`;
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
          if(list)list.innerHTML=notes.length?notes.map(n=>`<article class="owner-admin-record" data-owner-note-card="${safe(n.id)}"><strong>${safe(n.createdByEmail||"مالك التطبيق")} · ${safe(n.createdAtMs?new Date(n.createdAtMs).toLocaleString("ar-SA"):"")}</strong><span data-owner-note-text style="white-space:pre-wrap;display:block">${safe(n.text||"")}</span><textarea data-owner-note-editor rows="3" maxlength="5000" hidden>${safe(n.text||"")}</textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="support-btn" data-edit-owner-note="${safe(n.id)}">تعديل الملاحظة</button><button type="button" class="support-btn support-primary" data-save-owner-note="${safe(n.id)}" hidden>حفظ التعديل</button></div></article>`).join(""):"لا توجد ملاحظات محفوظة بعد.";
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
          html=rows.length?rows.map(x=>`<article class="owner-admin-record"><strong>${safe(x.ticketSubject||"شكوى")} · ${safe(x.status||"open")==="open"?"مفتوحة":"قيد المتابعة"}</strong><span>موظف الدعم: ${safe(x.staffName||x.staffEmail||x.staffId||"غير محدد")}</span><span>سبب التصعيد: ${safe(x.reason||"—")}</span><small>رقم الشكوى: ${safe(x.ticketId||"—")} · ${safe(x.createdAtMs?new Date(x.createdAtMs).toLocaleString("ar-SA"):"")}</small><label>ملاحظة مالك التطبيق</label><textarea data-escalation-note="${safe(x.id)}" rows="2" maxlength="2000" placeholder="اكتب الإجراء أو الملاحظة" disabled>${safe(x.ownerNote||"")}</textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="support-btn" data-edit-escalation-note="${safe(x.id)}">تعديل الملاحظة</button><button type="button" class="support-btn support-primary" data-save-escalation-note="${safe(x.id)}" hidden>حفظ التعديل</button></div></article>`).join(""):"لا توجد تصعيدات حتى الآن.";
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
      content.dataset.ownerDelegation='1';content.addEventListener('click',async e=>{
        const b=e.target.closest('[data-owner-view]');if(b){openView(b.dataset.ownerView);return;}
        const editDaily=e.target.closest('[data-edit-owner-note]');
        if(editDaily){const id=editDaily.dataset.editOwnerNote,card=content.querySelector(`[data-owner-note-card="${id}"]`),field=card?.querySelector('[data-owner-note-editor]'),save=card?.querySelector('[data-save-owner-note]'),text=card?.querySelector('[data-owner-note-text]');if(field){field.hidden=false;field.focus();}if(text)text.hidden=true;if(save)save.hidden=false;editDaily.hidden=true;return;}
        const saveDaily=e.target.closest('[data-save-owner-note]');
        if(saveDaily){const id=saveDaily.dataset.saveOwnerNote,card=content.querySelector(`[data-owner-note-card="${id}"]`),field=card?.querySelector('[data-owner-note-editor]'),text=card?.querySelector('[data-owner-note-text]'),edit=card?.querySelector('[data-edit-owner-note]'),value=(field?.value||'').trim();if(!value){alert('لا يمكن حفظ ملاحظة فارغة.');return;}saveDaily.disabled=true;try{const u=window.ma3daGetCurrentUser?await window.ma3daGetCurrentUser():window.ma3daAuth?.currentUser;if(!u)throw new Error('يجب تسجيل الدخول كمالك المنصة.');await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'ownerDailyNotes',id),{text:value,updatedAt:new Date(),updatedAtMs:Date.now(),updatedBy:u.uid});if(text)text.textContent=value;if(field)field.hidden=true;if(text)text.hidden=false;if(edit)edit.hidden=false;saveDaily.hidden=true;alert('تم تعديل الملاحظة وحفظها.');}catch(err){console.error(err);alert(err.message||'تعذر تعديل الملاحظة. تحقق من صلاحيات Firebase.');}finally{saveDaily.disabled=false;}return;}
        const editEsc=e.target.closest('[data-edit-escalation-note]');
        if(editEsc){const id=editEsc.dataset.editEscalationNote,field=content.querySelector(`[data-escalation-note="${id}"]`),save=content.querySelector(`[data-save-escalation-note="${id}"]`);if(field){field.disabled=false;field.focus();}if(save)save.hidden=false;editEsc.hidden=true;return;}
        const saveEsc=e.target.closest('[data-save-escalation-note]');if(saveEsc){try{const id=saveEsc.dataset.saveEscalationNote;const field=content.querySelector(`[data-escalation-note="${id}"]`);const u=window.ma3daGetCurrentUser?await window.ma3daGetCurrentUser():window.ma3daAuth?.currentUser;if(!u)throw new Error('يجب تسجيل الدخول كمالك المنصة.');const note=(field?.value||'').trim();await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'supportEscalations',id),{ownerNote:note,ownerNoteBy:u.uid,ownerNoteAt:new Date(),status:'reviewed'});if(field)field.disabled=true;const edit=content.querySelector(`[data-edit-escalation-note="${id}"]`);if(edit)edit.hidden=false;saveEsc.hidden=true;alert('تم حفظ ملاحظة التصعيد.');}catch(err){console.error(err);alert(err.message||'تعذر حفظ الملاحظة. تحقق من صلاحيات Firebase.');}}
      });
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
   آثار
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
  window.contractorGetProfile = contractorGetProfile;
 
 
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
      if(typeof atharUpdateRegisterRoleLabel === "function") atharUpdateRegisterRoleLabel();
 
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
    const atharProjectAccountName = document.getElementById("atharContractorAccountName");
    if (atharProjectAccountName) atharProjectAccountName.textContent = name || window.ma3daAuth?.currentUser?.displayName || "";
 
 
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
 
 
          const pendingRegistration=atharGetPendingRegistration();
          if(pendingRegistration?.newRegistration && pendingRegistration.uid===user.uid && pendingRegistration.role==="contractor"){
            const profile={uid:user.uid,name,phone,city,company,email:user.email||pendingRegistration.email||"",role:"contractor"};
            contractorSaveLocal(profile);
            fillContractorProfile(profile);
            atharSetPendingRegistration({...pendingRegistration,name,phone,city,company,stage:"personal_data_completed"});
            await contractorStartProjectForm();
            return;
          }

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
    const pendingRegistration=atharGetPendingRegistration();
    if(submit)submit.textContent=project?'حفظ تعديلات المشروع':(pendingRegistration?.newRegistration&&pendingRegistration.role==='contractor'?'إنشاء الحساب':'حفظ المشروع');
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
    if(atharRegistrationDraft?.role==="contractor"){
      const name=document.getElementById('contractorProjectName')?.value.trim()||'';
      const city=document.getElementById('contractorProjectCity')?.value.trim()||'';
      const address=document.getElementById('contractorProjectLocationText')?.value.trim()||'';
      const lat=Number(document.getElementById('contractorProjectLat')?.value);
      const lng=Number(document.getElementById('contractorProjectLng')?.value);
      const notes=document.getElementById('contractorProjectNotes')?.value.trim()||'';
      if(!name||!city){alert('اكتب اسم المشروع والمدينة.');return;}
      if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat===0||lng===0){alert('حدد موقع المشروع على الخريطة أو استخدم موقعك الحالي.');return;}
      submitContractorRequestBtn.disabled=true;submitContractorRequestBtn.textContent='جارٍ إنشاء الحساب...';
      try{
        let profile={name:atharRegistrationDraft.name,phone:atharRegistrationDraft.phone,city:'',company:'',email:atharRegistrationDraft.email};
        try{const stored=JSON.parse(localStorage.getItem('contractorProfile')||'null');if(stored)profile={...profile,...stored};}catch(_){}
        const project={contractorName:profile.name,contractorPhone:profile.phone,contractorCompany:profile.company||'',name,projectName:name,city,address,location:address||city,latitude:lat,longitude:lng,coordinates:{latitude:lat,longitude:lng},notes};
        await atharCreateFinalRegistration({role:'contractor',personalData:{name:profile.name,phone:profile.phone,city:profile.city||city,company:profile.company||''},project});
      }catch(error){console.error('Submit new contractor registration error:',error);alert(error?.message||'تعذر إنشاء الحساب وإرسال التسجيل.');}
      finally{submitContractorRequestBtn.disabled=false;submitContractorRequestBtn.textContent='إنشاء الحساب';}
      return;
    }
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
      const projectData={contractorId:user.uid,ownerId:user.uid,contractorName:profile.name||'',contractorPhone:profile.phone||'',contractorEmail:user.email||profile.email||'',contractorCompany:profile.company||'',name,projectName:name,city,location:address||city,address,latitude:lat,longitude:lng,coordinates:{latitude:lat,longitude:lng},notes,status:editingId?(contractorSelectedProject?.status||'active'):'active',updatedAt:now};
      const pendingRegistration=atharGetPendingRegistration();
      if(pendingRegistration?.newRegistration && pendingRegistration.uid===user.uid && pendingRegistration.role==="contractor" && !editingId){
        await window.ma3daSetDoc(window.ma3daDoc(window.ma3daDB,'registrationRequests',user.uid),{
          uid:user.uid,role:'contractor',registrationType:'project_owner',
          personalData:{name:profile.name||pendingRegistration.name||'',phone:profile.phone||pendingRegistration.phone||'',city:profile.city||'',company:profile.company||'',email:user.email||pendingRegistration.email||''},
          project:{...projectData},status:'pending_support',stage:'submitted',submittedAt:Date.now(),createdAt:pendingRegistration.createdAt||Date.now(),updatedAt:Date.now()
        },{merge:true});
        atharSetPendingRegistration({...pendingRegistration,stage:'submitted',submittedAt:Date.now()});
        contractorEditingProjectId=null;contractorSelectedProject=null;
        alert('تم إرسال تسجيلك وبيانات المشروع للمراجعة المبدئية لدى موظفي الدعم.');
        atharShowRegistrationSubmitted();
        return;
      }
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
    finally{submitContractorRequestBtn.disabled=false;submitContractorRequestBtn.textContent='إنشاء الحساب';}
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
    const reason=await window.ma3daRequestText('اشرح لمالك التطبيق سبب التصعيد وما الذي تعذر حله:','اكتب سبب التصعيد بالتفصيل...');
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
      const manager=document.getElementById('contractorPickerProjectManager');const profile=contractorGetProfile()||{};if(manager)manager.textContent=`مسؤول المشروع: ${profile.name||project.contractorName||'المسؤول المسجل'} · الجوال: ${profile.phone||project.contractorPhone||'—'}`;
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
            try{new Notification('آثار — تم إغلاق الشكوى',{body:'تم إغلاق شكواك. افتح الدعم الفني لتقييم موظف الدعم.',tag:'ma3da-ticket-closed-'+ticket.id});}catch(_){ }
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
    const reason=await window.ma3daRequestText('اشرح لمالك التطبيق سبب التصعيد وما الذي تعذر حله:','اكتب سبب التصعيد بالتفصيل...');
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
        const reason=await window.ma3daRequestText('اكتب سبب رفض التعديل ليظهر لصاحب المعدة:','اكتب سبب الرفض وما المطلوب تعديله...');
        if(reason===null)return;
        if(typeof reason!=='string'||!reason.trim())throw new Error('سبب الرفض مطلوب حتى يعرف صاحب المعدة ما الذي يحتاج إلى تصحيح.');
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
      await window.ma3daUpdateDoc(ref,approve?{verificationStatus:'verified',approved:true,equipmentStatus:'active',verificationReviewedAt:now,verificationReviewedBy:user.uid,verificationReviewNote:'تم اعتماد المعدة',ownerNotice:{type:'equipment_approved',message:'تم اعتماد معدتك من الدعم الفني.',createdAt:now,read:false}}:{verificationStatus:'rejected',equipmentStatus:'rejected',verificationReviewedAt:now,verificationReviewedBy:user.uid,verificationReviewNote:reason.trim(),ownerNotice:{type:'equipment_rejected',message:reason.trim(),createdAt:now,read:false}});
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
      if(name==='registrations'){supportSetSection(name);await window.atharLoadSupportRegistrations?.();return;}
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
  document.querySelectorAll('[data-ma3da-support-submit], #contractorSupportSubmitBtn').forEach(btn=>{btn.disabled=true;btn.title='استخدم مركز دعم آثار لإرسال شكوى جديدة';});
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
    const menu=$f('ownerFinancePagesNav'),toolbar=$f('ownerFinancePageToolbar');
    const projects=ownerFinanceSubpage==='contractors';
    const rentalCustomers=ownerFinanceSubpage==='customers';
    if(menu)menu.hidden=ownerFinanceSubpage!=='menu';
    if(toolbar)toolbar.hidden=ownerFinanceSubpage==='menu';
    if($f('ownerBookingInvoiceCard'))$f('ownerBookingInvoiceCard').hidden=true;
    if($f('bookingInvoicesList'))$f('bookingInvoicesList').hidden=true;
    if($f('bookingInvoiceGatewayNotice'))$f('bookingInvoiceGatewayNotice').hidden=true;
    if($f('ownerIssueInvoiceCard'))$f('ownerIssueInvoiceCard').hidden=true;
    if($f('contractorInvoicesList'))$f('contractorInvoicesList').hidden=!(projects||rentalCustomers);
    if($f('financeScreenTitle'))$f('financeScreenTitle').textContent=projects?'فواتير المشاريع':rentalCustomers?'فواتير تأجير المعدات':'الفواتير والمستحقات';
    if($f('financeScreenSubtitle'))$f('financeScreenSubtitle').textContent=projects?'فواتير اتفاقات المشاريع والدفعات المشتركة.':rentalCustomers?'فواتير طلبات تأجير المعدات المسجلة.':'اختر نوع الفواتير التي تريد مراجعتها.';
  }
  function openFinance(mode){
    financeMode=mode==='owner'?'owner':mode==='customer'?'customer':'contractor';
    showScreen('contractorFinanceScreen');
    const owner=financeMode==='owner'; const customer=financeMode==='customer';
    if($f('financeScreenTitle'))$f('financeScreenTitle').textContent=owner?'فواتير التأجير ومستحقاتي':customer?'فواتيري والمدفوعات':'فواتير المشروع والسداد';
    if($f('financeScreenSubtitle'))$f('financeScreenSubtitle').textContent=owner?'أصدر فاتورة الطلب بعد انتهاء العمل، وتابع حالة السداد ومستحقاتك.':customer?'راجع فواتيرك ومبالغها وحالة الدفع من مكان واحد.':'استعرض فواتير المشروع والدفعات وحالة السداد.';
    if($f('ownerIssueInvoiceCard'))$f('ownerIssueInvoiceCard').hidden=true; // النظام المرحلي القديم مؤرشف وغير نشط
    if($f('ownerBookingInvoiceCard'))$f('ownerBookingInvoiceCard').hidden=true;
    if($f('bookingInvoicesList'))$f('bookingInvoicesList').hidden=true;
    if($f('bookingInvoiceGatewayNotice'))$f('bookingInvoiceGatewayNotice').hidden=true;
    if($f('contractorInvoicesList'))$f('contractorInvoicesList').hidden=owner;
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
      if($f('ownerBookingInvoiceCard'))$f('ownerBookingInvoiceCard').hidden=true;
      if($f('bookingInvoicesList'))$f('bookingInvoicesList').hidden=true;
      if($f('bookingInvoiceGatewayNotice'))$f('bookingInvoiceGatewayNotice').hidden=true;
      if($f('contractorInvoicesList'))$f('contractorInvoicesList').hidden=false;
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
      ma3daReadUserRows('projectInvoices',invoiceFields,user.uid).catch(err=>{console.warn('projectInvoices غير متاحة وفق قواعد Firestore الحالية؛ ستستخدم نسخة الفاتورة المحفوظة داخل الطلب.',err);return []; }),
      ma3daReadUserRows('projectInvoicePayments',paymentFields,user.uid).catch(err=>{console.warn('Related payment rows are not readable yet.',err);return []; }),
      ma3daReadUserRows('requests',requestFields,user.uid),
      ma3daReadUserRows('projectPhaseTasks',phaseFields,user.uid).catch(err=>{console.warn('Project phase tasks are not readable yet; check Firestore rules.',err);return [];})
    ]);
    cachedProjects=projects.filter(p=>(p.contractorId||p.ownerId||p.userId)===user.uid);
    cachedAllRequests=requests;
    cachedManagerRequests=requests.filter(r=>!!r.projectId && (r.contractorId===user.uid || r.requesterId===user.uid || r.customerId===user.uid) && (r.requesterRole==='contractor'||r.requesterType==='contractor'||!!r.contractorId) && !['rejected','cancelled','مرفوض','ملغي'].includes(String(r.status||'').toLowerCase()));
    cachedRequests=requests.filter(r=>{
      const isProject=!!(r.projectId && (r.requesterRole==='contractor'||r.requesterType==='contractor'||r.contractorId));
      const ownerId=r.equipmentOwnerId||r.ownerId||r.operatorId||'';
      const accepted=['accepted','arrived','working','completed','complete','تم القبول','قيد العمل','مكتمل'].includes(String(r.status||'').toLowerCase());
      return isProject && ownerId===user.uid && accepted;
    });
    const embeddedInvoices=requests.filter(r=>r.invoiceSnapshot&&r.invoiceSnapshot.invoiceKind==='equipment_rental').map(r=>({...r.invoiceSnapshot,id:'embedded-'+r.id,requestId:r.id,invoiceNumber:r.invoiceNumber||r.invoiceSnapshot.invoiceNumber,customerId:r.customerId||r.invoiceSnapshot.customerId,ownerId:r.equipmentOwnerId||r.ownerId||r.operatorId||r.invoiceSnapshot.ownerId,equipmentOwnerId:r.equipmentOwnerId||r.ownerId||r.operatorId||r.invoiceSnapshot.equipmentOwnerId}));
    const allInvoices=[...invoices,...embeddedInvoices.filter(e=>!invoices.some(i=>i.requestId===e.requestId))];
    cachedInvoices=allInvoices.filter(i=>financeMode==='customer'?(i.invoiceKind==='equipment_rental'&&i.customerId===user.uid):financeMode==='owner'?((i.invoiceKind==='equipment_rental'&&(i.ownerId===user.uid||i.equipmentOwnerId===user.uid))||(i.invoiceKind==='agreement_installment'&&(i.ownerId===user.uid||i.equipmentOwnerId===user.uid))):(i.invoiceKind==='agreement_installment'&&i.contractorId===user.uid));
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
    const activeInvoices=cachedInvoices.filter(i=>financeMode==='customer'?i.invoiceKind==='equipment_rental':financeMode==='owner'?(ownerFinanceSubpage==='customers'?i.invoiceKind==='equipment_rental':i.invoiceKind==='agreement_installment'):i.invoiceKind==='agreement_installment');
    if(!activeInvoices.length){list.innerHTML=`<div class="card"><h3>${financeMode==='customer'?'لا توجد فواتير صادرة لطلباتك حتى الآن':financeMode==='owner'?'لا توجد فواتير حتى الآن':'لا توجد فواتير مشاريع واردة حتى الآن'}</h3><p>${financeMode==='customer'?'ستظهر هنا فواتير طلبات تأجير المعدات بعد انتهاء العمل.':financeMode==='owner'?'ستظهر هنا فواتير تأجير المعدات والمشاريع.':'ستظهر هنا الفواتير المشتركة لاتفاقيات تأجير المعدات للمشاريع.'}</p></div>`;return;}
    const sorted=[...activeInvoices].sort((a,b)=>{
      const toTime=v=>{try{return (v?.toDate?v.toDate():new Date(v||0)).getTime()||0}catch(_){return 0}};
      return toTime(b.createdAt)-toTime(a.createdAt);
    });
    list.innerHTML='<div class="card"><h3>'+(financeMode==='owner'?'فواتير معداتي ومستحقاتي':financeMode==='customer'?'فواتيري ومدفوعاتي':'الفواتير المطلوب سدادها')+'</h3><p>راجع قيمة الفاتورة والدفعات وحالة السداد من هنا.</p>'+sorted.map(inv=>{
      const s=paymentSummary(inv); const st=s.remaining<=0?'paid':s.paid>0?'partial':(s.pending>0?'pending_verification':'issued');
      const payRows=cachedPayments.filter(p=>p.invoiceId===inv.id).map(p=>`<div class="ma3da-finance-row"><strong>دفعة: ${money(p.amount)}</strong><p>الحالة: <span class="ma3da-finance-status">${esc(statusLabel(p.status))}</span></p><p>المرجع: ${esc(p.reference||'—')}</p>${financeMode==='owner'&&p.status==='pending_verification'?`<button type="button" class="main-btn" data-owner-confirm-payment="${esc(p.id)}">تأكيد استلام الدفعة</button>`:''}</div>`).join('');
      const counterparty=financeMode==='owner'?`<p><strong>${inv.invoiceKind==='equipment_rental'?'العميل':'مسؤول المشروع'}:</strong> ${esc(inv.customerName||inv.contractorName||inv.contractorEmail||'الطرف الآخر')}</p>`:`<p><strong>صاحب المعدة:</strong> ${esc(inv.ownerName||inv.ownerEmail||'صاحب المعدة')}</p>`;
      return `<div class="ma3da-finance-row"><h3>${esc(inv.invoiceNumber||'فاتورة')}</h3>${counterparty}${inv.projectName?`<p><strong>المشروع:</strong> ${esc(inv.projectName)}</p>`:''}${inv.stageNumber?`<p><strong>المرحلة:</strong> ${esc(inv.stageName||stageName(inv.stageNumber))}</p>`:''}<p><strong>المعدة:</strong> ${esc(inv.equipment||'—')}</p><p><strong>تاريخ الإصدار:</strong> ${when(inv.createdAt)}</p><p><strong>التفاصيل:</strong> ${esc(inv.description||'—')}</p><p><strong>قيمة الفاتورة:</strong> ${money(inv.invoiceAmount)}</p><p><strong>المدفوع المؤكد:</strong> ${money(s.paid)}</p><p><strong>دفعات بانتظار التحقق:</strong> ${money(s.pending)}</p><p><strong>المتبقي:</strong> ${money(s.remaining)}</p>${inv.invoiceKind==='agreement_installment'?`<p><strong>الدفعة:</strong> ${esc(inv.installmentLabel||`${inv.installmentIndex||''} من ${inv.installmentCount||''}`)}</p><p><strong>تاريخ الاستحقاق:</strong> ${when(inv.dueAt)}</p>`:''}${inv.invoiceKind==='equipment_rental'?`<p><strong>رقم الطلب:</strong> ${esc(inv.orderNumber||inv.requestId||'—')}</p><p class="muted">فاتورة سجلية للتوثيق؛ لا تعني تحصيلًا إلكترونيًا أو إصدار فاتورة ضريبية.</p>`:''}${financeMode==='owner'?`<p><strong>حالة التسوية:</strong> ${esc(statusLabel(inv.settlementStatus||'settlement_pending'))}</p>`:''}<p>الحالة: <span class="ma3da-finance-status">${esc(statusLabel(st))}</span></p>${inv.paymentMethod==='gateway'&&s.remaining>0&&financeMode==='owner'?`<p class="muted">وسائل الدفع الإلكتروني (Apple Pay، مدى، Visa وMastercard) تتطلب ربط بوابة الدفع وتأكيدها الموثوق؛ لم تُفعّل عملية دفع غير مربوطة.</p>`:''}${financeMode==='contractor'&&s.remaining>0&&inv.paymentMethod==='cash'?`<button type="button" class="main-btn" data-finance-pay-invoice="${esc(inv.id)}">توثيق سداد نقدي لهذه الفاتورة</button>`:''}${financeMode==='contractor'&&s.remaining>0&&inv.paymentMethod!=='cash'?`<p class="muted">الدفع الإلكتروني غير مفعّل حتى ربط بوابة دفع وتأكيد العملية منها؛ لا تسجّل زرًا بديلًا على أنه دفع ناجح.</p>`:''}${payRows?'<details><summary>تفاصيل الدفعات</summary>'+payRows+'</details>':''}</div>`;
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
        if(invoice.invoiceKind!=='agreement_installment') throw new Error('نوع الفاتورة غير معتمد في مسار فواتير المشاريع.');
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
          const requestTotal=Number(request.price||request.agreementTotal||invoice.agreementTotal||invoiceTotal);
          const requestPaid=Math.round(paidAcrossRequest*100)/100; const remaining=Math.max(0,Math.round((requestTotal-requestPaid)*100)/100);
          let schedule=Array.isArray(request.paymentSchedule)?request.paymentSchedule.map(x=>({...x})):[];
          if(!isBooking && Number(invoice.installmentIndex)>0){
            const idx=schedule.findIndex(x=>Number(x.installment)===Number(invoice.installmentIndex));
            if(idx>=0){const paidOnInvoice=totalAfter;schedule[idx]={...schedule[idx],paidAmount:paidOnInvoice,status:invoiceRemaining<=0?'paid':'due',paidAt:invoiceRemaining<=0?now:(schedule[idx].paidAt||null),reviewStatus:invoiceRemaining<=0?'confirmed':'partial'};}
          }
          const canClose=remaining<=0&&['completed','complete','invoice_issued','paid'].includes(String(request.status||''));
          requestPatch={paymentLedger:ledger,paidTotal:requestPaid,remainingBalance:remaining,paymentStatus:remaining<=0?'paid':(requestPaid>0?'partially_paid':'unpaid'),paymentSchedule:schedule,settlementStatus:remaining<=0?'settled':'needs_settlement',requestClosed:canClose,lastPaymentConfirmedAt:now,updatedAt:now};
          
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
    if(target.id==='customerFinanceBtn'){openFinance('customer').catch(err=>{console.error('Customer invoice page failed:',err);say('contractorPaymentFeedback','تعذر تحميل فواتيرك. تحقق من الاتصال والصلاحيات.',true);});return;}
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
      customer:['customerDataScreen','customerHomeScreen','currentOrdersScreen','previousOrdersScreen','customerSettingsScreen','editPhoneScreen','editEmailScreen','changePasswordScreen','technicalSupportScreen','requestScreen','searchingScreen','matchedScreen','chatScreen','trackingScreen','arrivedScreen','workingScreen','completedScreen','ratingScreen','thankYouScreen'],
      operator:['operatorDataScreen','operatorHomeScreen','operatorEquipmentScreen','operatorNewRequestsScreen','operatorCurrentOrderScreen','operatorCustomerOrdersScreen','operatorProjectOrdersScreen','operatorIncomeScreen','operatorRatingsScreen','operatorSettingsScreen','operatorSupportScreen','operatorCompletedScreen','operatorScreen','operatorAcceptedScreen','operatorArrivedScreen'],
      contractor:['contractorDataScreen','contractorHomeScreen','contractorRequestScreen','contractorEquipmentPickerScreen','contractorProjectsScreen','contractorFinanceScreen','contractorSettingsScreen','contractorAccountScreen','contractorSettingsPrefsScreen','contractorSupportScreen'],
      support:['supportLoginScreen','supportForgotScreen','supportDashboardScreen']
    };
    for(const ids of Object.values(groups)) if(ids.includes(currentId)){
      if(currentId==='supportForgotScreen') return 'supportLoginScreen';
      if(currentId==='contractorEquipmentPickerScreen') return 'contractorProjectsScreen';
      if(currentId==='contractorRequestScreen') return 'contractorProjectsScreen';
      if(currentId==='editPhoneScreen'||currentId==='editEmailScreen'||currentId==='changePasswordScreen'||false) return 'customerSettingsScreen';
      if(['searchingScreen','matchedScreen','chatScreen','trackingScreen','arrivedScreen','workingScreen','completedScreen','ratingScreen','thankYouScreen'].includes(currentId)) return 'customerHomeScreen';
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
        }else if(['ma3daSupportHomeScreen','ma3daSupportLandingScreen','technicalSupportScreen','operatorSupportScreen','contractorSupportScreen','introScreen','whyMa3daScreen','howMa3daScreen','howWorksScreen','roleScreen','phoneScreen','otpScreen','createAccountScreen','requestScreen','searchingScreen','matchedScreen','chatScreen','trackingScreen','arrivedScreen','workingScreen','completedScreen','ratingScreen','thankYouScreen','contractorRequestScreen','contractorSettingsScreen','contractorAccountScreen','contractorSettingsPrefsScreen','supportLoginScreen','supportForgotScreen'].includes(screen.id)){
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
   مساعد آثار الذكي — الجزء الأول
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
    console.error("مساعد آثار: عناصر الواجهة غير موجودة في index.");
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
   مساعد آثار — ربط صندوق الدعم وإدارة المالك
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
    /* خلفيات الصفحات الرئيسية تُدار من الهوية النشطة فقط لمنع تراكب الصور. */
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

    // إزالة أي طبقة قديمة لصورة آثار من الصفحات الرئيسية.
    // صورة الخلفية الوحيدة لهذه الصفحات تأتي من الهوية الموسمية النشطة.
    ["customerHomeScreen", "operatorHomeScreen", "contractorHomeScreen"].forEach(id => {
      const screen = document.getElementById(id);
      if (!screen) return;
      screen.classList.remove("ma3da-athar-bg");
      screen.style.removeProperty("--ma3da-athar-background");
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
   آثار | إدارة خلفيات التطبيق — مدمجة داخل مركز التحكم الشامل
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
  const CACHE_KEY = "ma3da_brand_background_cache_v1";

  const $ = id => document.getElementById(id);

  function cacheBackground(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        imageData: data.imageData || "",
        opacity: data.opacity ?? 16,
        allPages: data.allPages !== false,
        pageBackgrounds: data.pageBackgrounds || {}
      }));
    } catch (error) {
      console.warn("تعذر تخزين نسخة محلية من الخلفيات:", error);
    }
  }

  function applyBackgroundSettings(data) {
    if (!data) return;
    savedImage = data.imageData || "";
    savedPageBackgrounds = data.pageBackgrounds || {};
    if (data.allPages === false || !savedImage) {
      // لا نمسح الخلفيات المخصصة عند تعطيل الخلفية العامة.
      if (data.allPages === false) clearBackground("all");
    } else {
      applyBackground(savedImage, data.opacity ?? 16, "all");
    }
    Object.entries(savedPageBackgrounds).forEach(([pageId, entry]) => {
      if (entry?.imageData) applyBackground(entry.imageData, entry.opacity ?? 16, pageId);
      else clearBackground(pageId);
    });
  }

  function loadCachedBackground() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) applyBackgroundSettings(JSON.parse(raw));
    } catch (error) {
      console.warn("تعذر استعادة الخلفيات المحفوظة محليًا:", error);
    }
  }

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
      cacheBackground(data);
      applyBackgroundSettings(data);
      if (savedImage && data.allPages !== false) {
        const preview = $("ma3daBgPreview");
        if (preview) {
          preview.style.backgroundImage = 'url("' + image + '")';
          preview.textContent = "";
        }
        const opacity = $("ma3daBgOpacity");
        const opacityValue = $("ma3daBgOpacityValue");
        if (opacity) opacity.value = String(data.opacity ?? 16);
        if (opacityValue) opacityValue.textContent = String(data.opacity ?? 16) + "%";
      }
    } catch (error) {
      console.warn("تعذر تحميل خلفية آثار:", error);
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
        cacheBackground({ imageData: savedImage, opacity, allPages: true, pageBackgrounds });
        applyBackground(savedImage, opacity, "all");
        status("تم حفظ الخلفية وتطبيقها على جميع الصفحات.");
      } else {
        pageBackgrounds[pageId] = { imageData: selectedImage, opacity };
        await window.ma3daSetDoc(ref, {
          pageBackgrounds, updatedAtMs: Date.now(), updatedBy: user.uid
        }, { merge: true });
        savedPageBackgrounds = pageBackgrounds;
        cacheBackground({ imageData: savedImage, allPages: Boolean(savedImage), pageBackgrounds });
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
            آثار | إدارة خلفيات التطبيق
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
        if (selectedImage) {
          const pageId = $("ma3daBgPageSelect")?.value || "all";
          applyBackground(selectedImage, value, pageId);
        }
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
            cacheBackground({ imageData: "", allPages: false, pageBackgrounds });
          } else {
            pageBackgrounds[pageId] = { imageData: "", opacity: Number($("ma3daBgOpacity")?.value || 16) };
            await window.ma3daSetDoc(ref, { pageBackgrounds, updatedAtMs: Date.now(), updatedBy: user.uid }, { merge: true });
            savedPageBackgrounds = pageBackgrounds;
            clearBackground(pageId);
            cacheBackground({ imageData: savedImage, allPages: Boolean(savedImage), pageBackgrounds });
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
        const pageId = $("ma3daBgPageSelect")?.value || "all";
        const entry = pageId === "all" ? null : savedPageBackgrounds[pageId];
        const image = pageId === "all" ? savedImage : (entry?.imageData || "");
        if (!image) {
          status("لا توجد خلفية محفوظة لهذه الصفحة.");
          return;
        }
        selectedImage = image;
        const preview = $("ma3daBgPreview");
        if (preview) {
          preview.style.backgroundImage = 'url("' + image + '")';
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
    addStyles();
    // استعادة الخلفية فور بدء التطبيق حتى تبقى بعد تسجيل الخروج.
    loadCachedBackground();
    // تحديث النسخة المحلية من Firestore متى كانت القراءة متاحة.
    loadSavedBackground();
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

    const texts = { ...(currentSettings.texts || defaults.texts) };

    const prices = { ...(currentSettings.prices || defaults.prices) };

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
      activateTab("design");

      // تحميل إعدادات الهويات بعد التحقق من صلاحية مالك التطبيق.
      if (typeof window.ma3daLoadAtharIdentities === "function") {
        await window.ma3daLoadAtharIdentities();
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


/* =========================================================
   ATHAR | الهوية الموسمية الموحدة — تفعيل عالمي محفوظ
   الصور موجودة بجانب index.html في المجلد الرئيسي.
========================================================= */
(function AtharIdentityManager(){
  "use strict";
  const $ = id => document.getElementById(id);
  const COL = "ma3daSettings";
  const DOC = "ownerControlCenter";
  const IMAGE_BY_ID = {
    eidFitr: "IMG_0339.jpeg",
    nationalDay: "ATHAR-National-Day-Login.png",
    foundingDay: "IMG_0346.jpeg",
    eidAdha: "IMG_0348.jpeg"
  };
  const defaults = {
    classic: {
      name: "آثار الأساسية", primary: "#171717", accent: "#c8a45b",
      buttonBg: "#FFFFFF", buttonText: "#171717",
      surface: "#f7f7f5", text: "#191919", image: "",
      taglines: {
        customer: "خطوتك الأولى نحو مشروع يليق بطموحك.",
        owner: "معدتك أداة إنجاز… وطموحك يصنع الفرق.",
        projects: "من فكرة طموحة… إلى مشروع يتحقق."
      }
    },
    eidFitr: {
      name: "عيد الفطر", primary: "#2876B9", accent: "#d8b66a",
      buttonBg: "#FFFFFF", buttonText: "#2876B9",
      surface: "#f7f4e9", text: "#17392f", image: IMAGE_BY_ID.eidFitr,
      taglines: {
        customer: "في أيام الخير… أنجز مشروعك بثقة.",
        owner: "في عيد الخير… عطاءك يصنع الفرق.",
        projects: "أيام مباركة… ومشاريع تزدهر بالإنجاز."
      }
    },
    nationalDay: {
      name: "اليوم الوطني", primary: "#79B98A", accent: "#d7c69a",
      buttonBg: "#FFFFFF", buttonText: "#79B98A",
      surface: "#f1f6f1", text: "#123d2c", image: IMAGE_BY_ID.nationalDay,
      taglines: {
        customer: "همة وطن… ومشاريع تصنع المستقبل.",
        owner: "بعزم الرجال… نبني وطناً ونصنع إنجازاً.",
        projects: "وطنٌ يطمح… ومشاريع تعانق القمم."
      }
    },
    foundingDay: {
      name: "يوم التأسيس", primary: "#795437", accent: "#b99a6b",
      buttonBg: "#FFFFFF", buttonText: "#795437",
      surface: "#f4eee4", text: "#463323", image: IMAGE_BY_ID.foundingDay,
      taglines: {
        customer: "من جذور المجد… تبدأ حكايات الإنجاز.",
        owner: "من أصالة الماضي… إلى قوة العطاء.",
        projects: "على خطى المجد… نواصل بناء المستقبل."
      }
    },
    eidAdha: {
      name: "عيد الأضحى", primary: "#2876B9", accent: "#c6a15b",
      buttonBg: "#FFFFFF", buttonText: "#2876B9",
      surface: "#f5f1e7", text: "#26392d", image: IMAGE_BY_ID.eidAdha,
      taglines: {
        customer: "عيد أضحى مبارك… واجعل إنجازك يكتمل.",
        owner: "أضحى مبارك… واجعل من عطائك إنجازاً.",
        projects: "عيد الأضحى… موسم الخير واكتمال الإنجاز."
      }
    }
  };
  let activeIdentity = "classic";
  let loadPromise = null;
  let initialized = false;
  const CACHE_KEY = "athar.activeIdentity.v1";

  function readCachedIdentity(){
    try {
      const raw = window.localStorage?.getItem(CACHE_KEY);
      if (!raw) return null;
      try {
        const saved = JSON.parse(raw);
        if (defaults[saved?.key]) return {key:saved.key, updatedAtMs:Number(saved.updatedAtMs)||0};
      } catch (_) {}
      return defaults[raw] ? {key:raw, updatedAtMs:0} : null;
    } catch (_) { return null; }
  }

  function cacheIdentity(key, updatedAtMs=Date.now()){
    if (!defaults[key]) return;
    try { window.localStorage?.setItem(CACHE_KEY, JSON.stringify({key, updatedAtMs})); } catch (_) {}
  }

  function status(message, bad=false){
    const el = $("atharIdentityStatus");
    if (!el) return;
    el.textContent = message;
    el.dataset.error = bad ? "1" : "0";
  }

  function motifFor(key, color){
    const shapes = {
      eidFitr: '<path d="M34 12c-20 15-14 43 9 51-29 0-43-34-20-50 4-3 7-3 11-1z"/><path d="M118 10l7 14 15 7-15 7-7 14-7-14-15-7 15-7z M190 18v13m-10-13h20l-3 25h-14z"/>',
      nationalDay: '<path d="M15 42l17-17 17 17-17 17z M190 42l17-17 17 17-17 17z M83 17h74l-37 37z M83 63h74l-37-18z"/>',
      foundingDay: '<path d="M18 65V36l18-18 18 18v29 M26 65V42h20v23 M186 65V36l18-18 18 18v29 M194 65V42h20v23"/><circle cx="120" cy="40" r="24"/><path d="M120 16v48M96 40h48"/>',
      eidAdha: '<path d="M24 45c-8-9-2-23 11-23 5-13 22-13 28-2 13-3 22 10 15 22-2 13-22 18-36 9-8 3-15 0-18-6z M120 12l7 13 14 7-14 7-7 13-7-13-14-7 14-7z M195 17l6 12 13 6-13 6-6 12-6-12-13-6 13-6z"/>',
      classic: '<path d="M12 55h55l-5-16H31l-9 9H12z M28 39l7-16h24l8 16 M104 55h55l-5-16h-31l-9 9h-10z M120 39l7-16h24l8 16"/>'
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80"><g fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".16">${shapes[key] || shapes.classic}</g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  function ensureThemeStyle(){
    if ($("athar-identity-global-style")) return;
    const style = document.createElement("style");
    style.id = "athar-identity-global-style";
    style.textContent = `
      /* ATHAR 2027: جميع خلفيات التطبيق والشاشات والبطاقات بيضاء. */
      html,body{background:#fff!important;background-color:#fff!important}
      body{position:relative;isolation:isolate;color:var(--athar-identity-text,#191919)}
      body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:#fff!important;background-image:none!important}
      .screen,.screen.ma3da-published-background{
        box-sizing:border-box!important;background:#fff!important;background-color:#fff!important;
        background-image:
          radial-gradient(circle at 8% 18%,color-mix(in srgb,var(--athar-identity-accent,#c8a45b) 20%,transparent) 0 1px,transparent 2px),
          radial-gradient(circle at 92% 82%,color-mix(in srgb,var(--athar-identity-accent,#c8a45b) 20%,transparent) 0 1px,transparent 2px),
          linear-gradient(135deg,rgba(255,255,255,0),rgba(255,255,255,.92))!important;
        background-size:24px 24px,24px 24px,auto!important;background-repeat:repeat,repeat,no-repeat!important;
        color:var(--athar-identity-text,#191919)!important;
        border:2px solid var(--athar-identity-frame,#c8a45b)!important;
        border-radius:20px!important;
      }
      /* الشاشات الكبيرة والصغيرة والبطاقات الداخلية: أبيض مع إطار الهوية. */
      .screen .card,.screen .panel,.screen .section-card,.screen .content-card,
      .screen .info-card,.screen .menu-card,.screen .dashboard-card,
      .screen .request-card,.screen .order-card,.screen .stat-card,
      .screen .form-card,.screen .settings-card,.screen .invoice-card,
      .screen .equipment-card,.screen .project-card,.screen .support-card,
      .screen [class*="card"],.screen [class*="panel"]{
        box-sizing:border-box!important;background:#fff!important;background-color:#fff!important;
        background-image:none!important;border:1.5px solid var(--athar-identity-frame,#c8a45b)!important;
        color:var(--athar-identity-text,#191919)!important;
      }
      .screen input,.screen select,.screen textarea{
        background:#fff!important;color:#191919!important;
        border-color:var(--athar-identity-frame,#c8a45b)!important;
      }
      /* ATHAR | بطاقة الشاشة الصغيرة أعلى الصفحات الرئيسية الثلاث. */
      .athar-home-identity-panel{
        position:relative!important;isolation:isolate!important;overflow:hidden!important;
        display:flex!important;flex-direction:column!important;align-items:center!important;
        justify-content:center!important;gap:8px!important;
        width:100%!important;min-height:116px!important;box-sizing:border-box!important;
        margin:4px auto 18px!important;padding:17px 14px 16px!important;
        background:#fff!important;border:2px solid var(--athar-identity-frame,#c8a45b)!important;
        border-radius:18px!important;text-align:center!important;
        box-shadow:0 5px 18px rgba(30,30,30,.055),inset 0 0 0 4px rgba(255,255,255,.9)!important;
      }
      .athar-home-identity-panel:before,.athar-home-identity-panel:after{
        content:""!important;position:absolute!important;z-index:-1!important;pointer-events:none!important;
      }
      .athar-home-identity-panel:before{
        inset:0!important;opacity:.42!important;
        background-image:
          var(--athar-page-ornament,var(--athar-button-ornament)),
          linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.95))!important;
        background-size:220px 72px,100% 100%!important;
        background-repeat:repeat,no-repeat!important;
        background-position:center center,center!important;
      }
      .athar-home-identity-panel:after{
        width:76px!important;height:2px!important;bottom:10px!important;left:calc(50% - 38px)!important;
        background:linear-gradient(90deg,transparent,var(--athar-identity-accent,#c8a45b),transparent)!important;
      }
      .athar-home-identity-title{
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        max-width:100%!important;padding:7px 18px!important;margin:0!important;
        border:1px solid var(--athar-identity-frame,#c8a45b)!important;border-radius:999px!important;
        background:#fff!important;color:var(--athar-identity-primary,#171717)!important;
        font-size:clamp(16px,3.8vw,20px)!important;font-weight:900!important;line-height:1.35!important;
      }
      #contractorHomeScreen .athar-home-account-name{display:block!important;color:var(--athar-identity-primary,#171717)!important;font-size:21px!important;font-weight:900!important;line-height:1.4!important}
      .athar-home-identity-slogan{
        display:block!important;max-width:100%!important;margin:0!important;padding:0 5px 5px!important;
        color:#bd8b35!important;font-size:clamp(17px,4.4vw,23px)!important;
        font-weight:900!important;line-height:1.5!important;text-align:center!important;
        text-wrap:balance!important;text-shadow:0 1px 0 rgba(255,255,255,.95)!important;
      }
      /* تكبير بطاقة صاحب المعدة فقط؛ لا تتأثر واجهتا العميل والمشاريع. */
      #operatorHomeScreen .athar-home-identity-panel,#contractorHomeScreen .athar-home-identity-panel{
        min-height:172px!important;gap:12px!important;padding:24px 16px 22px!important;margin:4px auto 22px!important;
      }
      #operatorHomeScreen .athar-home-identity-title,#contractorHomeScreen .athar-home-identity-title{font-size:clamp(21px,5vw,27px)!important;padding:9px 23px!important}
      #operatorHomeScreen .athar-home-identity-slogan,#contractorHomeScreen .athar-home-identity-slogan{font-size:clamp(23px,5.8vw,31px)!important;line-height:1.55!important;padding-bottom:7px!important}
      #operatorHomeScreen .athar-home-account-name{
        display:block!important;max-width:100%!important;color:var(--athar-identity-primary,#171717)!important;
        font-size:clamp(19px,4.8vw,25px)!important;font-weight:900!important;line-height:1.4!important;
      }
      @media(max-width:420px){
        #operatorHomeScreen .athar-home-identity-panel,#contractorHomeScreen .athar-home-identity-panel{min-height:158px!important;padding:20px 12px 19px!important}
        #operatorHomeScreen .athar-home-identity-title,#contractorHomeScreen .athar-home-identity-title{font-size:21px!important}
        #operatorHomeScreen .athar-home-identity-slogan,#contractorHomeScreen .athar-home-identity-slogan{font-size:23px!important}
        #operatorHomeScreen .athar-home-account-name,#contractorHomeScreen .athar-home-account-name{font-size:19px!important}
      }
      html[data-athar-identity="nationalDay"] .athar-home-identity-panel{
        border-width:2.5px!important;background:linear-gradient(110deg,#fff 0%,#f8fcf8 50%,#fff 100%)!important;
      }
      html[data-athar-identity="foundingDay"] .athar-home-identity-panel{
        background:linear-gradient(110deg,#fff 0%,#fbf6ee 50%,#fff 100%)!important;
      }
      html[data-athar-identity="eidFitr"] .athar-home-identity-panel,
      html[data-athar-identity="eidAdha"] .athar-home-identity-panel{
        background:linear-gradient(110deg,#fff 0%,#f5faff 50%,#fff 100%)!important;
      }
      html[data-athar-identity="classic"] .athar-home-identity-panel{
        background:linear-gradient(110deg,#fff 0%,#fffdf8 50%,#fff 100%)!important;
      }
      @media(max-width:420px){
        .athar-home-identity-panel{min-height:108px!important;padding:14px 10px 13px!important;margin-bottom:15px!important}
        .athar-home-identity-title{font-size:16px!important;padding:6px 15px!important}
        .athar-home-identity-slogan{font-size:17px!important;line-height:1.45!important}
      }
      /* كل شاشة مطلوبة تظهر كلوحة بيضاء واحدة بإطار الهوية النشطة. */
      #roleScreen,#phoneScreen,#customerHomeScreen,#operatorHomeScreen,#contractorHomeScreen{
        box-sizing:border-box!important;background:#fff!important;color:var(--athar-identity-text,#191919)!important;
        border:3px solid var(--athar-identity-frame,#c8a45b)!important;border-radius:22px!important;
        padding:18px!important;box-shadow:0 8px 26px rgba(0,0,0,.07)!important;
      }
      #roleScreen .hero,#roleScreen>.card,#phoneScreen .hero,#phoneScreen>.card{
        box-sizing:border-box!important;background:transparent!important;border:0!important;border-radius:0!important;
        box-shadow:none!important;color:var(--athar-identity-text,#191919)!important;
      }
      #roleScreen .hero,#phoneScreen .hero{padding:12px 8px 18px!important}
      #roleScreen>.card,#phoneScreen>.card{padding:12px 8px!important}
      /* لوحة اليوم الوطني أعلى الشاشات المحددة فقط؛ بقية الهويات لا تتأثر. */
      html[data-athar-identity="nationalDay"] #roleScreen .hero,
      html[data-athar-identity="nationalDay"] #phoneScreen .hero,
      html[data-athar-identity="nationalDay"] #customerHomeScreen .home-header,
      html[data-athar-identity="nationalDay"] #operatorHomeScreen .operator-dashboard-header,
      html[data-athar-identity="nationalDay"] #contractorHomeScreen>.hero{
        position:relative!important;isolation:isolate!important;overflow:hidden!important;
        min-height:190px!important;padding:26px 18px!important;margin:0 0 18px!important;
        border:1px solid rgba(255,255,255,.58)!important;border-radius:18px!important;
        background-color:#e8f0e8!important;
        background-image:linear-gradient(90deg,rgba(255,255,255,.24),rgba(255,255,255,.42)),url("ATHAR-National-Day-Login.png")!important;
        background-size:cover!important;background-position:center 28%!important;background-repeat:no-repeat!important;
        box-shadow:0 8px 24px rgba(12,49,35,.16)!important;
      }
      html[data-athar-identity="nationalDay"] #roleScreen .hero h1,
      html[data-athar-identity="nationalDay"] #roleScreen .hero p,
      html[data-athar-identity="nationalDay"] #phoneScreen .hero h1,
      html[data-athar-identity="nationalDay"] #phoneScreen .hero p,
      html[data-athar-identity="nationalDay"] #customerHomeScreen .home-header h1,
      html[data-athar-identity="nationalDay"] #customerHomeScreen .home-header p,
      html[data-athar-identity="nationalDay"] #operatorHomeScreen .operator-dashboard-header h1,
      html[data-athar-identity="nationalDay"] #operatorHomeScreen .operator-dashboard-header p,
      html[data-athar-identity="nationalDay"] #contractorHomeScreen>.hero h1,
      html[data-athar-identity="nationalDay"] #contractorHomeScreen>.hero p{
        color:#123d2c!important;text-shadow:0 1px 8px rgba(255,255,255,.72)!important
      }
      /* إزالة الإطارات الداخلية القديمة حتى لا تظهر حدود مزدوجة. */
      #customerHomeScreen .home-page,#operatorHomeScreen .operator-dashboard{
        box-sizing:border-box!important;background:transparent!important;border:0!important;border-radius:0!important;
        padding:0!important;box-shadow:none!important;color:var(--athar-identity-text,#191919)!important;
      }
      #contractorHomeScreen .hero,#contractorHomeScreen .contractor-grid{color:var(--athar-identity-text,#191919)!important}
      /* عناوين الشاشات ونصوص التعريف تتبع لون الهوية، وبقية النص يبقى داكنًا للقراءة. */
      #roleScreen h1,#roleScreen .hero p,#phoneScreen h1,#phoneScreen .hero p,
      #customerHomeScreen h1,#operatorHomeScreen h1,#contractorHomeScreen h1{
        color:var(--athar-identity-primary,#171717)!important
      }
      #roleScreen,#phoneScreen,#customerHomeScreen,#operatorHomeScreen,#contractorHomeScreen{
        color:var(--athar-identity-text,#191919)!important
      }
      body button:not(.athar-identity-card),body .btn,body [role="button"],body input[type="button"],body input[type="submit"],body input[type="reset"],body a.button,body a.btn,body .main-btn,body .primary-btn,body .secondary-btn,body .action-btn,body .tab-btn,body .nav-btn,body .home-request-btn,body .home-menu-item{
        background:var(--athar-button-bg,#D6B45E)!important;background-image:var(--athar-button-ornament),linear-gradient(var(--athar-button-bg,#D6B45E),var(--athar-button-bg,#D6B45E))!important;background-repeat:no-repeat!important;background-size:220px 72px,auto!important;background-position:center center,center!important;color:var(--athar-button-text,#171717)!important;border-color:var(--athar-identity-accent,#c8a45b)!important;font-family:inherit!important
      }
      /* صفحة العميل: فرض لون الهوية على نصوص الأزرار الداخلية أيضاً */
      #customerHomeScreen button:not(.athar-identity-card),#customerHomeScreen .home-menu-item,#customerHomeScreen .home-request-btn{
        background-color:var(--athar-button-bg,#D6B45E)!important;background-image:var(--athar-button-ornament),linear-gradient(var(--athar-button-bg,#D6B45E),var(--athar-button-bg,#D6B45E))!important;color:var(--athar-button-text,#171717)!important;border-color:var(--athar-identity-accent,#c8a45b)!important
      }
      #customerHomeScreen .home-menu-item .home-menu-text,#customerHomeScreen .home-menu-item .home-menu-text *,#customerHomeScreen .home-menu-item .home-arrow,#customerHomeScreen .home-request-btn *{
        color:var(--athar-button-text,#171717)!important
      }
      body .screen button:not(.athar-identity-card) *,body .screen [role="button"] *,body .screen a.button *,body .screen a.btn *{color:var(--athar-button-text,#171717)!important}
      button:not(.athar-identity-card):not(:disabled),.btn,[role="button"],a.button,a.btn{box-shadow:0 2px 9px rgba(0,0,0,.045)}
      button:disabled,input:disabled{opacity:.58}
      .athar-identity-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin:18px 0}
      .athar-identity-card{position:relative;display:block;overflow:hidden;width:100%;padding:0!important;min-width:0;border:2px solid #e6dfd2!important;border-radius:16px!important;background:#fff!important;color:#171717!important;text-align:right;cursor:pointer;box-shadow:0 3px 14px rgba(0,0,0,.07)}
      .athar-identity-card img{display:block;width:100%;height:150px;object-fit:cover;background:#f5f2ec}
      .athar-identity-card-caption{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 12px;background:#fff}
      .athar-identity-card-caption strong{font-size:14px;color:#222}
      .athar-identity-card-caption small{font-size:11px;color:#777;white-space:nowrap}
      .athar-identity-card.is-active{border-color:var(--athar-identity-accent,#c8a45b)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--athar-identity-accent,#c8a45b) 25%,transparent),0 5px 18px rgba(0,0,0,.09)}
      .athar-identity-card.is-active .athar-identity-card-caption small{color:var(--athar-identity-primary);font-weight:800}
      .athar-identity-base-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;margin:12px 0;border:1px solid #e7dfd0;border-radius:14px;background:#fff}
      .athar-identity-base-row strong,.athar-identity-base-row small{display:block}
      .athar-identity-base-row small{margin-top:4px;color:#777;font-size:12px}
      #atharIdentityStatus{min-height:24px;margin-top:12px;color:var(--athar-identity-primary)}
      #atharIdentityStatus[data-error="1"]{color:#a32626}
      @media(max-width:420px){.athar-identity-card img{height:116px}.athar-identity-card-caption{align-items:flex-start;flex-direction:column;gap:4px}.athar-identity-base-row{align-items:stretch;flex-direction:column}.athar-identity-base-row button{width:100%}}

      /* ATHAR FIX: الزخرفة نفسها تنتقل إلى كل الشاشات الداخلية والبطاقات الصغيرة. */
      html[data-athar-identity] body .screen,
      html[data-athar-identity] body .screen .card:not(.athar-identity-card),
      html[data-athar-identity] body .screen .panel,
      html[data-athar-identity] body .screen .section-card,
      html[data-athar-identity] body .screen .content-card,
      html[data-athar-identity] body .screen .info-card,
      html[data-athar-identity] body .screen .menu-card,
      html[data-athar-identity] body .screen .dashboard-card,
      html[data-athar-identity] body .screen .request-card,
      html[data-athar-identity] body .screen .order-card,
      html[data-athar-identity] body .screen .stat-card,
      html[data-athar-identity] body .screen .form-card,
      html[data-athar-identity] body .screen .settings-card,
      html[data-athar-identity] body .screen .invoice-card,
      html[data-athar-identity] body .screen .equipment-card,
      html[data-athar-identity] body .screen .project-card,
      html[data-athar-identity] body .screen .support-card,
      html[data-athar-identity] body .screen [class*="card"]:not(.athar-identity-card),
      html[data-athar-identity] body .screen [class*="panel"] {
        background-image:
          var(--athar-page-ornament,var(--athar-button-ornament)),
          linear-gradient(#fff,#fff)!important;
        background-size:220px 72px,100% 100%!important;
        background-position:center center,center!important;
        background-repeat:repeat,no-repeat!important;
        background-color:#fff!important;
      }
      html[data-athar-identity] body .screen {
        background-image:
          var(--athar-page-ornament,var(--athar-button-ornament)),
          linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.92))!important;
        background-size:220px 72px,100% 100%!important;
        background-position:center center,center!important;
        background-repeat:repeat,no-repeat!important;
      }

      /* زخرفة الهوية على كل أنواع الأزرار والروابط التفاعلية، في كل الأدوار والشاشات. */
      html[data-athar-identity] body :is(
        button:not(.athar-identity-card),[role="button"],input[type="button"],input[type="submit"],input[type="reset"],
        a.button,a.btn,.btn,.main-btn,.primary-btn,.secondary-btn,.action-btn,.tab-btn,.nav-btn,
        .home-request-btn,.home-menu-item
      ) {
        background-color:var(--athar-button-bg,#D6B45E)!important;
        background-image:var(--athar-button-ornament),linear-gradient(var(--athar-button-bg,#D6B45E),var(--athar-button-bg,#D6B45E))!important;
        background-repeat:repeat,no-repeat!important;
        background-size:220px 72px,100% 100%!important;
        background-position:center center,center!important;
        color:var(--athar-button-text,#171717)!important;
        border-color:var(--athar-identity-accent,#c8a45b)!important;
      }
      html[data-athar-identity] body :is(
        button:not(.athar-identity-card),[role="button"],a.button,a.btn,.btn,.main-btn,.primary-btn,
        .secondary-btn,.action-btn,.tab-btn,.nav-btn,.home-request-btn,.home-menu-item
      ) :is(span,strong,b,small,i,svg) {
        color:var(--athar-button-text,#171717)!important;
      }
      html[data-athar-identity] body .screen :is(.card,.panel,[class*="card"],[class*="panel"]):not(.athar-identity-card) {
        border-color:var(--athar-identity-frame,#c8a45b)!important;
      }
    `;
    document.head.appendChild(style);
  }

  /* يفرض زخرفة الهوية مباشرة على عناصر التفاعل حتى لا تطغى عليها قواعد CSS الأقدم. */
  function decorateAllControls(root=document){
    const selector = 'button:not(.athar-identity-card),[role="button"],input[type="button"],input[type="submit"],input[type="reset"],a.button,a.btn,.btn,.main-btn,.primary-btn,.secondary-btn,.action-btn,.tab-btn,.nav-btn,.home-request-btn,.home-menu-item';
    const nodes = [];
    if (root.matches?.(selector)) nodes.push(root);
    root.querySelectorAll?.(selector).forEach(node=>nodes.push(node));
    const ornament = activeIdentity === "classic" ? "none" : motifFor(activeIdentity, getComputedStyle(document.documentElement).getPropertyValue("--athar-identity-accent").trim() || "#c8a45b");
    nodes.forEach(node=>{
      if (node.classList?.contains("athar-identity-card")) return;
      node.style.setProperty("background-color","var(--athar-button-bg,#D6B45E)","important");
      node.style.setProperty("background-image",`${ornament},linear-gradient(var(--athar-button-bg,#D6B45E),var(--athar-button-bg,#D6B45E))`,"important");
      node.style.setProperty("background-repeat","repeat,no-repeat","important");
      node.style.setProperty("background-size","220px 72px,100% 100%","important");
      node.style.setProperty("background-position","center center,center","important");
      node.style.setProperty("color","var(--athar-button-text,#171717)","important");
      node.style.setProperty("border-color","var(--athar-identity-accent,#c8a45b)","important");
    });
  }

  function decorateAllScreens(){
    document.querySelectorAll(".screen").forEach(screen=>screen.classList.add("athar-ornamented-screen"));
    decorateAllControls(document);
  }

  function updateCards(){
    document.querySelectorAll(".athar-identity-card[data-identity]").forEach(card=>{
      const active = card.dataset.identity === activeIdentity;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
      const label = card.querySelector("[data-active-label]");
      if (label) label.textContent = active ? "الهوية النشطة ✓" : "تفعيل الهوية";
    });
  }

  function apply(key){
    const identity = defaults[key] || defaults.classic;
    activeIdentity = defaults[key] ? key : "classic";
    ensureThemeStyle();
    const root = document.documentElement;
    root.dataset.atharIdentity = activeIdentity;
    root.style.setProperty("--athar-identity-primary", identity.primary);
    root.style.setProperty("--athar-identity-accent", identity.accent);
    const frameColor = ({
      nationalDay: "#79B98A",
      foundingDay: "#C8A45B",
      eidFitr: "#2876B9",
      eidAdha: "#2876B9",
      classic: "#C8A45B"
    })[activeIdentity] || "#C8A45B";
    root.style.setProperty("--athar-identity-frame", frameColor);
    root.style.setProperty("--athar-button-bg", identity.buttonBg || "#D6B45E");
    root.style.setProperty("--athar-button-text", identity.buttonText || "#171717");
    root.style.setProperty("--athar-identity-surface", identity.surface);
    root.style.setProperty("--athar-identity-text", identity.text);
    root.style.setProperty("--athar-identity-image", identity.image ? `url("${identity.image}")` : "none");
    const activeMotif = motifFor(activeIdentity, identity.accent);
    const activeButtonMotif = activeIdentity === "classic" ? "none" : activeMotif;
    root.style.setProperty("--athar-button-ornament", activeButtonMotif);
    // نقوش الصفحات تتبع الهوية؛ الهوية الأساسية أزرارها بيضاء بلا نقوش.
    root.style.setProperty("--athar-page-ornament", activeMotif);
    // تحديث كل الأزرار والشاشات عند كل تبديل للهوية، وليس صفحة العميل فقط.
    decorateAllScreens();
    /* بطاقة صغيرة موحدة: عنوان الصفحة الرئيسية والعبارة التي اعتمدها المستخدم. */
    [
      ["customerHomeScreen","customer"],
      ["operatorHomeScreen","owner"],
      ["contractorHomeScreen","projects"]
    ].forEach(([id, role])=>{
      const page = $(id);
      if (!page) return;
      // إزالة العبارة القديمة التي كانت تُضاف داخل الهيدر حتى لا تتكرر.
      page.querySelectorAll(".athar-home-tagline").forEach(node=>node.remove());
      const existingPanels = Array.from(page.querySelectorAll(".athar-home-identity-panel"));
      let panel = existingPanels.shift() || null;
      // احتفظ بلوحة واحدة فقط؛ يمنع تكرار بطاقة الصفحة الرئيسية داخل صفحة صاحب المعدة.
      existingPanels.forEach(extra => extra.remove());
      if (!panel){
        panel = document.createElement("section");
        panel.className = "athar-home-identity-panel";
        panel.setAttribute("aria-label","الصفحة الرئيسية");
        const title = document.createElement("h2");
        title.className = "athar-home-identity-title";
        title.textContent = "الصفحة الرئيسية";
        const slogan = document.createElement("p");
        slogan.className = "athar-home-identity-slogan";
        // اربط العبارة بالهوية النشطة والدور الحالي بدل النص الثابت.
        slogan.textContent = identity.taglines?.[role] || defaults.classic.taglines[role] || "";
        panel.append(title,slogan);
        if (role === "owner" || role === "projects") {
          const accountName = document.createElement("span");
          accountName.className = "athar-home-account-name";
          accountName.id = role === "owner" ? "atharOperatorAccountName" : "atharContractorAccountName";
          const profile = role === "projects" ? (window.contractorGetProfile?.() || {}) : {};
          accountName.textContent = role === "owner"
            ? (document.getElementById("operatorHomeName")?.textContent?.trim() || window.ma3daAuth?.currentUser?.displayName || "صاحب المعدة")
            : (profile.name || profile.contractorName || profile.fullName || profile.displayName || window.ma3daAuth?.currentUser?.displayName || "");
          panel.appendChild(accountName);
        }
        page.insertBefore(panel,page.firstChild);
      } else {
        const title = panel.querySelector(".athar-home-identity-title");
        const slogan = panel.querySelector(".athar-home-identity-slogan");
        if (title) title.textContent = "الصفحة الرئيسية";
        // حدّث العبارة نفسها عند كل تبديل للهوية.
        if (slogan) slogan.textContent = identity.taglines?.[role] || defaults.classic.taglines[role] || "";
        if (role === "owner" || role === "projects") {
          let accountName = panel.querySelector(".athar-home-account-name");
          if (!accountName) {
            accountName = document.createElement("span");
            accountName.className = "athar-home-account-name";
            accountName.id = role === "owner" ? "atharOperatorAccountName" : "atharContractorAccountName";
            panel.appendChild(accountName);
          }
          const profile = role === "projects" ? (window.contractorGetProfile?.() || {}) : {};
          const registeredName = role === "owner"
            ? (window.ma3daAuth?.currentUser?.displayName || "صاحب المعدة")
            : (profile.name || profile.contractorName || profile.fullName || profile.displayName || window.ma3daAuth?.currentUser?.displayName || "");
          if (registeredName && (!accountName.textContent || accountName.textContent === "صاحب المعدة")) accountName.textContent = registeredName;
        }
      }
      panel.dataset.homeRole = role;
    });
    updateCards();
  }

  async function persist(key){
    if (!window.ma3daAuth?.currentUser) throw new Error("سجّل الدخول بحساب مالك المنصة أولًا.");
    const user = window.ma3daAuth.currentUser;
    if (!user.emailVerified) throw new Error("يجب توثيق البريد الإلكتروني لحساب المالك قبل اعتماد الهوية.");
    // احفظ الاختيار محلياً فوراً حتى لا يعود إلى الهوية الأساسية إذا تعذرت قراءة Firebase بعد التحديث.
    const updatedAtMs = Date.now();
    cacheIdentity(key, updatedAtMs);
    apply(key);
    await window.ma3daFirebaseReady;
    const ref = window.ma3daDoc(window.ma3daDB, COL, DOC);
    await window.ma3daSetDoc(ref, {
      activeAtharIdentity: key,
      atharIdentityUpdatedAt: new Date(updatedAtMs),
      atharIdentityUpdatedAtMs: updatedAtMs,
      atharIdentityUpdatedBy: user.uid
    }, {merge:true});
    status(key === "classic" ? "تمت استعادة هوية آثار الأساسية وحفظها على المنصة." : `تم تفعيل هوية ${defaults[key].name} على المنصة وحفظها بنجاح.`);
  }

  async function activate(key){
    if (!defaults[key]) return;
    status("جارٍ حفظ الهوية وتفعيلها…");
    try { await persist(key); }
    catch (error){ console.error("تعذر تفعيل هوية آثار:", error); status(error?.message || "تعذر حفظ الهوية. تحقق من اتصال Firebase والصلاحيات.", true); }
  }

  async function load(){
    if (loadPromise) return loadPromise;
    loadPromise = (async()=>{
      const cached = readCachedIdentity();
      const cachedKey = cached?.key || null;
      // أظهر آخر اختيار معروف فوراً، ثم قارنه بآخر تحديث محفوظ على المنصة.
      if (cachedKey){
        apply(cachedKey);
        status(`الهوية المحفوظة على هذا الجهاز: ${defaults[cachedKey].name}`);
      }
      try{
        await window.ma3daFirebaseReady;
        if (typeof window.ma3daGetCurrentUser === "function") {
          try { await window.ma3daGetCurrentUser(); } catch (_) {}
        }
        const ref = window.ma3daDoc(window.ma3daDB, COL, DOC);
        const snap = await window.ma3daGetDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        const remoteKey = defaults[data.activeAtharIdentity] ? data.activeAtharIdentity : null;
        const remoteUpdatedAtMs = Number(data.atharIdentityUpdatedAtMs) || 0;
        const cacheIsNewer = !!cachedKey && cached.updatedAtMs > remoteUpdatedAtMs;
        const key = (cacheIsNewer ? cachedKey : remoteKey) || cachedKey || "classic";
        cacheIdentity(key, Math.max(remoteUpdatedAtMs, cached?.updatedAtMs || 0));
        apply(key);
        status(`الهوية النشطة: ${defaults[key].name}`);
      }catch(error){
        console.warn("تعذر تحميل الهوية العامة لآثار:", error);
        const fallbackKey = cachedKey || "classic";
        apply(fallbackKey);
        status(cachedKey
          ? `تم استرجاع هوية ${defaults[fallbackKey].name} من هذا الجهاز؛ تعذرت مزامنتها مع المنصة.`
          : "تعذرت قراءة الهوية المحفوظة ولا توجد نسخة محلية؛ عُرضت الهوية الأساسية.", true);
      }
      return activeIdentity;
    })();
    try { return await loadPromise; }
    finally { loadPromise = null; }
  }

  function init(){
    if (initialized) return;
    initialized = true;
    // الشاشات والأزرار التي تُنشأ لاحقاً تأخذ الزخرفة نفسها تلقائياً.
    decorateAllScreens();
    if (document.body && !window.__atharOrnamentObserver) {
      window.__atharOrnamentObserver = new MutationObserver(records=>{
        records.forEach(record=>record.addedNodes.forEach(node=>{
          if (node.nodeType === 1) {
            if (node.matches?.(".screen")) node.classList.add("athar-ornamented-screen");
            decorateAllControls(node);
          }
        }));
      });
      window.__atharOrnamentObserver.observe(document.body,{childList:true,subtree:true});
    }
    // ربط بالنقر التفويضي حتى تعمل البطاقات حتى لو أُنشئت لوحة التحكم لاحقاً.
    document.addEventListener("click", event=>{
      const card = event.target.closest?.(".athar-identity-card[data-identity]");
      if (card){ activate(card.dataset.identity); return; }
      if (event.target.closest?.("#atharIdentityReset")) activate("classic");
    });
    load();
  }

  window.ma3daLoadAtharIdentities = load;
  window.addEventListener("storage", event=>{
    if (event.key !== CACHE_KEY) return;
    const key = readCachedIdentity()?.key || "classic";
    apply(key);
    status(`الهوية النشطة: ${defaults[key].name}`);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
  window.addEventListener("load", init, {once:true});
})();


/* ATHAR — روابط تذييل صفحة اختيار طريقة الاستخدام */
(function initAtharRoleFooter(){
  function bind(){
    const dialog=document.getElementById("atharFooterInfoDialog");
    const title=document.getElementById("atharFooterDialogTitle");
    const message=document.getElementById("atharFooterDialogMessage");
    const close=document.getElementById("atharFooterDialogClose");
    if(!dialog||dialog.dataset.bound==="1") return;
    dialog.dataset.bound="1";
    const descriptions={
      "مسؤوليتنا":"نلتزم في آثار بحماية معلومات المستخدمين والتعامل معها بسرية، وتوفير تجربة موثوقة، وتوضيح مسؤوليات المنصة وحدود خدماتها، والاستجابة للبلاغات وفق السياسات المعتمدة. © جميع الحقوق محفوظة لآثار ATHAR – 2026.",
      "حقوقنا":"نلتزم في آثار بحماية معلومات المستخدمين والتعامل معها بسرية، وتوفير تجربة موثوقة، وتوضيح مسؤوليات المنصة وحدود خدماتها، والاستجابة للبلاغات وفق السياسات المعتمدة. © جميع الحقوق محفوظة لآثار ATHAR – 2026.",
      "رؤيتنا":"نسعى في آثار إلى تسهيل الوصول إلى الخدمات والمعدات ودعم إنجاز المشاريع بكفاءة وثقة.",
      "من نحن":"آثار منصة رقمية تربط العملاء بأصحاب المعدات والمشغلين وأصحاب المشاريع في مكان واحد.",
      "تواصل معنا":"يمكنك التواصل مع فريق آثار عبر قنوات الدعم المعتمدة داخل التطبيق."
    };
    document.addEventListener("click",event=>{
      const button=event.target.closest?.("[data-athar-footer]");
      if(!button) return;
      const section=button.dataset.atharFooter||"آثار";
      if(title) title.textContent=section;
      if(message) message.textContent=descriptions[section]||"آثار ATHAR";
      if(typeof dialog.showModal==="function") dialog.showModal();
      else dialog.setAttribute("open","");
    });
    close?.addEventListener("click",()=>dialog.close?.());
    dialog.addEventListener("click",event=>{if(event.target===dialog) dialog.close?.();});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",bind,{once:true});
  else bind();
})();


/* ATHAR — مراجعة تسجيل أصحاب المعدات ومسؤولي المشاريع */
(function initAtharRegistrationReview(){
  if(window.__atharRegistrationReviewBound)return;
  window.__atharRegistrationReviewBound=true;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pending=()=>{try{return JSON.parse(localStorage.getItem('atharPendingRegistration')||'null')}catch(_){return null}};
  const user=async()=>{await Promise.resolve(window.ma3daFirebaseReady);return window.ma3daAuth?.currentUser||(await window.ma3daGetCurrentUser?.());};
  const collection=()=>window.ma3daCollection(window.ma3daDB,'registrationRequests');
  async function rows(){if(!window.ma3daDB||!window.ma3daGetDocs)throw new Error('Firebase غير جاهز');const snap=await window.ma3daGetDocs(collection());return snap.docs.map(d=>({id:d.id,...(d.data()||{})}));}
  let selectedSupportRegistration=null;
  let selectedOwnerRegistration=null;
  const dateLabel=value=>{if(!value)return 'غير مسجل';const d=typeof value==='number'?new Date(value):(value?.toDate?value.toDate():new Date(value));return Number.isNaN(d.getTime())?'غير مسجل':d.toLocaleString('ar-SA');};
  const isImageKey=key=>/(image|photo|picture|avatar|صورة)/i.test(String(key||''));
  const renderReviewValue=(key,value)=>{
    if(value===null||value===undefined||value==='')return '';
    if(typeof value==='string'){
      const v=value.trim();
      if(/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(v))return `<div class="athar-review-file"><b>${esc(key)}</b><a href="${esc(v)}" target="_blank" rel="noopener"><img src="${esc(v)}" alt="${esc(key)}" loading="lazy"></a><a href="${esc(v)}" target="_blank" rel="noopener">فتح الصورة بالحجم الكامل</a></div>`;
      if(/^data:application\/pdf/i.test(v))return `<div class="athar-review-file"><b>${esc(key)}</b><a href="${esc(v)}" target="_blank" rel="noopener">فتح المستند PDF</a></div>`;
      if(/^https?:\/\//i.test(v)){
        const image=isImageKey(key)||/\.(png|jpe?g|webp|gif)(?:[?#]|$)/i.test(v);
        const pdf=/\.pdf(?:[?#]|$)/i.test(v);
        return image?`<div class="athar-review-file"><b>${esc(key)}</b><a href="${esc(v)}" target="_blank" rel="noopener"><img src="${esc(v)}" alt="${esc(key)}" loading="lazy"></a><a href="${esc(v)}" target="_blank" rel="noopener">فتح الملف بالحجم الكامل</a></div>`:`<div class="athar-review-field"><b>${esc(key)}</b><a href="${esc(v)}" target="_blank" rel="noopener">${pdf?'فتح مستند PDF':'فتح الرابط / المرفق'}</a></div>`;
      }
      if(v.length>1200)return `<div class="athar-review-field"><b>${esc(key)}</b><span>مرفق طويل محفوظ في السجل (تعذر عرضه كنص).</span></div>`;
      return `<div class="athar-review-field"><b>${esc(key)}</b><span>${esc(v)}</span></div>`;
    }
    if(typeof value==='number'||typeof value==='boolean')return `<div class="athar-review-field"><b>${esc(key)}</b><span>${esc(String(value))}</span></div>`;
    if(Array.isArray(value))return `<section class="athar-review-subsection"><h4>${esc(key)}</h4>${value.length?value.map((v,i)=>renderReviewValue(`${key} ${i+1}`,v)).join(''):'<p>لا توجد عناصر.</p>'}</section>`;
    if(typeof value==='object'){
      if(typeof value.toDate==='function')return `<div class="athar-review-field"><b>${esc(key)}</b><span>${esc(dateLabel(value))}</span></div>`;
      const entries=Object.entries(value).filter(([k])=>!['__proto__','constructor','prototype'].includes(k));
      return `<section class="athar-review-subsection"><h4>${esc(key)}</h4>${entries.length?entries.map(([k,v])=>renderReviewValue(k,v)).join(''):'<p>لا توجد بيانات.</p>'}</section>`;
    }
    return '';
  };
  function renderRegistrationDetail(item,kind){
    const target=$(kind==='support'?'supportRegistrationReviewContent':'ownerRegistrationDetailContent');if(!target)return;
    const roleName=item.role==='operator'?'صاحب معدة':'صاحب / مسؤول مشروع';
    const knownRootFields=new Set(['id','personalData','equipment','project','attachments','status','stage','submittedAt','createdAt','createdAtMs','updatedAt','assignedStaff','assignedStaffUid','assignedAt','supportReviewedBy','supportReviewedByUid','supportReviewedAt','supportReason','ownerReviewedBy','ownerReviewedByUid','ownerReviewedAt','ownerReason']);
    const extraRootFields=Object.fromEntries(Object.entries(item).filter(([key])=>!knownRootFields.has(key)));
    const roots=[['البيانات الشخصية',item.personalData||{}],...(item.equipment?[['بيانات المعدة',item.equipment]]:[]),...(item.project?[['بيانات المشروع',item.project]]:[]),...(item.attachments?[['المرفقات',item.attachments]]:[]),['بيانات التسجيل والحالة',{uid:item.uid||'',role:item.role||'',registrationType:item.registrationType||'',status:item.status||'',stage:item.stage||'',submittedAt:dateLabel(item.submittedAt),createdAt:dateLabel(item.createdAt),updatedAt:dateLabel(item.updatedAt),assignedStaff:item.assignedStaff||'',assignedStaffUid:item.assignedStaffUid||'',assignedAt:dateLabel(item.assignedAt),supportReviewedBy:item.supportReviewedBy||'',supportReviewedByUid:item.supportReviewedByUid||'',supportReviewedAt:dateLabel(item.supportReviewedAt),supportReason:item.supportReason||'',ownerReviewedBy:item.ownerReviewedBy||'',ownerReviewedByUid:item.ownerReviewedByUid||'',ownerReviewedAt:dateLabel(item.ownerReviewedAt),ownerReason:item.ownerReason||'',supportNotes:item.supportNotes||''}],...(Object.keys(extraRootFields).length?[['بقية بيانات السجل',extraRootFields]]:[])];
    const ownerCanDecide=['support_approved','pending_owner'].includes(item.status);
    const decisionButtons=kind==='support'?`<button type="button" class="support-btn support-primary" data-athar-support-approve="${esc(item.id)}">قبول مبدئي</button><button type="button" class="support-btn support-danger" data-athar-support-reject="${esc(item.id)}">رفض مبدئي</button>`:ownerCanDecide?`<button type="button" class="support-btn support-primary" data-athar-owner-approve="${esc(item.id)}">اعتماد نهائي</button><button type="button" class="support-btn support-danger" data-athar-owner-reject="${esc(item.id)}">رفض نهائي</button>`:`<p class="support-empty">لا يمكن الاعتماد النهائي قبل إكمال موظف الدعم للمراجعة المبدئية.</p>`;
    target.innerHTML=`<div class="athar-review-detail-head"><div><h3>${kind==='support'?'مراجعة تسجيل':'تفاصيل التسجيل للاعتماد النهائي'} · ${roleName}</h3><p>رقم التسجيل: ${esc(item.id)} · الحالة: ${esc(item.status||'غير محددة')}</p></div></div>${roots.map(([label,data])=>renderReviewValue(label,data)).join('')}<div class="athar-review-decision">${decisionButtons}</div>`;
  }
  function openSupportReview(id,list){const item=list.find(x=>x.id===id);if(!item)return;selectedSupportRegistration=item;renderRegistrationDetail(item,'support');const page=$('supportRegistrationReviewPage');if(page)page.hidden=false;const listEl=$('supportRegistrationsList');if(listEl)listEl.hidden=true;page?.scrollIntoView({behavior:'smooth',block:'start'});}
  function closeSupportReview(){const page=$('supportRegistrationReviewPage');if(page)page.hidden=true;const listEl=$('supportRegistrationsList');if(listEl)listEl.hidden=false;selectedSupportRegistration=null;}
  function renderSupport(list){const target=$('supportRegistrationsList');if(!target)return;const items=list.filter(x=>x.status==='pending_support');if(!items.length){target.innerHTML='<div class="support-empty">لا توجد تسجيلات بانتظار المراجعة المبدئية.</div>';return;}target.innerHTML=items.map(x=>{const p=x.personalData||{},d=x.equipment||x.project||{};return `<article class="support-row"><h3>${x.role==='operator'?'تسجيل صاحب معدة':'تسجيل صاحب / مسؤول مشروع'}</h3><p><b>الاسم:</b> ${esc(p.name)} · <b>الجوال:</b> ${esc(p.phone)} · <b>البريد:</b> ${esc(p.email)}</p><p><b>${x.role==='operator'?'المعدة':'المشروع'}:</b> ${esc(d.type||d.name||d.projectName||'—')} ${esc(d.model||'')} · <b>المدينة:</b> ${esc(d.city||p.city||'—')}</p><p><b>تاريخ الإرسال:</b> ${dateLabel(x.submittedAt||x.createdAt)}</p><button type="button" class="support-btn support-primary" data-athar-support-open="${esc(x.id)}">فتح صفحة التدقيق الكامل</button></article>`}).join('');}
  async function loadSupport(){const authorized=await requireSupportEmployee();if(!authorized)return;const target=$('supportRegistrationsList');if(target)target.textContent='جارٍ تحميل التسجيلات...';try{const list=await rows();const staff=await user();for(const item of list){if(item.status==='pending_support'&&!item.assignedStaffUid){try{await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'registrationRequests',item.id),{assignedStaffUid:staff.uid,assignedStaff:staff.email||staff.uid,assignedAt:Date.now()});item.assignedStaffUid=staff.uid;item.assignedStaff=staff.email||staff.uid;}catch(assignError){console.warn('تعذر إسناد التسجيل لموظف الدعم:',assignError);}}}renderSupport(list)}catch(e){if(target)target.textContent=e.message||'تعذر تحميل التسجيلات.';}}
  window.atharLoadSupportRegistrations=loadSupport;
  function renderOwner(list,mode){const target=$('ownerRegistrationPanelList');if(!target)return;const items=mode==='final'?list.filter(x=>['support_approved','pending_owner'].includes(x.status)):list.filter(x=>!['owner_approved','owner_rejected'].includes(x.status));if(!items.length){target.innerHTML='<div class="support-empty">لا توجد طلبات ضمن هذا القسم.</div>';return;}target.innerHTML=items.map(x=>{const p=x.personalData||{};const wait=Math.max(0,Date.now()-Number(x.submittedAt||x.createdAt||Date.now()));const hours=Math.floor(wait/3600000);return `<article class="support-row"><h3>${x.role==='operator'?'صاحب معدة':'صاحب / مسؤول مشروع'} — ${esc(p.name)}</h3><p>الجوال: ${esc(p.phone)} · البريد: ${esc(p.email)}</p><p>الحالة: ${esc(x.status)} · موظف الدعم: ${esc(x.assignedStaff||x.supportReviewedBy||'غير مسند')}</p><p>مدة الانتظار: ${hours} ساعة · الإنذارات: ${Number(x.alertCount||0)} · التصعيدات: ${Number(x.escalationCount||0)}</p>${x.supportReason?`<p>ملاحظة الدعم: ${esc(x.supportReason)}</p>`:''}<button type="button" class="support-btn" data-athar-owner-open="${esc(x.id)}">عرض البيانات والمرفقات</button></article>`}).join('');}
  async function loadOwner(mode){const target=$('ownerRegistrationPanelList');if(target)target.textContent='جارٍ تحميل الطلبات...';try{renderOwner(await rows(),mode);const panel=$('ownerRegistrationPanel');if(panel)panel.hidden=false;$('ownerRegistrationPanelTitle').textContent=mode==='final'?'الاعتماد النهائي للمسجلين الجدد':'مراقبة الدعم وطلبات التسجيل المتعثرة';}catch(e){if(target)target.textContent=e.message||'تعذر تحميل الطلبات.';}}
  async function decision(id,status,role){
    const supportActive=$('supportDashboardScreen')?.classList.contains('active');
    const ownerActive=$('ownerPortalDashboardScreen')?.classList.contains('active');
    if(role==='support'&&!supportActive)throw new Error('هذا الإجراء مخصص لموظفي الدعم داخل بوابتهم.');if(role==='support'&&!await requireSupportEmployee())throw new Error('يجب تسجيل الدخول بحساب موظف دعم معتمد.');
    if(role==='owner'&&!ownerActive)throw new Error('الاعتماد النهائي مخصص لمالك التطبيق فقط.');
    const u=await user();if(!u?.uid)throw new Error('سجّل الدخول أولاً.');const ref=window.ma3daDoc(window.ma3daDB,'registrationRequests',id);const snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('طلب التسجيل غير موجود.');const x=snap.data()||{};
    if(role==='support'&&x.status!=='pending_support')throw new Error('هذا التسجيل لم يعد بانتظار المراجعة المبدئية. حدّث القائمة.');
    if(role==='owner'&&!['support_approved','pending_owner'].includes(x.status))throw new Error('لا يمكن اتخاذ قرار نهائي قبل قبول موظف الدعم المبدئي.');
    const reason=status.endsWith('rejected')?String(await window.ma3daRequestText?.('سبب الرفض','اكتب سبب الرفض')||prompt('اكتب سبب الرفض:')||'').trim():'';if(status.endsWith('rejected')&&!reason)throw new Error('سبب الرفض مطلوب.');const now=Date.now();const update={status,updatedAt:now};if(role==='support'){update.supportReviewedBy=u.email||u.uid;update.supportReviewedByUid=u.uid;update.supportReviewedAt=now;if(reason)update.supportReason=reason;}else{update.ownerReviewedBy=u.email||u.uid;update.ownerReviewedByUid=u.uid;update.ownerReviewedAt=now;if(reason)update.ownerReason=reason;}
    if(status==='owner_approved'){
      const p=x.personalData||{};if(x.role==='operator'){
        await window.ma3daSetDoc(window.ma3daDoc(window.ma3daDB,'operators',x.uid),{uid:x.uid,operatorId:x.uid,name:p.name||'',phone:p.phone||'',city:p.city||'',email:p.email||u.email||'',approved:true,updatedAt:now},{merge:true});
        await window.ma3daSetDoc(window.ma3daDoc(window.ma3daDB,'equipment',x.uid),{...(x.equipment||{}),ownerId:x.uid,operatorId:x.uid,ownerEmail:p.email||'',availability:(x.equipment||{}).availability||'available',equipmentStatus:'active',verificationStatus:'pending_verification',approved:true,updatedAt:now},{merge:true});
      }else{
        await window.ma3daSetDoc(window.ma3daDoc(window.ma3daDB,'contractors',x.uid),{uid:x.uid,name:p.name||'',phone:p.phone||'',city:p.city||'',company:p.company||'',email:p.email||'',role:'contractor',approved:true,updatedAt:now},{merge:true});
        const project=x.project||{};const projectRef=window.ma3daDoc(window.ma3daDB,'projects',`registration_${x.uid}`);await window.ma3daSetDoc(projectRef,{...project,contractorId:x.uid,ownerId:x.uid,status:'active',createdAt:new Date(now),updatedAt:new Date(now)},{merge:true});
      }
    }
    await window.ma3daUpdateDoc(ref,update);
  }

  document.addEventListener('click',async event=>{
    const t=event.target.closest('button');if(!t)return;
    try{
      if(t.id==='supportRegistrationsRefreshBtn'){await loadSupport();return;}
      if(t.id==='supportRegistrationReviewBackBtn'){closeSupportReview();return;}
      if(t.dataset.atharSupportOpen){const list=await rows();openSupportReview(t.dataset.atharSupportOpen,list);return;}
      if(t.dataset.atharSupportApprove){await decision(t.dataset.atharSupportApprove,'support_approved','support');closeSupportReview();await loadSupport();alert('تم القبول المبدئي وإحالة الطلب لمالك التطبيق.');return;}
      if(t.dataset.atharSupportReject){await decision(t.dataset.atharSupportReject,'support_rejected','support');closeSupportReview();await loadSupport();alert('تم الرفض المبدئي مع حفظ السبب.');return;}
      if(t.id==='ownerFinalRegistrationsBtn'){await loadOwner('final');return;}
      if(t.dataset.atharOwnerOpen){const list=await rows();const item=list.find(x=>x.id===t.dataset.atharOwnerOpen);if(item){selectedOwnerRegistration=item;renderRegistrationDetail(item,'owner');const box=$('ownerRegistrationDetail');if(box)box.hidden=false;box?.scrollIntoView({behavior:'smooth',block:'start'});}return;}
      if(t.id==='ownerRegistrationMonitoringBtn'){await loadOwner('monitor');return;}
      if(t.id==='ownerRegistrationPanelRefreshBtn'){const title=$('ownerRegistrationPanelTitle')?.textContent||'';await loadOwner(title.includes('الاعتماد')?'final':'monitor');return;}
      if(t.dataset.atharOwnerApprove){await decision(t.dataset.atharOwnerApprove,'owner_approved','owner');if($('ownerRegistrationDetail'))$('ownerRegistrationDetail').hidden=true;await loadOwner('final');alert('تم الاعتماد النهائي وإنشاء سجلات الحساب والمعدة أو المشروع.');return;}
      if(t.dataset.atharOwnerReject){await decision(t.dataset.atharOwnerReject,'owner_rejected','owner');if($('ownerRegistrationDetail'))$('ownerRegistrationDetail').hidden=true;await loadOwner('final');alert('تم رفض التسجيل نهائياً مع حفظ السبب.');return;}
      if(t.id==='atharRegistrationSubmittedBackBtn'){if(typeof showScreen==='function')showScreen('phoneScreen');return;}
    }catch(e){console.error('ATHAR registration review:',e);alert(e.message||'تعذر تنفيذ الإجراء. تحقق من صلاحيات Firebase.');}
  });
})();


/* ATHAR English labels for the newly introduced rental lifecycle */
Object.assign(atharEnglishDictionary,{
 'المعدات المتاحة في منطقتك':'Available Equipment in Your Area','المعدات المتاحة':'Available Equipment','المعدات المتاحة بالقرب منك':'Available Equipment Near You','اختر المعدة المناسبة من المعدات المتاحة':'Choose from the available equipment','جاري البحث عن المعدات المتاحة...':'Searching available equipment...','جاري البحث عن المعدات...':'Searching for equipment...','لا توجد معدات متاحة مطابقة':'No matching equipment is available','جرّب نوعًا آخر أو عدّل الموقع/المدة.':'Try another equipment type or adjust location/duration.','تعذر تحميل المعدات':'Could not load equipment','تحقق من الاتصال وصلاحيات Firebase ثم أعد المحاولة.':'Check your connection and Firebase permissions, then try again.','اختيار هذه المعدة':'Select This Equipment','عرض المعدات المتاحة':'Show Available Equipment','تم إرسال طلبك للمعدة المختارة':'Your request has been sent to the selected equipment owner','بانتظار موافقة صاحب المعدة':'Waiting for equipment owner approval','حجز مبلغ الطلب':'Reserve the Booking Amount','ملاحظة للاختبار:':'Test Notice:','خيار النقد هنا تأكيد تجريبي للحجز فقط؛ لا يتم حجز أموال حقيقية أو تحصيلها.':'Cash here is a test booking confirmation only; no real funds are held or collected.','أوافق على تأكيد الحجز التجريبي (كاش)':'I agree to confirm the test booking (cash)','تأكيد الحجز التجريبي':'Confirm Test Booking','حدد الموافقة على الحجز التجريبي أولاً.':'Please agree to the test booking first.','الحجز مؤكد تجريبيًا؛ لا يبدأ العمل حتى يتحقق صاحب المعدة من الرمز.':'Test booking confirmed; work cannot start until the equipment owner verifies the code.','رمز التحقق لبدء العمل':'Verification Code to Start Work','لا تشارك الرمز إلا مع صاحب المعدة عند وصوله للموقع.':'Share the code only with the equipment owner when they arrive at the site.','تحقق رمز العميل':'Verify Customer Code','أدخل الرمز الذي استلمه العميل':'Enter the code received by the customer','تحقق واسمح ببدء العمل':'Verify and Allow Work to Start','أدخل رمزًا من ستة أرقام.':'Enter a six-digit code.','يجب تسجيل الوصول أولًا.':'Arrival must be confirmed first.','رمز التحقق غير صحيح.':'Incorrect verification code.','تم التحقق بنجاح. يمكنك بدء العمل الآن.':'Verification successful. You may start work now.','تحقق من موقعك قبل تأكيد الوصول.':'Check your location before confirming arrival.','تحقق من موقعك قبل تأكيد الوصول.':'Check your location before confirming arrival.','إحداثيات موقع العميل غير متاحة؛ لا يمكن تأكيد الوصول.':'Customer coordinates are unavailable; arrival cannot be confirmed.','تم إنهاء العمل — التسوية التجريبية مكتملة':'Work completed — test settlement is complete','تم تقييم المعدة':'Equipment rated','لا يمكن إنهاء العمل قبل بدء التنفيذ.':'Work cannot be ended before it starts.','التقييم متاح بعد انتهاء العمل والتسوية.':'Rating is available after work and settlement.','الحجز مؤكد — بيانات التواصل ورمز التحقق متاحان':'Booking confirmed — contact details and verification code are available','صاحب المعدة وصل — بانتظار التحقق':'Equipment owner arrived — awaiting verification','تم التحقق — جاهز لبدء العمل':'Verified — ready to start work','انتهى العمل وتمت التسوية التجريبية':'Work completed and test settlement finished','تم تقييم المعدة':'Equipment rated','اعتذر صاحب المعدة عن الطلب.':'The equipment owner declined the request.','لا توجد طلبات حالية':'No current requests','لا توجد طلبات سابقة':'No previous requests','عند تقديم طلب جديد ستظهر تفاصيله هنا.':'Your new requests will appear here.','ستظهر الطلبات المنتهية أو المرفوضة هنا.':'Completed or rejected requests will appear here.','فتح الطلب ومتابعته':'Open and Track Request','المبلغ المحجوز/التقديري:':'Reserved / Estimated Amount:','رقم الطلب:':'Order Number:','أعط الرمز لصاحب المعدة بعد وصوله.':'Give the code to the equipment owner after arrival.','لا يبدأ العمل قبل تحقق رمز العميل.':'Work cannot start before the customer code is verified.','تم قبول الطلب — في الطريق إلى العميل':'Request accepted — on the way to customer','تم تأكيد الحجز التجريبي — توجه للموقع':'Test booking confirmed — proceed to the site','وصلت للموقع — تحقق من رمز العميل':'Arrived — verify the customer code','تم التحقق من رمز العميل — جاهز لبدء العمل':'Customer code verified — ready to start work','العمل جارٍ':'Work in progress','انتهى العمل — التسوية التجريبية مكتملة':'Work completed — test settlement completed'
});


/* Legacy customer/equipment-owner rental invoices are no longer used by the new reservation lifecycle. */
const customerFinanceOld=$('customerFinanceBtn');if(customerFinanceOld){const fresh=customerFinanceOld.cloneNode(true);customerFinanceOld.replaceWith(fresh);fresh.addEventListener('click',e=>{e.stopPropagation();window.ma3daOpenCustomerFinance?.();});fresh.querySelector('.home-menu-text strong')?.replaceChildren(document.createTextNode('فواتيري ومدفوعاتي'));fresh.querySelector('.home-menu-text span')?.replaceChildren(document.createTextNode('راجع فواتير طلباتك وحالة التسوية'));}
const ownerIncomeOld=$('operatorIncomeBtn');if(ownerIncomeOld){const fresh=ownerIncomeOld.cloneNode(true);ownerIncomeOld.replaceWith(fresh);fresh.addEventListener('click',()=>{showScreen('operatorCustomerOrdersScreen');window.loadOperatorCustomerOrders?.();});fresh.querySelector('.operator-menu-content strong')?.replaceChildren(document.createTextNode('طلبات العملاء وتسوياتها'));fresh.querySelector('.operator-menu-content span')?.replaceChildren(document.createTextNode('متابعة الطلبات والتسوية الفعلية'));}
['ownerBookingInvoiceCard','bookingInvoicesList','bookingInvoiceGatewayNotice','ownerIssueInvoiceCard','contractorCreateInvoiceCard','contractorSubmitPaymentCard'].forEach(id=>{const el=$(id);if(el)el.hidden=true;});


/* Customer confirmation panel for cash-test settlement differences */
if(!$('atharTestSettlementPanel')){const p=document.createElement('div');p.id='atharTestSettlementPanel';p.className='card';p.hidden=true;p.innerHTML='<h3>تسوية المبلغ حسب الوقت الفعلي</h3><p id="atharSettlementSummary"></p><button type="button" id="atharConfirmExtraSettlement" class="main-btn">تأكيد تسوية المبلغ الإضافي (اختبار نقدي)</button><p id="atharSettlementFeedback"></p>';$('completedScreen')?.querySelector('.card')?.appendChild(p);}

async function atharLegacyProjectAcceptOperatorRequest(
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
 

async function atharLegacyProjectRejectOperatorRequest(
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
 


Object.assign(atharEnglishDictionary, {
  "© جميع الحقوق محفوظة لآثار ATHAR – 2026": "© All rights reserved to ATHAR – 2026",
  "أهلًا بك في آثار. اكتب سؤالك وسأبحث في الإجابات المعتمدة.\n      إذا لم أجد إجابة موثوقة، سأحوّل سؤالك إلى فريق الدعم.": "Welcome to ATHAR. Ask your question and I will search the approved answers.\n      If I cannot find a reliable answer, I will forward your question to support.",
  "إذا واجهت مشكلة أو لديك استفسار حول آثار،\n      تواصل معنا وسنساعدك.": "If you have an issue or question about ATHAR,\n      contact us and we will help.",
  "إذا واجهت مشكلة في الطلبات أو الحساب أو المعدة،\n      تواصل معنا وسنساعدك.": "If you have an issue with requests, your account, or equipment,\n      contact us and we will help.",
  "الاعتماد النهائي للمسجلين الجدد": "Final Approval for New Registrations",
  "العودة إلى تسجيل الدخول": "Return to Login",
  "انتظر حتى مراجعة الفريق المختص": "Please wait for the review team",
  "تحديث التسجيلات": "Refresh Registrations",
  "تم إنشاء حسابك بنجاح": "Your account was created successfully",
  "جارٍ تحميل التسجيلات...": "Loading registrations...",
  "راجع بيانات صاحب المعدة أو مسؤول المشروع والمرفقات، ثم اختر قبولاً مبدئياً أو رفضاً مبدئياً مع السبب.": "Review the equipment owner or project manager details and attachments, then choose preliminary approval or rejection with a reason.",
  "سيتم إشعارك بعد انتهاء مراجعة بياناتك ومستنداتك.": "You will be notified when your information and documents have been reviewed.",
  "صفحة تدقيق بيانات التسجيل": "Registration Audit Page",
  "طلبات التسجيل": "Registration Requests",
  "لأننا نسهّل عليك الوصول إلى المعدات الثقيلة\n      وأصحابها في مكان واحد وبطريقة أسرع وأسهل.": "We make it easier and faster to find heavy equipment\n      and its owners in one place.",
  "لا يمكنك استخدام خدمات صاحب المعدة أو إدارة المشروع قبل الاعتماد النهائي من مالك التطبيق.": "You cannot use equipment owner or project management services before the platform owner grants final approval.",
  "مراجعة التسجيلات الجديدة": "Review New Registrations",
  "مراجعة المالك قبل الاعتماد النهائي": "Owner Review Before Final Approval",
  "مراقبة الدعم وطلبات التسجيل المتعثرة": "Monitor Support and Stalled Registrations",
  "منصة تربطك بأصحاب المعدات الثقيلة والمشغلين،\n      وتساعدك في طلب المعدة التي تحتاجها بسهولة.": "A platform connecting you with heavy equipment owners and operators,\n      helping you request the equipment you need.",
  "هذه إعدادات السياسة المستقبلية. لن تتغير الفواتير القديمة أو\n      تُعاد حساباتها تلقائياً عند تعديل هذه القيم.": "These settings apply to future policy. Existing invoices will not be changed or automatically recalculated when these values are edited.",
  "هنا تظهر الأسئلة التي لم يجد المساعد لها إجابة معتمدة.\n    أجب عن السؤال، ثم أغلقه بعد حلّه.\n    لا تُعتمد إجابتك في قاعدة المعرفة إلا بموافقة المالك.": "Questions without an approved answer appear here.\n    Answer the question and close it once resolved.\n    Your answer is added to the knowledge base only after owner approval.",
  "يتطلب التسليم الفعلي إلى شاشة الجوال ربط Firebase Cloud Messaging\n      وخادم إرسال آمن وتسجيل رموز أجهزة المستخدمين. حفظ الحملة هنا\n      لا يعني أنها أُرسلت بالفعل.": "Actual mobile delivery requires Firebase Cloud Messaging,\n      a secure sending server, and user device tokens. Saving a campaign here\n      does not mean it has been sent.",
  "← العودة إلى التسجيلات": "← Back to Registrations"
} );


Object.assign(atharEnglishDictionary, {
  "تم تحديد الموافقة. يمكنك إكمال إنشاء الحساب.": "Agreement confirmed. You can complete account creation.",
  "المقاول أو صاحب المشروع": "Contractor or Project Owner",
  "التالي": "Next",
  "متاحة الآن": "Available Now",
  "لا توجد طلبات مشاريع جديدة": "No New Project Requests",
  "ستظهر هنا طلبات المقاولين وأصحاب المشاريع الموجهة لمعدتك.": "Project requests directed to your equipment will appear here.",
  "طلب مشروع": "Project Request",
  "طلب تمديد بانتظار موافقتك": "Extension Request Awaiting Your Approval",
  "المشروع": "Project",
  "تم إكمال الطلب": "Request Completed",
  "مكتمل": "Completed",
  "متاحة": "Available",
  "المشاريع السابقة": "Previous Projects",
  "غير نشط": "Inactive",
  "رفضت قواعد Firebase قراءة الملاحظات (permission-denied). تحقق من صلاحية مالك التطبيق لمجموعة ownerDailyNotes.": "Firebase denied reading notes (permission-denied). Check platform-owner access to ownerDailyNotes.",
  "مفتوحة": "Open",
  "رفضت قواعد Firebase قراءة التصعيدات (permission-denied). تحقق من صلاحية مالك التطبيق لمجموعة supportEscalations.": "Firebase denied reading escalations (permission-denied). Check platform-owner access to supportEscalations.",
  "الطلبات الناجحة": "Successful Requests",
  "المصدر: projectInvoices": "Source: projectInvoices",
  "مدير دعم": "Support Manager",
  "تم اعتماد آخر تعديل": "Last Edit Approved",
  "جعلها غير متاحة": "Set Unavailable",
  "تعديل بيانات المعدة": "Edit Equipment Details",
  "سيُرسل التعديل إلى موظفي الدعم للمراجعة، ولن تُستبدل البيانات الحالية قبل الموافقة.": "The changes will be sent to support for review. Existing equipment details will not be replaced until approval.",
  "تم حفظ الرد وإرساله للمالك كمقترح غير معتمد.": "Reply saved and sent to the platform owner as an unapproved suggestion.",
  "معتمدة": "Approved",
  "متوقفة": "Stopped",
  "تفعيل الإجابة": "Enable Answer",
  "تم تعديل الإجابة المعتمدة.": "Approved answer updated.",
  "تم حذف الخلفية العامة فقط.": "Only the global background was deleted.",
  "الهوية النشطة ✓": "Active Identity ✓",
  "مسؤوليتنا": "Our Responsibility",
  "حقوقنا": "Our Rights",
  "رؤيتنا": "Our Vision",
  "من نحن": "About ATHAR",
  "تواصل معنا": "Contact Us",
  "في آثار ATHAR نؤمن أن الثقة أساس كل تعامل ناجح؛ لذلك نتعامل مع المعلومات والبيانات الشخصية التي يشاركها المستخدم معنا بمسؤولية واهتمام، ونسعى إلى حمايتها وعدم استخدامها إلا للأغراض المشروعة والمرتبطة بتقديم خدمات المنصة وتشغيلها وتحسينها.": "At ATHAR, we believe trust is the foundation of every successful interaction. We handle the information and personal data users share with us responsibly and carefully, protecting it and using it only for legitimate purposes related to providing, operating, and improving the platform.",
  "كيف نتعامل مع معلوماتكم؟": "How Do We Handle Your Information?",
  "نطلب المعلومات اللازمة لإنشاء الحساب، والتحقق منه، وتقديم الخدمات وإدارة الطلبات والتواصل بشأنها.": "We request the information needed to create and verify accounts, provide services, manage requests, and communicate about them.",
  "نحرص على وضوح الغرض من جمع البيانات، وتقليل البيانات المطلوبة إلى القدر الذي تحتاجه الخدمة.": "We make the purpose of data collection clear and limit the information requested to what the service needs.",
  "نقصر الوصول إلى المعلومات على من تستلزم طبيعة عمله الاطلاع عليها، ونتخذ تدابير تنظيمية وتقنية مناسبة للمحافظة على سريتها وسلامتها.": "Access to information is limited to those whose work requires it. We use appropriate organizational and technical measures to protect confidentiality and integrity.",
  "لا نشارك البيانات خارج نطاق تقديم الخدمة إلا وفق مسوغ نظامي أو موافقة معتبرة، أو عندما يكون ذلك لازمًا لتنفيذ طلب المستخدم، وبالقدر اللازم لذلك.": "We share data outside service delivery only when legally justified, with valid consent, or as necessary to fulfill a user request—and only to the extent needed.",
  "نعمل على معالجة البيانات بدقة، وتحديثها عند الحاجة، وعدم الاحتفاظ بها لمدة تتجاوز الغرض من جمعها، مع مراعاة المتطلبات النظامية.": "We process data accurately, update it when needed, and do not retain it longer than necessary for its purpose, subject to legal requirements.",
  "حقوق المستخدم وواجباتنا": "User Rights and Our Responsibilities",
  "نحترم حقوق أصحاب البيانات الشخصية، بما في ذلك حقهم في العلم والوصول إلى بياناتهم وطلب نسخة منها أو تصحيحها أو إتلافها، والعدول عن الموافقة متى انطبق ذلك، وفق نظام حماية البيانات الشخصية ولوائحه والاستثناءات الواردة فيه.": "We respect personal-data rights, including the right to know, access, obtain a copy, correct, or request deletion of data, and withdraw consent where applicable, in accordance with Saudi personal-data law, regulations, and exceptions.",
  "كما نعمل على تطوير إجراءاتنا وممارساتنا باستمرار، ونشجع المستخدم على المحافظة على سرية بيانات الدخول وعدم مشاركة رموز التحقق مع الآخرين. وتُستكمل التفاصيل والإجراءات من خلال سياسة الخصوصية وشروط الاستخدام المعتمدة للمنصة.": "We continually improve our procedures and practices. Users should keep login details confidential and never share verification codes. Further details are provided in the platform’s approved Privacy Policy and Terms of Use.",
  "أثرٌ يواكب طموح وطن": "An Impact That Matches Our Nation’s Ambition",
  "تنطلق رؤيتنا من إيماننا بأن نهضة المدن والمشاريع تبدأ بتكامل الجهود، وسهولة الوصول إلى الموارد، وتحويل الطموحات إلى أعمال تُرى آثارها على أرض الواقع.": "Our vision is grounded in the belief that thriving cities and projects begin with coordinated efforts, easy access to resources, and turning ambitions into real-world achievements.",
  "ونستلهم توجه المملكة العربية السعودية في ظل رؤية 2030 نحو اقتصاد مزدهر، وبيئة أعمال أكثر تنافسية، وتحول رقمي يرفع كفاءة الخدمات، ويدعم نمو المنشآت، ويعزز مشاركة القطاع الخاص في مسيرة التنمية.": "We are inspired by Saudi Arabia’s Vision 2030—toward a prosperous economy, a more competitive business environment, digital transformation that improves services, supports businesses, and strengthens private-sector participation in development.",
  "نحو قطاع إنشائي أكثر ترابطًا": "Toward a More Connected Construction Sector",
  "نتطلع إلى أن تسهم آثار في تقريب المسافة بين العملاء وأصحاب المعدات والمشغلين وأصحاب المشاريع؛ من خلال تسهيل الوصول إلى المعدات والخدمات المناسبة، وتنظيم الطلبات والتواصل، ومساندة إنجاز الأعمال بوضوح وكفاءة.": "ATHAR aims to bring customers, equipment owners, operators, and project owners closer by making suitable equipment and services easier to find, organizing requests and communication, and supporting clear and efficient work.",
  "ونؤمن أن كل معدة تُستثمر بكفاءة، وكل مورد يصل إلى مشروعه في الوقت المناسب، وكل تعاون ناجح بين أطراف العمل؛ يمكن أن يصنع فرقًا في الإنتاجية ويضيف لبنة جديدة في مسيرة الإعمار.": "We believe every efficiently used machine, every resource delivered to the right project at the right time, and every successful collaboration can improve productivity and contribute to building progress.",
  "طموحنا أن نكون جسرًا رقميًا موثوقًا يساند أعمال اليوم، ويشارك في بناء فرص الغد، بما ينسجم مع مستهدفات التنمية والابتكار والاستدامة في المملكة، دون أن ندّعي تمثيل أي جهة أو برنامج حكومي.": "Our ambition is to be a trusted digital bridge supporting today’s work and tomorrow’s opportunities, aligned with Saudi development, innovation, and sustainability goals—without claiming to represent any government entity or program.",
  "آثار ATHAR — منصة تجمع أطراف الإنجاز": "ATHAR — Connecting the People Behind Every Achievement",
  "آثار منصة رقمية سعودية التوجه، صُممت لتكون حلقة وصل بين العملاء والمقاولين وأصحاب المعدات والمشغلين وأصحاب ومسؤولي المشاريع، في مساحة واحدة تساعدهم على الوصول إلى احتياجاتهم والتواصل بشأنها بصورة أكثر تنظيمًا ووضوحًا.": "ATHAR is a Saudi-oriented digital platform connecting customers, contractors, equipment owners, operators, and project owners or managers in one place to help them find what they need and communicate more clearly and efficiently.",
  "تخدم المنصة رحلة العمل من تحديد الاحتياج، واستعراض الخيارات المتاحة، وإرسال الطلبات، والتواصل بين الأطراف، ومتابعة مراحل التنفيذ والخدمات المرتبطة بالمشروع، بحسب الخصائص المتاحة داخل التطبيق.": "The platform supports the workflow—from identifying needs and reviewing available options to submitting requests, communicating, and tracking work and project-related services, according to available app features.",
  "ماذا نقدم؟": "What Do We Offer?",
  "للعملاء والمقاولين:": "For Customers and Contractors:",
  "وسيلة أسهل للوصول إلى المعدات والخدمات التي تتطلبها الأعمال والمشاريع.": "An easier way to find equipment and services needed for work and projects.",
  "لأصحاب المعدات:": "For Equipment Owners:",
  "مساحة لعرض المعدات وإدارة الطلبات والتواصل مع طالبي الخدمة.": "A place to list equipment, manage requests, and communicate with service seekers.",
  "لأصحاب ومسؤولي المشاريع:": "For Project Owners and Managers:",
  "أدوات تساعد على تنظيم احتياجات المشروع وربطها بالمعدات ومقدمي الخدمات.": "Tools to organize project needs and connect them with equipment and service providers.",
  "نركز على تسهيل التواصل، ورفع وضوح المعلومات، وتنظيم خطوات العمل، وتقديم تجربة رقمية تراعي احتياجات مختلف الأطراف.": "We focus on easier communication, clearer information, organized workflows, and a digital experience that considers the needs of all parties.",
  "وتعمل آثار بوصفها منصة تقنية وسيطة لتنظيم التواصل والطلبات؛ ولا تحل محل الأطراف المتعاقدة في مسؤولياتهم، ولا تُعد بديلاً عن التحقق المباشر من المعدات أو الاتفاق على تفاصيل الخدمة وشروطها قبل التنفيذ.": "ATHAR operates as a technology platform that organizes communication and requests. It does not replace contracting parties’ responsibilities or direct equipment inspection and agreement on service details and terms before work begins.",
  "شعارنا:": "Our Motto:",
  "آثار… نبني اليوم ما يبقى غدًا.": "ATHAR… Building Today What Lasts Tomorrow.",
  "نسعد بتواصلكم": "We Welcome Your Feedback",
  "فريق آثار يرحب باستفساراتكم وملاحظاتكم ومقترحاتكم. إذا واجهت مشكلة في الحساب، أو كان لديك استفسار عن طلب أو خدمة، أو رغبت في الإبلاغ عن ملاحظة؛ يمكنك التواصل معنا عبر قنوات الدعم الفني المعتمدة داخل التطبيق.": "The ATHAR team welcomes your questions, feedback, and suggestions. If you have an account issue, a question about a request or service, or wish to report something, contact us through the app’s approved support channels.",
  "حتى نتمكن من مساعدتك بشكل أسرع، يرجى توضيح نوع الاستفسار وإرفاق رقم الطلب — إن وجد — وشرح مختصر للمشكلة، مع تجنب إرسال كلمات المرور أو رموز التحقق أو بيانات الدفع السرية.": "To help you faster, specify the type of inquiry, include the request number if available, and briefly describe the issue. Do not send passwords, verification codes, or confidential payment details.",
  "نقدّر ثقتكم وملاحظاتكم؛ فهي تساعدنا على تحسين تجربة آثار وتطوير خدماتها باستمرار.": "We appreciate your trust and feedback; they help us continuously improve ATHAR and its services."
} );

Object.assign(atharEnglishDictionary, {
  "المسافة ": "Distance ",
  "مبلغ الحجز التجريبي ": "Test booking amount ",
  "مشاركة بيانات التواصل": "Share Contact Details",
  "بعد تأكيد الحجز، شارك رقمك مع العميل ليظهر لديه الاتصال المباشر.": "After booking is confirmed, share your phone number so the customer can call you directly.",
  "إظهار بيانات التواصل للعميل": "Share Contact Details with Customer",
  "تمت مشاركة رقم التواصل مع العميل.": "Your contact number has been shared with the customer.",
  "رقم الجوال غير مسجل في حساب صاحب المعدة.": "The equipment owner’s phone number is not registered.",
  "مشاركة التواصل متاحة بعد تأكيد الحجز.": "Contact sharing is available after booking confirmation.",
  "هذا الطلب ليس لمعدتك.": "This request is not assigned to your equipment.",
  "هذا الطلب ليس لحسابك.": "This request is not assigned to your account.",
  "لا تتوفر بيانات مدينة/إحداثيات لجميع المعدات؛ يعرض النظام المعدات المعتمدة والمتاحة من النوع المختار، وقد لا تكون كلها في منطقتك. حدّث مدينة حسابك للحصول على فلترة أدق.": "City or coordinates are missing for some equipment. The system shows approved and available equipment of the selected type, which may not all be in your area. Update your account city for more precise filtering.",
  "المبلغ المحجوز/التقديري:": "Reserved / Estimated Amount:",
  "المبلغ الإضافي المطلوب:": "Additional Amount Due:",
  "المبلغ الزائد المسترد تجريبيًا:": "Test Refund Amount:",
  "قيمة العمل:": "Work Value:",
  "الوقت الفعلي:": "Actual Time:",
  "رقم الطلب:": "Order Number:",
  "سعر الساعة:": "Hourly Rate:",
  "الحجز:": "Booking:",
  "العميل:": "Customer:",
  "التاريخ:": "Date:",
  "أنت على بعد ": "You are ",
  "تم تأكيد الحجز التجريبي": "Test booking confirmed",
  "لا يوجد طلب": "No request",
  "لا يوجد طلب حالي": "No current request",
  "لا يمكن بدء العمل قبل التحقق من رمز العميل.": "Work cannot start before the customer verification code is confirmed."
} );

Object.assign(atharEnglishDictionary, {"قيّم المعدة": "Rate the Equipment", "كيف كانت المعدة خلال تنفيذ العمل؟": "How was the equipment during the job?"} );

/* ATHAR NEW CUSTOMER RENTAL FLOW — replaces legacy customer rental lifecycle */
(function atharNewRentalFlow(){
  'use strict';
  const $=id=>document.getElementById(id);
  const money=n=>`${Number(n||0).toLocaleString('ar-SA',{maximumFractionDigits:2})} ريال`;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readUser=async()=>window.ma3daGetCurrentUser?await window.ma3daGetCurrentUser():window.ma3daAuth?.currentUser||null;
  const equipmentCollection=()=>window.ma3daCollection(window.ma3daDB,'equipment');
  const requestRef=id=>window.ma3daDoc(window.ma3daDB,'requests',id);
  let draft=null,available=[];
  let availableMap=null,availableMarkers=[],availableCustomerMarker=null,availableMapLoadPromise=null;
  let watcher=null;
  const legacyAcceptOperatorRequest=window.atharLegacyProjectAcceptOperatorRequest;
  const legacyRejectOperatorRequest=window.atharLegacyProjectRejectOperatorRequest;
  let otpDraft='';
  const styles=`<style id="atharNewRentalStyle">
  #atharAvailableScreen{position:relative;min-height:calc(100vh - 24px);padding:0!important;overflow:hidden;background:#f7f5ef}
  #atharAvailableScreen .athar-uber-top{position:absolute;z-index:1002;top:12px;right:12px;left:12px;display:flex;align-items:center;gap:10px;pointer-events:none}
  #atharAvailableScreen .athar-uber-top>*{pointer-events:auto}
  #atharAvailableScreen .athar-uber-top .back-btn{width:44px;height:44px;padding:0;border-radius:50%;background:#fff;color:#171717;border:0;box-shadow:0 2px 12px #0002;font-size:20px}
  #atharAvailableScreen .athar-map-shell{position:relative;height:calc(100vh - 24px);min-height:560px;background:#e9e6dc}
  #atharAvailableMap{position:absolute;inset:0;width:100%;height:100%;z-index:1}
  #atharAvailableScreen .athar-map-status{position:absolute;z-index:500;top:68px;right:14px;left:14px;width:max-content;max-width:calc(100% - 28px);padding:8px 12px;border-radius:20px;background:#fff;color:#252525;box-shadow:0 2px 12px #0002;font-size:12px;font-weight:800}
  #atharAvailableScreen .athar-bottom-sheet{position:absolute;z-index:600;right:0;bottom:0;left:0;max-height:53%;min-height:178px;display:flex;flex-direction:column;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -5px 24px #0002;transition:max-height .22s ease;overflow:hidden}
  #atharAvailableScreen .athar-bottom-sheet.is-collapsed{max-height:112px;min-height:112px}
  #atharAvailableScreen .athar-sheet-head{flex:none;padding:9px 16px 12px;border-bottom:1px solid #eee;cursor:pointer;touch-action:pan-y}
  #atharAvailableScreen .athar-sheet-handle{width:42px;height:5px;border-radius:8px;background:#c9c9c9;margin:0 auto 10px}
  #atharAvailableScreen .athar-sheet-title{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#171717;font-weight:900}
  #atharAvailableScreen .athar-sheet-title small{font-size:12px;font-weight:600;color:#777}
  #atharAvailableScreen .athar-sheet-content{overflow:auto;padding:4px 12px 18px;overscroll-behavior:contain}
  #atharAvailableScreen .athar-bottom-sheet.is-collapsed .athar-sheet-content{display:none}
  #atharAvailableScreen .card,#atharBookingScreen .card{background:#fff;border:1px solid #e5dfd2;border-radius:16px;padding:14px;margin:10px 0;color:#171717}
  #atharAvailableScreen button,#atharBookingScreen button{background:#fff;color:#171717;border:1px solid #c8a45b;border-radius:12px;padding:12px;font:inherit;font-weight:700}
  #atharAvailableScreen .athar-uber-top button{border:0}
  .athar-equip-choice{display:grid;grid-template-columns:68px 1fr;gap:10px;align-items:center;border:1px solid #e8e3d8;border-radius:15px;padding:11px;margin:9px 0;background:#fff;scroll-margin:12px}
  .athar-equip-choice.is-active{border:2px solid #c8a45b;background:#fffdf7}
  .athar-equip-choice img{width:68px;height:68px;object-fit:cover;border-radius:11px}
  .athar-equip-choice .pick{grid-column:1/-1;width:100%;background:#171717!important;color:#fff!important;border-color:#171717!important}
  .athar-equip-choice .athar-distance{font-size:12px;color:#8a682b;font-weight:800}
  .athar-map-pin{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border:2px solid #fff;border-radius:50% 50% 50% 5px;transform:rotate(-45deg);background:#171717;color:#fff;box-shadow:0 2px 8px #0005;font-size:18px}
  .athar-map-pin span{transform:rotate(45deg)}
  .athar-map-pin.customer{background:#c8a45b;color:#171717;width:42px;height:42px}
  .athar-new-flow-badge{border:1px solid #c8a45b;border-radius:999px;padding:6px 10px;display:inline-block;font-weight:700}
  @media(max-width:600px){#atharAvailableScreen .athar-map-shell{height:calc(100dvh - 24px);min-height:520px}#atharAvailableScreen .athar-bottom-sheet{max-height:55%}}
  </style>`;
  if(!$('atharNewRentalStyle'))document.head.insertAdjacentHTML('beforeend',styles);
  function mountScreens(){
    const contractorHome=$('contractorHomeScreen');
    if(contractorHome&&!$('atharContractorDirectRentalBtn')){
      const card=document.createElement('div');card.className='card';card.innerHTML='<h3>تأجير المعدات عبر آثار</h3><p>استخدم رحلة طلب المعدة نفسها المتاحة للعملاء، مع بقاء بيانات حسابك كمقاول.</p><button type="button" id="atharContractorDirectRentalBtn" class="main-btn">طلب معدة لمشروعي</button><button type="button" id="atharContractorRentalOrdersBtn" class="back-btn">طلباتي من المعدات</button>';
      contractorHome.appendChild(card);
      $('atharContractorDirectRentalBtn')?.addEventListener('click',()=>{selectedRole='contractor';localStorage.setItem('selectedRole','contractor');showScreen('requestScreen');});
      $('atharContractorRentalOrdersBtn')?.addEventListener('click',async()=>{selectedRole='contractor';localStorage.setItem('selectedRole','contractor');showScreen('currentOrdersScreen');await window.loadCustomerOrders?.('current');});
    }
    if(!$('atharAvailableScreen')){
      const s=document.createElement('section');s.id='atharAvailableScreen';s.className='screen';
      s.innerHTML=`<div class="athar-map-shell"><div id="atharAvailableMap" aria-label="خريطة المعدات المتاحة"></div><div class="athar-uber-top"><button type="button" class="back-btn" data-athar-back-request aria-label="رجوع">←</button></div><div class="athar-map-status" id="atharMapStatus">جارٍ البحث عن المعدات القريبة…</div><div class="athar-bottom-sheet" id="atharEquipmentSheet"><div class="athar-sheet-head" id="atharEquipmentSheetHead"><div class="athar-sheet-handle"></div><div class="athar-sheet-title"><span>المعدات القريبة منك</span><small id="atharEquipmentCount">جارٍ البحث…</small></div></div><div class="athar-sheet-content" id="atharAvailableEquipmentList"><div class="card center">جاري البحث عن المعدات...</div></div></div></div>`;
      $('requestScreen')?.insertAdjacentElement('afterend',s);
    }
    if(!$('atharBookingScreen')){
      const s=document.createElement('section');s.id='atharBookingScreen';s.className='screen';
      s.innerHTML=`<div class="card"><h2>حجز مبلغ الطلب</h2><p id="atharBookingDetails"></p><p><strong>ملاحظة للاختبار:</strong> خيار النقد هنا تأكيد تجريبي للحجز فقط؛ لا يتم حجز أموال حقيقية أو تحصيلها.</p><label><input type="checkbox" id="atharCashTestAgree"> أوافق على تأكيد الحجز التجريبي (كاش)</label><button type="button" id="atharConfirmBooking" class="main-btn">تأكيد الحجز التجريبي</button><p id="atharBookingFeedback" role="status"></p></div>`;
      $('matchedScreen')?.insertAdjacentElement('beforebegin',s);
    }
    // Show a customer-only OTP panel after reservation confirmation.
    if(!$('atharCustomerOtpPanel')){
      const p=document.createElement('div');p.id='atharCustomerOtpPanel';p.className='card';p.hidden=true;
      p.innerHTML=`<h3>رمز التحقق لبدء العمل</h3><p>لا تشارك الرمز إلا مع صاحب المعدة عند وصوله للموقع.</p><strong id="atharCustomerOtp" style="font-size:2rem;letter-spacing:.2em"></strong><p id="atharCustomerOtpState"></p>`;
      $('matchedScreen')?.querySelector('.card')?.appendChild(p);
    }
    // Owner input: hidden until the owner has arrived.
    if(!$('atharOwnerExtensionPanel')){
      const p=document.createElement('div');p.id='atharOwnerExtensionPanel';p.className='card';p.hidden=true;
      p.innerHTML='<h3>طلب تمديد مدة التأجير</h3><p>أرسل عدد الساعات الإضافية للعميل. لا يبدأ التمديد إلا بعد موافقته وتأكيد الدفع التجريبي.</p><label for="atharExtensionHours">الساعات الإضافية</label><input id="atharExtensionHours" type="number" min="1" max="240" step="1" value="1"><button type="button" id="atharRequestExtensionBtn" class="main-btn">إرسال طلب التمديد</button><p id="atharExtensionOwnerFeedback" role="status"></p><div id="atharExtensionOwnerState"></div>';
      $('operatorCurrentOrderScreen')?.querySelector('.card')?.appendChild(p);
    }
    if(!$('atharCustomerExtensionPanel')){
      const p=document.createElement('div');p.id='atharCustomerExtensionPanel';p.className='card';p.hidden=true;
      p.innerHTML='<h3>طلب تمديد من صاحب المعدة</h3><p id="atharCustomerExtensionDetails"></p><label><input type="checkbox" id="atharExtensionCashAgree"> أوافق على التمديد والمبلغ، وأؤكد الدفع النقدي التجريبي</label><button type="button" id="atharApproveExtensionBtn" class="main-btn">موافقة وتأكيد الدفع التجريبي</button><button type="button" id="atharRejectExtensionBtn" class="back-btn">رفض التمديد</button><p id="atharExtensionCustomerFeedback" role="status"></p>';
      $('workingScreen')?.querySelector('.card')?.appendChild(p);
    }
    if(!$('atharCustomerFinalReviewPanel')){
      const p=document.createElement('div');p.id='atharCustomerFinalReviewPanel';p.className='card';p.hidden=true;
      p.innerHTML='<h3>مراجعة نهاية العمل والتسوية</h3><p id="atharCustomerFinalSummary"></p><button type="button" id="atharConfirmFinalSettlementBtn" class="main-btn">تأكيد التسوية النهائية (اختبار نقدي)</button><button type="button" id="atharOpenRentalDisputeBtn" class="back-btn">اعتراض على الوقت أو المبلغ</button><p id="atharFinalReviewFeedback" role="status"></p>';
      $('completedScreen')?.querySelector('.card')?.appendChild(p);
    }
    if(!$('supportSectionRentalDisputes')){
      const nav=document.querySelector('#supportDashboardScreen .support-nav');
      if(nav){const b=document.createElement('button');b.type='button';b.className='support-btn';b.dataset.supportSection='rentalDisputes';b.textContent='نزاعات طلبات التأجير';nav.appendChild(b);}
      const section=document.createElement('div');section.id='supportSectionRentalDisputes';section.className='support-section support-panel';
      section.innerHTML='<h2>نزاعات طلبات التأجير</h2><p>مراجعة الاعتراضات وسجل الوقت والتمديد. القرار هنا توثيقي ولا ينفذ استردادًا أو تحويلًا ماليًا.</p><button type="button" id="atharRefreshRentalDisputesBtn" class="support-btn">تحديث النزاعات</button><div id="atharRentalDisputesList" class="support-list">اضغط تحديث لعرض النزاعات.</div>';
      document.querySelector('#supportDashboardScreen .support-wrap')?.appendChild(section);
    }
    if(!$('atharOwnerOtpPanel')){
      const p=document.createElement('div');p.id='atharOwnerOtpPanel';p.className='card';p.hidden=true;
      p.innerHTML=`<h3>تحقق رمز العميل</h3><label for="atharOwnerOtpInput">أدخل الرمز الذي استلمه العميل</label><input id="atharOwnerOtpInput" inputmode="numeric" maxlength="6" autocomplete="one-time-code"><button type="button" id="atharVerifyOtpBtn" class="main-btn">تحقق واسمح ببدء العمل</button><p id="atharOwnerOtpFeedback" role="status"></p>`;
      $('operatorCurrentOrderScreen')?.querySelector('.card')?.appendChild(p);
    }
  }
  if(!$('atharOwnerContactPanel')){const p=document.createElement('div');p.id='atharOwnerContactPanel';p.className='card';p.hidden=true;p.innerHTML='<h3>مشاركة بيانات التواصل</h3><p>بعد تأكيد الحجز، شارك رقمك مع العميل ليظهر لديه الاتصال المباشر.</p><button type="button" id="atharShareOwnerContactBtn" class="main-btn">إظهار بيانات التواصل للعميل</button><p id="atharOwnerContactFeedback"></p>'; $('operatorCurrentOrderScreen')?.querySelector('.card')?.appendChild(p);}
  mountScreens();
  function ensureAvailableMapLibrary(){
    if(window.L)return Promise.resolve(window.L);
    if(availableMapLoadPromise)return availableMapLoadPromise;
    availableMapLoadPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-athar-leaflet]');
      if(existing){existing.addEventListener('load',()=>window.L?resolve(window.L):reject(new Error('تعذر تشغيل مكتبة الخريطة.')),{once:true});existing.addEventListener('error',()=>reject(new Error('تعذر تحميل مكتبة الخريطة.')),{once:true});return;}
      const tag=document.createElement('script');tag.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';tag.dataset.atharLeaflet='1';tag.onload=()=>window.L?resolve(window.L):reject(new Error('تعذر تشغيل مكتبة الخريطة.'));tag.onerror=()=>reject(new Error('تعذر تحميل مكتبة الخريطة.'));document.head.appendChild(tag);
    });
    return availableMapLoadPromise;
  }
  async function renderAvailableMap(){
    const mapEl=$('atharAvailableMap'),status=$('atharMapStatus');if(!mapEl||!draft)return;
    try{
      const L=await ensureAvailableMapLibrary();
      if(!availableMap){availableMap=L.map(mapEl,{zoomControl:false,preferCanvas:true}).setView([draft.locationCoordinates.latitude,draft.locationCoordinates.longitude],12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(availableMap);L.control.zoom({position:'bottomright'}).addTo(availableMap);}
      else{availableMap.setView([draft.locationCoordinates.latitude,draft.locationCoordinates.longitude],12);availableMarkers.forEach(m=>availableMap.removeLayer(m));availableMarkers=[];if(availableCustomerMarker)availableMap.removeLayer(availableCustomerMarker);availableCustomerMarker=null;}
      const customerIcon=L.divIcon({className:'',html:'<div class="athar-map-pin customer"><span>📍</span></div>',iconSize:[42,42],iconAnchor:[21,38]});
      availableCustomerMarker=L.marker([draft.locationCoordinates.latitude,draft.locationCoordinates.longitude],{icon:customerIcon,zIndexOffset:1000}).addTo(availableMap).bindPopup('موقع العمل المحدد');
      const bounds=[[draft.locationCoordinates.latitude,draft.locationCoordinates.longitude]];
      available.forEach((e,index)=>{if(!e.mapPoint)return;const pin=L.divIcon({className:'',html:'<div class="athar-map-pin"><span>🚜</span></div>',iconSize:[38,38],iconAnchor:[19,35]});const marker=L.marker([e.mapPoint.lat,e.mapPoint.lng],{icon:pin}).addTo(availableMap);marker.bindPopup(`<strong>${esc(e.type||e.equipmentType||draft.type)}</strong><br>${esc(e.model||'')}${e.distanceKm!=null?`<br>${e.distanceKm.toFixed(1)} كم`:''}`);marker.on('click',()=>{document.querySelectorAll('.athar-equip-choice').forEach(c=>c.classList.remove('is-active'));const card=$(`[data-athar-card="${index}"]`);if(card){card.classList.add('is-active');card.scrollIntoView({behavior:'smooth',block:'nearest'});}const sheet=$('atharEquipmentSheet');sheet?.classList.remove('is-collapsed');});availableMarkers.push(marker);bounds.push([e.mapPoint.lat,e.mapPoint.lng]);});
      if(bounds.length>1)availableMap.fitBounds(bounds,{padding:[35,35],maxZoom:13});
      if(status)status.textContent=`${available.length} معدة مطابقة لطلبك`;
      requestAnimationFrame(()=>availableMap?.invalidateSize());
    }catch(error){console.warn('ATHAR map unavailable:',error);if(status)status.textContent='تعذر تحميل الخريطة؛ يمكنك اختيار المعدة من القائمة';}
  }
  function bindEquipmentSheet(){const head=$('atharEquipmentSheetHead'),sheet=$('atharEquipmentSheet');if(!head||head.dataset.bound)return;head.dataset.bound='1';let startY=0,suppressClickUntil=0;head.addEventListener('click',()=>{if(Date.now()<suppressClickUntil)return;sheet.classList.toggle('is-collapsed');});head.addEventListener('touchstart',e=>{startY=e.touches?.[0]?.clientY||0;},{passive:true});head.addEventListener('touchend',e=>{const endY=e.changedTouches?.[0]?.clientY||startY,delta=endY-startY;if(Math.abs(delta)>25){suppressClickUntil=Date.now()+450;if(delta>0)sheet.classList.add('is-collapsed');else sheet.classList.remove('is-collapsed');}},{passive:true});}
  // Bind the request button after Firebase setup; keep its visible Arabic label unchanged.
  const oldRequestBtn=$('requestBtn');
  if(oldRequestBtn){
    const fresh=oldRequestBtn.cloneNode(true);
    fresh.type='button';
    oldRequestBtn.replaceWith(fresh);
  }
  const requestBtn=$('requestBtn');
  if(requestBtn){
    requestBtn.addEventListener('click',async()=>{
      if(requestBtn.disabled)return;
      const location=String($('locationInput')?.value||'').trim();
      const type=String($('equipmentSelect')?.value||'').trim();
      const duration=String($('durationSelect')?.value||'').trim();
      const operator=String($('operatorSelect')?.value||'مع مشغل').trim();
      const notes=String($('notesInput')?.value||'').trim();
      if(!location||!type||!duration){alert('حدد موقع العمل ونوع المعدة ومدة العمل أولاً.');return;}
      const coordMatch=location.match(/(-?\d+(?:\.\d+)?)\s*[,،]\s*(-?\d+(?:\.\d+)?)/);
      if(!coordMatch){alert('تعذر قراءة إحداثيات الموقع. اضغط «تحديد موقعي بدقة» مرة أخرى.');return;}
      const latitude=Number(coordMatch[1]),longitude=Number(coordMatch[2]);
      if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){alert('إحداثيات الموقع غير صحيحة. أعد تحديد موقع العمل.');return;}
      requestBtn.disabled=true;
      const originalText=requestBtn.textContent;
      requestBtn.textContent='جارٍ البحث عن المعدات…';
      try{
        if(window.ma3daFirebaseReady)await window.ma3daFirebaseReady;
        const user=await readUser();
        if(!user?.uid)throw new Error('انتهت جلسة الدخول أو لم يكتمل تسجيل الدخول. سجّل الدخول ثم حاول مجددًا.');
        if(typeof window.ma3daCollection!=='function'||typeof window.ma3daWhere!=='function'||typeof window.ma3daQuery!=='function'||typeof window.ma3daGetDocs!=='function'){
          throw new Error('خدمات قاعدة البيانات لم تجهز بعد. أعد تحميل الصفحة وحاول مرة أخرى.');
        }
        draft={location,type,duration,operator,notes,customerId:user.uid,locationCoordinates:{latitude,longitude},createdAt:Date.now()};
        const list=$('atharAvailableEquipmentList');
        if(!list)throw new Error('تعذر تجهيز شاشة المعدات المتاحة. أعد تحميل الصفحة.');
        list.innerHTML='<div class="card center">جاري البحث عن المعدات المتاحة…</div>';
        if(!showScreen('atharAvailableScreen'))throw new Error('تعذر فتح شاشة المعدات المتاحة.');
        requestAnimationFrame(()=>availableMap?.invalidateSize());
        await loadAvailable();
      }catch(error){
        console.error('ATHAR request button failed:',error);
        alert(error?.message||'تعذر تنفيذ طلب المعدة. تحقق من الاتصال ثم حاول مرة أخرى.');
      }finally{
        requestBtn.disabled=false;
        requestBtn.textContent=originalText||'اطلب الآن';
      }
    });
  }else{
    console.error('ATHAR: لم يتم العثور على زر requestBtn لربط إجراء الطلب.');
  }
  async function loadAvailable(){
    try{
      if(window.ma3daFirebaseReady)await window.ma3daFirebaseReady;
      const equipmentQuery=window.ma3daQuery(equipmentCollection(),window.ma3daWhere('availability','==','available'));const snap=await window.ma3daGetDocs(equipmentQuery);available=[];
      const user=await readUser();
      const profileCollection=(selectedRole==='contractor'||localStorage.getItem('selectedRole')==='contractor')?'contractors':'customers';const customerProfile= user?.uid && window.ma3daDoc&&window.ma3daGetDoc ? await (async()=>{try{const s=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,profileCollection,user.uid));return s.exists()?s.data()||{}:{};}catch(_){return {};}})():{};
      const city=String(customerProfile.city||customerProfile.locationCity||'').trim();
      const customerPoint=draft.locationCoordinates;
      const coordOf=e=>{const lat=Number(e.latitude??e.locationLatitude??e.locationCoordinates?.latitude??e.equipmentLocationLatitude??e.equipmentLatitude??e.coordinates?.latitude),lng=Number(e.longitude??e.locationLongitude??e.locationCoordinates?.longitude??e.equipmentLocationLongitude??e.equipmentLongitude??e.coordinates?.longitude);return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng}:null;};
      const distanceKm=(a,b)=>{const rad=v=>v*Math.PI/180,dl=rad(b.lat-a.lat),dn=rad(b.lng-a.lng),x=Math.sin(dl/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dn/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));};
      let locationFiltered=false;
      snap.forEach(doc=>{const e=doc.data()||{};const owner=e.ownerId||doc.id;if(owner===user?.uid||e.availability!=='available')return;
        const t=String(e.type||e.equipmentType||e.name||'');if(t!==draft.type)return;
        if(e.approved!==true||!['verified','approved'].includes(String(e.verificationStatus||'').toLowerCase())||String(e.equipmentStatus||'active').toLowerCase()!=='active')return;const approval=String(e.registrationStatus||e.ownerApprovalStatus||e.accountStatus||'approved').toLowerCase();if(['pending','pending_approval','rejected','suspended'].includes(approval))return;
        const eCity=String(e.city||e.locationCity||e.locationAddress||'').trim();const cityMatch=!!(city&&eCity&&(eCity.toLowerCase().includes(city.toLowerCase())||city.toLowerCase().includes(eCity.toLowerCase())));if(city&&eCity&&!cityMatch)return;
        const ePoint=coordOf(e);if(customerPoint&&ePoint&&distanceKm(customerPoint,ePoint)>50)return;if(cityMatch||customerPoint&&ePoint)locationFiltered=true;
        const distance=ePoint?distanceKm(customerPoint,ePoint):null;
        available.push({id:doc.id,ownerId:owner,...e,mapPoint:ePoint,distanceKm:distance});
      });
      available.sort((a,b)=>(a.distanceKm??Infinity)-(b.distanceKm??Infinity));
      const list=$('atharAvailableEquipmentList');if(!list)return;
      bindEquipmentSheet();
      const count=$('atharEquipmentCount');if(count)count.textContent=`${available.length} نتيجة`;
      if(!available.length){list.innerHTML='<div class="card center"><h3>لا توجد معدات متاحة مطابقة</h3><p>جرّب نوعًا آخر أو عدّل الموقع/المدة.</p></div>';const status=$('atharMapStatus');if(status)status.textContent='لا توجد معدات مطابقة بالقرب منك';await renderAvailableMap();return;}
      list.innerHTML='';if(!locationFiltered){const note=document.createElement('div');note.className='card';note.textContent='بعض المعدات لا تملك إحداثيات دقيقة؛ تظهر في القائمة دون علامة على الخريطة.';list.appendChild(note);}available.forEach((e,i)=>{const card=document.createElement('article');card.className='athar-equip-choice';card.dataset.atharCard=String(i);card.innerHTML=`${e.image?`<img src="${esc(e.image)}" alt="معدة">`:'<div style="font-size:2rem">🚜</div>'}<div><strong>${esc(e.type||e.equipmentType||draft.type)}</strong><div>${esc(e.model||'')}</div><small>${esc(e.city||e.locationAddress||'')}</small><div>سعر الساعة: ${money(e.hourlyPrice)}</div><div class="athar-distance">${e.distanceKm!=null?`يبعد ${e.distanceKm.toFixed(1)} كم`:'المسافة غير متاحة'}</div></div><button class="pick" type="button" data-athar-pick="${i}">اختيار هذه المعدة</button>`;list.appendChild(card);});
      await renderAvailableMap();
    }catch(error){console.error('تعذر عرض المعدات المتاحة:',error);$('atharAvailableEquipmentList').innerHTML='<div class="card center"><h3>تعذر تحميل المعدات</h3><p>تحقق من الاتصال وصلاحيات Firebase ثم أعد المحاولة.</p></div>';}
  }
  async function nextOrderNumber(){
    const year=String(new Date().getFullYear()).slice(-2);
    // Counter lives in requests because the currently deployed policy gives signed-in users
    // request read/write access, while ma3daSettings is restricted to the platform owner.
    const counterRef=window.ma3daDoc(window.ma3daDB,'requests','_atharOrderCounter');
    if(typeof window.ma3daRunTransaction!=='function')throw new Error('لا يمكن إصدار رقم الطلب التسلسلي دون معاملة Firebase آمنة.');
    let sequence=0;
    await window.ma3daRunTransaction(async tx=>{
      const snap=await tx.get(counterRef),d=snap.exists()?snap.data()||{}:{};
      sequence=Number(d.year)===Number(year)?Number(d.sequence||0)+1:1;
      tx.set(counterRef,{systemRecord:true,recordType:'athar_order_counter',year:Number(year),sequence,updatedAt:Date.now()});
    });
    return `ATH${year}${String(sequence).padStart(5,'0')}`;
  }
  async function pickEquipment(index){
    const e=available[index];if(!e||!draft)return;
    const user=await readUser();if(!user?.uid)return;
    const hourly=Number(e.hourlyPrice||0);const hours=({'ساعة واحدة':1,'4 ساعات':4,'8 ساعات':8,'يوم كامل':10})[draft.duration]||4;
    const reserve=Math.round(hourly*hours*100)/100;
    if(!reserve){alert('المعدة ليس لديها سعر ساعة صحيح.');return;}
    const btn=$(`[data-athar-pick="${index}"]`);if(btn)btn.disabled=true;
    try{
      const orderNumber=await nextOrderNumber();
      const profileCollection=(selectedRole==='contractor'||localStorage.getItem('selectedRole')==='contractor')?'contractors':'customers';const customerSnap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,profileCollection,user.uid));const customer=customerSnap.exists()?customerSnap.data()||{}:{};
      const customerCity=String(customer.city||customer.locationCity||'').trim();const data={orderNumber,location:customerCity||'ضمن المنطقة المحددة',locationArea:customerCity||'منطقة العميل',locationCoordinates:null,equipment:draft.type,equipmentId:e.id,equipmentOwnerId:e.ownerId,ownerId:e.ownerId,operatorId:e.ownerId,operatorName:e.ownerName||e.ownerDisplayName||'صاحب المعدة',operatorPhone:'',operatorEquipment:e.type||draft.type,equipmentModel:e.model||'',equipmentCity:e.city||'',hourlyPrice:hourly,duration:draft.duration,durationHours:hours,operator:draft.operator,notes:draft.notes,price:reserve,reservedAmount:reserve,customerId:user.uid,requesterId:user.uid,requesterRole:(selectedRole==='contractor'||localStorage.getItem('selectedRole')==='contractor')?'contractor':'customer',customerName:customer.name||customer.fullName||user.displayName||'',status:'owner_decision_pending',stage:'owner_approval',bookingStatus:'not_started',paymentStatus:'not_reserved',paymentMethod:'',createdAt:Date.now(),updatedAt:Date.now(),schemaVersion:6,flowVersion:'ATHAR-RENTAL-2026-NEW'};
      const ref=await window.ma3daAddDoc(window.ma3daCollection(window.ma3daDB,'requests'),data);
      if(!ref?.id)throw new Error('لم يرجع Firebase رقم الطلب.');
      try{await window.ma3daSetDoc(window.ma3daDoc(window.ma3daDB,'requests',ref.id,'customerPrivate','location'),{customerId:user.uid,location:draft.location,locationCoordinates:draft.locationCoordinates||null,createdAt:Date.now()});}catch(privateLocationError){console.warn('Private customer location could not be saved:',privateLocationError);}
      localStorage.setItem('currentRequestId',ref.id);localStorage.setItem('currentOrder',JSON.stringify({location:draft.location,locationCoordinates:draft.locationCoordinates,equipment:draft.type,duration:draft.duration,operator:draft.operator,notes:draft.notes,price:reserve}));localStorage.setItem('orderState','owner_decision_pending');
      showScreen('searchingScreen');const h=$('searchingScreen')?.querySelector('h2');if(h)h.textContent='تم إرسال طلبك للمعدة المختارة';const p=$('searchingScreen')?.querySelector('p');if(p)p.textContent=`رقم الطلب ${orderNumber} — بانتظار موافقة صاحب المعدة`;
      startAcceptanceWatcher();
    }catch(error){console.error('تعذر إنشاء طلب اختيار المعدة:',error);alert(error.message||'تعذر إرسال الطلب إلى صاحب المعدة.');if(btn)btn.disabled=false;}
  }
  document.addEventListener('click',event=>{const pick=event.target.closest('[data-athar-pick]');if(pick){pickEquipment(Number(pick.dataset.atharPick));return;}if(event.target.closest('[data-athar-back-request]'))showScreen('requestScreen');});
  // New owner request list filter (customers only; project request logic is untouched).
  window.loadOperatorNewRequests=async function(){
    const c=$('operatorNewRequestsList'),p=$('operatorProjectRequestsList'),refresh=$('refreshOperatorRequestsBtn'),label=$('operatorRequestsLastUpdated');if(refresh)refresh.disabled=true;
    try{const user=await getOperatorCurrentUser();if(!user?.uid){if(c)c.innerHTML='<div class="card">سجّل الدخول لعرض الطلبات.</div>';return;}const equipment=await getOperatorEquipment();const rows=await ma3daReadUserRows('requests',['equipmentOwnerId','ownerId','operatorId'],user.uid);const customers=[],projects=[];rows.forEach(d=>{const targeted=d.equipmentOwnerId||d.ownerId||d.operatorId;if(targeted!==user.uid)return;if(d.status==='owner_decision_pending')customers.push(d);else if(d.projectId&&(d.status==='searching'||d.status==='extension_requested'))projects.push(d);});customers.sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));projects.sort((a,b)=>operatorRequestDateValue(b.createdAt)-operatorRequestDateValue(a.createdAt));renderOperatorRequestCards(c,customers,'customers');renderOperatorRequestCards(p,projects,'projects');if(label)label.textContent='آخر تحديث: '+new Date().toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'});
    }catch(error){console.error('new owner request list error',error);if(c)c.innerHTML='<div class="card">تعذر تحميل طلبات العملاء الجديدة.</div>';}finally{if(refresh)refresh.disabled=false;}
  };
  window.acceptOperatorRequest=async function(requestId){try{const user=await getOperatorCurrentUser();if(!user?.uid)throw new Error('سجّل الدخول بحساب صاحب المعدة.');const ref=requestRef(requestId),snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');const data=snap.data()||{};if(data.projectId){if(typeof legacyAcceptOperatorRequest==='function')return await legacyAcceptOperatorRequest(requestId);throw new Error('تعذر استدعاء مسار طلب المشروع القديم.');}if(data.status!=='owner_decision_pending'||(data.equipmentOwnerId||data.ownerId||data.operatorId)!==user.uid)throw new Error('الطلب لم يعد متاحًا أو لا يخص معدتك.');await window.ma3daUpdateDoc(ref,{status:'owner_accepted',stage:'booking',ownerAcceptedAt:Date.now(),ownerAcceptedBy:user.uid,updatedAt:Date.now()});localStorage.setItem('currentRequestId',requestId);await loadOperatorCurrentOrder();showScreen('operatorCurrentOrderScreen');}catch(error){alert(error.message||'تعذر قبول الطلب.');await loadOperatorNewRequests();}};
  window.rejectOperatorRequest=async function(requestId){try{const user=await getOperatorCurrentUser();const ref=requestRef(requestId),snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{};if(d.projectId){if(typeof legacyRejectOperatorRequest==='function')return await legacyRejectOperatorRequest(requestId);throw new Error('تعذر استدعاء مسار طلب المشروع القديم.');}if((d.equipmentOwnerId||d.ownerId||d.operatorId)!==user?.uid||d.status!=='owner_decision_pending')throw new Error('لا يمكنك رفض هذا الطلب.');await window.ma3daUpdateDoc(ref,{status:'rejected',stage:'rejected',rejectedBy:user.uid,rejectedAt:Date.now(),updatedAt:Date.now()});await loadOperatorNewRequests();}catch(error){alert(error.message||'تعذر رفض الطلب.');}};
  // Booking confirmation is explicitly a test-cash path until an escrow-capable provider is connected.
  $('atharConfirmBooking')?.addEventListener('click',async()=>{const agree=$('atharCashTestAgree');const feedback=$('atharBookingFeedback');const id=localStorage.getItem('currentRequestId');if(!agree?.checked){if(feedback)feedback.textContent='حدد الموافقة على الحجز التجريبي أولاً.';return;}try{const ref=requestRef(id),snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{};if(d.status!=='owner_accepted'||d.customerId!==(await readUser())?.uid)throw new Error('لم يوافق صاحب المعدة بعد أو الطلب لا يخص حسابك.');const otpBytes=new Uint32Array(1);crypto.getRandomValues(otpBytes);const code=String(100000+(otpBytes[0]%900000));const hash=await otpHash(code);const user=await readUser();const profileCollection=d.requesterRole==='contractor'?'contractors':'customers';const customerProfileSnap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,profileCollection,user.uid));const customerProfile=customerProfileSnap.exists()?customerProfileSnap.data()||{}:{};const savedOrder=JSON.parse(localStorage.getItem('currentOrder')||'{}');let privateLocation={};try{const privateSnap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'requests',id,'customerPrivate','location'));if(privateSnap.exists())privateLocation=privateSnap.data()||{};}catch(_privateReadError){}const preciseLocation=String(savedOrder.location||privateLocation.location||d.location||'');const coordinates=savedOrder.locationCoordinates||privateLocation.locationCoordinates||null;await window.ma3daUpdateDoc(ref,{status:'booking_confirmed',stage:'contact_and_otp',bookingStatus:'test_cash_confirmed',paymentStatus:'cash_test_confirmed',paymentMethod:'cash_test',bookingConfirmedAt:Date.now(),reservedAmount:Number(d.price||0),otpHash:hash,otpCodeCustomer:code,otpCreatedAt:Date.now(),location:preciseLocation,locationCoordinates:coordinates,customerPhone:String(customerProfile.phone||customerProfile.mobile||''),contactSharedAt:Date.now(),updatedAt:Date.now()});otpDraft=code;localStorage.setItem('orderState','booking_confirmed');showCustomerOrder({...d,status:'booking_confirmed',otpCodeCustomer:code,operatorPhone:d.operatorPhone||'',location:preciseLocation,locationCoordinates:coordinates});startAcceptanceWatcher();}catch(error){if(feedback)feedback.textContent=error.message||'تعذر تأكيد الحجز.';}});
  async function otpHash(code){const bytes=new TextEncoder().encode(String(code));const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
  function showBooking(data){$('atharBookingDetails').textContent=`${data.orderNumber||''} · ${data.equipment||'معدة'} · ${data.duration||''} · مبلغ الحجز التجريبي ${money(data.reservedAmount||data.price)}`;const agree=$('atharCashTestAgree');if(agree)agree.checked=false;const feedback=$('atharBookingFeedback');if(feedback)feedback.textContent='';showScreen('atharBookingScreen');}
  function showCustomerOrder(data){
    if(data.status==='owner_accepted'){showBooking(data);return;}
    if(data.status==='rejected'){stopAcceptanceWatcher();alert('اعتذر صاحب المعدة عن الطلب.');showScreen('roleScreen');return;}
    if(['booking_confirmed','owner_arrived','otp_verified','working','completed_pending_customer','disputed','completed','rated'].includes(data.status)){
      const otpPanel=$('atharCustomerOtpPanel');if(otpPanel){otpPanel.hidden=false;$('atharCustomerOtp').textContent=data.otpCodeCustomer||otpDraft||'------';$('atharCustomerOtpState').textContent=data.otpVerified?'تم التحقق من الرمز.':data.status==='owner_arrived'?'صاحب المعدة وصل؛ سلّمه الرمز عند الموقع.':'لا تشارك الرمز إلا مع صاحب المعدة عند الوصول.';}
      let orderNumberEl=$('atharCustomerOrderNumber');if(!orderNumberEl){orderNumberEl=document.createElement('p');orderNumberEl.id='atharCustomerOrderNumber';orderNumberEl.className='athar-new-flow-badge';$('matchedScreen')?.querySelector('.card')?.prepend(orderNumberEl);}if(orderNumberEl)orderNumberEl.textContent=`رقم الطلب: ${data.orderNumber||data.id||''}`;
      const call=$('callBtn');if(call)call.hidden=!String(data.operatorPhone||'').trim();
      const name=$('matchedOperatorName');if(name)name.textContent=data.operatorName||'صاحب المعدة';
      const type=$('matchedOperatorType');if(type)type.textContent=data.equipment||'المعدة';
      const loc=$('matchedLocation');if(loc)loc.textContent=data.location||'موقع العمل';
      const notes=$('matchedRequestNotes');if(notes)notes.textContent=data.notes||'لا توجد ملاحظات';
      const screen={booking_confirmed:'matchedScreen',owner_arrived:'arrivedCustomerScreen',otp_verified:'arrivedCustomerScreen',working:'workingScreen',completed_pending_customer:'completedScreen',disputed:'completedScreen',completed:data.settlementStatus==='settled_test'?'ratingScreen':'completedScreen',rated:'thankYouScreen'}[data.status]||'matchedScreen';if(data.status==='completed'){const finalEl=$('finalPrice');if(finalEl)finalEl.textContent=money(data.finalAmount||data.finalPrice||0);}
      if(['completed_pending_customer','disputed','completed'].includes(data.status)){const panel=$('atharCustomerFinalReviewPanel');if(panel){panel.hidden=data.status==='completed';$('atharCustomerFinalSummary').textContent=`الوقت الفعلي: ${Number(data.actualMinutes||0)} دقيقة · قيمة العمل: ${money(data.finalAmount||0)} · إجمالي الحجز والتمديد التجريبي: ${money(data.reservedAmount||0)} · ${Number(data.additionalAmountDue||0)>0?'المبلغ الإضافي: '+money(data.additionalAmountDue):'المبلغ الزائد المستحق للاسترداد تجريبيًا: '+money(data.refundAmount||0)} · حالة الاعتراض: ${data.disputeStatus||'لا يوجد'}`;const b=$('atharConfirmFinalSettlementBtn');if(b)b.disabled=data.status==='disputed';const d=$('atharOpenRentalDisputeBtn');if(d)d.disabled=data.status==='disputed';}}
       const extPanel=$('atharCustomerExtensionPanel');if(extPanel){const x=data.extensionRequest||{};extPanel.hidden=!(data.status==='working'&&x.status==='pending_customer');const detail=$('atharCustomerExtensionDetails');if(detail)detail.textContent=`طلب صاحب المعدة تمديد ${Number(x.hours||0)} ساعة بمبلغ ${money(x.amount||0)}. لن يتم اعتماد التمديد قبل موافقتك وتأكيد الدفع التجريبي.`;}

      if(screen==='arrivedCustomerScreen'){const e=$('arrivedCustomerEquipment');if(e)e.textContent=data.equipment||'المعدة';const l=$('arrivedCustomerLocation');if(l)l.textContent=data.location||'موقعك';}
      if(screen==='workingScreen'){updateWorkingScreen();const start=Number(data.workStartedAt||Date.now());if(start!==customerTimerStart){customerTimerStart=start;workStartTime=start;clearInterval(timerInterval);timerInterval=setInterval(updateTimer,1000);updateTimer();}}else if(customerTimerStart){clearInterval(timerInterval);customerTimerStart=0;}
      if(screen==='ratingScreen')showScreen('ratingScreen');else showScreen(screen);
    }
  }
  function stopAcceptanceWatcher(){if(window.stopAcceptanceWatcher)window.stopAcceptanceWatcher();}
  window.stopAcceptanceWatcher=function(){if(watcher){try{watcher();}catch(_e){}watcher=null;watcherRequestId='';}};
  window.startAcceptanceWatcher=function(){const id=localStorage.getItem('currentRequestId');if(!id||!window.ma3daDB||!window.ma3daOnSnapshot)return;const currentUser=readUser();Promise.resolve(currentUser).then(user=>{if(!user?.uid){window.stopAcceptanceWatcher();return;}if(watcherRequestId===id&&watcher)return;window.stopAcceptanceWatcher();watcherRequestId=id;watcher=window.ma3daOnSnapshot(requestRef(id),snapshot=>{if(!snapshot.exists())return;const data=snapshot.data()||{};showCustomerOrder(data);if(['rated','rejected'].includes(data.status)||(data.status==='completed'&&data.customerSettlementConfirmed))window.stopAcceptanceWatcher();},error=>{console.warn('ATHAR customer order listener error',error);window.stopAcceptanceWatcher();});});};
  // Current owner screen lifecycle and security guards.
  const arrival=$('operatorArrivedBtn'),start=$('operatorStartWorkBtn'),finish=$('operatorEndWorkBtn');
  for(const btn of [arrival,start,finish])if(btn){const clone=btn.cloneNode(true);btn.replaceWith(clone);}
  function ownerScreenStatus(data){const status=$('operatorCurrentStatusText'),icon=$('operatorCurrentStatusIcon'),arr=$('operatorArrivedBtn'),st=$('operatorStartWorkBtn'),end=$('operatorEndWorkBtn'),timer=$('operatorWorkTimerBox'),otp=$('atharOwnerOtpPanel');
    if(!data){if(status)status.textContent='لا يوجد طلب';if(arr)arr.hidden=true;if(st)st.hidden=true;if(end)end.hidden=true;if(timer)timer.hidden=true;if(otp)otp.hidden=true;const contactPanel=$('atharOwnerContactPanel');if(contactPanel)contactPanel.hidden=true;['operatorOpenCustomerMapBtn','operatorChatCustomerBtn','operatorCallCustomerBtn'].forEach(id=>{const b=$(id);if(b)b.hidden=true;});const gps=$('operatorCheckDistanceBtn');if(gps)gps.style.display='none';return;}
    if(status)status.textContent=data.status==='completed_pending_customer'?'انتهى العمل — بانتظار مراجعة العميل':data.status==='disputed'?'الطلب متوقف — الاعتراض لدى الدعم':data.status==='completed'&&data.settlementStatus==='needs_settlement_test'?'انتهى العمل — بانتظار تأكيد التسوية التجريبية':({owner_accepted:'موافقة صاحب المعدة — بانتظار حجز العميل',booking_confirmed:'تم تأكيد الحجز التجريبي — توجه للموقع',owner_arrived:'وصلت للموقع — تحقق من رمز العميل',otp_verified:'تم التحقق من رمز العميل — جاهز لبدء العمل',working:'العمل جارٍ',completed:'انتهى العمل — التسوية التجريبية مكتملة',rated:'اكتمل الطلب والتقييم'})[data.status]||data.status;
    if(icon)icon.textContent=data.status==='working'?'🔵':data.status==='completed'||data.status==='rated'?'✅':'🟡';
    if(arr){arr.style.display=data.status==='booking_confirmed'?'block':'none';arr.disabled=true;}
    if(st)st.style.display=data.status==='otp_verified'?'block':'none';
    if(end)end.style.display=data.status==='working'?'block':'none';const ext=$('atharOwnerExtensionPanel');if(ext)ext.hidden=data.status!=='working';const extState=$('atharExtensionOwnerState');if(extState){const x=data.extensionRequest||{};extState.textContent=x.status==='pending_customer'?`طلب تمديد ${x.hours} ساعة بمبلغ ${money(x.amount)} — بانتظار العميل`:x.status==='approved_paid_test'?'وافق العميل وأكد الدفع التجريبي؛ يمكن مواصلة العمل.':x.status==='rejected'?'رفض العميل التمديد.':'';}
    if(timer)timer.style.display=data.status==='working'?'block':'none';
    if(otp)otp.hidden=data.status!=='owner_arrived';
    const contactReady=['booking_confirmed','owner_arrived','otp_verified','working','completed','rated'].includes(data.status);const contactPanel=$('atharOwnerContactPanel');if(contactPanel)contactPanel.hidden=!['booking_confirmed','owner_arrived','otp_verified','working','completed','rated'].includes(data.status);const shareBtn=$('atharShareOwnerContactBtn');if(shareBtn)shareBtn.hidden=!!data.operatorPhone;

    ['operatorOpenCustomerMapBtn','operatorChatCustomerBtn'].forEach(id=>{const b=$(id);if(b)b.hidden=!contactReady;});const ownerCall=$('operatorCallCustomerBtn');if(ownerCall)ownerCall.hidden=!(contactReady&&String(data.customerPhone||'').trim());
    const locationRow=$('operatorCurrentLocation')?.closest('.info-row');if(locationRow)locationRow.hidden=!contactReady;
    const customerNameRow=$('operatorCurrentCustomerName')?.closest('.info-row');if(customerNameRow)customerNameRow.hidden=!contactReady;
    const gps=$('operatorCheckDistanceBtn');if(gps)gps.style.display=data.status==='booking_confirmed'?'block':'none';
    if(data.status==='working'&&data.workStartedAt&&Number(data.workStartedAt)!==ownerTimerStart&&typeof startOperatorTimer==='function'){ownerTimerStart=Number(data.workStartedAt);startOperatorTimer(data.workStartedAt);}else if(data.status!=='working'&&ownerTimerStart){clearInterval(operatorTimerInterval);ownerTimerStart=0;}
  }
  window.updateOperatorCurrentUI=function(data){ownerScreenStatus(data);if(!data)return;let orderNumberEl=$('atharOwnerOrderNumber');if(!orderNumberEl){orderNumberEl=document.createElement('p');orderNumberEl.id='atharOwnerOrderNumber';orderNumberEl.className='athar-new-flow-badge';$('operatorCurrentOrderScreen')?.querySelector('.card')?.prepend(orderNumberEl);}if(orderNumberEl)orderNumberEl.textContent=`رقم الطلب: ${data.orderNumber||data.id||''}`;['operatorCurrentEquipment','operatorCurrentLocation','operatorCurrentDuration','operatorCurrentPrice','operatorCurrentCustomerName'].forEach((id,i)=>{const el=$(id);if(!el)return;const vals=[data.equipment,data.location,data.duration,money(data.reservedAmount||data.price),data.customerName];el.textContent=vals[i]||'—';});window.ma3daActiveRequestData=data;};
  window.loadOperatorCurrentOrder=async function(){const id=localStorage.getItem('currentRequestId');if(!id){ownerScreenStatus(null);if(ownerWatcher){try{ownerWatcher();}catch(_e){}ownerWatcher=null;ownerWatcherRequestId='';}return;}try{const ownerUser=await getOperatorCurrentUser();if(!ownerUser?.uid){ownerScreenStatus(null);if(ownerWatcher){try{ownerWatcher();}catch(_e){}ownerWatcher=null;ownerWatcherRequestId='';}return;}const snap=await window.ma3daGetDoc(requestRef(id));if(!snap.exists()){ownerScreenStatus(null);return;}window.updateOperatorCurrentUI(snap.data()||{});if(ownerWatcherRequestId!==id){if(ownerWatcher){try{ownerWatcher();}catch(_e){}}ownerWatcherRequestId=id;ownerWatcher=window.ma3daOnSnapshot(requestRef(id),fresh=>{if(!fresh.exists())return;const latest=fresh.data()||{};window.updateOperatorCurrentUI(latest);if(['rated','rejected'].includes(latest.status)){try{ownerWatcher();}catch(_e){}ownerWatcher=null;ownerWatcherRequestId='';}},error=>{console.warn('owner rental order listener error',error);if(ownerWatcher){try{ownerWatcher();}catch(_e){}}ownerWatcher=null;ownerWatcherRequestId='';});}}catch(error){console.error('new owner current order load error',error);}};
  window.ma3daUpdateArrivalEligibility=function(data){const btn=$('operatorArrivedBtn'),feedback=$('operatorDistanceFeedback');const target=ma3daCustomerCoordinates(data||window.ma3daActiveRequestData||{});const distance=target&&ma3daOwnerPosition?ma3daDistanceKm(ma3daOwnerPosition,target):Infinity;const eligible=!!(Number.isFinite(distance)&&distance<=1&&Number(ma3daOwnerPosition?.accuracy||Infinity)<=100&&String((data||{}).status||'')==='booking_confirmed');if(btn){btn.disabled=!eligible;btn.setAttribute('aria-disabled',String(!eligible));}if(feedback){if(!target)feedback.textContent='إحداثيات موقع العميل غير متاحة؛ لا يمكن تأكيد الوصول.';else if(!ma3daOwnerPosition)feedback.textContent='تحقق من موقعك قبل تأكيد الوصول.';else feedback.textContent=eligible?`أنت على بعد ${distance.toFixed(2)} كم. يمكنك تأكيد الوصول.`:`المسافة ${Number.isFinite(distance)?distance.toFixed(2):'—'} كم؛ يجب أن تكون داخل 1 كم ودقة GPS أقل من 100 متر.`;}};
  window.operatorMarkArrived=async function(){const id=localStorage.getItem('currentRequestId');try{const snap=await window.ma3daGetDoc(requestRef(id));if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{};if(d.status!=='booking_confirmed')throw new Error('الوصول متاح بعد تأكيد الحجز.');const owner=await getOperatorCurrentUser();if((d.equipmentOwnerId||d.ownerId||d.operatorId)!==owner?.uid)throw new Error('هذا الطلب ليس لمعدتك.');ma3daOwnerPosition=await ma3daGetOwnerPosition();const target=ma3daCustomerCoordinates(d);if(!target||!ma3daOwnerPosition||ma3daOwnerPosition.accuracy>100||ma3daDistanceKm(ma3daOwnerPosition,target)>1)throw new Error('يجب أن تكون على بُعد كيلومتر أو أقل ودقة GPS مناسبة.');await window.ma3daUpdateDoc(requestRef(id),{status:'owner_arrived',stage:'otp_verification',arrivedAt:Date.now(),arrivalDistanceKm:ma3daDistanceKm(ma3daOwnerPosition,target),updatedAt:Date.now()});await window.loadOperatorCurrentOrder();}catch(error){alert(error.message||'تعذر تأكيد الوصول.');}};
  window.operatorStartWork=async function(){const id=localStorage.getItem('currentRequestId');try{const snap=await window.ma3daGetDoc(requestRef(id));if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{};if(d.status!=='otp_verified'||!d.otpVerified)throw new Error('لا يبدأ العمل قبل تحقق رمز العميل.');const owner=await getOperatorCurrentUser();if((d.equipmentOwnerId||d.ownerId||d.operatorId)!==owner?.uid)throw new Error('هذا الطلب ليس لمعدتك.');const now=Date.now();const authorizedHours=Number(d.durationHours||4);if(!Number.isFinite(authorizedHours)||authorizedHours<=0)throw new Error('مدة الحجز غير صحيحة.');await window.ma3daUpdateDoc(requestRef(id),{status:'working',stage:'work_started',workStartedAt:now,plannedEndAt:now+authorizedHours*3600000,updatedAt:now});await window.loadOperatorCurrentOrder();}catch(error){alert(error.message||'تعذر بدء العمل.');}};
  window.operatorFinishWork=async function(){
    const id=localStorage.getItem('currentRequestId');
    try{
      const snap=await window.ma3daGetDoc(requestRef(id));if(!snap.exists())throw new Error('الطلب غير موجود.');
      const d=snap.data()||{};if(d.status!=='working'||!d.workStartedAt)throw new Error('لا يمكن إنهاء العمل قبل بدء التنفيذ.');
      const owner=await getOperatorCurrentUser();if((d.equipmentOwnerId||d.ownerId||d.operatorId)!==owner?.uid)throw new Error('هذا الطلب ليس لمعدتك.');
      const ended=Date.now(),minutes=Math.max(1,Math.ceil((ended-Number(d.workStartedAt))/60000)),rate=Number(d.hourlyPrice||0);
      const authorizedMinutes=Math.max(1,Math.round(Number(d.durationHours||0)*60));
      const billableMinutes=Math.min(minutes,authorizedMinutes),overrunMinutes=Math.max(0,minutes-authorizedMinutes);
      const finalAmount=Math.round(rate*billableMinutes/60*100)/100,reserved=Number(d.reservedAmount||d.price||0);
      const refund=Math.max(0,Math.round((reserved-finalAmount)*100)/100),extra=Math.max(0,Math.round((finalAmount-reserved)*100)/100);
      await window.ma3daUpdateDoc(requestRef(id),{status:'completed_pending_customer',stage:'customer_final_review',workCompletedAt:ended,actualMinutes:minutes,billableMinutes,overrunMinutes,authorizedMinutes,finalAmount,finalPrice:finalAmount,settlementStatus:'awaiting_customer_confirmation',paymentStatus:extra>0?'cash_test_due':'cash_test_review',cashTestSettlement:true,refundAmount:refund,additionalAmountDue:extra,customerSettlementConfirmed:false,updatedAt:ended});
      const invoiceNumber='ATH-INV-'+String(d.orderNumber||id).replace(/[^A-Za-z0-9-]/g,'');
      const invoiceData={invoiceKind:'equipment_rental',invoiceNumber,requestId:id,orderNumber:d.orderNumber||id,customerId:d.customerId||'',customerName:d.customerName||'',ownerId:owner.uid,equipmentOwnerId:owner.uid,ownerName:d.operatorName||'صاحب المعدة',ownerEmail:owner.email||'',equipment:d.equipment||'معدة',equipmentId:d.equipmentId||'',hourlyPrice:rate,actualMinutes:minutes,billableMinutes,overrunMinutes,authorizedMinutes,reservedAmount:reserved,invoiceAmount:finalAmount,refundAmount:refund,additionalAmountDue:extra,platformCommissionStatus:'not_configured',ownerNetAmountStatus:'not_calculated',currency:'SAR',paymentStatus:'cash_test_review',settlementStatus:'awaiting_customer_confirmation',paymentMethod:'cash_test',description:'فاتورة توثيقية للاختبار النقدي؛ لا تمثل تحصيلًا أو استردادًا أو تحويلًا إلكترونيًا.',createdAt:new Date(ended),createdAtMs:ended,updatedAt:new Date(ended),schemaVersion:2};
      try{
        if(!d.invoiceId&&typeof window.ma3daAddDoc==='function'){
          const invoiceRef=await window.ma3daAddDoc(window.ma3daCollection(window.ma3daDB,'projectInvoices'),invoiceData);
          await window.ma3daUpdateDoc(requestRef(id),{invoiceId:invoiceRef.id,invoiceNumber,invoiceSnapshot:invoiceData,invoiceWriteStatus:'saved_collection',updatedAt:Date.now()});
        }
      }catch(invoiceError){
        console.warn('تعذر إنشاء وثيقة الفاتورة في projectInvoices؛ حفظ نسخة داخل الطلب:',invoiceError);
        await window.ma3daUpdateDoc(requestRef(id),{invoiceNumber,invoiceSnapshot:invoiceData,invoiceWriteStatus:'embedded_fallback',invoiceWriteError:String(invoiceError?.code||invoiceError?.message||'unknown'),updatedAt:Date.now()});
      }
      localStorage.setItem('finalPrice',String(finalAmount));const priceEl=$('finalPrice');if(priceEl)priceEl.textContent=money(finalAmount);
      clearInterval(operatorTimerInterval);await window.loadOperatorCurrentOrder();showScreen('operatorCompletedScreen');
      alert('تم تسجيل نهاية العمل. تنتظر التسوية الآن تأكيد العميل أو اعتراضه.');
    }catch(error){alert(error.message||'تعذر إنهاء العمل.');}
  };
  if($('operatorArrivedBtn'))$('operatorArrivedBtn').addEventListener('click',window.operatorMarkArrived);
  if($('operatorStartWorkBtn'))$('operatorStartWorkBtn').addEventListener('click',window.operatorStartWork);
  if($('operatorEndWorkBtn'))$('operatorEndWorkBtn').addEventListener('click',window.operatorFinishWork);
  // طلب التمديد: لا يعتمد إلا بموافقة العميل وتأكيد الدفع التجريبي.
  $('atharRequestExtensionBtn')?.addEventListener('click',async()=>{
    const id=localStorage.getItem('currentRequestId'),hours=Number($('atharExtensionHours')?.value||0),feedback=$('atharExtensionOwnerFeedback');
    try{
      if(!Number.isInteger(hours)||hours<1||hours>240)throw new Error('أدخل عدد ساعات صحيحًا بين 1 و240.');
      const user=await getOperatorCurrentUser(),ref=requestRef(id),snap=await window.ma3daGetDoc(ref);
      if(!snap.exists())throw new Error('الطلب غير موجود.');
      const d=snap.data()||{};if(d.status!=='working')throw new Error('التمديد متاح أثناء العمل فقط.');if(Number(d.plannedEndAt||0)&&Date.now()>=Number(d.plannedEndAt))throw new Error('انتهت المدة المعتمدة؛ لا يمكن طلب تمديد بأثر رجعي.');
      if((d.equipmentOwnerId||d.ownerId||d.operatorId)!==user?.uid)throw new Error('هذا الطلب لا يخص معدتك.');
      if(d.extensionRequest?.status==='pending_customer')throw new Error('يوجد طلب تمديد بانتظار العميل.');
      const amount=Math.round(Number(d.hourlyPrice||0)*hours*100)/100;if(!amount)throw new Error('سعر الساعة غير صحيح.');
      await window.ma3daUpdateDoc(ref,{extensionRequest:{id:'EXT-'+Date.now(),hours,amount,status:'pending_customer',requestedBy:user.uid,requestedAt:Date.now(),hourlyPrice:Number(d.hourlyPrice||0)},updatedAt:Date.now()});
      if(feedback)feedback.textContent=`تم إرسال طلب تمديد ${hours} ساعة بمبلغ ${money(amount)} للعميل.`;
      await window.loadOperatorCurrentOrder();
    }catch(error){if(feedback)feedback.textContent=error.message||'تعذر إرسال التمديد.';}
  });
  $('atharApproveExtensionBtn')?.addEventListener('click',async()=>{
    const id=localStorage.getItem('currentRequestId'),feedback=$('atharExtensionCustomerFeedback');
    try{
      if(!$('atharExtensionCashAgree')?.checked)throw new Error('وافق على المبلغ وحدد تأكيد الدفع التجريبي أولًا.');
      const user=await readUser(),ref=requestRef(id),snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');
      const d=snap.data()||{},x=d.extensionRequest||{};if(d.customerId!==user?.uid||d.status!=='working'||x.status!=='pending_customer')throw new Error('طلب التمديد لم يعد متاحًا لهذا الحساب.');if(Number(d.plannedEndAt||0)&&Date.now()>=Number(d.plannedEndAt))throw new Error('انتهت المدة الأصلية قبل اعتماد التمديد؛ لا يمكن تفعيله بأثر رجعي.');
      const newReserved=Math.round((Number(d.reservedAmount||d.price||0)+Number(x.amount||0))*100)/100;
      const history=[...(Array.isArray(d.extensionHistory)?d.extensionHistory:[]),{...x,status:'approved_paid_test',approvedBy:user.uid,approvedAt:Date.now(),paymentStatus:'cash_test_confirmed'}];
      await window.ma3daUpdateDoc(ref,{extensionRequest:{...x,status:'approved_paid_test',approvedBy:user.uid,approvedAt:Date.now(),paymentStatus:'cash_test_confirmed'},extensionHistory:history,reservedAmount:newReserved,price:newReserved,durationHours:Number(d.durationHours||0)+Number(x.hours||0),plannedEndAt:Number(d.plannedEndAt||Date.now())+Number(x.hours||0)*3600000,extensionPaymentStatus:'cash_test_confirmed',updatedAt:Date.now()});
      if(feedback)feedback.textContent='تم اعتماد التمديد وتسجيل الدفع التجريبي. يمكن استمرار العمل.';
    }catch(error){if(feedback)feedback.textContent=error.message||'تعذر اعتماد التمديد.';}
  });
  $('atharRejectExtensionBtn')?.addEventListener('click',async()=>{
    const id=localStorage.getItem('currentRequestId'),feedback=$('atharExtensionCustomerFeedback');
    try{const user=await readUser(),ref=requestRef(id),snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{},x=d.extensionRequest||{};if(d.customerId!==user?.uid||x.status!=='pending_customer')throw new Error('لا يوجد تمديد بانتظار موافقتك.');await window.ma3daUpdateDoc(ref,{extensionRequest:{...x,status:'rejected',rejectedBy:user.uid,rejectedAt:Date.now()},updatedAt:Date.now()});if(feedback)feedback.textContent='تم رفض التمديد؛ تبقى المدة الأصلية/المعتمدة فقط.';}catch(error){if(feedback)feedback.textContent=error.message||'تعذر رفض التمديد.';}
  });
  $('atharConfirmFinalSettlementBtn')?.addEventListener('click',async()=>{
    const id=localStorage.getItem('currentRequestId'),feedback=$('atharFinalReviewFeedback');
    try{const user=await readUser(),ref=requestRef(id),snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{};if(d.customerId!==user?.uid||d.status!=='completed_pending_customer')throw new Error('لا يمكن تأكيد هذه التسوية الآن.');const now=Date.now();const patch={status:'completed',stage:'customer_confirmed',customerSettlementConfirmed:true,customerSettlementConfirmedAt:now,settlementStatus:'settled_test',paymentStatus:Number(d.additionalAmountDue||0)>0?'cash_test_settled':'cash_test_reviewed',refundStatus:Number(d.refundAmount||0)>0?'refund_recorded_test':'not_applicable',settledAt:now,requestClosed:true,updatedAt:now};await window.ma3daUpdateDoc(ref,{...patch,invoiceSnapshot:d.invoiceSnapshot?{...d.invoiceSnapshot,settlementStatus:'settled_test',paymentStatus:patch.paymentStatus,refundAmount:Number(d.refundAmount||0),additionalAmountDue:Number(d.additionalAmountDue||0),customerSettlementConfirmedAt:now,updatedAt:new Date(now)}:d.invoiceSnapshot});if(d.invoiceId){try{await window.ma3daUpdateDoc(window.ma3daDoc(window.ma3daDB,'projectInvoices',d.invoiceId),{settlementStatus:'settled_test',paymentStatus:patch.paymentStatus,refundAmount:Number(d.refundAmount||0),additionalAmountDue:Number(d.additionalAmountDue||0),customerSettlementConfirmedAt:now,updatedAt:now});}catch(e){console.warn('تعذر تحديث سجل الفاتورة:',e);}}if(feedback)feedback.textContent='تم تسجيل موافقتك على التسوية التجريبية.';showScreen('ratingScreen');}catch(error){if(feedback)feedback.textContent=error.message||'تعذر تأكيد التسوية.';}
  });
  $('atharOpenRentalDisputeBtn')?.addEventListener('click',async()=>{
    const id=localStorage.getItem('currentRequestId'),feedback=$('atharFinalReviewFeedback');
    try{const reason=prompt('اكتب سبب الاعتراض على الوقت أو المبلغ:');if(reason===null)return;if(!reason.trim())throw new Error('اكتب سبب الاعتراض.');const user=await readUser(),ref=requestRef(id),snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{};if(d.customerId!==user?.uid||d.status!=='completed_pending_customer')throw new Error('لا يمكن فتح اعتراض لهذا الطلب الآن.');await window.ma3daUpdateDoc(ref,{status:'disputed',stage:'support_dispute',disputeStatus:'pending_support',dispute:{reason:reason.trim(),openedBy:user.uid,openedAt:Date.now(),status:'pending_support'},settlementStatus:'disputed',updatedAt:Date.now()});if(feedback)feedback.textContent='تم رفع الاعتراض وإيقاف اعتماد التسوية حتى مراجعة الدعم.';}catch(error){if(feedback)feedback.textContent=error.message||'تعذر رفع الاعتراض.';}
  });
  async function loadAtharRentalDisputes(){
    const list=$('atharRentalDisputesList');if(!list)return;list.textContent='جاري تحميل النزاعات...';
    try{const user=window.ma3daAuth?.currentUser;if(!user?.uid)throw new Error('سجّل الدخول بحساب الدعم.');const staffSnap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'supportStaff',user.uid));const staff=staffSnap.exists()?staffSnap.data()||{}:{};const claims=await user.getIdTokenResult?.();if(!(staff.active===true||staff.status==='active'||['support','admin','owner'].includes(String(staff.role||claims?.claims?.role||''))))throw new Error('هذا القسم مخصص لموظفي الدعم المعتمدين.');
      const snap=await window.ma3daGetDocs(window.ma3daCollection(window.ma3daDB,'requests'));const rows=[];snap.forEach(doc=>{const d=doc.data()||{};if(d.flowVersion==='ATHAR-RENTAL-2026-NEW'&&['pending_support','support_review_required'].includes(d.disputeStatus))rows.push({id:doc.id,...d});});
      list.innerHTML=rows.length?rows.map(r=>`<article class="card"><h3>${esc(r.orderNumber||r.id)} — ${esc(r.equipment||'معدة')}</h3><p>العميل: ${esc(r.customerName||'—')} · صاحب المعدة: ${esc(r.operatorName||'—')}</p><p>وقت البداية: ${esc(String(r.workStartedAt||'—'))} · وقت النهاية: ${esc(String(r.workCompletedAt||'—'))}</p><p>المدة الفعلية: ${Number(r.actualMinutes||0)} دقيقة · القيمة: ${money(r.finalAmount||0)} ريال</p><p>سبب الاعتراض: ${esc(r.dispute?.reason||'—')}</p><button type="button" class="main-btn" data-athar-dispute-decision="confirm" data-request-id="${esc(r.id)}">إغلاق الاعتراض وإحالة التسوية للعميل</button><button type="button" class="back-btn" data-athar-dispute-decision="uphold" data-request-id="${esc(r.id)}">تثبيت الاعتراض وإبقاء الطلب للمراجعة</button></article>`).join(''):'<div class="card">لا توجد نزاعات تأجير معلقة.</div>';
    }catch(error){list.textContent=error.message||'تعذر تحميل النزاعات.';}
  }
  $('atharRefreshRentalDisputesBtn')?.addEventListener('click',loadAtharRentalDisputes);
  document.addEventListener('click',async event=>{
    const b=event.target.closest('[data-athar-dispute-decision]');if(!b)return;const id=b.dataset.requestId,decision=b.dataset.atharDisputeDecision;
    try{const user=window.ma3daAuth?.currentUser;if(!user?.uid)throw new Error('سجّل الدخول بحساب الدعم.');const staffSnap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'supportStaff',user.uid));const staff=staffSnap.exists()?staffSnap.data()||{}:{};const claims=await user.getIdTokenResult?.();if(!(staff.active===true||staff.status==='active'||['support','admin','owner'].includes(String(staff.role||claims?.claims?.role||''))))throw new Error('غير مصرح لك.');const ref=requestRef(id),snap=await window.ma3daGetDoc(ref);if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{};if(d.disputeStatus!=='pending_support')throw new Error('تم تحديث حالة الاعتراض مسبقًا.');const now=Date.now();if(decision==='confirm'){await window.ma3daUpdateDoc(ref,{status:'completed_pending_customer',stage:'customer_final_review',disputeStatus:'resolved_for_customer_confirmation',dispute:{...(d.dispute||{}),status:'resolved_for_customer_confirmation',decision:'return_to_customer',decidedBy:user.uid,decidedAt:now},settlementStatus:'awaiting_customer_confirmation',updatedAt:now});}else{await window.ma3daUpdateDoc(ref,{disputeStatus:'support_review_required',dispute:{...(d.dispute||{}),status:'support_review_required',decision:'upheld_pending_review',decidedBy:user.uid,decidedAt:now},settlementStatus:'disputed',updatedAt:now});}alert('تم حفظ قرار المراجعة التوثيقي. لم يتم تنفيذ أي استرداد أو تحويل مالي.');await loadAtharRentalDisputes();}catch(error){alert(error.message||'تعذر حفظ قرار الدعم.');}
  });
  document.querySelector('[data-support-section="rentalDisputes"]')?.addEventListener('click',()=>{supportSetSection('rentalDisputes');loadAtharRentalDisputes();});
  $('operatorOpenCustomerMapBtn')?.addEventListener('click',async()=>{try{const id=localStorage.getItem('currentRequestId');if(!id)throw new Error('لا يوجد طلب حالي.');const snap=await window.ma3daGetDoc(requestRef(id));if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{};if(!['booking_confirmed','owner_arrived','otp_verified','working','completed','rated'].includes(d.status))throw new Error('الموقع يظهر بعد تأكيد الحجز.');ma3daOpenCustomerMap(d);}catch(error){alert(error.message||'تعذر فتح موقع العميل.');}});
  $('atharShareOwnerContactBtn')?.addEventListener('click',async()=>{const id=localStorage.getItem('currentRequestId'),feedback=$('atharOwnerContactFeedback');try{const user=await getOperatorCurrentUser();if(!user?.uid)throw new Error('سجّل الدخول بحساب صاحب المعدة.');const requestSnap=await window.ma3daGetDoc(requestRef(id));if(!requestSnap.exists())throw new Error('الطلب غير موجود.');const r=requestSnap.data()||{};if((r.equipmentOwnerId||r.ownerId||r.operatorId)!==user.uid)throw new Error('هذا الطلب ليس لمعدتك.');if(!['booking_confirmed','owner_arrived','otp_verified','working','completed'].includes(r.status))throw new Error('مشاركة التواصل متاحة بعد تأكيد الحجز.');const profileSnap=await window.ma3daGetDoc(window.ma3daDoc(window.ma3daDB,'operators',user.uid));const profile=profileSnap.exists()?profileSnap.data()||{}:{};const phone=String(profile.phone||profile.mobile||'').trim();const name=String(profile.name||profile.fullName||profile.displayName||'صاحب المعدة').trim();if(!phone)throw new Error('رقم الجوال غير مسجل في حساب صاحب المعدة.');await window.ma3daUpdateDoc(requestRef(id),{operatorPhone:phone,operatorName:name,contactSharedAt:Date.now(),contactSharedBy:user.uid,updatedAt:Date.now()});if(feedback)feedback.textContent='تمت مشاركة رقم التواصل مع العميل.';await window.loadOperatorCurrentOrder();}catch(error){if(feedback)feedback.textContent=error.message||'تعذر مشاركة بيانات التواصل.';}});
  $('atharVerifyOtpBtn')?.addEventListener('click',async()=>{const id=localStorage.getItem('currentRequestId'),input=$('atharOwnerOtpInput'),feedback=$('atharOwnerOtpFeedback');const code=String(input?.value||'').trim();try{if(!/^\d{6}$/.test(code))throw new Error('أدخل رمزًا من ستة أرقام.');const snap=await window.ma3daGetDoc(requestRef(id));if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{};if(d.status!=='owner_arrived')throw new Error('يجب تسجيل الوصول أولًا.');const owner=await getOperatorCurrentUser();if((d.equipmentOwnerId||d.ownerId||d.operatorId)!==owner?.uid)throw new Error('هذا الطلب ليس لمعدتك.');if(await otpHash(code)!==String(d.otpHash||''))throw new Error('رمز التحقق غير صحيح.');await window.ma3daUpdateDoc(requestRef(id),{status:'otp_verified',stage:'otp_verified',otpVerified:true,otpVerifiedAt:Date.now(),otpVerifiedBy:(await getOperatorCurrentUser())?.uid||'',updatedAt:Date.now()});if(feedback)feedback.textContent='تم التحقق بنجاح. يمكنك بدء العمل الآن.';await window.loadOperatorCurrentOrder();}catch(error){if(feedback)feedback.textContent=error.message||'فشل التحقق.';}});
  // Clear old legacy payment/rating handlers; this lifecycle owns the rental order now.
  const oldRating=$('ratingBtn');if(oldRating){const freshRating=oldRating.cloneNode(true);oldRating.replaceWith(freshRating);}
  document.querySelectorAll('.stars button').forEach(star=>star.addEventListener('click',()=>{selectedRating=Number(star.dataset.rating||0);const b=$('ratingBtn');if(b)b.disabled=!selectedRating;}));
  const newRatingBtn=$('ratingBtn');if(newRatingBtn)newRatingBtn.addEventListener('click',async()=>{if(!selectedRating){alert('اختر تقييمًا أولًا.');return;}const id=localStorage.getItem('currentRequestId');try{const snap=await window.ma3daGetDoc(requestRef(id));if(!snap.exists())throw new Error('الطلب غير موجود.');const d=snap.data()||{};if(d.status!=='completed'||d.settlementStatus!=='settled_test')throw new Error('التقييم متاح بعد انتهاء العمل والتسوية.');const user=await readUser();if(d.customerId!==user?.uid)throw new Error('هذا الطلب ليس لحسابك.');await window.ma3daUpdateDoc(requestRef(id),{status:'rated',stage:'rated',rating:selectedRating,equipmentRating:selectedRating,ratingTarget:'equipment',ratedAt:Date.now(),ratedBy:user?.uid||'',updatedAt:Date.now()});showScreen('thankYouScreen');}catch(error){alert(error.message||'تعذر حفظ التقييم.');}});
  // Contact buttons and tracking are hidden before booking; the screen itself is not opened until reservation.
  // Customer OTP panel also appears on the arrival screen, so the customer can show it at the site.
  if(!$('atharCustomerOtpArrivalPanel')){const panel=document.createElement('div');panel.id='atharCustomerOtpArrivalPanel';panel.className='card';panel.hidden=true;panel.innerHTML='<h3>رمز التحقق</h3><strong id="atharCustomerOtpArrival" style="font-size:2rem;letter-spacing:.2em"></strong><p>أعط الرمز لصاحب المعدة بعد وصوله.</p>'; $('arrivedCustomerScreen')?.appendChild(panel);}
  window.loadCustomerOrders=async function(type){const list=$(type==='current'?'currentOrdersList':'previousOrdersList');if(!list)return;list.innerHTML='<p>جاري تحميل الطلبات...</p>';try{const user=await Promise.race([readUser(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('انتهت مهلة التحقق من تسجيل الدخول. أعد تحميل الصفحة ثم حاول مرة أخرى.')),15000))]);if(!user?.uid)throw new Error('سجّل الدخول أولًا.');const rows=await Promise.race([ma3daReadUserRows('requests',['customerId','requesterId'],user.uid),new Promise((_,reject)=>setTimeout(()=>reject(new Error('انتهت مهلة تحميل الطلبات. تحقق من اتصال Firebase ثم أعد المحاولة.')),15000))]);const current=['owner_decision_pending','owner_accepted','booking_confirmed','owner_arrived','otp_verified','working','completed_pending_customer','disputed'];const previous=['completed','rated','rejected','cancelled'];const orders=rows.filter(d=>(d.customerId||d.requesterId)===user.uid&&(type==='current'?current.includes(String(d.status||'')):previous.includes(String(d.status||'')))).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));if(!orders.length){list.innerHTML=`<div class="empty-state"><h3>${type==='current'?'لا توجد طلبات حالية':'لا توجد طلبات سابقة'}</h3><p>${type==='current'?'عند تقديم طلب جديد ستظهر تفاصيله هنا.':'ستظهر الطلبات المنتهية أو المرفوضة هنا.'}</p></div>`;return;}list.innerHTML='';orders.forEach(d=>{const card=document.createElement('article');card.className='customer-order-card';card.innerHTML=`<div class="customer-order-header"><strong>🚜 ${esc(d.equipment||'معدة')}</strong><span class="customer-order-status">${esc(window.ma3daNewRentalStatusText(d.status))}</span></div><div class="customer-order-info"><div>رقم الطلب: <strong>${esc(d.orderNumber||d.id)}</strong></div><div>الموقع: ${esc(d.location||'—')}</div><div>المدة: ${esc(d.duration||'—')}</div><div>المبلغ المحجوز/التقديري: ${money(d.reservedAmount||d.price)}</div><div>تاريخ: ${esc(new Date(Number(d.createdAt||Date.now())).toLocaleDateString('ar-SA'))}</div></div><button type="button" class="main-btn" data-customer-open-order="${esc(d.id)}">فتح الطلب ومتابعته</button>`;list.appendChild(card);});}catch(error){console.error('new customer order list error',error);list.innerHTML='<div class="empty-state">تعذر تحميل الطلبات؛ تحقق من الاتصال.</div>';}};
  // استعادة تحديث بطاقة آخر طلب في الصفحة الرئيسية للعميل بعد استبدال دورة الطلب القديمة.
  // لا يعيد هذا المقطع نظام المنافسة؛ بل يقرأ أحدث طلب للعميل ويعرض حالته من دورة ATHAR الجديدة.
  window.loadLatestCustomerRequest=async function(){
    try{
      const user=await readUser();
      if(!user?.uid) return false;
      const rows=await ma3daReadUserRows('requests',['customerId','requesterId'],user.uid);
      const toMillis=value=>{
        if(value&&typeof value.toMillis==='function') return value.toMillis();
        if(value&&typeof value.seconds==='number') return value.seconds*1000;
        if(value instanceof Date) return value.getTime();
        const n=Number(value||0);
        return Number.isFinite(n)?n:0;
      };
      const latest=rows
        .filter(row=>(row.customerId||row.requesterId)===user.uid)
        .sort((a,b)=>toMillis(b.createdAt||b.createdAtMs||b.updatedAt)-toMillis(a.createdAt||a.createdAtMs||a.updatedAt))[0];
      if(!latest) return false;
      localStorage.setItem('currentRequestId',latest.id);
      localStorage.setItem('orderState',String(latest.status||''));
      localStorage.setItem('currentOrder',JSON.stringify({
        orderNumber:latest.orderNumber||'',
        location:latest.location||'',
        equipment:latest.equipment||'',
        duration:latest.duration||'',
        operator:latest.operator||'',
        notes:latest.notes||'',
        price:Number(latest.reservedAmount||latest.price||0)
      }));
      showCustomerOrder({...latest,id:latest.id});
      if(!['completed','rated','rejected','cancelled'].includes(String(latest.status||''))) window.startAcceptanceWatcher?.();
      return latest;
    }catch(error){
      console.error('تعذر تحديث أحدث طلب للعميل:',error);
      return false;
    }
  };

  window.loadOperatorCustomerOrders=async function(){const current=$('operatorCustomerCurrentList'),previous=$('operatorCustomerPreviousList');if(!current&&!previous)return;try{const user=await getOperatorCurrentUser();if(!user?.uid)throw new Error('سجّل الدخول بحساب صاحب المعدة.');const rows=await ma3daReadUserRows('requests',['equipmentOwnerId','ownerId','operatorId'],user.uid);const cur=['owner_decision_pending','owner_accepted','booking_confirmed','owner_arrived','otp_verified','working','completed_pending_customer','disputed'];const prev=['completed','rated','rejected','cancelled'];const currentRows=rows.filter(d=>(d.equipmentOwnerId||d.ownerId||d.operatorId)===user.uid&&cur.includes(d.status)).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));const previousRows=rows.filter(d=>(d.equipmentOwnerId||d.ownerId||d.operatorId)===user.uid&&prev.includes(d.status)).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));function render(target,arr,isPrevious){if(!target)return;if(!arr.length){target.innerHTML=`<div class="card center"><h3>${isPrevious?'لا توجد طلبات سابقة':'لا توجد طلبات حالية'}</h3></div>`;return;}target.innerHTML='';arr.forEach(d=>{const card=document.createElement('article');card.className='card';card.innerHTML=`<h3>${esc(d.orderNumber||d.id)} · ${esc(d.equipment||'معدة')}</h3><p>العميل: ${esc(d.customerName||'العميل')}</p><p>الحالة: ${esc(window.ma3daNewRentalStatusText(d.status))}</p><p>الحجز: ${money(d.reservedAmount||d.price)} · النهائي: ${money(d.finalAmount||0)}</p><p>الوقت الفعلي: ${Number(d.actualMinutes||0)} دقيقة</p><button type="button" class="main-btn" data-athar-owner-open-order="${esc(d.id)}">فتح الطلب</button>`;target.appendChild(card);});}render(current,currentRows,false);render(previous,previousRows,true);}catch(error){if(current)current.textContent=error.message||'تعذر تحميل الطلبات';if(previous)previous.textContent=error.message||'تعذر تحميل الطلبات';}};
  document.addEventListener('click',event=>{const b=event.target.closest('[data-athar-owner-open-order]');if(!b)return;const id=b.dataset.atharOwnerOpenOrder;localStorage.setItem('currentRequestId',id);window.loadOperatorCurrentOrder?.().then(()=>showScreen('operatorCurrentOrderScreen'));});
  window.ma3daNewRentalStatusText=status=>({owner_decision_pending:'بانتظار موافقة صاحب المعدة',owner_accepted:'وافق صاحب المعدة — بانتظار حجز المبلغ',booking_confirmed:'الحجز مؤكد — بيانات التواصل ورمز التحقق متاحان',owner_arrived:'صاحب المعدة وصل — بانتظار التحقق',otp_verified:'تم التحقق — جاهز لبدء العمل',working:'العمل جارٍ',completed_pending_customer:'انتهى العمل — بانتظار تأكيد العميل',disputed:'الاعتراض لدى الدعم',completed:'تم تأكيد التسوية التجريبية',rated:'تم تقييم المعدة',rejected:'تم رفض الطلب'})[status]||status;
})();
