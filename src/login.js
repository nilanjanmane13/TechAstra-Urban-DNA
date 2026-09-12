import './login.css';

// -----------------------------------------------------------------------------
// If already logged in, skip straight to the app.
// -----------------------------------------------------------------------------
(async function checkSession() {
  try {
    const r = await fetch('/api/auth/me', {
      credentials: 'same-origin',
    });

    const d = await r.json();

    if (d?.user) {
      window.location.replace('/');
    }
  } catch (error) {
    console.warn('Session check failed:', error);
  }
})();

// -----------------------------------------------------------------------------
// Background video
// 0.5s fade-in → play → 0.5s fade-out → restart.
// -----------------------------------------------------------------------------
const video = document.querySelector('.hero-video');

if (video) {
  const FADE = 500;
  let raf = null;
  let started = false;

  const fade = (from, to, duration, onDone) => {
    const start = performance.now();

    if (raf) {
      cancelAnimationFrame(raf);
    }

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);

      video.style.opacity = String(
        from + (to - from) * t
      );

      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else if (onDone) {
        onDone();
      }
    };

    raf = requestAnimationFrame(step);
  };

  const playLoop = async () => {
    if (!video) return;

    // Prevent multiple simultaneous loops.
    if (started) return;
    started = true;

    try {
      video.currentTime = 0;
    } catch {}

    video.style.opacity = '0';

    try {
      await video.play();
      fade(0, 1, FADE);
    } catch (error) {
      // Browser autoplay restriction.
      // Because the video is muted, autoplay should normally be allowed.
      console.warn('Video autoplay failed:', error);

      // Still show the video if it has loaded.
      video.style.opacity = '1';
    }
  };

  const restartVideo = () => {
    started = false;
    video.style.opacity = '0';

    setTimeout(() => {
      playLoop();
    }, 100);
  };

  // Fade out shortly before the video ends.
  video.addEventListener('timeupdate', () => {
    if (!video.duration || !Number.isFinite(video.duration)) {
      return;
    }

    const remaining =
      (video.duration - video.currentTime) * 1000;

    if (
      remaining <= FADE &&
      video.style.opacity !== '0'
    ) {
      fade(
        Number(video.style.opacity || 1),
        0,
        FADE
      );
    }
  });

  // Restart after the video finishes.
  video.addEventListener('ended', restartVideo);

  // Start when enough video data has loaded.
  video.addEventListener(
    'loadeddata',
    playLoop,
    { once: true }
  );

  // Some browsers fire canplay instead.
  video.addEventListener(
    'canplay',
    () => {
      if (!started) {
        playLoop();
      }
    },
    { once: true }
  );

  // IMPORTANT:
  // If the video was already loaded before the event listeners
  // were attached, start it immediately.
  if (video.readyState >= 2) {
    playLoop();
  }

  video.addEventListener('error', (error) => {
    console.error('Background video failed:', error);

    video.style.display = 'none';
  });
}

// -----------------------------------------------------------------------------
// Logo marquee
// -----------------------------------------------------------------------------
const BRANDS = [
  'Vortex',
  'Nimbus',
  'Prysma',
  'Cirrus',
  'Kynder',
  'Halcyn',
];

const marqueeInner =
  document.querySelector('#marqueeInner');

if (marqueeInner) {
  const item = (name) => `
    <div class="marquee-logo">
      <span class="icon liquid-glass">${name[0]}</span>
      <span class="name">${name}</span>
    </div>
  `;

  marqueeInner.innerHTML = [
    ...BRANDS,
    ...BRANDS,
  ]
    .map(item)
    .join('');
}

// -----------------------------------------------------------------------------
// Auth card
// -----------------------------------------------------------------------------
const heroCopy =
  document.querySelector('#heroCopy');

const authCard =
  document.querySelector('#authCard');

const loginForm =
  document.querySelector('#loginForm');

const signupForm =
  document.querySelector('#signupForm');

const authTabs =
  document.querySelectorAll('.auth-tab');

// -----------------------------------------------------------------------------
// Open authentication card
// -----------------------------------------------------------------------------
function openAuth(mode) {
  if (heroCopy) {
    heroCopy.classList.add('hidden');
  }

  if (authCard) {
    authCard.classList.remove('hidden');
  }

  setMode(mode);
}

// -----------------------------------------------------------------------------
// Switch between Login / Signup
// -----------------------------------------------------------------------------
function setMode(mode) {
  authTabs.forEach((tab) => {
    tab.classList.toggle(
      'active',
      tab.dataset.mode === mode
    );
  });

  if (loginForm) {
    loginForm.classList.toggle(
      'hidden',
      mode !== 'login'
    );
  }

  if (signupForm) {
    signupForm.classList.toggle(
      'hidden',
      mode !== 'signup'
    );
  }
}

// -----------------------------------------------------------------------------
// Navigation buttons
// -----------------------------------------------------------------------------
document
  .querySelector('#showLogin')
  ?.addEventListener('click', () => {
    openAuth('login');
  });

document
  .querySelector('#showSignup')
  ?.addEventListener('click', () => {
    openAuth('signup');
  });

document
  .querySelector('#showSignupCta')
  ?.addEventListener('click', () => {
    openAuth('signup');
  });

authTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setMode(tab.dataset.mode);
  });
});

// -----------------------------------------------------------------------------
// Authentication request
// -----------------------------------------------------------------------------
async function submitAuth(
  url,
  payload,
  errorEl,
  submitButton
) {
  if (errorEl) {
    errorEl.textContent = '';
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent =
      url.includes('register')
        ? 'Creating...'
        : 'Signing in...';
  }

  try {
    const response = await fetch(url, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      credentials: 'same-origin',

      body: JSON.stringify(payload),
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      if (errorEl) {
        errorEl.textContent =
          data?.error ||
          `Request failed (${response.status}). Please try again.`;
      }

      return;
    }

    // Authentication successful.
    window.location.replace('/');

  } catch (error) {
    console.error('Authentication error:', error);

    if (errorEl) {
      errorEl.textContent =
        'Network error. Please try again.';
    }

  } finally {
    if (submitButton) {
      submitButton.disabled = false;

      submitButton.textContent =
        url.includes('register')
          ? 'Create Account'
          : 'Log In';
    }
  }
}

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------
loginForm?.addEventListener(
  'submit',
  (event) => {
    event.preventDefault();

    const formData =
      new FormData(loginForm);

    const email =
      String(formData.get('email') || '')
        .trim();

    const password =
      String(formData.get('password') || '');

    submitAuth(
      '/api/auth/login',
      {
        email,
        password,
      },
      document.querySelector('#loginError'),
      loginForm.querySelector(
        'button[type="submit"]'
      )
    );
  }
);

// -----------------------------------------------------------------------------
// Signup
// -----------------------------------------------------------------------------
signupForm?.addEventListener(
  'submit',
  (event) => {
    event.preventDefault();

    const formData =
      new FormData(signupForm);

    const name =
      String(formData.get('name') || '')
        .trim();

    const email =
      String(formData.get('email') || '')
        .trim();

    const password =
      String(formData.get('password') || '');

    submitAuth(
      '/api/auth/register',
      {
        name,
        email,
        password,
      },
      document.querySelector('#signupError'),
      signupForm.querySelector(
        'button[type="submit"]'
      )
    );
  }
);
