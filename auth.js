let currentUser = null; // { firstName, lastName, email, password }


function openAuth(tab = 'login') {
  document.getElementById('auth-overlay').classList.add('open');
  switchAuthTab(tab);
  clearAuthAlerts();
}

function closeAuth() {
  document.getElementById('auth-overlay').classList.remove('open');
  clearAuthAlerts();
  clearAuthFields();
}

  //  SWITCH TABS (Login ↔ Register)

function switchAuthTab(tab) {
  // Tabs
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  // Panels
  document.querySelectorAll('.auth-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tab}`);
  });
  clearAuthAlerts();
}


  //  VALIDATION HELPERS

function showFieldError(inputEl, msgEl, message) {
  inputEl.classList.add('error');
  inputEl.classList.remove('success');
  msgEl.textContent = message;
  msgEl.classList.add('show');
}

function clearFieldError(inputEl, msgEl) {
  inputEl.classList.remove('error');
  msgEl.classList.remove('show');
}

function markFieldSuccess(inputEl) {
  inputEl.classList.remove('error');
  inputEl.classList.add('success');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clearAuthAlerts() {
  document.querySelectorAll('.auth-alert').forEach(a => a.classList.remove('show'));
}

function clearAuthFields() {
  document.querySelectorAll('.auth-input').forEach(i => {
    i.value = '';
    i.classList.remove('error', 'success');
  });
  document.querySelectorAll('.auth-error-msg').forEach(m => m.classList.remove('show'));
  const fill = document.getElementById('pw-fill');
  if (fill) { fill.style.width = '0%'; }
  const lbl = document.getElementById('pw-label');
  if (lbl) { lbl.textContent = ''; }
}

function showAuthAlert(panelId, type, message) {
  const alert = document.querySelector(`#panel-${panelId} .auth-alert`);
  if (!alert) return;
  alert.className = `auth-alert ${type} show`;
  alert.querySelector('.alert-msg').textContent = message;
}


  //  PASSWORD STRENGTH

function checkPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))    score++;

  const fill  = document.getElementById('pw-fill');
  const label = document.getElementById('pw-label');
  if (!fill || !label) return;

  const levels = [
    { width: '0%',   color: 'transparent', text: '' },
    { width: '25%',  color: '#ff3d6b',     text: 'Weak' },
    { width: '50%',  color: '#ffa040',     text: 'Fair' },
    { width: '75%',  color: '#00e5ff',     text: 'Good' },
    { width: '100%', color: '#00c97d',     text: 'Strong 🔒' },
  ];

  const level = levels[score] || levels[0];
  fill.style.width      = level.width;
  fill.style.background = level.color;
  label.textContent     = level.text;
  label.style.color     = level.color;
}


  //  TOGGLE PASSWORD VISIBILITY

function togglePw(eyeId, inputId) {
  const input = document.getElementById(inputId);
  const eye   = document.getElementById(eyeId);
  if (!input || !eye) return;
  if (input.type === 'password') {
    input.type  = 'text';
    eye.textContent = '🙈';
  } else {
    input.type  = 'password';
    eye.textContent = '👁️';
  }
}


  //  REGISTER

