/* ════════════════════════════════════════════════════════════════
   AUTH SYSTEM: Registration, Login, Logout & User Management
   ════════════════════════════════════════════════════════════════ */

class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
    this.storageKey = 'aihealth_user';
    this.init();
  }

  init() {
    if (this.currentUser) {
      this.applyAuthUI();
    } else {
      this.showLoginPrompt();
    }
  }

  // ══════════ تسجيل مستخدم جديد ══════════
  register(name, email, org, role) {
    if (!this.validateEmail(email)) {
      return { success: false, error: 'البريد الإلكتروني غير صالح' };
    }

    const user = {
      id: 'usr_' + Date.now(),
      name,
      email,
      org,
      role,
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      progress: 0,
      xp: 0,
      level: 1,
      streak: 0,
      rank: '—',
      modulesCompleted: [],
      lessonsCompleted: [],
      quizScores: {},
      capstoneStatus: 'not_started',
    };

    this.currentUser = user;
    this.saveUser(user);
    this.applyAuthUI();
    this.showNotif(`🎉 مرحباً ${name}! تم تسجيلك بنجاح`);
    return { success: true, user };
  }

  // ══════════ تسجيل دخول ══════════
  login(email, password) {
    // في تطبيق حقيقي: تحقق من السيرفر
    // هنا نحاكي: البحث عن مستخدم بـ email في localStorage
    const users = JSON.parse(localStorage.getItem('aihealth_users') || '{}');
    const user = Object.values(users).find(u => u.email === email);

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    this.currentUser = user;
    user.lastLogin = new Date().toISOString();
    this.saveUser(user);
    this.applyAuthUI();
    this.showNotif(`👋 أهلاً ${user.name}!`);
    closeLoginModal();
    return { success: true, user };
  }

  // ══════════ تسجيل خروج ══════════
  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
    this.showLoginPrompt();
    this.showNotif('👋 تم تسجيل الخروج');
    location.href = '#dashboard';
  }

  // ══════════ الحفظ والتحميل ══════════
  saveUser(user) {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    // احفظ أيضاً في قائمة جميع المستخدمين
    const users = JSON.parse(localStorage.getItem('aihealth_users') || '{}');
    users[user.id] = user;
    localStorage.setItem('aihealth_users', JSON.stringify(users));
  }

  loadUser() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }

  updateUserProgress(moduleId, lessonId, completed = true) {
    if (!this.currentUser) return;
    
    if (!this.currentUser.modulesCompleted.includes(moduleId)) {
      this.currentUser.modulesCompleted.push(moduleId);
    }
    if (lessonId && !this.currentUser.lessonsCompleted.includes(lessonId)) {
      this.currentUser.lessonsCompleted.push(lessonId);
    }

    // احسب التقدم الكلي (نسبة مئوية)
    const totalLessons = MODULES.reduce((acc, m) => acc + m.lessons.length, 0);
    this.currentUser.progress = Math.round(
      (this.currentUser.lessonsCompleted.length / totalLessons) * 100
    );
    this.saveUser(this.currentUser);
  }

  updateXP(xpAmount) {
    if (!this.currentUser) return;
    this.currentUser.xp += xpAmount;
    // كل 500 نقطة = مستوى جديد
    this.currentUser.level = Math.floor(this.currentUser.xp / 500) + 1;
    this.saveUser(this.currentUser);
    updateUserDisplay();
  }

  // ══════════ عرض الواجهة بناءً على الحالة ══════════
  applyAuthUI() {
    const user = this.currentUser;
    if (!user) return;

    // تحديث رأس الصفحة
    document.querySelector('.user-avatar').textContent = user.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    document.querySelector('.logo-text span').textContent = user.name;
    document.getElementById('xp-display').textContent = user.xp.toLocaleString('ar-EG');
    document.querySelector('.level-badge').textContent = `🎖️ المستوى ${user.level}`;

    // تحديث شريط التقدم
    document.getElementById('progress-pct').textContent = `${user.progress}%`;
    document.querySelector('.progress-bar-fill').style.width = `${user.progress}%`;

    // إظهار/إخفاء الأزرار
    document.querySelector('.btn-register').style.display = 'none';
    this.addLogoutButton();

    // تحديث لوحة البيانات
    this.updateDashboardForUser();
  }

  showLoginPrompt() {
    // إذا لم يكن هناك مستخدم، اعرض نموذج تسجيل تلقائياً
    document.querySelector('.btn-register').style.display = 'inline-block';
  }

  addLogoutButton() {
    let logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) return;

    const btn = document.createElement('button');
    btn.id = 'logout-btn';
    btn.className = 'btn btn-outline';
    btn.innerHTML = '🚪 تسجيل خروج';
    btn.style.marginLeft = '12px';
    btn.onclick = () => authManager.logout();

    const topbarRight = document.querySelector('.topbar-right');
    topbarRight.insertBefore(btn, topbarRight.lastChild);
  }

  updateDashboardForUser() {
    const user = this.currentUser;
    if (!user) return;

    // تحديث الترحيب
    document.querySelector('.greeting-title').innerHTML = `${user.name.split(' ')[0]} <span>${user.name.split(' ').slice(1).join(' ')}</span>`;
    document.querySelector('.greeting-sub').textContent = `${user.role} • ${user.org || 'بدون جهة'}`;

    // تحديث إحصائيات البطاقات
    const statsCards = document.querySelectorAll('.stat-card');
    if (statsCards[0]) statsCards[0].innerHTML = `<div class="stat-icon">📚</div><div class="stat-value">${user.modulesCompleted.length}/10</div><div class="stat-label">وحدات مكتملة</div>`;
    if (statsCards[1]) statsCards[1].innerHTML = `<div class="stat-icon">⏱️</div><div class="stat-value">${(user.lessonsCompleted.length * 1.5).toFixed(1)}</div><div class="stat-label">ساعة من أصل 80</div>`;
    if (statsCards[3]) statsCards[3].innerHTML = `<div class="stat-icon">🎯</div><div class="stat-value">${user.quizAverage || 0}%</div><div class="stat-label">متوسط الاختبارات</div>`;

    // تحديث صفحة التقدم
    this.updateProgressPage();
  }

  updateProgressPage() {
    const user = this.currentUser;
    if (!user) return;

    const bigStats = document.querySelectorAll('.big-stat');
    if (bigStats[0]) bigStats[0].innerHTML = `<div class="big-stat-num">${user.progress}%</div><div class="big-stat-label">الإنجاز الكلي</div>`;
    if (bigStats[1]) bigStats[1].innerHTML = `<div class="big-stat-num">${user.xp.toLocaleString('ar-EG')}</div><div class="big-stat-label">نقاط XP</div>`;
    if (bigStats[2]) bigStats[2].innerHTML = `<div class="big-stat-num">🔥 ${user.streak}</div><div class="big-stat-label">أيام متتالية</div>`;
    if (bigStats[3]) bigStats[3].innerHTML = `<div class="big-stat-num">${user.rank}</div><div class="big-stat-label">ترتيبك</div>`;
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}

