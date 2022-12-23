
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;
  const STATUS_CODE_LATE_AIRLINE = 20;

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });


  it(`(airline) Contract owner is registered as an airline when contract is deployed`, async () => {
    let airlinesCounter = await config.flightSuretyData.getAirLineCounter.call();
    let isAirlineRegistered = await config.flightSuretyData.isAirlineRegistered.call(config.owner);
    assert.equal(isAirlineRegistered, true, "First airline should be registired at contract deploy.");
    assert.equal(airlinesCounter, 1, "Airlines count should be one after contract deploy.");
  });


  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");    
  });


  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");  
  });


  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);
  });


  it('(airline) cannot register an Airline using registerAirline() if it is not funded (active)', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, 'TestFly', {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isActive.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
  });


  it('(airline) can be funded with 10 or more ether only', async () => {

    const fee = web3.utils.toWei('10', "ether");
    try {
        await config.flightSuretyData.fund({ from: config.firstAirline, value: fee });
    }
    catch (e) {
        console.log(e);
    }
    let result = await config.flightSuretyData.isActive.call(config.firstAirline);
    assert.equal(result, true, "Airline should be funded");
  });


  it('(airline) Only existing active airline may register a new airline without need of a consensus if number of airlines under 4', async () => {
    // ACT
    try {
        await config.flightSuretyApp.registerAirline(accounts[2], "TestFly2", {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(accounts[3], "TestFly3", {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(accounts[4], "TestFly4", {from: config.firstAirline});
    }
    catch(e) {

    }
    let airlinesCounter = await config.flightSuretyData.getAirLineCounter.call();
    let resultRegistered = await config.flightSuretyData.isAirlineRegistered.call(accounts[2]); 
    let resultActive = await config.flightSuretyData.isActive.call(accounts[2]); 

    // ASSERT
    assert.equal(airlinesCounter, 4, "Airline counter should be equals 4");
    assert.equal(resultRegistered, true, "Airline should be registered");
    assert.equal(resultActive, false, "Airline should not be active");
  });

  it("(airline) needs 50% votes to register an Airline using registerAirline() once there are 4 or more airlines registered", async () => {

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(accounts[5], "TestFly5", {from: config.firstAirline});
    }
    catch(e) {
        console.log(e);
    }

    let result = await config.flightSuretyData.isActive.call(accounts[5]);
    let resultPending = await config.flightSuretyData.isAirlinePending.call(accounts[5]);
    let airlinesCounter = await config.flightSuretyData.getAirLineCounter.call();
    let votes = await config.flightSuretyData.getAirlineVotes.call(accounts[5]);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
    assert.equal(resultPending, true, "Airline is pending waiting for vote");
    assert.equal(airlinesCounter, 4, "Airlines count should be one after contract deploy.");
    assert.equal(votes, 1, "Vote counter should be equals to 1");
  });

  it("(airline) Should not be registered until airline get 50% votes", async () => {
    const fee = web3.utils.toWei('10', "ether");
    try {
        await config.flightSuretyData.fund({ from: accounts[2], value: fee });
        await config.flightSuretyData.fund({ from: accounts[3], value: fee });
        await config.flightSuretyData.fund({ from: accounts[4], value: fee });

        await config.flightSuretyApp.voteForAirline(accounts[5], {from: accounts[2]});

        var resultIsRegistered = await config.flightSuretyData.isAirlineRegistered.call(accounts[5]);
        var resultPending = await config.flightSuretyData.isAirlinePending.call(accounts[5]);
        
    } catch(e) {
        console.log(e);
    }

    let result = await config.flightSuretyData.isActive.call(accounts[5]);
    let airlinesCounter = await config.flightSuretyData.getAirLineCounter.call();

    // ASSERT
    assert.equal(resultIsRegistered, true, "Airline should be registered");
    assert.equal(resultPending, false, "Airline is not still pending in waiting for vote");
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
    assert.equal(airlinesCounter, 5, "Airlines count should be one after contract deploy.");
  });

  it('(airline) can register a flight using registerFlight()', async () => {
    // ARRANGE
    flightTimestamp = Math.floor(Date.now() / 1000); //convert timestamp from miliseconds (javascript) to seconds (solidity)

    // ACT
    try {
        await config.flightSuretyApp.registerFlight("ND1309", "London", "Chicago", flightTimestamp, {from: config.firstAirline});
    }
    catch(e) {
        console.log(e);
    }
  });

  it("(passenger) may pay up to 1 ether for purchasing flight insurance.", async () => {
    // ARRANGE
    let price = await config.flightSuretyData.INSURANCE_PRICE_LIMIT.call();

    // ACT
    try {
        await config.flightSuretyData.buy("ND1309", {from: config.firstPassenger, value: price});
    }
    catch(e) {
        console.log(e);
    }

    let registeredPassenger = await config.flightSuretyData.passengerAddresses.call(0);
    assert.equal(registeredPassenger, config.firstPassenger, "Passenger should be added to list of people who bought a ticket.");
  });

  it('(Oracles) Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory', async () => {
    
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
    //   console.log(`Oracle Registered: ${accounts[a]}, ${result[0]}, ${result[1]}, ${result[2]}`);
      assert.equal(result.length, 3, 'Oracle should be registered with three indexes');
    }
  });

  it("(Oracles) Server will loop through all registered oracles, identify those oracles for which the OracleRequest event applies, and respond by calling into FlightSuretyApp contract with random status code", async () => {
    // ARRANGE
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.now() / 1000); //convert timestamp from miliseconds (javascript) to seconds (solidity)

    await config.flightSuretyApp.registerFlight(flight, "London", "Chicago", timestamp, {from: config.firstAirline});

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);

    for(let a=1; a < (TEST_ORACLES_COUNT); a++) {
        let oracleIndexes = await config.flightSuretyApp.getMyIndexes({from: accounts[a]});
        for(let idx=0;idx<3;idx++) {
            try {
                // Submit a response...it will only be accepted if there is an Index match
                await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_LATE_AIRLINE, { from: accounts[a] });
            } catch(e) {
                // Enable this when debugging
                // console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, flightTimestamp);
            }
        }
    }
    let flightStatus = await config.flightSuretyApp.viewFlightStatus(config.firstAirline, flight, timestamp);
    assert.equal(STATUS_CODE_LATE_AIRLINE, flightStatus.toString(), 'Oracles should changed flight status to 20 (late due to Airline)');
  });

  it("(passenger) If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid", async () => {
    // ARRANGE
    let price = await config.flightSuretyData.INSURANCE_PRICE_LIMIT.call();
    let creditToPay = await config.flightSuretyApp.getCreditToPay.call({from: config.firstPassenger});
    const creditInWei = price * 1.5;
    assert.equal(creditToPay, creditInWei, "Passenger should have 1,5 ether to withdraw.");
  });

  it("(passenger) Passenger can withdraw any funds owed to them as a result of receiving credit for insurance payout", async () => {
    let creditToPay = await config.flightSuretyApp.getCreditToPay.call({from: config.firstPassenger});

    let passengerOriginalBalance = await web3.eth.getBalance(config.firstPassenger);
    let receipt = await config.flightSuretyApp.withdrawCredit({from: config.firstPassenger});
    let passengerFinalBalance = await web3.eth.getBalance(config.firstPassenger);

    // Obtain total gas cost
    const gasUsed = Number(receipt.receipt.gasUsed);
    const tx = await web3.eth.getTransaction(receipt.tx);
    const gasPrice = Number(tx.gasPrice);

    let finalCredit = await config.flightSuretyApp.getCreditToPay.call({from: config.firstPassenger});

    assert.equal(finalCredit.toString(), 0, "Passenger should have transfered the ethers to its wallet.");
    assert.equal(Number(passengerOriginalBalance) + Number(creditToPay) - (gasPrice * gasUsed), Number(passengerFinalBalance), "Passengers balance should have increased the amount it had credited");
  });

});
