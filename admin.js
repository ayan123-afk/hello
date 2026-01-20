import { supabase } from './supabase.js';

async function addProduct() {
    const name = document.getElementById('pname').value;
    const desc = document.getElementById('pdesc').value;
    const price = document.getElementById('pprice').value;
    const fileInput = document.getElementById('pimage');
    
    if (!fileInput.files.length) return alert('Please select an image');

    const file = fileInput.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    // Upload image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

    if(uploadError) return alert('Image upload failed: ' + uploadError.message);

    // Get public URL
    const { publicUrl, error: urlError } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

    if(urlError) return alert('Error getting image URL: ' + urlError.message);

    // Save product in DB
    const { error: dbError } = await supabase.from('products').insert([{
        name,
        description: desc,
        price,
        image_url: publicUrl
    }]);

    if(dbError) return alert('Error adding product: ' + dbError.message);

    alert('Product added successfully!');
    loadOrders();
}
