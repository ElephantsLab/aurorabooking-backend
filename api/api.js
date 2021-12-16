const express = require("express");
const fs = require('fs');
const https = require('https');
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded())
const mysql = require("mysql2");
const {nftAbi} = require('../abi/nftContractAbi')
const { ethers } = require('ethers');

const NODE = "https://mainnet.aurora.dev/";

const nftContractAddress = process.env.NFT_ADDRESS;
const providerAddress = new ethers.providers.JsonRpcProvider(NODE);
const nftContract = new ethers.Contract(nftContractAddress, nftAbi, providerAddress);

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

app.get('/metadata/:id', async function(req, res){
    try {
        const NFT_id = req.params.id;
        const result = await getMetadataByNftId(NFT_id);
        return res.send(result);
    } catch (error) {
        console.log(error)
        return res.status(404).send();
    }
})
app.get('/getUserActiveLots', async function(req, res){
    try {
        const timestampt = Math.floor(new Date() / 1000);
        const date = timeConverter(timestampt);
        const user = req.query.address
        const nft_id_list = await nftContract.getOwnedTokensIds(user);
        console.log(nft_id_list);
        const user_table_ids = [];
        const userLots = [];

        for(let nft_id of nft_id_list){
            nft_id = Number.parseInt(nft_id["_hex"]);
            const query = `SELECT id from table_orders where nft_id = "${nft_id}" and date = "${date}"`;
            const result = await connection.query(query);
            if(result[0]){
                user_table_ids.push(...result[0])
            }
        }

        for(let table_id of user_table_ids){
            console.log(table_id)
            const query = `SELECT * from lot_orders where table_order_id = "${table_id.id}"`
            const result = await connection.query(query);
            userLots.push(result[0]);
        }
        return res.send(userLots);
    } catch (error) {
        console.log(error);
    }
})

app.post("/setNewBooking", async function(req, res) {
    try {
        const nft_id = req.body.nft_id;
        const place_id = req.body.place_id;
        const table_number = req.body.table_number;
        const date = timeConverter(req.body.date);

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

app.post("/setNewLot", async function(req, res) {
    try {
        const id_in_table_order = req.body.id;
        const price = req.body.price;
        const date = timeConverter(req.body.date);
        const currentDate = timeConverter(Date.now());//TODO: check table_order time
        const result = await setNewLot(id_in_table_order, price, date);
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
    const timestamp = Math.floor(new Date() / 1000)
    const currentDate = timeConverter(timestamp);
    let getMetadataQuery = `SELECT * from table_orders where nft_id="${nftId}" and date ="${currentDate}"`;

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
async function setNewLot(order_id, price, date) {
    try {
        const setNewLotQuery = `INSERT INTO lot_orders (table_order_id, price, date) VALUES ('${order_id}','${price}','${date}')`
        await connection.query(setNewLotQuery);
        return true
    } catch (error) {
        console.log(error);
        return false
    }
}

function timeConverter(UNIX_timestamp){
    const a = new Date(UNIX_timestamp * 1000);
    const months = ['1','2','3','4','5','6','7','8','9','10','11','12'];
    const year = a.getFullYear();
    const month = months[a.getMonth()];
    const date = a.getDate();
    
    const time = year + '-' + month + '-' + date;
    return time;
  }