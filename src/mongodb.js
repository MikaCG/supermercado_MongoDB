const dotenv = require("dotenv");
dotenv.config(); // Carga las variables del archivo .env
// Importamos el cliente de MongoDB y el paquete dotenv para las variables de entorno
const { MongoClient } = require("mongodb");
const URI = process.env.MONGODB_URLSTRING;
const client = new MongoClient(URI);

async function connectToMongoDB() {
    try {
        await client.connect();
        console.info("Conexión exitosa a MongoDB");
        return client;
    } catch (error) {
        console.error("Error al conectar a MongoDB:", error);
        return null;
    }
}

async function disconnectFromMongoDB() {
    try {
        await client.close();
        console.info("Desconexión exitosa de MongoDB");
    } catch (error) {
        console.error("Error al desconectar de MongoDB:", error);
    }
}

module.exports = { connectToMongoDB, disconnectFromMongoDB };