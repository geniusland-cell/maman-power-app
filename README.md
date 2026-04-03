# 📱 MAMAN POWER - Application React

## Description

MAMAN POWER est une application React progressive web app (PWA) destinée aux vendeuses. Elle permet aux utilisateurs de :

- Rechercher des produits
- Consulter les catégories disponibles (Poisson, Charbon, Boissons, Vivriers, Fruits)
- Voir les dépôts les plus proches
- Appeler ou obtenir les itinéraires vers les dépôts
- Utiliser le mode sombre
- Installer l'app sur Chrome comme une application native

## Structure du Projet

```
maman-power-app/
├── src/
│   ├── App.jsx           # Composant principal avec toute la logique
│   ├── App.css           # Styles responsive (mobile-first)
│   ├── index.css         # Styles globaux
│   ├── main.jsx          # Point d'entrée React
│   └── index.js          # Fichier vide
├── public/
│   ├── manifest.json     # Manifest PWA avec configuration
│   └── favicon.svg       # Icône de l'app
├── dist/                 # Production build (généré avec npm run build)
├── vite.config.js        # Configuration Vite avec plugin PWA
└── package.json
```

## Installation & Développement

### Installation

```bash
cd maman-power-app
npm install
```

### Développement (Mode Dev)

```bash
npm run dev
```

L'application sera disponible à `http://localhost:5173/`

### Build de Production

```bash
npm run build
```

Les fichiers compilés seront dans le dossier `dist/`

## Fonctionnalités

### ✅ Implémentées

1. **Interface Responsive Mobile-First**
2. **5 Catégories de Produits** avec dépôts
3. **Gestion des Dépôts** (affichage, distance, produits)
4. **Actions** : Appel téléphonique et itinéraires
5. **Mode Sombre** avec sauvegarde localStorage
6. **Boutons Flottants** pour audio et favoris
7. **PWA Complète** : Installable, offline-ready

## Scripts NPM

- `npm run dev` : Développement
- `npm run build` : Production
- `npm run lint` : Vérifier le code
- `npm run preview` : Voir le build

## Technologies

- **React 19** avec Hooks
- **Vite 8** (build tool)
- **vite-plugin-pwa** (Progressive Web App)
- **CSS vanilla** responsive

## Installation PWA sur Chrome

1. Ouvrir l'app dans Chrome
2. Cliquer sur le menu (⋮) > "Installer MAMAN POWER"
3. L'app s'ajoute aux applications
