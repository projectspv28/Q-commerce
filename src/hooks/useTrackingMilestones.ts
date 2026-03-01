"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getSocket } from "@/lib/socket";

export default function useTrackingMilestones(
  orderId: string,
  fallback?: { latitude: number; longitude: number }
) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [location, setLocation] = useState(fallback);

  useEffect(() => {
    if (!orderId) return;
    axios
      .get(`/api/user/tracking/${orderId}`)
      .then((res) => {
        setTimeline(res.data.timeline || []);
        const last = res.data.timeline?.at(-1)?.positionHint;
        if (last) setLocation(last);
      })
      .catch(console.log);
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    socket.emit("join-room", orderId);
    socket.on("tracking-milestone", (ev: any) => {
      if (ev.orderId?.toString() === orderId) {
        setTimeline((prev) => [...prev, ev]);
        if (ev.positionHint) setLocation(ev.positionHint);
      }
    });
    return () => {
      socket.off("tracking-milestone");
    };
  }, [orderId]);

  return { timeline, location };
}