// ══════════ عام ══════════
let authManager = new AuthManager();

function updateUserDisplay() {
  if (authManager.currentUser) {
    document.getElementById('xp-display').textContent = authManager.currentUser.xp.toLocaleString('ar-EG');
    document.querySelector('.level-badge').textContent = `🎖️ المستوى ${authManager.currentUser.level}`;
  }
}

function submitRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const org = document.getElementById('reg-org').value.trim();
  const role = document.getElementById('reg-role').value;

  if (!name || !email) {
    showNotif('❌ يرجى ملء الحقول المطلوبة');
    return;
  }

  const result = authManager.register(name, email, org, role);
  if (result.success) {
    closeRegister();
    navigate('dashboard');
  } else {
    showNotif(`❌ ${result.error}`);
  }
}

function openRegister() {
  document.getElementById('register-modal').classList.add('open');
}

function closeRegister() {
  document.getElementById('register-modal').classList.remove('open');
  document.getElementById('register-body').style.display = 'block';
  document.getElementById('register-card').querySelector('.mh-icon').textContent = '🧬';
}

function openLoginModal() {
  const modal = document.getElementById('register-modal');
  modal.classList.add('open');
  const card = document.getElementById('register-card');
  const body = document.getElementById('register-body');
  
  // تحويل النموذج إلى نموذج تسجيل دخول
  const icon = card.querySelector('.mh-icon');
  icon.textContent = '🔐';
  
  const title = card.querySelector('.modal-title');
  title.textContent = 'تسجيل الدخول';
  
  const sub = card.querySelector('.modal-sub');
  sub.textContent = 'أدخل بيانات حسابك للمتابعة';

  body.innerHTML = `
    <div class="form-row">
      <label class="form-label">البريد الإلكتروني *</label>
      <input class="form-input" id="login-email" type="email" placeholder="name@example.com" dir="ltr">
    </div>
    <div class="form-row">
      <label class="form-label">كلمة المرور *</label>
      <input class="form-input" id="login-password" type="password" placeholder="••••••••">
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:18px" onclick="submitLogin()">تسجيل الدخول ←</button>
    <div style="text-align:center;margin-top:12px;font-size:12px;color:var(--text-muted)">
      أو <button class="btn btn-outline" style="padding:0;background:none;border:none;color:var(--accent);text-decoration:underline;font-size:inherit" onclick="switchToRegister()">أنشئ حساب جديد</button>
    </div>
  `;
}

