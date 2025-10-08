(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Order Management
  const ORDERS_KEY = 'shreeji_orders';

  // Get all orders from localStorage
  function getOrders() {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  }

  // Save order to localStorage
  function saveOrder(order) {
    const orders = getOrders();
    order.id = Date.now().toString(); // Simple unique ID
    order.timestamp = new Date().toISOString();
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return order;
  }

  // Create and show order modal
  function showOrderModal(item, alt, category) {
    // Create modal HTML
    const modalHTML = `
      <div class="order-modal" id="orderModal">
        <div class="order-modal-content">
          <div class="order-modal-header">
            <h2 class="order-modal-title">Order Now</h2>
            <button class="order-modal-close" aria-label="Close order form">&times;</button>
          </div>
          <div class="order-modal-body">
            <div class="order-product-preview">
              <div class="order-product-image">
                <img src="${item.image}" alt="${alt}" />
              </div>
              <div class="order-product-details">
                <h3 class="order-product-name">${alt}</h3>
                <p class="order-product-weight">Weight: ${item.weight}</p>
                <p class="order-product-category">Category: ${category}</p>
              </div>
            </div>
            
            <form class="order-form" id="orderForm">
              <div class="field">
                <label for="order-name" class="label">Full Name *</label>
                <input type="text" id="order-name" name="name" class="input" required placeholder="Enter your full name">
              </div>
              
              <div class="field">
                <label for="order-phone" class="label">Contact Number *</label>
                <input type="tel" id="order-phone" name="phone" class="input" required placeholder="Enter your phone number">
              </div>
              
              <div class="field">
                <label for="order-address" class="label">Delivery Address *</label>
                <textarea id="order-address" name="address" class="input" required placeholder="Enter your complete address" rows="3"></textarea>
              </div>
              
              <div class="field">
                <label for="order-quantity" class="label">Quantity *</label>
                <input type="number" id="order-quantity" name="quantity" class="input" required min="1" value="1" placeholder="Enter quantity">
              </div>
              
              <div class="field">
                <label for="order-notes" class="label">Additional Notes</label>
                <textarea id="order-notes" name="notes" class="input" placeholder="Any special requirements or notes..." rows="2"></textarea>
              </div>
              
              <div class="order-form-actions">
                <button type="button" class="btn" id="cancelOrder">Cancel</button>
                <button type="submit" class="btn btn-primary">Place Order</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('orderModal');
    
    // Close modal handlers
    const closeModal = () => modal.classList.add('hidden');
    
    document.querySelector('.order-modal-close').addEventListener('click', closeModal);
    document.getElementById('cancelOrder').addEventListener('click', closeModal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    // Form submission
    document.getElementById('orderForm').addEventListener('submit', (e) => {
      e.preventDefault();
      handleOrderSubmission(item, alt, category);
    });
    
    // Show modal
    modal.classList.remove('hidden');
  }

  // Handle order form submission
  function handleOrderSubmission(item, alt, category) {
    const form = document.getElementById('orderForm');
    const formData = new FormData(form);
    
    const order = {
      product: {
        name: alt,
        image: item.image,
        weight: item.weight,
        category: category
      },
      customer: {
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address')
      },
      orderDetails: {
        quantity: parseInt(formData.get('quantity')),
        notes: formData.get('notes')
      }
    };
    
    // Validate required fields
    if (!order.customer.name || !order.customer.phone || !order.customer.address || !order.orderDetails.quantity) {
      alert('Please fill in all required fields.');
      return;
    }
    
    try {
      // Save to localStorage
      const savedOrder = saveOrder(order);
      
      // Optional: Send email via EmailJS
      sendOrderEmail(savedOrder);
      
      // Show success message
      showOrderSuccess(savedOrder);
      
    } catch (error) {
      console.error('Error saving order:', error);
      alert('There was an error placing your order. Please try again.');
    }
  }

  // Optional: Send order via EmailJS
  function sendOrderEmail(order) {
    // You'll need to set up EmailJS account and replace these with your details
    const emailjsConfig = {
      serviceId: 'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
      templateId: 'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
      publicKey: 'YOUR_PUBLIC_KEY' // Replace with your EmailJS public key
    };
    
    // Check if EmailJS is available and configured
    if (typeof emailjs !== 'undefined' && 
        emailjsConfig.serviceId !== 'YOUR_SERVICE_ID') {
      
      const emailParams = {
        to_email: 'your-email@example.com', // Your business email
        from_name: order.customer.name,
        from_phone: order.customer.phone,
        from_address: order.customer.address,
        product_name: order.product.name,
        product_weight: order.product.weight,
        product_category: order.product.category,
        quantity: order.orderDetails.quantity,
        notes: order.orderDetails.notes || 'No additional notes',
        order_id: order.id,
        order_date: new Date(order.timestamp).toLocaleDateString()
      };
      
      emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        emailParams,
        emailjsConfig.publicKey
      )
      .then(() => {
        console.log('Order email sent successfully');
      })
      .catch((error) => {
        console.warn('Failed to send order email:', error);
        // Order is still saved in localStorage even if email fails
      });
    }
  }

  // Show order success message
  function showOrderSuccess(order) {
    const modalBody = document.querySelector('.order-modal-body');
    modalBody.innerHTML = `
      <div class="order-success">
        <span class="order-success-icon">✅</span>
        <h3 class="order-success-title">Order Placed Successfully!</h3>
        <p class="order-success-message">
          Thank you for your order, ${order.customer.name}!<br>
          We'll contact you at ${order.customer.phone} to confirm details.
        </p>
        <div class="order-details">
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Product:</strong> ${order.product.name}</p>
          <p><strong>Quantity:</strong> ${order.orderDetails.quantity}</p>
        </div>
        <button class="btn btn-primary" id="closeSuccess">Close</button>
      </div>
    `;
    
    document.getElementById('closeSuccess').addEventListener('click', () => {
      document.getElementById('orderModal').classList.add('hidden');
      // Remove modal from DOM after animation
      setTimeout(() => {
        const modal = document.getElementById('orderModal');
        if (modal) modal.remove();
      }, 300);
    });
  }

  // Wishlist Management
  const WISHLIST_KEY = 'shreeji_wishlist';

  function getWishlist() {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  }

  function saveWishlist(items) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  }

  function addToWishlist(item) {
    const wishlist = getWishlist();
    if (!wishlist.find(w => w.image === item.image)) {
      wishlist.push(item);
      saveWishlist(wishlist);
      updateWishlistBadge();
      return true;
    }
    return false;
  }

  function removeFromWishlist(image) {
    const wishlist = getWishlist();
    const newWishlist = wishlist.filter(item => item.image !== image);
    saveWishlist(newWishlist);
    updateWishlistBadge();
  }

  function isInWishlist(image) {
    const wishlist = getWishlist();
    return wishlist.some(item => item.image === image);
  }

  function updateWishlistBadge() {
    const badge = document.querySelector('.wishlist-count');
    if (badge) {
      const count = getWishlist().length;
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = count > 0 ? 'grid' : 'none';
    }
  }

  // Search and Filter Functions
  function filterItems(items, filters) {
    return items.filter(item => {
      const weight = parseFloat(item.weight);
      
      // Weight range filter
      if (filters.minWeight && weight < parseFloat(filters.minWeight)) return false;
      if (filters.maxWeight && weight > parseFloat(filters.maxWeight)) return false;
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        // You might want to add item names or other searchable properties
        if (!item.alt?.toLowerCase().includes(searchTerm)) return false;
      }
      
      return true;
    });
  }

  function sortItems(items, sortBy) {
    const sorted = [...items];
    
    switch (sortBy) {
      case 'weight-low':
        return sorted.sort((a, b) => parseFloat(a.weight) - parseFloat(b.weight));
      case 'weight-high':
        return sorted.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
      case 'newest':
      default:
        return sorted; // Assuming items are already in order
    }
  }

  // WhatsApp Integration
  function shareOnWhatsApp(item) {
    const message = `Hi! I'm interested in this jewellery item:\n\n*${item.alt}*\nWeight: ${item.weight}\n\nCould you please share more details and price?`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  const setYear = () => {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  };

  async function loadCategories() {
    const res = await fetch("assets/data/categories.json", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to load categories.json");
    return res.json();
  }

  function createCategoryCard(cat) {
    const a = document.createElement("a");
    a.className = "card card-link";
    a.href = `category.html?name=${encodeURIComponent(cat.slug)}`;
    a.setAttribute("aria-label", `Open ${cat.name} category`);

    const media = document.createElement("div");
    media.className = "card-media";

    const img = document.createElement("img");
    img.src = cat.thumbnail;
    img.alt = `${cat.name} preview image`;
    media.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = cat.name;

    const meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = `${cat.count} item${cat.count === 1 ? "" : "s"}`;

    body.appendChild(title);
    body.appendChild(meta);

    a.appendChild(media);
    a.appendChild(body);
    return a;
  }

  // Enhanced Gallery Item Creation with Order Now button
  function createGalleryItem(item, alt, category) {
    const fig = document.createElement("figure");
    fig.className = "card";

    const media = document.createElement("div");
    media.className = "card-media";

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = alt;

    // Click to view full image
    img.addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      overlay.style.display = "flex";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = "9999";

      const fullImg = document.createElement("img");
      fullImg.src = item.image;
      fullImg.alt = alt;
      fullImg.style.maxWidth = "90%";
      fullImg.style.maxHeight = "90%";
      fullImg.style.borderRadius = "10px";
      fullImg.style.boxShadow = "0 0 20px rgba(255,255,255,0.3)";

      overlay.addEventListener("click", () => overlay.remove());
      overlay.appendChild(fullImg);
      document.body.appendChild(overlay);
    });

    media.appendChild(img);

    const cap = document.createElement("figcaption");
    cap.className = "card-body";

    const nameP = document.createElement("p");
    nameP.className = "card-meta";
    nameP.textContent = alt;
    cap.appendChild(nameP);

    // Weight text
    if (item.weight) {
      const weightP = document.createElement("p");
      weightP.className = "item-weight";
      weightP.textContent = `Weight: ${item.weight}`;
      cap.appendChild(weightP);
    }

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'item-actions';
    
    // Order Now button
    const orderBtn = document.createElement('button');
    orderBtn.className = 'action-btn order-now';
    orderBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
      Order Now
    `;
    orderBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showOrderModal(item, alt, category);
    });
    
    // WhatsApp button
    const whatsappBtn = document.createElement('button');
    whatsappBtn.className = 'action-btn whatsapp';
    whatsappBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893-.001-3.189-1.248-6.189-3.515-8.452"/>
      </svg>
      Chat for Price
    `;
    whatsappBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      shareOnWhatsApp({...item, alt, category});
    });
    
    // Wishlist button
    const wishlistBtn = document.createElement('button');
    wishlistBtn.className = `action-btn wishlist ${isInWishlist(item.image) ? 'active' : ''}`;
    wishlistBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      Wishlist
    `;
    wishlistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isInWishlist(item.image)) {
        removeFromWishlist(item.image);
        wishlistBtn.classList.remove('active');
      } else {
        if (addToWishlist({...item, alt, category})) {
          wishlistBtn.classList.add('active');
        }
      }
    });
    
    actions.appendChild(orderBtn);
    actions.appendChild(whatsappBtn);
    actions.appendChild(wishlistBtn);
    cap.appendChild(actions);

    fig.appendChild(media);
    fig.appendChild(cap);
    return fig;
  }

  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function showError(inputId, message) {
    const el = document.querySelector(
      `[data-error-for="${CSS.escape(inputId)}"]`
    );
    if (el) el.textContent = message || "";
  }

  function clearErrors(form) {
    $$(".error", form).forEach((e) => (e.textContent = ""));
  }

  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  function handlePasswordToggles() {
    $$(".password-toggle").forEach((btn) => {
      const targetId = btn.getAttribute("data-target");
      btn.addEventListener("click", () => {
        const input = document.getElementById(targetId);
        if (!input) return;
        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        btn.setAttribute(
          "aria-label",
          isHidden ? "Hide password" : "Show password"
        );
      });
    });
  }

  // Initialize Search and Filter
  function initSearchFilter(categoryItems, categoryName) {
    const searchBox = document.querySelector('.search-input');
    const minWeightInput = document.querySelector('.filter-min-weight');
    const maxWeightInput = document.querySelector('.filter-max-weight');
    const sortSelect = document.querySelector('.filter-sort');
    
    let currentItems = [...categoryItems];
    
    function updateDisplay() {
      const filters = {
        search: searchBox?.value || '',
        minWeight: minWeightInput?.value || '',
        maxWeight: maxWeightInput?.value || ''
      };
      
      const sortBy = sortSelect?.value || 'newest';
      
      let filtered = filterItems(currentItems, filters);
      filtered = sortItems(filtered, sortBy);
      
      const grid = document.querySelector('[data-items]');
      const empty = document.querySelector('[data-items-empty]');
      
      if (grid) {
        grid.innerHTML = '';
        if (filtered.length === 0) {
          if (empty) empty.hidden = false;
        } else {
          if (empty) empty.hidden = true;
          filtered.forEach((item, i) => {
            const alt = `${categoryName} ${i + 1}`;
            grid.appendChild(createGalleryItem(item, alt, categoryName));
          });
        }
      }
    }
    
    // Event listeners
    if (searchBox) searchBox.addEventListener('input', updateDisplay);
    if (minWeightInput) minWeightInput.addEventListener('change', updateDisplay);
    if (maxWeightInput) maxWeightInput.addEventListener('change', updateDisplay);
    if (sortSelect) sortSelect.addEventListener('change', updateDisplay);
  }

  async function initHome() {
    const grid = document.querySelector("[data-categories]")
    if (!grid) return
    try {
      const data = await loadCategories()
      const cats = data.categories || []
      if (!cats.length) {
        const empty = $("[data-categories-empty]")
        if (empty) empty.hidden = false
        return
      }
      cats.forEach((cat) => grid.appendChild(createCategoryCard(cat)))
    } catch (err) {
      const empty = $("[data-categories-empty]")
      if (empty) {
        empty.textContent = "Unable to load categories."
        empty.hidden = false
      }
      console.warn("[v0] Failed to load categories:", err)
    }
  }

  // Enhanced Category Initialization
  async function initCategory() {
    const itemsGrid = document.querySelector("[data-items]");
    if (!itemsGrid) return;

    const slug = getQueryParam("name");
    const nameEl = document.querySelector("[data-category-name]");
    const titleEl = document.querySelector("[data-category-title]");
    if (nameEl) nameEl.textContent = slug ? slug : "Unknown";
    if (titleEl)
      titleEl.textContent = slug
        ? slug.charAt(0).toUpperCase() + slug.slice(1)
        : "Category";

    try {
      const data = await loadCategories();
      const cats = data.categories || [];
      const cat = cats.find((c) => c.slug === slug);

      if (!cat || !cat.items) return;

      // Add search and filter bar
      const sectionHead = document.querySelector('.section-head');
      if (sectionHead) {
        const filterHTML = `
          <div class="search-filter-bar">
            <div class="search-box">
              <input type="text" class="search-input" placeholder="Search items...">
              <button class="btn btn-primary search-btn">Search</button>
            </div>
            <div class="filter-controls">
              <div class="filter-group">
                <label class="filter-label">Min Weight (g)</label>
                <input type="number" class="filter-input filter-min-weight" placeholder="0" step="0.1" min="0">
              </div>
              <div class="filter-group">
                <label class="filter-label">Max Weight (g)</label>
                <input type="number" class="filter-input filter-max-weight" placeholder="100" step="0.1" min="0">
              </div>
              <div class="filter-group">
                <label class="filter-label">Sort By</label>
                <select class="filter-select filter-sort">
                  <option value="newest">Newest First</option>
                  <option value="weight-low">Weight: Low to High</option>
                  <option value="weight-high">Weight: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        `;
        sectionHead.insertAdjacentHTML('afterend', filterHTML);

        // Add search button event listener
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
          searchBtn.addEventListener('click', () => {
            const searchBox = document.querySelector('.search-input');
            if (searchBox) {
              searchBox.focus();
            }
          });
        }
      }

      // Initialize with all items
      initSearchFilter(cat.items, cat.name);
      
    } catch (err) {
      const empty = $("[data-items-empty]");
      if (empty) {
        empty.textContent = "Unable to load items for this category.";
        empty.hidden = false;
      }
      console.warn("[v0] Failed to load items:", err);
    }
  }

  function initLogin() {
    const form = $("#loginForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors(form);

      const username = $("#login-username")?.value.trim();
      const password = $("#login-password")?.value;

      let ok = true;
      if (!username) {
        showError("login-username", "Username is required");
        ok = false;
      }
      if (!password) {
        showError("login-password", "Password is required");
        ok = false;
      } else if (password.length < 6) {
        // Example error per spec
        showError("login-password", "Password is incorrect");
        ok = false;
      }

      if (ok) {
        alert("Logged in (demo). No backend connected.");
        form.reset();
      }
    });
  }

  function initRegister() {
    const form = $("#registerForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors(form);

      const username = $("#reg-username")?.value.trim();
      const email = $("#reg-email")?.value.trim();
      const password = $("#reg-password")?.value;
      const confirm = $("#reg-confirm")?.value;

      let ok = true;
      if (!username) {
        showError("reg-username", "Username is required");
        ok = false;
      }
      if (!email) {
        showError("reg-email", "Email is required");
        ok = false;
      } else if (!validateEmail(email)) {
        showError("reg-email", "Please enter a valid email");
        ok = false;
      }
      if (!password) {
        showError("reg-password", "Password is required");
        ok = false;
      } else if (password.length < 6) {
        showError("reg-password", "Password must be at least 6 characters");
        ok = false;
      }
      if (!confirm) {
        showError("reg-confirm", "Please confirm your password");
        ok = false;
      } else if (confirm !== password) {
        showError("reg-confirm", "Passwords do not match");
        ok = false;
      }

      if (ok) {
        alert("Account created (demo). No backend connected.");
        form.reset();
      }
    });
  }

  function initForgot() {
    const form = $("#forgotForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors(form);

      const email = $("#forgot-email")?.value.trim();
      let ok = true;

      if (!email) {
        showError("forgot-email", "Email is required");
        ok = false;
      } else if (!validateEmail(email)) {
        showError("forgot-email", "Please enter a valid email");
        ok = false;
      }

      if (ok) {
        alert("Reset link sent (demo). No backend connected.");
        form.reset();
      }
    });
  }

  // Add WhatsApp float button
  function addWhatsAppFloat() {
    const floatBtn = document.createElement('a');
    floatBtn.href = 'https://wa.me/?text=Hi! I would like to know more about your jewellery collection.';
    floatBtn.className = 'whatsapp-float';
    floatBtn.target = '_blank';
    floatBtn.setAttribute('aria-label', 'Contact us on WhatsApp');
    floatBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893-.001-3.189-1.248-6.189-3.515-8.452"/>
      </svg>
    `;
    document.body.appendChild(floatBtn);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setYear();
    handlePasswordToggles();
    updateWishlistBadge();
    addWhatsAppFloat();

    const page = document.body.getAttribute("data-page");
    switch (page) {
      case "home":
        return void initHome();
      case "category":
        return void initCategory();
      case "login":
        return void initLogin();
      case "register":
        return void initRegister();
      case "forgot":
        return void initForgot();
      default:
        break;
    }
  });
})();