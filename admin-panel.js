import { supabase } from "./supabase.js";

/* ---------------- AUTH CHECK ---------------- */
const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");

const isAdmin = localStorage.getItem("admin_logged_in");

if (isAdmin) {
  loginBox.style.display = "none";
  dashboard.style.display = "block";
} else {
  loginBox.style.display = "block";
  dashboard.style.display = "none";
}

/* ---------------- LOGIN ---------------- */
window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  localStorage.setItem("admin_logged_in", "true");
  location.reload();
};

/* ---------------- LOGOUT ---------------- */
window.logout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem("admin_logged_in");
  location.reload();
};

/* ---------------- ADD PRODUCT (IMAGE UPLOADER FIXED) ---------------- */
window.addProduct = async () => {
  try {
    const name = document.getElementById("name").value;
    const price = document.getElementById("price").value;
    const description = document.getElementById("description").value;
    const file = document.getElementById("image").files[0];

    if (!name || !price || !description || !file) {
      alert("All fields required");
      return;
    }

    /* ✅ IMPORTANT: upload inside folder */
    const filePath = `products/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) {
      alert("Image upload failed: " + uploadError.message);
      return;
    }

    /* ✅ Get PUBLIC URL (THIS IS WHAT FIXES IMAGE DISPLAY) */
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    const image_url = urlData.publicUrl;

    /* ✅ Insert product */
    const { error: insertError } = await supabase
      .from("products")
      .insert([
        {
          name,
          description,
          price,
          image_url,
        },
      ]);

    if (insertError) {
      alert("DB error: " + insertError.message);
      return;
    }

    alert("Product added successfully ✅");

    // clear form
    document.getElementById("name").value = "";
    document.getElementById("price").value = "";
    document.getElementById("description").value = "";
    document.getElementById("image").value = "";

  } catch (err) {
    alert("Unexpected error: " + err.message);
  }
};
