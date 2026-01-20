// Funções de autenticação
async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        document.getElementById('login-message').textContent = error.message;
        document.getElementById('login-message').className = 'message error';
        return false;
    }
    
    return true;
}

async function register(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                name: name
            }
        }
    });
    
    if (error) {
        document.getElementById('register-message').textContent = error.message;
        document.getElementById('register-message').className = 'message error';
        return false;
    }
    
    return true;
}

async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao sair:', error);
    }
}

function checkAuth() {
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session && !window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    });
}

async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        document.getElementById('user-name').textContent = user.user_metadata?.name || 'Usuário';
        document.getElementById('user-email').textContent = user.email;
    }
}