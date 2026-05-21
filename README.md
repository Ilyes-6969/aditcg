# ADITCG v2 — Avec Supabase Backend

Cette version utilise un **vrai backend Supabase** au lieu de `localStorage`. Les utilisateurs s'inscrivent réellement, les données sont partagées entre utilisateurs, etc.

## 📦 Contenu du dossier

- **HTML** : `index.html`, `series.html`, `set.html`, `carte.html`, `marche.html`, `profil.html`, `trade.html`
- **CSS** : `styles.css`
- **JS Backend** : `supabase-client.js`, `auth.js`, `storage.js`
- **JS App** : `tcgdex-api.js`, `ui.js`, `app.js`, `profil-page.js`, `trade-page.js`

## 🚀 Comment lancer le site

### ⚠️ Important : tu ne peux PAS juste double-cliquer sur `index.html`

Supabase refuse les requêtes qui viennent de `file://` pour des raisons de sécurité (CORS). Il te faut un serveur web.

### Option 1 — Test local rapide (recommandé pour développer)

Ouvre un terminal dans le dossier `aditcg-v2/` et lance :

```bash
# Si tu as Python (déjà installé sur Mac/Linux, à installer sur Windows)
python3 -m http.server 8000

# OU si tu as Node.js
npx serve .
```

Puis ouvre http://localhost:8000 dans ton navigateur.

⚠️ **Avant de tester**, ajoute `http://localhost:8000` dans tes URLs autorisées Supabase :
- Supabase Dashboard → ton projet → **Authentication** → **URL Configuration**
- Ajoute `http://localhost:8000` dans **Site URL** et **Redirect URLs**

### Option 2 — Déploiement gratuit (pour partager le site)

#### Avec Vercel (le plus simple, 5 min)

1. Crée un compte sur https://vercel.com (gratuit, connexion GitHub)
2. Clique **"Add New"** → **"Project"**
3. **"Import Git Repository"** OU **"Upload"** → zippe ton dossier `aditcg-v2/` et upload
4. Vercel détecte automatiquement que c'est un site statique
5. Clique **"Deploy"**
6. En 1 minute tu as ton URL `https://aditcg-xxx.vercel.app`
7. **Important** : retourne dans Supabase → Authentication → URL Configuration et ajoute ton URL Vercel dans **Site URL** et **Redirect URLs**

#### Avec Netlify (alternative)

1. Va sur https://netlify.com (gratuit)
2. Drag & drop ton dossier `aditcg-v2/` sur l'écran d'accueil
3. Site déployé en 30 secondes
4. **Important** : ajoute ton URL Netlify dans Supabase → URL Configuration

## 🔧 Configuration Supabase requise

Si tu n'as pas encore fait ces étapes :

### 1. Tables (déjà fait avec `setup.sql`)
- Va dans **Table Editor** → vérifie que tu as : `profiles`, `collections`, `favorites`, `listings`, `trades`, `activity`

### 2. Confirmation email
Pour tester rapidement sans confirmer les emails :
- **Authentication** → **Providers** → **Email**
- Décoche **"Confirm email"**
- Sauvegarde

**⚠️ À réactiver en production** pour éviter les faux comptes !

### 3. URL Configuration
- **Authentication** → **URL Configuration**
- **Site URL** : ton URL de prod (ou `http://localhost:8000` pour tester)
- **Redirect URLs** : ajoute toutes les URLs depuis lesquelles le site sera utilisé

## ✅ Test du flow complet

Une fois le site lancé :

1. Ouvre le site dans le navigateur
2. Clique **"S'inscrire"**
3. Remplis le formulaire avec un vrai email
4. Si "Confirm email" est désactivé → tu es connecté direct
5. Va sur **Séries** → choisis une série → ajoute quelques cartes à ta collection (+ AJOUTER)
6. Va sur **Collection** → tu dois voir les cartes ajoutées
7. **Test ultime** : ouvre un autre navigateur (ou navigation privée), crée un autre compte, et vérifie que les deux profils sont **séparés** et **persistants**

Si tout marche, **tu as un vrai backend qui scale**.

## 🔑 Sécurité

- La clé `anon public` (dans `supabase-client.js`) est OK à exposer publiquement
- **Toute la sécurité est gérée par Row Level Security (RLS)** côté Supabase :
  - Un user ne peut voir/modifier QUE ses propres collections/favoris/etc.
  - Les profils sont publics (pour la recherche d'utilisateurs)
  - Les listings actifs sont publics
- Les policies sont définies dans le fichier `setup.sql` que tu as exécuté

## 🐛 Si quelque chose ne marche pas

Ouvre la console du navigateur (F12 → Console) et regarde :

- **"Failed to fetch"** ou **CORS error** : ton URL n'est pas dans les Redirect URLs de Supabase
- **"401 Unauthorized"** sur les requêtes : RLS bloque ta requête (vérifie que tu es bien connecté)
- **"relation does not exist"** : le script SQL n'a pas tourné, refais-le

## 📝 Limites actuelles

Ce qui n'est PAS encore implémenté (volontairement, pour pas tout faire d'un coup) :

- **Vrais paiements** (Stripe) — il faut un backend Node.js + clés Stripe
- **Notifications email** lors d'une offre/échange — il faut un service comme Resend ou SendGrid
- **Modération / signalement** d'annonces frauduleuses
- **Système de notation** (avis sur les utilisateurs)
- **Historique du portfolio quotidien** — il faut un cron ou un trigger Supabase
- **Photo de profil custom** (upload d'image) — il faut Supabase Storage
- **Réinitialisation de mot de passe** par email

Ces features peuvent être ajoutées au fur et à mesure. Demande-moi quand tu seras prêt.

---

© 2026 ADITCG — Plateforme indépendante de revente entre particuliers
