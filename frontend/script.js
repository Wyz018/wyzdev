let isLogin = true;

function toggleForm() {
  const formTitle = document.getElementById("form-title");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const submitButton = document.querySelector("button");
  const toggleLink = document.getElementById("toggle");
  const msg = document.getElementById("msg");
  const passwordStrength = document.getElementById("password-strength");

  // Animate fade out
  formTitle.classList.add("fade-out");
  emailInput.classList.add("fade-out");
  passwordInput.classList.add("fade-out");
  confirmPasswordInput.classList.add("fade-out");
  submitButton.classList.add("fade-out");
  toggleLink.classList.add("fade-out");
  msg.classList.add("fade-out");
  passwordStrength.classList.add("fade-out");

  setTimeout(() => {
    isLogin = !isLogin;

    formTitle.textContent = isLogin ? "Connexion" : "Inscription";
    emailInput.value = "";
    passwordInput.value = "";
    confirmPasswordInput.value = "";
    submitButton.textContent = isLogin ? "Se connecter" : "S'inscrire";
    toggleLink.textContent = isLogin ? "Créer un compte" : "Déjà inscrit ?";
    msg.textContent = "";
    msg.className = "message";

    if (isLogin) {
      confirmPasswordInput.style.display = "none";
      passwordStrength.style.display = "none";
      passwordInput.removeEventListener("input", checkPasswordStrength);
    } else {
      confirmPasswordInput.style.display = "block";
      passwordStrength.style.display = "block";
      passwordInput.addEventListener("input", checkPasswordStrength);
    }

    // Animate fade in
    formTitle.classList.remove("fade-out");
    emailInput.classList.remove("fade-out");
    passwordInput.classList.remove("fade-out");
    confirmPasswordInput.classList.remove("fade-out");
    submitButton.classList.remove("fade-out");
    toggleLink.classList.remove("fade-out");
    msg.classList.remove("fade-out");
    passwordStrength.classList.remove("fade-out");

    formTitle.classList.add("fade-in");
    emailInput.classList.add("fade-in");
    passwordInput.classList.add("fade-in");
    confirmPasswordInput.classList.add("fade-in");
    submitButton.classList.add("fade-in");
    toggleLink.classList.add("fade-in");
    msg.classList.add("fade-in");
    passwordStrength.classList.add("fade-in");
  }, 300);
}

function checkPasswordStrength() {
  const password = document.getElementById("password").value;
  const strengthBar = document.getElementById("password-strength");
  const strengthText = document.getElementById("password-strength-text");
  let strength = 0;

  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (!isLogin) {
    switch (strength) {
      case 0:
      case 1:
        strengthBar.style.backgroundColor = "#e53e3e"; // red
        strengthBar.style.width = "25%";
        strengthText.textContent = "Faible";
        strengthText.style.color = "#e53e3e";
        break;
      case 2:
        strengthBar.style.backgroundColor = "#ed8936"; // orange
        strengthBar.style.width = "50%";
        strengthText.textContent = "Moyen";
        strengthText.style.color = "#ed8936";
        break;
      case 3:
        strengthBar.style.backgroundColor = "#38a169"; // green
        strengthBar.style.width = "75%";
        strengthText.textContent = "Bon";
        strengthText.style.color = "#38a169";
        break;
      case 4:
        strengthBar.style.backgroundColor = "#22543d"; // dark green
        strengthBar.style.width = "100%";
        strengthText.textContent = "Très Bon";
        strengthText.style.color = "#22543d";
        break;
    }
  } else {
    strengthBar.style.width = "0";
    strengthText.textContent = "";
  }
}