function handleRegister() {
  clearAuthAlerts();

  const firstName = document.getElementById('reg-firstname');
  const lastName  = document.getElementById('reg-lastname');
  const email     = document.getElementById('reg-email');
  const password  = document.getElementById('reg-password');
  const confirm   = document.getElementById('reg-confirm');

  const fnErr  = document.getElementById('reg-fn-err');
  const lnErr  = document.getElementById('reg-ln-err');
  const emErr  = document.getElementById('reg-em-err');
  const pwErr  = document.getElementById('reg-pw-err');
  const cfErr  = document.getElementById('reg-cf-err');

  let valid = true;

  // First name
  if (!firstName.value.trim()) {
    showFieldError(firstName, fnErr, 'First name is required.');
    valid = false;
  } else { clearFieldError(firstName, fnErr); markFieldSuccess(firstName); }

  // Last name
  if (!lastName.value.trim()) {
    showFieldError(lastName, lnErr, 'Last name is required.');
    valid = false;
  } else { clearFieldError(lastName, lnErr); markFieldSuccess(lastName); }

  // Email
  if (!email.value.trim()) {
    showFieldError(email, emErr, 'Email address is required.');
    valid = false;
  } else if (!isValidEmail(email.value.trim())) {
    showFieldError(email, emErr, 'Please enter a valid email address.');
    valid = false;
  } else {
    // Check if email already registered
    const users = JSON.parse(localStorage.getItem('voltx_users') || '[]');
    if (users.find(u => u.email === email.value.trim().toLowerCase())) {
      showFieldError(email, emErr, 'This email is already registered. Please log in.');
      valid = false;
    } else { clearFieldError(email, emErr); markFieldSuccess(email); }
  }

  // Password
  if (!password.value) {
    showFieldError(password, pwErr, 'Password is required.');
    valid = false;
  } else if (password.value.length < 8) {
    showFieldError(password, pwErr, 'Password must be at least 8 characters.');
    valid = false;
  } else { clearFieldError(password, pwErr); markFieldSuccess(password); }

  // Confirm password
  if (!confirm.value) {
    showFieldError(confirm, cfErr, 'Please confirm your password.');
    valid = false;
  } else if (confirm.value !== password.value) {
    showFieldError(confirm, cfErr, 'Passwords do not match.');
    valid = false;
  } else { clearFieldError(confirm, cfErr); markFieldSuccess(confirm); }

  if (!valid) return;

  // Simulate loading
  const btn = document.getElementById('reg-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  setTimeout(() => {
    btn.classList.remove('loading');
    btn.disabled = false;

    // Save user to localStorage
    const users = JSON.parse(localStorage.getItem('voltx_users') || '[]');
    const newUser = {
      firstName: firstName.value.trim(),
      lastName:  lastName.value.trim(),
      email:     email.value.trim().toLowerCase(),
      password:  btoa(password.value), // basic encoding (not real hashing — demo only)
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('voltx_users', JSON.stringify(users));

    // Auto-login
    currentUser = newUser;
    localStorage.setItem('voltx_session', JSON.stringify(newUser));

    showAuthAlert('register', 'success', `🎉 Welcome to VoltX, ${newUser.firstName}! Account created.`);

    setTimeout(() => {
      closeAuth();
      updateNavForUser();
      showToast('success', `Welcome, ${newUser.firstName}! You're now logged in.`);
    }, 1200);
  }, 1200);
}


  //  LOGIN

function handleLogin() {
  clearAuthAlerts();

  const email    = document.getElementById('login-email');
  const password = document.getElementById('login-password');
  const emErr    = document.getElementById('login-em-err');
  const pwErr    = document.getElementById('login-pw-err');

  let valid = true;

  if (!email.value.trim()) {
    showFieldError(email, emErr, 'Email address is required.');
    valid = false;
  } else if (!isValidEmail(email.value.trim())) {
    showFieldError(email, emErr, 'Please enter a valid email address.');
    valid = false;
  } else { clearFieldError(email, emErr); markFieldSuccess(email); }

  if (!password.value) {
    showFieldError(password, pwErr, 'Password is required.');
    valid = false;
  } else { clearFieldError(password, pwErr); }

  if (!valid) return;

  const btn = document.getElementById('login-btn');
  btn.classList.add('loading');
  btn.disabled = true;

  setTimeout(() => {
    btn.classList.remove('loading');
    btn.disabled = false;

    const users = JSON.parse(localStorage.getItem('voltx_users') || '[]');
    const match = users.find(
      u => u.email === email.value.trim().toLowerCase() &&
           u.password === btoa(password.value)
    );

    if (!match) {
      showAuthAlert('login', 'error', 'Incorrect email or password. Please try again.');
      password.classList.add('error');
      return;
    }

    // Session
    currentUser = match;
    localStorage.setItem('voltx_session', JSON.stringify(match));

    showAuthAlert('login', 'success', `Welcome back, ${match.firstName}! Logging you in…`);

    setTimeout(() => {
      closeAuth();
      updateNavForUser();
      showToast('success', `Welcome back, ${match.firstName}! 👋`);
    }, 900);
  }, 1000);
}


  //  LOGOUT

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('voltx_session');
  closeUserDropdown();
  updateNavForUser();
  showToast('success', 'You have been logged out. See you soon!');
}




