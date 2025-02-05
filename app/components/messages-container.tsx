import { useEffect } from "react";
import useStateStore from "@/stateManager";
import PopupMessage from "./popup-message";
import styles from "./popup-message.module.css";
import {Message} from "@/interface";

export default function MessagesContainer() {
  const { language, messages, removeMessage } = useStateStore();

  useEffect(() => {
    // Remove expired messages after their animation ends
    const interval = setInterval(() => {
      Object.values(messages).forEach((message) => {
        const msg = message as Message; // Type assertion to Message
        if (msg.expired) {
          removeMessage(Number(msg.id));
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
      {Object.values(messages).map((message) => {
        const msg = message as Message; // Type assertion to Message
        return !msg.expired ? <PopupMessage key={msg.id} message={msg} /> : null;
      })}
    </div>
  );
}
