import { supabase } from './supabase.js';

async function addProduct() {
    const name = document.getElementById('pname').value.trim();
    const desc = document.getElementById('pdesc').value.trim();
    const price = parseFloat(document.getElementById('pprice').value);
    const image_url = document.getElementById('pimageurl').value.trim();

    if(!name || !price || !image_url) return alert('Please fill all fields');

    const { data, error } = await supabase
        .from('products')
        .insert([{ name, description: desc, price, image_url }]);

    if(error) return alert('Error adding product: ' + error.message);

    alert('Product added successfully!');
    document.getElementById('pname').value = '';
    document.getElementById('pdesc').value = '';
    document.getElementById('pprice').value = '';
    document.getElementById('pimageurl').value = '';

    loadProductsAdmin();
}

async function loadProductsAdmin() {
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if(error) return console.log(error);

    const list = document.getElementById('product-list-admin');
    if(!list) return;

    if(!products.length){
        list.innerHTML = '<p>No products yet.</p>';
        return;
    }

    list.innerHTML = products.map(p => `
        <div style="margin-bottom:10px;">
            <img src="${p.image_url}" width="100" />
            <b>${p.name}</b> - ₹${p.price}
        </div>
    `).join('');
}

window.addProduct = addProduct;
window.loadProductsAdmin = loadProductsAdmin;

loadProductsAdmin();
