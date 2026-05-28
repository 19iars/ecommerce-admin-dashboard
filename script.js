// Simple SPA router and mock admin data with localStorage persistence
const routes = {
  '/': renderDashboard,
  '/products': renderProducts,
  '/orders': renderOrders,
  '/customers': renderCustomers,
};

const STORAGE_KEY = 'rwd_admin_state_v1';

const defaultState = {
  products: [
    {id:1,title:'Classic Shoes',price:59.99,status:'Active',stock:120,image:'https://picsum.photos/id/1025/600'},
    {id:2,title:'Leather Wallet',price:29.99,status:'Active',stock:54,image:'https://picsum.photos/id/1060/600'},
    {id:3,title:'Smart Watch',price:199.00,status:'Inactive',stock:0,image:'https://picsum.photos/id/1003/600'}
  ],
  orders: [
    {id:1001,customer:'Alice',total:129.99,status:'Processing',date:'2026-05-20'},
    {id:1002,customer:'Bob',total:59.99,status:'Shipped',date:'2026-05-21'}
  ],
  customers: [
    {id:1,name:'Alice',email:'alice@example.com',orders:3},
    {id:2,name:'Bob',email:'bob@example.com',orders:1}
  ]
};

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState;
  }catch(e){
    return defaultState;
  }
}

function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const mock = loadState();

// Accessibility helpers
const live = document.getElementById('live');
function announce(msg){ if(live) { live.textContent = msg; setTimeout(()=>{ live.textContent = '' }, 3000); }}

let _previousFocus = null;
function trapFocus(modalEl, onClose){
  _previousFocus = document.activeElement;
  const focusableSel = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  const nodes = Array.from(modalEl.querySelectorAll(focusableSel));
  const first = nodes[0];
  const last = nodes[nodes.length-1];
  if(first) first.focus();

  function keyHandler(e){
    if(e.key === 'Escape'){
      e.preventDefault();
      onClose();
    }
    if(e.key === 'Tab'){
      if(nodes.length === 0) { e.preventDefault(); return; }
      if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus(); } }
      else { if(document.activeElement === last){ e.preventDefault(); first.focus(); } }
    }
  }
  modalEl._keyHandler = keyHandler;
  modalEl.addEventListener('keydown', keyHandler);
}

function releaseFocus(modalEl){
  if(!modalEl) return;
  if(modalEl._keyHandler) modalEl.removeEventListener('keydown', modalEl._keyHandler);
  if(_previousFocus) _previousFocus.focus();
  _previousFocus = null;
}

const app = document.getElementById('app');
const yearEl = document.getElementById('year');
yearEl.innerText = new Date().getFullYear();
let currentRoute = '/';

function setActiveNav(route){
  document.querySelectorAll('.nav li').forEach(li=>{
    li.classList.toggle('active', li.dataset.route === route);
  });
}

function navigate(route){
  location.hash = route;
}

function updateNewItemButton(){
  const newItemButton = document.getElementById('new-item');
  if(!newItemButton) return;
  if(currentRoute === '/products'){
    newItemButton.textContent = 'New Product';
    newItemButton.style.display = 'inline-flex';
  } else if(currentRoute === '/customers'){
    newItemButton.textContent = 'New Customer';
    newItemButton.style.display = 'inline-flex';
  } else {
    newItemButton.style.display = 'none';
  }
}

function routeChanged(){
  const hash = location.hash.slice(1) || '/';
  const route = routes[hash] ? hash : '/';
  currentRoute = route;
  setActiveNav(route);
  routes[route]();
  updateNewItemButton();
  if(window.innerWidth <= 720) document.querySelector('.app-shell').classList.remove('sidebar-open');
}

