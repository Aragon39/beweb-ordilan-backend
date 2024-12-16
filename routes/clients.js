const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
  console.log("Requête reçue : ", req.body);

  const {
    nom,
    prenom,
    email,
    adresse,
    CodePostal,
    telephone,
    dateEtHeureDeDebut,
    dateEtHeureDeFin,
    intervenant,
    marque,
    observation,
    types_intervention,
    descriptions,
    etat,
    materiels,
  } = req.body;

  // Vérification des champs obligatoires
  if (
    !nom ||
    !prenom ||
    !email ||
    !adresse ||
    !CodePostal ||
    !telephone ||
    !dateEtHeureDeDebut ||
    !dateEtHeureDeFin ||
    !intervenant
  ) {
    console.log("Champs obligatoires manquants.");
    return res
      .status(400)
      .json({ message: "Tous les champs obligatoires doivent être remplis." });
  }

  // Commencer une transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Erreur lors du début de la transaction :", err);
      return res.status(500).json({ message: "Erreur serveur." });
    }

    // Insertion dans la table `clients`
    const sqlClient = `
      INSERT INTO clients (nom, prenom, email, adresse, CodePostal, telephone, dateEtHeureDeDebut, dateEtHeureDeFin, intervenant)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const clientValues = [
      nom,
      prenom,
      email,
      adresse,
      CodePostal,
      telephone,
      dateEtHeureDeDebut,
      dateEtHeureDeFin,
      intervenant,
    ];

    db.query(sqlClient, clientValues, (err, result) => {
      if (err) {
        console.error("Erreur lors de l'insertion dans clients :", err);
        return db.rollback(() =>
          res
            .status(500)
            .json({ message: "Erreur lors de l'insertion du client." })
        );
      }

      const clientId = result.insertId;
      console.log("Client inséré avec succès. ID :", clientId);

      const promises = [];

     
    
      if (marque) {
        const sqlMarques = "INSERT INTO marques (nom) VALUES (?)";
        promises.push(
          new Promise((resolve, reject) => {
            db.query(sqlMarques, [marque], (err) => {
              if (err) {
                console.error(
                  "Erreur lors de l'insertion dans materiels :",
                  err
                );
                return reject(err);
              }
              resolve();
            });
          })
        );
      }
      
      if (observation) {
        const sqlObservation =
          "INSERT INTO observations ( observation) VALUES (?)";
        promises.push(
          new Promise((resolve, reject) => {
            db.query(sqlObservation, [observation], (err) => {
              if (err) {
                console.error(
                  "Erreur lors de l'insertion dans observations :",
                  err
                );
                return reject(err);
              }
              resolve();
            });
          })
        );
      }

      if (types_intervention) {
        const sqlTypesIntervention = "INSERT INTO types_intervention (intervention) VALUES (?)";
        promises.push(
          new Promise((resolve, reject) => {
            db.query(sqlTypesIntervention, [types_intervention], (err, result) => {
              if (err) {
                console.error("Erreur lors de l'insertion dans types_interventions :", err);
                return reject(err);
              }
              console.log("Type d'intervention inséré avec succès : ", result);
              resolve();
            });
          })
        );
      }
      

      if (descriptions) {
        const sqlDescriptions =
          "INSERT INTO descriptions ( description) VALUES (?)";
        promises.push(
          new Promise((resolve, reject) => {
            db.query(sqlDescriptions, [descriptions], (err) => {
              if (err) {
                console.error(
                  "Erreur lors de l'insertion dans descriptions :",
                  err
                );
                return reject(err);
              }
              resolve();
            });
          })
        );
      }

      if (etat) {
        const sqlEtat = "INSERT INTO etats (nom) VALUES (?)";
        promises.push(
          new Promise((resolve, reject) => {
            db.query(sqlEtat, [etat], (err) => {
              if (err) {
                console.error("Erreur lors de l'insertion dans etats :", err);
                return reject(err);
              }
              resolve();
            });
          })
        );
      }

      if (materiels) {
        const sqlMateriels = "INSERT INTO materiels (nom) VALUES (?)";
        promises.push(
          new Promise((resolve, reject) => {
            db.query(sqlMateriels, [materiels], (err) => {
              if (err) {
                console.error(
                  "Erreur lors de l'insertion dans materiels :",
                  err
                );
                return reject(err);
              }
              resolve();
            });
          })
        );
      }

      // Exécution des promesses
      Promise.all(promises)
        .then(() => {
          db.commit((err) => {
            if (err) {
              console.error("Erreur lors du commit :", err);
              return db.rollback(() =>
                res.status(500).json({ message: "Erreur lors du commit." })
              );
            }
            console.log("Toutes les données ont été insérées avec succès.");
            res
              .status(201)
              .json({
                message: "Client et données associées insérés avec succès.",
                clientId,
              });
          });
        })
        .catch((err) => {
          console.error(
            "Erreur lors de l'insertion des données associées :",
            err
          );
          db.rollback(() =>
            res
              .status(500)
              .json({
                message: "Erreur lors de l'insertion des données associées.",
              })
          );
        });
    });
  });
});

module.exports = router;
