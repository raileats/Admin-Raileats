"use client";

import React from "react";
import RestroEditModal from "@/components/RestroEditModal";

type Props = {
  onClose: () => void;
};

export default function AddNewRestroModal({ onClose }: Props) {
  return (
    <RestroEditModal
      restro={null}                // 🔥 IMPORTANT: null = NEW RESTRO
      onClose={onClose}
      initialTab="Basic Information"
    />
  );
}