// Render functions
function renderDashboard(){
  app.innerHTML = '';
  const cards = document.createElement('div');
  cards.className = 'cards';

  const totalProducts = mock.products.length;
  const totalOrders = mock.orders.length;
  const revenue = mock.orders.reduce((s,o)=>s+o.total,0).toFixed(2);

  cards.innerHTML = `
    <div class="card"><h3>Products</h3><p>${totalProducts}</p></div>
    <div class="card"><h3>Orders</h3><p>${totalOrders}</p></div>
    <div class="card"><h3>Revenue</h3><p>$${revenue}</p></div>
  `;

  const recent = document.createElement('div');
  recent.className = 'panel';
  recent.innerHTML = `<h3>Recent Orders</h3>`;
  const table = document.createElement('table');
  table.innerHTML = `<thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  mock.orders.forEach(o=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>#${o.id}</td><td>${o.customer}</td><td>$${o.total}</td><td>${o.status}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  recent.appendChild(table);

  app.appendChild(cards);
  app.appendChild(recent);

  const orderDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const orderHeights = [5,8,3,12,7,9,4];
  const ordersHtml = orderDays.map((day, index)=>`<div class="chart-column"><span class="chart-bar" style="height:${orderHeights[index] * 6}px"></span><small>${day}</small></div>`).join('');
  const topProductsHtml = mock.products.slice(0,5).map(p=>`<div class="chart-row"><strong>${p.title}</strong><span class="chart-bar chart-bar--small" style="width:${Math.min(100, 20 + p.stock * 0.6)}%"></span><small>${p.stock} in stock</small></div>`).join('');

  const charts = document.createElement('div');
  charts.className = 'panel';
  charts.innerHTML = `
    <h3>Overview</h3>
    <div class="dashboard-charts">
      <section>
        <h4>Orders (7d)</h4>
        <div class="chart-grid">
          ${ordersHtml}
        </div>
      </section>
      <section>
        <h4>Top Products</h4>
        <div class="chart-grid horizontal">
          ${topProductsHtml}
        </div>
      </section>
    </div>
  `;
  app.appendChild(charts);
 }

function renderProducts(){
  app.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'panel';
  wrap.innerHTML = `<div class="list-row"><h3>Products</h3><div><button id="btn-new-product" class="btn-primary">New Product</button></div></div>`;

  const table = document.createElement('table');
  table.innerHTML = `<thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>`;
  const tbody = document.createElement('tbody');
  mock.products.forEach(p=>{
    const tr = document.createElement('tr');
    const imgTag = `<img class="product-thumb" src="${p.image}?w=120" srcset="${p.image.replace('/600','/320')} 320w, ${p.image} 600w" sizes="(max-width:720px) 80px, 120px" loading="lazy" alt="${p.title}">`;
    tr.innerHTML = `<td><div class="product-row">${imgTag}<div><div style="font-weight:600">${p.title}</div><div class="muted">ID: ${p.id}</div></div></div></td><td>$${p.price}</td><td>${p.stock}</td><td>${p.status}</td><td><div class="product-actions"><button class="btn-muted" data-action="edit" data-id="${p.id}">Edit</button><button class="btn-muted" data-action="delete" data-id="${p.id}">Delete</button></div></td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  app.appendChild(wrap);

  document.getElementById('btn-new-product').addEventListener('click',()=>openProductForm());
  wrap.querySelectorAll('button[data-action]').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const id = Number(e.currentTarget.dataset.id);
      const action = e.currentTarget.dataset.action;
      if(action==='edit') openProductForm(mock.products.find(x=>x.id===id));
      if(action==='delete') deleteProduct(id);
    });
  });
}

