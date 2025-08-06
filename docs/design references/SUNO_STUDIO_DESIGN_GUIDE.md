# Suno Studio Design System

A comprehensive design guide for replicating the Suno Music Studio aesthetic in other projects.

## Overview

Suno Studio is a professional AI music creation platform with a dark, tech-focused design featuring neon purple accents and electric cyan highlights. The design system prioritizes user experience for audio professionals with smooth animations and intuitive controls.

## 1. Color System

### Primary Color Palette

```css
/* Dark Theme (Default) */
--background: 220 13% 8%      /* #141518 - Deep dark background */
--foreground: 210 40% 98%   /* #fafbfd - Near white text */

--card: 224 20% 10%        /* #1a1b23 - Card background */
--card-foreground: 210 40% 98% /* #fafbfd */

--popover: 224 20% 10%     /* #1a1b23 */
--popover-foreground: 210 40% 98% /* #fafbfd */

/* Primary - Electric Purple */
--primary: 280 100% 60%    /* #9933ff */
--primary-foreground: 210 40% 98% /* #fafbfd */
--primary-glow: 280 100% 70% /* #b366ff */

/* Secondary - Deep Purple */
--secondary: 260 20% 25%   /* #3d3340 */
--secondary-foreground: 210 40% 98% /* #fafbfd */

/* Accent - Cyan/Teal */
--accent: 180 100% 50%     /* #00ffff */
--accent-foreground: 220 13% 8% /* #141518 */

/* Muted/Dark Elements */
--muted: 220 13% 15%       /* #242528 */
--muted-foreground: 215 16% 65% /* #7f8491 */

--border: 220 13% 20%      /* #323438 */
--input: 220 13% 15%       /* #242528 */
--ring: 280 100% 60%       /* #9933ff */

/* Status Colors */
--destructive: 0 84% 60%   /* #ef4444 */
--destructive-foreground: 210 40% 98% /* #fafbfd */
--success: 150 100% 45%    /* #00cc66 */
--warning: 45 100% 55%     /* #ffcc00 */

/* Studio Specific */
--studio-surface: 224 25% 12% /* #1f2028 */
--studio-accent: 320 100% 55% /* #ff00aa */
```

### Light Theme (Optional)

```css
.light {
  --background: 0 0% 100%;
  --foreground: 220 13% 8%;
  --card: 0 0% 100%;
  --card-foreground: 220 13% 8%;
  --primary: 280 100% 50%;
  --border: 220 13% 91%;
  --input: 220 13% 96%;
}
```

## 2. Typography

### Font Stack

```css
font-family: "Inter", system-ui, sans-serif;
```

### Hierarchy

- **Headings**: Bold weight (`font-bold`)
  - H1: `text-3xl sm:text-4xl`
  - H2: `text-xl sm:text-2xl`
  - H3: `text-lg sm:text-xl`
- **Body**: Default system weight
  - Large: `text-lg`
  - Base: `text-base`
  - Small: `text-sm`
  - Extra small: `text-xs`

### Gradient Text Effects

```css
.gradient-text {
  background: linear-gradient(135deg, hsl(280 100% 60%), hsl(320 100% 55%));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

## 3. Spacing & Layout

### Container Structure

```css
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem; /* 16px */
}

.card {
  padding: 1.5rem; /* 24px */
  margin: 1rem 0; /* 16px */
}
```

### Spacing Scale

Based on Tailwind's spacing system:

- **Micro**: `0.25rem` (4px)
- **Small**: `0.5rem` (8px)
- **Medium**: `1rem` (16px)
- **Large**: `1.5rem` (24px)
- **Extra Large**: `2rem` (32px)
- **2XL**: `3rem` (48px)

## 4. Border Radius

```css
:root {
  --radius: 0.75rem; /* 12px */
}

.lg: var(--radius); /* 12px */
.md: calc(var(--radius) - 2px); /* 10px */
.sm: calc(var(--radius) - 4px); /* 8px */
.full: 9999px; /* For circles */
```

## 5. Shadows & Effects

### Glow Effects

```css
--shadow-glow: 0 0 20px hsl(280 100% 60% / 0.3);
--shadow-accent: 0 0 15px hsl(180 100% 50% / 0.2);
--shadow-card: 0 4px 20px hsl(220 13% 8% / 0.8);
```

### Custom Components

```css
.neon-glow {
  box-shadow: var(--shadow-glow);
}

