
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
        "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
        "0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef",
        "0x821aEa9a577a9b44299B9c15c88cf3087F3b5544",
        "0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2",
        "0x2932b7A2355D6fecc4b5c0B6BD44cC31df247a2e",
        "0x2191eF87E392377ec08E7c08Eb105Ef5448eCED5",
        "0x0F4F2Ac550A1b4e2280d04c21cEa7EBD822934b5",
        "0x6330A553Fc93768F612722BB8c2eC78aC90B3bbc",
        "0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE",
        "0xE44c4cf797505AF1527B11e4F4c6f95531b4Be24",
        "0x69e1CB5cFcA8A311586e3406ed0301C06fb839a2",
        "0xF014343BDFFbED8660A9d8721deC985126f189F3",
        "0x0E79EDbD6A727CfeE09A2b1d0A59F7752d5bf7C9",
        "0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4",
        "0xa23eAEf02F9E0338EEcDa8Fdd0A73aDD781b2A86",
        "0xc449a27B106BE1120Bd1Fd62F8166A2F61588eb9",
        "0xF24AE9CE9B62d83059BD849b9F36d3f4792F5081",
        "0xc44B027a94913FB515B19F04CAf515e74AE24FD6",
        "0xcb0236B37Ff19001633E38808bd124b60B1fE1ba",
        "0x715e632C0FE0d07D02fC3d2Cf630d11e1A45C522",
        "0x90FFD070a8333ACB4Ac1b8EBa59a77f9f1001819",
        "0x036945CD50df76077cb2D6CF5293B32252BCe247",
        "0x23f0227FB09D50477331D2BB8519A38a52B9dFAF",
        "0x799759c45265B96cac16b88A7084C068d38aFce9",
        "0xA6BFE07B18Df9E42F0086D2FCe9334B701868314",
        "0x39Ae04B556bbdD73123Bab2d091DCD068144361F",
        "0x068729ec4f46330d9Af83f2f5AF1B155d957BD42",
        "0x9EE19563Df46208d4C1a11c9171216012E9ba2D0",
        "0x04ab41d3d5147c5d2BdC3BcFC5e62539fd7e428B",
        "0xeF264a86495fF640481D7AC16200A623c92D1E37"
    ];


    let owner = accounts[0];
    let firstAirline = accounts[0];
    let firstPassenger = accounts[22];
    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    
    return {
        owner: owner,
        firstAirline: firstAirline,
        firstPassenger: firstPassenger,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};