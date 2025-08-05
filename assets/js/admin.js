let editingProductId = null;
let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProductsForAdmin();
    loadCategoriesForAdmin();
    
    // Cargar categorías en el select del modal de productos
    loadCategoriesForSelect();
});

// PRODUCTOS
async function loadProductsForAdmin() {
    const table = document.getElementById('products-table');
    table.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border text-primary" role="status"></div></td></tr>';
    
    try {
        const querySnapshot = await db.collection('productos').get();
        
        if (querySnapshot.empty) {
            table.innerHTML = '<tr><td colspan="4" class="text-center">No hay productos</td></tr>';
            return;
        }
        
        table.innerHTML = '';
        
        // Necesitamos cargar los nombres de las categorías
        const categoriesSnapshot = await db.collection('categorias').get();
        const categories = {};
        categoriesSnapshot.forEach(doc => {
            categories[doc.id] = doc.data().descripcion;
        });
        
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const categoryName = categories[product.id_categoria] || 'Desconocida';
            
            table.innerHTML += `
                <tr>
                    <td>${product.nombre}</td>
                    <td>${categoryName}</td>
                    <td>${product.descripcion.substring(0, 50)}...</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editProduct('${doc.id}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${doc.id}')">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error cargando productos:", error);
        table.innerHTML = '<tr><td colspan="4" class="text-center">Error cargando productos</td></tr>';
    }
}

async function saveProduct() {
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value;
    const photo1 = document.getElementById('productPhoto1').files[0];
    const photo2 = document.getElementById('productPhoto2').files[0];
    
    if (!name || !category || !description || !photo1) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }
    
    try {
        // Subir imágenes a Firebase Storage
        const photo1Url = await uploadImage(photo1);
        let photo2Url = '';
        
        if (photo2) {
            photo2Url = await uploadImage(photo2);
        }
        
        const productData = {
            nombre: name,
            id_categoria: category,
            descripcion: description,
            foto1: photo1Url,
            foto2: photo2Url
        };
        
        if (editingProductId) {
            // Actualizar producto existente
            await db.collection('productos').doc(editingProductId).update(productData);
        } else {
            // Crear nuevo producto
            await db.collection('productos').add(productData);
        }
        
        // Limpiar formulario y cerrar modal
        document.getElementById('productForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
        editingProductId = null;
        
        // Recargar tabla
        loadProductsForAdmin();
    } catch (error) {
        console.error("Error guardando producto:", error);
        alert('Error guardando producto');
    }
}

async function editProduct(productId) {
    try {
        const doc = await db.collection('productos').doc(productId).get();
        if (!doc.exists) {
            alert('Producto no encontrado');
            return;
        }
        
        const product = doc.data();
        document.getElementById('productName').value = product.nombre;
        document.getElementById('productDescription').value = product.descripcion;
        
        // Seleccionar la categoría correcta
        const categorySelect = document.getElementById('productCategory');
        for (let i = 0; i < categorySelect.options.length; i++) {
            if (categorySelect.options[i].value === product.id_categoria) {
                categorySelect.selectedIndex = i;
                break;
            }
        }
        
        editingProductId = productId;
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
        modal.show();
    } catch (error) {
        console.error("Error editando producto:", error);
    }
}

async function deleteProduct(productId) {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;
    
    try {
        await db.collection('productos').doc(productId).delete();
        loadProductsForAdmin();
    } catch (error) {
        console.error("Error eliminando producto:", error);
    }
}

// CATEGORÍAS
async function loadCategoriesForAdmin() {
    const table = document.getElementById('categories-table');
    table.innerHTML = '<tr><td colspan="3" class="text-center"><div class="spinner-border text-primary" role="status"></div></td></tr>';
    
    try {
        const querySnapshot = await db.collection('categorias').get();
        
        if (querySnapshot.empty) {
            table.innerHTML = '<tr><td colspan="3" class="text-center">No hay categorías</td></tr>';
            return;
        }
        
        table.innerHTML = '';
        
        querySnapshot.forEach(doc => {
            const category = doc.data();
            
            table.innerHTML += `
                <tr>
                    <td>${doc.id}</td>
                    <td>${category.descripcion}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editCategory('${doc.id}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCategory('${doc.id}')">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error cargando categorías:", error);
        table.innerHTML = '<tr><td colspan="3" class="text-center">Error cargando categorías</td></tr>';
    }
}

async function loadCategoriesForSelect() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Seleccione una categoría</option>';
    
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

async function saveCategory() {
    const description = document.getElementById('categoryDescription').value;
    
    if (!description) {
        alert('Por favor ingrese una descripción');
        return;
    }
    
    try {
        const categoryData = {
            descripcion: description
        };
        
        if (editingCategoryId) {
            // Actualizar categoría existente
            await db.collection('categorias').doc(editingCategoryId).update(categoryData);
        } else {
            // Crear nueva categoría
            await db.collection('categorias').add(categoryData);
        }
        
        // Limpiar formulario y cerrar modal
        document.getElementById('categoryForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
        editingCategoryId = null;
        
        // Recargar tablas
        loadCategoriesForAdmin();
        loadCategoriesForSelect();
    } catch (error) {
        console.error("Error guardando categoría:", error);
        alert('Error guardando categoría');
    }
}

async function editCategory(categoryId) {
    try {
        const doc = await db.collection('categorias').doc(categoryId).get();
        if (!doc.exists) {
            alert('Categoría no encontrada');
            return;
        }
        
        const category = doc.data();
        document.getElementById('categoryDescription').value = category.descripcion;
        
        editingCategoryId = categoryId;
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
        modal.show();
    } catch (error) {
        console.error("Error editando categoría:", error);
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('¿Está seguro de eliminar esta categoría? Los productos asociados no se eliminarán.')) return;
    
    try {
        await db.collection('categorias').doc(categoryId).delete();
        loadCategoriesForAdmin();
        loadCategoriesForSelect();
    } catch (error) {
        console.error("Error eliminando categoría:", error);
    }
}

// FUNCIONES UTILES
async function uploadImage(file) {
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`productos/${Date.now()}_${file.name}`);
    await fileRef.put(file);
    return await fileRef.getDownloadURL();
}