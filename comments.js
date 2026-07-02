// ==========================================
// إعدادات Firebase - مشروع التعليقات
// ==========================================

const commentsConfig = {
    apiKey: "AIzaSyD-DCcTkkfRYqCwTlHmSAof8zddcH4ebLw",
    authDomain: "comments-app-2bef3.firebaseapp.com",
    projectId: "comments-app-2bef3",
    storageBucket: "comments-app-2bef3.firebasestorage.app",
    messagingSenderId: "663756299662",
    appId: "1:663756299662:web:4d5c47bb9df937fc13d8df"
};

// تهيئة Firebase بشكل منفصل تماماً
const commentsApp = firebase.initializeApp(commentsConfig, "CommentsApp");
const commentsDb = firebase.firestore(commentsApp);

// ==========================================
// دالة إنشاء صندوق التعليقات
// ==========================================

function createCommentsBox() {
    const container = document.getElementById('comments-box');
    if (!container) return;

    const pageName = window.location.pathname.split('/').pop() || 'home';

    container.innerHTML = `
        <div class="comments-container">
            <!-- زر إعجاب الصفحة -->
            <div class="page-like-section">
                <button onclick="likePage()" id="page-like-btn" class="page-like-btn">
                    <span id="page-like-icon">🤍</span>
                    <span id="page-like-count" class="like-count">0</span>
                    <span>إعجاب</span>
                </button>
            </div>
            
            <h3>💬 التعليقات</h3>
            
            <!-- نموذج إضافة تعليق -->
            <div class="comment-form">
                <input type="text" id="comment-name" placeholder="الاسم" class="comment-input">
                <textarea id="comment-text" placeholder="اكتب تعليقك..." class="comment-textarea"></textarea>
                <button onclick="addComment()" class="submit-btn">إرسال التعليق</button>
            </div>

            <!-- قائمة التعليقات -->
            <div id="comments-list" class="comments-list"></div>
        </div>
    `;

    // تحميل إعجابات الصفحة
    loadPageLikes(pageName);
    
    // تحميل التعليقات
    loadComments(pageName);
}

// ==========================================
// دالة إعجاب الصفحة
// ==========================================

function likePage() {
    const pageName = window.location.pathname.split('/').pop() || 'home';
    const likedPages = JSON.parse(localStorage.getItem('likedPages') || '[]');
    
    if (likedPages.includes(pageName)) {
        alert('لقد أعجبت بهذه الصفحة بالفعل');
        return;
    }
    
    commentsDb.collection('pages').doc(pageName).get().then(doc => {
        if (doc.exists) {
            const currentLikes = doc.data().likes || 0;
            commentsDb.collection('pages').doc(pageName).update({
                likes: currentLikes + 1
            });
        } else {
            commentsDb.collection('pages').doc(pageName).set({
                page: pageName,
                likes: 1
            });
        }
        
        // حفظ في localStorage
        likedPages.push(pageName);
        localStorage.setItem('likedPages', JSON.stringify(likedPages));
        
        // تحديث الزر
        document.getElementById('page-like-icon').textContent = '❤️';
        const btn = document.getElementById('page-like-btn');
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }).catch(error => {
        console.error('Error liking page:', error);
    });
}

// ==========================================
// دالة تحميل إعجابات الصفحة
// ==========================================

function loadPageLikes(pageName) {
    commentsDb.collection('pages').doc(pageName).onSnapshot(doc => {
        const countElement = document.getElementById('page-like-count');
        const iconElement = document.getElementById('page-like-icon');
        const btn = document.getElementById('page-like-btn');
        
        if (!countElement || !iconElement || !btn) return;
        
        if (doc.exists) {
            const likes = doc.data().likes || 0;
            countElement.textContent = likes;
        } else {
            countElement.textContent = '0';
        }
        
        // التحقق إذا كان المستخدم قد أعجب بالفعل
        const likedPages = JSON.parse(localStorage.getItem('likedPages') || '[]');
        if (likedPages.includes(pageName)) {
            iconElement.textContent = '❤️';
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    });
}

// ==========================================
// دالة إضافة تعليق
// ==========================================

function addComment() {
    const nameInput = document.getElementById('comment-name');
    const textInput = document.getElementById('comment-text');
    
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    
    if (!name || !text) {
        alert('الرجاء ملء الاسم والتعليق');
        return;
    }

    const pageName = window.location.pathname.split('/').pop() || 'home';

    commentsDb.collection('comments').add({
        page: pageName,
        name: name,
        text: text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        nameInput.value = '';
        textInput.value = '';
    }).catch((error) => {
        console.error('Error adding comment:', error);
        alert('حدث خطأ، حاول مرة أخرى');
    });
}

// ==========================================
// دالة تحميل التعليقات
// ==========================================

function loadComments(pageName) {
    const commentsList = document.getElementById('comments-list');
    
    if (!commentsList) return;
    
    commentsDb.collection('comments')
        .where('page', '==', pageName)
        .onSnapshot(snapshot => {
            commentsList.innerHTML = '';
            
            if (snapshot.empty) {
                commentsList.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">لا توجد تعليقات بعد. كن أول من يعلق!</p>';
                return;
            }
            
            const comments = [];
            snapshot.forEach(doc => {
                comments.push({ id: doc.id, ...doc.data() });
            });
            
            comments.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });
            
            comments.forEach(comment => {
                const commentElement = createCommentElement(comment.id, comment);
                commentsList.appendChild(commentElement);
            });
        }, error => {
            console.error('Error loading comments:', error);
            commentsList.innerHTML = '<p style="text-align: center; color: #ff0000;">حدث خطأ في تحميل التعليقات</p>';
        });
}

// ==========================================
// دالة إنشاء عنصر التعليق
// ==========================================

function createCommentElement(id, data) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    
    const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    
    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-name">${escapeHtml(data.name)}</span>
            <span class="comment-date">${date}</span>
        </div>
        <p class="comment-text">${escapeHtml(data.text)}</p>
    `;
    
    return div;
}

// ==========================================
// دالة حماية النصوص
// ==========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// تشغيل عند تحميل الصفحة
// ==========================================

document.addEventListener('DOMContentLoaded', createCommentsBox);

