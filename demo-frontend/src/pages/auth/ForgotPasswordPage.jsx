import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { useFormFields } from '../../hooks/useFormFields';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';
import { getApiErrorMessage, getValidationErrors } from '../../utils/errors';
import { savePasswordResetState } from '../../utils/storage';
import styles from './AuthPage.module.css';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const { values, updateField } = useFormFields({
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!values.email.trim()) {
      setErrors({ email: 'Email is required.' });
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      setSubmitError('');
      await authService.forgotPassword({ email: values.email.trim() });
      savePasswordResetState({ email: values.email.trim(), otp: '' });
      showSuccess('OTP sent', 'Check your inbox for the password reset code.');
      navigate('/verify-otp');
    } catch (error) {
      setErrors(getValidationErrors(error));
      setSubmitError(getApiErrorMessage(error, 'Unable to send the OTP.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Recover access</span>
          <h2 className={styles.title}>Forgot your password?</h2>
          <p className={styles.description}>We’ll send a one-time code so you can verify your identity and set a new password.</p>
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

          <Button fullWidth loading={submitting} size="lg" type="submit">
            Send OTP
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

export default ForgotPasswordPage;
