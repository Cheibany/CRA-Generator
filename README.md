# CRA-Generator

Application web qui génère la **fiche d'activité mensuelle (CRA)** d'un consultant au format Word (`.docx`) : une page par semaine, du lundi au vendredi, avec les jours fériés marocains pré-remplis.

Tout se passe dans le navigateur : aucune donnée n'est envoyée à un serveur.

## Fonctionnalités

- Découpage automatique du mois en semaines, jours fériés et jours hors période gérés
- Saisie directe dans un aperçu fidèle au document final
- Journées, demi-journées (0,5) et jours non facturés — cliquez sur la valeur pour la changer
- Recopie d'une intervention sur les jours vides suivants de la semaine
- Total par semaine et total du mois
- Sauvegarde automatique dans le navigateur (paramètres + saisies de chaque mois)
- Société, client et logo personnalisables
- Export `.docx`

## Démarrage

```bash
npm install
npm start
```

L'application est servie sur `http://localhost:4200/`.

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm start` | Serveur de développement |
| `npm run build` | Build de production dans `dist/` |
| `npm test` | Tests unitaires (Vitest), une seule exécution |
| `npm run test:watch` | Tests unitaires en mode surveillance |

## Structure

```
src/app/
├── models/cra.models.ts                 Types et fonctions de formatage
├── services/
│   ├── cra.service.ts                   Découpage du mois en semaines
│   ├── jours-feries.service.ts          Jours fériés du Maroc
│   ├── stockage.service.ts              Sauvegarde locale (localStorage)
│   ├── docx-generator.service.ts        Téléchargement du document
│   └── docx-builder.ts                  Construction du .docx (chargé à la demande)
├── directives/auto-grow.directive.ts    Zones de texte auto-ajustées
└── components/cra-form/                 Écran principal
```

## Jours fériés

Les jours fériés fixes sont calculés pour toute année. Les fêtes religieuses dépendent de l'observation lunaire : leurs dates sont **prévisionnelles** et listées par année dans `jours-feries.service.ts` (`feriesMobiles`). Pensez à les vérifier et à ajouter chaque nouvelle année ; un jour peut toujours être corrigé à la main dans l'aperçu.
