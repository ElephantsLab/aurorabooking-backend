const express = require("express");
const fs = require('fs');
const https = require('https');
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
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

async function getMetadataByNftId(nftId){
    if(!nftId) {
        return;
    }
    
    let getMetadataQuery = `SELECT * from TABLE where nftId="${nftId.toLowerCase()}"`;

    let getMetadataQueryResult = await connection.query(getMetadataQuery);
    
    return getMetadataQueryResult[0];
}