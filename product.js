import { supabase } from "./supabase.js";

const productContainer = document.getElementById("products");

/* -------- FETCH PRODUCTS -------- */
async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    productContainer.innerHTML = "<p>Error loading products</p>";
    return;
  }

  productContainer.innerHTML = "";

  data.forEach((product) => {
    productContainer.innerHTML += `
      <div class="product-card">
        <img 
          src="${product.image_url}" 
          alt="${product.name}" 
          onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'"
        />
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <strong>₹${product.price}</strong>
        <button onclick='addToCart(${JSON.stringify(product)})'>
          Add to Cart
        </button>
      </div>
    `;
  });
}

loadProducts();

/* -------- CART (BASIC) -------- */
window.addToCart = (product) => {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push(product);
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart 🛒");
};
