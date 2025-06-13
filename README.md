# 🛒 Supermercado API RESTful

API desarrollada con **Node.js**, **Express.js** y **MongoDB** para gestionar el inventario de productos de un supermercado. Permite realizar operaciones CRUD (Crear, Leer, Actualizar y Eliminar).

---

## 📋 Resumen de la documentación

| Método | Ruta                           | Descripción                                |
|--------|--------------------------------|--------------------------------------------|
| GET    | `/`                            | Mensaje de bienvenida                      |
| GET    | `/acerca-de`                   | Información general de la API              |
| GET    | `/productos`                   | Lista todos los productos                  |
| GET    | `/productos/codigo/:codigo`    | Busca producto por código                  |
| GET    | `/productos/categoria/:categoria` | Filtra productos por categoría          |
| POST   | `/productos`                   | Agrega un nuevo producto                   |
| PUT    | `/productos/codigo/:codigo`    | Actualiza un producto por su código        |
| DELETE | `/productos/codigo/:codigo`    | Elimina un producto por su código          |

---

## ⚙️ Instalación

1. Clona el repositorio y entra en la carpeta del proyecto:

```bash
git clone https://github.com/tu-usuario/supermercado-api.git
cd supermercado_MongoDB
