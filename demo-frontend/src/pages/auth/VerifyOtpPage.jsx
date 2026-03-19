import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { useFormFields } from '../../hooks/useFormFields';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';
import { getApiErrorMessage, getValidationErrors } from '../../utils/errors';
import { loadPasswordResetState, savePasswordResetState } from '../../utils/storage';
import styles from './AuthPage.module.css';

function VerifyOtpPage() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const resetState = loadPasswordResetState();
  const { values, updateField } = useFormFields({
    email: resetState.email || '',
    otp: resetState.otp || '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!values.otp.trim()) {
      nextErrors.otp = 'OTP is required.';
    }

    setErrors(nextErrors);
    setSubmitError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      await authService.verifyOtp({
        email: values.email.trim(),
        otp: values.otp.trim(),
      });
      savePasswordResetState({
        email: values.email.trim(),
        otp: values.otp.trim(),
      });
      showSuccess('OTP verified', 'You can now create your new password.');
      navigate('/reset-password');
    } catch (error) {
      setErrors(getValidationErrors(error));
      setSubmitError(getApiErrorMessage(error, 'Unable to verify the OTP.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Verify OTP</span>
          <h2 className={styles.title}>Enter your reset code</h2>
          <p className={styles.description}>Use the OTP sent to your email to confirm the password reset request.</p>
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
            hint="Use the code from your inbox."
            label="OTP"
            name="otp"
            onChange={updateField}
            placeholder="Enter 6-digit code"
            required
            value={values.otp}
          />

          <Button fullWidth loading={submitting} size="lg" type="submit">
            Verify OTP
          </Button>
        </form>

        <div className={styles.footer}>
          <Link className="text-link" to="/forgot-password">
            Need a new code?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtpPage;
