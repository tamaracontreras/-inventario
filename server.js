const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const csv = require("csv-parser");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());

// Configuración de multer para guardar archivos en /uploads
const upload = multer({ dest: "uploads/" });

// Conexión a SQLite
const db = new sqlite3.Database("db.sqlite");

// Crear tabla si no existe
db.run(`
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    nombre TEXT,
    precio REAL,
    stock INTEGER
)
`);

// Endpoint para subir CSV
app.post("/upload", upload.single("archivo"), (req, res) => {
    const resultados = [];

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => resultados.push(data))
        .on("end", () => {
            const stmt = db.prepare("INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)");
            resultados.forEach(row => {
                stmt.run(row.nombre, parseFloat(row.precio), parseInt(row.stock));
            });
            stmt.finalize();

            fs.unlinkSync(req.file.path); // borrar el archivo temporal
            res.json({ mensaje: "Productos cargados", total: resultados.length });
        });
});

// Endpoint para listar productos
app.get("/productos", (req, res) => {
    db.all("SELECT * FROM productos", (err, filas) => {
        if (err) return res.status(500).json(err);
        res.json(filas);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API corriendo en puerto ${PORT}`);
});