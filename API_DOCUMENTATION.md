# Documentation API WyzDev Forum

## Base URL
```
http://localhost:5001/api
```

## Authentication
La plupart des endpoints nécessitent un token JWT dans le header Authorization :
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /api/auth/register
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "JohnDoe"
}
```

**Response:**
```json
{
  "msg": "Utilisateur créé"
}
```

#### POST /api/auth/login
Se connecter et obtenir un token JWT.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "email": "user@example.com"
}
```

### User Profile

#### GET /api/user/profile
Obtenir son propre profil (authentification requise).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "userId",
  "email": "user@example.com",
  "username": "JohnDoe",
  "profilePic": "/uploads/profile-pics/image.jpg",
  "bio": "Développeur passionné",
  "location": "Paris, France",
  "website": "https://example.com",
  "github": "johndoe",
  "skills": ["JavaScript", "React", "Node.js"],
  "preferredLanguages": ["JavaScript", "Python"],
  "reputation": 150,
  "joinDate": "2024-01-01T00:00:00.000Z",
  "lastActive": "2024-01-10T10:00:00.000Z"
}
```

#### PUT /api/user/profile
Mettre à jour son profil (authentification requise).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data (si upload d'image)
```

**Body (form-data):**
- email (string)
- username (string)
- password (string)
- bio (string)
- location (string)
- website (string)
- github (string)
- skills (string, séparés par des virgules)
- preferredLanguages (array)
- profilePic (file)

#### GET /api/users/:userId
Obtenir le profil public d'un utilisateur.

**Response:**
```json
{
  "user": {
    "_id": "userId",
    "username": "JohnDoe",
    "profilePic": "/uploads/profile-pics/image.jpg",
    "bio": "Développeur passionné",
    "location": "Paris, France",
    "website": "https://example.com",
    "github": "johndoe",
    "skills": ["JavaScript", "React", "Node.js"],
    "preferredLanguages": ["JavaScript", "Python"],
    "reputation": 150,
    "joinDate": "2024-01-01T00:00:00.000Z",
    "lastActive": "2024-01-10T10:00:00.000Z"
  },
  "stats": {
    "postCount": 25,
    "replyCount": 100,
    "totalContributions": 125
  },
  "recentActivity": {
    "posts": [...],
    "replies": [...]
  }
}
```

### Posts

#### POST /api/posts/create
Créer un nouveau post (authentification requise).

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Comment optimiser une requête SQL?",
  "content": "J'ai une requête qui prend trop de temps...",
  "code": "SELECT * FROM users WHERE...",
  "category": "SQL",
  "tags": ["optimisation", "performance"]
}
```

#### GET /api/posts/all
Obtenir tous les posts avec pagination.

**Query Parameters:**
- page (number, default: 1)
- limit (number, default: 10)
- category (string)
- search (string)
- sortBy (string: "recent", "popular", "mostReplies")

**Response:**
```json
{
  "posts": [...],
  "currentPage": 1,
  "totalPages": 10,
  "totalPosts": 100
}
```

#### GET /api/posts/:postId
Obtenir un post spécifique avec ses réponses.

**Response:**
```json
{
  "_id": "postId",
  "title": "Comment optimiser une requête SQL?",
  "content": "...",
  "code": "...",
  "category": "SQL",
  "author": {
    "_id": "userId",
    "username": "JohnDoe",
    "profilePic": "...",
    "reputation": 150
  },
  "replies": [...],
  "views": 250,
  "likes": ["userId1", "userId2"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /api/posts/:postId
Mettre à jour un post (authentification requise, auteur seulement).

#### DELETE /api/posts/:postId
Supprimer un post (authentification requise, auteur ou admin).

#### POST /api/posts/:postId/like
Liker/Unliker un post (authentification requise).

### Replies

#### POST /api/replies/create
Créer une réponse à un post (authentification requise).

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "postId": "postId",
  "content": "Voici ma solution...",
  "code": "SELECT * FROM users...",
  "parentReplyId": null
}
```

#### GET /api/replies/post/:postId
Obtenir toutes les réponses d'un post.

**Query Parameters:**
- page (number, default: 1)
- limit (number, default: 20)
- sortBy (string: "createdAt", "oldest", "likes")

#### PUT /api/replies/:replyId
Mettre à jour une réponse (authentification requise, auteur seulement).

#### DELETE /api/replies/:replyId
Supprimer une réponse (authentification requise, auteur ou admin).

#### POST /api/replies/:replyId/like
Liker/Unliker une réponse (authentification requise).

#### POST /api/replies/:replyId/accept
Marquer une réponse comme acceptée (authentification requise, auteur du post seulement).

### Search & Discovery

#### GET /api/users/search
Rechercher des utilisateurs.

**Query Parameters:**
- q (string, required, min 2 caractères)
- limit (number, default: 10)

#### GET /api/users/top
Obtenir les utilisateurs avec le plus de réputation.

**Query Parameters:**
- limit (number, default: 10)

#### GET /api/posts/user/:userId
Obtenir tous les posts d'un utilisateur.

**Query Parameters:**
- page (number, default: 1)
- limit (number, default: 10)

#### GET /api/replies/user/:userId
Obtenir toutes les réponses d'un utilisateur.

**Query Parameters:**
- page (number, default: 1)
- limit (number, default: 20)

## Codes d'erreur

- 200: Succès
- 201: Créé avec succès
- 400: Mauvaise requête
- 401: Non authentifié
- 403: Non autorisé
- 404: Non trouvé
- 500: Erreur serveur

## Système de réputation

- Créer un post: +0 points
- Répondre à un post: +2 points
- Recevoir un like sur un post: +1 point
- Recevoir un like sur une réponse: +1 point
- Réponse acceptée: +10 points