async function handleAuth() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPasswordInput = document.getElementById("confirm-password");
  const confirmPassword = confirmPasswordInput.value.trim();
  const msg = document.getElementById("msg");
  const strengthText = document.getElementById("password-strength-text");

  if (!email || !password) {
    fadeMessage(msg, "Veuillez remplir tous les champs.", "error");
    return;
  }

  if (!isLogin) {
    if (!confirmPassword) {
      fadeMessage(msg, "Veuillez confirmer le mot de passe.", "error");
      return;
    }
    if (password !== confirmPassword) {
      fadeMessage(msg, "Les mots de passe ne correspondent pas.", "error");
      return;
    }
  }

  const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

  try {
    const res = await fetch("http://localhost:5001" + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      fadeMessage(msg, data.msg || "Une erreur est survenue.", "error");
    } else {
      fadeMessage(msg, isLogin ? "Connexion réussie" : "Inscription réussie", "success");

      if (isLogin) {
        console.log("Token JWT :", data.token);
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        // Redirect to success page on successful login
        window.location.href = "success.html";
      } else {
        // Send welcome email after successful registration
        // Send welcome email after successful registration with actual email
        emailjs.send('panellogin', 'template_hi1jly4', {
          to_email: email
        }).then(function(response) {
          console.log('Email envoyé avec succès!', response.status, response.text);
        }, function(error) {
          console.error('Erreur lors de l\'envoi de l\'email:', error);
        });
      }
    }
  } catch (error) {
    fadeMessage(msg, "Erreur réseau", "error");
  }
}

function fadeMessage(element, text, className) {
  element.classList.remove("fade-in");
  element.classList.add("fade-out");
  setTimeout(() => {
    element.textContent = text;
    element.className = "message " + className;
    element.classList.remove("fade-out");
    element.classList.add("fade-in");
  }, 300);
}

function toggleForm() {
  const formTitle = document.getElementById("form-title");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const submitButton = document.querySelector("button");
  const toggleLink = document.getElementById("toggle");
  const msg = document.getElementById("msg");
  const passwordStrength = document.getElementById("password-strength");
  const strengthText = document.getElementById("password-strength-text");

  // Animate fade out
  formTitle.classList.add("fade-out");
  emailInput.classList.add("fade-out");
  passwordInput.classList.add("fade-out");
  confirmPasswordInput.classList.add("fade-out");
  submitButton.classList.add("fade-out");
  toggleLink.classList.add("fade-out");
  msg.classList.add("fade-out");
  passwordStrength.classList.add("fade-out");
  strengthText.classList.add("fade-out");

  setTimeout(() => {
    isLogin = !isLogin;

    formTitle.textContent = isLogin ? "Connexion" : "Inscription";
    emailInput.value = "";
    passwordInput.value = "";
    confirmPasswordInput.value = "";
    submitButton.textContent = isLogin ? "Se connecter" : "S'inscrire";
    toggleLink.textContent = isLogin ? "Créer un compte" : "Déjà inscrit ?";
    msg.textContent = "";
    msg.className = "message";

    if (isLogin) {
      confirmPasswordInput.style.display = "none";
      passwordStrength.style.display = "none";
      strengthText.style.display = "none";
      passwordInput.removeEventListener("input", checkPasswordStrength);
      strengthText.textContent = "";
    } else {
      confirmPasswordInput.style.display = "block";
      passwordStrength.style.display = "block";
      strengthText.style.display = "block";
      passwordInput.addEventListener("input", checkPasswordStrength);
    }

    // Animate fade in
    formTitle.classList.remove("fade-out");
    emailInput.classList.remove("fade-out");
    passwordInput.classList.remove("fade-out");
    confirmPasswordInput.classList.remove("fade-out");
    submitButton.classList.remove("fade-out");
    toggleLink.classList.remove("fade-out");
    msg.classList.remove("fade-out");
    passwordStrength.classList.remove("fade-out");
    strengthText.classList.remove("fade-out");

    formTitle.classList.add("fade-in");
    emailInput.classList.add("fade-in");
    passwordInput.classList.add("fade-in");
    confirmPasswordInput.classList.add("fade-in");
    submitButton.classList.add("fade-in");
    toggleLink.classList.add("fade-in");
    msg.classList.add("fade-in");
    passwordStrength.classList.add("fade-in");
    strengthText.classList.add("fade-in");
  }, 300);
}
