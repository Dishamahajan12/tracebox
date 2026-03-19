import styles from './PageHeader.module.css';

function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className={styles.header}>
      <div className={styles.content}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
