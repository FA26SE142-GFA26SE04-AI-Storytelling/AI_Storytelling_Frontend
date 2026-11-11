"use client";

import type { LucideIcon } from "lucide-react";
import InfoTip from "@/app/components/InfoTip";
import { usePop } from "@/app/lib/motion";
import "./StatCard.css";

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  info,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  info?: string;
  tone?: "default" | "gold";
}) {
  const valueRef = usePop<HTMLElement>(value);
  const className = tone === "gold" ? "ce-stat stat-card stat-card-gold" : "ce-stat stat-card";

  return (
    <div className={className}>
      <span className="ce-stat-ic">
        <Icon aria-hidden />
      </span>
      <small className="ce-stat-name">
        {label}
        {info ? <InfoTip text={info} /> : null}
      </small>
      <b ref={valueRef} className="stat-value">
        {value}
      </b>
      {sub ? <span className="ce-stat-sub">{sub}</span> : null}
    </div>
  );
}
