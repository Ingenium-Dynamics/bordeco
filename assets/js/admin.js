let editingProductId = null;
let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProductsForAdmin();
    loadCategoriesForAdmin();
    
    // Cargar categorías en el select del modal de productos
    loadCategoriesForSelect();
});

// PRODUCTOS
// FUNCIÓN MODIFICADA PARA SUBIR IMÁGENES (ahora solo devuelve el nombre del archivo)
async function handleImageUpload(fileInput, defaultImage = '') {
    if (!fileInput.files || fileInput.files.length === 0) {
        return defaultImage; // Mantener la imagen existente si no hay nueva
    }
    
    const file = fileInput.files[0];
    return file.name; // Solo devolvemos el nombre del archivo
}

// FUNCIÓN MODIFICADA saveProduct
async function saveProduct() {
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value;
    const photo1Input = document.getElementById('productPhoto1');
    const photo2Input = document.getElementById('productPhoto2');
    
    const currentImage1Preview = document.getElementById('currentImage1Preview');
    const currentImage2Preview = document.getElementById('currentImage2Preview');
    if (currentImage1Preview) {
        currentImage1Preview.src = '';
        currentImage1Preview.style.display = 'none';
    }
    if (currentImage2Preview) {
        currentImage2Preview.src = '';
        currentImage2Preview.style.display = 'none';
    }


    if (!name || !category || !description) {
        alert('Por favor complete todos los campos requeridos');
        return;
    }
    
    try {
        // Obtener nombres de archivo (no subimos a Firebase Storage)
        let photo1Name = await handleImageUpload(photo1Input);
        let photo2Name = '';
        
        if (photo2Input.files.length > 0) {
            photo2Name = await handleImageUpload(photo2Input);
        }
        
        // Validar que al menos hay una imagen (para nuevos productos)
        if (!editingProductId && !photo1Name) {
            alert('Debe seleccionar al menos una imagen para el producto');
            return;
        }
        
        // Estructura de datos con nombres de archivo
        const productData = {
            "nombre": name,
            id_categoria: category,
            "descripcion": description,
            "foto1": photo1Name,
            foto2: photo2Name
        };
        
        if (editingProductId) {
            // Para edición, mantener imagen anterior si no se sube nueva
            const currentProduct = (await db.collection('productos').doc(editingProductId).get()).data();
            if (!photo1Name && currentProduct["foto1"]) {
                productData["foto1"] = currentProduct["foto1"];
            }
            if (!photo2Name && currentProduct.foto2) {
                productData.foto2 = currentProduct.foto2;
            }
            
            await db.collection('productos').doc(editingProductId).update(productData);
        } else {
            await db.collection('productos').add(productData);
        }
        
        // Aquí deberías implementar la subida física del archivo a tu servidor
        // Esto es un ejemplo conceptual:
        if (photo1Input.files.length > 0) {
            await uploadFileToServer(photo1Input.files[0], 'assets/productos/');
        }
        if (photo2Input.files.length > 0) {
            await uploadFileToServer(photo2Input.files[0], 'assets/productos/');
        }
        
        document.getElementById('productForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
        editingProductId = null;
        loadProductsForAdmin();
    } catch (error) {
        console.error("Error guardando producto:", error);
        alert('Error guardando producto: ' + error.message);
    }
}

// Función de ejemplo para subir archivos al servidor (debes implementarla)
async function uploadFileToServer(file, directory) {
    // Implementación dependerá de tu backend
    console.log(`Simulando subida de ${file.name} a ${directory}`);
    // En un caso real, usarías fetch o XMLHttpRequest para enviar el archivo
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Archivo ${file.name} subido exitosamente`);
            resolve();
        }, 1000);
    });
}

// FUNCIÓN MODIFICADA loadProductsForAdmin para mostrar imágenes locales
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
            
            // Construir rutas locales a las imágenes
            const image1Path = product["foto1"] ? `assets/productos/${product["foto1"]}` : 'assets/default-product.jpg';
            const image2Path = product.foto2 ? `assets/productos/${product.foto2}` : '';
            
            table.innerHTML += `
                <tr>
                    
                    <td>${product["nombre"]}</td>
                    <td>${categoryName}</td>
                    <td>${product["descripcion"]?.substring(0, 50) || 'Sin descripción'}...</td>
                    <td><img src="${image1Path}" alt="${product["nombre"]}" style="max-height: 50px;"></td>
                    <td><img src="${image2Path}" alt="${product["nombre"]}" style="max-height: 50px;"></td>
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

// FUNCIÓN MODIFICADA editProduct para manejar imágenes locales
async function editProduct(productId) {
    try {
        const doc = await db.collection('productos').doc(productId).get();
        if (!doc.exists) {
            alert('Producto no encontrado');
            return;
        }
        
        const product = doc.data();
        document.getElementById('productName').value = product["nombre"];
        document.getElementById('productDescription').value = product["descripcion"];
        
        // Obtener referencias a los elementos de vista previa
        const currentImage1Preview = document.getElementById('currentImage1Preview');
        const currentImage2Preview = document.getElementById('currentImage2Preview');
        
        // Mostrar vista previa de imágenes actuales si existen
        if (product["foto1"] && currentImage1Preview) {
            currentImage1Preview.src = `assets/productos/${product["foto1"]}`;
            currentImage1Preview.style.display = 'block';
        } else if (currentImage1Preview) {
            currentImage1Preview.style.display = 'none';
        }
        
        if (product.foto2 && currentImage2Preview) {
            currentImage2Preview.src = `assets/productos/${product.foto2}`;
            currentImage2Preview.style.display = 'block';
        } else if (currentImage2Preview) {
            currentImage2Preview.style.display = 'none';
        }
        
        // Seleccionar categoría
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect) {
            for (let i = 0; i < categorySelect.options.length; i++) {
                if (categorySelect.options[i].value === product.id_categoria) {
                    categorySelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        editingProductId = productId;
        new bootstrap.Modal(document.getElementById('addProductModal')).show();
    } catch (error) {
        console.error("Error editando producto:", error);
        alert('Error al cargar el producto para edición');
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