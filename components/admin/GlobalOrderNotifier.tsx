"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseNotify = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GlobalOrderNotifier() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastOrderIdRef = useRef<string>("");
  const [soundEnabled, setSoundEnabled] = useState(false);

  const enableSoundAndNotification = async () => {
    try {
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      await audioCtxRef.current.resume();

      const audio = audioRef.current || new Audio("/sounds/new-order.mp3");
      audioRef.current = audio;
      audio.preload = "auto";
      audio.volume = 1;
      audio.muted = true;

      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;

      setSoundEnabled(true);
      localStorage.setItem("raileats_admin_sound_enabled", "1");

      console.log("SOUND AND NOTIFICATION ENABLED");
      alert("Notification sound enabled");
    } catch (e) {
      console.log("Enable sound failed", e);
      alert("Sound enable failed. Please click again.");
    }
  };

  const playSound = async () => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      await audioCtxRef.current.resume();

      const oscillator = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      oscillator.type = "square";
      oscillator.frequency.value = 1000;

      gain.gain.setValueAtTime(1, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(1, audioCtxRef.current.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtxRef.current.currentTime + 1.2
      );

      oscillator.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      oscillator.start();
      oscillator.stop(audioCtxRef.current.currentTime + 1.2);

      console.log("BEEP PLAYED");
    } catch (e) {
      console.log("BEEP FAILED", e);
    }

    try {
      const audio = audioRef.current || new Audio("/sounds/new-order.mp3");
      audioRef.current = audio;

      audio.volume = 1;
      audio.muted = false;
      audio.currentTime = 0;

      await audio.play();

      console.log("MP3 PLAYED");
    } catch (e) {
      console.log("MP3 FAILED", e);
    }
  };

  const notifyOrder = async (order: any) => {
    await playSound();

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚆 New RailEats Order", {
        body: `${order?.customerName || order?.CustomerName || "Customer"} • ${
          order?.stationName || order?.StationName || ""
        }`,
      });
    }
  };

  useEffect(() => {
    console.log("GLOBAL NOTIFIER MOUNTED");

    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 1;

    if (localStorage.getItem("raileats_admin_sound_enabled") === "1") {
      setSoundEnabled(true);
    }

    const checkLatestOrder = async (playIfNew: boolean) => {
      const { data, error } = await supabaseNotify
        .from("Orders")
        .select(
          "OrderId, customerName, CustomerName, stationName, StationName, CreatedAt, createdAt"
        )
        .order("CreatedAt", { ascending: false })
        .limit(1);

      if (error) {
        console.log("GLOBAL ORDER POLL ERROR:", error.message);
        return;
      }

      const latest = data?.[0];
      const latestId = String(latest?.OrderId || "");
      if (!latestId) return;

      const savedId = localStorage.getItem("raileats_last_seen_order_id") || "";

      if (!lastOrderIdRef.current) {
        lastOrderIdRef.current = savedId || latestId;
        localStorage.setItem(
          "raileats_last_seen_order_id",
          lastOrderIdRef.current
        );
        return;
      }

      if (playIfNew && latestId !== lastOrderIdRef.current) {
        lastOrderIdRef.current = latestId;
        localStorage.setItem("raileats_last_seen_order_id", latestId);
        await notifyOrder(latest);
      }
    };

    checkLatestOrder(false);

    const interval = window.setInterval(() => {
      checkLatestOrder(true);
    }, 10000);

    const channel = supabaseNotify
      .channel("global-admin-orders-insert-final-v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Orders" },
        async (payload) => {
          console.log("GLOBAL REALTIME ORDER:", payload);

          const latestId = String(payload.new?.OrderId || "");
          if (latestId && latestId !== lastOrderIdRef.current) {
            lastOrderIdRef.current = latestId;
            localStorage.setItem("raileats_last_seen_order_id", latestId);
            await notifyOrder(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log("GLOBAL ORDER CHANNEL:", status);
      });

    return () => {
      window.clearInterval(interval);
      supabaseNotify.removeChannel(channel);
    };
  }, []);

  if (soundEnabled) return null;

  return (
    <button
      type="button"
      onClick={enableSoundAndNotification}
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 99999,
        background: "#16a34a",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "10px 14px",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
      }}
    >
      🔊 Enable Sound
    </button>
  );
}
