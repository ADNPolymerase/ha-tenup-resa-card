# Ten'Up Card

Une carte Lovelace pour l'[intégration Ten'Up](https://github.com/ADNPolymerase/ha-tenup) : le tableau de réservation de votre club de tennis, jour par jour, court par court. Un clic sur un créneau libre pour réserver, un clic sur votre réservation pour l'annuler.

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

- L'[intégration Ten'Up](https://github.com/ADNPolymerase/ha-tenup) configurée.
- Home Assistant 2024.12 ou plus récent.

## Installation

1. HACS > Frontend > trois points > Dépôts personnalisés > ajouter `https://github.com/ADNPolymerase/ha-tenup-card` (catégorie Dashboard).
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
