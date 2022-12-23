import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(airline, flight, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    authorizeContract(address, callback) {
        let self = this;
        let payload = {
            address: address
        };
        self.flightSuretyData.methods
            .authorizeCaller(payload.address)
            .send({from: self.owner}, (error, result) => {
                callback(error, result);
            });
    }

    fundAirline(airlineAddress, callback) {
        let self = this;
        const fee = this.web3.utils.toWei('10', 'ether');
        self.flightSuretyData.methods
            .fund()
            .send({ from: airlineAddress, value: fee }, (error, result) => {
                callback(error, result);
            });
    }

    registerAirline(airlineName, airlineAddress, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .registerAirline(airlineAddress, airlineName)
            .send({ from: self.owner, gas: 6721900 }, (error, result) => {
                callback(error, result);
            });
    }

    voteForAirline(airlineAddress, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .voteForAirline(airlineAddress)
            .send({ from: self.owner, gas: 6721900 }, (error, result) => {
                callback(error, result);
            });
    }

    registerFlight(flight, departure, destination, timestamp, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .registerFlight(flight, departure, destination, timestamp)
            .send({from: self.owner, gas: 4712388, gasPrice: 100000000000},  (error, result) => {
                callback(error, result);
            });
    }

    withdrawCredits(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .withdrawCredit()
            .send({ from: self.owner, gas: 4712388, gasPrice: 100000000000}, (error, result) => {
                callback(error, result);
            });
    }

    async buyInsurance(flight, value, callback) {
        let self = this;
        const fee = await self.flightSuretyApp.methods.getRegistrationFee().call()
        self.flightSuretyData.methods
            .buy(flight)
            .send({from: self.owner, value: fee, gas: 4712388, gasPrice: 100000000000}, (error, result) => {
                callback(error, result);
            });
    }

    getPassengerCredits(passangerAddress, callback) {
        let self = this;
        self.flightSuretyData.methods
            .getPassengerCredits(passangerAddress)
            .call({ from: self.owner }, (error, result) => {
                callback(error, result);
            });
    }
}