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
                processed = processed.replace(/^###\s+(.*)/gm, '<h3>$1</h3>');
                processed = processed.replace(/^##\s+(.*)/gm, '<h2>$1</h2>');
                processed = processed.replace(/^#\s+(.*)/gm, '<h1>$1</h1>');
                processed = processed.replace(/^[ \t]*-[ \t]*/gm, '<span class="manual-bullet">● </span>');
                // تنسيق الأرقام اليدوية (1. 2. 3.)
                processed = processed.replace(/^(\d+[\.\-]\s*)/gm, '<span class="manual-number">$1</span>');
                // 1. تحويل التظليل الأصفر ==
                processed = processed.replace(/==(.*?)==/g, '<mark>$1</mark>');
                // 2. تحويل الخط العريض ** الذي ينسخه تطبيقك تلقائياً
                processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // 3. تنسيق الآيات القرآنية
                processed = processed.replace(/(﴿[^﴾]+﴾)/g, '<span class="quran-text">$1</span>');
                // 4. تنسيق المراجع
                processed = processed.replace(/(\[[^\]]+\])/g, '<span class="quran-ref">$1</span>');
                // تنسيق مراجع الأحاديث
                processed = processed.replace(/(\[(?:متفق عليه|رواه .+?|صحيح .+?|ضعيف .+?)\])/g, '<span class="quran-ref">$1</span>');
                // تنسيق الأحاديث بين القوسين (نسخة واحدة تغطي كل الحالات)
                processed = processed.replace(/\(([^)]+?)\)/g, '<div class="hadith-box">($1)</div>');
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
    "asl.html"
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
                          <span class="latest-subtext">📌 كل جديد يُنشر سيظهر هنا</span>
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
//*****************الازرار المشاركة 

// ========================================
// إنشاء الأزرار العائمة تلقائياً
// ========================================
function createFloatingButtons() {
    const container = document.createElement('div');
    container.className = 'floating-buttons';
    
    // زر العودة
    const backBtn = document.createElement('a');
    backBtn.href = 'index.html';
    backBtn.className = 'float-btn back-btn';
    backBtn.innerHTML = '🏠';
    
    // زر المشاركة مع النص
    const shareWrapper = document.createElement('div');
    shareWrapper.className = 'share-wrapper';
    
    const shareBtn = document.createElement('button');
    shareBtn.className = 'float-btn share-btn';
    shareBtn.innerHTML = '📤';
    shareBtn.onclick = sharePage;
    
    const shareText = document.createElement('span');
    shareText.className = 'share-text';
    shareText.textContent = 'شارك';
    
    shareWrapper.appendChild(shareBtn);
    shareWrapper.appendChild(shareText);
    
    container.appendChild(backBtn);
    container.appendChild(shareWrapper);
    document.body.appendChild(container);
}
// ========================================
// دالة المشاركة
// ========================================
function sharePage() {
    const url = window.location.href;
    
    if (navigator.share) {
        // نرسل الرابط فقط - واتساب سيقرأ الميتا تاج تلقائياً
        navigator.share({
            url: url
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showToast('✅ تم نسخ الرابط!');
        });
    }
}

// ========================================
// إشعار جميل
// ========================================
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ========================================
// تشغيل الأزرار عند تحميل الصفحة
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // تأخير بسيط لضمان تحميل الصفحة
    setTimeout(createFloatingButtons, 500);
});

// ========================================
// 📚 القائمة الجانبية - بسيطة جداً
// ========================================

function createSidebarMenu() {
    // تظهر فقط في الرئيسية
    if (!window.location.pathname.endsWith('index.html') &&
        window.location.pathname !== '/' &&
        window.location.pathname !== '') {
        return;
    }
    
    // قائمة الصفحات (أضف صفحاتك هنا)
    const pages = [
        { href: 'h.html', title: 'غير نفسك' },
        { href: 'mu.html', title: 'أهل السنة والجماعة' },
        { href: 'makah.html', title: 'محاسبة النفس' },
        { href: 'kl.html', title: 'الكلمة الطيبة' },
        { href: 'asl.html', title: 'نواقض الإسلام' }
    ];
    
    // إنشاء القائمة
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar-menu';
    
    let html = '<button class="sidebar-toggle" onclick="this.parentElement.classList.toggle(\'active\')">📚</button>';
    html += '<div class="sidebar-list"><h4>📖 جميع المنشورات</h4>';
    
    pages.forEach(page => {
        html += `<a href="${page.href}" class="sidebar-item">${page.title}</a>`;
    });
    
    html += '</div>';
    sidebar.innerHTML = html;
    document.body.appendChild(sidebar);
}

// تشغيل
document.addEventListener('DOMContentLoaded', createSidebarMenu);