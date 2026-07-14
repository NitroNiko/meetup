import avatarUrl from "../assets/maxchen-avatar.svg";

interface AvatarProps {
  mood: "idle" | "listening" | "speaking" | "thinking";
}

const moodLabel = {
  idle: "Standby",
  listening: "Ich höre zu",
  speaking: "Ich antworte",
  thinking: "Analyse läuft",
};

export function Avatar({ mood }: AvatarProps) {
  return (
    <section className={`avatar-card ${mood}`} aria-label="Mäxchen Avatar">
      <div className="orbital-ring" />
      <img src={avatarUrl} alt="Mäxchen Avatar" />
      <div className="avatar-status">
        <span />
        {moodLabel[mood]}
      </div>
    </section>
  );
}

