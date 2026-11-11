import type { CSSProperties } from 'react';

/**
 * Ashamco Express logo. Files are in public/brand/logos/ (copy web/public/ into your app's public folder).
 * Arabic is the primary logo. Use the English logo when the UI language is English.
 */
export type LogoLang = 'ar' | 'en';
export type LogoVariant = 'primary' | 'on-purple' | 'black' | 'white' | 'lockup' | 'lockup-on-purple';

export interface BrandLogoProps {
  lang?: LogoLang;
  /** primary on light backgrounds, on-purple on brand purple / dark backgrounds. lockup variants are English only. */
  variant?: LogoVariant;
  /** Rendered height in px. Keep the logo at least 120px (ar) / 140px (en) wide. */
  height?: number;
  className?: string;
  style?: CSSProperties;
  basePath?: string;
}

/** width / height of each logo file, so the browser reserves space (no layout shift). */
const RATIO: Record<string, number> = {
  "ashamco-ar-primary.svg": 3.4328,
  "ashamco-ar-on-purple.svg": 3.4328,
  "ashamco-ar-black.svg": 3.4328,
  "ashamco-ar-white.svg": 3.4328,
  "ashamco-en-primary.svg": 5.247,
  "ashamco-en-on-purple.svg": 5.247,
  "ashamco-en-black.svg": 5.247,
  "ashamco-en-white.svg": 5.247,
  "ashamco-en-lockup.svg": 3.9299,
  "ashamco-en-lockup-on-purple.svg": 3.9299
};

export function BrandLogo({ lang = 'ar', variant = 'primary', height = 52, className, style, basePath = '/brand/logos' }: BrandLogoProps) {
  const isLockup = variant === 'lockup' || variant === 'lockup-on-purple';
  const file = isLockup ? `ashamco-en-${variant}.svg` : `ashamco-${lang}-${variant}.svg`;
  const alt = lang === 'ar' && !isLockup ? 'اشامكو إكسبريس' : 'Ashamco Express';
  const minWidth = isLockup ? 200 : lang === 'ar' ? 120 : 140;
  const width = Math.round(height * (RATIO[file] ?? 3.4));
  if (width < minWidth) return <BrandIcon variant={variant === 'on-purple' || variant === 'lockup-on-purple' ? 'dark' : 'light'} size={height} className={className} basePath={basePath} />;
  return <img src={`${basePath}/${file}`} alt={alt} width={width} height={height} style={{ height, width: 'auto', ...style }} className={className} draggable={false} />;
}

export type IconVariant = 'light' | 'dark' | 'square' | 'mark' | 'mark-white';

export function BrandIcon({ variant = 'light', size = 40, className, basePath = '/brand/logos' }: { variant?: IconVariant; size?: number; className?: string; basePath?: string }) {
  const file = { light: 'ashamco-icon-rounded.svg', dark: 'ashamco-icon-dark-rounded.svg', square: 'ashamco-icon.svg', mark: 'ashamco-mark.svg', 'mark-white': 'ashamco-mark-white.svg' }[variant];
  return <img src={`${basePath}/${file}`} alt="" aria-hidden="true" width={size} height={size} className={className} draggable={false} />;
}
