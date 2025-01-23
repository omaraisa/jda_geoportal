import { useEffect } from "react";
import useStateStore from "../stateManager";
import PopupMessage from "./popup-message";
import styles from "./popup-message.module.css";

export default function MessagesContainer() {
  const {language ,messages ,removeMessage} = useStateStore();

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
    <div
      className={styles.messagesContainer}
      style={{ right: language === "en" ? 0 : "auto", left: language === "ar" ? 0 : "auto" }}
    >
      {Object.values(messages).map((message) =>
        !message.expired ? (
          <PopupMessage key={message.id} message={message} />
        ) : null
      )}
    </div>
  );
}
