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

const commentsApp = firebase.initializeApp(commentsConfig, "CommentsApp");
const commentsDb = firebase.firestore(commentsApp);

// ==========================================
// تتبع حالة الإعجاب في الذاكرة
// ==========================================
let hasLiked = {};

// ==========================================
// نظام الأدمن
// ==========================================

let isAdmin = false;
const ADMIN_PASSWORD_HASH = 'a36d22c73d208f6f041e15bb2959ab6f834b5ccf632bbf6a4ad8fffbadba9386';

function checkAdmin() {
    const savedAdmin = localStorage.getItem('isAdmin');
    if (savedAdmin === 'true') {
        isAdmin = true;
    }
}

async function loginAdmin() {
    const password = prompt('🔐 أدخل كلمة مرور الأدمن:');
    if (password === null) return;
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (hashHex === ADMIN_PASSWORD_HASH) {
        isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
        alert('✅ تم تسجيل الدخول كأدمن بنجاح');
        history.replaceState(null, null, window.location.pathname);
        location.reload();
    } else {
        alert('❌ كلمة المرور خاطئة');
    }
}

function logoutAdmin() {
    isAdmin = false;
    localStorage.removeItem('isAdmin');
    alert('✅ تم تسجيل الخروج');
    location.reload();
}

function addAdminButton() {
    if (!isAdmin) return;
    
    const container = document.getElementById('comments-box');
    if (!container) return;
    
    const adminDiv = document.createElement('div');
    adminDiv.style.cssText = 'text-align: left; margin-bottom: 10px;';
    
    adminDiv.innerHTML = `
        <button onclick="logoutAdmin()" style="
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid rgba(255, 0, 0, 0.4);
            color: #ff6666;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85rem;
            font-family: 'Tahoma', sans-serif;
        ">خروج أدمن 🔓</button>
    `;
    
    container.insertBefore(adminDiv, container.firstChild);
}

// ==========================================
// دالة إنشاء صندوق التعليقات
// ==========================================

function createCommentsBox() {
    const container = document.getElementById('comments-box');
    if (!container) return;
    
    const pageName = window.location.pathname.split('/').pop() || 'home';
    
    container.innerHTML = `
        <div class="comments-container">
            <div class="page-like-section">
                <button onclick="likePage()" id="page-like-btn" class="page-like-btn">
                    <span id="page-like-icon" class="like-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 11V20H4C3.45 20 3 19.55 3 19V12C3 11.45 3.45 11 4 11H7ZM14 9V5C14 3.9 13.1 3 12 3L6.5 9.12C6.19 9.46 6 9.91 6 10.4V18C6 19.1 6.9 20 8 20H17.21C17.95 20 18.6 19.51 18.81 18.8L20.81 11.8C20.93 11.38 20.99 10.93 20.99 10.48C21 9.66 20.34 9 19.52 9H14Z"/>
                        </svg>
                    </span>
                    <span id="page-like-count" class="like-count">0</span>
                    <span>إعجاب</span>
                </button>
            </div>
            
            <h3>💬 التعليقات</h3>
            
            <div class="comment-form">
                <input type="text" id="comment-name" placeholder="الاسم" class="comment-input">
                <textarea id="comment-text" placeholder="اكتب تعليقك..." class="comment-textarea"></textarea>
                <button onclick="addComment()" class="submit-btn">إرسال التعليق</button>
            </div>

            <div id="comments-list" class="comments-list"></div>
        </div>
    `;
    
    checkAdmin();
    addAdminButton();
    loadPageLikes(pageName);
    loadComments(pageName);
}

// ==========================================
// دالة توليد معرف فريد للجهاز
// ==========================================
function getDeviceId() {
    let deviceId = null;
    
    try {
        deviceId = localStorage.getItem('device_id');
    } catch (e) {
        console.warn('localStorage غير متاح');
    }
    
    if (!deviceId) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'device_id') {
                deviceId = value;
                break;
            }
        }
    }
    
    if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        
        try {
            localStorage.setItem('device_id', deviceId);
        } catch (e) {
            console.warn('فشل حفظ في localStorage');
        }
        
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        document.cookie = `device_id=${deviceId}; expires=${expiryDate.toUTCString()}; path=/`;
    }
    
    return deviceId;
}

