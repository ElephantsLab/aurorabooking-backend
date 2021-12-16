

const mysql = require('mysql2');
require('dotenv').config();
const {abi} = require('../abi/contractAbi')
const {nftAbi} = require('../abi/nftContractAbi')
const {ethers } = require('ethers');

const startBlock = 12345678;

const NODE = "https://testnet.aurora.dev/";

const contractAddress = process.env.CONTRACT_ADDRESS;
const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS
const providerAddress = new ethers.providers.JsonRpcProvider(NODE);
const contract = new ethers.Contract(contractAddress, abi, providerAddress);
const nftContract = new ethers.Contract(nftContractAddress, nftAbi, providerAddress);

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
}).promise();

async function main() {
    
    console.log("Scanning started", await getLatestBlock())

    const blockFrom = await getLatestBlock()

    let events = await getEvents(blockFrom);

    for (let event of events) {
        await writeEventToDB(event)
    }

    await connection.end();
}

async function getLatestBlock() {
                                               
    let query = `SELECT last_scanned_block FROM last_scanned_blocks`;
    let lastBlockRaw = await connection.query(query);
	let lastBlock = lastBlockRaw[0][0].last_scanned_block
    if (lastBlock) {
        //scanner will double check lastly included transactions
        return Number(lastBlock) - 100;
    }
    else {
        return startBlock;
    }
}

async function getEvents(blockFrom) {
    let allEvents = [];
    let lastBlockReached = false
    try {
          //устанавливаем по какой блок сканировать ивенты
          let lastBlock = await providerAddress.getBlockNumber()
          //создаем фильтры для каждого ивента
          let filterEvent1 = contract.filters.Event1();
          let filterEvent2 = contract.filters.Event2();
          let filterEvent3 = contract.filters.Event3();
          let filterEvent4 = contract.filters.Event4();
          
          
          for (let block = blockFrom; block < lastBlock;) {
              //устанавливаем начальный блок для фильтров
              console.log('startblock', block)
              filterEvent1.fromBlock = block;
              filterEvent2.fromBlock = block;
              filterEvent3.fromBlock = block;
              filterEvent4.fromBlock = block;
      
              //устанавливаем конечный блок для фильтров
              filterEvent1.toBlock = block + 1000;
              filterEvent2.toBlock = block + 1000
              filterEvent3.toBlock = block + 1000;
              filterEvent4.toBlock = block + 1000;
      
              //проверяем или конечный блок больше последнего смайненого блока 
              if (filterEvent1.toBlock > lastBlock) {
                  filterEvent1.toBlock = lastBlock;
                  filterEvent2.toBlock = lastBlock;
                  filterEvent3.toBlock = lastBlock;
                  filterEvent4.toBlock = lastBlock;
      
              lastBlockReached = true;
              }
              //сканируем ивенты
              let eventsEvent1 = await providerAddress.getLogs(filterEvent1);
              let eventsEvent2 = await providerAddress.getLogs(filterEvent2);
              let eventsEvent3 = await providerAddress.getLogs(filterEvent3);
              let eventsEvent4 = await providerAddress.getLogs(filterEvent4);
  
      
              //парсим их для читабельной записи
              let resultEvent1 = eventsEvent1.map(el => getReadableDataFromEvent(el, "Event1",))
              let resultEvent2 = eventsEvent2.map(el => getReadableDataFromEvent(el, "Event2"))
              let resultEvent3 = eventsEvent3.map(el => getReadableDataFromEvent(el, "Event3"))
              let resultEvent4 = eventsEvent4.map(el => getReadableDataFromEvent(el, "Event4"))
  
      
              //возвращаем один массив со всеми ивентами
              allEvents = [...allEvents, ...resultEvent1, ...resultEvent2, ...resultEvent3, ...resultEvent4]
    
    
            if(lastBlockReached){
                new Promise(async res => {
                    try {
                        let insertLastBlockQuery = `UPDATE last_scanned_blocks SET last_scanned_block = "${lastBlock}"`; // TODO return last block
                        await connection.query(insertLastBlockQuery);
                        console.log(`Last scanned block ${lastBlock}`);
                    }
                    catch (e) {
                        console.log(e)
                    }
            
                    res();
                });
                break;
            } 
            
            block+= 1000;
        }
    
        return allEvents;
    } catch (error) {
      console.log(error);
    }
  
}

function getReadableDataFromEvent(){
    //TODO: add function logic
}

async function writeEventToDB(event) {
    if(!event){
        return;
    }

    return new Promise(async res => {
        //TODO: get event data to write to table
        try {
            let insertQuery = ``//TODO: write data to DB
            await connection.query(insertQuery);
            console.log(`Added event ${event_name}[hash: ${transaction_hash}]`);
        }
        catch (e) {
            console.log(e);
        }

        res();
    });
}

main()