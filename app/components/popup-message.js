import styles from "./popup-message.module.css";
import useStateStore from "../stateManager";
import { useEffect, useRef } from "react";

export default function PopupMessage({ message }) {
  const { id, title, body, type, duration } = message;
  const barRef = useRef(null);

  // Define styles based on message type
  const messageStyles = {
    error: styles.errorMessage,
    warning: styles.warningMessage,
    info: styles.infoMessage,
  };

  // Animate the bar when the component mounts
  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.animationDuration = `${duration}s`;
    }
  }, [duration]);

  return (
    <div className={`${styles.message} ${messageStyles[type]}`}>
      {/* Horizontal Bar */}
      <div
        ref={barRef}
        className={`${styles.messageBar} ${messageStyles[type]}`} // Apply the same class as the message
      ></div>

      {/* Message Content */}
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