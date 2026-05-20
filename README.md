# Bougii-ticket

Bot de ticket Discord basé sur `/tick`.

## Installation

1. Copier `.env.example` en `.env`.
2. Remplir `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`.
3. Si nécessaire, corriger `PARTENARIAT_CATEGORY_ID`.
4. Installer les dépendances :
   ```bash
   npm install
   ```

## Déploiement des commandes

```bash
npm run deploy-commands
```

## Lancement du bot

```bash
npm start
```

## Fonctionnalités

- Slash command `/tick` qui affiche un panneau avec 4 boutons :
  - Contacter le staff
  - Question SAB
  - Autre
  - Partenariat
- Chaque option ouvre un modal demandant un titre et une description.
- Création de ticket dans la catégorie correspondante.
- Ping du rôle `1504270231390916769` lors de l’ouverture du ticket.
- Limite d’un ticket actif par membre.
- Boutons dans le ticket : `Fermer`, `Claim`.
- Après fermeture : bouton `Ouvrir` et bouton `Supprimer`.
- Lors de la suppression, envoi d’une transcription en MP.

## Configuration

Les catégories sont configurées dans `src/config.js` :

- `staff` : `1504270635692724296`
- `questionSab` : `1504269674685399090`
- `autre` : `1504269716062212256`
- `partenariat` : `1504271530111271032` (à corriger si nécessaire)

Le rôle de staff et de mention est `1504270231390916769`.

## Déploiement sur Render

- Le fichier `render.yaml` est inclus pour créer un service de type "background" sur Render.
- Dans l'interface Render : créez un nouveau service à partir du dépôt ou utilisez le déploiement automatique, puis assignez les variables d'environnement : `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID` et autres nécessaires.
- Le service utilise `npm run start`. Sur Render, le type `background` est recommandé pour les bots Discord (pas besoin d'un serveur HTTP).
- Si Render est configuré en `Web Service` et affiche "no open port detected", ce dépôt gère désormais automatiquement `process.env.PORT` pour un endpoint de santé.
- Si Render ne fournit pas `PORT`, le bot démarre quand même un petit serveur local sur `3000` pour que le processus expose un port détectable.

