import fetch from 'node-fetch';

const API_URL = 'http://localhost:5001/api';
let authToken = '';
let testUserId = '';
let testPostId = '';
let testReplyId = '';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI() {
  log('\n=== TESTS API FORUM WYZDEV ===\n', 'blue');

  try {
    // 1. Test de création de compte
    log('1. Test création de compte...', 'yellow');
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `testuser${Date.now()}@example.com`,
        password: 'password123',
        username: `TestUser${Date.now()}`
      })
    });
    
    if (registerRes.ok) {
      log('✓ Compte créé avec succès', 'green');
    } else {
      const error = await registerRes.json();
      log(`✗ Erreur création compte: ${error.msg}`, 'red');
    }

    // 2. Test de connexion
    log('\n2. Test connexion...', 'yellow');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `testuser${Date.now()}@example.com`,
        password: 'password123'
      })
    });

    if (loginRes.ok) {
      const loginData = await loginRes.json();
      authToken = loginData.token;
      log('✓ Connexion réussie', 'green');
      log(`  Token: ${authToken.substring(0, 20)}...`, 'blue');
    } else {
      const error = await loginRes.json();
      log(`✗ Erreur connexion: ${error.msg}`, 'red');
      return;
    }

    // 3. Test obtenir profil
    log('\n3. Test obtenir profil...', 'yellow');
    const profileRes = await fetch(`${API_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (profileRes.ok) {
      const profile = await profileRes.json();
      testUserId = profile._id;
      log('✓ Profil récupéré', 'green');
      log(`  ID: ${testUserId}`, 'blue');
      log(`  Username: ${profile.username}`, 'blue');
    } else {
      log('✗ Erreur récupération profil', 'red');
    }

    // 4. Test création de post
    log('\n4. Test création de post...', 'yellow');
    const createPostRes = await fetch(`${API_URL}/posts/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Test Post - Comment optimiser React?',
        content: 'Je cherche des conseils pour optimiser mes composants React...',
        code: 'const MyComponent = () => { return <div>Hello</div>; }',
        category: 'JavaScript',
        tags: ['react', 'optimisation', 'performance']
      })
    });

    if (createPostRes.ok) {
      const postData = await createPostRes.json();
      testPostId = postData.post._id;
      log('✓ Post créé avec succès', 'green');
      log(`  ID: ${testPostId}`, 'blue');
      log(`  Titre: ${postData.post.title}`, 'blue');
    } else {
      const error = await createPostRes.json();
      log(`✗ Erreur création post: ${error.msg}`, 'red');
    }

    // 5. Test récupération de tous les posts
    log('\n5. Test récupération des posts...', 'yellow');
    const allPostsRes = await fetch(`${API_URL}/posts/all?limit=5`);

    if (allPostsRes.ok) {
      const postsData = await allPostsRes.json();
      log('✓ Posts récupérés', 'green');
      log(`  Nombre de posts: ${postsData.posts.length}`, 'blue');
      log(`  Total: ${postsData.totalPosts}`, 'blue');
    } else {
      log('✗ Erreur récupération posts', 'red');
    }

    // 6. Test récupération d'un post spécifique
    log('\n6. Test récupération post spécifique...', 'yellow');
    const singlePostRes = await fetch(`${API_URL}/posts/${testPostId}`);

    if (singlePostRes.ok) {
      const post = await singlePostRes.json();
      log('✓ Post récupéré', 'green');
      log(`  Vues: ${post.views}`, 'blue');
      log(`  Auteur: ${post.author.username}`, 'blue');
    } else {
      log('✗ Erreur récupération post', 'red');
    }

    // 7. Test création de réponse
    log('\n7. Test création de réponse...', 'yellow');
    const createReplyRes = await fetch(`${API_URL}/replies/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        postId: testPostId,
        content: 'Voici quelques conseils pour optimiser React: utilisez React.memo, useMemo et useCallback',
        code: 'const MemoizedComponent = React.memo(MyComponent);'
      })
    });

    if (createReplyRes.ok) {
      const replyData = await createReplyRes.json();
      testReplyId = replyData.reply._id;
      log('✓ Réponse créée avec succès', 'green');
      log(`  ID: ${testReplyId}`, 'blue');
    } else {
      const error = await createReplyRes.json();
      log(`✗ Erreur création réponse: ${error.msg}`, 'red');
    }

    // 8. Test like sur un post
    log('\n8. Test like sur post...', 'yellow');
    const likePostRes = await fetch(`${API_URL}/posts/${testPostId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (likePostRes.ok) {
      const likeData = await likePostRes.json();
      log('✓ Post liké', 'green');
      log(`  Nombre de likes: ${likeData.likes}`, 'blue');
    } else {
      log('✗ Erreur like post', 'red');
    }

    // 9. Test recherche utilisateurs
    log('\n9. Test recherche utilisateurs...', 'yellow');
    const searchUsersRes = await fetch(`${API_URL}/users/search?q=Test`);

    if (searchUsersRes.ok) {
      const searchData = await searchUsersRes.json();
      log('✓ Recherche utilisateurs effectuée', 'green');
      log(`  Résultats: ${searchData.users.length}`, 'blue');
    } else {
      log('✗ Erreur recherche utilisateurs', 'red');
    }

    // 10. Test profil public
    log('\n10. Test profil public...', 'yellow');
    const publicProfileRes = await fetch(`${API_URL}/users/${testUserId}`);

    if (publicProfileRes.ok) {
      const publicProfile = await publicProfileRes.json();
      log('✓ Profil public récupéré', 'green');
      log(`  Username: ${publicProfile.user.username}`, 'blue');
      log(`  Posts: ${publicProfile.stats.postCount}`, 'blue');
      log(`  Réponses: ${publicProfile.stats.replyCount}`, 'blue');
    } else {
      log('✗ Erreur récupération profil public', 'red');
    }

    // 11. Test mise à jour profil
    log('\n11. Test mise à jour profil...', 'yellow');
    const updateProfileRes = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        bio: 'Développeur passionné de JavaScript et React',
        location: 'Paris, France',
        skills: 'JavaScript,React,Node.js,MongoDB',
        preferredLanguages: ['JavaScript', 'Python']
      })
    });

    if (updateProfileRes.ok) {
      log('✓ Profil mis à jour', 'green');
    } else {
      log('✗ Erreur mise à jour profil', 'red');
    }

    // 12. Test top utilisateurs
    log('\n12. Test top utilisateurs...', 'yellow');
    const topUsersRes = await fetch(`${API_URL}/users/top?limit=5`);

    if (topUsersRes.ok) {
      const topUsers = await topUsersRes.json();
      log('✓ Top utilisateurs récupéré', 'green');
      log(`  Nombre: ${topUsers.users.length}`, 'blue');
      if (topUsers.users.length > 0) {
        log(`  #1: ${topUsers.users[0].username} (${topUsers.users[0].reputation} pts)`, 'blue');
      }
    } else {
      log('✗ Erreur récupération top utilisateurs', 'red');
    }

    log('\n=== TESTS TERMINÉS ===\n', 'green');

  } catch (error) {
    log(`\n✗ Erreur générale: ${error.message}`, 'red');
  }
}

// Lancer les tests
testAPI();
