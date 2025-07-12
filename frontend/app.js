const API_BASE_URL = '/api';

// État de l'application
let currentUser = null;
let currentPostId = null;
let allPosts = [];

// Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    if (pageId === 'forum') {
        loadPostsFromAPI();
    } else if (pageId === 'dashboard' && currentUser) {
        loadDashboard();
    }
    
    window.scrollTo(0, 0);
}

// Modal Auth
function showModal(type) {
    document.getElementById('authModal').classList.remove('hidden');
    if (type === 'login') {
        document.getElementById('modalTitle').textContent = 'Connexion';
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('signupForm').classList.add('hidden');
    } else {
        document.getElementById('modalTitle').textContent = 'Inscription';
        document.getElementById('signupForm').classList.remove('hidden');
        document.getElementById('loginForm').classList.add('hidden');
    }
}

function closeModal() {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
}

// Auth handlers
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('wyzdev_token', data.token);
            
            // Utiliser les données utilisateur retournées par l'API de login
            if (data.user) {
                currentUser = data.user;
                currentUser._id = data.user.id; // S'assurer que _id est défini
                localStorage.setItem('wyzdev_user', JSON.stringify(currentUser));
            } else {
                // Fallback: récupérer les infos utilisateur via l'API profile
                const userResponse = await fetch(`${API_BASE_URL}/user/profile`, {
                    headers: {
                        'Authorization': `Bearer ${data.token}`
                    }
                });
                
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    currentUser = userData;
                    currentUser.id = currentUser._id;
                    localStorage.setItem('wyzdev_user', JSON.stringify(currentUser));
                }
            }
            
            console.log('Utilisateur connecté:', currentUser);
            
            updateAuthUI();
            closeModal();
            alert('Connexion réussie!');
            loadNotifications();
        } else {
            alert(data.msg || 'Erreur de connexion');
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Inscription réussie! Vous pouvez maintenant vous connecter.');
            showModal('login');
        } else {
            alert(data.msg || 'Erreur d\'inscription');
        }
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        alert('Erreur de connexion au serveur');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('wyzdev_token');
    localStorage.removeItem('wyzdev_user');
    updateAuthUI();
    showPage('home');
    alert('Déconnexion réussie!');
}

function updateAuthUI() {
    if (currentUser) {
        document.getElementById('authButtons').classList.add('hidden');
        document.getElementById('userMenu').classList.remove('hidden');
        document.getElementById('username').textContent = currentUser.username || currentUser.email;
        
        // Mettre à jour l'avatar
        if (currentUser.profilePic) {
            document.getElementById('userProfilePic').src = `http://localhost:5001${currentUser.profilePic}`;
            document.getElementById('userProfilePic').classList.remove('hidden');
            document.getElementById('defaultAvatar').classList.add('hidden');
        } else {
            const initials = (currentUser.username || currentUser.email).substring(0, 2).toUpperCase();
            document.getElementById('defaultAvatar').textContent = initials;
            document.getElementById('defaultAvatar').classList.remove('hidden');
            document.getElementById('userProfilePic').classList.add('hidden');
        }
    } else {
        document.getElementById('authButtons').classList.remove('hidden');
        document.getElementById('userMenu').classList.add('hidden');
    }
}

// Create Post
function showCreatePost() {
    if (!currentUser) {
        alert('Veuillez vous connecter pour créer un post');
        showModal('login');
        return;
    }
    document.getElementById('createPostModal').classList.remove('hidden');
}

function closeCreatePost() {
    document.getElementById('createPostModal').classList.add('hidden');
    document.getElementById('postTitle').value = '';
    document.getElementById('postCategory').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postCode').value = '';
}

