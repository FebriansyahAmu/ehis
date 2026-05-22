/**
 * Master Template Layer — public API barrel.
 *
 * Pemakaian:
 *   import {
 *     MasterPageLayout, MasterListPanel, MasterDetailPanel,
 *     MasterEmptyState, MasterTabNav, StatCard,
 *     Field, TextInput, NumberInput, TextArea, Select, ToggleSwitch, ChipToggle, SectionGroup,
 *     useMasterCrud, useSkeletonDelay,
 *     getAccent, type MasterAccent,
 *   } from "@/components/master/shared";
 */

// ── Layout components ───────────────────────────────────
export { default as MasterPageLayout, StatCard } from "./MasterPageLayout";
export type { MasterPageLayoutProps, StatCardProps, StatTone } from "./MasterPageLayout";

export { default as MasterListPanel } from "./MasterListPanel";
export type { MasterListPanelProps } from "./MasterListPanel";

export { default as MasterDetailPanel } from "./MasterDetailPanel";
export type { MasterDetailPanelProps } from "./MasterDetailPanel";

export { default as MasterEmptyState } from "./MasterEmptyState";
export type { MasterEmptyStateProps } from "./MasterEmptyState";

export { default as MasterTabNav } from "./MasterTabNav";
export type { MasterTabNavProps, MasterTab } from "./MasterTabNav";

// ── Form primitives ─────────────────────────────────────
export {
  Field, TextInput, NumberInput, TextArea, Select,
  ToggleSwitch, ChipToggle, SectionGroup,
} from "./FormPrimitives";
export type {
  FieldProps, TextInputProps, NumberInputProps, TextAreaProps,
  SelectProps, SelectOption, ToggleSwitchProps, ChipToggleProps,
  SectionGroupProps,
} from "./FormPrimitives";

// ── Hooks ───────────────────────────────────────────────
export { useMasterCrud, useSkeletonDelay } from "./useMasterCrud";
export type { UseMasterCrudOptions, UseMasterCrudReturn } from "./useMasterCrud";

// ── Accent system ───────────────────────────────────────
export {
  ACCENT_MAP, getAccent,
  EMPTY_GRADIENT, EMPTY_ICON_RING,
  SEARCH_FOCUS_WITHIN, ADD_CTA_HOVER, ADD_CTA_BORDER,
} from "./masterAccent";
export type { MasterAccent, AccentClasses } from "./masterAccent";

// ── Cross-module bridge ─────────────────────────────────
export { default as MappingSourceBadge } from "./MappingSourceBadge";
