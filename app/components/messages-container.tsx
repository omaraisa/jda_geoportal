import { useEffect } from "react";
import useStateStore from "@/stateStore";
import PopupMessage from "./ui/popup-message";
import styles from "./ui/popup-message.module.css";
import {Message} from "@/interface";

export default function MessagesContainer() {
  const { language, messages, removeMessage } = useStateStore();

  useEffect(() => {
    const interval = setInterval(() => {
      Object.values(messages).forEach((message) => {
        const msg = message as Message; 
        if (msg.expired) {
          removeMessage(Number(msg.id));
        }
      });
    }, 1000); 

    return () => clearInterval(interval);
  }, [messages, removeMessage]);

  return (
    <div
      className={styles.messagesContainer}
      style={{ left: language === "en" ? "20%" : "auto", right: language === "ar" ? "20%" : "auto" }}
    >
      {Object.values(messages).map((message) => {
        const msg = message as Message; 
        return !msg.expired ? <PopupMessage key={msg.id} message={msg} /> : null;
      })}
    </div>
  );
}
