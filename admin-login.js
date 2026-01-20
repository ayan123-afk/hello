import { supabase } from './supabase.js';

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) return alert(error.message);

    alert('Login successful!');
    window.location.href = 'admin-panel.html';
}

window.login = login;