async function handleCreatePost(event) {
    event.preventDefault();
    
    if (!currentUser) {
        alert('Veuillez vous connecter pour créer un post');
        closeCreatePost();
        showModal('login');
        return;
    }

    const title = document.getElementById('postTitle').value;
    const category = document.getElementById('postCategory').value;
    const content = document.getElementById('postContent').value;
    const code = document.getElementById('postCode').value;

    try {
        const response = await fetch(`${API_BASE_URL}/posts/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            },
            body: JSON.stringify({ title, category, content, code })
        });

        const data = await response.json();

        if (response.ok) {
            closeCreatePost();
            alert('Post créé avec succès!');
            loadPostsFromAPI();
            
            // Recharger le dashboard si on y est pour mettre à jour le compteur
            if (document.getElementById('dashboard').classList.contains('active')) {
                loadDashboard();
            }
        } else {
            alert(data.msg || 'Erreur lors de la création du post');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

// Load posts from API
async function loadPostsFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/all`);
        const data = await response.json();

        if (response.ok) {
            allPosts = data.posts;
            displayPosts(allPosts);
        }
    } catch (error) {
        console.error('Erreur chargement posts:', error);
        document.getElementById('postsContainer').innerHTML = '<p class="text-red-400 text-center">Erreur lors du chargement des posts</p>';
    }
}

function displayPosts(posts) {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '';
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="text-gray-400 text-center">Aucun post pour le moment. Soyez le premier à créer un post!</p>';
    } else {
        posts.forEach(post => addPostToDOM(post));
    }
}

function filterPosts(category) {
    // Mettre à jour les boutons de catégorie
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('bg-purple-600');
            btn.classList.remove('glass-effect');
        } else {
            btn.classList.remove('bg-purple-600');
            btn.classList.add('glass-effect');
        }
    });
    
    if (category === 'all') {
        displayPosts(allPosts);
    } else {
        const filteredPosts = allPosts.filter(post => post.category === category);
        displayPosts(filteredPosts);
    }
}

function addPostToDOM(post) {
    const postsContainer = document.getElementById('postsContainer');
    const postElement = document.createElement('div');
    postElement.className = `glass-effect p-6 rounded-xl hover-grow cursor-pointer relative ${post.isClosed ? 'border-l-4 border-green-500' : ''}`;
    postElement.onclick = () => viewPost(post._id);
    
    const categoryColors = {
        'JavaScript': 'purple',
        'Python': 'yellow',
        'Java': 'red',
        'C++': 'blue',
        'SQL': 'green',
        'Web Dev': 'pink',
        'Mobile': 'indigo',
        'Autre': 'gray'
    };
    
    const color = categoryColors[post.category] || 'gray';
    const timeAgo = getTimeAgo(post.timestamp || post.createdAt);
    
    postElement.innerHTML = `
        ${post.isClosed ? `
            <div class="absolute -top-2 -left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                ✓ Résolu
            </div>
        ` : ''}
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <h3 class="text-xl font-bold mb-2">${post.title}</h3>
                <p class="text-gray-400 mb-2">${post.content.substring(0, 100)}...</p>
                <div class="flex space-x-4 text-sm text-gray-500">
                    <span>Par ${post.author.username || post.author}</span>
                    <span>${timeAgo}</span>
                    <span class="text-green-400">${post.replyCount || 0} réponses</span>
                </div>
            </div>
            <div class="flex flex-col items-end space-y-2">
                <span class="px-3 py-1 bg-${color}-600/20 text-${color}-400 rounded-full text-sm">${post.category}</span>
            </div>
        </div>
    `;
    
    postsContainer.appendChild(postElement);
}

