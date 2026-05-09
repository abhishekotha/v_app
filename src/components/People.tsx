import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import styles from "./styles/People.module.css";

const People = () => {
  const participants = useSelector(
    (state: RootState) => state.Participants
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>People</div>

      <div className={styles.list}>
        {participants.map((user) => (
          <div key={user.userId} className={styles.item}>
            <div className={styles.left}>
              <div className={styles.avatar}>
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.userName} />
                ) : (
                  <span>
                    {user.userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className={styles.info}>
                <span className={styles.name}>
                  {user.userName}
                </span>
                <span className={styles.email}>
                  {user.email}
                </span>
              </div>
            </div>

            <div className={styles.right}>
              <span>{user.isMuted ? "🔇" : "🎤"}</span>
              <span>{user.isVideoOn ? "📹" : "🚫"}</span>
              <span className={styles.menu}>⋮</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default People;