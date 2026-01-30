import { useEffect, useState } from "react";

type Props = {
  targetTime: number;
};

function MatchesTimer({ targetTime }: Props) {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(targetTime - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  if (timeLeft <= 0) {
    return (
      <h2 className="mb-4 mb-lg-5 text-primary fw-bold text-center text-lg-start">
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
      Ends in : {days}d {hours}h {minutes}m {seconds}s
    </h2>
  );
}

export default MatchesTimer;
