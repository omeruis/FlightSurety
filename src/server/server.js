import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp  = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

let STATUS_CODES = [0, 10, 20, 30, 40, 50];

async function registerOracles() {
	const fee = await flightSuretyApp.methods.getRegistrationFee().call()
  console.log("fee",fee);
	const accounts = await web3.eth.getAccounts();
	for (const account of accounts) {
		console.log('account address :', account)
		await flightSuretyApp.methods.registerOracle().send({
			from: account,
			value: fee,
			gas: 6721900
		});
	}
}


async function simulateOracleResponse(requestedIndex, airline, flight, timestamp) {
	const accounts = await web3.eth.getAccounts();
	for (const account of accounts) {
		var indexes = await flightSuretyApp.methods.getMyIndexes().call({ from: account });
		console.log("Oracles indexes: " + indexes + " for account: " + account);
		for (const index of indexes) {
			try {
				if (requestedIndex == index) {
					console.log("Submitting Oracle response For Flight: " + flight + " at Index: " + index);
          let statusCode = STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)]
					await flightSuretyApp.methods.submitOracleResponse(
						index, airline, flight, timestamp, statusCode
					).send({ from: account, gas: 6721900 });

				}
			} catch (e) {
				console.log(e);
			}
		}
	}
}


async function listenEvents() {

  //****************** FLIGHT SURETY APP EVENTS *******************
  flightSuretyApp.events.FlightStatusInfo({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "FLIGHT STATUS INFO");
  });

  flightSuretyApp.events.OracleReport({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "ORACLE REPORT");
  });

  flightSuretyApp.events.OracleRequest({fromBlock: 0}, async (error, event)  => {
    logFromEvent(error, event, "ORACLE REQUEST");
    if (!error) {
      await simulateOracleResponse(
        event.returnValues[0], // index
        event.returnValues[1], // airline
        event.returnValues[2], // flight
        event.returnValues[3] // timestamp
      );
    }
  });

  flightSuretyApp.events.OracleRegistered({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "ORACLE REGISTERED");
  });

  flightSuretyApp.events.FlightRegistered({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "FLIGHT REGISTERED");
  });

  flightSuretyApp.events.ProcessedFlightStatus({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "PROCESSED FLIGHT STATUS");
  });

  flightSuretyApp.events.AirlineVoting({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "AIRLINE VOTING");
  });

  //****************** FLIGHT SURETY DATA EVENTS *******************
  flightSuretyData.events.AirlineRegistered({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "AIRLINE REGISTERED");
  });

  flightSuretyData.events.AirlinePendingRegistered({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "AIRLINE PENDING REGISTERED");
  });

  flightSuretyData.events.PassengerInsured({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "PASSENGER INSUREE");
  });

  flightSuretyData.events.AirlineFunded({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "AIRLINE FUNDED");
  });

  flightSuretyData.events.PayInsuree({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "PAY INSUREE");
  });

  flightSuretyData.events.InsureeCredited({fromBlock: 0}, (error, event) => {
    logFromEvent(error, event, "INSUREE CREDITED");
  });
}

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

function logFromEvent(error, event, title) {
  if (error) console.log(error);
  else {
    console.log('***** EVENT *****');
    console.log(title);
    console.log(event.returnValues);
    console.log('*****************');
  }
}

registerOracles();
listenEvents();

export default app;


