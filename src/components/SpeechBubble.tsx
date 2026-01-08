import { useEffect, useState } from "react";

// Фрази для мовних бульбашок
const phrases = [
  "Доброго ранку! Час взяти життя під контроль.",
  "Ще один день, ще один крок вперед. Рухайся!",
  "Прокрастинація — ворог. Атакуй зараз!",
  "Діаманти самі себе не добудуть, чемпіоне.",
  "Твій майбутній я подякує... можливо.",
  "Стрес тимчасовий, слава вічна.",
  "Рухайся, дій, перемагай — повторюй.",
  "Перевір квести, перш ніж вони перевірять тебе.",
  "Малі перемоги перетворюються на легенди.",
  "Ти це зможеш!",
  "Це складне, але воно того варте.",
  "Провал не смертельний, ігнорування — так.",
  "Фокус зараз, слава пізніше.",
  "XP чекає, не затримуйся.",
  "Малі кроки = великі результати.",
  "Діаманти сяють для старанних."
];

interface SpeechBubbleProps {
  type?: "main" | "quest";
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ type = "main", className = "" }) => {
  const [currentPhrase, setCurrentPhrase] = useState(phrases[0]);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Змінюємо фразу кожні 2-3 години
    const interval = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        setCurrentPhrase(randomPhrase);
        setFade(false);
      }, 300);
    }, 2 * 60 * 60 * 1000); // 2 години

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`gl-speech-bubble ${className} ${fade ? "gl-fade-out" : "gl-fade-in"}`}>
      <div className="gl-speech-bubble-content">
        {currentPhrase}
      </div>
      <div className="gl-speech-bubble-tail"></div>
    </div>
  );
};
