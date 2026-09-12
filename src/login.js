import './login.css';

// -----------------------------------------------------------------------------
// If already logged in, skip straight to the app.
// -----------------------------------------------------------------------------
(async function checkSession() {
  try {
    const r = await fetch('/api/auth/me');
    const d = await r.json();
    if (d?.user) window.location.replace('/');
  } catch {}
})();

// -----------------------------------------------------------------------------
// Background video: 0.5s fade-in, hold, 0.5s fade-out, then loop from 0.
// -----------------------------------------------------------------------------
const video = document.querySelector('.hero-video');
if (video) {
  const FADE = 500; // ms
  let raf = null;

  const fade = (from, to, duration, onDone) => {
    const start = performance.now();
    cancelAnimationFrame(raf);
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      video.style.opacity = String(from + (to - from) * t);
      if (t < 1) raf = requestAnimationFrame(step);
      else onDone && onDone();
    };
    raf = requestAnimationFrame(step);
  };

  const playLoop = () => {
    video.currentTime = 0;
    video.play().catch(() => {});
    fade(0, 1, FADE);
  };

  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const remaining = (video.duration - video.currentTime) * 1000;
    if (remaining <= FADE && video.style.opacity !== '0') {
      fade(Number(video.style.opacity || 1), 0, FADE);
    }
  });

  video.addEventListener('ended', () => {
    video.style.opacity = '0';
    setTimeout(playLoop, 100);
  });

  video.addEventListener('loadeddata', playLoop, { once: true });
  video.addEventListener('error', () => {
    // No network/asset available - keep a plain dark background, no crash.
    video.style.display = 'none';
  });
}

// -----------------------------------------------------------------------------
// Logo marquee - generic demo brand names, duplicated for a seamless loop.
// -----------------------------------------------------------------------------
const BRANDS = ['Vortex', 'Nimbus', 'Prysma', 'Cirrus', 'Kynder', 'Halcyn'];
const marqueeInner = document.querySelector('#marqueeInner');
if (marqueeInner) {
  const item = (name) => `
    <div class="marquee-logo">
      <span class="icon liquid-glass">${name[0]}</span>
      <span class="name">${name}</span>
    </div>`;
  marqueeInner.innerHTML = [...BRANDS, ...BRANDS].map(item).join('');
}

// -----------------------------------------------------------------------------
// Auth card: open/close, tab switching, form submission.
// -----------------------------------------------------------------------------
const heroCopy = document.querySelector('#heroCopy');
const authCard = document.querySelector('#authCard');
const loginForm = document.querySelector('#loginForm');
const signupForm = document.querySelector('#signupForm');
const authTabs = document.querySelectorAll('.auth-tab');

function openAuth(mode) {
  heroCopy.classList.add('hidden');
  authCard.classList.remove('hidden');
  setMode(mode);
}
function setMode(mode) {
  authTabs.forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));
  loginForm.classList.toggle('hidden', mode !== 'login');
  signupForm.classList.toggle('hidden', mode !== 'signup');
}

document.querySelector('#showLogin')?.addEventListener('click', () => openAuth('login'));
document.querySelector('#showSignup')?.addEventListener('click', () => openAuth('signup'));
document.querySelector('#showSignupCta')?.addEventListener('click', () => openAuth('signup'));
authTabs.forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode)));

async function submitAuth(url, payload, errorEl) {
  errorEl.textContent = '';
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) {
      errorEl.textContent = d?.error || 'Something went wrong. Please try again.';
      return;
    }
    window.location.href = '/';
  } catch {
    errorEl.textContent = 'Network error. Please try again.';
  }
}

loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(loginForm);
  submitAuth('/api/auth/login', {
    email: fd.get('email'),
    password: fd.get('password'),
  }, document.querySelector('#loginError'));
});

signupForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(signupForm);
  submitAuth('/api/auth/register', {
    name: fd.get('name'),
    email: fd.get('email'),
    password: fd.get('password'),
  }, document.querySelector('#signupError'));
});
