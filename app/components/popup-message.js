import styles from "./popup-message.module.css";
import useStateStore from "../stateManager";

export default function PopupMessage({ message }) {
  const { id, title, body, type } = message;

  // Define styles based on message type
  const messageStyles = {
    error: styles.errorMessage,
    warning: styles.warningMessage,
    info: styles.infoMessage,
  };

  return (
    <div className={`${styles.message} ${messageStyles[type]}`}>
      <div className={styles.messageHeader}>
        <h4>{title}</h4>
        <button
          className={styles.closeButton}
          onClick={() => {
            useStateStore.getState().expireMessage(id);
          }}
        >
          ✕
        </button>
      </div>
      <div className={styles.messageBody}>{body}</div>
    </div>
  );
}
