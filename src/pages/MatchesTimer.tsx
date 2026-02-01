import { useEffect, useState } from "react";

type Props = {
  targetTime: number;
};

function MatchesTimer({ targetTime }: Props) {
  // Use Math.max to prevent negative values during the initial render
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, targetTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = targetTime - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  if (timeLeft <= 0) {
    return (
      <h2 className="mb-4 mb-lg-5 text-danger fw-bold text-center text-lg-start">
        All matches played
      </h2>
    );
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <h2 className="mb-4 mb-lg-5 text-primary fw-bold text-center text-lg-start">
      Ends in : {days > 0 && `${days}d `}{hours}h {minutes}m {seconds}s
    </h2>
  );
}

export default MatchesTimer;