function switchToRegister() {
  const body = document.getElementById('register-body');
  const card = document.getElementById('register-card');
  const icon = card.querySelector('.mh-icon');
  icon.textContent = '🧬';
  
  const title = card.querySelector('.modal-title');
  title.textContent = 'التسجيل في البرنامج المتقدم';
  
  const sub = card.querySelector('.modal-sub');
  sub.textContent = 'الذكاء الاصطناعي في الرعاية الصحية — 10 وحدات · 80 ساعة';

  body.innerHTML = `
    <div class="form-row">
      <label class="form-label">الاسم الكامل *</label>
      <input class="form-input" id="reg-name" placeholder="مثال: د. سهيلة محي الدين">
    </div>
    <div class="form-row">
      <label class="form-label">البريد الإلكتروني *</label>
      <input class="form-input" id="reg-email" type="email" placeholder="name@example.com" dir="ltr">
    </div>
    <div class="form-row">
      <label class="form-label">الجهة / المؤسسة</label>
      <input class="form-input" id="reg-org" placeholder="الجامعة أو المستشفى (اختياري)">
    </div>
    <div class="form-row">
      <label class="form-label">خلفيتك المهنية</label>
      <select class="form-input" id="reg-role">
        <option>طبيب / استشاري</option>
        <option>مهندس طبي حيوي</option>
        <option>عالم بيانات / مهندس ML</option>
        <option>باحث / أكاديمي</option>
        <option>طالب دراسات عليا</option>
        <option>أخرى</option>
      </select>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:18px" onclick="submitRegister()">تأكيد التسجيل ←</button>
  `;
}

function submitLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showNotif('❌ يرجى ملء جميع الحقول');
    return;
  }

  // للمحاكاة: سنقبل أي بريد + كلمة مرور
  // في تطبيق حقيقي: تتحقق من السيرفر
  const users = JSON.parse(localStorage.getItem('aihealth_users') || '{}');
  const user = Object.values(users).find(u => u.email === email);

  if (user) {
    authManager.login(email, password);
  } else {
    showNotif('❌ المستخدم غير موجود. يرجى التسجيل أولاً');
  }
}

// جعل openLoginModal متاحاً عالمياً
window.openLoginModal = openLoginModal;
