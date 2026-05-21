// --- إعدادات التحكم (التعديل هنا فقط) ---
// اجعلها false أثناء التجربة، و true عند النشر الفعلي
const enableTracking = true;
// ---------------------------------------

// استخراج اسم الصفحة الحالية تلقائياً
const pageName = window.location.pathname.split("/").pop().replace(".html", "") || "index";

// 1. جلب "نص الموضوع" (يعمل دائماً لتستطيع رؤية تعديلاتك)
fetch(`data/${pageName}.txt`)
    .then(response => response.text())
    .then(data => {
        const parts = data.split('*'); // التقسيم عند النجمة
        
        parts.forEach((content, index) => {
            // إذا كان index هو 0 يبحث عن text-container، وإذا كان 1 يبحث عن text-container-2 وهكذا
            let id = index === 0 ? 'text-container' : `text-container-${index + 1}`;
            let element = document.getElementById(id);
            
            if (element && content.trim() !== "") {
                element.innerText = content.trim();
            }
        });
    })
    .catch(error => console.log('خطأ في جلب الملف'));

// 2. كود الإحصائيات والعداد (يعمل فقط إذا كان الاختيار أعلاه true)
if (enableTracking) {
    // إحصائيات جوجل
    window.dataLayer = window.dataLayer || [];
    
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-PLR8YH05S2');
    
    // إعدادات Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyBnU74Im6--bbGVtxasiUxtL5RyK0VtgzY",
        authDomain: "da3wa-tracker.firebaseapp.com",
        databaseURL: "https://da3wa-tracker-default-rtdb.firebaseio.com",
        projectId: "da3wa-tracker",
        storageBucket: "da3wa-tracker.firebasestorage.app",
        messagingSenderId: "481503479391",
        appId: "1:481503479391:web:cb3d14a521f0626337fdea"
    };
    
    // بدء تشغيل Firebase (تأكد من عدم تكرار التشغيل)
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();
    
    // تحديث وعرض عداد المشاهدات
    const viewsRef = db.ref('views/' + pageName);
    viewsRef.transaction((currentValue) => {
        return (currentValue || 0) + 1;
    });
    
    viewsRef.on('value', (snapshot) => {
        const viewCountElement = document.getElementById('view-count');
        if (viewCountElement) {
            viewCountElement.innerText = snapshot.val() || 0;
        }
    });
} else {
    // ما يظهر في العداد أثناء وضع التجربة
    const viewCountElement = document.getElementById('view-count');
    if (viewCountElement) {
        viewCountElement.innerText = "وضع التجربة";
    }
    console.log("إحصائيات جوجل وعداد Firebase مجمّدان حالياً.");
}


//خااااص بالفوتر
let lastScrollTop = 0;
let isScrolling; // مؤقت لمراقبة توقف التمرير
const footer = document.querySelector('.main-footer');

window.addEventListener('scroll', function() {
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // حساب ما إذا كان المستخدم قد وصل لآخر الصفحة تماماً
    let windowHeight = window.innerHeight;
    let documentHeight = document.documentElement.scrollHeight;
    // إذا كان القارئ على بعد 40 بكسل أو أقل من النهاية الحقيقية
    let isAtBottom = (currentScroll + windowHeight) >= (documentHeight - 40);
    
    // 1. إذا وصلنا لآخر الصفحة تماماً، نثبت الفوتر ولا نخفيه أبداً
    if (isAtBottom) {
        footer.classList.add('footer-visible');
        window.clearTimeout(isScrolling); // إيقاف مؤقت الاختفاء
        return; // الخروج من الدالة للحفاظ على ثباته
    }
    
    // 2. أثناء التصفح: بمجرد النزول واستعراض أسفل الصفحة -> أظهر الفوتر فوراً
    if (currentScroll > lastScrollTop) {
        footer.classList.add('footer-visible');
    } else {
        // إذا رجع المستخدم لقمة الصفحة -> اخفِ الفوتر
        footer.classList.remove('footer-visible');
    }
    
    // 3. ذكاء التوقف: إلغاء المؤقت السابق طالما أن إصبعك يتحرك
    window.clearTimeout(isScrolling);
    
    // إذا توقفت عن السحب لمدة نصف ثانية، يختفي الفوتر تلقائياً ليوسع لك الشاشة
    isScrolling = setTimeout(function() {
        if (!isAtBottom) { // شرط ألا نكون في نهاية الصفحة
            footer.classList.remove('footer-visible');
        }
    }, 500);
    
    // تحديث قيمة التمرير
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});