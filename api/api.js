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
const QRCode = require('qrcode')

const NODE = "https://mainnet.aurora.dev/";
const baseURL = "https://aurorabooking.net/api"
const webSiteUrl = "https://aurorabooking.net"

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

const places = [

    {"NAME": "Aurora gastronomy", "ID": 0, "TABLES": 10, "IMG": "https://aurorabooking.net/img/cardImage1.e6d75e12.png", "STARS": ["five"], "TOWN": "KIEV"},
    {"NAME": "Near foods", "ID": 1, "TABLES": 12, "IMG": "https://aurorabooking.net/img/cardImage2.ee971047.png", "STARS": ["five"], "TOWN": "LONDON"}
]

// https.createServer({
//     key: fs.readFileSync('../../../../../etc/letsencrypt/live/aurorabooking.net/privkey.pem'),
//     cert: fs.readFileSync('../../../../../etc/letsencrypt/live/aurorabooking.net/cert.pem')
// }, app).listen(PORT, function() {
//     console.log("Connected https on ", PORT);
// });

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
app.get('/getTodaysOrders', async function(req, res){
    try {
        const date = req.query.date
        const result = await getTodaysOrders(date);
        
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

app.get('/getAllActiveLots', async function(req,res){
    try {
        const timestampt = Math.floor(new Date() / 1000);
        const date = timeConverter(timestampt);
        const table_lots = [];
        const userLots = [];

        const query = `SELECT * from lot_orders where date = "${date}"`;
        const result = await connection.query(query);
        if(result[0].length){
            table_lots.push(...result[0])
        }
        

        for(let lot of table_lots){
            const query = `SELECT * from table_orders where id = "${lot.table_order_id}"`
            const result = await connection.query(query);
            if(result[0].length){
                result[0][0]["price"] = lot.price;
                result[0][0]["lot_id"] = lot.lot_id;
                userLots.push(...result[0]);
            }
        }
        return res.send(userLots);
    } catch (error) {
        console.log(error);
    }
})
app.get('/getUserOrders', async function(req, res){
    try {
        // const timestampt = Math.floor(new Date() / 1000);
        // const date = timeConverter(timestampt);
        const user = req.query.address
        const nft_id_list = await nftContract.getOwnedTokensIds(user);
        const userOrders = [];

        for(let nft_id of nft_id_list){
            nft_id = Number.parseInt(nft_id["_hex"]);
            const query = `SELECT * from table_orders where nft_id = "${nft_id}"`;
            const result = await connection.query(query);
            if(result[0].length){
                userOrders.push(result[0][0]);
            }
        }
        return res.send(userOrders);
    } catch (error) {
        console.log(error);
        return res.status(404).send();
    }
})


app.get('/getQr/:id', async function(req, res){
    try {
        const NFT_id = req.params.id;
        const qrCode = await generateQR(`${webSiteUrl}/order/${NFT_id}`);
        const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
        const img = Buffer.from(base64Data, 'base64');
        res.append('Content-Type', 'image/png');
        return res.end(img); 
    } catch (error) {
        console.log(error)
        return res.status(404).send(); 
    }
})
app.get('/getQrText/:id', async function(req, res){
    try {
        const NFT_id = req.params.id;
        const qrCode = await generateQR(`${webSiteUrl}/order/${NFT_id}`);
        return res.end(qrCode); 
    } catch (error) {
        console.log(error)
        return res.status(404).send(); 
    }
})
// app.get('/getAllQrTexts', async function(req, res){
//     try {
//         const nft_ids = req.query.nft_ids;
//         console.log(nft_ids)
//         let resultArray= []
//         for(let nftId of nft_ids){
//             const qrCode = await generateQR(`${webSiteUrl}/order/${nftId}`);
//             resultArray.push(qrCode);
//         }
//         return res.end(resultArray); 
//     } catch (error) {
//         console.log(error)
//         return res.status(404).send(); 
//     }
// })

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
app.delete('/deleteLot', async function(req, res){
    try {
        const lot_id = req.body.lot_id;
        await deleteLot(lot_id)
        res.status(200).send();
    } catch (error) {
        console.log(error);
        res.status(404).send();
    }
})
app.post("/setNewLot", async function(req, res) {
    try {
        const id_in_table_order = req.body.id;
        const price = req.body.price;
        const lot_id = req.body.lot_id; 
        const date = timeConverter(req.body.date);
        const currentDate = timeConverter(Date.now());//TODO: check table_order time
        const result = await setNewLot(id_in_table_order, price, date, lot_id);
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
    let result;
    const timestamp = Math.floor(new Date() / 1000)
    const currentDate = timeConverter(timestamp);
    let getMetadataQuery = `SELECT * from table_orders where nft_id="${nftId}" and date ="${currentDate}"`;
    let getMetadataQueryResult = await connection.query(getMetadataQuery);
    if(getMetadataQueryResult[0].length){
        result = parseMetadate(getMetadataQueryResult[0][0]);
    }
    console.log(result)
    return result;
}

async function getTodaysOrders(date){
    const currentDate = timeConverter(date);
    let query = `SELECT * from table_orders where date = "${currentDate}"`;
    const qeuryResult = await connection.query(query);
    return qeuryResult[0]
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

async function deleteLot(lot_id){
    try {
        const query = `DELETE FROM lot_orders WHERE lot_id = "${lot_id}"`;
        await connection.query(query);
        return true;
    } catch (error) {
        console.log(error);
    }
}
async function setNewLot(order_id, price, date, lot_id) {
    try {
        const setNewLotQuery = `INSERT INTO lot_orders (table_order_id, lot_id, price, date) VALUES ('${order_id}', '${lot_id}','${price}','${date}')`
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

const generateQR = async text => {
    try {
      return QRCode.toDataURL(text);
    } catch (err) {
      console.error(err)
    }
  }

function parseMetadate(metadate) {
    console.dir(metadate)
    const place = places.find(el => el.ID === metadate.place_id);
    const resObj ={
        "name": `Your booking in ${place.NAME}, table: #${metadate.table_number}`,
        "image": `${baseURL}/getQr/${metadate.nft_id}`,
        "description": "This is your order confirmation",
        "atributes":[
            {
                "trait_type":`place_id`,
                "value":`${metadate.place_id}`,
            },
            {
                "trait_type":`table_number`,
                "value":`${metadate.table_number}`,
            },
            {
                "trait_type":`nft_id`,
                "value":`${metadate.nft_id}`,
            }
        ]
    }

    return resObj
}
