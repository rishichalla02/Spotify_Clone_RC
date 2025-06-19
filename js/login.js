
(() => {
  console.log("Login page loaded");

  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePassword = document.getElementById('togglePassword');
  const rememberCheckbox = document.getElementById('remember');
  const submitButton = document.getElementById('submitButton') || loginForm?.querySelector('button[type="submit"]');
  const errorMessage = document.getElementById('errorMessage');

  document.addEventListener('DOMContentLoaded', async function () {
    if (window.authService && window.authService.getCurrentUser()) {
      // Already logged in — skip login
      window.location.href = 'index.html';
      return;
    }

    if (window.authGuard) {
      window.authGuard.initializeForAuthPages();
    }
  });


  if (togglePassword) {
    togglePassword.addEventListener('click', function () {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validatePassword(password) {
    return password.length >= 6;
  }

  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
    } else {
      alert(message);
    }
  }

  function hideError() {
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }
  }

  function setFieldValid(field) {
    if (field) {
      field.style.borderColor = '#727272';
    }
  }

  function setFieldInvalid(field) {
    if (field) {
      field.style.borderColor = '#e22134';
    }
  }

  if (emailInput) {
    emailInput.addEventListener('input', function () {
      const email = this.value.trim();
      if (email && !validateEmail(email)) {
        setFieldInvalid(this);
      } else {
        setFieldValid(this);
      }
      hideError();
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', function () {
      const password = this.value;
      if (password && !validatePassword(password)) {
        setFieldInvalid(this);
      } else {
        setFieldValid(this);
      }
      hideError();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const remember = rememberCheckbox ? rememberCheckbox.checked : false;

      let isValid = true;
      let errorMsg = '';

      if (!email) {
        setFieldInvalid(emailInput);
        errorMsg = 'Email is required';
        isValid = false;
      } else if (!validateEmail(email)) {
        setFieldInvalid(emailInput);
        errorMsg = 'Please enter a valid email address';
        isValid = false;
      }

      if (!password) {
        setFieldInvalid(passwordInput);
        errorMsg = 'Password is required';
        isValid = false;
      } else if (!validatePassword(password)) {
        setFieldInvalid(passwordInput);
        errorMsg = 'Password must be at least 6 characters long';
        isValid = false;
      }

      if (!isValid) {
        showError(errorMsg);
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = 'Signing in...';
      }

      try {
        if (!window.authService) {
          throw new Error('Authentication service not available');
        }

        const result = await window.authService.signIn(email, password);

        if (result.success) {
          hideError();
          console.log('Login successful:', result.user);

          if (remember) {
            localStorage.setItem('rememberUser', 'true');
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberUser');
            localStorage.removeItem('rememberedEmail');
          }

          if (submitButton) {
            submitButton.innerHTML = 'Success! Redirecting...';
          }

          setTimeout(() => {
            // Give Firebase a moment to update auth state globally
            window.location.href = './index.html';
          }, 2000); // 2 seconds


        } else {
          showError(result.error);
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Sign In';
          }

          passwordInput.value = '';
          setFieldValid(passwordInput);
          setFieldInvalid(emailInput);
        }

      } catch (error) {
        console.error('Login error:', error);
        showError('An unexpected error occurred. Please try again.');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = 'Sign In';
        }
      }
    });
  }

  window.addEventListener('load', function () {
    const rememberUser = localStorage.getItem('rememberUser');
    const rememberedEmail = localStorage.getItem('rememberedEmail');

    if (rememberUser === 'true' && rememberedEmail) {
      if (emailInput) emailInput.value = rememberedEmail;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }
  });

  document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const activeElement = document.activeElement;
      if (activeElement === emailInput || activeElement === passwordInput) {
        if (loginForm) {
          loginForm.dispatchEvent(new Event('submit'));
        }
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    if (window.authGuard) {
      window.authGuard.cleanup();
    }
  });
})();
