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
                processed = processed.replace(/^\s*-[ ]?/gm, '<span class="custom-bullet">●</span> ');
                processed = processed.replace(/^\s*(\d+)[\.-][ ]?/gm, '<span class="custom-number">$1 .</span>  ');
                
                // تشغيل التنسيقات داخل الصفحة بدلاً من innerText القديمة
                element.innerHTML = processed;
                
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

//خاص بالفووووتر
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


// دالة ذكية تقرأ مجلد الموقع على Vercel وتكتشف أحدث ملف HTML تم رفعه تلقائياً
fetch('./')
    .then(response => response.text())
    .then(htmlListing => {
        // إنشاء عنصر وهمي لقراءة الروابط المتاحة في المجلد
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlListing, 'text/html');
        
        // جمع كل روابط ملفات الـ HTML الموجودة في الموقع (باستثناء الرئيسية والأذكار والستايل)
        const links = Array.from(doc.querySelectorAll('a'))
            .map(a => a.getAttribute('href'))
            .filter(href => href && href.endsWith('.html') && href !== 'index.html' && href !== 'mu.html' && href !== 'azkar.html');

        // إذا وجد السكربت ملفات علمية منشورة في المجلد
        if (links.length > 0) {
            // تلقائياً: آخر ملف في القائمة هو أحدث ملف قمت بنشره ورفعه
            const latestPage = links[links.length - 1];

            // الآن ندخل إلى هذا الملف الجديد خلف الكواليس لنأخذ بياناته
            fetch(latestPage)
                .then(res => res.text())
                .then(pageHtml => {
                    const pageDoc = parser.parseFromString(pageHtml, 'text/html');
                    
                    // قراءة العنوان والوصف من داخل ملفك الجديد تلقائياً
                    const pageTitle = pageDoc.querySelector('title')?.innerText || 'مادة علمية جديدة';
                    const pageDesc = pageDoc.querySelector('meta[property="og:description"]')?.getAttribute('content') 
                                  || 'اضغط لتصفح المادة العلمية الجديدة فوراً.';
                    
                    // حقن كرت النشر الفاخر في الواجهة الرئيسية تلقائياً
                    const container = document.getElementById('latest-publication-container');
                    if (container) {
                        container.innerHTML = `
                            <section class="premium-block latest-post-block">
                              <div class="block-decoration animated-gradient"></div>
                              <div class="block-body">
                                <div>
                                  <span class="block-label latest-label">✨ نُشر حديثاً تلقائياً</span>
                                  <h3>${pageTitle}</h3>
                                  <p>${pageDesc}</p>
                                </div>
                                <a href="${latestPage}" class="block-action-btn latest-btn">اقرأ المادة العلمية الآن <i>←</i></a>
                              </div>
                            </section>
                        `;
                    }
                });
        }
    })
    .catch(error => console.log('سيرفر Vercel مجمّد أو لا يدعم قراءة المجلدات حالياً'));
