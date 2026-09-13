<img src="docs/logo.png" alt="Ten'Up" width="420">

# Ten'Up Card

[![GitHub Release](https://img.shields.io/github/v/release/ADNPolymerase/ha-tenup-resa-card?sort=semver)](https://github.com/ADNPolymerase/ha-tenup-resa-card/releases)
[![HACS Action](https://github.com/ADNPolymerase/ha-tenup-resa-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/ADNPolymerase/ha-tenup-resa-card/actions/workflows/hacs.yml)
[![Tests](https://github.com/ADNPolymerase/ha-tenup-resa-card/actions/workflows/test.yml/badge.svg)](https://github.com/ADNPolymerase/ha-tenup-resa-card/actions/workflows/test.yml)
[![HA Version](https://img.shields.io/badge/Home%20Assistant-2024.12%2B-blue.svg)](https://www.home-assistant.io)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow.svg?logo=buy-me-a-coffee)](https://buymeacoffee.com/adnpolymerase)

<a href="https://buymeacoffee.com/adnpolymerase" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-orange.png" alt="Buy Me A Coffee" height="60"></a>
<a href="https://adnpolymerase.github.io/HA/" target="_blank"><img src="https://raw.githubusercontent.com/ADNPolymerase/HA/main/assets/site-button.svg" alt="Lien vers mon github.io pour mes autres projets" height="60"></a>

Le tableau de réservation de votre club de tennis sur [Ten'Up](https://tenup.fft.fr), en carte Lovelace pour l'[intégration Ten'Up](https://github.com/ADNPolymerase/ha-tenup-resa).

> 🇬🇧 [Read in English](README.md)

## Fonctionnalités

- **Le tableau du club** : un onglet par jour, les courts en colonnes, les créneaux à leur vraie taille.
- **Couleurs** : vert libre, jaune 2 joueurs requis, rouge pris, violet un ami, bleu à vous, gris passé.
- **Réserver et annuler** d'un clic, après confirmation.
- **Courts à 2 joueurs** : renvoient vers Ten'Up, pas encore réservables depuis la carte.
- **Éditeur visuel**, français et anglais.

## Amis

Leurs réservations passent en violet. Touchez une réservation pour suivre un joueur avec son initiale (lui seul) ou avec **Tous les NOM** (famille et homonymes), ou gérez la liste depuis le bouton de l'en-tête.

Ten'Up n'affiche que l'initiale du prénom : deux joueurs avec la même initiale et le même nom sont indiscernables.

## Installation

1. HACS > trois points > Dépôts personnalisés > `https://github.com/ADNPolymerase/ha-tenup-resa-card`, type Dashboard.
2. Installer **Ten'Up Card** et recharger le navigateur.
3. L'ajouter à un tableau de bord. Nécessite l'[intégration](https://github.com/ADNPolymerase/ha-tenup-resa) et Home Assistant 2024.12+.

## Options

| Option | Défaut | |
|---|---|---|
| `name` | nom du club | Titre |
| `entry_id` | premier club | Club affiché |
| `days` | `3` | Onglets de jours, 1 à 7 |
| `start_hour`, `end_hour` | grille du club | Heures affichées |
| `courts` | tous | Courts affichés |
| `show_names` | `true` | Afficher qui a réservé. Désactivé : ni noms, ni suivi depuis la grille |
| `confirm` | `true` | Confirmer avant de réserver ou d'annuler |
| `compact` | `false` | Cellules plus petites |
| `language` | `auto` | `auto`, `en` ou `fr` |

```yaml
type: custom:ha-tenup-card
days: 3
```

L'annulation est immédiate sur Ten'Up : gardez `confirm` activé.

---

Ten'Up et le logo Ten'Up sont des marques de la Fédération Française de Tennis. Ce projet non officiel n'est ni affilié à la FFT ni approuvé par elle.
