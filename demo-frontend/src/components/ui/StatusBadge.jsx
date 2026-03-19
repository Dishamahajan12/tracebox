import { humanizeEnum } from '../../utils/formatters';
import styles from './StatusBadge.module.css';

function resolveTone(value) {
  if (!value) {
    return 'neutral';
  }

  if (['DONE', 'ACTIVE', 'PROJECT_OWNER', 'SUPER_ADMIN'].includes(value)) {
    return 'success';
  }

  if (['IN_PROGRESS', 'PROJECT_ADMIN', 'ADMIN'].includes(value)) {
    return 'info';
  }

  if (['HIGH', 'CRITICAL', 'ARCHIVED'].includes(value)) {
    return 'danger';
  }

  if (['IN_REVIEW', 'MEDIUM', 'MEMBER'].includes(value)) {
    return 'warning';
  }

  return 'neutral';
}

function StatusBadge({ value, children }) {
  const label = children || humanizeEnum(value);

  return <span className={[styles.badge, styles[resolveTone(value)]].join(' ')}>{label}</span>;
}

export default StatusBadge;