function renderOrders(){
  app.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'panel';
  wrap.innerHTML = `
    <div class="list-row"><h3>Orders</h3>
      <div class="list-row">
        <label class="muted">Status
          <select id="filter-status"><option value="all">All</option><option>Processing</option><option>Shipped</option><option>Cancelled</option></select>
        </label>
        <input id="filter-q" placeholder="Search by order or customer">
      </div>
    </div>`;

  const table = document.createElement('table');
  table.innerHTML = `<thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>`;
  const tbody = document.createElement('tbody');

  function populate(){
    tbody.innerHTML = '';
    const status = document.getElementById('filter-status').value;
    const q = document.getElementById('filter-q').value.toLowerCase().trim();
    const filtered = mock.orders.filter(o=>{
      if(status !== 'all' && o.status !== status) return false;
      if(!q) return true;
      return String(o.id).includes(q) || o.customer.toLowerCase().includes(q);
    });
    if(filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" class="no-results">No orders match your search.</td>`;
      tbody.appendChild(tr);
      return;
    }

    filtered.forEach(o=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>#${o.id}</td><td>${o.customer}</td><td>${o.date}</td><td>$${o.total}</td><td>${o.status}</td>`;
      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  wrap.appendChild(table);
  app.appendChild(wrap);

  document.getElementById('filter-status').addEventListener('change', populate);
  document.getElementById('filter-q').addEventListener('input', populate);
  populate();
}

function renderCustomers(){
  app.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'panel';
  wrap.innerHTML = `
    <div class="list-row">
      <h3>Customers</h3>
      <div class="list-row">
        <input id="filter-customer-q" placeholder="Search name or email">
        <button id="btn-new-customer" class="btn-primary">New Customer</button>
      </div>
    </div>`;

  const table = document.createElement('table');
  table.innerHTML = `<thead><tr><th>Name</th><th>Email</th><th>Orders</th><th></th></tr></thead>`;
  const tbody = document.createElement('tbody');

  function populate(){
    tbody.innerHTML = '';
    const q = document.getElementById('filter-customer-q').value.toLowerCase().trim();
    const filtered = mock.customers.filter(c=>{
      if(!q) return true;
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || String(c.id).includes(q);
    });
    if(filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4" class="no-results">No customers found.</td>`;
      tbody.appendChild(tr);
      return;
    }

    filtered.forEach(c=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${c.name}</td><td>${c.email}</td><td>${c.orders}</td><td><div class="product-actions"><button class="btn-muted" data-action="edit" data-id="${c.id}">Edit</button><button class="btn-muted" data-action="delete" data-id="${c.id}">Delete</button></div></td>`;
      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  wrap.appendChild(table);
  app.appendChild(wrap);

  document.getElementById('btn-new-customer').addEventListener('click',()=>openCustomerForm());
  document.getElementById('filter-customer-q').addEventListener('input', populate);
  document.getElementById('filter-customer-q').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); populate(); }});

  // delegate edit/delete after populate
  // use MutationObserver to attach after DOM updates
  const attachActions = ()=>{
    wrap.querySelectorAll('button[data-action]').forEach(b=>{
      if(b._bound) return; b._bound = true;
      b.addEventListener('click',(e)=>{
        const id = Number(e.currentTarget.dataset.id);
        const action = e.currentTarget.dataset.action;
        if(action==='edit') openCustomerForm(mock.customers.find(x=>x.id===id));
        if(action==='delete') deleteCustomer(id);
      });
    });
  };

  const obs = new MutationObserver(()=> attachActions());
  obs.observe(tbody, {childList:true});
  populate();
}

/* Customers CRUD */
const customerModal = document.getElementById('customer-modal');
const customerForm = document.getElementById('customer-form');
function openCustomerModal(){ customerModal.classList.remove('hidden'); customerModal.setAttribute('aria-hidden','false'); }
function closeCustomerModal(){ customerModal.classList.add('hidden'); customerModal.setAttribute('aria-hidden','true'); }

document.getElementById('customer-modal-close').addEventListener('click', closeCustomerModal);
document.getElementById('customer-modal-cancel').addEventListener('click', closeCustomerModal);

function openCustomerForm(customer){
  document.getElementById('customer-form-title').innerText = customer ? 'Edit Customer' : 'New Customer';
  document.getElementById('customer-id').value = customer ? customer.id : '';
  document.getElementById('customer-name').value = customer ? customer.name : '';
  document.getElementById('customer-email').value = customer ? customer.email : '';
  document.getElementById('customer-orders').value = customer ? customer.orders : 0;
  openCustomerModal();
  trapFocus(customerModal, closeCustomerModal);
}

customerForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const id = Number(document.getElementById('customer-id').value);
  const name = document.getElementById('customer-name').value.trim();
  const email = document.getElementById('customer-email').value.trim();
  const orders = Number(document.getElementById('customer-orders').value) || 0;
  if(id){
    const idx = mock.customers.findIndex(c=>c.id===id);
    if(idx>-1){ mock.customers[idx] = {id,name,email,orders}; }
  } else {
    const nid = mock.customers.reduce((s,c)=>Math.max(s,c.id),0)+1;
    mock.customers.unshift({id:nid,name,email,orders});
  }
  saveState(mock);
  closeCustomerModal();
  releaseFocus(customerModal);
  announce('Customer saved');
  renderCustomers();
});

function deleteCustomer(id){
  if(!confirm('Delete customer #' + id + '?')) return;
  mock.customers = mock.customers.filter(c=>c.id!==id);
  saveState(mock);
  renderCustomers();
  announce('Customer deleted');
}

/* Product form & CRUD */
const modal = document.getElementById('modal');
const productForm = document.getElementById('product-form');
function openModal(){ modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); }
function closeModal(){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);

function openProductForm(product){
  document.getElementById('form-title').innerText = product ? 'Edit Product' : 'New Product';
  document.getElementById('product-id').value = product ? product.id : '';
  document.getElementById('product-title').value = product ? product.title : '';
  document.getElementById('product-price').value = product ? product.price : '';
  document.getElementById('product-stock').value = product ? product.stock : '';
  document.getElementById('product-status').value = product ? product.status : 'Active';
  document.getElementById('product-image').value = product ? product.image : '';
  openModal();
  trapFocus(modal, closeModal);
}

productForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const id = Number(document.getElementById('product-id').value);
  const title = document.getElementById('product-title').value.trim();
  const price = Number(document.getElementById('product-price').value);
  const stock = Number(document.getElementById('product-stock').value);
  const status = document.getElementById('product-status').value;
  const image = document.getElementById('product-image').value || `https://picsum.photos/seed/${encodeURIComponent(title)}/600`;

  if(id){
    const idx = mock.products.findIndex(p=>p.id===id);
    if(idx>-1){ mock.products[idx] = {id,title,price,stock,status,image}; }
  } else {
    const nid = mock.products.reduce((s,p)=>Math.max(s,p.id),0)+1;
    mock.products.unshift({id:nid,title,price,stock,status,image});
  }
  saveState(mock);
  closeModal();
  releaseFocus(modal);
  announce('Product saved');
  renderProducts();
});

function deleteProduct(id){
  if(!confirm('Delete product #' + id + '?')) return;
  mock.products = mock.products.filter(p=>p.id!==id);
  saveState(mock);
  renderProducts();
  announce('Product deleted');
}

// nav delegation: handle clicks and keyboard activation centrally
const navEl = document.querySelector('.nav');
if(navEl){
  navEl.addEventListener('click', (e)=>{
    const li = e.target.closest('li');
    if(!li) return;
    const route = li.dataset.route;
    if(route){ navigate(route); }
    if(window.innerWidth <= 720) document.querySelector('.app-shell').classList.remove('sidebar-open');
  });

  navEl.addEventListener('keydown', (e)=>{
    const li = e.target.closest('li');
    if(!li) return;
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); const route = li.dataset.route; if(route){ navigate(route); if(window.innerWidth <= 720) document.querySelector('.app-shell').classList.remove('sidebar-open'); } }
  });
}

// hamburger toggle for mobile
const hamburger = document.getElementById('hamburger');
if(hamburger){
  hamburger.addEventListener('click',()=>{
    const shell = document.querySelector('.app-shell');
    const expanded = shell.classList.toggle('sidebar-open');
    hamburger.setAttribute('aria-expanded', String(expanded));
  });
}

// theme toggle
const toggle = document.getElementById('toggle-theme');
toggle.addEventListener('click',()=>{
  document.documentElement.classList.toggle('dark');
});

const newItemButton = document.getElementById('new-item');
if(newItemButton){
  newItemButton.addEventListener('click', ()=>{
    if(currentRoute === '/products') openProductForm();
    else if(currentRoute === '/customers') openCustomerForm();
    else if(currentRoute === '/orders') announce('Create orders from the Orders page once backend support is added');
    else announce('Select Products or Customers to create a new item');
  });
}

// global search handling using currentRoute
function handleSearch(q){
  const low = q.toLowerCase().trim();
  if(currentRoute === '/products'){
    const tbody = document.querySelector('#app table tbody');
    if(!tbody) return;
    const filtered = mock.products.filter(p=>p.title.toLowerCase().includes(low));
    tbody.innerHTML = '';
    if(filtered.length === 0){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" class="no-results">No products match your search.</td>`;
      tbody.appendChild(tr);
      return;
    }
    filtered.forEach(p=>{
      const tr = document.createElement('tr');
      const imgTag = `<img class="product-thumb" src="${p.image}?w=120" srcset="${p.image.replace('/600','/320')} 320w, ${p.image} 600w" sizes="(max-width:720px) 80px, 120px" loading="lazy" alt="${p.title}">`;
      tr.innerHTML = `<td><div class="product-row">${imgTag}<div><div style="font-weight:600">${p.title}</div><div class="muted">ID: ${p.id}</div></div></div></td><td>$${p.price}</td><td>${p.stock}</td><td>${p.status}</td><td><div class="product-actions"><button class="btn-muted" data-action="edit" data-id="${p.id}">Edit</button><button class="btn-muted" data-action="delete" data-id="${p.id}">Delete</button></div></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-action]').forEach(b=>{
      b.addEventListener('click', (e)=>{
        const id = Number(e.currentTarget.dataset.id);
        const action = e.currentTarget.dataset.action;
        if(action==='edit') openProductForm(mock.products.find(x=>x.id===id));
        if(action==='delete') deleteProduct(id);
      });
    });
  } else if(currentRoute === '/orders'){
    const fq = document.getElementById('filter-q');
    if(fq){ fq.value = q; fq.dispatchEvent(new Event('input')); }
  } else if(currentRoute === '/customers'){
    const fq = document.getElementById('filter-customer-q');
    if(fq){ fq.value = q; fq.dispatchEvent(new Event('input')); }
  } else {
    announce('Use search on Products, Orders, or Customers pages');
  }
}

const globalSearch = document.getElementById('global-search');
globalSearch.addEventListener('input',(e)=>{ handleSearch(e.target.value); });
globalSearch.addEventListener('keydown',(e)=>{ if(e.key === 'Enter'){ e.preventDefault(); handleSearch(e.target.value); } });

// handle browser navigation using hash routing
window.addEventListener('hashchange', routeChanged);

// initial route
if(!location.hash) location.hash = '/';
routeChanged();
