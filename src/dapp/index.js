
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flightName = DOM.elid('flight-name').value;
            let airlineAddress = DOM.elid('fetch-airline-address').value;
            // Write transaction
            contract.fetchFlightStatus(airlineAddress, flightName, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

        DOM.elid('submit-airline').addEventListener('click', () => {
            let flightName = DOM.elid('flight-name').value;
            let airlineAddress = DOM.elid('fetch-airline-address').value;
            // Write transaction
            contract.registerAirline(flightName, airlineAddress, (error, result) => {
                displayAirline('display-wrapper-airline', [ { label: 'register airline', error: error, value: result} ]);
            });
        })

        DOM.elid('authorize-contract').addEventListener('click', () => {
            let contractAddress = DOM.elid('contract-address').value;
            // Write transaction
            contract.authorizeContract(contractAddress, (error, result) => {
                display('Authorize contract', 'Call Authorize contract method', [ { label: 'response', error: error, value: result} ]);
            });
        })

        DOM.elid('fund-airlines').addEventListener('click', () => {
            let airlineAddress = DOM.elid('airline-address').value;
            contract.fundAirline(airlineAddress, (error, result) => {
                displayAirline('display-wrapper-airline', [{ label: 'Airline funded Tx', error: error, value: result }]);
                DOM.elid('airline-address').value = "";
            });
        })

        DOM.elid('vote-airlines').addEventListener('click', () => {
            let airlineAddress = DOM.elid('airline-address').value;
            contract.voteForAirline(airlineAddress, (error, result) => {
                displayAirline('display-wrapper-airline', [{ label: 'Airline funded Tx', error: error, value: result }]);
                DOM.elid('airline-address').value = "";
            });
        })

        DOM.elid('register-flight').addEventListener('click', () => {
            let flight = DOM.elid('airline-flight').value;
            let departure = DOM.elid('airline-departure').value;
            let destination = DOM.elid('airline-destination').value;
            let timestamp = DOM.elid('airline-timestamp').value;
            contract.registerFlight(flight, departure, destination, timestamp, (error, result) => {
                displayAirline('display-wrapper-airline', [{ label: 'Flight funded Tx', error: error, value: result }]);
                DOM.elid('airline-flight').value = "";
                DOM.elid('airline-departure').value = "";
                DOM.elid('airline-destination').value = "";
                DOM.elid('airline-timestamp').value = "";
            });
        })

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let flight = DOM.elid('insurance-flight').value;
            let value = DOM.elid('insurance-value').value;
            contract.buyInsurance(flight, value, (error, result) => {
                displayAirline('display-wrapper-airline', [{ label: 'Flight funded Tx', error: error, value: result }]);
            });
        })

        DOM.elid('check-balance').addEventListener('click', () => {
            let passengerAddress = DOM.elid('passanger-address').value;
            contract.getPassengerCredits(passengerAddress, (error, result) => {
                displayAirline('display-wrapper-passenger-detail', [{ label: 'Credit pending to withdraw', error: error, value: result + ' ETH' }]);
                DOM.elid('passanger-address').value = "";
            });
        })

        DOM.elid('withdraw-balance').addEventListener('click', () => {
            contract.withdrawCredits((error, result) => {
                displayAirline('display-wrapper-passenger-detail', [{ label: 'Credit withdrawn', error: error, value: result + ' ETH' }]);
                DOM.elid('passanger-address').value = "";
            });
        });

    
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function displayAirline(id, results) {
    let displayDiv = DOM.elid(id);
    results.map((result) => {
        let row = displayDiv.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        displayDiv.appendChild(row);
    })

}







