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

// تهيئة Firebase (باسم مختلف لعدم التعارض)
const commentsApp = firebase.initializeApp(commentsConfig, "CommentsApp");
const commentsDb = firebase.firestore(commentsApp);

// ==========================================
// دالة إنشاء نموذج التعليقات
// ==========================================

function createCommentsBox() {
    const container = document.getElementById('comments-box');
    if (!container) return;

    // الحصول على اسم الصفحة الحالية
    const pageName = window.location.pathname.split('/').pop() || 'home';

    container.innerHTML = `
        <div class="comments-container">
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

    // تحميل التعليقات
    loadComments(pageName);
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
        likes: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        // تفريغ الحقول
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
    
    commentsDb.collection('comments')
        .where('page', '==', pageName)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            commentsList.innerHTML = '';
            
            if (snapshot.empty) {
                commentsList.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">لا توجد تعليقات بعد. كن أول من يعلق!</p>';
                return;
            }
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const commentId = doc.id;
                
                const commentElement = createCommentElement(commentId, data);
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
    
    const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ar-SA') : '';
    
    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-name">${escapeHtml(data.name)}</span>
            <span class="comment-date">${date}</span>
        </div>
        <p class="comment-text">${escapeHtml(data.text)}</p>
        <div class="comment-actions">
            <button onclick="likeComment('${id}', ${data.likes})" class="like-btn">
                ❤️ <span class="like-count">${data.likes || 0}</span>
            </button>
        </div>
    `;
    
    return div;
}

// ==========================================
// دالة الإعجاب بالتعليق
// ==========================================

function likeComment(id, currentLikes) {
    // التحقق مما إذا كان المستخدم قد أعجب بالفعل (باستخدام localStorage)
    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
    
    if (likedComments.includes(id)) {
        alert('لقد أعجبت بهذا التعليق بالفعل');
        return;
    }
    
    commentsDb.collection('comments').doc(id).update({
        likes: (currentLikes || 0) + 1
    }).then(() => {
        // حفظ أن المستخدم أعجب بهذا التعليق
        likedComments.push(id);
        localStorage.setItem('likedComments', JSON.stringify(likedComments));
    }).catch(error => {
        console.error('Error liking comment:', error);
    });
}

// ==========================================
// دالة حماية النصوص (XSS Protection)
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

