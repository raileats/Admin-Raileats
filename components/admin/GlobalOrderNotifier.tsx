"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseNotify = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GlobalOrderNotifier() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderIdRef = useRef<string>("");

  const playSound = async () => {
    try {
      const audio = audioRef.current || new Audio("/sounds/new-order.mp3");
      audioRef.current = audio;
      audio.volume = 1;
      audio.muted = false;
      audio.currentTime = 0;
      await audio.play();
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

      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 1);
    } catch {}
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

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const unlock = async () => {
      try {
        if (!audioRef.current) return;
        audioRef.current.muted = true;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.muted = false;
        console.log("GLOBAL AUDIO UNLOCKED");
      } catch {}
    };

    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    const checkLatestOrder = async (playIfNew: boolean) => {
      const { data, error } = await supabaseNotify
        .from("Orders")
        .select("id, customerName, CustomerName, stationName, StationName, CreatedAt, createdAt")
        .order("CreatedAt", { ascending: false })
        .limit(1);

      if (error) {
        console.log("GLOBAL ORDER POLL ERROR:", error.message);
        return;
      }

      const latest = data?.[0];
      if (!latest?.id) return;

      const latestId = String(latest.id);
      const savedId = localStorage.getItem("raileats_last_seen_order_id") || "";

      if (!lastOrderIdRef.current) {
        lastOrderIdRef.current = savedId || latestId;
        localStorage.setItem("raileats_last_seen_order_id", lastOrderIdRef.current);
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
      .channel("global-admin-orders-insert-final")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Orders" },
        async (payload) => {
          console.log("GLOBAL REALTIME ORDER:", payload);

          const latestId = String(payload.new?.id || "");
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
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return null;
}
