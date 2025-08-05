document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    
    // Filtro por categoría
    document.getElementById('category-filter').addEventListener('change', (e) => {
        loadProducts(e.target.value);
    });
    
    // Búsqueda
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });
});

async function loadCategories() {
    const select = document.getElementById('category-filter');
    try {
        const querySnapshot = await db.collection('categorias').get();
        
        querySnapshot.forEach(doc => {
            const category = doc.data();
            select.innerHTML += `<option value="${doc.id}">${category.descripcion}</option>`;
        });
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

async function loadProducts(categoryId = 'all') {
    const container = document.getElementById('products-container');
    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"></div></div>';
    
    try {
        let query = db.collection('productos');
        
        if (categoryId !== 'all') {
            query = query.where('id_categoria', '==', categoryId);
        }
        
        const querySnapshot = await query.get();
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="col-12 text-center"><p>No se encontraron productos</p></div>';
            return;
        }
        
        container.innerHTML = '';
        
        querySnapshot.forEach(doc => {
            const product = doc.data();
            container.innerHTML += `
                <div class="col-md-4 mb-4" id="product-${doc.id}">
                    <div class="card h-100">
                        <img src="${product.foto1}" class="card-img-top" alt="${product.nombre}">
                        <div class="card-body">
                            <h5 class="card-title">${product.nombre}</h5>
                            <p class="card-text">${product.descripcion}</p>
                            <button class="btn btn-primary" onclick="showProductDetail('${doc.id}')">Ver detalles</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error cargando productos:", error);
        container.innerHTML = '<div class="col-12 text-center"><p>Error cargando productos</p></div>';
    }
}

async function searchProducts(searchTerm) {
    if (searchTerm.length < 3) {
        loadProducts(document.getElementById('category-filter').value);
        return;
    }
    
    const container = document.getElementById('products-container');
    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"></div></div>';
    
    try {
        const querySnapshot = await db.collection('productos')
            .where('nombre', '>=', searchTerm)
            .where('nombre', '<=', searchTerm + '\uf8ff')
            .get();
            
        container.innerHTML = '';
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="col-12 text-center"><p>No se encontraron productos</p></div>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const product = doc.data();
            container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <img src="${product.foto1}" class="card-img-top" alt="${product.nombre}">
                        <div class="card-body">
                            <h5 class="card-title">${product.nombre}</h5>
                            <p class="card-text">${product.descripcion}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error buscando productos:", error);
    }
}

function showProductDetail(productId) {
    // Implementar modal con detalles del producto
    console.log("Mostrar detalle del producto:", productId);
}