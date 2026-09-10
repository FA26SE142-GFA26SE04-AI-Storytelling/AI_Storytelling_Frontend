---
name: WonderSpun
colors:
  surface: '#fbf9f3'
  surface-dim: '#dbdad4'
  surface-bright: '#fbf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee8'
  surface-container-high: '#eae8e2'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#584140'
  inverse-surface: '#30312d'
  inverse-on-surface: '#f2f1eb'
  outline: '#8c706f'
  outline-variant: '#e0bfbd'
  surface-tint: '#ae2f34'
  primary: '#ae2f34'
  on-primary: '#ffffff'
  primary-container: '#ff6b6b'
  on-primary-container: '#6d0010'
  inverse-primary: '#ffb3b0'
  secondary: '#785a00'
  on-secondary: '#ffffff'
  secondary-container: '#ffd167'
  on-secondary-container: '#765900'
  tertiary: '#006c4f'
  on-tertiary: '#ffffff'
  tertiary-container: '#00b083'
  on-tertiary-container: '#003b29'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b0'
  on-primary-fixed: '#410006'
  on-primary-fixed-variant: '#8c1520'
  secondary-fixed: '#ffdf9b'
  secondary-fixed-dim: '#edc157'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#54fdc4'
  tertiary-fixed-dim: '#27e0a9'
  on-tertiary-fixed: '#002116'
  on-tertiary-fixed-variant: '#00513b'
  background: '#fbf9f3'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-hero:
    fontFamily: Comfortaa
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Comfortaa
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Comfortaa
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  headline-sm:
    fontFamily: Comfortaa
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  story-text:
    fontFamily: Nunito Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-sm:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-action:
    fontFamily: Comfortaa
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-badge:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '800'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  touch-target-min: 3rem
  margin-mobile: 1.25rem
  gutter-mobile: 1rem
---

## Brand & Style

This design system sets the visual foundation for an imaginative, responsive AI storytelling platform crafted for children (ages 4–10) and co-reading parents. The brand persona is that of a warm, curious storybook companion: encouraging, safe, full of wonder, and tactile.

The aesthetic fuses **Tactile Skeuomorphic warmth** with **Playful Modernism**:
- Deeply touch-inviting, pressable components that respond to small, exploring fingers with dynamic spring and squash.
- Generous, cloud-soft padding and rounded silhouettes to prevent any visual severity.
- Joyous color-coding for narrative choices (actions, environments, characters) paired with ultra-legible letterforms to assist early readers and maintain parental trust.
- Gentle, luminous depth that evokes illuminated storybook parchment, glowing dreamscapes, and toy-like manipulables.

## Colors

The palette mirrors a vibrant toybox, built on a warm, organic base that avoids digital eye-strain during bedtime reading.

- **Primary (`#FF6B6B` - Playful Coral):** Drives the primary interactive engine—main call-to-actions, hero progression buttons ("Turn Page", "Create Story"), and active state indicators.
- **Secondary (`#FFD166` - Sunlit Honey):** Used for rewards, star counts, spark/magic cues, and attention-grabbing story cards.
- **Tertiary (`#06D6A0` - Magic Mint):** Governs affirmative interactions, voice-listening states, sound toggles, and safe-choice paths.
- **Accent Sky (`#4CC9F0` - Dream Sky):** Guides narrative prompts, exploration chips, reading level badges, and interactive character dialogue bubbles.
- **Accent Purple (`#A06CD5` - Fairy Dusk):** Applied to AI generation markers, whimsical transitions, dream-mode filters, and parent settings.
- **Canvas Base (`#FFFDF7` - Warm Cream Parchment):** The soothing, non-glare surface for all screens, maintaining a paper-like feel.
- **Text & Structure (`#264653` - Deep Sea Ink):** A dark, friendly teal-charcoal serving as high-contrast text and border structural elements, replacing harsh pure black.

## Typography

The type system prioritizes phonetic clarity, open counters, and cheerful curved terminals suited to young readers without sacrificing layout structure.

- **Comfortaa** provides a rounded, geometric display voice that turns headlines, prompts, and button labels into friendly visual signage.
- **Nunito Sans** handles the narrative and functional interface layers. Its tall x-height and rounded geometry ensure early readers can discern individual letter shapes without fatigue.
- `story-text` is specifically tuned with a 32px line-height and generous word spacing to accommodate finger-tracking during guided read-along sessions.

