import React, { useState } from "react";
import "./ForgetPassword.css";
import { Link, useNavigate } from "react-router-dom";

function ForgetPassword() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userError, setUserError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  const emailValid = emailPattern.test(email);
  const newPasswordValid = passwordPattern.test(newPassword);
  const confirmPasswordValid =
    confirmPassword === newPassword && confirmPassword.length > 0;

  const handleSubmit = async (e) => {

    e.preventDefault();

    setSubmitted(true);
    setUserError("");
    setOtpError("");
    setPasswordError("");

    if (!emailValid) return;

    try {

      setLoading(true);

      const response = await fetch("http://localhost:8081/api/users/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const message = await response.text();

      if (!response.ok) {
        setUserError("User does not exist");
        setEmail("");
        setOtp("");
        setOtpSent(false);
        return;
      }

      alert("OTP sent successfully");

      setOtpSent(true);
      setOtp("");
      setOtpError("");

    } catch (error) {

      console.error(error);
      setUserError("Error connecting to backend");

    } finally {

      setLoading(false);

    }

  };

  const handleVerify = async (e) => {

    e.preventDefault();

    setOtpError("");
    setUserError("");

    if (!otp.trim()) {
      setOtpError("Please enter OTP");
      return;
    }

    if (otp.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    try {

      setLoading(true);

      const response = await fetch("http://localhost:8081/api/users/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          otp: otp
        })
      });

      const message = await response.text();

      if (!response.ok) {

        if (message === "OTP expired") {

          setOtp("");
          setOtpSent(false);
          setEmail("");
          setSubmitted(false);
          setOtpError("");
          setUserError("OTP expired. Please enter email again.");
          return;

        }

        setOtpError(message);
        return;

      }

      alert("OTP Verified Successfully!");

      setOtpVerified(true);

    } catch (error) {

      console.error(error);
      setOtpError("Error verifying OTP");

    } finally {

      setLoading(false);

    }

  };

  const handleResetPassword = async (e) => {

    e.preventDefault();

    setPasswordError("");

    if (!newPasswordValid) {

      setPasswordError(
        "Password must be 8+ chars, include uppercase, lowercase, number and special character."
      );

      return;

    }

    if (!confirmPasswordValid) {

      setPasswordError("Passwords do not match.");
      return;

    }

    try {

      setLoading(true);

      const response = await fetch("http://localhost:8081/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: newPassword
        })
      });

      const message = await response.text();

      if (!response.ok) {

        setPasswordError(message);
        return;

      }

      alert("Password updated successfully!");

      navigate("/login");

    } catch (error) {

      console.error(error);
      setPasswordError("Error resetting password");

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="forget-password-container">
      <div className="forget-password-card">

        <h1>
          Forgot <span>Password?</span>
        </h1>

        <p className="subtitle">
          Enter your email to verify your account
        </p>

        <form
          onSubmit={
            otpVerified
              ? handleResetPassword
              : otpSent
              ? handleVerify
              : handleSubmit
          }
        >

          <div className="input-group">

            <label>Email Address</label>

            <input
              type="text"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setUserError("");
              }}
              className={submitted && !emailValid && !userError ? "error" : ""}
              disabled={otpSent || otpVerified}
            />

            {submitted && !emailValid && !userError && (
              <div className="error-message">
                Please enter a valid email address.
              </div>
            )}

            {userError && (
              <div className="error-message">
                {userError}
              </div>
            )}

          </div>

          {otpSent && !otpVerified && (

            <div className="input-group">

              <label>Enter OTP</label>

              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => {

                  const value = e.target.value;

                  if (/^\d*$/.test(value)) {
                    setOtp(value);
                    setOtpError("");
                  }

                }}
              />

              <div className="otp-note">
                OTP is valid for 1 minute
              </div>

              {otpError && (
                <div className="error-message">
                  {otpError}
                </div>
              )}

            </div>

          )}

          {otpVerified && (
            <>
              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                  }}
                />
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                  }}
                />
              </div>

              {passwordError && (
                <div className="error-message">
                  {passwordError}
                </div>
              )}
            </>
          )}

          <button type="submit" className="forget-password-btn" disabled={loading}>

            {loading
              ? "Please wait..."
              : otpVerified
              ? "Reset Password"
              : otpSent
              ? "Verify OTP"
              : "Get OTP"}

          </button>

        </form>

        <div className="bottom-link">
          Back to <Link to="/login">Login</Link>
        </div>

      </div>
    </div>
  );
}

export default ForgetPassword;