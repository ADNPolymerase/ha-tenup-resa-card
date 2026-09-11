<img src="docs/logo.png" alt="Ten'Up" width="420">

# Ten'Up Card

[![GitHub Release](https://img.shields.io/github/v/release/ADNPolymerase/ha-tenup-resa-card?sort=semver)](https://github.com/ADNPolymerase/ha-tenup-resa-card/releases)
[![HACS Action](https://github.com/ADNPolymerase/ha-tenup-resa-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/ADNPolymerase/ha-tenup-resa-card/actions/workflows/hacs.yml)
[![Tests](https://github.com/ADNPolymerase/ha-tenup-resa-card/actions/workflows/test.yml/badge.svg)](https://github.com/ADNPolymerase/ha-tenup-resa-card/actions/workflows/test.yml)
[![HA Version](https://img.shields.io/badge/Home%20Assistant-2024.12%2B-blue.svg)](https://www.home-assistant.io)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow.svg?logo=buy-me-a-coffee)](https://buymeacoffee.com/adnpolymerase)

<a href="https://buymeacoffee.com/adnpolymerase" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-orange.png" alt="Buy Me A Coffee" height="60"></a>
<a href="https://adnpolymerase.github.io/HA/" target="_blank"><img src="https://raw.githubusercontent.com/ADNPolymerase/HA/main/assets/site-button.svg" alt="Link to my github.io for my other projects" height="60"></a>

A Lovelace card for the [Ten'Up integration](https://github.com/ADNPolymerase/ha-tenup-resa): the reservation grid of your tennis club, day by day, court by court. Tap a free slot to book it, tap your own reservation to cancel it.

> 🇫🇷 [Lire en français](README.fr.md)

## Features

- **Four cell colours**: green = free (1 player), yellow = free but needs 2 players, red = booked by someone else, blue = booked by you (tap to cancel, with a confirmation).
- **2-player courts** (e.g. indoor) can't be booked in the card yet (partner selection): those slots are yellow and link straight to the club planning on Ten'Up for that day.

- **The grid of the club** as on Ten'Up: courts in columns, hours in rows, 30-minute lessons and 90-minute blocks drawn at their real size.
- **Four cell states**: free (tap to book), booked (with the name, or not), yours (tap to cancel), past.
- **Day tabs** with the number of free slots to come, for as many days as the integration fetches (7 by default).
- **Confirmation** before booking or cancelling, and Ten'Up's own answer when it refuses (club rules, simultaneous reservations).
- **Visual editor**, English and French, no dependency, no build step.

## Requirements

- The [Ten'Up integration](https://github.com/ADNPolymerase/ha-tenup-resa) configured.
- Home Assistant 2024.12 or newer.

## Installation

1. HACS > Frontend > three dots > Custom repositories > add `https://github.com/ADNPolymerase/ha-tenup-resa-card` (category Dashboard).
2. Install **Ten'Up Card**, reload the browser.
3. Add the card **Ten'Up Card** to a dashboard.

## Options

| Option | Default | Description |
|---|---|---|
| `name` | club name | Title of the card |
| `entry_id` | first club | Which Ten'Up entry to show, when several clubs are configured |
| `days` | `3` | Number of day tabs (1 to 7) |
| `start_hour`, `end_hour` | grid of the club | Clamp the hours shown |
| `courts` | all | List of court ids to show (from the editor) |
| `show_names` | `true` | Show who booked the busy slots |
| `confirm` | `true` | Ask before booking or cancelling |
| `compact` | `false` | Smaller cells |
| `language` | `auto` | `auto`, `en` or `fr` |

```yaml
type: custom:ha-tenup-card
days: 3
start_hour: 8
end_hour: 22
```

## Notes

- Cancelling is immediate on Ten'Up (no second confirmation on their side). Keep `confirm` on unless you know what you do.
- Courts that require two players cannot be booked yet: the integration answers with an explicit message.

---

Ten'Up and the Ten'Up logo are trademarks of the Fédération Française de Tennis. This is an unofficial project, not affiliated with or endorsed by the FFT.
