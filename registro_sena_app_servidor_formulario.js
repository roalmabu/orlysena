// Proyecto: Registro SENA - Formulario + Backend (Node.js + Express + SQLite)
// Estructura de archivos (copiar en una carpeta):
// - package.json
// - server.js
// - /public/index.html
// - /public/success.html
// - README.md

/* ---------- package.json (contenido) ----------
{
  "name": "registro-sena",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5"
  }
}
*/

/* ---------- server.js ---------- */
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Abrir/crear DB SQLite
const db = new sqlite3.Database(path.join(__dirname, 'registrations.db'), (err) => {
  if (err) return console.error('DB error', err.message);
  console.log('Conectado a SQLite');
});

// Crear tabla si no existe
const createTableSQL = `
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  documento TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  programa TEXT,
  fecha_registro TEXT DEFAULT (datetime('now','localtime')),
  comentario TEXT
);
`;

db.run(createTableSQL, (err) => {
  if (err) console.error('Error creando tabla', err.message);
});

// Endpoint para recibir registro desde formulario
app.post('/register', (req, res) => {
  const { nombre, documento, email, telefono, programa, comentario } = req.body;
  if (!nombre || !documento || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, documento, email).' });
  }

  const insertSQL = `INSERT INTO registrations (nombre, documento, email, telefono, programa, comentario) VALUES (?,?,?,?,?,?)`;
  db.run(insertSQL, [nombre, documento, email, telefono || '', programa || '', comentario || ''], function(err) {
    if (err) {
      console.error('Error insertando', err.message);
      return res.status(500).json({ error: 'Error al guardar el registro.' });
    }
    // Si vienes desde el formulario clásico, redireccionar a success
    if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
      return res.redirect('/success.html');
    }
    res.json({ ok: true, id: this.lastID });
  });
});

// Endpoint para listar registros (admin) - NOTA: en producción proteger con autenticación
app.get('/registrations', (req, res) => {
  const sql = `SELECT id, nombre, documento, email, telefono, programa, fecha_registro, comentario FROM registrations ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error consultando registros.' });
    res.json(rows);
  });
});

// Endpoint health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

/* ---------- public/index.html ---------- */
/* Copiar este archivo en ./public/index.html */

/*
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Inscripción Convocatoria SENA</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;padding:20px}
    .card{max-width:640px;margin:20px auto;padding:20px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    label{display:block;margin-top:12px}
    input,select,textarea{width:100%;padding:10px;margin-top:6px;border:1px solid #ddd;border-radius:6px}
    button{margin-top:14px;padding:12px 18px;border:0;background:#0056b3;color:#fff;border-radius:8px;cursor:pointer}
  </style>
</head>
<body>
  <div class="card">
    <h2>Formulario de Inscripción - Convocatoria SENA</h2>
    <p>Complete sus datos para inscribirse. Los campos con * son obligatorios.</p>

    <form id="registerForm" action="/register" method="post">
      <label>Nombre completo*<input required name="nombre" /></label>
      <label>Documento de identidad*<input required name="documento" /></label>
      <label>Email*<input required type="email" name="email" /></label>
      <label>Teléfono<input name="telefono" /></label>
      <label>Programa al que aplica
        <select name="programa">
          <option value="Técnico en Sistemas">Técnico en Sistemas</option>
          <option value="Auxiliar Administrativo">Auxiliar Administrativo</option>
          <option value="Tecnólogo en Mantenimiento">Tecnólogo en Mantenimiento</option>
          <option value="Otro">Otro</option>
        </select>
      </label>
      <label>Comentario/Observaciones<textarea name="comentario" rows="4"></textarea></label>

      <button type="submit">Enviar inscripción</button>
    </form>

    <p style="font-size:0.9em;color:#666;margin-top:12px">Al enviar acepta el tratamiento de datos para fines de la convocatoria.</p>
  </div>

  <script>
    // Opcional: enviar por fetch para mostrar respuesta sin recargar
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', async (e) => {
      // Si quieres enviar por fetch en vez de submit normal, descomenta las siguientes líneas
      // e.preventDefault();
      // const fd = new FormData(form);
      // const obj = Object.fromEntries(fd.entries());
      // const res = await fetch('/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)});
      // const data = await res.json();
      // if (data.ok) alert('Registro recibido. ID: ' + data.id);
    });
  </script>
</body>
</html>
*/

/* ---------- public/success.html ---------- */
/* Copiar este archivo en ./public/success.html */
/*
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enviado</title></head>
<body style="font-family:Arial;margin:40px;text-align:center">
  <h2>Gracias — su inscripción fue recibida</h2>
  <p>Pronto recibirá información.</p>
  <a href="/">Volver al formulario</a>
</body></html>
*/

/* ---------- README.md (instrucciones básicas) ----------
1) Crear carpeta y pegar los archivos:
   - package.json (contenido arriba)
   - server.js
   - carpeta public con index.html y success.html

2) Instalar dependencias:
   npm install

3) Ejecutar:
   npm start
   -> abrir http://localhost:3000

4) Ver registros (JSON): http://localhost:3000/registrations

5) Despliegue:
   - Puedes desplegar en Render, Railway, Heroku, o un VPS. Subir proyecto y configurar variable PORT (la app usa process.env.PORT).
   - Alternativa: exportar la base de datos SQLite y montar un panel simple o conectar a una base externa (Postgres/MySQL) si esperas alto tráfico.

6) Seguridad y privacidad:
   - En producción protege /registrations con autenticación (usuario+contraseña o token).
   - Añade validación adicional y comprobaciones anti-bot (reCAPTCHA) si esperas muchos envíos.
*/

// Fin del archivo de ejemplo.