async function viewPost(postId) {
    currentPostId = postId;
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`);
        const data = await response.json();
        
        if (response.ok) {
            const post = data;
            document.getElementById('postDetailTitle').textContent = post.title;
            
            const postContent = document.getElementById('postDetailContent');
            postContent.innerHTML = `
                <div class="mb-4">
                    <span class="text-sm text-gray-400">Par ${post.author.username || 'Utilisateur'} • ${getTimeAgo(post.createdAt)}</span>
                    <span class="ml-4 px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">${post.category}</span>
                    ${post.isClosed ? '<span class="ml-2 text-blue-400">✓ Résolu</span>' : ''}
                </div>
                <p class="text-gray-300 mb-4">${post.content}</p>
                ${post.code ? `<pre class="bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>${escapeHtml(post.code)}</code></pre>` : ''}
            `;
            
            // Afficher les boutons Supprimer et Marquer résolu seulement si l'utilisateur est l'auteur
            const postActions = document.getElementById('postActions');
            
            if (currentUser && post.author) {
                // Comparaison simple et robuste des IDs
                const currentUserId = String(currentUser._id || currentUser.id || '');
                const postAuthorId = String(post.author._id || post.author.id || '');
                
                console.log('Debug comparaison utilisateur/auteur:');
                console.log('- Current User ID:', currentUserId);
                console.log('- Post Author ID:', postAuthorId);
                console.log('- Sont égaux:', currentUserId === postAuthorId);
                
                if (currentUserId && postAuthorId && currentUserId === postAuthorId) {
                    console.log('✅ Utilisateur est l\'auteur - affichage des boutons');
                    postActions.style.display = 'flex';
                    
                    // Mettre à jour le texte du bouton résolu
                    const btnToggleResolved = document.getElementById('btnToggleResolved');
                    btnToggleResolved.textContent = post.isClosed ? 'Réouvrir le post' : 'Marquer résolu';
                } else {
                    console.log('❌ Utilisateur n\'est pas l\'auteur - masquage des boutons');
                    postActions.style.display = 'none';
                }
            } else {
                console.log('❌ Utilisateur non connecté ou pas d\'auteur');
                postActions.style.display = 'none';
            }
            
            // Charger les réponses
            loadReplies(postId);
            
            document.getElementById('viewPostModal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement du post');
    }
}



function closeViewPost() {
    document.getElementById('viewPostModal').classList.add('hidden');
    currentPostId = null;
}


async function loadReplies(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/replies/post/${postId}`);
        const data = await response.json();
        
        if (response.ok) {
            const repliesContainer = document.getElementById('repliesContainer');
            repliesContainer.innerHTML = '';
            
            if (data.replies.length === 0) {
                repliesContainer.innerHTML = '<p class="text-gray-400">Aucune réponse pour le moment.</p>';
            } else {
                data.replies.forEach(reply => {
                    const replyElement = document.createElement('div');
                    replyElement.className = 'glass-effect p-4 rounded-lg';
                    replyElement.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-sm text-gray-400">Par ${reply.author.username || 'Utilisateur'} • ${getTimeAgo(reply.createdAt)}</span>
                        </div>
                        <p class="text-gray-300">${reply.content}</p>
                    `;
                    repliesContainer.appendChild(replyElement);
                });
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}


async function handleAddReply(event) {
    event.preventDefault();
    
    if (!currentUser) {
        alert('Veuillez vous connecter pour répondre');
        return;
    }
    
    const content = document.getElementById('replyContent').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/replies/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            },
            body: JSON.stringify({ postId: currentPostId, content })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('replyContent').value = '';
            loadReplies(currentPostId);
            // Recharger les posts pour mettre à jour le compteur
            loadPostsFromAPI();
        } else {
            alert(data.msg || 'Erreur lors de l\'ajout de la réponse');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}


async function loadDashboard() {
    if (!currentUser) return;
    
    // Mettre à jour les infos utilisateur
    document.getElementById('dashboardUsername').textContent = currentUser.username || 'Nom d\'utilisateur';
    document.getElementById('dashboardEmail').textContent = currentUser.email;
    document.getElementById('editUsername').value = currentUser.username || '';
    document.getElementById('editEmail').value = currentUser.email;
    
    // Afficher la date d'inscription
    const dateToUse = currentUser.joinDate || currentUser.createdAt;
    if (dateToUse) {
        const joinDate = new Date(dateToUse);
        const options = { year: 'numeric', month: 'long' };
        const formattedDate = joinDate.toLocaleDateString('fr-FR', options);
        document.getElementById('joinDate').textContent = formattedDate;
    } else {
        document.getElementById('joinDate').textContent = 'Date inconnue';
    }
    
    // Gérer la photo de profil correctement
    if (currentUser.profilePic) {
        document.getElementById('dashboardProfilePic').src = `http://localhost:5001${currentUser.profilePic}`;
    } else {
        // Remettre l'image par défaut si pas de photo de profil
        document.getElementById('dashboardProfilePic').src = 'https://via.placeholder.com/120/8a63d9/ffffff?text=User';
    }
    
    // Charger les posts de l'utilisateur
    try {
        // Utiliser _id si id n'existe pas
        const userId = currentUser.id || currentUser._id;
        
        const response = await fetch(`${API_BASE_URL}/posts/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const userPostsContainer = document.getElementById('userPosts');
            userPostsContainer.innerHTML = '';
            
            // Mettre à jour le compteur de posts
            document.getElementById('userPostCount').textContent = data.posts ? data.posts.length : 0;
            
            if (!data.posts || data.posts.length === 0) {
                userPostsContainer.innerHTML = '<p class="text-gray-400">Vous n\'avez pas encore créé de posts.</p>';
            } else {
                data.posts.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'glass-effect p-4 rounded-lg cursor-pointer hover:bg-purple-600/10 transition-all';
                    postElement.onclick = () => {
                        showPage('forum');
                        setTimeout(() => viewPost(post._id), 100);
                    };
                    postElement.innerHTML = `
                        <h4 class="font-bold mb-1">${post.title}</h4>
                        <p class="text-sm text-gray-400">${getTimeAgo(post.createdAt)} • ${(post.replies ? post.replies.length : 0)} réponses</p>
                        ${post.isClosed ? '<span class="text-xs text-green-400 ml-2">✓ Résolu</span>' : ''}
                    `;
                    userPostsContainer.appendChild(postElement);
                });
            }
        } else {
            console.error('Erreur chargement posts utilisateur:', response.status);
            document.getElementById('userPosts').innerHTML = '<p class="text-red-400">Erreur lors du chargement des posts.</p>';
        }
    } catch (error) {
        console.error('Erreur chargement posts utilisateur:', error);
        document.getElementById('userPosts').innerHTML = '<p class="text-red-400">Erreur de connexion au serveur.</p>';
    }
}


async function handleUpdateProfile(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const username = document.getElementById('editUsername').value;
    const email = document.getElementById('editEmail').value;
    const password = document.getElementById('editPassword').value;
    
    if (username) formData.append('username', username);
    if (email) formData.append('email', email);
    if (password) formData.append('password', password);
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            alert('Profil mis à jour avec succès!');
            // Recharger les infos utilisateur
            const userResponse = await fetch(`${API_BASE_URL}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
                }
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                currentUser = userData;
                currentUser.id = currentUser._id;
                localStorage.setItem('wyzdev_user', JSON.stringify(currentUser));
                updateAuthUI();
                loadDashboard();
            }
        } else {
            alert('Erreur lors de la mise à jour du profil');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}


async function handleProfilePicUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('profilePic', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            alert('Photo de profil mise à jour!');
            // Recharger les infos utilisateur
            const userResponse = await fetch(`${API_BASE_URL}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
                }
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                currentUser = userData;
                currentUser.id = currentUser._id;
                localStorage.setItem('wyzdev_user', JSON.stringify(currentUser));
                updateAuthUI();
                loadDashboard();
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'upload de la photo');
    }
}


async function loadNotifications() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.count > 0) {
                document.getElementById('notificationBadge').textContent = data.count;
                document.getElementById('notificationBadge').classList.remove('hidden');
            } else {
                document.getElementById('notificationBadge').classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Erreur chargement notifications:', error);
    }
}

async function showNotifications() {
    if (!currentUser) {
        alert('Veuillez vous connecter pour voir vos notifications');
        return;
    }
    
    document.getElementById('notificationsModal').classList.remove('hidden');
    await loadNotificationsList();
}

function closeNotifications() {
    document.getElementById('notificationsModal').classList.add('hidden');
}

async function loadNotificationsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            }
        });
        
        if (response.ok) {
            const notifications = await response.json();
            const container = document.getElementById('notificationsContainer');
            container.innerHTML = '';
            
            if (notifications.length === 0) {
                container.innerHTML = '<p class="text-gray-400 text-center">Aucune notification pour le moment.</p>';
            } else {
                notifications.forEach(notification => {
                    const notifElement = document.createElement('div');
                    notifElement.className = `glass-effect p-4 rounded-lg cursor-pointer transition-all ${
                        notification.read ? 'opacity-60' : 'border-l-4 border-purple-500'
                    }`;
                    
                    const timeAgo = getTimeAgo(notification.createdAt);
                    const senderName = notification.sender?.username || 'Utilisateur';
                    
                    notifElement.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                                    ${senderName.substring(0, 2).toUpperCase()}
                                </div>
                                <span class="font-semibold">${senderName}</span>
                                ${!notification.read ? '<span class="w-2 h-2 bg-purple-500 rounded-full"></span>' : ''}
                            </div>
                            <span class="text-xs text-gray-400">${timeAgo}</span>
                        </div>
                        <p class="text-gray-300 mb-2">${notification.message}</p>
                        <div class="flex space-x-2">
                            ${notification.post ? `<button onclick="viewPostFromNotification('${notification.post._id || notification.post}', '${notification._id}')" class="px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-700 transition-all">Voir le post</button>` : ''}
                            ${!notification.read ? `<button onclick="markNotificationRead('${notification._id}')" class="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 transition-all">Marquer lu</button>` : ''}
                            <button onclick="deleteNotification('${notification._id}')" class="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700 transition-all">Supprimer</button>
                        </div>
                    `;
                    
                    container.appendChild(notifElement);
                });
            }
        }
    } catch (error) {
        console.error('Erreur chargement liste notifications:', error);
        document.getElementById('notificationsContainer').innerHTML = '<p class="text-red-400 text-center">Erreur lors du chargement des notifications</p>';
    }
}

