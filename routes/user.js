const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// Route : Récupérer tous les utilisateurs
router.get('/', (_req, res) => {
    db.query('SELECT id, email FROM users', (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs:', err);
            return res.status(500).send('Erreur interne du serveur');
        }
        res.json(results);
    });
});

// Route : Ajouter un utilisateur
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (email, password) VALUES (?, ?)', // Correction du nom de la table (si c'est "users" et pas "user")
            [email, hashedPassword],
            (err, results) => {
                if (err) {
                    console.error('Erreur lors de l\'insertion de l\'utilisateur:', err);
                    return res.status(500).send('Erreur interne du serveur');
                }
                res.status(201).json({ message: 'Utilisateur créé', userId: results.insertId });
            }
        );
    } catch (error) {
        console.error('Erreur lors du hachage du mot de passe:', error);
        res.status(500).send('Erreur interne du serveur');
    }
});

// Route : Mettre à jour un utilisateur
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { email, password } = req.body;

    if (!id || (!email && !password)) {
        return res.status(400).json({ message: 'ID, email ou mot de passe requis pour la mise à jour' });
    }

    const fields = [];
    const values = [];

    if (email) {
        fields.push('email = ?');
        values.push(email);
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        fields.push('password = ?');
        values.push(hashedPassword);
    }

    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
            return res.status(500).send('Erreur interne du serveur');
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json({ message: 'Utilisateur mis à jour' });
    });
});

// Route : Supprimer un utilisateur
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'ID requis pour la suppression' });
    }

    db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', err);
            return res.status(500).send('Erreur interne du serveur');
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json({ message: 'Utilisateur supprimé' });
    });
});

module.exports = router;
