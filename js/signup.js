(() => {
    console.log("Signup page loaded");

    // Access Firebase services from global scope
    // Make sure auth-service.js and auth-guard.js expose their services globally
    // Example: window.authService = { ... }; window.authGuard = { ... };

    // DOM Elements
    const signupForm = document.getElementById('signupForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const displayNameInput = document.getElementById('displayName');
    const togglePassword = document.getElementById('togglePassword');
    const daySelect = document.getElementById('day');
    const monthSelect = document.getElementById('month');
    const yearInput = document.getElementById('year');
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    const marketingCheckbox = document.getElementById('marketing');
    const dataSharingCheckbox = document.getElementById('dataSharing');
    const submitButton = signupForm?.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Wait for DOM to be ready and services to be available
    document.addEventListener('DOMContentLoaded', function () {
        // Initialize auth guard for signup page
        if (window.authGuard) {
            window.authGuard.initializeForAuthPages();
        }
    });

    // Password visibility toggle
    function setupPasswordToggle(toggleElement, inputElement) {
        if (toggleElement && inputElement) {
            toggleElement.addEventListener('click', function () {
                const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
                inputElement.setAttribute('type', type);

                // Toggle eye icon
                this.textContent = type === 'password' ? '👁️' : '🙈';
            });
        }
    }

    setupPasswordToggle(togglePassword, passwordInput);

    // Populate day dropdown
    if (daySelect) {
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i.toString().padStart(2, '0');
            option.textContent = i;
            daySelect.appendChild(option);
        }
    }

    // Validation functions
    function validateDisplayName(name) {
        return name.trim().length >= 2 && name.trim().length <= 50;
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validatePassword(password) {
        // At least 8 characters as mentioned in HTML
        return password.length >= 8;
    }

    function validateStrongPassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    function validateDateOfBirth(day, month, year) {
        if (!day || !month || !year) return false;

        const today = new Date();
        const birthDate = new Date(year, month - 1, day);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age >= 13 && age <= 120; // Reasonable age range
    }

    function getSelectedGender() {
        const selectedGender = document.querySelector('input[name="gender"]:checked');
        return selectedGender ? selectedGender.value : '';
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        } else {
            alert(message);
        }
        hideSuccess();
    }

    function showSuccess(message) {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
        }
        hideError();
    }

    function hideError() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    function hideSuccess() {
        if (successMessage) {
            successMessage.style.display = 'none';
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

    // Real-time validation
    if (displayNameInput) {
        displayNameInput.addEventListener('input', function () {
            const name = this.value.trim();
            if (name && !validateDisplayName(name)) {
                setFieldInvalid(this);
            } else {
                setFieldValid(this);
            }
            hideError();
        });
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

            // Update password strength indicator
            updatePasswordStrength(password);
            hideError();
        });
    }

    if (yearInput) {
        yearInput.addEventListener('input', function () {
            const year = parseInt(this.value);
            const currentYear = new Date().getFullYear();
            if (this.value && (year < 1900 || year > currentYear)) {
                setFieldInvalid(this);
            } else {
                setFieldValid(this);
            }
            hideError();
        });
    }

    // Form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const displayName = displayNameInput.value.trim();
            const day = daySelect ? daySelect.value : '';
            const month = monthSelect ? monthSelect.value : '';
            const year = yearInput ? yearInput.value : '';
            const gender = getSelectedGender();
            const marketingOptOut = marketingCheckbox ? marketingCheckbox.checked : false;
            const dataSharing = dataSharingCheckbox ? dataSharingCheckbox.checked : false;

            // Validation
            let isValid = true;
            let errorMsg = '';

            // Email validation
            if (!email) {
                setFieldInvalid(emailInput);
                errorMsg = 'Email is required';
                isValid = false;
            } else if (!validateEmail(email)) {
                setFieldInvalid(emailInput);
                errorMsg = 'Please enter a valid email address';
                isValid = false;
            }

            // Password validation
            if (!password) {
                setFieldInvalid(passwordInput);
                errorMsg = 'Password is required';
                isValid = false;
            } else if (!validatePassword(password)) {
                setFieldInvalid(passwordInput);
                errorMsg = 'Password must contain at least 8 characters';
                isValid = false;
            }

            // Display name validation
            if (!displayName) {
                setFieldInvalid(displayNameInput);
                errorMsg = 'Profile name is required';
                isValid = false;
            } else if (!validateDisplayName(displayName)) {
                setFieldInvalid(displayNameInput);
                errorMsg = 'Profile name must be between 2-50 characters';
                isValid = false;
            }

            // Date of birth validation
            if (!day || !month || !year) {
                if (!day) setFieldInvalid(daySelect);
                if (!month) setFieldInvalid(monthSelect);
                if (!year) setFieldInvalid(yearInput);
                errorMsg = 'Please select your complete date of birth';
                isValid = false;
            } else if (!validateDateOfBirth(day, month, year)) {
                setFieldInvalid(daySelect);
                setFieldInvalid(monthSelect);
                setFieldInvalid(yearInput);
                errorMsg = 'Please enter a valid date of birth (age must be between 13-120)';
                isValid = false;
            }

            // Gender validation (optional in most cases, but let's make it required like Spotify)
            if (!gender) {
                errorMsg = 'Please select your gender';
                isValid = false;
            }

            if (!isValid) {
                showError(errorMsg);
                return;
            }

            // Show loading state
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = 'Creating Account...';
            }

            try {
                // Check if authService is available
                if (!window.authService) {
                    throw new Error('Authentication service not available');
                }

                // Prepare user data
                const userData = {
                    displayName: displayName,
                    email: email
                };

                // Add optional fields
                if (day && month && year) {
                    userData.dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                if (gender) {
                    userData.gender = gender;
                }

                // Add preferences
                userData.marketingOptOut = marketingOptOut;
                userData.dataSharing = dataSharing;

                // Use Firebase authentication
                const result = await window.authService.signUp(email, password, userData);

                if (result.success) {
                    // Successful signup
                    hideError();
                    showSuccess('Account created successfully! Redirecting to login...');
                    console.log('Signup successful:', result.user);

                    // Clear form for security
                    signupForm.reset();

                    // Reset all field borders
                    [emailInput, passwordInput, displayNameInput, daySelect, monthSelect, yearInput]
                        .filter(input => input)
                        .forEach(input => setFieldValid(input));

                    // Update button state
                    if (submitButton) {
                        submitButton.innerHTML = 'Account Created!';
                    }

                    // Redirect to login page after a delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);

                } else {
                    // Failed signup
                    showError(result.error);

                    // Reset form state
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerHTML = 'Sign Up';
                    }

                    // If email already exists, highlight email field
                    if (result.error.toLowerCase().includes('email')) {
                        setFieldInvalid(emailInput);
                    }
                }

            } catch (error) {
                console.error('Signup error:', error);
                showError('An unexpected error occurred. Please try again.');

                // Reset form state
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Sign Up';
                }
            }
        });
    }

    // Handle Enter key press
    document.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const formInputs = [emailInput, passwordInput, displayNameInput, yearInput]
                .filter(input => input);

            const activeElement = document.activeElement;
            if (formInputs.includes(activeElement)) {
                if (signupForm) {
                    signupForm.dispatchEvent(new Event('submit'));
                }
            }
        }
    });

    // Password strength indicator
    function updatePasswordStrength(password) {
        const strengthIndicator = document.getElementById('passwordStrength');
        if (!strengthIndicator) return;

        let strength = 0;
        let strengthText = '';
        let strengthColor = '';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;

        switch (strength) {
            case 0:
            case 1:
                strengthText = 'Very Weak';
                strengthColor = '#e22134';
                break;
            case 2:
                strengthText = 'Weak';
                strengthColor = '#ff6b35';
                break;
            case 3:
                strengthText = 'Fair';
                strengthColor = '#f7931e';
                break;
            case 4:
                strengthText = 'Good';
                strengthColor = '#7cb342';
                break;
            case 5:
                strengthText = 'Strong';
                strengthColor = '#4caf50';
                break;
        }

        strengthIndicator.textContent = strengthText;
        strengthIndicator.style.color = strengthColor;
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (window.authGuard) {
            window.authGuard.cleanup();
        }
    });
})();