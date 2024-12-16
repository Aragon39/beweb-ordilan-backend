const express = require('express');
const router = express.Router(); // Initialise le routeur Express
const db = require('../db'); // Connexion à la base de données
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

router.post('/devis', (req, res) => {
    const { formData, lignesDevis, totals } = req.body;
    const { dateDuDevis, dateDeValiditeDuDevis, dateDeDebutDeLaPrestation, nomDuDestinataire, adresse, emisPar } = formData;
    const totalHT = totals.totalHT;
    const tva = totals.tva;
    const totalTTC = totals.totalTTC;

    const devisQuery = `
        INSERT INTO devis (date_du_devis, date_de_validite_du_devis, date_de_debut_de_la_prestation, nom_du_destinataire, adresse, emis_par, total_ht, tva, total_ttc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const devisValues = [dateDuDevis, dateDeValiditeDuDevis, dateDeDebutDeLaPrestation, nomDuDestinataire, adresse, emisPar, totalHT, tva, totalTTC];

    db.query(devisQuery, devisValues, (err, result) => {
        if (err) {
            console.error("Erreur lors de l'insertion du devis:", err);
            return res.status(500).json({ error: 'Erreur lors de l\'insertion du devis.' });
        }

        const devisId = result.insertId;

        // Insertion des lignes du devis
        const lignesQuery = `
            INSERT INTO lignes_devis (devis_id, description, prix_unitaire, quantite, total_ht)
            VALUES ?
        `;

        const lignesValues = lignesDevis.map(ligne => [
            devisId,
            ligne.description,
            ligne.prixUnitaire,
            ligne.quantite,
            ligne.prixUnitaire * ligne.quantite,
        ]);

        db.query(lignesQuery, [lignesValues], (err) => {
            if (err) {
                console.error("Erreur lors de l'insertion des lignes du devis:", err);
                return res.status(500).json({ error: 'Erreur lors de l\'insertion des lignes du devis.' });
            }

            // Génération du PDF dans un chemin temporaire
            const doc = new PDFDocument();
            const tempFilePath = path.join(os.tmpdir(), `devis_${devisId}.pdf`);
            console.log("Chemin temporaire pour le fichier PDF :", tempFilePath);

            const writeStream = fs.createWriteStream(tempFilePath);
            doc.pipe(writeStream);

            // Contenu du PDF
            doc.fontSize(25).text('Devis', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Date du Devis: ${dateDuDevis}`);
            doc.text(`Date de Validité du Devis: ${dateDeValiditeDuDevis}`);
            doc.text(`Date de Début de la Prestation: ${dateDeDebutDeLaPrestation}`);
            doc.text(`Nom du Destinataire: ${nomDuDestinataire}`);
            doc.text(`Adresse: ${adresse}`);
            doc.text(`Émis Par: ${emisPar}`);
            doc.moveDown();

            doc.text('Détails du Devis:', { underline: true });
            lignesDevis.forEach((ligne, index) => {
                doc.text(`\nLigne ${index + 1}:`);
                doc.text(`Description: ${ligne.description}`);
                doc.text(`Prix Unitaire HT: ${ligne.prixUnitaire} €`);
                doc.text(`Quantité: ${ligne.quantite}`);
                doc.text(`Total HT: ${(ligne.prixUnitaire * ligne.quantite).toFixed(2)} €`);
            });

            doc.moveDown();
            doc.text(`Total HT: ${totalHT.toFixed(2)} €`);
            doc.text(`TVA (20%): ${tva.toFixed(2)} €`);
            doc.text(`Total TTC: ${totalTTC.toFixed(2)} €`);

            doc.end();

            writeStream.on('finish', () => {
                // Téléchargement du fichier
                res.download(tempFilePath, `devis_${devisId}.pdf`, (err) => {
                    if (err) {
                        console.error("Erreur lors du téléchargement du fichier PDF :", err);
                        return res.status(500).json({ error: 'Erreur lors du téléchargement du fichier PDF.' });
                    }

                    // Suppression du fichier temporaire après téléchargement
                    fs.unlink(tempFilePath, (err) => {
                        if (err) {
                            console.error("Erreur lors de la suppression du fichier PDF temporaire :", err);
                        }
                    });
                });
            });

            writeStream.on('error', (err) => {
                console.error("Erreur lors de la génération du fichier PDF :", err);
                res.status(500).json({ error: 'Erreur lors de la génération du fichier PDF.' });
            });
        });
    });
});

module.exports = router;
