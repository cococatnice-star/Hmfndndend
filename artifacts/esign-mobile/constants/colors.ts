/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const midnightOrange = {
  // Legacy aliases (kept for backward compatibility)
  text: '#F4F7FB',
  tint: '#FF7900',

  // Midnight workspace surfaces, adapted from the Roblox Shop identity.
  background: '#050D1A',
  foreground: '#F4F7FB',
  card: '#0B1728',
  cardForeground: '#F4F7FB',
  surface: '#101F33',
  surfaceRaised: '#152943',
  primary: '#FF7900',
  primaryForeground: '#160C03',
  secondary: '#142338',
  secondaryForeground: '#F4F7FB',
  muted: '#152238',
  mutedForeground: '#8C9CAF',
  accent: '#FF9D45',
  accentForeground: '#160C03',
  destructive: '#F0645A',
  destructiveForeground: '#FFF8F4',
  success: '#57C98A',
  successForeground: '#06140D',
  warning: '#F5B74D',
  border: '#23364D',
  input: '#101F33',
};

const colors = {
  light: midnightOrange,
  dark: midnightOrange,

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
