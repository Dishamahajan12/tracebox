import { Link } from 'react-router-dom';
import styles from './Button.module.css';

function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon = null,
  className = '',
  to,
  href,
  disabled = false,
  type = 'button',
  ...rest
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span>{loading ? 'Working...' : children}</span>
    </>
  );

  if (to) {
    return (
      <Link className={classes} to={to} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a className={classes} href={href} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} type={type} {...rest}>
      {content}
    </button>
  );
}

export default Button;
