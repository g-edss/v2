// Punto de entrada: levanta el servidor HTTP.
import 'dotenv/config';
import { app } from './app.js';

const PORT = process.env.BACKEND_PORT || 3000;

app.listen(PORT, () => {
  console.log(`API WEB 360 escuchando en http://localhost:${PORT}`);
});
