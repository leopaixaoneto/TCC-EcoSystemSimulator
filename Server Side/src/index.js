const express = require('express');
const router = require('../src/router/routes')
const mysql = require('mysql2')
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(router);

db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'byosimulation'
})

app.listen(3001);
    console.log ('Servidor Iniciado');
