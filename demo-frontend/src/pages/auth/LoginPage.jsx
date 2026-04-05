import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { useAuth } from '../../hooks/useAuth';
import { useFormFields } from '../../hooks/useFormFields';
import { getApiErrorMessage, getValidationErrors } from '../../utils/errors';
import styles from './AuthPage.module.css';

function LoginPage() {
  const { login } = useAuth();
  const { values, updateField } = useFormFields({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validateForm() {
    const nextErrors = {};

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.';
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
      await login(values);
    } catch (error) {
      setErrors(getValidationErrors(error));
      setSubmitError(getApiErrorMessage(error, 'Unable to sign in right now.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Welcome back</span>
          <h2 className={styles.title}>Sign in to TraceBox</h2>
          <p className={styles.description}>Pick up your projects, tickets, and team updates right where you left them.</p>
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
            autoComplete="current-password"
            error={errors.password}
            label="Password"
            name="password"
            onChange={updateField}
            placeholder="Enter your password"
            required
            type="password"
            value={values.password}
          />

          <Button fullWidth loading={submitting} size="lg" type="submit">
            Sign In
          </Button>
        </form>

        <div className={styles.links}>
          <Link className="text-link" to="/forgot-password">
            Forgot password?
          </Link>
          <span>
            New here?{' '}
            <Link className="text-link" to="/signup">
              Create an account
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
