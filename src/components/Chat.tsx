import React, { useState } from "react";
import styles from "./styles/Chat.module.css";

type Message = {
  id: string;
  text: string;
  sender: string;
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hello 👋", sender: "Abhishek" },
    { id: "2", text: "Hi bro!", sender: "Ravi" },
  ]);

  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "You",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>Chat</div>

      <div className={styles.messages}>
        {messages.map((msg) => (
          <div key={msg.id} className={styles.message}>
            <span className={styles.sender}>{msg.sender}</span>
            <span className={styles.text}>{msg.text}</span>
          </div>
        ))}
      </div>

      <div className={styles.inputContainer}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className={styles.input}
        />
        <button onClick={handleSend} className={styles.sendBtn}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;