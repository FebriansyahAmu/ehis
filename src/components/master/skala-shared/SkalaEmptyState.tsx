"use client";

import type { LucideIcon } from "lucide-react";
import {
  MasterEmptyState, type MasterAccent,
} from "@/components/master/shared";

interface Props {
  accent: MasterAccent;
  icon: LucideIcon;
  title: string;
  description: string;
  totalItem: number;
  totalLabel: string;
  addLabel: string;
  onAddNew: () => void;
}

export default function SkalaEmptyState({
  accent, icon, title, description, totalItem, totalLabel, addLabel, onAddNew,
}: Props) {
  return (
    <MasterEmptyState
      accent={accent}
      icon={icon}
      title={title}
      description={description}
      totalCount={totalItem}
      totalLabel={totalLabel}
      onAddNew={onAddNew}
      addLabel={addLabel}
    />
  );
}
