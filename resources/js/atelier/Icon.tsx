/*
 * Atelier React — inline SVG icon renderer.
 * Accepts a raw inner-SVG markup string (`path`) — the fast, faithful port
 * path straight from the HTML reference — or a registry `name`.
 */
import { memo } from 'react';

export interface IconProps {
  /** Raw inner SVG markup (paths, circles, …) pasted from the reference. */
  path?: string;
  /** Optional size in px (default 20). */
  size?: number;
  className?: string;
  /** strokeWidth for stroke-based icons (default 2). */
  stroke?: number;
  'aria-hidden'?: boolean;
}

/** Inline-SVG wrapper matching the reference's viewBox + stroke contract. */
export const Icon = memo(function Icon({
  path = '',
  size = 20,
  className,
  stroke = 2,
  ...rest
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ width: size, height: size }}
      aria-hidden={rest['aria-hidden'] ?? true}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
});
