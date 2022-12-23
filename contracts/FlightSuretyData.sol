pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       STRUCTURES                                     */
    /********************************************************************************************/

    struct Airline {
        string name;
        address wallet;
        bool isRegistered;
        uint256 funded;
        uint256 votes;
    }

    struct Passenger {
        address wallet;
        uint256 credits;
        mapping(string => uint256) flights;
    }

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    
    mapping(address => bool) private authorizedContracts;

    mapping(address => Airline) private airlines;
    mapping(address => Airline) private pendingAirlines;
    mapping(address => Passenger) private passengers;

    address[] public passengerAddresses;

    uint256 internal airlinesCounter = 0;

    uint256 public constant INSURANCE_PRICE_LIMIT = 1 ether;
    uint256 public constant MINIMUM_FUNDS = 10 ether;


    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineRegistered(address airline);
    event AirlinePendingRegistered(address airline);
    event PassengerInsured(address passenger, string flightCode, uint256 amount, uint256 payout);
    event AirlineFunded(address airline);
    event PayInsuree(address payoutAddress, uint256 amount);
    event InsureeCredited(string flightCode);


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        passengerAddresses = new address[](0);
        airlines[msg.sender] = Airline({
            name: "FlightyAir",
            wallet: msg.sender,
            isRegistered: true,
            funded: 0,
            votes: 0
        });
        airlinesCounter++;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(isOperational(), "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorizedContracts () {
        require(authorizedContracts[msg.sender] == true, "Requires caller is authorized to call this contract function");
        _;
    }

    modifier requireIsAirlineRegistered () {
        require(isAirlineRegistered(msg.sender), "Sender is not an registered airline");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    function authorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        authorizedContracts[contractAddress] = true;
    }

    function deAuthorizeContract
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    function isAuthorized
                        (
                            address contractAddress
                        )
                        external
                        view
                        returns (bool)
    {
        return authorizedContracts[contractAddress] == true;
    }

    function isActive
                            (
                                address airlineAddress
                            )
                            external
                            view
                            returns(bool)
    {
        return airlines[airlineAddress].funded >= MINIMUM_FUNDS;
    }

    function isAirlineRegistered
                            (
                                address airlineAddress
                            )
                            public
                            view
                            returns(bool)
    {
        return airlines[airlineAddress].isRegistered;
    }

    function isAirlinePending
                            (
                                address airlineAddress
                            )
                            external
                            view
                            returns(bool)
    {
        return pendingAirlines[airlineAddress].wallet != address(0);
    }

    function getAirLineFund
                            (
                                address airlineAddress
                            )
                            external
                            view
                            returns(uint256) 
    {
        return airlines[airlineAddress].funded;
    }

    function getPassengerCredits
                            (
                                address passengerAddress
                            )
                            external
                            view
                            returns(uint256)
    {
        return passengers[passengerAddress].credits;
    }

    function getAirLineCounter
                            (
                            )
                            external
                            view
                            returns(uint256)
    {
        return airlinesCounter;
    }


    function getAirlineVotes
                            (
                                address airlineAddress
                            )
                            external
                            view
                            returns(uint256)
    {
        return pendingAirlines[airlineAddress].votes;
    }

    function getCreditToPay
                            (
                                address passengerAddress
                            )
                            external 
                            view 
                            returns (uint256) 
    {
        return passengers[passengerAddress].credits;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (
                                address airlineAddress,
                                string name
                            )
                            public
                            requireIsOperational
                            requireAuthorizedContracts
    {
        require(airlineAddress != address(0), "'airlineAddress' must be a valid address.");
        require(!airlines[airlineAddress].isRegistered, "Airline is already registered.");
        airlines[airlineAddress] = Airline({
                name: name,
                wallet: airlineAddress,
                isRegistered: true,
                funded: 0,
                votes: 0
            });
            airlinesCounter++;

         emit AirlineRegistered(airlineAddress);
    }

    function savePendingAirline
                            (
                                address airlineAddress,
                                string name
                            )
                            external
                            requireIsOperational
                            requireAuthorizedContracts
    {
        require(airlineAddress != address(0), "'airlineAddress' must be a valid address.");
        require(!pendingAirlines[airlineAddress].isRegistered, "Airline is already pending.");
        pendingAirlines[airlineAddress] = Airline({
                name: name,
                wallet: airlineAddress,
                isRegistered: false,
                funded: 0,
                votes: 1
            });

        emit AirlinePendingRegistered(airlineAddress);
    }
    
    function vote
                            (
                                address airlineAddress
                            )
                            public
                            requireIsOperational
                            requireAuthorizedContracts
                            returns(uint256 votes)
    {
        pendingAirlines[airlineAddress].votes++;
        votes = pendingAirlines[airlineAddress].votes;
        if (pendingAirlines[airlineAddress].votes >= airlinesCounter.div((2))) {
            registerAirline(airlineAddress, pendingAirlines[airlineAddress].name);
            delete pendingAirlines[airlineAddress];
        }
        return votes;
    }

    function isPassenger
                        (
                            address passenger
                        ) 
                        internal 
                        view 
                        returns(bool)
    {
        for (uint256 c = 0; c < passengerAddresses.length; c++) {
            if (passengerAddresses[c] == passenger) {
                return true;
            }
        }
        return false;
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (      
                                string flightKey                    
                            )
                            external
                            payable
                            requireIsOperational
    {
        require(msg.sender == tx.origin, "Contracts is call not allowed");
        require(msg.value > 0, 'You need to pay something to buy a flight insurance');

        if(!isPassenger(msg.sender)){
            passengerAddresses.push(msg.sender);
        }

        if (passengers[msg.sender].wallet != msg.sender) {
            passengers[msg.sender] = Passenger({
                wallet: msg.sender,
                credits: 0
            });
            passengers[msg.sender].flights[flightKey] = msg.value;
        } else {
            passengers[msg.sender].flights[flightKey] = msg.value;
        }

        if (msg.value > INSURANCE_PRICE_LIMIT) {
            msg.sender.transfer(msg.value.sub(INSURANCE_PRICE_LIMIT));
        }

        emit PassengerInsured(msg.sender, flightKey, msg.value, msg.value.sub(INSURANCE_PRICE_LIMIT));
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    string flightCode
                                )
                                external
                                requireIsOperational
                                requireAuthorizedContracts
    {
        for (uint256 i = 0; i < passengerAddresses.length; i++) {
            if(passengers[passengerAddresses[i]].flights[flightCode] != 0) {
                uint256 savedCredit = passengers[passengerAddresses[i]].credits;
                uint256 payedPrice = passengers[passengerAddresses[i]].flights[flightCode];
                passengers[passengerAddresses[i]].flights[flightCode] = 0;
                passengers[passengerAddresses[i]].credits = savedCredit + payedPrice + payedPrice.div(2);
            }
        }
        emit InsureeCredited(flightCode);
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                 address passengerAddress
                            )
                            external
                            payable
                            requireIsOperational
                            requireAuthorizedContracts
    {
        require(passengerAddress == tx.origin, "Contracts call is not allowed");
        require(passengers[passengerAddress].wallet != address(0), "The passenger is not insured");
        require(passengers[passengerAddress].credits > 0, "There is not credit pending to be withdrawed for the passenger");
        uint256 credits = passengers[passengerAddress].credits;
        require(address(this).balance > credits, "The contract does not have enough funds to pay the credit");
        passengers[passengerAddress].credits = 0;
        passengerAddress.transfer(credits);

        emit PayInsuree(passengerAddress, credits);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (
                            )
                            public
                            payable
                            requireIsOperational
                            requireIsAirlineRegistered
                            
    {
        uint256 currentFunds = airlines[msg.sender].funded;
        airlines[msg.sender].funded = currentFunds.add(msg.value);
        emit AirlineFunded(msg.sender);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}

