import * as bigInt from 'big-integer';
import { BigInteger } from 'big-integer';
import { Witness } from 'snarkjs';
import { Location, Planet, QueuedArrival } from '../@types/global/global';
import { PlanetType } from '../@types/global/enums';
import { address } from './CheckedTypeUtils';

// largely taken from websnark/tools/buildwitness.js, and typed by us (see src/@types/snarkjs)

interface DataViewWithOffset {
  dataView: DataView;
  offset: number;
}

function _writeUint32(h: DataViewWithOffset, val: number): void {
  h.dataView.setUint32(h.offset, val, true);
  h.offset += 4;
}

function _writeBigInt(h: DataViewWithOffset, bi: BigInteger): void {
  for (let i = 0; i < 8; i++) {
    const v = bigInt(bi)
      .shiftRight(i * 32)
      .and(0xffffffff)
      .toJSNumber();
    _writeUint32(h, v);
  }
}

function _calculateBuffLen(witness: Witness): number {
  let size = 0;

  // beta2, delta2
  size += witness.length * 32;

  return size;
}

export const witnessObjToBuffer: (
  witness: Witness
) => ArrayBuffer = witness => {
  const buffLen: number = _calculateBuffLen(witness);

  const buff = new ArrayBuffer(buffLen);

  const h: DataViewWithOffset = {
    dataView: new DataView(buff),
    offset: 0,
  };

  for (let i = 0; i < witness.length; i++) {
    _writeBigInt(h, witness[i]);
  }

  return buff;
};

export const getPopulationAtTime: (
  planet: Planet,
  atTimeMillis: number
) => number = (planet, atTimeMillis) => {
  if (planet.population === 0) {
    return 0;
  }
  if (planet.destroyed) {
    return planet.population;
  }
  const timeElapsed = atTimeMillis / 1000 - planet.lastUpdated;
  const denominator =
    Math.exp((-4 * planet.growth * timeElapsed) / planet.capacity) *
      (planet.capacity / planet.population - 1) +
    1;
  return planet.capacity / denominator;
};

export const getCurrentPopulation: (planet: Planet) => number = planet => {
  const atTimeMillis = Date.now();
  return getPopulationAtTime(planet, atTimeMillis);
};

export const getPlanetTypeForLocation: (
  location: Location
) => PlanetType = location => {
  const typeString = (location.hash as string).substring(8, 14);
  const typeBigInt = bigInt(typeString, 16);
  if (typeBigInt.lt(bigInt(8))) {
    return PlanetType.HyperGiant;
  } else if (typeBigInt.lt(bigInt(64))) {
    return PlanetType.SuperGiant;
  } else if (typeBigInt.lt(bigInt(512))) {
    return PlanetType.Giant;
  } else if (typeBigInt.lt(bigInt(2048))) {
    return PlanetType.SubGiant;
  } else if (typeBigInt.lt(bigInt(8192))) {
    return PlanetType.BlueStar;
  } else if (typeBigInt.lt(bigInt(32768))) {
    return PlanetType.YellowStar;
  } else if (typeBigInt.lt(bigInt(131072))) {
    return PlanetType.WhiteDwarf;
  } else if (typeBigInt.lt(bigInt(524288))) {
    return PlanetType.RedDwarf;
  } else if (typeBigInt.lt(bigInt(2097152))) {
    return PlanetType.BrownDwarf;
  } else if (typeBigInt.lt(bigInt(8388608))) {
    return PlanetType.BigAsteroid;
  } else if (typeBigInt.lt(bigInt(16777216))) {
    return PlanetType.LittleAsteroid;
  }
  return PlanetType.None;
};

export const hasOwner: (planet: Planet) => boolean = planet => {
  return planet.owner && planet.owner !== address('0'.repeat(40));
};

export const moveShipsDecay: (
  shipsMoved: number,
  hardiness: number,
  dist: number
) => number = (shipsMoved, hardiness, dist) => {
  const decayRatio = hardiness / (hardiness + dist);
  return decayRatio * shipsMoved;
};

export const arrive: (
  fromPlanet: Planet,
  toPlanet: Planet,
  arrival: QueuedArrival
) => void = (fromPlanet, toPlanet, arrival) => {
  // this function optimistically simulates an arrival
  // its logic must be identical to the logic on the blockchain

  // TO DO: this should never happen. but for some reason it does, so we need to check
  if (!fromPlanet || !toPlanet || !arrival) {
    return;
  }
  if (toPlanet.destroyed) {
    console.error('Planet was destroyed upon arrival!');
    return;
  }

  // update toPlanet population right before arrival
  toPlanet.population = getPopulationAtTime(
    toPlanet,
    arrival.arrivalTime * 1000
  );
  toPlanet.lastUpdated = arrival.arrivalTime;

  // perform arrival

  const shipsLanded = moveShipsDecay(
    arrival.shipsMoved,
    fromPlanet.hardiness,
    arrival.maxDist
  );

  if (!hasOwner(toPlanet)) {
    // colonizing new planet
    toPlanet.owner = fromPlanet.owner;
    toPlanet.population += Math.min(shipsLanded, toPlanet.capacity);
  } else if (toPlanet.owner === fromPlanet.owner) {
    // moving between my own planets
    toPlanet.population += shipsLanded;
  } else {
    // attacking enemy
    if (toPlanet.population > (shipsLanded * 100) / toPlanet.stalwartness) {
      // attack reduces target planet's garrison but doesn't conquer it
      toPlanet.population -= (shipsLanded * 100) / toPlanet.stalwartness;
    } else {
      // conquers planet
      toPlanet.owner = fromPlanet.owner;
      toPlanet.population =
        shipsLanded - (toPlanet.population * toPlanet.stalwartness) / 100;
    }
  }
};
