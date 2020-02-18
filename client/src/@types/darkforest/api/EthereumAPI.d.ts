import { BigNumber } from 'ethers/utils';

// TODO write these types
export type ContractCallArgs = Array<any>;

export type InitializePlayerArgs = ContractCallArgs;

export type MoveArgs = ContractCallArgs;

export interface ContractConstants {
  xSize: number;
  ySize: number;
  planetRarity: number;
  defaultCapacity: number[];
  defaultGrowth: number[];
  defaultHardiness: number[];
  defaultStalwartness: number[];
}

export interface RawArrivalData
  extends Array<string | boolean | number | BigNumber> {
  0: BigNumber;
  1: BigNumber;
  2: string;
  3: BigNumber;
  4: BigNumber;
  5: BigNumber;
  6: BigNumber;

  departureTime: BigNumber;
  arrivalTime: BigNumber;
  player: string;
  oldLoc: BigNumber;
  newLoc: BigNumber;
  maxDist: BigNumber;
  shipsMoved: BigNumber;
}

export interface RawPlanetData
  extends Array<string | boolean | number | BigNumber> {
  0: BigNumber;
  1: string;
  2: number;
  3: BigNumber;
  4: BigNumber;
  5: BigNumber;
  6: BigNumber;
  7: BigNumber;
  8: BigNumber;
  9: boolean;
  10: BigNumber;
  11: BigNumber;

  locationId: BigNumber;
  owner: string;
  planetType: number;
  capacity: BigNumber;
  growth: BigNumber;
  hardiness: BigNumber;
  stalwartness: BigNumber;
  population: BigNumber;
  lastUpdated: BigNumber;
  coordinatesRevealed: boolean;
  x: BigNumber; // if coordinatesRevealed
  y: BigNumber; // if coordinatesRevealed
}

export interface RawPlanetMetadata
  extends Array<string | boolean | number | BigNumber> {
  0: BigNumber;
  1: string;
  2: number;
  3: boolean;
  4: any;
  5: BigNumber;

  locationId: BigNumber;
  owner: string;
  version: number;
  destroyed: boolean;
  pending: any;
  pendingCount: BigNumber;
}

/*export interface InitializePlayerArgs extends Array<any> {
  0: [string, string];
  1: [[string, string], [string, string]];
  2: [string, string];
  3: [string];
}

export interface MoveArgs extends Array<any> {
  0: [string, string];
  1: [[string, string], [string, string]];
  2: [string, string];
  3: [string, string, string, string]; // oldLoc, newLoc, distMax, shipsMoved
}*/
