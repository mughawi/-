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


//7777777777777777

async function loadMetaFromCurrentPageFile() {
    try {
        // 1. معرفة اسم الصفحة الحالية تلقائياً (مثلاً h أو h2)
        const path = window.location.pathname;
        const pageName = path.substring(path.lastIndexOf('/') + 1).replace('.html', '') || 'index';
        
        // 2. فتح الملف النصي الخاص بهذه الصفحة تلقائياً (مثلاً h.txt أو h2.txt)
        const response = await fetch(`${pageName}.txt`);
        if (!response.ok) return; // إذا لم يجد ملف نصي يتوقف لحماية الموقع
        
        const text = await response.text();
        
        // 3. تقسيم الملف إلى أسطر
        const lines = text.split('\n');
        
        // أخذ السطر الأول كعنوان، والسطر الثاني كوصف للمعاينة
        const fileTitle = lines[0] ? lines[0].trim() : "";
        const fileDesc = lines[1] ? lines[1].trim() : "";

        // 4. حقن العنوان والوصف في أوسمة الميتا فوراً
        if (fileTitle) {
            document.title = fileTitle;
            const ogTitle = document.querySelector('meta[property="og:title"]');
            const twTitle = document.querySelector('meta[name="twitter:title"]');
            if (ogTitle) ogTitle.setAttribute('content', fileTitle);
            if (twTitle) twTitle.setAttribute('content', fileTitle);
        }

        if (fileDesc) {
            const ogDesc = document.querySelector('meta[property="og:description"]');
            const twDesc = document.querySelector('meta[name="twitter:description"]');
            if (ogDesc) ogDesc.setAttribute('content', fileDesc);
            if (twDesc) twDesc.setAttribute('content', fileDesc);
        }
        
        console.log(`تم تحديث معاينة الميتا تلقائياً من ملف: ${pageName}.txt`);
    } catch (error) {
        console.log("خطأ في جلب الميتا التلقائية:", error);
    }
}

// تشغيل الدالة فوراً عند تحميل الصفحة
loadMetaFromCurrentPageFile();
