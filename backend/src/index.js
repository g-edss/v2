// Punto de entrada: levanta el servidor HTTP.
import 'dotenv/config';
import { app } from './app.js';
import { ejecutarMigracionesPendientes } from './config/migrations.js';

const PORT = process.env.BACKEND_PORT || 3000;

try {
  await ejecutarMigracionesPendientes();

  app.listen(PORT, () => {
    console.log(`API WEB 360 escuchando en http://localhost:${PORT}`);
  });
} catch (error) {
  console.error('No se pudieron aplicar las migraciones:', error);
  process.exit(1);
}
