import { useEffect, useState } from "react";

interface CountdownTimerProps {
  startTime: string | null;
  endTime: string | null;
  status: string;
}

export default function CountdownTimer({ startTime, endTime, status }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (status === "finished") {
      setTimeLeft("TOURNAMENT ENDED");
      return;
    }

    // Convert PostgreSQL timestamp to valid ISO string
    const parsePostgresTimestamp = (timestamp: string | null): number | null => {
      if (!timestamp) return null;
      
      // Convert '2026-05-18 14:48:00+00' → '2026-05-18T14:48:00+00:00'
      let isoString = timestamp.replace(' ', 'T');
      
      // Ensure timezone format is valid (+00 → +00:00)
      if (isoString.match(/[+-]\d{2}$/)) {
        isoString = isoString.replace(/([+-]\d{2})$/, '$1:00');
      }
      
      const date = new Date(isoString);
      const timeMs = date.getTime();
      
      console.log('Parsing:', timestamp, '→', isoString, '→', timeMs, 'Valid:', !isNaN(timeMs));
      
      return isNaN(timeMs) ? null : timeMs;
    };

    const calculateTime = () => {
      const now = new Date().getTime();
      const start = parsePostgresTimestamp(startTime);
      const end = parsePostgresTimestamp(endTime);

      console.log('Now:', new Date(now).toISOString());
      console.log('Start:', start ? new Date(start).toISOString() : null);
      console.log('End:', end ? new Date(end).toISOString() : null);

      let targetTime = null;
      let label = "";

      if (start && now < start) {
        targetTime = start;
        label = "STARTS IN: ";
      } else if (end && now < end) {
        targetTime = end;
        label = "ENDS IN: ";
      } else {
        setTimeLeft("WRAPPING UP...");
        return;
      }

      const difference = targetTime - now;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      let timeString = `${hours}h ${minutes}m ${seconds}s`;
      if (days > 0) {
        timeString = `${days}d ${timeString}`;
      }

      setTimeLeft(`${label}${timeString}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime, status]);

  return <div className="timer-countdown-text">{timeLeft}</div>;
}