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

The reservation grid of your tennis club on [Ten'Up](https://tenup.fft.fr), as a Lovelace card for the [Ten'Up integration](https://github.com/ADNPolymerase/ha-tenup-resa).

> 🇫🇷 [Lire en français](README.fr.md)

## Features

- **The club grid**: one tab per day, courts in columns, slots at their real size.
- **Colours**: green free, yellow 2 players needed, red taken, purple a friend, blue yours, grey past.
- **Book and cancel** in one tap, after a confirmation.
- **2-player courts** link to Ten'Up: not bookable from the card yet.
- **Visual editor**, English and French.

## Friends

Their bookings turn purple. Tap a booking to follow a player by initial (just them) or with **Every NAME** (family and namesakes), or manage the list from the header button.

Ten'Up only shows the first-name initial: two players sharing it and a surname can't be told apart.

## Installation

1. HACS > three dots > Custom repositories > `https://github.com/ADNPolymerase/ha-tenup-resa-card`, type Dashboard.
2. Install **Ten'Up Card** and reload the browser.
3. Add it to a dashboard. Needs the [integration](https://github.com/ADNPolymerase/ha-tenup-resa) and Home Assistant 2024.12+.

## Options

| Option | Default | |
|---|---|---|
| `name` | club name | Title |
| `entry_id` | first club | Club to show |
| `days` | `3` | Day tabs, 1 to 7 |
| `start_hour`, `end_hour` | club grid | Hours shown |
| `courts` | all | Courts shown |
| `show_names` | `true` | Show who booked. Off: no names, no following from the grid |
| `confirm` | `true` | Ask before booking or cancelling |
| `compact` | `false` | Smaller cells |
| `language` | `auto` | `auto`, `en` or `fr` |

```yaml
type: custom:ha-tenup-card
days: 3
```

Cancelling is immediate on Ten'Up: keep `confirm` on.

---

Ten'Up and the Ten'Up logo are trademarks of the Fédération Française de Tennis. This is an unofficial project, not affiliated with or endorsed by the FFT.
