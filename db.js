const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password:'root',
    database: 'ordilan',
    port: 3301
});

db.connect((err) =>{
    if (err) {
        console.error('Erreur de connection a MariaDB', err);
        process.exit(1);
    }
    console.log('connecté a MariaDB');  
});

module.exports = db;