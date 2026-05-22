# ADITCG — Plateforme de trading Pokémon TCG (Démo fonctionnelle complète)

Site multi-pages 100% fonctionnel en frontend pur (HTML + CSS + JavaScript vanille).

## ✨ Fonctionnalités

### 🔐 Comptes utilisateur
- **Inscription** : nom, email, username, mot de passe (min 6 caractères)
- **Connexion** : avec validation des erreurs
- **Session persistante** : reste connecté entre les visites
- **Compte démo prêt à l'emploi** :
  - Email : `demo@aditcg.fr`
  - Mot de passe : `demo1234`

> ⚠️ **Note de sécurité** : pour cette démo, les comptes sont stockés en `localStorage` du navigateur. Pour un site en production, un backend (Node.js + base de données + bcrypt + JWT) est nécessaire.

### 📚 Collection persistante
- Ajout / retrait de cartes à votre collection (toggle "+ Ajouter" sur chaque carte)
- Statistiques calculées en temps réel (nombre, valeur, séries, performance 30j)
- Compteur de complétion par série
- Historique du portefeuille (12 derniers mois) avec graphique SVG dynamique

### ⭐ Système de favoris
- Cœur cliquable sur chaque carte (page séries, marché, profil)
- Section dédiée dans le profil
- Persistance entre sessions

### 🔄 Système d'échanges (Trade)
- Composer interactif : 4 emplacements par côté
- Sélecteur de cartes : ma collection OU recherche TCGdex (debounced)
- Calcul automatique des totaux et différentiel
- Soumission d'échange enregistrée dans l'historique
- Réponse aux échanges publics (3 propositions démo)

### 🛒 Marché
- Filtres fonctionnels : séries, rareté, prix
- Tri : prix ↑↓, plus récentes, popularité
- Bouton **Acheter** inline avec confirmation modal
- Bouton **Faire une offre** avec saisie de prix

### 🃏 Pages série
- Toutes les cartes affichées avec leurs vraies images (TCGdex)
- Boutons inline sur chaque carte : `♡ Favori` et `+ AJOUTER` à la collection
- Filtres : Toutes / Possédées / Manquantes / Rares
- Mise à jour en temps réel de la barre de progression

### 📋 Page catalogue séries
- 200+ séries depuis l'API TCGdex
- Filtres : Toutes / Récentes / WOTC / Populaires
- Vue **Grille** OU **Liste** (toggle fonctionnel)
- Tri : date, nombre de cartes, alphabétique
- Logo de chaque série affiché

### 🌓 Dark mode
- Toggle ☀/☾ dans la navbar
- Persistance + détection préférence système
- Anti-FOUC (pas de flash au chargement)

### 💰 Prix réels Cardmarket
- Intégration directe via TCGdex API
- Badge "Source: Cardmarket" (vert) sur les cartes avec prix réel
- Badge "Prix estimé" (gris) sur les cartes anciennes/rares non listées
- Mise à jour quotidienne par TCGdex

### 🔍 Recherche globale
- Barre de recherche dans la navbar
- Recherche live (300ms debounced) dans la base TCGdex
- Résultats avec images et liens directs

### 🔔 Notifications toast
- Succès / erreur / avertissement / info
- Auto-dismiss après 3.5s
- Animation slide-in depuis la droite

## 📁 Structure des fichiers

```
aditcg/
├── index.html          ← Accueil
├── series.html         ← Catalogue séries
├── set.html            ← Détail d'une série (toutes ses cartes)
├── carte.html          ← Détail d'une carte
├── marche.html         ← Marché (achat)
├── trade.html          ← Échanges
├── profil.html         ← Profil + collection + portefeuille
│
├── styles.css          ← Design system complet (light + dark)
│
├── auth.js             ← Inscription, connexion, sessions
├── storage.js          ← Collection, favoris, trades, activité, portefeuille
├── ui.js               ← Modals, toasts, navbar, recherche
├── tcgdex-api.js       ← Client API TCGdex + cache 6h
├── app.js              ← Dark mode + effets visuels
├── profil-page.js      ← Logique de la page profil
├── trade-page.js       ← Logique de la page échanges
│
└── README.md           ← Ce fichier
```

## 🚀 Utilisation

1. Ouvrez `index.html` dans un navigateur moderne (Chrome, Firefox, Safari, Edge)
2. Cliquez sur **"S'inscrire"** pour créer un compte, OU
3. Cliquez sur **"Connexion"** et utilisez `demo@aditcg.fr` / `demo1234`
4. Explorez les séries, ajoutez des cartes à votre collection, proposez des échanges !

## 🔧 API utilisée

- **TCGdex** (`api.tcgdex.net/v2/fr`) — gratuit, sans clé API, inclut les prix Cardmarket réels

## 🎨 Design

- **Palette Pokémon** : rouge `#dc0a2d`, bleu `#3b4cca`, jaune `#ffcb05`
- **Style OpenSea** : cartes de collection avec floor/volume/variation
- **Typo** : Fraunces (display), Manrope (body), JetBrains Mono (mono)
- **Pokéball logo** : composant CSS pur (resilient au dark mode)

## 🛠 Pour aller plus loin

Pour transformer cette démo en site en production, il faudrait :
- **Backend Node.js/Express ou similaire** avec base de données (PostgreSQL/MongoDB)
- **Authentification réelle** : bcrypt pour hash, JWT pour sessions
- **API REST** : `/api/users`, `/api/cards`, `/api/trades`, etc.
- **Paiements** : intégration Stripe (cartes bancaires) ou PayPal
- **Stockage cloud** : AWS S3 pour les images d'utilisateur
- **Notifications email** : SendGrid / Postmark / Mailgun
- **Modération** : système de signalement + admin panel

---

© 2026 ADITCG · Démo construite par Claude (Anthropic)
