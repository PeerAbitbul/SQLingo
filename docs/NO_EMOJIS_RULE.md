# ⚠️ NO EMOJIS IN CODE - USE SVG ICONS ONLY

**IMPORTANT RULE:** Never use emojis in the codebase. Always use SVG icons instead.

---

## ❌ DON'T USE

```tsx
// BAD - Emojis in code
<span>⭐</span>
<option>GPT-4o (Recommended) ⭐</option>
{isSuccess ? '✅' : '❌'}
```

---

## ✅ DO USE

```tsx
// GOOD - SVG icons
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

<StarIcon />
```

---

## Why?

1. **Consistency** - SVG icons look the same on all platforms
2. **Customization** - Can change color, size, etc.
3. **Accessibility** - Better for screen readers
4. **Professional** - More polished appearance
5. **No font issues** - Emojis can look different or missing on some systems

---

## Common Icons

### Star (Recommended)
```tsx
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
```

### Check (Success)
```tsx
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
```

### X (Error)
```tsx
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
```

### Warning
```tsx
const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
```

### Info
```tsx
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
```

---

## Icon Libraries

Consider using:
- **Lucide React** - `npm install lucide-react`
- **Heroicons** - `npm install @heroicons/react`
- **Feather Icons** - `npm install react-feather`

Example with Lucide:
```tsx
import { Star, Check, X, AlertTriangle } from 'lucide-react';

<Star size={14} fill="currentColor" />
<Check size={16} />
<X size={16} />
<AlertTriangle size={16} />
```

---

## Remember

**NEVER USE EMOJIS IN CODE!**

Always use SVG icons for:
- UI elements
- Status indicators
- Decorative elements
- Interactive components

Emojis are OK ONLY in:
- Documentation (markdown files)
- Commit messages
- Comments (sparingly)
- User-generated content

---

**This is a strict rule. No exceptions.**

