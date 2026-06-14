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
        const parts = data.split('|'); // التقسيم عند النجمة
        
        parts.forEach((content, index) => {
            // إذا كان index هو 0 يبحث عن text-container، وإذا كان 1 يبحث عن text-container-2 وهكذا
            let id = index === 0 ? 'text-container' : `text-container-${index + 1}`;
            let element = document.getElementById(id);
            
            if (element && content.trim() !== "") {
                let processed = content.trim();
                processed = processed.replace(/[ \t]+/g, ' ');
                // 1. تحويل التظليل الأصفر ==
                processed = processed.replace(/==(.*?)==/g, '<mark>$1</mark>');
                // 2. تحويل الخط العريض ** الذي ينسخه تطبيقك تلقائياً
                processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // إزالة الأرقام من البداية (سنضيفها عبر CSS مثل g.html)
                // 3. تنسيق الآيات القرآنية
                processed = processed.replace(/(﴿[^﴾]+﴾)/g, '<span class="quran-text">$1</span>');
                // 4. تنسيق المراجع
                processed = processed.replace(/(\[\S+:\s*\d+\])/g, '<span class="quran-ref">$1</span>');
                // تنسيق الأحاديث بين القوسين
                processed = processed.replace(/\(([^)]+)\)(?=\s*\[)/g,
                    '</p><div class="hadith-box">($1)</div><p>');
                
                
                // 5. إزالة الأرقام من البداية (سنضيفها تلقائياً عبر CSS)
                processed = processed.replace(/^[ \t]*\d+[\.\-][ \t]*/gm, '');
                
                // 6. تحويل السطور إلى قائمة <ol><li>
                const lines = processed.split('\n').filter(line => line.trim() !== '');
                let html = '<ol>';
                lines.forEach(line => {
                    if (line.trim() !== '') {
                        html += '<li>' + line.trim() + '</li>';
                    }
                });
                html += '</ol>';
                
                element.innerHTML = html;
                
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



// 1. قائمة بصفحاتك العلمية الحالية (رتبها بحيث تكون الصفحة الجديدة دائماً هي الأخيرة في القائمة)
const myPublishedPages = [
    "azkar.html",
    "mu.html"
    // عندما تنشر صفحة جديدة مستقبلاً (مثلاً sr.html)، أضفها هنا في النهاية فقط لتصبح: "azkar.html", "sr.html"
];

// 2. السكربت يأخذ تلقائياً آخر اسم صفحة قمت بإضافتها في نهاية القائمة أعلاه
const latestAddedPage = myPublishedPages[myPublishedPages.length - 1];

if (latestAddedPage) {
    // السكربت يدخل إلى الصفحة الأخيرة خلف الكواليس ويجلب بياناتها حية
    fetch(latestAddedPage)
        .then(response => response.text())
        .then(htmlText => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            
            // سحب العنوان والوصف الأصليين من داخل ملف الصفحة الجديد تلقائياً
            const pageTitle = doc.querySelector('title')?.innerText || 'مادة علمية جديدة';
            const pageDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                'اضغط لتصفح المادة العلمية الجديدة فوراً.';
            
            // حقن الكرت الفاخر في الواجهة الرئيسية
            const container = document.getElementById('latest-publication-container');
            if (container) {
                container.innerHTML = `
                    <section class="premium-block latest-post-block">
                      <div class="block-decoration animated-gradient"></div>
                      <div class="block-body">
                        <div>
                          <span class="block-label latest-label">✨ نُشر حديثاً</span>
                          <h3>${pageTitle}</h3>
                          <p>${pageDesc}</p>
                        </div>
                        <a href="${latestAddedPage}" class="block-action-btn latest-btn">اقرأ المادة العلمية الآن <i>←</i></a>
                      </div>
                    </section>
                `;
            }
        })
        .catch(error => console.log('تعذر جلب بيانات آخر صفحة مضافة'));
}