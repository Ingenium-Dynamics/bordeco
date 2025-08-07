document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();

    document.getElementById('category-filter').addEventListener('change', (e) => {
        loadProducts(e.target.value);
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
        searchProducts(e.target.value.trim());
    });
});

async function loadCategories() {
    const select = document.getElementById('category-filter');
    try {
        const snapshot = await db.collection('categorias').get();
        snapshot.forEach(doc => {
            select.innerHTML += `<option value="${doc.id}">${doc.data().descripcion}</option>`;
        });
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

async function loadProducts(categoryId = 'all') {
    const container = document.getElementById('products-container');
    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary"></div></div>';

    try {
        let query = db.collection('productos');
        if (categoryId !== 'all') {
            query = query.where('id_categoria', '==', categoryId);
        }

        const snapshot = await query.get();
        renderProducts(snapshot);

    } catch (error) {
        console.error("Error cargando productos:", error);
        container.innerHTML = '<p>Error al cargar productos.</p>';
    }
}

async function searchProducts(searchTerm) {
    const container = document.getElementById('products-container');
    if (searchTerm.length < 2) {
        loadProducts();
        return;
    }

    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary"></div></div>';

    try {
        const snapshot = await db.collection('productos')
            .where('nombre', '>=', searchTerm)
            .where('nombre', '<=', searchTerm + '\uf8ff')
            .get();
        renderProducts(snapshot);
    } catch (error) {
        console.error("Error buscando:", error);
    }
}

function renderProducts(snapshot) {
    const container = document.getElementById('products-container');
    if (snapshot.empty) {
        container.innerHTML = '<p class="text-center">No se encontraron productos.</p>';
        return;
    }

    let html = '';
    snapshot.forEach(doc => {
        const product = doc.data();
        html += `
            <div class="col-md-4 mb-4">
                <div class="card product-card h-100" onclick="showProductDetail('${doc.id}')">
                    <img src="assets/productos/${product.foto1}" class="card-img-top" alt="${product.nombre}">
                    <div class="card-body">
                        <h5 class="card-title">${product.nombre}</h5>
                        <p class="card-text">${product.descripcion.substring(0, 80)}...</p>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

async function showProductDetail(productId) {
    try {
        const doc = await db.collection('productos').doc(productId).get();
        if (!doc.exists) return;

        const product = doc.data();
        const categoriesSnapshot = await db.collection('categorias').doc(product.id_categoria).get();
        const categoryName = categoriesSnapshot.exists ? categoriesSnapshot.data().descripcion : 'N/A';

        document.getElementById('productModalTitle').innerText = product.nombre;
        document.getElementById('productModalImage').src = `assets/productos/${product.foto1}`;
        document.getElementById('productModalDescription').innerText = product.descripcion;
        document.getElementById('productModalCategory').innerText = categoryName;

        new bootstrap.Modal(document.getElementById('productDetailModal')).show();
    } catch (error) {
        console.error("Error mostrando detalle:", error);
    }
}
