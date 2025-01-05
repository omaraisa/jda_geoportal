import { useEffect } from "react";
import useStateStore from "../stateManager";
import PopupMessage from "./popup-message";
import styles from "./popup-message.module.css";

export default function MessagesContainer() {
  const messages = useStateStore((state) => state.messages);
  const removeMessage = useStateStore((state) => state.removeMessage);

  useEffect(() => {
    // Remove expired messages after their animation ends
    const interval = setInterval(() => {
      Object.values(messages).forEach((message) => {
        if (message.expired) {
          removeMessage(message.id);
        }
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [messages, removeMessage]);

  return (
    <div className={styles.messagesContainer}>
      {Object.values(messages).map((message) =>
        !message.expired ? (
          <PopupMessage key={message.id} message={message} />
        ) : null
      )}
    </div>
  );
}
