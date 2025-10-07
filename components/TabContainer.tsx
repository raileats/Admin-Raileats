"use client";

import React from "react";

type TabItem = {
  key: string; // unique string (eg. "Basic Information")
  label: string;
  icon?: React.ReactNode;
};

type Props = {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  // optional header text shown above children (centered)
  header?: string | null;
  // optional thin border under tabs
  showDivider?: boolean;
  // children -> current tab content
  children?: React.ReactNode;
};

const IconSet = {
  basic: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M12 2L3 6v6c0 5 3.8 9.2 9 10 5.2-.8 9-5 9-10V6l-9-4z" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2.1-1.6-1.9-3.3-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-6l-.4 3.1a7.6 7.6 0 0 0-1.7 1l-2.5-1L2 11.4l2.1 1.6a7.9 7.9 0 0 0 0 2l-2.1 1.6 1.9 3.3 2.5-1a7.6 7.6 0 0 0 1.7 1L9 21h6l.4-3.1a7.6 7.6 0 0 0 1.7-1l2.5 1 1.9-3.3L19.4 15z" />
    </svg>
  ),
  docs: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    </svg>
  ),
  contacts: (
    <svg width="1
