import styles from './StatCard.module.css';

function StatCard({ label, value, detail, accent = 'default' }) {
  return (
    <article className={[styles.card, styles[accent]].join(' ')}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
      {detail ? <span className={styles.detail}>{detail}</span> : null}
    </article>
  );
}

export default StatCard;
