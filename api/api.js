const express = require("express");
const fs = require('fs');
const https = require('https');
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded())
const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
}).promise();

const PORT = 3000;

app.listen(PORT, function() {
    console.log(`Connected http on port ${PORT}`);
})

app.post("/metadata", async function(req, res) {
    const id = req.body.id;
} )

app.get('/metadata/:id', async function(req, res){
    try {
        const NFT_id = req.params.id;
        const result = await getMetadataByNftId(NFT_id);
        return res.send(result);
    } catch (error) {
        return res.status(404).send();
    }
})

app.post("/setNewBooking", async function(req, res) {
    try {
        const nft_id = req.body.nft_id;
        const place_id = req.body.place_id;
        const table_number = req.body.table_number;
        const date = req.body.date;

        console.log(req.body);
        const result = await setNewBooking(nft_id, place_id, table_number, date);
        if (result === true){
            return res.status(201).send(); 
        } else {
            return res.status(503).send();
        }
    } catch (error) {
        console.log(error)
        return res.status(404).send();
    }
})

async function getMetadataByNftId(nftId){
    if(!nftId) {
        return;
    }
    
    let getMetadataQuery = `SELECT * from TABLE where nftId="${nftId.toLowerCase()}"`;

    let getMetadataQueryResult = await connection.query(getMetadataQuery);
    
    return getMetadataQueryResult[0];
}

async function setNewBooking(nft_id, place_id, table_number, date) {
    try {
        const setNewBookingQuery = `INSERT INTO table_orders (place_id, table_number, date, nft_id) VALUES ('${place_id}','${table_number}','${date}','${nft_id}')`
        await connection.query(setNewBookingQuery);
        return true
    } catch (error) {
        console.log(error);
        return false
    }
}