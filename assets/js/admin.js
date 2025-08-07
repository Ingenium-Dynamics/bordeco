let editingProductId = null;
let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProductsForAdmin();
    loadCategoriesForAdmin();
    loadCategoriesForSelect();

    // Limpiar modal al cerrar
    const productModal = document.getElementById('productModal');
    productModal.addEventListener('hidden.bs.modal', () => {
        document.getElementById('productForm').reset();
        document.getElementById('photo1-preview').style.display = 'none';
        document.getElementById('photo2-preview').style.display = 'none';
        editingProductId = null;
    });
});

// --- PRODUCTOS ---

async function saveProduct() {
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value;
    const photo1Input = document.getElementById('productPhoto1');
    const photo2Input = document.getElementById('productPhoto2');

    if (!name || !category || !description) {
        alert('Por favor complete todos los campos requeridos.');
        return;
    }

    try {
        let photo1Name = '';
        let photo2Name = '';

        if (photo1Input.files.length > 0) {
            photo1Name = photo1Input.files[0].name;
            // Aquí iría la lógica para subir el archivo al servidor
        }

        if (photo2Input.files.length > 0) {
            photo2Name = photo2Input.files[0].name;
            // Lógica de subida
        }

        const productData = {
            nombre: name,
            id_categoria: category,
            descripcion: description,
            foto1: photo1Name,
            foto2: photo2Name
        };

        if (editingProductId) {
            const docRef = db.collection('productos').doc(editingProductId);
            const currentDoc = await docRef.get();
            const currentData = currentDoc.data();

            if (!photo1Name) productData.foto1 = currentData.foto1;
            if (!photo2Name) productData.foto2 = currentData.foto2;

            await docRef.update(productData);
        } else {
            if (!photo1Name) {
                alert('La foto principal es obligatoria para productos nuevos.');
                return;
            }
            await db.collection('productos').add(productData);
        }

        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        loadProductsForAdmin();

    } catch (error) {
        console.error("Error guardando producto:", error);
        alert('Error al guardar el producto.');
    }
}

async function loadProductsForAdmin() {
    const table = document.getElementById('products-table');
    table.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary"></div></td></tr>';

    try {
        const productsSnapshot = await db.collection('productos').get();
        const categoriesSnapshot = await db.collection('categorias').get();
        const categories = {};
        categoriesSnapshot.forEach(doc => {
            categories[doc.id] = doc.data().descripcion;
        });

        if (productsSnapshot.empty) {
            table.innerHTML = '<tr><td colspan="5" class="text-center">No hay productos.</td></tr>';
            return;
        }

        let html = '';
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            const categoryName = categories[product.id_categoria] || 'N/A';
            const imagePath = product.foto1 ? `assets/productos/${product.foto1}` : 'assets/img/placeholder.png';

            html += `
                <tr>
                    <td><img src="${imagePath}" alt="${product.nombre}"></td>
                    <td>${product.nombre}</td>
                    <td>${categoryName}</td>
                    <td>${product.descripcion.substring(0, 50)}...</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editProduct('${doc.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${doc.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        table.innerHTML = html;
    } catch (error) {
        console.error("Error cargando productos:", error);
        table.innerHTML = '<tr><td colspan="5" class="text-center">Error al cargar productos.</td></tr>';
    }
}

async function editProduct(id) {
    editingProductId = id;
    try {
        const doc = await db.collection('productos').doc(id).get();
        if (!doc.exists) return;

        const product = doc.data();
        document.getElementById('productName').value = product.nombre;
        document.getElementById('productCategory').value = product.id_categoria;
        document.getElementById('productDescription').value = product.descripcion;

        if (product.foto1) {
            const preview = document.getElementById('photo1-preview');
            preview.src = `assets/productos/${product.foto1}`;
            preview.style.display = 'block';
        }
        // Repetir para foto2 si es necesario

        document.getElementById('productModalTitle').innerText = 'Editar Producto';
        new bootstrap.Modal(document.getElementById('productModal')).show();
    } catch (error) {
        console.error("Error al editar:", error);
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;

    try {
        await db.collection('productos').doc(id).delete();
        loadProductsForAdmin();
    } catch (error) {
        console.error("Error eliminando:", error);
        alert('Error al eliminar el producto.');
    }
}

// --- CATEGORÍAS (simplificado, puedes expandirlo como los productos) ---

async function loadCategoriesForAdmin() {
    // ... (implementación similar a loadProductsForAdmin)
}

async function loadCategoriesForSelect() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Seleccione una categoría</option>';
    try {
        const snapshot = await db.collection('categorias').get();
        snapshot.forEach(doc => {
            select.innerHTML += `<option value="${doc.id}">${doc.data().descripcion}</option>`;
        });
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}
