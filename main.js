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
// =======================================================
// 3. كود التحديث التلقائي لروابط معاينة الصور في الـ Meta
// =======================================================
function updateOGImage() {
    // 1. جلب النص الحالي المكتوب في بطاقة العنوان (ديف العبارة الأساسية)
    const cardTitleElement = document.querySelector('.card-title');
    
    if (cardTitleElement) {
        const currentCardText = cardTitleElement.innerText;
        
        // 2. تحويل النص إلى صيغة ويب آمنة للروابط (تتعامل مع المسافات واللغة العربية)
        const cleanText = encodeURIComponent(currentCardText);
        
        // 3. رابط التوليد التلقائي لـ Vercel بالاعتماد على العبارة الحالية
        const dynamicVercelUrl = `https://og-image.vercel.app/${cleanText}.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-white.svg`;
        
        // 4. تحديث أوسمة الـ meta في الـ HTML بالروابط الجديدة ديناميكياً
        const ogImageTag = document.getElementById('og-image');
        const twitterImageTag = document.getElementById('twitter-image');
        
        if (ogImageTag && twitterImageTag) {
            ogImageTag.setAttribute('content', dynamicVercelUrl);
            twitterImageTag.setAttribute('content', dynamicVercelUrl);
            console.log("تم تحديث روابط معاينة الصور بنجاح للنص: " + currentCardText);
        }
    }
}

// تشغيل الدالة تلقائياً بعد ثانية واحدة لضمان جلب النص من ملف الـ txt أولاً
setTimeout(updateOGImage, 1000);
