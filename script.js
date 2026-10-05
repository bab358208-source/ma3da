console.log("MA3DA SCRIPT LOADED");
const screens =
document.querySelectorAll(".screen");
function showScreen(id){
screens.forEach(
s=>s.classList.remove("active")
;)
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
;}
const hourlyPrices={
, 250 :"
بوكلين "
, 220 :"
شيول "
, 180 :"
قلاب "
, 350 :"
كرين "
, 250 :"
حفار "
300 :"بلدوزر "
;}
const durationHours={
ساعة "
, 1 :"
واحدة
ساعات 4"
, 4 :"
ساعات 8"
, 8 :"
10 :"
كامل
يوم "
;}
/* ORDER */
async function saveOrder(){
console.log(
بدء "
"...Firebase في
الطلب
حفظ
;)
بشكل Firebase ننتظر */
/* . صريح
try{
if(window.ma3daFirebaseReady){
await window.ma3daFirebaseReady;
}
}catch(error){
console.error(
ً
ا
لم Firebase"
,": جاهز
يصبح
error
;)
alert(
تعذر "
أعد .Firebase تجهيز
". الصفحة
تحميل
;)
return false;
}
const user =
window.ma3daGetCurrentUser
? await window.ma3daGetCurrentUser()
: window.ma3daAuth?.currentUser;
console.log(
المستخدم "
,": الحالي
لا " : user ? user.uid
" يوجد
;)
if(!user){
alert(
;)
console.error(
لا "
"الدخول
مسجل
مستخدم
يوجد
لا "
"مسجل
مستخدم
يوجد
;)
return false;
}
if(!window.ma3daDB){
alert(
غير Firebase"
"متصل
;)
console.error(
غير ma3daDB"
" موجود
;)
return false;
}
if(
!window.ma3daAddDoc ||
!window.ma3daCollection
{)
alert(
أدوات "
"جاهزة
غير
الطلب
حفظ
;)
console.error(
غير ma3daCollection أو ma3daAddDoc"
" موجود
;)
return false;
}
try{
const requestsCollection =
window.ma3daCollection(
window.ma3daDB,
"requests"
;)
console.log(
تم "
"collection requests تجهيز
;)
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
;}
console.log(
بيانات "
,": الطلب
requestData
;)
const ref =
await window.ma3daAddDoc(
requestsCollection,
requestData
;)
if(!ref || !ref.id){
console.error(
"الطلب
لم Firebase"
رقم
يرجع
;)
alert(
لم "
"Firebase في
الطلب
حفظ
تأكيد
يتم
;)
return false;
}
نحفظ */
/* .Firebase نجاح
بعد
فقط
ًا
محلي
الطلب
localStorage.setItem(
"currentOrder",
JSON.stringify(order)
;)
localStorage.setItem(
"currentRequestId",
ref.id
;)
console.log(
تم "
,":بنجاح Firebase في
العميل
طلب
حفظ
ref.id
;)
return true;
}catch(error){
console.error(
تعذر "
,":Firebase في
العميل
طلب
حفظ
error
;)
console.error(
"Firebase error code:",
error?.code
;)
console.error(
"Firebase error message:",
error?.message
;)
if(
{)
error?.code ===
"permission-denied"
alert(
رفض Firebase"
+ "Firestore.\n\n صلاحيات
بسبب
الطلب
حفظ
"permission-denied :الكود"
;)
}else{
alert(
+ "Firebase:\n خطأ "
(error?.code || "unknown") +
"\n" +
حفظ
تعذر " || error?.message(
)" الطلب
;)
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
;)
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
تعذر "
,": الطلب
تحميل
error
;)
localStorage.removeItem("currentOrder");
return false;
}
}
function calculatePrice(){
return (
hourlyPrices[order.equipment] || 250
* )
(
;)
durationHours[order.duration] || 4
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
;"320 CAT - بوكلين " :
if(location)
location.textContent =
order.location ||
موقع "
;" العميل
}
function updateWorkingScreen(){
const equipment =
document.getElementById("workingEquipment");
const location =
document.getElementById("workingLocation");
if(equipment)
equipment.textContent =
order.equipment ||
;"بوكلين"
if(location)
location.textContent =
order.location ||
موقع "
;" العميل
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
;"بوكلين"
if(location)
location.textContent =
order.location ||
موقع "
;" العميل
if(duration)
duration.textContent =
order.duration ||
;"ساعات 4"
if(price)
price.textContent =
;`ريا }1000 || order.price{$`
if(notes)
notes.textContent =
order.notes ||
لا "
;" ملاحظات
توجد
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
اكتب "
"العمل
موقع
;)
if(!equipment)
return alert(
اختر "
" المعدةنوع
;)
if(!duration)
return alert(
مدة
اختر "
"العمل
;)
order = {
location,
equipment,
duration,
operator,
notes,
price:0
;}
order.price =
calculatePrice();
const saved =
await saveOrder();
if(!saved){
console.error(
الحفظ
لأن
تم "
".فشل Firebase في
الطلب
إيقاف
;)
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
;)
setOrderState(
"searching"
;)
selectedRole =
"customer";
localStorage.setItem("selectedRole", "customer");
updateMatchedScreen();
updateWorkingScreen();
updateOperatorScreen();
showScreen(
"searchingScreen"
;)
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
)
if(
!requestId ||
!window.ma3daDB ||
!window.ma3daDoc ||
!window.ma3daGetDoc
)
return;
try{
selectedRole !==
"customer"
return;
const requestId =
localStorage.getItem("currentRequestId");
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
{)
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
localStorage.setItem(
"currentOrder",
JSON.stringify(order)
;}
;)
localStorage.setItem(
"acceptedOrder",
JSON.stringify({
...order,
operatorName:
data.operatorName ||
فهد "
," القحطاني
operatorRating:
data.operatorRating ||
"4.8"
)}
;)
localStorage.setItem("orderAccepted", "true");
setOrderState(
"accepted"
);
updateMatchedScreen();
updateWorkingScreen();
if(
){
)
showScreen(
"matchedScreen"
);
document.getElementById("searchingScreen")?.classList.contains(
"active"
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
;"المعدة"
}
if(arrivedLocation){
arrivedLocation.textContent =
data.location ||
;"موقعك "
}
showScreen(
"arrivedCustomerScreen"
;)
}
/* WORKING */
if(
data.status ===
"working"
{)
console.log(
" المعدة
العمل "
صاحب
عند
بدأ
;)
setOrderState(
"working"
;)
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
;)
clearInterval(
timerInterval
;)
timerInterval =
setInterval(
updateTimer,
1000
;)
updateTimer();
}
/* COMPLETED */
if(
data.status ===
"completed"
{)
clearInterval(
timerInterval
;)
if(
document
.getElementById("paymentScreen")
?.classList.contains("active")
)
return;
setOrderState(
"completed"
;)
showScreen(
"completedScreen"
;)
}
/* REJECTED */
if(
data.status ===
"rejected"
{)
stopAcceptanceWatcher();
localStorage.removeItem("acceptedOrder");
localStorage.removeItem("orderAccepted");
setOrderState(
"rejected"
;)
alert(
;)
showScreen(
"roleScreen"
;)
" المعدة
صاحب
تم "
من
طلبك
رفض
}
}catch(error){
console.error(
حالة
تعذر "
متابعة
,": الطلب
error
;)
}
,}
1000
;)
}
/* ROLE */
const customerRoleBtn =
document.getElementById("customerRoleBtn");
if(customerRoleBtn){
customerRoleBtn.addEventListener(
"click",
{>=)(
selectedRole =
"customer";
localStorage.setItem("selectedRole", "customer");
const text =
document.getElementById("phoneRoleText");
if(text)
text.textContent =
تسجيل "
;" كعميل
الدخول
showScreen(
"phoneScreen"
;)
}
;)
}
const operatorRoleBtn =
document.getElementById("operatorRoleBtn");
if(operatorRoleBtn){
operatorRoleBtn.addEventListener(
"click",
{>=)(
selectedRole =
"operator";
localStorage.setItem("selectedRole", "operator");
stopAcceptanceWatcher();
const text =
document.getElementById("phoneRoleText");
if(text)
text.textContent =
معدة
;" مشغل /
تسجيل "
كصاحب
الدخول
showScreen(
"phoneScreen"
;)
}
;)
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
;}
}
كلمة
نسيان */
/* المرور
if(forgotPasswordBtn){
forgotPasswordBtn.addEventListener(
"click",
{>=)(
showScreen(
"forgotPasswordScreen"
;)
}
;)
}
كلمة
استعادة
إرسال */
/* المرور
رابط
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
أدخل "
"أولا ً
الإلكتروني
بريدك
;)
if(resetEmail)
resetEmail.focus();
return;
}
if(
typeof window.ma3daSendPasswordResetEmail !==
"function"
{)
alert(
;)
return;
لم Firebase"
تحميل
أعد
" الصفحة
بعد،
يجهز
}
sendResetPasswordBtn.disabled =
true;
sendResetPasswordBtn.textContent =
جاري "
;"... الإرسال
try{
const result =
await window.ma3daSendPasswordResetEmail(
email
;)
if(result === true){
alert(
;)
بريدك
تم "
" الإلكتروني
إلى
المرور
كلمة
تعيين
إعادة
رابط
إرسال
}
}catch(errorObject){
console.error(
خطأ "
كلمة
استعادة
,": المرور
في
errorObject
;)
if(
{)
errorObject?.code ===
"auth/user-not-found"
alert(
لا "
البريد
بهذا
حساب
"الإلكتروني
يوجد
;)
}else if(
errorObject?.code ===
"auth/invalid-email"
{)
alert(
البريد "
صحيح
غير
الإلكتروني
"
;)
}else{
alert(
errorObject?.message ||
كلمة
تعذر "
"المرور
تعيين
إعادة
رابط
إرسال
;)
}
}finally{
sendResetPasswordBtn.disabled =
false;
sendResetPasswordBtn.textContent =
;" الاستعادة
سال إر "
رابط
}
}
;)
}
كلمة
استعادة
صفحة
العودة */
/* المرور
من
const backFromForgotPasswordBtn =
document.getElementById("backFromForgotPasswordBtn");
if(backFromForgotPasswordBtn){
backFromForgotPasswordBtn.addEventListener(
"click",
{>=)(
const resetEmail =
document.getElementById("resetEmail");
if(resetEmail)
resetEmail.value = "";
showScreen(
"phoneScreen"
;)
}
;)
}
فتح */
/* وجود
حسب
المعدة
صاحب
صفحة
async function openOperatorAfterLogin(){
const user =
window.ma3daGetCurrentUser
? await window.ma3daGetCurrentUser()
: window.ma3daAuth?.currentUser;
if(!user){
alert(
استعادة
"الدخول
تعذر "
تسجيل
;)
showScreen(
"phoneScreen"
;)
return;
}
if(!window.ma3daDB){
alert(
غير Firebase"
"متصل
;)
return;
}
try{
const ref =
window.ma3daDoc(
window.ma3daDB,
"equipment",
user.uid
;)
const snapshot =
await window.ma3daGetDoc(ref);
if(snapshot.exists()){
await displayMyEquipment();
const hasOperatorData =
await loadOperatorData();
if(!hasOperatorData){
showScreen(
"operatorDataScreen"
;)
return;
}
await loadOperatorHome();
showScreen(
"operatorHomeScreen"
;)
}else{
showScreen(
"addEquipmentScreen"
;)
}
}catch(error){
console.error(
خطأ "
,": المعدة
فحص
في
error
;)
alert(
" المعدة
تعذر "
بيانات
تحميل
;)
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
= }
getEmailData();
if(!email || !password){
if(error)
error.textContent =
أدخل "
;" المرور
وكلمة
الإلكتروني
البريد
return;
}
if(error)
error.textContent = "";
if(
typeof window.ma3daLogin !==
"function"
{)
if(error)
error.textContent =
لم Firebase"
;" الصفحة
تحميل
أعد
بعد،
يجهز
console.error(
غير ma3daLogin"
" موجود
;)
return;
}
try{
const user =
await window.ma3daLogin(
email,
password
;)
if(!user)
return;
console.log(
الدخول
تسجيل
تم "
,": ح بنجا
user.uid
;)
localStorage.setItem("selectedRole", selectedRole);
if(
selectedRole ===
"customer"
{)
showScreen(
"customerDataScreen"
;)
return;
}
if (
selectedRole === "contractor"
{ )
if (
{ )
typeof window.openContractorHome === "function"
await window.openContractorHome();
} else {
console.error(
غير openContractorHome"
" موجود
;)
if (error) {
error.textContent =
أعد
صفحة
;" الصفحة
تعذر "
تحميل
، المقاول
فتح
}
}
return;
}
if(
selectedRole ===
"operator"
{)
await openOperatorAfterLogin();
}
}catch(loginError){
console.error(
خطأ "
,": الدخول
تسجيل
داخل
loginError
;)
if(error){
error.textContent =
loginError?.message ||
تعذر "
;" الدخول
تسجيل
}
}
}
;)
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
= }
getEmailData();
if(!email || !password){
if(error)
error.textContent =
أدخل "
;" المرور
وكلمة
الإلكتروني
البريد
return;
}
if(password.length < 6){
if(error)
error.textContent =
كلمة "
أو
;" أكثر
أحرف
6
تكون
أن
يجب
المرور
return;
}
if(error)
error.textContent = "";
if(
typeof window.ma3daCreateAccount !==
"function"
{)
if(error)
error.textContent =
لم Firebase"
;" الصفحة
تحميل
أعد
بعد،
يجهز
console.error(
غير ma3daCreateAccount"
" موجود
;)
return;
}
const user =
await window.ma3daCreateAccount(
email,
password
;)
if(!user)
return;
console.log(
الحساب
إنشاء
تم "
,": بنجاح
user.uid
;)
تم */
/* Firebase من
التحقق
رابط
إرسال
alert(
تم "
+ "n\n\ بنجاح
الحساب
إنشاء
تم "
+ "n\n\ الإلكتروني
بريدك
إلى
التحقق
رابط
إرسال
ّل
". الدخول
افتح "
وسج
ارجع
ثم
التحقق،
رابط
على
واضغط
البريد
;)
نخرج */
/* الجديد
الحساب
شاشة
من
المستخدم
if(window.ma3daAuth){
try{
const {
signOut
= }
await import(
"https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"
;)
await signOut(
window.ma3daAuth
;)
}catch(signOutError){
console.error(
تعذر "
,": الحساب
إنشاء
بعد
الخروج
تسجيل
signOutError
;)
}
}
showScreen(
"phoneScreen"
;)
}
;)
}
/* OPERATOR */
async function openOperatorScreen(){
await displayMyEquipment();
updateOperatorScreen();
showScreen(
"operatorScreen"
;)
}
/* LOAD CUSTOMER REQUEST FOR OPERATOR */
async function loadLatestCustomerRequest(){
try{
if(!window.ma3daDB){
console.error(
غير Firebase"
"متصل
;)
return false;
}
if(!window.ma3daGetDocs){
console.error(
غير ma3daGetDocs"
" موجود
;)
return false;
}
const requestsRef =
window.ma3daCollection(
window.ma3daDB,
"requests"
;)
const snapshot =
await window.ma3daGetDocs(
requestsRef
;)
if(snapshot.empty){
console.log(
لا "
" عملاء
طلبات
توجد
;)
return false;
}
let latestRequest = null;
snapshot.forEach(
docSnapshot => {
const data =
docSnapshot.data();
if(
{)
data.status ===
"searching"
if(
!latestRequest ||
Number(data.createdAt || 0) >
Number(
latestRequest.createdAt || 0
)
{)
latestRequest = {
id:
docSnapshot.id,
...data
;}
}
}
}
;)
if(!latestRequest){
console.log(
لا "
"حالي searching طلب
يوجد
;)
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
localStorage.setItem(
"currentOrder",
JSON.stringify(order)
;}
;)
localStorage.setItem(
"currentRequestId",
latestRequest.id
;)
updateOperatorScreen();
console.log(
تم "
,":Firebase من
العميل
طلب
تحميل
latestRequest
;)
return true;
}catch(error){
console.error(
تعذر "
,": لعميل ا
طلب
تحميل
error
;)
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
رقم
على
العثور
"الطلب
لم "
يتم
;)
return;
}
try{
const requestRef =
window.ma3daDoc(
window.ma3daDB,
"requests",
requestId
;)
await window.ma3daUpdateDoc(
requestRef,
{
status: "arrived"
}
;)
const customerLocation =
document.getElementById("acceptedCustomerLocation");
const arrivedLocation =
document.getElementById("arrivedCustomerLocation");
if(
customerLocation &&
arrivedLocation
{)
arrivedLocation.textContent =
customerLocation.textContent;
}
showScreen(
"operatorArrivedScreen"
;)
}catch(error){
console.error(
تعذر "
,": الوصول
تسجيل
error
;)
alert(
تعذر "
الوصول
"Firebase في
تسجيل
;)
}
}
;)
}
/* ACCEPT REQUEST */
if(acceptRequestBtn){
acceptRequestBtn.addEventListener(
"click",
async()=>{
if(!loadOrder()){
alert(
لا "
"محفوظ
عميل
طلب
يوجد
;)
return;
}
const requestId =
localStorage.getItem("currentRequestId");
if(!requestId){
alert(
طلب
لم "
رقم
على
العثور
"العميل
يتم
;)
return;
}
try{
const requestRef =
window.ma3daDoc(
window.ma3daDB,
"requests",
requestId
;)
const requestSnap =
await window.ma3daGetDoc(
requestRef
;)
const requestData =
requestSnap.data();
const customerLocation =
requestData?.location ||
موقع "
;" العميل
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
فهد " :operatorName
," القحطاني
operatorRating: "4.8"
}
;)
localStorage.setItem(
"acceptedOrder",
JSON.stringify({
...order,
operatorName:
فهد "
," القحطاني
operatorRating:
"4.8"
)}
;)
localStorage.setItem("orderAccepted", "true");
setOrderState(
"accepted"
;)
updateMatchedScreen();
updateWorkingScreen();
alert(
الطلب
قبول
تم "
" بنجاح
;)
showScreen(
"operatorAcceptedScreen"
;)
}catch(error){
console.error(
تعذر "
,":Firebase في
الطلب
حالة
تحديث
error
;)
alert(
تعذر "
"Firebase في
الطلب
قبول
;)
}
}
;)
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
طلب
لم "
رقم
على
العثور
"العميل
يتم
;)
return;
}
try{
const requestRef =
window.ma3daDoc(
window.ma3daDB,
"requests",
requestId
;)
await window.ma3daUpdateDoc(
requestRef,
{
status: "rejected"
}
;)
localStorage.removeItem("acceptedOrder");
localStorage.removeItem("orderAccepted");
setOrderState(
"rejected"
;)
alert(
تم "
"الطلب
رفض
;)
showScreen(
"roleScreen"
;)
}catch(error){
console.error(
تعذر "
,":Firebase في
الطلب
رفض
error
;)
alert(
تعذر "
"Firebase في
الطلب
رفض
;)
}
}
;)
}
/* EQUIPMENT */
const saveEquipmentBtn =
document.getElementById("saveEquipmentBtn");
if(saveEquipmentBtn){
saveEquipmentBtn.addEventListener(
"click",
saveEquipment
;)
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
التحقق */
/* المعدة
نوع
من
{)"أخرى" === if(type
if(!otherEquipmentType){
alert(
فضلا ً "
" المعدة
نوع
اكتب
;)
return;
}
type =
otherEquipmentType;
}
التحقق */
/* البيانات
من
if(
!type ||
!model ||
!year ||
!city ||
!hourlyPrice
{)
alert(
;)
return;
فضلا ً "
" المعدة
بيانات
جميع
أكمل
}
const user =
window.ma3daGetCurrentUser
? await window.ma3daGetCurrentUser()
: window.ma3daAuth?.currentUser;
if(!user){
alert(
;)
return;
يجب "
"أولا ً
الدخول
تسجيل
}
if(!window.ma3daDB){
alert(
;)
return;
غير Firebase"
"متصل
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
;}
const saveToFirebase =
async()=>{
const ref =
window.ma3daDoc(
window.ma3daDB,
"equipment",
user.uid
;)
await window.ma3daSetDoc(
ref,
equipment
;)
;}
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
;)
alert(
المعدة
حفظ
تم "
" بنجاح
;)
await displayMyEquipment();
showScreen(
"operatorScreen"
;)
}catch(error){
console.error(
error
;)
alert(
قاعدة
تعذر "
"البيانات
في
المعدة
حفظ
;)
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
;1000
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
;)
width =
maxWidth;
}
const canvas =
document.createElement(
"canvas"
;)
canvas.width =
width;
canvas.height =
height;
const ctx =
canvas.getContext(
"2d"
;)
ctx.drawImage(
image,
,0
,0
width,
height
;)
equipment.image =
canvas.toDataURL(
"image/jpeg",
0.75
;)
try{
await saveToFirebase();
localStorage.setItem(
"myEquipment",
JSON.stringify(
equipment
)
;)
alert(
المعدة
حفظ
تم "
" بنجاح
;)
await displayMyEquipment();
showScreen(
"operatorScreen"
;)
}catch(error){
console.error(
error
;)
alert(
قاعدة
تعذر "
"البيانات
في
المعدة
حفظ
;)
}
;}
image.src =
reader.result;
;}
reader.readAsDataURL(
file
;)
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
{)
equipmentType.addEventListener(
"change",
{>=)(
if(
equipmentType.value ===
"أخرى"
{)
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
;)
}
/* LOAD EQUIPMENT */
async function displayMyEquipment(){
try{
if(!window.ma3daDB){
console.log(
غير Firebase"
"متصل
;)
return false;
}
const user =
window.ma3daGetCurrentUser
? await window.ma3daGetCurrentUser()
: window.ma3daAuth?.currentUser;
if(!user){
console.log(
لا "
"مسجل
مستخدم
يوجد
;)
return false;
}
const ref =
window.ma3daDoc(
window.ma3daDB,
"equipment",
user.uid
;)
const snapshot =
await window.ma3daGetDoc(
ref
;)
if(!snapshot.exists()){
console.log(
لا "
" للمعدة
بيانات
توجد
;)
return false;
}
const equipment =
snapshot.data();
localStorage.setItem(
"myEquipment",
JSON.stringify(
equipment
)
;)
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
متاحة " ?
"الآن
غير " :
;" متاحة
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
;)
image.style.display =
"none";
}
}
return true;
}catch(error){
console.error(
تعذر "
,": المعدة
بيانات
تحميل
error
;)
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
/* CHAT: CUSTOMER + EQUIPMENT OWNER */
let chatMessagesUnsubscribe = null;
let chatSending = false;
function getMa3daActiveRole(){
const savedRole = localStorage.getItem("selectedRole") || "";
if (savedRole) selectedRole = savedRole;
return selectedRole;
}
function openMa3daChat(){
getMa3daActiveRole();
showScreen("chatScreen");
startChatListener();
setTimeout(() => document.getElementById("chatInput")?.focus(), 100);
}
const chatBtn = document.getElementById("chatBtn");
if (chatBtn) chatBtn.addEventListener("click", openMa3daChat);
const operatorChatCustomerBtn = document.getElementById("operatorChatCustomerBtn");
if (operatorChatCustomerBtn) operatorChatCustomerBtn.addEventListener("click",
openMa3daChat);
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
يجب "(alert
;)". الرسائل
لإرسال
الدخول
تسجيل
return;
}
if (!window.ma3daDB || typeof window.ma3daCollection !== "function" || typeof
window.ma3daAddDoc !== "function") {
اللازمة Firestore أدوات"(throw new Error
;)". جاهزة
غير
الرسالة
لإرسال
}
const requestId = localStorage.getItem("currentRequestId");
if (!requestId) {
لا "(alert
;)". أولا ً
الحالي
الطلب
افتح .
المحادثة
بهذه
مرتبط
طلب
يوجد
return;
}
const role = getMa3daActiveRole();
const messagesCollection = window.ma3daCollection(
window.ma3daDB, "requests", requestId, "messages"
;)
await window.ma3daAddDoc(messagesCollection, {
text: messageText,
senderId: user.uid,
senderRole: role,
createdAt: Date.now(),
createdAtServer: new Date()
;)}
input.value = "";
input.focus();
} catch (error) {
تعذر "(console.error
;)error ,": الرسالة
إرسال
تعذر "(alert
+ "Fالرسالإرسال
irebase.\n" + (error?.cod| "") + "\nيرجى " || error?.message(
;))". أخرى
مرة
المحاولة
} finally {
chatSending = false;
if (sendButton) sendButton.disabled = false;
}
function startChatListener(){
if (chatMessagesUnsubscribe) {
chatMessagesUnsubscribe();
chatMessagesUnsubscribe = null;
}
}
const requestId = localStorage.getItem("currentRequestId");
if (!requestId) {
ً
لا "(console.warn
بالمحادثة
;)". حاليا
مرتبط
طلب
يوجد
return;
}
if (!window.ma3daDB || typeof window.ma3daCollection !== "function" ||
typeof window.ma3daOnSnapshot !== "function" ||
typeof window.ma3daQuery !== "function" ||
typeof window.ma3daOrderBy !== "function") {
أدوات "(console.error
الشات
غير Firebase في
;)". جاهزة
return;
}
const messagesCollection = window.ma3daCollection(
window.ma3daDB, "requests", requestId, "messages"
;)
const messagesQuery = window.ma3daQuery(
messagesCollection, window.ma3daOrderBy("createdAt", "asc")
;)
chatMessagesUnsubscribe = window.ma3daOnSnapshot(messagesQuery, snapshot => {
const container = document.getElementById("chatMessages");
if (!container) return;
const role = getMa3daActiveRole();
container.replaceChildren();
snapshot.forEach(messageDoc => {
const data = messageDoc.data();
const bubble = document.createElement("div");
bubble.className = data.senderId === window.ma3daAuth?.currentUser?.uid
? "message sent"
: (data.senderRole === role ? "message sent" : "message received");
bubble.textContent = data.text || "";
container.appendChild(bubble);
;)}
container.scrollTop = container.scrollHeight;
}, error => {
تعذر "(console.error
;)error ,": الشات
رسائل
استقبال
تعذر "(alert
;)".Firestore وصلاحيات Firebase اتصال
من
قق تح .
المحادثة
رسائل
تحميل
;)}
}
/* Send button: delegated listener supports buttons rendered later. */
document.addEventListener("click", event => {
const button = event.target.closest("#sendChatBtn");
if (!button) return;
event.preventDefault();
void sendChatMessage();
;)}
document.addEventListener("keydown", event => {
if (event.key !== "Enter" || event.shiftKey) return;
if (!event.target.closest("#chatInput")) return;
event.preventDefault();
void sendChatMessage();
;)}
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
,"18%"
,"55%"
,"كم 2.4"
"دقائق 8"
,]
[
,"30%"
,"45%"
,"كم 2.0"
"دقائق 7"
,]
[
,"42%"
,"40%"
,"كم 1.5"
"دقائق 5"
,]
[
,"55%"
,"30%"
,"م 900"
"دقائق 3"
,]
[
,"65%"
,"20%"
,"م 400"
"دقيقة 1"
,]
[
,"75%"
,"12%"
,"م 0"
"الآن"
]
;]
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
{)
status.textContent =
وصلت "
;" موقعك
إلى
المعدة
console.log(
" المعدة
اكتمل "
صاحب
وصول
بانتظار
- التتبع
;)
return;
}
index++;
setTimeout(
move,
1400
;)
}
move();
}
/* CUSTOMER WORKING TIMER */
function updateTimer(){
if(!workStartTime)
return;
const elapsed =
Math.max(
,0
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
function startCustomerWorkTimer(
startTime
}
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
لا "
طلب
". حالي
يوجد
;)
return;
}
const requestRef =
window.ma3daDoc(
window.ma3daDB,
"requests",
requestId
;)
const snapshot =
await window.ma3daGetDoc(
requestRef
;)
if(!snapshot.exists()){
alert(
تعذر "
". الطلب
على
العثور
;)
return;
}
const data =
snapshot.data();
const phone =
data.operatorPhone ||
;""
if(!phone){
alert(
ًا
رقم "
". حالي
متوفر
غير
المعدة
صاحب
;)
return;
}
window.location.href =
`tel:${phone}`;
}catch(error){
console.error(
تعذر "
,": المعدة
بصاحب
الاتصال
error
;)
alert(
ًا
الاتصال
تعذر "
". حالي
;)
}
}
;)
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
{>=)(
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
ً
اختر "
". أولا
التقييم
;)
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
;)
await window.ma3daUpdateDoc(
requestRef,
{
rating:
selectedRating,
ratedAt:
Date.now()
}
;)
}
showScreen(
"thankYouScreen"
;)
}catch(error){
console.error(
حفظ
تعذر "
,": التقييم
error
;)
alert(
تعذر "
". أخرى
مرة
حاول
التقييم،
حفظ
;)
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
;)
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
;""
workStartTime =
null;
selectedPayment =
;""
selectedRating =
;0
showScreen(
"roleScreen"
;)
}catch(error){
console.error(
خطأ "
تسجيل
,": الخروج
في
error
;)
alert(
تعذر "
تسجيل
". الخروج
;)
}
}
/* CUSTOMER LOGOUT */
const customerLogoutBtn =
document.getElementById("customerLogoutBtn");
if(customerLogoutBtn){
customerLogoutBtn.addEventListener(
"click",
ma3daLogout
;)
}
const logoutBtn =
document.getElementById("logoutBtn");
if(logoutBtn){
logoutBtn.addEventListener(
"click",
ma3daLogout
;)
}
/* BACK CUSTOMER REQUEST */
const backFromRequestBtn =
document.getElementById("backFromRequestBtn");
if(backFromRequestBtn){
backFromRequestBtn.addEventListener(
"click",
{>=)(
showScreen(
"customerHomeScreen"
;)
}
;)
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
استعادة "
,": الجلسة
لا " : user ? user.uid
," مستخدم
يوجد
لا " || savedRole
" دور
يوجد
;)
console.log(
"emailVerified:",
لا " : user ? user.emailVerified
"مستخدم
يوجد
;)
if(
user &&
!user.emailVerified
{)
console.log(
". موثق
غير
البريد
لكن
المستخدم "
موجود
;)
try{
if(window.ma3daAuth){
await window.ma3daAuth.signOut();
}
}catch(signOutError){
console.error(
تعذر "
,": الموثق
غير
المستخدم
من
الخروج
تسجيل
signOutError
;)
}
localStorage.removeItem("selectedRole");
selectedRole =
;""
showScreen(
"roleScreen"
;)
return;
}
if(!user){
selectedRole =
;""
localStorage.removeItem("selectedRole");
showScreen(
"introScreen"
;)
return;
}
if(!savedRole){
showScreen(
"introScreen"
;)
return;
}
selectedRole =
savedRole;
if(
{)
savedRole ===
"customer"
showScreen(
"customerHomeScreen"
;)
return;
}
if(
{)
savedRole ===
"operator"
if(
typeof openOperatorAfterLogin ===
"function"
{)
await openOperatorAfterLogin();
}else{
await openOperatorDashboard();
}
}
}catch(error){
console.error(
خطأ "
استعادة
,": الجلسة
في
error
;)
showScreen(
"roleScreen"
;)
}
;)()}
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
}
return;
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
}
passive:true
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
{)
alert(
ً
أكمل "
"أولا
البيانات
جميع
;)
return;
}
try{
const user =
window.ma3daGetCurrentUser
? await window.ma3daGetCurrentUser()
: window.ma3daAuth?.currentUser;
if(!user){
alert(
ً
يجب "
"أولا
الدخول
تسجيل
;)
return;
}
const customerRef =
window.ma3daDoc(
window.ma3daDB,
"customers",
user.uid
;)
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
,}
{
merge:true
}
;)
console.log(
"العميل
بيانات
حفظ
تم "
;)
showScreen(
"customerHomeScreen"
;)
}catch(error){
console.error(
خطأ "
,": العميل
بيانات
حفظ
في
error
;)
alert(
+ " :Firebase خطأ"
error.message
;)
}
}
;)
}
/* CUSTOMER LOCATION */
const getLocationBtn =
document.getElementById("getLocationBtn");
if(getLocationBtn){
getLocationBtn.addEventListener(
"click",
{>=)(
if(!navigator.geolocation){
alert(
جهازك "
". الموقع
تحديد
يدعم
لا
;)
return;
}
getLocationBtn.disabled =
true;
getLocationBtn.textContent =
جاري "
;"... موقعك
تحديد
navigator.geolocation.getCurrentPosition(
position=>{
const latitude =
position.coords.latitude;
const longitude =
position.coords.longitude;
console.log(
موقع "
,": العميل
latitude,
longitude
;)
const input =
document.getElementById("locationInput");
if(input){
input.value =
`${latitude}, ${longitude}`;
}
getLocationBtn.disabled =
false;
getLocationBtn.textContent =
تم "
;" موقعك
تحديد
,}
error=>{
console.error(
خطأ "
,": الموقع
تحديد
error
;)
getLocationBtn.disabled =
false;
getLocationBtn.textContent =
تحديد "
;" بدقة
موقعي
alert(
تعذر "
+ "n\n\.موقعك
تحديد
تأكد "
". موقعك
باستخدام
للتطبيق
السماح
من
;)
,}
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
async function loadCustomerOrders(
type
}
){
const listId =
type === "current"
? "currentOrdersList"
: "previousOrdersList";
const list =
document.getElementById(
listId
;)
if(!list)
return;
list.innerHTML =
جاري >p<"
;">p/<... الطلبات
تحميل
try{
const user =
window.ma3daGetCurrentUser
? await window.ma3daGetCurrentUser()
: window.ma3daAuth?.currentUser;
if(!user){
list.innerHTML =
يجب >p<"
;">p/<. أولا ً
الدخول
تسجيل
return;
}
const snapshot =
await window.ma3daGetDocs(
window.ma3daCollection(
window.ma3daDB,
"requests"
)
;)
const currentStatuses = [
"searching",
"accepted",
"arrived",
"working"
;]
const previousStatuses = [
"completed",
"rejected"
;]
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
{)
orders.push({
id:
docSnapshot.id,
...data
;)}
}
}
;)
orders.sort(
(a,b)=>
Number(
b.createdAt || 0
- )
Number(
a.createdAt || 0
)
;)
if(!orders.length){
list.innerHTML =
type === "current"
` ?
<div class="empty-state">
<div class="hero-icon"> </div>
لا >h3<
>h3/< حالية
طلبات
توجد
<p>
. هنا
ستظهر
معدة
تطلب
عندما
</p>
</div>
`
` :
<div class="empty-state">
<div class="hero-icon"> </div>
لا >h3<
>h3/< سابقة
طلبات
توجد
<p>
. هنا
المنتهية
طلباتك
ستظهر
</p>
</div>
;`
return;
}
list.innerHTML =
;""
orders.forEach(
customerOrder=>{
const card =
document.createElement(
"div"
;)
card.className =
"customer-order-card";
const statusText =
getCustomerOrderStatusText(
customerOrder.status
;)
const statusClass =
getCustomerOrderStatusClass(
customerOrder.status
;)
const date =
customerOrder.createdAt
? new Date(
customerOrder.createdAt
).toLocaleDateString(
"ar-SA"
)
غير " :
;" محدد
card.innerHTML = `
<div class="customer-order-header">
<strong>
}"معدة" || customerOrder.equipment{$
</strong>
<span
class="customer-order-status ${statusClass}"
>
${statusText}
</span>
</div>
<div class="customer-order-info">
<div>
<span>
</span>
</div>
غير " || customerOrder.location{$
}" محدد
<div>
<span>
</span>
</div>
غير " || customerOrder.duration{$
}" محدد
<div>
<span>
</span>
</div>
مع " || customerOrder.operator{$
}" مشغل
<div>
<span>
ريا
</span>
</div>
${Number(customerOrder.price || 0)}
<div>
<span>
${date}
</span>
</div>
</div>
;`
list.appendChild(
card
;)
;)
}
}catch(error){
console.error(
تعذر "
,": العميل
طلبات
تحميل
error
;)
list.innerHTML = `
<div class="empty-state">
تعذر >h3<
>h3/< الطلبات
تحميل
<p>
.أخرى
مرة
حاول
</p>
</div>
;`
}
}
function getCustomerOrderStatusText(
status
{)
const statuses = {
searching:
جاري "
," معدة
عن
البحث
accepted:
تم "
," الطلب
قبول
arrived:
المعدة "
," وصلت
working:
جاري "
," العمل
completed:
,"مكتمل "
rejected:
"مرفوض "
;}
return (
statuses[status] ||
status ||
غير "
"معروف
;)
function getCustomerOrderStatusClass(
status
}
{)
return (
;)
`status-${status || "unknown"}`
}
/* CUSTOMER ORDER BACK */
const backFromCurrentOrdersBtn =
document.getElementById("backFromCurrentOrdersBtn");
if(backFromCurrentOrdersBtn){
backFromCurrentOrdersBtn.addEventListener(
"click",
{>=)(
showScreen(
"customerHomeScreen"
;)
}
;)
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
;)
const snapshot =
await window.ma3daGetDoc(
customerRef
;)
if(snapshot.exists()){
const data =
snapshot.data();
if(nameInput)
nameInput.value =
data.name || "";
if(status)
status.textContent =
;"نشط"
}
}catch(error){
console.error(
تعذر "
,": العميل
بيانات
تحميل
error
;)
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
ً
أدخل "
". أولا
الاسم
;)
return;
}
try{
const user =
window.ma3daGetCurrentUser
? await window.ma3daGetCurrentUser()
: window.ma3daAuth?.currentUser;
if(!user){
alert(
ً
يجب "
". أولا
الدخول
تسجيل
;)
return;
}
const ref =
window.ma3daDoc(
window.ma3daDB,
"customers",
user.uid
;)
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
,}
{
merge:true
}
;)
alert(
;)
}catch(error){
التعديلات
حفظ
تم "
" بنجاح
console.error(
تعذر "
,": العميل
إعدادات
حفظ
error
;)
alert(
حفظ
تعذر "
". التعديلات
;)
}
}
;)
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
{)
alert(
لا "
". بالحساب
مرتبط
إلكتروني
بريد
يوجد
;)
return;
}
try{
await window.ma3daSendPasswordResetEmail(
user.email
;)
alert(
بريدك
تم "
" الإلكتروني
إلى
المرور
كلمة
تغيير
رابط
إرسال
;)
}catch(error){
console.error(
error
;)
alert(
error.message ||
كلمة
تعذر "
". لمرور ا
تغيير
رابط
إرسال
;)
}
}
;)
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
اللغة
تم "
"🇸🇦 العربية
اختيار
;)
}
;)
}
const englishLanguageBtn =
document.getElementById("englishLanguageBtn");
if(englishLanguageBtn){
englishLanguageBtn.addEventListener(
"click",
{>=)(
alert(
اللغة "
ًا
متاحة
" قريب
ستكون
الإنجليزية
;)
}
;)
}
/* APPEARANCE */
const appearanceSettingsBtn =
document.getElementById("appearanceSettingsBtn");
if(appearanceSettingsBtn){
appearanceSettingsBtn.addEventListener(
"click",
{>=)(
showScreen(
"appearanceSettingsScreen"
;)
}
;)
}
const backFromAppearanceSettingsBtn =
document.getElementById("backFromAppearanceSettingsBtn");
if(backFromAppearanceSettingsBtn){
backFromAppearanceSettingsBtn.addEventListener(
"click",
{>=)(
showScreen(
"customerSettingsScreen"
;)
}
;)
}
const systemAppearanceBtn =
document.getElementById("systemAppearanceBtn");
if(systemAppearanceBtn){
systemAppearanceBtn.addEventListener(
"click",
{>=)(
document.documentElement.removeAttribute(
"data-theme"
;)
localStorage.setItem("ma3daTheme", "system");
alert(
المظهر
اختيار
تم "
" التلقائي
;)
}
;)
}
const lightAppearanceBtn =
document.getElementById("lightAppearanceBtn");
if(lightAppearanceBtn){
lightAppearanceBtn.addEventListener(
"click",
{>=)(
document.documentElement.setAttribute(
"data-theme",
"light"
;)
localStorage.setItem("ma3daTheme", "light");
alert(
المظهر
اختيار
تم "
" الفاتح
;)
}
;)
}
const darkAppearanceBtn =
document.getElementById("darkAppearanceBtn");
if(darkAppearanceBtn){
darkAppearanceBtn.addEventListener(
"click",
{>=)(
document.documentElement.setAttribute(
"data-theme",
"dark"
;)
localStorage.setItem("ma3daTheme", "dark");
alert(
تم "
" الداكن
المظهر
اختيار
;)
}
;)
}
/* TECHNICAL SUPPORT */
const technicalSupportBtn =
document.getElementById("technicalSupportBtn");
if(technicalSupportBtn){
technicalSupportBtn.addEventListener(
"click",
{>=)(
showScreen(
"technicalSupportScreen"
;)
}
;)
}
const backFromTechnicalSupportBtn =
document.getElementById("backFromTechnicalSupportBtn");
if(backFromTechnicalSupportBtn){
backFromTechnicalSupportBtn.addEventListener(
"click",
{>=)(
showScreen(
"customerHomeScreen"
;)
}
;)
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
;)
const snapshot =
await window.ma3daGetDoc(
ref
;)
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
خطأ "
,": المعدة
صاحب
بيانات
تحميل
في
error
;)
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
{)
alert(
ً
أكمل "
"أولا
البيانات
جميع
;)
return;
}
try{
if(window.ma3daFirebaseReady)
await window.ma3daFirebaseReady;
if(!window.ma3daDB || typeof window.ma3daDoc !== "function" || typeof
window.ma3daSetDoc !== "function"){
لحفظ Firebase خدمات"(throw new Error
;)". جاهزة
غير
المعدة
صاحب
بيانات
}
const user =
await getOperatorCurrentUser();
if(!user){
alert(
ً
يجب "
"أولا
الدخول
تسجيل
;)
return;
}
await window.ma3daSetDoc(
window.ma3daDoc(
window.ma3daDB,
"operators",
user.uid
,)
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
,}
{
}
merge:true
;)
localStorage.setItem("operatorProfile", JSON.stringify({ name, phone, city,
email: user.email || "", operatorId: user.uid }));
await loadOperatorDashboard();
showScreen(
"operatorHomeScreen"
;)
}catch(error){
console.error(
خطأ "
,": المعدة
صاحب
بيانات
حفظ
في
error
;)
alert(
حفظ
تعذر "
+ "n\: البيانات
error.message
;)
}
}
;)
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
تعذر "
,": المعدة
صاحب
مستخدم
على
الحصول
error
;)
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
;)
const snap =
await window.ma3daGetDoc(
ref
;)
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
;)
const operatorSnap =
await window.ma3daGetDoc(
operatorRef
;)
if(!operatorSnap.exists()){
showScreen(
"operatorDataScreen"
;)
return;
}
const equipment =
await getOperatorEquipment();
if(!equipment){
showScreen(
"addEquipmentScreen"
;)
return;
}
await loadOperatorDashboard();
showScreen(
"operatorHomeScreen"
;)
}catch(error){
console.error(
خطأ "
,": المعدة
صاحب
لوحة
فتح
في
error
;)
showScreen(
"roleScreen"
;)
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
;)
const operatorSnap =
await window.ma3daGetDoc(
operatorRef
;)
if(operatorSnap.exists()){
const data =
operatorSnap.data();
const nameElement =
document.getElementById("operatorHomeName");
if(nameElement)
nameElement.textContent =
data.name ||
صاحب "
;" المعدة
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
ريا })"toLocaleString("ar-SA.)
`ساعة /
-" :
"
;}
Object.entries(fields)
.forEach(
([id,value])=>{
const element =
document.getElementById(
id
;)
if(element)
element.textContent =
value;
}
;)
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
;)
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
جاري >p<
>p/<... الطلبات
تحميل
</div>
;`
try{
========================================= */
الحالي
المستخدم
/* =========================================
const user =
await getOperatorCurrentUser();
if(!user){
list.innerHTML = `
<div class="card center">
يجب >p<
>p/<. أولا ً
الدخول
تسجيل
</div>
;`
return;
}
========================================= */
المعدة
صاحب
معدة
بيانات
/* =========================================
const equipment =
await getOperatorEquipment();
if(!equipment){
list.innerHTML = `
<div class="card center">
>p/<. المعدة
بيانات
لم >p<
على
العثور
يتم
</div>
;`
return;
}
========================================= */
جاهز Firebase
/* =========================================
if(window.ma3daFirebaseReady)
await window.ma3daFirebaseReady;
if(
!window.ma3daDB ||
typeof window.ma3daCollection !== "function" ||
typeof window.ma3daQuery !== "function" ||
typeof window.ma3daGetDocs !== "function"
{)
throw new Error(
الخاصة Firestore أدوات"
". جاهزة
غير
بالطلبات
;)
}
========================================= */
:مهم
الطلبات
بقراءة
المعدة
لصاحب
تسمح Rules
.searching الحالة
تكون
عندما
ًا
مقيد
الاستعلام
يكون
أن
يجب
لذلك
.getDocs قبل
نفسها
بالحالة
/* =========================================
const firestoreModule =
await import(
"https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
;)
const where =
firestoreModule.where;
if(typeof where !== "function")
throw new Error(
تعذر "
".Firebase من where تجهيز
;)
const requestsCollection =
window.ma3daCollection(
window.ma3daDB,
"requests"
;)
const requestsQuery =
window.ma3daQuery(
requestsCollection,
where(
"status",
,"=="
"searching"
)
;)
const snapshot =
await window.ma3daGetDocs(
requestsQuery
;)
========================================= */
المعدة
لنوع
المطابقة
الطلبات
تجهيز
/* =========================================
const requests = [];
snapshot.forEach(
docSnap => {
const data =
docSnap.data();
if(
data.status === "searching" &&
data.equipment === equipment.type
{)
requests.push({
id:
docSnap.id,
...data
;)}
}
}
;)
الأحدث */
/* أولا ً
requests.sort(
(a,b) =>
Number(
b.createdAt || 0
- )
Number(
a.createdAt || 0
)
;)
========================================= */
طلبات
توجد
لا
/* =========================================
if(!requests.length){
list.innerHTML = `
<div class="card center">
<div class="success-icon">
✓
</div>
<h3>
جديدة
</h3>
طلبات
توجد
لا
<p>
</p>
.لمعدتك
المناسبة
الطلبات
هنا
سنعرض
</div>
;`
return;
}
========================================= */
الطلبات
عرض
/* =========================================
list.innerHTML = "";
requests.forEach(
request => {
const card =
document.createElement(
"div"
;)
card.className =
"card operator-new-request-card";
const price =
Number(
request.price || 0
;)
card.innerHTML = `
<div class="request-title">
<span> </span>
<div>
<h2>
</h2>
${request.equipment || "-"}
<p>
مشغل
</p>
مع
</div>
</div>
<div class="operator-info">
<div class="operator-info-row">
<span>
العمل
</span>
موقع
<strong>
</strong>
${request.location || "-"}
</div>
<div class="operator-info-row">
<span>
</span>
العمل
مدة
<strong>
</strong>
${request.duration || "-"}
</div>
<div class="operator-info-row">
<span>
</span>
السعر
<strong>
</strong>
ريا })"price.toLocaleString("ar-SA{$
</div>
</div>
<div class="operator-notes">
<span>
العميل
ملاحظات
</span>
<p>
</p>
لا " || request.notes{$
}" ملاحظات
توجد
</div>
<div class="operator-buttons">
<button
class="reject-btn"
type="button"
data-reject-request="${request.id}"
>
الطلب
</button>
رفض
<button
class="accept-btn"
type="button"
data-accept-request="${request.id}"
>
الطلب
</button>
قبول
</div>
;`
list.appendChild(
card
;)
}
;)
}catch(error){
console.error(
خطأ "
,": ديدة الج
الطلبات
تحميل
في
error
;)
list.innerHTML = `
<div class="card center">
<h3>
الطلبات
</h3>
تحميل
تعذر
<p>
</p>
.Firestore وصلاحيات Firebase اتصال
من
تحقق
<p dir="ltr">
${error?.code || "unknown"}
</p>
<p dir="ltr">
لا " || error?.message{$
}" تفاصيل
توجد
</p>
</div>
;`
}
}
/* ACCEPT */
async function acceptOperatorRequest(
requestId
{)
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
;)
const requestSnap =
await window.ma3daGetDoc(
requestRef
;)
if(!requestSnap.exists()){
alert(
الطلب "
". موجود
غير
;)
return;
}
const request =
requestSnap.data();
if(
request.status !==
"searching"
{)
alert(
هذا "
ًا
". متاح
يعد
لم
الطلب
;)
await loadOperatorNewRequests();
return;
}
const operatorRef =
window.ma3daDoc(
window.ma3daDB,
"operators",
user.uid
;)
const operatorSnap =
await window.ma3daGetDoc(
operatorRef
;)
const operatorData =
operatorSnap.exists()
? operatorSnap.data()
;}{ :
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
صاحب "
," المعدة
operatorPhone:
operatorData.phone ||
,""
operatorRating:
Number(
operatorData.rating || 5
,)
operatorEquipment:
equipment?.model ||
,""
acceptedAt:
Date.now()
}
;)
localStorage.setItem("currentRequestId", requestId);
localStorage.setItem("orderState", "accepted");
await loadOperatorCurrentOrder();
showScreen(
"operatorCurrentOrderScreen"
;)
}catch(error){
console.error(
خطأ "
,": الطلب
قبول
في
error
;)
alert(
تعذر "
". الطلب
قبول
;)
}
}
/* REJECT */
async function rejectOperatorRequest(
requestId
{)
try{
const requestRef =
window.ma3daDoc(
window.ma3daDB,
"requests",
requestId
;)
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
;)
await loadOperatorNewRequests();
}catch(error){
console.error(
خطأ "
,": الطلب
رفض
في
error
;)
alert(
تعذر "
". الطلب
رفض
;)
}
}
/* CURRENT ORDER */
async function loadOperatorCurrentOrder(){
const requestId =
localStorage.getItem("currentRequestId");
if(!requestId){
updateOperatorCurrentUI(
null
;)
return;
}
try{
const requestRef =
window.ma3daDoc(
window.ma3daDB,
"requests",
requestId
;)
const snap =
await window.ma3daGetDoc(
requestRef
;)
if(!snap.exists()){
updateOperatorCurrentUI(
null
;)
return;
}
const data =
snap.data();
updateOperatorCurrentUI(
data
;)
}catch(error){
console.error(
خطأ "
الطلب
,": الحالي
في
error
;)
}
}
/* CURRENT ORDER UI */
function updateOperatorCurrentUI(
data
{)
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
لا "
طلب
;" حالي
يوجد
if(statusText)
statusText.textContent =
لا "
;" طلب
يوجد
if(statusIcon)
statusIcon.textContent =
;" "
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
;`ريا })"toLocaleString("ar-SA.)
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
{)
if(statusIcon)
statusIcon.textContent =
;" "
if(statusText)
statusText.textContent =
تم "
إلى
في
—
;" العميل
الطريق
الطلب
قبول
if(arrivedBtn)
arrivedBtn.style.display =
"block";
}
else if(
data.status ===
"arrived"
{)
if(statusIcon)
statusIcon.textContent =
;" "
if(statusText)
statusText.textContent =
وصلت "
;" لعميل ا
موقع
إلى
if(startBtn)
startBtn.style.display =
"block";
}
else if(
data.status ===
"working"
{)
if(statusIcon)
statusIcon.textContent =
;" "
if(statusText)
statusText.textContent =
العمل "
;" جار
if(timerBox)
timerBox.style.display =
"block";
if(endBtn)
endBtn.style.display =
"block";
startOperatorTimer(
data.workStartedAt
;)
}
else if(
data.status ===
"completed"
{)
if(statusIcon)
statusIcon.textContent =
;" "
if(statusText)
statusText.textContent =
تم "
;" العمل
إنهاء
}
}
/* OPERATOR ARRIVED */
async function operatorMarkArrived(){
const requestId =
localStorage.getItem("currentRequestId");
if(!requestId){
alert(
لا "
طلب
". حالي
يوجد
;)
return;
}
try{
const requestRef =
window.ma3daDoc(
window.ma3daDB,
"requests",
requestId
;)
await window.ma3daUpdateDoc(
requestRef,
{
status:
"arrived",
arrivedAt:
Date.now()
}
;)
localStorage.setItem("orderState", "arrived");
await loadOperatorCurrentOrder();
}catch(error){
console.error(
خطأ "
,": الوصول
تسجيل
في
error
;)
alert(
تعذر "
". الوصول
تسجيل
;)
}
}
/* OPERATOR START WORK */
async function operatorStartWork(){
if(
selectedRole !==
"operator"
{)
console.warn(
". المعدة
محاولة "
صاحب
غير
من
العمل
بدء
;)
return;
}
const requestId =
localStorage.getItem("currentRequestId");
if(!requestId){
alert(
لا "
طلب
". حالي
يوجد
;)
return;
}
try{
const requestRef =
window.ma3daDoc(
window.ma3daDB,
"requests",
requestId
;)
const requestSnap =
await window.ma3daGetDoc(
requestRef
;)
if(!requestSnap.exists()){
alert(
الطلب "
". موجود
غير
;)
return;
}
const request =
requestSnap.data();
if(
request.status !==
"arrived"
{)
alert(
لا "
". الوصول
تسجيل
قبل
العمل
بدء
يمكن
;)
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
;)
}
localStorage.setItem("orderState", "working");
startOperatorTimer(
startTime
;)
await loadOperatorCurrentOrder();
}catch(error){
console.error(
خطأ "
,": العمل
بدء
في
error
;)
alert(
تعذر "
". العمل
بدء
;)
}
}
/* OPERATOR TIMER */
function startOperatorTimer(
startTime
{)
clearInterval(
operatorTimerInterval
;)
const timer =
document.getElementById("operatorTimer");
if(!timer)
return;
function update(){
const elapsed =
Math.max(
,0
Date.now() -
Number(
startTime ||
Date.now()
)
;)
const totalSeconds =
Math.floor(
elapsed / 1000
;)
const hours =
Math.floor(
totalSeconds / 3600
;)
const minutes =
Math.floor(
(totalSeconds % 3600) / 60
;)
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
;)
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
;)
const snapshot =
await window.ma3daGetDoc(
requestRef
;)
if(!snapshot.exists()){
alert(
الطلب "
". موجودغير
;)
return;
}
const request =
snapshot.data();
if(
request.status !==
"working"
{)
alert(
;)
return;
لا "
". الآن
العمل
إنهاء
يمكن
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
;)
clearInterval(
operatorTimerInterval
;)
localStorage.setItem("orderState", "completed");
const finalPrice =
Number(
request.price || 0
;)
localStorage.setItem(
"finalPrice",
String(
finalPrice
)
;)
const priceElement =
document.getElementById("finalPrice");
if(priceElement)
priceElement.textContent =
;`ريا })"finalPrice.toLocaleString("ar-SA{$`
if(
document.getElementById("operatorCompletedScreen")
{)
showScreen(
"operatorCompletedScreen"
;)
}else{
showScreen(
"operatorCurrentOrderScreen"
;)
}
}catch(error){
console.error(
خطأ "
,": العمل
إنهاء
في
error
;)
alert(
تعذر "
". العمل
إنهاء
;)
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
جاري >p<
>p/<... الطلبات
تحميل
</div>
;`
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
;)
const requests = [];
snapshot.forEach(
docSnap=>{
const data =
docSnap.data();
if(
(
)
data.operatorId === user.uid &&
data.status === "completed" ||
data.status === "rejected"
{)
requests.push({
id:
docSnap.id,
...data
;)}
}
}
;)
requests.sort(
(a,b)=>
Number(
b.completedAt ||
b.createdAt ||
0
- )
Number(
a.completedAt ||
a.createdAt ||
0
)
;)
if(!requests.length){
list.innerHTML = `
<div class="card center">
<p>
</p>
</div>
.الآن
حتى
سابقة
طلبات
توجد
لا
;`
return;
}
list.innerHTML =
;""
requests.forEach(
request=>{
const card =
document.createElement(
"div"
;)
card.className =
"card";
const status =
request.status ===
"completed"
" مكتمل" ?
;" مرفوض" :
card.innerHTML = `
<h3>
</h3>
${request.equipment || "-"}
<div class="info-row">
<span>
الموقع
</span>
<strong>
</strong>
${request.location || "-"}
</div>
<div class="info-row">
<span>
المدة
</span>
<strong>
</strong>
${request.duration || "-"}
</div>
<div class="info-row">
<span>
المبلغ
</span>
<strong>
${Number(
request.price || 0
).toLocaleString("ar-SA")}
ريا
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
list.appendChild(
card
;`
;)
;)
}
}catch(error){
console.error(
خطأ "
,": السابقة
الطلبات
في
error
;)
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
;)
let totalIncome =
;0
let completedCount =
;0
let totalHours =
;0
const completedRequests =
;][
snapshot.forEach(
docSnap=>{
const data =
docSnap.data();
if(
data.operatorId === user.uid &&
data.status === "completed"
{)
const price =
Number(
data.price || 0
;)
totalIncome +=
price;
completedCount++;
const hours =
durationHours[
data.duration
;0 || ]
totalHours +=
hours;
completedRequests.push(
data
;)
}
}
;)
const incomeElement =
document.getElementById("operatorTotalIncome");
const countElement =
document.getElementById("operatorCompletedCount");
const hoursElement =
document.getElementById("operatorTotalHours");
if(incomeElement)
incomeElement.textContent =
;`ريا })"totalIncome.toLocaleString("ar-SA{$`
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
;""
completedRequests
.sort(
(a,b)=>
Number(
b.completedAt || 0
- )
Number(
a.completedAt || 0
)
)
.forEach(
request=>{
const card =
document.createElement(
"div"
;)
card.className =
"card";
card.innerHTML = `
<h3>
</h3>
${request.equipment || "-"}
<div class="info-row">
<span>
المبلغ
</span>
<strong>
${Number(
request.price || 0
).toLocaleString("ar-SA")}
ريا
</strong>
</div>
<div class="info-row">
<span>
المدة
</span>
<strong>
</strong>
${request.duration || "-"}
</div>
;`
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
;)
}
}
}
;)
const average =
count
( ?
total /
count
).toFixed(1)
;"0.0" :
const averageElement =
document.getElementById("operatorAverageRating");
const countElement =
document.getElementById("operatorRatingCount");
if(averageElement)
averageElement.textContent =
average;
if(countElement)
countElement.textContent =
;`تقييم }count{$`
const list =
document.getElementById("operatorRatingsList");
if(!list)
return;
list.innerHTML =
;""
if(!ratings.length){
list.innerHTML = `
<div class="card center">
<p>
</p>
</div>
.الآن
حتى
تقييمات
توجد
لا
;`
return;
}
ratings
.sort(
(a,b)=>
Number(
b.ratedAt || 0
- )
Number(
a.ratedAt || 0
)
)
.forEach(
rating=>{
const card =
document.createElement(
"div"
;)
card.className =
"card";
const value =
Number(
rating.rating || 0
;)
card.innerHTML = `
<div class="info-row">
<span>
العميل
</span>
تقييم
<strong>
${" ".repeat(
Math.min(
,5
value
)
})
</strong>
</div>
;`
list.appendChild(
card
;)
}
;)
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
;)
const availability =
document.getElementById("operatorEquipmentAvailabilityEdit")?.value ||
"available";
if(
!type ||
!model ||
!year ||
!city ||
price <= 0
{)
alert(
أكمل "
". المعدة
بيانات
;)
return;
}
const equipmentRef =
window.ma3daDoc(
window.ma3daDB,
"equipment",
user.uid
;)
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
;)
alert(
المعدة
بيانات
حفظ
تم "
" بنجاح
;)
}catch(error){
console.error(
خطأ "
حفظ
,": المعدة
في
error
;)
alert(
تعذر "
". المعدة
بيانات
حفظ
;)
}
}
function resizeOperatorImage(
file
{)
return new Promise(
(resolve,reject)=>{
const reader =
new FileReader();
reader.onload =
event=>{
const img =
new Image();
img.onload =
{>=)(
const maxWidth =
;1000
const scale =
Math.min(
,1
maxWidth /
img.width
;)
const canvas =
document.createElement(
"canvas"
;)
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
أكمل "
". الحساب
نات بيا
;)
return;
}
try{
await window.ma3daSetDoc(
window.ma3daDoc(
window.ma3daDB,
"operators",
user.uid
,)
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
,}
{
merge:true
}
;)
await loadOperatorDashboard();
alert(
تم "
". الحساب
بيانات
حفظ
;)
}catch(error){
console.error(
تعذر "
,": المعدة
صاحب
بيانات
حفظ
error
;)
alert(
تعذر "
". الحساب
بيانات
حفظ
;)
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
;)
}
;)
}
const saveOperatorSettingsBtn =
document.getElementById("saveOperatorSettingsBtn");
if(saveOperatorSettingsBtn){
saveOperatorSettingsBtn.addEventListener(
"click",
saveOperatorSettings
;)
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
{)
alert(
لا "
". بالحساب
مرتبط
إلكتروني
بريد
يوجد
;)
return;
}
await window.ma3daSendPasswordResetEmail(
user.email
;)
alert(
بريدك
تم "
". الإلكتروني
إلى
المرور
كلمة
تغيير
رابط
إرسال
;)
}catch(error){
console.error(
error
;)
alert(
كلمة
تعذر "
". المرور
تغيير
رابط
إرسال
;)
}
}
;)
}
/* OPERATOR SUPPORT */
const operatorSupportBtn =
document.getElementById("operatorSupportBtn");
if(operatorSupportBtn){
operatorSupportBtn.addEventListener(
"click",
{>=)(
showScreen(
"operatorSupportScreen"
;)
}
;)
}
لا */
/* . هنا
وهمي
واتساب
رقم
يوجد
const operatorSupportWhatsAppBtn =
document.getElementById("operatorSupportWhatsAppBtn");
if(operatorSupportWhatsAppBtn){
operatorSupportWhatsAppBtn.addEventListener(
"click",
{>=)(
alert(
ًا
سيتم "
". قريب
الفني
الدعم
ربط
;)
}
;)
}
/* OPERATOR ARRIVED / WORK */
const operatorArrivedBtn =
document.getElementById("operatorArrivedBtn");
if(operatorArrivedBtn){
operatorArrivedBtn.addEventListener(
"click",
operatorMarkArrived
;)
}
const operatorStartWorkBtn =
document.getElementById("operatorStartWorkBtn");
if(operatorStartWorkBtn){
operatorStartWorkBtn.addEventListener(
"click",
operatorStartWork
;)
}
const operatorEndWorkBtn =
document.getElementById("operatorEndWorkBtn");
if(operatorEndWorkBtn){
operatorEndWorkBtn.addEventListener(
"click",
operatorFinishWork
;)
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
لا "
طلب
". حالي
يوجد
;)
return;
}
const requestRef =
window.ma3daDoc(
window.ma3daDB,
"requests",
requestId
;)
const snapshot =
await window.ma3daGetDoc(
requestRef
;)
if(!snapshot.exists()){
alert(
تعذر "
". الطلب
على
العثور
;)
return;
}
const data =
snapshot.data();
const phone =
data.customerPhone ||
;""
if(!phone){
alert(
ًا
رقم "
". حالي
متوفر
غير
العميل
;)
return;
}
window.location.href =
`tel:${phone}`;
}catch(error){
console.error(
الاتصال
تعذر "
,": بالعميل
error
;)
alert(
ًا
الاتصال
تعذر "
". حالي
;)
}
}
;)
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
{>=)(
showScreen(
"operatorHomeScreen"
;)
}
;)
}
/* OPERATOR LOGOUT */
const operatorHomeLogoutBtn =
document.getElementById("operatorHomeLogoutBtn");
if(operatorHomeLogoutBtn){
operatorHomeLogoutBtn.addEventListener(
"click",
ma3daLogout
;)
}
========================================================= */
SUPPORT STAFF PORTAL
الدعم
موظفي
بوابة
/* =========================================================
const SUPPORT_STAFF_MODE =
new URLSearchParams(window.location.search).get("staff") === "1";
let supportEmployee = null;
========================================================= */
دعم
شاشة
أي
فتح
/* =========================================================
function openSupportScreen(id){
*/
مباشرة
هنا querySelectorAll نستخدم
موجودة index.html شاشات
جميع
أن
نضمن
حتى
قبل script.js تحميل
تم
لو
حتى
. الصفحة
نهاية
/*
document
.querySelectorAll(".screen")
.forEach(screen => {
screen.classList.remove("active");
;)}
const screen =
document.getElementById(id);
if(screen){
screen.classList.add("active");
window.scrollTo(
,0
0
;)
}
}
========================================================= */
الدعم
موظف
حساب
على
الحصول
/* =========================================================
async function getSupportEmployee(){
const user =
window.ma3daGetCurrentUser
? await window.ma3daGetCurrentUser()
: window.ma3daAuth?.currentUser;
if(!user)
return null;
console.log("SUPPORT CHECK UID:", user.uid);
console.log("SUPPORT CHECK EMAIL:", user.email);
----------------------------------------- */
Custom Claims من
التحقق
/* -----------------------------------------
try{
if(
typeof user.getIdTokenResult ===
"function"
{)
const token =
await user.getIdTokenResult();
const role =
token?.claims?.role;
if(
{)
role === "support" ||
role === "admin"
return {
user,
role
;}
}
}
}catch(error){
console.warn(
تعذر "
,":Firebase منالموظف
صلاحية
قراءة
error
;)
}
----------------------------------------- */
}supportStaff/{uid من
التحقق
/* -----------------------------------------
try{
if(
window.ma3daDB &&
window.ma3daDoc &&
window.ma3daGetDoc
{)
const ref =
window.ma3daDoc(
window.ma3daDB,
"supportStaff",
user.uid
;)
const snapshot =
await window.ma3daGetDoc(
ref
;)
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
&& )
data.active !== false
{)
return {
user,
role,
data
;}
}
}
}
}catch(error){
console.error(
موظف
حساب
التحقق
تعذر "
,": الدعم
من
error
;)
}
return null;
}
========================================================= */
الدعم
موظفي
لوحة
حماية
/* =========================================================
async function requireSupportEmployee(){
const employee =
await getSupportEmployee();
if(!employee){
supportEmployee =
null;
localStorage.removeItem(
"supportEmployee"
;)
openSupportScreen(
"supportLoginScreen"
;)
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
,""
employee.user.email ||
role:
employee.role
)}
;)
return employee;
}
========================================================= */
الدعم
موظف
دخول
تسجيل
/* =========================================================
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
;)
if(error){
error.textContent =
;""
error.style.color =
"#b91c1c";
}
if(!email){
if(error)
error.textContent =
اكتب "
;". الموظف
بريد
return;
}
if(!password){
if(error)
error.textContent =
كلمة
اكتب "
;". المرور
return;
}
if(
{)
typeof window.ma3daLogin !==
"function"
if(error)
error.textContent =
خدمة "
;". جاهزة
غير
الدخول
تسجيل
return;
}
const button =
document.getElementById(
"supportLoginBtn"
;)
if(button){
button.disabled =
true;
button.textContent =
جاري "
;"... التحقق
}
try{
await window.ma3daLogin(
email,
password
;)
*/
ً
Firebase يتأكد
حتى
قليلا
ننتظر
الدخول
تسجيل
بعد
الحالي
المستخدم
تثبيت
من
/*
await new Promise(
resolve =>
setTimeout(
resolve,
500
)
;)
*/
Firebase من
مباشرة
المستخدم
نقرأ
العامة
الدالة
على
فقط
الاعتماد
بدل
/*
const currentUser =
window.ma3daAuth?.currentUser;
if(!currentUser){
if(error)
error.textContent =
;". أخرى
حاول .الموظف
تم "
مرة
حساب
على
التعرف
يتم
لم
لكن
الدخول،
تسجيل
return;
}
*/
باستخدام
الدعم
موظف
من
مباشرة
المستخدم UID
الحالي
نتحقق
/*
let employee = null;
try{
const ref =
window.ma3daDoc(
window.ma3daDB,
"supportStaff",
currentUser.uid
;)
const snapshot =
await window.ma3daGetDoc(
ref
;)
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
&& )
data.active !== false
{)
employee = {
user:
currentUser,
role,
data
;}
}
}
}catch(checkError){
console.error(
خطأ "
موظف
بيانات
قراءة
,": الدعم
checkError
;)
}
if(!employee){
if(error)
error.textContent =
هذا "
ًا
;". له
مصرح
دعم
موظف
حساب
ليس
الحساب
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
)}
;)
openSupportDashboard();
}catch(errorObject){
console.error(
خطأ "
موظف
دخول
,": الدعم
errorObject
;)
if(error){
error.textContent =
errorObject?.message ||
تعذر "
;". الدخول
تسجيل
}
}finally{
if(button){
button.disabled =
false;
button.textContent =
دخول "
;" الموظف
}
}
}
========================================================= */
المرور
كلمة
استعادة
/* =========================================================
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
;)
const button =
document.getElementById(
"supportResetBtn"
;)
if(message){
message.textContent =
;""
message.style.color =
"#b91c1c";
}
if(!email){
if(message)
message.textContent =
اكتب "
;". الموظف
بريد
return;
}
if(
typeof window.ma3daSendPasswordResetEmail !==
"function"
{)
if(message)
message.textContent =
خدمة "
;". جاهزة
غير
الاستعادة
return;
}
if(button){
button.disabled =
true;
button.textContent =
جاري "
;"... الإرسال
}
try{
;)
await window.ma3daSendPasswordResetEmail(
email
if(message){
message.style.color =
"#15803d";
message.textContent =
البريد
تم "
;". الإلكتروني
إلى
الاستعادة
رابط
إرسال
}
}catch(error){
console.error(
خطأ "
,": الموظف
مرور
كلمة
استعادة
error
;)
if(message){
message.style.color =
"#b91c1c";
message.textContent =
error?.message ||
تعذر "
;". الاستعادة
رابط
إرسال
}
}finally{
if(button){
button.disabled =
false;
button.textContent =
إرسال "
;" الاستعادة
رابط
}
}
}
========================================================= */
الدعم
لوحة
أقسام
/* =========================================================
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
;)
;)}
document
.querySelectorAll(
".support-section"
)
.forEach(section => {
section.classList.remove(
"active"
;)
;)}
const sectionId =
`supportSection${
name.charAt(0).toUpperCase()
}${name.slice(1)}`;
const section =
document.getElementById(
sectionId
;)
if(section){
section.classList.add(
"active"
;)
}
}
========================================================= */
قائمة
عرض
/* =========================================================
function supportSetList(
id,
html
{)
const list =
document.getElementById(
id
;)
if(list){
list.innerHTML =
html;
}
}
========================================================= */
بيانات
صف
/* =========================================================
function supportRow(
title,
value
{)
return `
<div class="support-row">
<span>
${title}
</span>
<strong>
${value ?? "-"}
</strong>
</div>
;`
}
========================================================= */
Firestore من Collection جلب
/* =========================================================
async function supportGetCollection(
name
{)
if(
!window.ma3daDB ||
!window.ma3daCollection ||
!window.ma3daGetDocs
{)
console.warn(
غير Firebase"
,": لتحميل
جاهز
name
;)
return [];
}
try{
const snapshot =
await window.ma3daGetDocs(
window.ma3daCollection(
window.ma3daDB,
name
)
;)
const rows = [];
snapshot.forEach(
docSnap => {
rows.push({
id:
docSnap.id,
...(docSnap.data() || {})
;)}
}
;)
return rows;
}catch(error){
console.warn(
تعذر `
,`:}name{$ تحميل
error
;)
return [];
}
}
========================================================= */
التذاكر /
الطلبات
/* =========================================================
async function loadSupportTickets(){
const rows =
await supportGetCollection(
"supportTickets"
;)
const list =
document.getElementById(
"supportTicketsList"
;)
const stat =
document.getElementById(
"supportStatTickets"
;)
if(stat)
stat.textContent =
rows.length;
if(!list)
return;
if(!rows.length){
list.innerHTML =
ًا
لا >"div class="support-empty<'
;'>div/<. حالي
مسجلة
دعم
طلبات
توجد
return;
}
list.innerHTML =
rows
.slice(0,50)
.map(row => `
<div class="support-row">
<div>
<strong>
{$
row.subject ||
row.title ||
طلب "
" دعم
}
</strong>
<br>
<small>
{$
row.customerEmail ||
row.email ||
row.customerId ||
"مستخدم"
}
</small>
</div>
<span>
{$
row.status ||
"مفتوح"
}
</span>
</div>
)`
.join("");
}
========================================================= */
والمشغلين
العملاء
/* =========================================================
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
,"عميل"
row.email ||
row.phone ||
row.id
)
)
.join("")
لا >"div class="support-empty<' :
;'>users.</div مجموعة
في
عملاء
بيانات
توجد
}
if(operatorList){
operatorList.innerHTML =
operators.length
? operators
.slice(0,50)
.map(row =>
supportRow(
row.name ||
معدة
," مشغل /
صاحب "
row.email ||
row.phone ||
row.id
)
)
.join("")
لا >"div class="support-empty<' :
;'>users.</div مجموعة
في
مشغلين
بيانات
توجد
}
}
========================================================= */
المعدات
/* =========================================================
async function loadSupportEquipment(){
const equipment =
await supportGetCollection(
"equipment"
;)
const list =
document.getElementById(
"supportOperatorsList"
;)
const stat =
document.getElementById(
"supportStatOperators"
;)
if(stat)
stat.textContent =
equipment.length;
if(!list)
return;
if(!equipment.length){
list.innerHTML =
ًا
لا >"div class="support-empty<'
;'>div/<. حالي
سجلة م
معدات
توجد
return;
}
list.innerHTML =
equipment
.slice(0,50)
.map(row => `
<div class="support-row">
<div>
<strong>
{$
row.type ||
"معدة"
}
{$
row.model ||
""
}
</strong>
<br>
<small>
{$
row.city ||
بدون "
"مدينة
}
</small>
</div>
<span>
{$
row.availability ===
"available"
"متاحة" ?
غير " :
" متاحة
}
</span>
</div>
)`
.join("");
}
========================================================= */
الحالية
الطلبات
/* =========================================================
async function loadSupportOrders(){
const rows =
await supportGetCollection(
"requests"
;)
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
;)
const list =
document.getElementById(
"supportOrdersList"
;)
const stat =
document.getElementById(
"supportStatOrders"
;)
if(stat)
stat.textContent =
current.length;
if(!list)
return;
if(!current.length){
list.innerHTML =
لا >"div class="support-empty<'
;'>div/<. حالية
طلبات
توجد
return;
}
list.innerHTML =
current
.slice(0,50)
.map(row => `
<div class="support-row">
<div>
<strong>
{$
row.equipment ||
طلب "
" معدة
}
</strong>
<br>
<small>
{$
row.location ||
بدون "
"موقع
}
</small>
</div>
<span>
{$
row.status ||
"
"
-
}
</span>
</div>
)`
.join("");
}
========================================================= */
المحادثات
/* =========================================================
async function loadSupportChats(){
const tickets =
await supportGetCollection(
"supportTickets"
;)
const list =
document.getElementById(
"supportChatsList"
;)
if(!list)
return;
if(!tickets.length){
list.innerHTML =
ًا
لا >"div class="support-empty<'
;'>div/<. حالي
دعم
محادثات
توجد
return;
}
list.innerHTML =
tickets
.slice(0,50)
.map(row => `
<div class="support-row">
<div>
<strong>
{$
row.subject ||
row.title ||
محادثة "
" دعم
}
</strong>
<br>
<small>
{$
row.customerEmail ||
row.email ||
row.customerId ||
"مستخدم"
}
</small>
</div>
<span>
{$
}
</span>
</div>
row.status ||
"مفتوح"
)`
.join("");
}
========================================================= */
البلاغات
/* =========================================================
async function loadSupportReports(){
const rows =
await supportGetCollection(
"reports"
;)
const list =
document.getElementById(
"supportReportsList"
;)
if(!list)
return;
if(!rows.length){
list.innerHTML =
لا >"div class="support-empty<'
;'>div/<. مسجلة
مشاكل
أو
بلاغات
توجد
return;
}
list.innerHTML =
rows
.slice(0,50)
.map(row => `
<div class="support-row">
<div>
<strong>
{$
row.title ||
row.subject ||
"بلاغ"
}
</strong>
<br>
<small>
{$
row.description ||
row.message ||
بدون "
"وصف
}
</small>
</div>
<span>
{$
row.status ||
"مفتوح"
}
</span>
</div>
)`
.join("");
}
========================================================= */
الدعم
موظف
لوحة
فتح
/* =========================================================
async function openSupportDashboard(){
const employee =
await requireSupportEmployee();
if(!employee)
return;
const email =
employee.user.email ||
;""
const emailElements = [
document.getElementById(
"supportEmployeeEmail"
,)
document.getElementById(
"supportSettingsEmail"
)
;]
emailElements.forEach(
element => {
if(element){
element.textContent =
email ||
موظف "
;" دعم
}
}
;)
const role =
document.getElementById(
"supportSettingsRole"
;)
if(role){
role.textContent =
employee.role === "admin"
مدير " ?
" دعم
موظف " :
;" دعم
openSupportScreen(
"supportDashboardScreen"
}
;)
*/
/*
ًا
ضي
افترا
التذاكر
قسم
نفتح
supportSetSection(
"tickets"
;)
await Promise.all([
loadSupportTickets(),
loadSupportUsers(),
loadSupportEquipment(),
loadSupportOrders(),
loadSupportChats(),
loadSupportReports()
;)]
}
========================================================= */
الخروج
تسجيل
/* =========================================================
async function supportLogout(){
try{
if(
typeof window.ma3daLogout ===
"function"
{)
await window.ma3daLogout();
}
}catch(error){
console.error(
تعذر "
موظف
,": الدعم
خروج
تسجيل
error
;)
}finally{
supportEmployee =
null;
localStorage.removeItem(
"supportEmployee"
;)
openSupportScreen(
"roleScreen"
;)
}
}
========================================================= */
الدور
اختيار
صفحة
من
الدعم
موظفي
دخول
زر
/* =========================================================
function initSupportRoleButton(){
const supportStaffBtn =
document.getElementById(
"supportStaffBtn"
;)
if(
{)
supportStaffBtn &&
!supportStaffBtn.dataset.supportReady
supportStaffBtn.dataset.supportReady =
"true";
supportStaffBtn.addEventListener(
"click",
{ >= )(
openSupportScreen(
"supportLoginScreen"
;)
}
;)
}
}
========================================================= */
الدعم
بوابة
أزرار
تشغيل
/* =========================================================
function initSupportPortal(){
const loginButton =
document.getElementById(
"supportLoginBtn"
;)
const forgotButton =
document.getElementById(
"supportForgotBtn"
;)
const resetButton =
document.getElementById(
"supportResetBtn"
;)
const backButton =
document.getElementById(
"supportBackBtn"
;)
const forgotBackButton =
document.getElementById(
"supportForgotBackBtn"
;)
const logoutButton =
document.getElementById(
"supportLogoutBtn"
;)
const refreshButton =
document.getElementById(
"supportRefreshBtn"
;)
----------------------------------------- */
الموظف
دخول
زر
/* -----------------------------------------
if(
loginButton &&
!loginButton.dataset.supportReady
{)
loginButton.dataset.supportReady =
"true";
loginButton.addEventListener(
"click",
supportLogin
;)
}
----------------------------------------- */
المرور
كلمة
نسيت
/* -----------------------------------------
if(
forgotButton &&
!forgotButton.dataset.supportReady
{)
forgotButton.dataset.supportReady =
"true";
forgotButton.addEventListener(
"click",
{ >= )(
openSupportScreen(
"supportForgotScreen"
;)
}
;)
}
----------------------------------------- */
الاستعادة
رابط
إرسال
/* -----------------------------------------
if(
{)
resetButton &&
!resetButton.dataset.supportReady
resetButton.dataset.supportReady =
"true";
resetButton.addEventListener(
"click",
supportResetPassword
;)
}
----------------------------------------- */
الدعم
دخول
تسجيل
من
العودة
/* -----------------------------------------
if(
{)
backButton &&
!backButton.dataset.supportReady
backButton.dataset.supportReady =
"true";
backButton.addEventListener(
"click",
{ >= )(
openSupportScreen(
"roleScreen"
;)
}
;)
}
----------------------------------------- */
المرور
كلمة
نسيت
صفحة
من
العودة
/* -----------------------------------------
if(
forgotBackButton &&
!forgotBackButton.dataset.supportReady
{)
forgotBackButton.dataset.supportReady =
"true";
forgotBackButton.addEventListener(
"click",
{ >= )(
openSupportScreen(
"supportLoginScreen"
;)
}
;)
}
----------------------------------------- */
الدعم
أقسام
لوحة
/* -----------------------------------------
document
.querySelectorAll(
"[data-support-section]"
)
.forEach(button => {
if(
)
button.dataset.supportReady
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
;)
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
;)
;)}
----------------------------------------- */
الدعم
لوحة
تحديث
/* -----------------------------------------
if(
refreshButton &&
!refreshButton.dataset.supportReady
{)
refreshButton.dataset.supportReady =
"true";
refreshButton.addEventListener(
"click",
async () => {
await openSupportDashboard();
}
;)
}
----------------------------------------- */
الخروج
تسجيل
/* -----------------------------------------
if(
logoutButton &&
!logoutButton.dataset.supportReady
{)
logoutButton.dataset.supportReady =
"true";
logoutButton.addEventListener(
"click",
supportLogout
;)
}
----------------------------------------- */
الدور
اختيار
صفحة
من
الدخول
زر
/* -----------------------------------------
initSupportRoleButton();
}
========================================================= */
HTML اكتمال
بعد
البوابة
تشغيل
/* =========================================================
function startSupportPortal(){
initSupportPortal();
*/
الموظف
دخل
: بالرابط
إذا
?staff=1
ًا
الدخول
صفحة
. تلقائي
نفتح
/*
if(SUPPORT_STAFF_MODE){
const currentUser =
window.ma3daGetCurrentUser
? window.ma3daGetCurrentUser()
: Promise.resolve(
window.ma3daAuth?.currentUser ||
null
;)
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
;)
}
)
.catch(error => {
console.error(
تعذر "
,": الدعم
موظفي
بوابة
تشغيل
error
;)
openSupportScreen(
"supportLoginScreen"
;)
;)}
}
}
========================================================= */
ًا
: جد
مهم
يتم script.js
index.html نهاية
قبل
ًا
ديناميكي
تحميله
ً
لذلك
إذا DOM ننتظر
. مكتملا
يكن
لم
/* =========================================================
if(
document.readyState ===
"loading"
{)
document.addEventListener(
"DOMContentLoaded",
startSupportPortal,
{
once: true
}
;)
}else{
startSupportPortal();
}
========================================================= */
script.js تحميل
بعد
الدعم
زر
إنشاء
تم
إذا
إضافي
دعم
/* =========================================================
setTimeout(
{ >= )(
initSupportRoleButton();
,}
500
;)
========================================================= */
CONTRACTOR / PROJECT OWNER
مِعدة
/* =========================================================
(function () {
"use strict";
========================================================= */
CONTRACTOR STATE
/* =========================================================
let contractorCurrentOrderId =
localStorage.getItem("contractorCurrentOrderId") || null;
let contractorCurrentOrder =
JSON.parse(
localStorage.getItem("contractorCurrentOrder") || "null"
;)
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
) {
typeof window.ma3daGetCurrentUser ===
"function"
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
;)
}
function contractorSetRole() {
localStorage.setItem(
"ma3daRole",
"contractor"
localStorage.setItem(
"userRole",
"contractor"
;)
;)
localStorage.setItem(
"currentRole",
"contractor"
;)
window.ma3daCurrentRole =
"contractor";
}
========================================================= */
CONTRACTOR ROLE BUTTON
/* =========================================================
document.addEventListener(
"click",
function(event) {
const contractorRoleBtn =
event.target.closest(
"#contractorRoleBtn"
;)
if (!contractorRoleBtn)
return;
contractorSetRole();
selectedRole = "contractor";
localStorage.setItem("selectedRole", "contractor");
const phoneRoleText =
document.getElementById(
"phoneRoleText"
;)
if (phoneRoleText) {
phoneRoleText.textContent =
صاحب /
تسجيل "
كمقاول
الدخول
;" مشروع
}
const phoneTitle =
document.querySelector(
"#phoneScreen h1"
;)
if (phoneTitle) {
phoneTitle.textContent =
تسجيل "
;" الدخول
}
contractorShowScreen(
"phoneScreen"
;)
}
;)
========================================================= */
LOAD CONTRACTOR PROFILE
/* =========================================================
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
;)
const snapshot =
await window.ma3daGetDoc(
contractorRef
;)
if (
{ )
snapshot &&
snapshot.exists()
const data =
snapshot.data();
contractorSaveLocal({
...data,
uid: user.uid
;)}
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
;)
const companyInput =
document.getElementById(
"contractorCompanyInput"
;)
if (nameInput) {
nameInput.value = name;
if (phoneInput) {
phoneInput.value = phone;
if (cityInput) {
cityInput.value = city;
if (companyInput) {
companyInput.value = company;
}
}
}
}
const homeName =
document.getElementById(
"contractorHomeName"
;)
if (homeName) {
homeName.textContent =
;"مقاول " || name
}
const settingsName =
document.getElementById(
"contractorSettingsName"
;)
const settingsPhone =
document.getElementById(
"contractorSettingsPhone"
;)
const settingsCity =
document.getElementById(
"contractorSettingsCity"
;)
const settingsCompany =
document.getElementById(
"contractorSettingsCompany"
;)
if (settingsName) {
settingsName.value = name;
}
if (settingsPhone) {
settingsPhone.value = phone;
if (settingsCity) {
settingsCity.value = city;
if (settingsCompany) {
settingsCompany.value = company;
}
}
}
}
========================================================= */
SAVE CONTRACTOR DATA
/* =========================================================
const saveContractorDataBtn =
document.getElementById(
"saveContractorDataBtn"
;)
if (saveContractorDataBtn) {
saveContractorDataBtn.addEventListener(
"click",
async function () {
const user =
await getContractorUser();
if (!user) {
alert(
;)
return;
يجب "
". أولا ً
الدخول
تسجيل
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
اكتب "
". اسمك
;)
return;
}
if (!phone) {
alert(
اكتب "
". الجوال
رقم
;)
return;
}
if (!city) {
alert(
;)
return;
اكتب "
". المدينة
}
try {
saveContractorDataBtn.disabled =
true;
saveContractorDataBtn.textContent =
جاري "
;"... الحفظ
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
;}
const contractorRef =
window.ma3daDoc(
window.ma3daDB,
"contractors",
user.uid
;)
await window.ma3daSetDoc(
contractorRef,
contractorData,
{
merge: true
}
;)
contractorSaveLocal(
contractorData
;)
fillContractorProfile(
contractorData
;)
contractorShowScreen(
"contractorHomeScreen"
;)
} catch (error) {
console.error("Save contractor error:", error);
alert(
"
+ "n\: الحفظ
فشل
سبب
بدون " || error?.code(
+ )" رمز
"\n" +
خطأ " || error?.message(
)" معروف
غير
;)
}
finally {
saveContractorDataBtn.disabled =
false;
saveContractorDataBtn.textContent =
حفظ "
;" ومتابعة
}
}
;)
}
========================================================= */
OPEN CONTRACTOR HOME
/* =========================================================
async function openContractorHome() {
contractorSetRole();
const profile =
await loadContractorProfile();
if (profile) {
fillContractorProfile(
profile
;)
contractorShowScreen(
"contractorHomeScreen"
;)
return;
}
const localProfile =
contractorGetProfile();
if (localProfile) {
fillContractorProfile(
localProfile
;)
;)
return;
contractorShowScreen(
"contractorHomeScreen"
}
contractorShowScreen(
"contractorDataScreen"
;)
}
window.openContractorHome =
openContractorHome;
========================================================= */
NEW REQUEST
/* =========================================================
const contractorNewRequestBtn =
document.getElementById(
"contractorNewRequestBtn"
;)
if (contractorNewRequestBtn) {
contractorNewRequestBtn.addEventListener(
"click",
function () {
contractorSetRole();
contractorShowScreen(
"contractorRequestScreen"
;)
}
;)
}
========================================================= */
SUBMIT CONTRACTOR REQUEST
/* =========================================================
const submitContractorRequestBtn =
document.getElementById(
"submitContractorRequestBtn"
;)
if (submitContractorRequestBtn) {
submitContractorRequestBtn.addEventListener(
"click",
async function () {
const user =
getContractorUser();
if (!user) {
alert(
;)
return;
يجب "
". أولا ً
الدخول
تسجيل
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
;)
return;
اكتب "
". العمل
موقع
}
if (!equipment) {
alert(
;)
return;
اختر "
". المعدة
نوع
}
if (!duration) {
alert(
مدة
اختر "
". العمل
;)
return;
}
if (!operator) {
alert(
;)
return;
اختر "
.المشغل
"
}
*/
المستخدمة
نفسها
الأسعار
مِعدة
.الحالي
نظام
في
/*
const hourlyPrices = {
, 250 :"
بوكلين "
, 220 :"
شيول "
, 180 :"
قلاب "
, 350 :"
كرين "
, 250 :"
حفار "
300 :"
بلدوزر "
;}
const durationHours = {
ساعة "
, 1 :"
واحدة
ساعات 4"
, 4 :"
ساعات 8"
, 8 :"
10 :"
كامل
يوم "
;}
const hours =
durationHours[duration] ||
;1
const hourlyPrice =
hourlyPrices[equipment] ||
;0
const price =
hourlyPrice * hours;
try {
submitContractorRequestBtn.disabled =
true;
submitContractorRequestBtn.textContent =
جاري "
;"... الطلبإرسال
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
;)
contractorCurrentOrderId =
result.id;
contractorCurrentOrder = {
id: result.id,
...requestData
;}
localStorage.setItem(
"contractorCurrentOrderId",
result.id
;)
localStorage.setItem(
"contractorCurrentOrder",
JSON.stringify(
contractorCurrentOrder
)
;)
alert(
المعدة
طلب
إرسال
تم "
". بنجاح
;)
contractorShowScreen(
"contractorCurrentOrdersScreen"
;)
await loadContractorCurrentOrders();
} catch (error) {
console.error(
"Contractor request error:",
error
;)
if (
{ )
error?.code ===
"permission-denied"
alert(
".Firebase قواعد
ليس "
من
تحقق
.الطلب
لإرسال
صلاحية
لديك
;)
} else {
alert(
ً
تعذر "
". حاليا
الطلب
إرسال
;)
}
} finally {
submitContractorRequestBtn.disabled =
false;
submitContractorRequestBtn.textContent =
إرسال "
;" المعدة
طلب
}
}
;)
}
========================================================= */
CANCEL NEW REQUEST
/* =========================================================
const cancelContractorRequestBtn =
document.getElementById(
"cancelContractorRequestBtn"
;)
if (cancelContractorRequestBtn) {
cancelContractorRequestBtn.addEventListener(
"click",
function () {
contractorShowScreen(
"contractorHomeScreen"
;)
}
;)
}
========================================================= */
LOAD CURRENT ORDERS
/* =========================================================
async function loadContractorCurrentOrders() {
const list =
document.getElementById(
"contractorCurrentOrdersList"
;)
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
جاري >p<
>p/<... الطلبات
تحميل
</div>
;`
try {
const requestsRef =
window.ma3daCollection(
window.ma3daDB,
"requests"
;)
const snapshot =
await window.ma3daGetDocs(
requestsRef
;)
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
(
requesterId === user.uid &&
role === "contractor" ||
data.contractorId === user.uid
)
{ )
const status =
data.status || "";
if (
{ )
status !== "completed" &&
status !== "cancelled" &&
status !== "rejected"
orders.push({
id: docSnap.id,
...data
;)}
}
}
}
;)
orders.sort(
(a, b) => {
const aTime =
a.createdAt?.seconds ||
;0
const bTime =
b.createdAt?.seconds ||
;0
return bTime - aTime;
}
;)
if (!orders.length) {
list.innerHTML = `
<div class="card">
لا >p<
>p/<. حالية
طلبات
توجد
</div>
;`
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
;)
list.innerHTML = `
<div class="card">
تعذر >p<
>p/<. الطلبات
تحميل
</div>
;`
}
}
========================================================= */
LOAD PREVIOUS ORDERS
/* =========================================================
async function loadContractorPreviousOrders() {
const list =
document.getElementById(
"contractorPreviousOrdersList"
;)
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
جاري >p<
>p/<... الطلبات
تحميل
</div>
;`
try {
const requestsRef =
window.ma3daCollection(
window.ma3daDB,
"requests"
;)
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
(
)
) {
requesterId === user.uid &&
role === "contractor" ||
data.contractorId === user.uid
const status =
data.status || "";
if (
) {
status === "completed" ||
status === "cancelled" ||
status === "rejected"
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
;0
const bTime =
b.createdAt?.seconds ||
;0
return bTime - aTime;
}
;)
if (!orders.length) {
list.innerHTML = `
<div class="card">
لا >p<
>p/<. سابقة
طلبات
توجد
</div>
;`
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
;)
list.innerHTML = `
<div class="card">
تعذر >p<
>p/<. السابقة
الطلبات
تحميل
</div>
;`
}
}
========================================================= */
ORDER CARD
/* =========================================================
function createContractorOrderCard(
order,
previous = false
{ )
const statusText =
getContractorStatusText(
order.status
;)
const price =
order.price
`ريا }order.price{$` ?
غير " :
;" محدد
return `
<div
class="card contractor-order-card"
data-contractor-order-id="${order.id}"
>
<h3>
})
</h3>
<p>
})
</p>
${escapeContractorHtml(
order.equipment || "-
"
${escapeContractorHtml(
order.location || "-
"
<p>
${escapeContractorHtml(
order.duration || "-
"
})
</p>
<p>
</p>
${price}
<p>
:الحالة
<strong>
${statusText}
</strong>
</p>
<button
type="button"
class="main-btn"
data-contractor-order-details="${order.id}"
>
التفاصيل
</button>
عرض
</div>
;`
}
========================================================= */
STATUS
/* =========================================================
function getContractorStatusText(
status
{ )
const statuses = {
searching:
جاري "
," معدة
عن
البحث
accepted:
تم "
," الطلب
قبول
arrived:
المعدة "
," وصلت
working:
العمل "
," جار
completed:
تم "
," العمل
إكمال
cancelled:
تم "
," الطلب
إلغاء
rejected:
تم "
"الطلب
رفض
;}
return (
statuses[status] ||
معالجة
"الطلب
جاري "
;)
}
========================================================= */
ORDER DETAILS
/* =========================================================
async function openContractorOrderDetails(
orderId
{ )
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
;)
const snapshot =
await window.ma3daGetDoc(
orderRef
;)
if (
!snapshot.exists()
{ )
alert(
الطلب "
". موجود
غير
;)
return;
}
const order =
snapshot.data();
const requesterId =
order.contractorId ||
order.requesterId ||
order.customerId;
if (
{ )
alert(
;)
requesterId !== user.uid
لا "
هذا
". الطلب
عرض
يمكنك
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
;)
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
`ريا }order.price{$` ?
;"-" :
}
contractorShowScreen(
"contractorOrderDetailsScreen"
;)
} catch (error) {
console.error(
"Contractor details error:",
error
;)
alert(
تعذر "
". الطلبتفاصيل
تحميل
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
جاري >p<
>p/<... المشاريع
تحميل
</div>
;`
try {
const requestsRef =
window.ma3daCollection(
window.ma3daDB,
"requests"
;)
const snapshot =
await window.ma3daGetDocs(
requestsRef
;)
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
(
requesterId === user.uid &&
data.requesterRole ===
"contractor" ||
data.requesterType ===
"contractor" ||
data.contractorId ===
user.uid
)
{ )
orders.push({
id: docSnap.id,
...data
;)}
}
}
;)
if (!orders.length) {
list.innerHTML = `
<div class="card">
لا >h3<
>h3/< مشاريع
توجد
<p>
. هنا
ستظهر
معدات
طلبات
إنشاء
عند
</p>
</div>
;`
return;
}
list.innerHTML =
orders
.map(
order => `
<div class="card">
<h3>
مشروع
</h3>
<p>
})
</p>
<p>
${escapeContractorHtml(
order.equipment || "-
"
${escapeContractorHtml(
order.location || "-
"
})
</p>
<p>
:الحالة
<strong>
${getContractorStatusText(
order.status
})
</strong>
</p>
<button
type="button"
class="main-btn"
data-contractor-order-details="${order.id}"
>
الطلب
</button>
عرض
</div>
`
)
.join("");
} catch (error) {
console.error(
"Contractor projects error:",
error
;)
list.innerHTML = `
<div class="card">
تعذر >p<
>p/<. المشاريع
تحميل
</div>
;`
}
}
========================================================= */
SETTINGS
/* =========================================================
const contractorSettingsBtn =
document.getElementById(
"contractorSettingsBtn"
;)
if (contractorSettingsBtn) {
contractorSettingsBtn.addEventListener(
"click",
async function () {
const profile =
contractorGetProfile();
if (profile) {
fillContractorProfile(
profile
;)
} else {
await loadContractorProfile();
}
contractorShowScreen(
"contractorSettingsScreen"
;)
}
;)
}
========================================================= */
SAVE SETTINGS
/* =========================================================
const saveContractorSettingsBtn =
document.getElementById(
"saveContractorSettingsBtn"
;)
if (saveContractorSettingsBtn) {
saveContractorSettingsBtn.addEventListener(
"click",
async function () {
const user =
getContractorUser();
if (!user) {
alert(
يجب "
". الدخول
تسجيل
;)
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
اكتب "
". الاسم
;)
return;
}
try {
saveContractorSettingsBtn.disabled =
true;
saveContractorSettingsBtn.textContent =
جاري "
;"... الحفظ
const data = {
uid: user.uid,
name: name,
phone: phone,
city: city,
company: company,
email:
role:
user.email || "",
"contractor",
updatedAt:
new Date()
;}
const contractorRef =
window.ma3daDoc(
window.ma3daDB,
"contractors",
user.uid
;)
await window.ma3daSetDoc(
contractorRef,
data,
{
merge: true
}
;)
contractorSaveLocal(
data
;)
fillContractorProfile(
data
;)
alert(
حفظ
تم "
". التعديلات
;)
} catch (error) {
console.error(
"Contractor settings error:",
error
;)
alert(
حفظ
تعذر "
". التعديلات
;)
} finally {
saveContractorSettingsBtn.disabled =
false;
saveContractorSettingsBtn.textContent =
حفظ "
;" التعديلات
}
}
;)
}
========================================================= */
SETTINGS BACK
/* =========================================================
const contractorSettingsBackBtn =
document.getElementById(
"contractorSettingsBackBtn"
;)
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
*/
الموجودة
المحادثة
شاشة
نستخدم
شاشة
.جديدة
إنشاء
من
بدلا ً
مِعدة
في
/*
if (
typeof showScreen ===
"function"
{ )
showScreen(
"chatScreen"
;)
} else {
contractorShowScreen(
"chatScreen"
;)
}
}
;)
}
========================================================= */
SUPPORT
/* =========================================================
const contractorSupportBtn =
document.getElementById(
"contractorSupportBtn"
;)
if (contractorSupportBtn) {
contractorSupportBtn.addEventListener(
"click",
function () {
contractorShowScreen(
"contractorSupportScreen"
;)
}
;)
}
const contractorSupportBackBtn =
document.getElementById(
"contractorSupportBackBtn"
;)
if (contractorSupportBackBtn) {
contractorSupportBackBtn.addEventListener(
"click",
function () {
contractorShowScreen(
"contractorHomeScreen"
;)
}
;)
}
const contractorSupportChatBtn =
document.getElementById(
"contractorSupportChatBtn"
;)
if (contractorSupportChatBtn) {
contractorSupportChatBtn.addEventListener(
"click",
function () {
*/
الموجودة
الشات
ً
.التطبيق
في
حاليا
شاشة
نفتح
/*
contractorShowScreen(
"chatScreen"
;)
}
;)
}
========================================================= */
CHANGE PASSWORD
/* =========================================================
const contractorChangePasswordBtn =
document.getElementById(
"contractorChangePasswordBtn"
;)
if (contractorChangePasswordBtn) {
contractorChangePasswordBtn.addEventListener(
"click",
function () {
*/
المرور
كلمة
تغيير
اشة ش
نستخدم
.التطبيقفي
أصلا ً
الموجودة
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
) {
) {
window.ma3daAuth &&
typeof window.ma3daAuth
.signOut === "function"
await window.ma3daAuth.signOut();
} else if (
typeof window.ma3daSignOut ===
"function"
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
;)
localStorage.removeItem(
"contractorProfile"
;)
contractorProfile = null;
contractorCurrentOrder = null;
contractorCurrentOrderId = null;
contractorShowScreen(
"roleScreen"
;)
} catch (error) {
console.error(
"Contractor logout error:",
error
;)
alert(
تعذر "
تسجيل
". الخروج
;)
}
}
;)
}
========================================================= */
HTML ESCAPE
/* =========================================================
function escapeContractorHtml(
value
{ )
return String(
value ?? ""
)
.replace(
/&/g,
"&amp;"
)
)
.replace(
/</g,
"&lt;"
.replace(
/>/g,
"&gt;"
)
)
.replace(
/"/g,
"&quot;"
.replace(
/'/g,
";#039&"
;)
}
========================================================= */
CONTRACTOR AUTO OPEN
/* =========================================================
async function contractorAutoOpen() {
const role =
localStorage.getItem(
"ma3daRole"
|| )
localStorage.getItem(
"userRole"
|| )
localStorage.getItem(
"currentRole"
;)
if (
{ )
}
role !== "contractor"
return;
const user =
getContractorUser();
if (!user) {
return;
}
*/
بالقوة
أخرى
المقاول
لوحة
شاشة
يعرض
التطبيق
.الدخول
تسجيل
أثناء
نفتح
لا
كان
إذا
/*
const activeScreen =
document.querySelector(
".screen.active"
;)
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
) {
)
window.ma3daFirebaseReady
Promise.resolve(
window.ma3daFirebaseReady
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
;)()}
========================================================= */
الرئيسية
الصفحة
من
الدعم
موظفي
صفحة
فتح
/* =========================================================
document.addEventListener("click", function(event){
const supportBtn =
event.target.closest("#supportRoleBtn");
if(!supportBtn)
return;
event.preventDefault();
openSupportScreen("supportLoginScreen");
;)}
