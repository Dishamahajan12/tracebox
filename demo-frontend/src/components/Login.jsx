import React, { useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  const handleSubmit = async (e) => {
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

    if (!valid) return;

    try {
      const response = await fetch("http://localhost:8081/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const message = await response.text();
      setLoginMessage(message);

      if (message === "Login successful") {
        navigate("/home");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginMessage("Error connecting to backend");
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

        {loginMessage && (
          <div className="error-message" style={{ marginTop: "10px" }}>
            {loginMessage}
          </div>
        )}

        <div className="forgot">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <div className="bottom-link">
          Don't have an account? <Link to="/Signup">Signup</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;