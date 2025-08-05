let editingProductId = null;
let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProductsForAdmin();
    loadCategoriesForAdmin();
    
    // Cargar categorías en el select del modal de productos
    loadCategoriesForSelect();
});

// PRODUCTOS
// FUNCIÓN PARA SUBIR IMAGENES (MODIFICADA)
async function uploadImage(file, productId = '') {
    const storageRef = storage.ref();
    // Crear nombre de archivo único con ID de producto si existe
    const fileName = productId 
        ? `productos/${productId}_${Date.now()}_${file.name}`
        : `productos/${Date.now()}_${file.name}`;
    
    const fileRef = storageRef.child(fileName);
    await fileRef.put(file);
    return await fileRef.getDownloadURL();
}

// FUNCIÓN PARA GUARDAR PRODUCTO (ACTUALIZADA)
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
        // Subir imágenes con referencia al ID del producto si estamos editando
        const photo1Url = await uploadImage(photo1, editingProductId);
        let photo2Url = '';
        
        if (photo2) {
            photo2Url = await uploadImage(photo2, editingProductId);
        }
        
        const productData = {
            "nombre": name,
            id_categoria: category,
            "descripcion": description,
            "foto1": photo1Url,
            foto2: photo2Url
        };
        
        if (editingProductId) {
            // Actualizar producto existente
            await db.collection('productos').doc(editingProductId).update(productData);
        } else {
            // Crear nuevo producto
            const docRef = await db.collection('productos').add(productData);
            // Si tenemos foto2, actualizar con el ID generado
            if (photo2) {
                const newPhoto2Url = await uploadImage(photo2, docRef.id);
                await docRef.update({ "foto2": newPhoto2Url });
            }
        }
        
        document.getElementById('productForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
        editingProductId = null;
        loadProductsForAdmin();
    } catch (error) {
        console.error("Error guardando producto:", error);
        alert('Error guardando producto');
    }
}

// FUNCIÓN PARA CARGAR PRODUCTOS (ACTUALIZADA)
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
        
        const categoriesSnapshot = await db.collection('categorias').get();
        const categories = {};
        categoriesSnapshot.forEach(doc => {
            categories[doc.id] = doc.data().descripcion;
        });
        
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const categoryName = categories[product.id_categoria] || 'Desconocida';
            
            // Obtener solo el nombre del archivo de la URL completa
            const getImageName = (url) => {
                if (!url) return 'default.jpg';
                const parts = url.split('%2F');
                return parts[parts.length - 1].split('?')[0];
            };
            
            table.innerHTML += `
                <tr>
                    <td>${product["nombre"]}</td>
                    <td>${categoryName}</td>
                    <td>${product["descripcion"]?.substring(0, 50) || 'Sin descripción'}...</td>
                    <td>
                        <img src="assets/productos/${getImageName(product["foto1"])}" 
                             style="max-width: 50px; max-height: 50px;" 
                             alt="Miniatura">
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


// FUNCIÓN PARA ELIMINAR PRODUCTO (ACTUALIZADA PARA ELIMINAR IMÁGENES)
async function deleteProduct(productId) {
    if (!confirm('¿Está seguro de eliminar este producto y sus imágenes asociadas?')) return;
    
    try {
        // Primero obtenemos el producto para tener las URLs de las imágenes
        const doc = await db.collection('productos').doc(productId).get();
        if (doc.exists) {
            const product = doc.data();
            
            // Función para eliminar imagen de Storage
            const deleteImage = async (url) => {
                if (!url) return;
                try {
                    const imageRef = storage.refFromURL(url);
                    await imageRef.delete();
                } catch (error) {
                    console.warn("Error eliminando imagen:", url, error);
                }
            };
            
            // Eliminar ambas imágenes
            await deleteImage(product["foto1"]);
            await deleteImage(product.foto2);
        }
        
        // Finalmente eliminamos el documento
        await db.collection('productos').doc(productId).delete();
        loadProductsForAdmin();
    } catch (error) {
        console.error("Error eliminando producto:", error);
        alert('Error al eliminar el producto');
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