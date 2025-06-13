const express = require("express");
const app = express();
// connectToMongoDB --> Nos conectamos a MongoDB
// disconnectFromMongoDB --> Nos desconectamos de MongoDB
const { connectToMongoDB, disconnectFromMongoDB } = require("./src/mongodb");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 3000;

// Middleware bodyParser
// Convierte automáticamente el cuerpo de la solicitud (request body) en un objeto JavaScript
app.use(bodyParser.json()); 

// Middleware principal
// Establece el tipo de contenido de la respuesta (response) como JSON
app.use((req, res, next) => {
    res.header("content-type", "application/json; charset=utf-8");
    next();
});

// Ruta principal
/* app.get('/', (req, res) => {
    res.status(200).send("Bienvenido a la API de Supermercado");
}); */
app.get('/', (req, res) => {
    // Le decimos explícitamente al navegador que el tipo de contenido es HTML.
  res.header('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Supermercado</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; color: #333; text-align: center; padding: 40px; margin: 0; }
          .container { background-color: #fff; padding: 40px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); display: inline-block; }
          h1 { color: #28a745; font-size: 3em; margin-bottom: 10px; }
          h1 .icon { font-size: 0.8em; }
          h2 { color: #555; font-size: 1.8em; margin-top: 0; }
          p { color: #777; font-size: 1.1em; max-width: 500px; margin: 20px auto; }
          .footer { margin-top: 30px; font-size: 0.9em; color: #999; }
          a { color: #007bff; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1><span class="icon">🛒</span> API Supermercado <span class="icon">🛍️</span></h1>
          <h2>¡API de gestión de inventario funcionando!</h2>
          <p>
            Utiliza esta API para consultar, agregar, modificar y eliminar productos.
            Prueba el endpoint <a href="/productos">/productos</a> para empezar.
          </p>
          <div class="footer">
            Hecho con Node.js, Express y MongoDB
          </div>
        </div>
      </body>
      </html>
    `);
});

app.get('/acerca-de', (req, res) => {
  res.status(200).send('API para gestionar productos de un supermercado. Permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre una base de datos MongoDB.');
});

// Ruta que devuelve todos los productos
app.get("/productos", async (req, res) => {
    try {
        const client = await connectToMongoDB(); 
        if (!client) {
            return res.status(500).json({ error: "Error al conectarse a MongoDB" }); // Si no se pudo conectar, respondemos con un error 500
        }

        const db = client.db("supermercado"); // Nombre de la base de datos
        const producto = await db.collection("supermercado").find().toArray(); // Nombre de la colección

        res.status(200).json(producto);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: "Ocurrio un error interno en el servidor"});
    } finally {
        await disconnectFromMongoDB();
    }
});

// Ruta que devuelve un producto por su código
app.get("/productos/codigo/:codigo", async (req, res) => {
    const codigo = parseInt(req.params.codigo);
    if (isNaN(codigo)) {
        return res.status(400).json({ error: "El código debe ser un número válido" });
    }

    try{
        const client = await connectToMongoDB(); 
        if (!client) {
           return res.status(500).json({ error: "Error al conectarse a MongoDB" });
        }

        const db = client.db("supermercado"); 
        const cod_producto = await db.collection("supermercado").findOne({codigo: codigo});
        
        if (!cod_producto) {
           return res.status(404).json({ message: "Producto no encontrado" });
        }

        res.status(200).json(cod_producto);
    } catch (error) {
        console.error("Error al buscar producto por código:", error);
        res.status(500).json({ error: "Ocurrio un error interno en el servidor"})
    } finally {
        await disconnectFromMongoDB();
    }  
});

// Ruta que devuelve los productos por su categoría
app.get("/productos/categoria/:categoria", async (req, res) => {
    try {
        const client = await connectToMongoDB();
        if (!client) {
            return res.status(500).json({ error: "Error al conectarse a MongoDB" });
        }
        
        const db = client.db("supermercado");
        const categoria = req.params.categoria; // Obtiene la categoría de la URL, ej: "lacteos"        
        
        const cat_producto = await db.collection("supermercado")
            .find({ categoria: categoria }) 
            // Aplicamos las reglas de "colación"
            // locale: 'es' --> Indica que se va a usar el idioma español
            // strength: 1 --> Solo compara las letras base, ignorando mayúsculas, acentos y otras variantes diacríticas
            .collation({ locale: 'es', strength: 1 }) 
            .toArray();
        
        if (cat_producto.length === 0) {
            return res.status(404).json({ message: "No se encontraron productos en esa categoría." });
        }

        res.status(200).json(cat_producto);
    } catch (error) {
        console.error("Error al buscar producto por categoria:", error);
        res.status(500).json({ error: "Ocurrio un error interno en el servidor" });
    } finally {
        await disconnectFromMongoDB();
    }
});

// Ruta para crear un nuevo producto controlando que no se repita el codigo y/o el nombre
app.post("/productos", async (req, res) => {    
    const nuevoProducto = req.body;
    if (!nuevoProducto || Object.keys(nuevoProducto).length === 0) {
        return res.status(400).json({ error: "El formato de datos recibidos esta vacio" });
    }
    if (!nuevoProducto.nombre || !nuevoProducto.nombre.trim() || typeof nuevoProducto.precio !== "number" || isNaN(nuevoProducto.precio) || !nuevoProducto.categoria || !nuevoProducto.categoria.trim()) {
        return res.status(400).json({ error: "Se necesitan los campos nombre, precio y categoria" });
    }

    let client; 

    try {
        client = await connectToMongoDB();
        if (!client) {
            return res.status(500).json({ error: "Error al conectarse a MongoDB" });
        }

        const inventario = client.db("supermercado").collection("supermercado");
        
        let codigoUnico, productoExistente;
        let intentos = 0;
        const MAX_INTENTOS = 10;

        do {
            codigoUnico = Math.floor(Math.random() * 10000);
            // Verificamos si el nombre o el código ya existen
            // findOne con el operador $or busca un producto que tenga el código generado o el nombre ingresado
            productoExistente = await inventario.findOne(
                { $or: [{ codigo: codigoUnico }, { nombre: nuevoProducto.nombre }] },
                { collation: { locale: 'es', strength: 2 } } // Usamos colación para el nombre, similar a buscar por categoria
            );
            intentos++;
        // Se repite hasta encontrar un código único o alcanzar el límite de intentos
        } while (productoExistente && productoExistente.codigo === codigoUnico && intentos < MAX_INTENTOS);        
        
        if (productoExistente) {
             // Si encontramos un producto, verificamos si fue por el nombre o por un código repetido en el último intento
            if (productoExistente.nombre.toLowerCase() === nuevoProducto.nombre.toLowerCase()) {
                return res.status(409).json({ mensaje: `El producto con el nombre '${nuevoProducto.nombre}' ya existe.` });
            } else {
                 return res.status(500).json({ mensaje: "No se pudo generar un código único. Inténtalo de nuevo." });
            }
        }
        
        // Agregamos el nuevo producto
        nuevoProducto.codigo = codigoUnico;
        const resultado = await inventario.insertOne(nuevoProducto);
        
        console.log("Nuevo producto creado:", nuevoProducto);
        res.status(201).json(nuevoProducto);

    } catch (error) {
        console.error("Error al agregar el nuevo producto:", error);
        res.status(500).json({ error: "Ocurrió un error interno en el servidor" });
    } finally {
        if (client) {
            await disconnectFromMongoDB();
        }
    }
});

// Ruta para actualizar un producto según su código
app.put("/productos/codigo/:codigo", async (req, res) => {
    const codigo = parseInt(req.params.codigo); // Obtengo el código del producto desde la URL
    if (isNaN(codigo)) {
        return res.status(400).json({ error: "El código debe ser un número válido" });
    }
    const nuevosDatos = req.body; // Obtiene los nuevos datos del cuerpo del request (lo que se quiere modificar)
    delete nuevosDatos._id; // Elimino el _id que MongoDB antepone

    if (!nuevosDatos || Object.keys(nuevosDatos).length === 0){
        return res.status(400).json({ error: "El cuerpo de la petición no puede estar vacío."});
    }

    let client;
    try {
        client = await connectToMongoDB();
        if (!client) {
            return res.status(500).json({ error: "Error al conectarse a MongoDB." });
        }

        const inventario = client.db("supermercado").collection("supermercado");
                
        // Busca un producto por su código y lo actualiza en una sola operación
        const productoActualizado = await inventario.findOneAndUpdate(
            { codigo: codigo }, // El filtro para encontrar el producto
            { $set: nuevosDatos }, // Los datos a actualizar
            { returnDocument: 'after' } // Nos devuelva el documento DESPUÉS de la actualización
        );

        if (!productoActualizado) {
            // Si el método no devuelve nada, es porque no encontró el producto
            return res.status(404).json({ mensaje: "Producto NO encontrado." });
        }

        console.log("Producto modificado:", productoActualizado);
        res.status(200).json(productoActualizado); // Devuelve el objeto completo y actualizado desde la DB
        
    } catch (error) {
        console.error("Error al modificar el producto:", error);
        res.status(500).json({ error: "Ocurrió un error interno en el servidor" });
    } finally {
        if (client) {
            await disconnectFromMongoDB();
        }
    }
});

// Ruta para eliminar un producto según su código
app.delete("/productos/codigo/:codigo", async(req, res) => {
    const codigo = parseInt(req.params.codigo);
    if (isNaN(codigo)) {
        return res.status(400).json({ error: "El código debe ser un número válido" });
    }

    let client;
    try {
        client = await connectToMongoDB();
        if (!client) {
            return res.status(500).json({ error: "Error al conectarse a MongoDB" });
        }
        const inventario = client.db("supermercado").collection("supermercado");

        // Usamos findOneAndDelete para eliminar Y OBTENER el documento borrado
        const productoEliminado = await inventario.findOneAndDelete({ codigo: codigo });

        if (!productoEliminado) {
            // Si no devuelve nada, es porque no encontró el producto
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        console.log(`Producto eliminado:`, productoEliminado);
        // Devolvemos el objeto completo que acabamos de eliminar
        res.status(200).json(productoEliminado);

    } catch (error) {
        console.error("Error al eliminar el producto:", error);
        res.status(500).json({ error: "Ocurrió un error interno en el servidor" });
    } finally {
        if (client) {
            await disconnectFromMongoDB();
        }
    }
});

// Middleware para manejar rutas no encontradas (404 --> código estándar para "No Encontrado"/"Not Found")
app.use((req, res) => {    
    res.status(404).json({ error: "Ruta no encontrada. Por favor, verifica la URL." });
});

// Iniciamos el servidor en el puerto definido en PORT --> Abrimos el supermercado
app.listen(PORT, () => {
    console.info(`Servidor corriendo en https://localhost:${PORT}`);
});