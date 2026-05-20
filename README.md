# ADITCG — Notes techniques

## 🎨 Mode sombre

Un bouton ☀/☾ a été ajouté dans la navbar (à gauche du bouton "Connexion"). Il :
- Bascule entre mode clair et mode sombre
- Sauvegarde le choix dans `localStorage` (clé : `aditcg_theme`)
- Au premier chargement, détecte automatiquement la préférence système de l'utilisateur (`prefers-color-scheme: dark`)
- Un script anti-flash dans le `<head>` de chaque page applique le thème avant le rendu pour éviter le clignotement

## 💰 Prix réels Cardmarket

Le fichier `tcgdex-api.js` contient maintenant la fonction `getRealPrice(card)` qui :
1. **Priorité 1** : récupère les prix Cardmarket en EUR depuis `card.pricing.cardmarket` (mise à jour quotidienne)
2. **Priorité 2** : si pas dispo, utilise TCGplayer en USD et convertit en EUR (taux fixe 0.92)
3. **Fallback** : estime un prix basé sur la rareté + nom du Pokémon (pour les vieilles cartes EX/Full Art HGSS/BW que les marketplaces n'ont pas listées)

**Pages affichant le badge "source" :**
- `carte.html` (détail) : badge "Cardmarket" en vert si prix réel, "Estimation" en gris sinon
- `set.html` (détail série) : floor price calculé sur les VRAIS prix des cartes du set, tag "★ Prix Cardmarket" affiché si > 50% de couverture réelle

**Couverture** : la majorité des cartes modernes (2018+) ont des prix réels. Les vieilles cartes Wizards/EX/Diamond&Pearl auront souvent l'estimation.

## 🏦 Intégration TCGplayer (future)

Le scaffolding est dans `tcgdex-api.js` :

```js
const TCGPLAYER_CONFIG = {
  enabled: false,    // passer à true
  apiKey: null,      // ta clé API TCGplayer
  baseUrl: 'https://api.tcgplayer.com/catalog/products',
};
```

**Limitation importante** : TCGplayer bloque les appels CORS depuis le navigateur. Tu auras besoin d'un petit backend (Node Express, Python Flask, Cloudflare Worker, etc.) qui :
1. Reçoit la requête du navigateur
2. Appelle TCGplayer avec ta clé API
3. Retourne le résultat

Une fois ton backend en place, modifie `getTCGplayerPrice()` dans `tcgdex-api.js` pour appeler ton endpoint au lieu de l'API TCGplayer directement.

**Comment obtenir une clé TCGplayer** :
1. Inscription sur https://developer.tcgplayer.com (gratuit)
2. Créer une application → tu reçois `Public Key` + `Private Key`
3. Faire un POST sur `/token` pour obtenir un Bearer token
4. Utiliser ce token dans tes appels API

## 🚀 Lancement local

```bash
cd aditcg
python3 -m http.server 8000
# Ou avec Node :
npx serve
```

Puis ouvrir http://localhost:8000

Le premier chargement prend ~3 secondes pour télécharger la liste des séries, ensuite le cache localStorage rend tout instantané (TTL 6h).
