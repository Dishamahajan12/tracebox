import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { useFormFields } from '../../hooks/useFormFields';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';
import { getApiErrorMessage, getValidationErrors } from '../../utils/errors';
import { clearPasswordResetState, loadPasswordResetState } from '../../utils/storage';
import styles from './AuthPage.module.css';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const resetState = loadPasswordResetState();
  const { values, updateField } = useFormFields({
    email: resetState.email || '',
    otp: resetState.otp || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validateForm() {
    const nextErrors = {};

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!values.otp.trim()) {
      nextErrors.otp = 'OTP is required.';
    }

    if (!values.newPassword.trim()) {
      nextErrors.newPassword = 'New password is required.';
    }

    if (values.newPassword.length > 0 && values.newPassword.length < 8) {
      nextErrors.newPassword = 'Password should be at least 8 characters.';
    }

    if (values.newPassword !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForm();

    setErrors(nextErrors);
    setSubmitError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      await authService.resetPassword({
        email: values.email.trim(),
        otp: values.otp.trim(),
        newPassword: values.newPassword,
      });
      clearPasswordResetState();
      showSuccess('Password updated', 'You can now sign in with your new password.');
      navigate('/login');
    } catch (error) {
      setErrors(getValidationErrors(error));
      setSubmitError(getApiErrorMessage(error, 'Unable to reset your password.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Reset password</span>
          <h2 className={styles.title}>Choose a new password</h2>
          <p className={styles.description}>Finish the reset flow with your verified OTP and a fresh password.</p>
        </div>

        {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <InputField
            autoComplete="email"
            error={errors.email}
            label="Email"
            name="email"
            onChange={updateField}
            placeholder="you@company.com"
            required
            type="email"
            value={values.email}
          />
          <InputField
            error={errors.otp}
            label="OTP"
            name="otp"
            onChange={updateField}
            placeholder="Enter your code"
            required
            value={values.otp}
          />
          <InputField
            autoComplete="new-password"
            error={errors.newPassword}
            label="New password"
            name="newPassword"
            onChange={updateField}
            placeholder="Create a new password"
            required
            type="password"
            value={values.newPassword}
          />
          <InputField
            autoComplete="new-password"
            error={errors.confirmPassword}
            label="Confirm password"
            name="confirmPassword"
            onChange={updateField}
            placeholder="Repeat new password"
            required
            type="password"
            value={values.confirmPassword}
          />

          <Button fullWidth loading={submitting} size="lg" type="submit">
            Update Password
          </Button>
        </form>

        <div className={styles.footer}>
          <Link className="text-link" to="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
