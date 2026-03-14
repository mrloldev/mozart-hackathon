# Labi UI Plan: Main Screen & Player(s)

## 1. Main Screen

### 1.1 Core States

| State        | Condition                    | Content                          |
| ------------ | ---------------------------- | -------------------------------- |
| **Global**   | No places added OR location denied | Global recommendations           |
| **Contextual** | Places added AND location on | Contextual recommendations       |
| **Artist**   | Artist/pro account            | Creation + stats entry point     |

### 1.2 Layout Structure

**Header**
- Logo / app name (Labi)
- Context pill: current place (e.g. `📍 Gym`, `📍 Anywhere`, `🌍 Global`)
- Profile / mode toggle (listener vs artist)

**Context Banner** (when contextual)
- "At Gym" → e.g. "Covers tuned for your workout"
- Brief explanation of why recommendations fit this context

**Main Content**
- **Global mode:** "Popular covers from your favorite artists"
- **Contextual mode:** "Popular at [Place]" (e.g. "Popular at gym")

### 1.3 Recommendation Rows

Same for both Global and Contextual modes:

- Horizontal scroll rows
- Each card: cover art, original track + artist, version badge (e.g. `Running`, `Focus`, `Chill`, `Driving`)
- Optional: play count / popularity
- Row types: "For you", "Popular now", "At [place]" (contextual only)

### 1.4 Context / Place Management

- Tap context pill → opens modal or sheet
- Add places: Gym, Office, Car, Home, Coffee, etc.
- Enable/disable location
- Manually switch current place

### 1.5 Artist Mode on Main Screen

- Different header CTAs: "Create" + "Stats"
- Main content: same recommendation feed, plus shortcuts to creation and stats

---

## 2. Player(s)

### 2.1 Player Types

| Player      | Use case                          | Prominence |
| ----------- | ---------------------------------- | ---------- |
| **Mini**    | Browse while listening            | Bottom bar |
| **Full**    | Focus on playback and details     | Full screen |

### 2.2 Mini Player

**Layout**
- Fixed bottom bar (above tab bar when visible)
- Left: small cover art (square, ~48px)
- Center: track title, artist, version badge
- Right: play/pause
- Tap bar → expand to full player

**Version Badge**
- Always visible: e.g. `Running`, `Focus`, `Chill`, `Driving`
- Communicates context of the version being played

**Progress**
- Thin progress bar under the bar, or inline with the cover
- Optional: show BPM or other context metadata

### 2.3 Full Player

**Layout**
- Full-screen sheet / modal from bottom
- Large cover art (central, ~300px or more)
- Title, artist, version badge
- Standard controls: prev, play/pause, next
- Optional: shuffle, repeat

**Version Info Section**
- Version badge + short explanation
  - e.g. "Running mix — BPM optimized, consistent energy"
- Optional: "See more versions" for same track

**Queue / Up Next**
- Collapsible list of next tracks
- Swipe to reorder or remove

**Context Actions**
- "Add to context" (e.g. save for gym)
- Share
- Report / feedback

### 2.4 Shared Player Logic

- Single player state (current track, queue, position)
- Mini and full UIs consume same state
- Gesture: swipe down on full player to minimize

---

## 3. Navigation Summary

```
Welcome (sign in / skip)
    ↓
Main Screen (tabs hidden when not auth'd)
    ├── Home (recommendations)
    ├── Explore (discover / search)
    └── Profile (places, settings, mode)
        
Mini Player (always on top when playing)
    ↓ tap
Full Player (sheet)
```

---

## 4. Design Tokens to Align

- Surfaces: `surface`, `surfaceElevated`, `surfaceMuted`
- Primary accent: `primary` (Spotify green)
- Version badges: per-context colors (e.g. gym = energetic, focus = calm)
