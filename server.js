const express = require('express');
const cors = require('cors');
const app = express();
const port = 3306; // Port d'écoute du serveur Express

// Middleware
app.use(cors()); // Utilisation de CORS pour permettre les requêtes cross-origin
app.use(express.json()); // Middleware pour analyser les requêtes JSON

// Importer les routes
const userRoutes = require('./routes/user');
const clientsRoutes = require('./routes/clients')
const devisRoutes = require('./routes/devis')


// Utiliser les routes sous le chemin `/api/users`
app.use('/api/users', userRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api', devisRoutes);





// Démarrer le serveur
app.listen(port, () => {
    console.log(`Le serveur fonctionne sur http://localhost:${port}`);
});


