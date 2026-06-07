"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseNotify = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GlobalOrderNotifier() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/new-order.mp3");
        audioRef.current.preload = "auto";
        audioRef.current.volume = 1;
      }

      audioRef.current.muted = false;
      audioRef.current.volume = 1;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (e) {
      console.log("MP3 failed", e);
    }

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      const ctx = new AudioContextClass();
      await ctx.resume();

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.9);
    } catch (e) {
      console.log("Fallback beep failed", e);
    }
  };

  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 1;

    const unlockAudio = async () => {
      try {
        if (!audioRef.current) return;

        audioRef.current.muted = true;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.muted = false;

        console.log("GLOBAL AUDIO UNLOCKED");
      } catch (e) {
        console.log("Audio unlock failed", e);
      }
    };

    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const channel = supabaseNotify
      .channel("global-admin-orders-insert-v1")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Orders" },
        async (payload) => {
          console.log("GLOBAL ORDER INSERT:", payload);

          await playSound();

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🚆 New RailEats Order", {
              body: `${payload.new?.customerName || "Customer"} • ${
                payload.new?.stationName || ""
              }`,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("GLOBAL ORDER CHANNEL:", status);
      });

    return () => {
      supabaseNotify.removeChannel(channel);
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  return null;
}