async function markNotificationRead(notificationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            }
        });
        
        if (response.ok) {
            loadNotificationsList();
            loadNotifications(); // Mettre à jour le badge
        }
    } catch (error) {
        console.error('Erreur marquage notification:', error);
    }
}

async function markAllNotificationsRead() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            }
        });
        
        if (response.ok) {
            loadNotificationsList();
            loadNotifications(); // Mettre à jour le badge
            alert('Toutes les notifications ont été marquées comme lues');
        }
    } catch (error) {
        console.error('Erreur marquage toutes notifications:', error);
    }
}

async function deleteNotification(notificationId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            }
        });
        
        if (response.ok) {
            loadNotificationsList();
            loadNotifications(); // Mettre à jour le badge
        }
    } catch (error) {
        console.error('Erreur suppression notification:', error);
    }
}

async function viewPostFromNotification(postId, notificationId) {
    // Marquer la notification comme lue
    await markNotificationRead(notificationId);
    
    // Fermer le modal de notifications
    closeNotifications();
    
    // Aller à la page forum et ouvrir le post
    showPage('forum');
    setTimeout(() => {
        viewPost(postId);
    }, 100);
}

// Post Actions
async function handleDeletePost() {
    if (!currentUser || !currentPostId) {
        alert('Erreur: utilisateur non connecté ou post non sélectionné');
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${currentPostId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Post supprimé avec succès!');
            closeViewPost();
            loadPostsFromAPI(); // Recharger la liste des posts
            if (document.getElementById('dashboard').classList.contains('active')) {
                loadDashboard(); // Recharger le dashboard si on y est
            }
        } else {
            alert(data.msg || 'Erreur lors de la suppression du post');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function handleToggleResolved() {
    if (!currentUser || !currentPostId) {
        alert('Erreur: utilisateur non connecté ou post non sélectionné');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${currentPostId}/close`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('wyzdev_token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.msg || 'Statut du post mis à jour!');
            // Recharger la vue du post pour mettre à jour l'affichage
            viewPost(currentPostId);
            loadPostsFromAPI(); // Recharger la liste des posts
        } else {
            alert(data.msg || 'Erreur lors de la mise à jour du statut');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

// Contact form
function handleContact(event) {
    event.preventDefault();
    alert('Message envoyé avec succès! Nous vous répondrons dans les plus brefs délais.');
    event.target.reset();
}

// Utility functions
function getTimeAgo(timestamp) {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('wyzdev_token');
    const savedUser = localStorage.getItem('wyzdev_user');
    
    if (savedToken && savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateAuthUI();
            loadNotifications();
        } catch (error) {
            console.error('Erreur lors du parsing des données utilisateur:', error);
            localStorage.removeItem('wyzdev_token');
            localStorage.removeItem('wyzdev_user');
        }
    }
});

// Fermer les modals en cliquant en dehors
window.onclick = function(event) {
    if (event.target.id === 'authModal') {
        closeModal();
    }
    if (event.target.id === 'createPostModal') {
        closeCreatePost();
    }
    if (event.target.id === 'viewPostModal') {
        closeViewPost();
    }
    if (event.target.id === 'notificationsModal') {
        closeNotifications();
    }
}
fetch('/api/posts')
  .then(res => res.json())
  .then(data => {
    // traitement des données reçues
  })
  .catch(error => {
    console.error('Erreur lors de la récupération des posts :', error);
  });

