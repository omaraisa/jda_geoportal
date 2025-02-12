import { useEffect, useRef } from "react";
import useStateStore from "@/stateStore";
import styles from "./popup-message.module.css";
import {Message} from "@/interface";

interface PopupMessageProps {
  message: Message;
}

export default function PopupMessage({ message }: PopupMessageProps) {
  const { id, title, body, type, duration } = message;
  const barRef = useRef<HTMLDivElement | null>(null);

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
          className="close-btn flex items-center justify-center"
          onClick={() => {
            useStateStore.getState().expireMessage(Number(id));
          }}
        >
          ✕
        </button>
      </div>
      <div className={styles.messageBody}>{body}</div>
    </div>
  );
}