## Layout & Spacing

Because this system is built natively for mobile touchscreens operated by both small hands and parents:

- **Touch Target Integrity:** All primary interactables enforce a minimum height of `48px` (`3rem`), with `56px` preferred for bottom actions to prevent mis-taps.
- **Grid Structure:** Built around a 4-column fluid mobile layout framed by `1.25rem` (20px) outer safe gutters.
- **Thumb Zones:** Main creative triggers ("What happens next?", "Spin New Tale") and page turns anchor within the lower 35% of the viewport.
- **Card-Stack Rhythm:** Interactive choices use vertical cascades spaced at `1rem` or horizontal carousel tracks with peek indicators spaced at `0.75rem` gutters.

## Elevation & Depth

Rather than cold gray shadows, elevation uses **saturated, luminous color-tinted glows** and **chunky bottom bevels** that give items a solid, plastic/rubber toy presence:

- **Level 0 (Flat/Substrate):** Crisp parchment (`#FFFDF7`) with soft 1.5px borders in tinted cream-taupe (`rgba(38, 70, 83, 0.08)`).
- **Level 1 (Story Cards & Containers):** Soft ambient glow: `0 8px 24px -4px rgba(76, 201, 240, 0.15), 0 2px 6px rgba(38, 70, 83, 0.04)`.
- **Level 2 (Pill Buttons & Interactive Choices):** 3D dimensional press effect created with a 4px solid drop-edge shadow: `box-shadow: 0 4px 0px [darkened-color-token]`. On `:active`, this shadow snaps to `0 0 0`, translating the component 4px downward for instant, tactile feedback.
- **Level 3 (Modals & Character Popups):** Cloud-soft multi-spread blur: `0 16px 40px -8px rgba(160, 108, 213, 0.25)`.

## Shapes

The design system uses a **Pill-Shaped (Level 3)** roundedness strategy across all components.

- Sharp corners are entirely disallowed to reinforce a warm, child-safe physical environment.
- Buttons, chips, and pill badges use full circular endcaps (`rounded-full` / 9999px).
- Story cards and bottom dialog sheets take extreme softened contours: `2rem` (32px) corner radii on mobile cards, and `2.5rem` on modal sheets.
- Inner elements (icons, avatar frames, thumbnail masks) nest smoothly using matching concentric radii (`1rem` to `1.5rem`).

## Components

### Buttons
- **Hero / Action Buttons:** Pill-shaped, 56px height, uppercase `label-action` typography. Uses the primary coral (`#FF6B6B`) or mint (`#06D6A0`) background with a matching 4px solid shadow offset (`#D94747` or `#04A67C`).
- **Secondary Ghost Pill:** Pure cream fill, 2px solid border in `#264653` (20% opacity), and deep charcoal text.

### Story Choice Cards
- Prominent 24px rounded rectangles hosting illustration thumbnails and story branch prompts.
- Colored base surfaces featuring 10% tint of the category (Coral for adventure, Sky Blue for mystery, Mint for animal helpers, Gold for magic).
- 2px interior border with an interactive press state that scales the card down to 0.98 with a cheerful tactile snap.

### Badges & Chips
- Fully rounded pill containers (height: 28px - 32px).
- Pair pastel backdrops (e.g., `#FFD166` at 25% opacity) with high-contrast text (`#264653`).
- Include a leading emoji or circular icon mask (18px) for pre-literate visual recognition.

### Input Fields & Story Prompts
- Large, friendly input bars (52px height) with full rounded pill geometry.
- Background in solid `#FFFFFF` framed by a 2px border in Dream Sky (`#4CC9F0`).
- Integrated voice input microphone button anchored inside the trailing edge, bathed in soft glowing mint green.

### Checkboxes & Radios
- Replaced by large, chunky "Squishy Switches" or circular star stamps (32px x 32px).
- Unchecked: `#FFFDF7` pill with a 2px outline in soft ink.
- Checked: `#06D6A0` with a clean, centered white star or checkmark accompanied by an immediate spring-bounce micro-interaction.

### AI Storyteller Audio Bar
- Persistent bottom floating pill hovering 16px above the home indicator.
- Contains an animated audio waveform in Sunlit Honey (`#FFD166`), playful pause/play buttons, and speed controls stylized as tortoise and hare icons.