// ==========================================
// دالة إعجاب الصفحة
// ==========================================
function likePage() {
    const pageName = window.location.pathname.split('/').pop() || 'home';
    const deviceId = getDeviceId();
    
    const btn = document.getElementById('page-like-btn');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.8';
        btn.style.cursor = 'not-allowed';
        btn.onclick = null;
    }
    
    commentsDb.collection('page_likes')
        .where('page', '==', pageName)
        .where('deviceId', '==', deviceId)
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                hasLiked[pageName] = true;
                alert('لقد أعجبت بهذه الصفحة بالفعل 🤙️');
                
                if (btn) {
                    btn.disabled = true;
                    btn.style.opacity = '0.8';
                    btn.style.cursor = 'not-allowed';
                }
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
                
                commentsDb.collection('page_likes').add({
                    page: pageName,
                    deviceId: deviceId,
                    likedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                hasLiked[pageName] = true;
                
                const iconElement = document.getElementById('page-like-icon');
                if (iconElement) {
                    iconElement.classList.add('liked');
                }
            });
        })
        .catch(error => {
            console.error('Error checking like status:', error);
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.onclick = likePage;
            }
        });
}

// ==========================================
// دالة تحميل إعجابات الصفحة
// ==========================================
function loadPageLikes(pageName) {
    const deviceId = getDeviceId();
    
    commentsDb.collection('pages').doc(pageName).onSnapshot(doc => {
        const countElement = document.getElementById('page-like-count');
        
        if (countElement) {
            if (doc.exists) {
                countElement.textContent = doc.data().likes || 0;
            } else {
                countElement.textContent = '0';
            }
        }
    });
    
    commentsDb.collection('page_likes')
        .where('page', '==', pageName)
        .where('deviceId', '==', deviceId)
        .get()
        .then(snapshot => {
            const iconElement = document.getElementById('page-like-icon');
            const btn = document.getElementById('page-like-btn');
            
            if (!snapshot.empty) {
                hasLiked[pageName] = true;
                
                if (iconElement) {
                    iconElement.classList.add('liked');
                }
                
                if (btn) {
                    btn.disabled = true;
                    btn.style.opacity = '0.8';
                    btn.style.cursor = 'not-allowed';
                    btn.onclick = null;
                }
            }
        })
        .catch(error => {
            console.error('Error loading like status:', error);
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
    
    const deleteButton = isAdmin ? `
        <button onclick="deleteComment('${id}')" style="
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid rgba(255, 0, 0, 0.4);
            color: #ff6666;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            float: left;
            margin-top: 10px;
            font-family: 'Tahoma', sans-serif;
        ">🗑️ حذف</button>
    ` : '';
    
    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-name">${escapeHtml(data.name)}</span>
            <span class="comment-date">${date}</span>
        </div>
        <p class="comment-text">${escapeHtml(data.text)}</p>
        ${deleteButton}
        <div style="clear: both;"></div>
    `;
    
    return div;
}

// ==========================================
// دالة حذف التعليق
// ==========================================

function deleteComment(commentId) {
    if (!isAdmin) {
        alert('يجب تسجيل الدخول كأدمن أولاً');
        return;
    }
    
    if (confirm('هل أنت متأكد من حذف هذا التعليق نهائياً؟')) {
        commentsDb.collection('comments').doc(commentId).delete()
            .then(() => {})
            .catch(error => {
                console.error('Error deleting comment:', error);
                alert('حدث خطأ أثناء الحذف');
            });
    }
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
// دخول الأدمن عبر رابط سري
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#admin') {
        checkAdmin();
        
        if (!isAdmin) {
            setTimeout(() => {
                loginAdmin();
            }, 500);
        }
    }
});

// ==========================================
// تشغيل عند تحميل الصفحة
// ==========================================

document.addEventListener('DOMContentLoaded', createCommentsBox);

