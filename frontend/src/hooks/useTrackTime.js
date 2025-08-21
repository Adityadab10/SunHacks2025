import { useEffect, useRef } from "react";
import { sendSessionData } from "../services/userService";

function useTrackTime(userId) {
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!userId) return; // only track if logged in

    startTimeRef.current = Date.now();

    const handleBeforeUnload = () => {
      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - startTimeRef.current) / 1000); // in seconds
      if (timeSpent > 0) {
        sendSessionData(userId, timeSpent);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId]);
}

export default useTrackTime;
