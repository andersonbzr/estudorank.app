"use client";
import React from "react";

export default function CircularProgress({
  value,
  size = 96,
  strokeWidth = 10,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="transform -rotate-90" // 🟢 Faz o círculo começar no topo
    >
      {/* Trilha (fundo) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        strokeWidth={strokeWidth}
        className="stroke-accent-20"
      />
      {/* Progresso */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="stroke-accent"
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 300ms ease" }}
      />
    </svg>
  );
}
