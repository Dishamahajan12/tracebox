import React, { useState } from "react";
import "./Login.css";
import { Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    let valid = true;

    if (!email.match(emailPattern)) {
      setEmailError(true);
      valid = false;
    } else {
      setEmailError(false);
    }

    if (!password.match(passwordPattern)) {
      setPasswordError(true);
      valid = false;
    } else {
      setPasswordError(false);
    }

    if (valid) {
      alert("Login successful (validation passed)");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>
          Welcome to <span>Tracebox</span>
        </h1>
        <p className="subtitle">Login in to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={emailError ? "error" : ""}
            />
            {emailError && (
              <div className="error-message">
                Please enter a valid email address.
              </div>
            )}
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={passwordError ? "error" : ""}
            />
            {passwordError && (
              <div className="error-message">
                Password must be 8+ chars, include uppercase, lowercase, number & special character.
              </div>
            )}
          </div>

          <div className="remember">
            <input type="checkbox" />
            <label>Remember Me</label>
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        <div className="forgot">
          <a href="#">Forgot Password?</a>
        </div>
        <div className="bottom-link">
          Don't have an account? <Link to="/Signup">Signup</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
