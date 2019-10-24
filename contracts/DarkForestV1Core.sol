pragma solidity ^0.5.8;
import "./Verifier.sol";
import "./ABDKMath64x64.sol";

contract DarkForestV1 is Verifier {
    using ABDKMath64x64 for *;

    uint256 constant UINT256_MAX = ~uint256(0);
    uint8 constant VERSION = 1;

    uint public maxX = 999;
    uint public maxY = 999;
    uint difficulty = 1000;
    uint capacity = 100000; // in milliPopulation
    uint growth = 1000; // maximum growth rate, achieved at milliPops = 50000, in milliPopulation per second

    struct Planet {
        uint locationId;
        address owner;

        uint capacity;
        uint growth;
        uint population;
        uint lastUpdated;

        bool coordinatesRevealed;
        uint x;
        uint y;

        uint8 version;
    }

    event PlayerInitialized(address player, uint loc);
    event PlayerMoved(address player, uint oldLoc, uint newLoc, uint maxDist);

    uint[] public planetIds;
    mapping (uint => Planet) public planets;
    mapping (uint => address) public planetToOwner;
    address[] public playerIds;
    mapping (address => bool) public playerInitialized;

    function planetIsInitialized(uint _r) private view returns (bool) {
        return !(planets[_r].locationId == 0);
    }

    function planetIsOccupied(uint _r) private view returns (bool) {
        return !(planets[_r].owner == address(0)) || planets[_r].population == 0;
    }

    function getNPlanets() public view returns (uint) {
        return planetIds.length;
    }

    function getNPlayers() public view returns (uint) {
        return playerIds.length;
    }

    function updatePopulation(Planet storage planet) private returns (uint) {
        // logistic growth: in T time, population p1 increases to population
        // p2 = C / (1 + e^{-4 * growth * T / capacity} * ((capacity / p1) - 1))
        uint time_elapsed = now - planet.lastUpdated;

        // 1
        int128 one = ABDKMath64x64.fromUInt(1);

        // e^{-4 * growth * T / capacity}
        uint exponent_num_abs = 4 * planet.growth * time_elapsed;
        int128 exponent = ABDKMath64x64.neg(ABDKMath64x64.divu(exponent_num_abs, planet.capacity));
        int128 e_to_power_of_exponent = ABDKMath64x64.exp(exponent);

        // (capacity / p1) - 1
        int128 inv_pop_ratio = ABDKMath64x64.divu(planet.capacity, planet.population);
        int128 inv_pop_ratio_minus_one = ABDKMath64x64.sub(inv_pop_ratio, one);

        // denominator
        int128 exp_times_ratio = ABDKMath64x64.mul(e_to_power_of_exponent, inv_pop_ratio_minus_one);
        int128 denominator = ABDKMath64x64.add(one, exp_times_ratio);

        // numerator
        int128 numerator = ABDKMath64x64.fromUInt(planet.capacity);

        // new population
        uint64 new_pop = ABDKMath64x64.toUInt(ABDKMath64x64.div(numerator, denominator));
        planet.population = uint (new_pop);

        planet.lastUpdated = now;
    }

    function initializePlayer(
        uint[2] memory _a,
        uint[2][2] memory _b,
        uint[2] memory _c,
        uint[1] memory _input
    ) public {
        require(verifyInitProof(_a, _b, _c, _input));
        address player = msg.sender;
        uint loc = _input[0];
        require(!playerInitialized[player]); // player doesn't have account
        require (!planetIsInitialized(loc)); // loc was never owned

        playerIds.push(player);
        playerInitialized[player] = true;
        Planet memory homePlanet = Planet(loc, player, capacity, growth, 100, now, false, 0, 0, 1);
        planets[homePlanet.locationId] = homePlanet;
        planetIds.push(homePlanet.locationId);
        planetToOwner[homePlanet.locationId] = player;

        emit PlayerInitialized(player, loc);
    }

    function move_uninhabited(
        uint[2] memory _a,
        uint[2][2] memory _b,
        uint[2] memory _c,
        uint[4] memory _input
    ) public {
        uint[3] memory input012;
        for (uint i=0; i<input012.length; i++) {
            input012[i] = _input[i];
        }
        require(verifyMoveProof(_a, _b, _c, input012));
        address player = msg.sender;
        uint oldLoc = _input[0];
        uint newLoc = _input[1];
        uint maxDist = _input[2];
        uint shipsMoved = _input[3];

        require(playerInitialized[player]);
        require(planets[oldLoc].owner == player);

        // require(playerLocations[player] == oldLoc); // player at oldLoc
        require(!planetIsOccupied(newLoc)); // newLoc empty

        // playerLocations[player] = newLoc;

        emit PlayerMoved(player, oldLoc, newLoc, maxDist);
    }

}
