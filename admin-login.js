import { supabase } from './supabase.js';

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) return alert('Enter email and password');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);

    // Save session info in localStorage
    localStorage.setItem('admin_session', JSON.stringify(data.session));
    window.location.href = 'admin-panel.html';
}

window.login = login;

// Redirect if already logged in
const session = JSON.parse(localStorage.getItem('admin_session'));
if(session) window.location.href = 'admin-panel.html';