.accent-glow {
  box-shadow: var(--shadow-accent);
}

.studio-card {
  background: linear-gradient(
    135deg,
    hsl(var(--studio-surface)),
    hsl(var(--card))
  );
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(0.5rem);
}
```

## 6. Background Patterns

### Gradient Backgrounds

```css
.gradient-primary {
  background: linear-gradient(135deg, hsl(280 100% 60%), hsl(320 100% 55%));
}

.gradient-secondary {
  background: linear-gradient(135deg, hsl(224 25% 12%), hsl(260 20% 25%));
}

.gradient-accent {
  background: linear-gradient(135deg, hsl(180 100% 50%), hsl(200 100% 60%));
}
```

### Waveform Background

```css
.waveform-bg {
  background: linear-gradient(
      90deg,
      transparent 0%,
      hsl(var(--primary) / 0.1) 50%,
      transparent 100%
    ), repeating-linear-gradient(90deg, hsl(var(--border)) 0px, hsl(
          var(--border)
        ) 1px, transparent 1px, transparent 20px);
}
```

## 7. Animations & Transitions

### Timing Functions

```css
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Keyframes (for accordions)

```css
@keyframes accordion-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}

@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}
```

## 8. Component Library

### Buttons Hierarchy

```tsx
// Primary Button
<Button className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow">

// Secondary Button
<Button variant="secondary" className="hover:bg-secondary/80">

// Outline Button
<Button variant="outline" className="border-border hover:bg-accent/50">

// Destructive Button
<Button variant="destructive" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
```

### Cards Structure

```tsx
<Card className="studio-card">
  <CardHeader>
    <CardTitle className="text-foreground">Card Title</CardTitle>
  </CardHeader>
  <CardContent>{/* Card content */}</CardContent>
</Card>
```

### Forms & Inputs

```tsx
<Input className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary" />
```

## 9. Layout Components

### Header Structure

```tsx
<header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
  <div className="container mx-auto px-4 py-4">{/* Header content */}</div>
</header>
```

### Hero Section

```tsx
<div className="absolute inset-0 bg-background/80 backdrop-blur-sm bg-gradient-glow" />
<div className="relative z-10 flex items-center justify-center min-h-screen p-4">
  {/* Centered content */}
</div>
```

## 10. Scrollbar Styling

```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--muted));
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--primary));
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--primary-glow));
}
```

## 11. Technology Stack Requirements

### Dependencies

```json
{
  "@radix-ui/react-*": "^1.x.x",
  "tailwindcss": "^3.4.x",
  "lucide-react": "^0.462.x",
  "class-variance-authority": "^0.7.x",
  "tailwind-merge": "^2.5.x"
}
```

### Development Dependencies

```json
{
  "@tailwindcss/typography": "^0.5.x",
  "tailwindcss-animate": "^1.x.x"
}
```

## 12. Implementation Guide

### 1. Setup Tailwind Config

Copy the provided `TAILWIND_CONFIG_EXAMPLE.md` configuration

### 2. Install Base CSS

Apply the custom CSS variables in your global CSS file

### 3. Component Structure

- Use `studio-card` for all card components
- Apply `neon-glow` for primary actions
- Use `gradient-text` for brand elements

### 4. Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Flexible grids: `grid-cols-2 lg:grid-cols-4`

### 5. Accessibility

- Maintain color contrast ratios
- Use semantic HTML structure
- Include focus states for all interactive elements

## 13. Theme Constants Cheat Sheet

```javascript
// For JavaScript/TypeScript usage
export const COLORS = {
  primary: "hsl(280 100% 60%)",
  secondary: "hsl(260 20% 25%)",
  accent: "hsl(180 100% 50%)",
  background: "hsl(220 13% 8%)",
  foreground: "hsl(210 40% 98%)",
  muted: "hsl(220 13% 15%)",
  border: "hsl(220 13% 20%)",
};

export const ANIMATIONS = {
  smooth: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
};
```

This design system provides a complete foundation for creating similar audio-focused web applications with the distinctive Suno Studio aesthetic.
