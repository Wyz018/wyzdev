# Backend Forum WyzDev

## 🚀 Installation

1. **Cloner le projet**
```bash
git clone [votre-repo]
cd [votre-projet]
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
Créer un fichier `.env` à la racine du projet :
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/wyzdev-forum
JWT_SECRET=votre_secret_jwt_super_securise
NODE_ENV=development
```

4. **Démarrer MongoDB**
Assurez-vous que MongoDB est installé et lancé sur votre système.

5. **Lancer le serveur**
```bash
npm start
```

Le serveur sera accessible sur `http://localhost:5001`

## 📁 Structure du projet

```
├── models/
│   ├── user.js         # Modèle utilisateur
│   ├── post.js         # Modèle post du forum
│   └── reply.js        # Modèle réponse
├── routes/
│   ├── auth.js         # Routes d'authentification
│   ├── user.js         # Routes profil utilisateur (legacy)
│   ├── userRoutes.js   # Routes utilisateur complètes
│   ├── posts.js        # Routes posts du forum
│   ├── replies.js      # Routes réponses
│   └── middleware/
│       └── authMiddleware.js  # Middleware JWT
├── uploads/
│   └── profile-pics/   # Photos de profil
├── frontend/           # Fichiers frontend
├── server.js           # Point d'entrée du serveur
└── .env               # Variables d'environnement
```

## 🔧 Fonctionnalités principales

### Authentification
- ✅ Inscription avec email et mot de passe
- ✅ Connexion avec JWT
- ✅ Protection des routes privées

### Gestion des utilisateurs
- ✅ Profil utilisateur complet (bio, skills, localisation, etc.)
- ✅ Upload de photo de profil
- ✅ Profils publics consultables
- ✅ Système de réputation
- ✅ Recherche d'utilisateurs
- ✅ Classement des meilleurs contributeurs

### Forum
- ✅ Création de posts avec catégories
- ✅ Support du code avec coloration syntaxique
- ✅ Système de tags
- ✅ Réponses aux posts
- ✅ Réponses imbriquées
- ✅ Système de likes
- ✅ Marquage de réponse acceptée
- ✅ Compteur de vues
- ✅ Recherche full-text
- ✅ Filtrage par catégorie
- ✅ Tri (récent, populaire, plus de réponses)
- ✅ Pagination

### Système de réputation
- Répondre à un post : +2 points
- Recevoir un like : +1 point
- Réponse acceptée : +10 points

## 🧪 Tests

Pour tester l'API :
```bash
node test-forum-api.js
```

## 📚 Documentation API

Voir le fichier [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) pour la documentation complète de tous les endpoints.

## 🛠️ Technologies utilisées

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **JWT** - Authentification
- **Bcrypt** - Hashage des mots de passe
- **Multer** - Upload de fichiers
- **Cors** - Cross-Origin Resource Sharing

## 📝 Exemples d'utilisation

### Créer un post
```javascript
fetch('http://localhost:5001/api/posts/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    title: 'Comment optimiser React?',
    content: 'Je cherche des conseils...',
    category: 'JavaScript',
    tags: ['react', 'performance']
  })
});
```

### Répondre à un post
```javascript
fetch('http://localhost:5001/api/replies/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    postId: 'POST_ID',
    content: 'Voici ma solution...',
    code: 'const optimized = React.memo(Component);'
  })
});
```

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Authentification JWT
- Validation des entrées
- Protection contre les injections
- Limite de taille pour les uploads
- CORS configuré

## 🚦 Statuts de réponse

- `200` : Succès
- `201` : Créé avec succès
- `400` : Mauvaise requête
- `401` : Non authentifié
- `403` : Non autorisé
- `404` : Non trouvé
- `500` : Erreur serveur

## 📈 Améliorations futures

- [ ] Notifications en temps réel (WebSocket)
- [ ] Système de messagerie privée
- [ ] Badges et achievements
- [ ] Modération avancée
- [ ] Export des données
- [ ] API GraphQL
- [ ] Cache Redis
- [ ] Elasticsearch pour la recherche

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est sous licence MIT.
