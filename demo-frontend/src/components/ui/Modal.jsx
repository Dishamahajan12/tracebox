import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import styles from './Modal.module.css';

function Modal({ isOpen, onClose, title, description, children, showCloseButton = true }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.header}>
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          {showCloseButton ? (
            <Button aria-label="Close modal" onClick={onClose} size="sm" variant="ghost">
              Close
            </Button>
          ) : null}
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