function updateNavForUser() {
  const authBtn = document.getElementById('auth-nav-btn');
  if (!authBtn) return;

  if (currentUser) {
    const initials = (currentUser.firstName[0] + currentUser.lastName[0]).toUpperCase();
    authBtn.outerHTML = `
      <div class="user-menu-wrap" id="user-menu-wrap">
        <button class="btn-auth-in" id="auth-nav-btn" onclick="toggleUserDropdown()">
          <div class="user-avatar">${initials}</div>
          <span>${currentUser.firstName}</span>
          <span style="font-size:10px;color:var(--muted)">▼</span>
        </button>
        <div class="user-dropdown" id="user-dropdown">
          <div class="user-dropdown-header">
            <div class="user-dropdown-name">${currentUser.firstName} ${currentUser.lastName}</div>
            <div class="user-dropdown-email">${currentUser.email}</div>
          </div>
          <div class="user-dropdown-item" onclick="closeUserDropdown();showToast('success','My Orders — coming soon!')">
            <span>📦</span><span>My Orders</span>
          </div>
          <div class="user-dropdown-item" onclick="closeUserDropdown();showToast('success','Wishlist — coming soon!')">
            <span>❤️</span><span>Wishlist</span>
          </div>
          <div class="user-dropdown-item" onclick="closeUserDropdown();showToast('success','Account Settings — coming soon!')">
            <span>⚙️</span><span>Account Settings</span>
          </div>
          <div class="user-dropdown-item danger" onclick="handleLogout()">
            <span>🚪</span><span>Sign Out</span>
          </div>
        </div>
      </div>
    `;
  } else {
    const wrap = document.getElementById('user-menu-wrap');
    if (wrap) {
      wrap.outerHTML = `<button class="btn btn-primary btn-auth-out" id="auth-nav-btn" onclick="openAuth('login')">Sign In</button>`;
    } else {
      authBtn.className = 'btn btn-primary btn-auth-out';
      authBtn.textContent = 'Sign In';
      authBtn.onclick = () => openAuth('login');
    }
  }
}


  //  USER DROPDOWN TOGGLE

function toggleUserDropdown() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.toggle('open');
}

function closeUserDropdown() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.remove('open');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('user-menu-wrap');
  if (wrap && !wrap.contains(e.target)) closeUserDropdown();
});


  //  FORGOT PASSWORD 

function forgotPassword() {
  const email = document.getElementById('login-email').value.trim();
  if (!email || !isValidEmail(email)) {
    showAuthAlert('login', 'error', 'Enter your email address above first, then click Forgot Password.');
    return;
  }
  showAuthAlert('login', 'success', `📧 Password reset link sent to ${email} (demo only).`);
}


  //  SOCIAL LOGIN 

function socialLogin(provider) {
  showToast('success', `${provider} login — available in full version!`);
}


  //  RESTORE SESSION on page load

function restoreSession() {
  const saved = localStorage.getItem('voltx_session');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      updateNavForUser();
    } catch (e) {
      localStorage.removeItem('voltx_session');
    }
  }
}




document.addEventListener('keydown', (e) => {
  if (!document.getElementById('auth-overlay').classList.contains('open')) return;
  if (e.key === 'Escape') closeAuth();
  if (e.key === 'Enter') {
    const activePanel = document.querySelector('.auth-panel.active');
    if (activePanel?.id === 'panel-login')    handleLogin();
    if (activePanel?.id === 'panel-register') handleRegister();
  }
});
