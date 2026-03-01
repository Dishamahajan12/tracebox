import React, { useState } from "react";
import "./Signup.css";
import { Link } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  const nameValid = name.trim().length >= 2 && name.trim().length <= 50;
  const roleValid = role.trim().length > 0;
  const emailValid = emailPattern.test(email);
  const passwordValid = passwordPattern.test(password);
  const confirmValid = confirmPassword === password && confirmPassword.length > 0;
  

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    const allValid = nameValid && roleValid && emailValid && passwordValid && confirmValid;

    if (allValid) {
      alert("Signup successful (validation passed)");
      // Later we will call backend API here
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1>
          Create your <span>Tracebox</span> account
        </h1>
        <p className="subtitle">Start tracking bugs smarter</p>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="input-group">
            <label className="field-label">Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              maxLength={50}  
              onChange={(e) => setName(e.target.value)}
              className={submitted && !nameValid ? "error" : ""}
            />
            {submitted && !nameValid && (
              <div className="error-message">
                Name must be Minimum 2 characters and maximum 5 characters.
              </div>
            )}
          </div>

          {/* Role */}
          <div className="input-group">
            <label className="field-label">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={submitted && !roleValid ? "error" : ""}
            >
              <option value="">Select role</option>
              <option value="Tester">Tester</option>
              <option value="Developer">Developer</option>
              <option value="Lead">Lead</option>
              <option value="Manager">Manager</option>
            </select>
            {submitted && !roleValid && (
              <div className="error-message">Please select a role.</div>
            )}
          </div>

          {/* Email */}
          <div className="input-group">
            <label className="field-label">Email</label>
            <input
              type="text"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={submitted && !emailValid ? "error" : ""}
            />
            {submitted && !emailValid && (
              <div className="error-message">Please enter a valid email address.</div>
            )}
          </div>

          {/* Password */}
          <div className="input-group">
            <label className="field-label">Password</label>
            <input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={submitted && !passwordValid ? "error" : ""}
            />
            {submitted && !passwordValid && (
              <div className="error-message">
                Password must be 8+ chars, include uppercase, lowercase, number & special character.
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label className="field-label">Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={submitted && !confirmValid ? "error" : ""}
            />
            {submitted && !confirmValid && (
              <div className="error-message">Passwords do not match.</div>
            )}
          </div>

          <button type="submit" className="signup-btn">
            Create Account
          </button>
        </form>

        <div className="bottom-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;