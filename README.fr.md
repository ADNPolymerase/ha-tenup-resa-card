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

Une carte Lovelace pour l'[intégration Ten'Up](https://github.com/ADNPolymerase/ha-tenup-resa) : le tableau de réservation de votre club de tennis, jour par jour, court par court. Un clic sur un créneau libre pour réserver, un clic sur votre réservation pour l'annuler.

> 🇬🇧 [Read in English](README.md)

## Fonctionnalités

- **Quatre couleurs de case** : vert = libre (1 joueur), jaune = libre mais 2 joueurs requis, rouge = réservé par quelqu'un d'autre, bleu = réservé par vous (clic pour annuler, avec confirmation).
- **Courts à 2 joueurs** (ex. couvert) pas encore réservables dans la carte (choix du partenaire) : ces cases sont jaunes et renvoient directement au planning du club sur Ten'Up, sur le bon jour.

- **Le tableau du club** comme sur Ten'Up : courts en colonnes, heures en lignes, cours de 30 minutes et blocs de 90 minutes dessinés à leur vraie taille.
- **Quatre états de cellule** : libre (clic pour réserver), occupé (avec le nom, ou sans), à vous (clic pour annuler), passé.
- **Onglets par jour** avec le nombre de créneaux libres à venir, sur autant de jours que l'intégration en charge (7 par défaut).
- **Confirmation** avant de réserver ou d'annuler, et la réponse de Ten'Up quand il refuse (règles du club, réservations simultanées).
- **Éditeur visuel**, anglais et français, sans dépendance ni build.

## Prérequis

- L'[intégration Ten'Up](https://github.com/ADNPolymerase/ha-tenup-resa) configurée.
- Home Assistant 2024.12 ou plus récent.

## Installation

1. HACS > Frontend > trois points > Dépôts personnalisés > ajouter `https://github.com/ADNPolymerase/ha-tenup-resa-card` (catégorie Dashboard).
2. Installer **Ten'Up Card**, recharger le navigateur.
3. Ajouter la carte **Ten'Up Card** à un tableau de bord.

## Options

| Option | Défaut | Description |
|---|---|---|
| `name` | nom du club | Titre de la carte |
| `entry_id` | premier club | Entrée Ten'Up à afficher, quand plusieurs clubs sont configurés |
| `days` | `3` | Nombre d'onglets de jours (1 à 7) |
| `start_hour`, `end_hour` | grille du club | Borne les heures affichées |
| `courts` | tous | Liste des identifiants de courts à afficher (depuis l'éditeur) |
| `show_names` | `true` | Afficher qui a réservé les créneaux occupés |
| `confirm` | `true` | Demander confirmation avant de réserver ou d'annuler |
| `compact` | `false` | Cellules plus petites |
| `language` | `auto` | `auto`, `en` ou `fr` |

```yaml
type: custom:ha-tenup-card
days: 3
start_hour: 8
end_hour: 22
```

## À savoir

- L'annulation est immédiate sur Ten'Up (aucune seconde confirmation de leur côté). Gardez `confirm` activé.
- Les courts qui demandent deux joueurs ne sont pas encore réservables : l'intégration répond par un message explicite.

---

Ten'Up et le logo Ten'Up sont des marques de la Fédération Française de Tennis. Ce projet non officiel n'est ni affilié à la FFT ni approuvé par elle.
