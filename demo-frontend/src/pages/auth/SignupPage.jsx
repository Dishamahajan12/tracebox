import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { useAuth } from '../../hooks/useAuth';
import { useFormFields } from '../../hooks/useFormFields';
import { getApiErrorMessage, getValidationErrors } from '../../utils/errors';
import styles from './AuthPage.module.css';

function SignupPage() {
  const { signup } = useAuth();
  const { values, updateField } = useFormFields({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validateForm() {
    const nextErrors = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    if (values.password.length > 0 && values.password.length < 8) {
      nextErrors.password = 'Password should be at least 8 characters.';
    }

    if (values.password !== values.confirmPassword) {
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
      await signup({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
    } catch (error) {
      setErrors(getValidationErrors(error));
      setSubmitError(getApiErrorMessage(error, 'Unable to create your account.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Get started</span>
          <h2 className={styles.title}>Create your TraceBox account</h2>
          <p className={styles.description}>Set up your workspace access and jump straight into projects and delivery.</p>
        </div>

        {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <InputField
            autoComplete="name"
            error={errors.fullName}
            label="Full name"
            name="fullName"
            onChange={updateField}
            placeholder="Ariana Patel"
            required
            value={values.fullName}
          />
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
            autoComplete="new-password"
            error={errors.password}
            label="Password"
            name="password"
            onChange={updateField}
            placeholder="Create a secure password"
            required
            type="password"
            value={values.password}
          />
          <InputField
            autoComplete="new-password"
            error={errors.confirmPassword}
            label="Confirm password"
            name="confirmPassword"
            onChange={updateField}
            placeholder="Repeat your password"
            required
            type="password"
            value={values.confirmPassword}
          />

          <Button fullWidth loading={submitting} size="lg" type="submit">
            Create Account
          </Button>
        </form>

        <div className={styles.footer}>
          <span>
            Already have an account?{' '}
            <Link className="text-link" to="/login">
              Sign in
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
