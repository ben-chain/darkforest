// web3 injected types, from metamask
import { PlanetType, MiningPatternType } from './enums';
import { WorldCoords } from '../../utils/Coordinates';

interface Web3ProviderObject {}

interface WindowEthereumObject {
  enable: () => void;
}

interface Web3Object {
  currentProvider: Web3ProviderObject;
}

declare global {
  interface Window {
    mimcHash: any;
    ethereum: WindowEthereumObject;
    web3: Web3Object;
    // from websnark's function injected into window
    genZKSnarkProof: (
      witness: ArrayBuffer,
      provingKey: ArrayBuffer
    ) => Promise<WebsnarkProof>;
  }
}

export interface WebsnarkProof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
}

export type LocationId = string & {
  __value__: never;
}; // this is expected to be 64 chars, lowercase hex. see src/utils/CheckedTypeUtils.ts for constructor

export type EthAddress = string & {
  __value__: never;
}; // this is expected to be 40 chars, lowercase hex. see src/utils/CheckedTypeUtils.ts for constructor

export interface Coordinates {
  // integers
  x: number;
  y: number;
}

export interface Location {
  coords: WorldCoords;
  hash: LocationId;
}

export interface Planet {
  owner: EthAddress | null;
  planetType: PlanetType;
  capacity: number;
  growth: number;
  stalwartness: number;
  hardiness: number;
  lastUpdated: number;
  locationId: LocationId;
  population: number;
  coordinatesRevealed: boolean;
  destroyed: boolean;
  x?: number;
  y?: number;
}

export interface MiningPattern {
  type: MiningPatternType;
  fromChunk: ChunkCoordinates;
  nextChunk: (prevChunk: ChunkCoordinates) => ChunkCoordinates;
}

export interface QueuedArrival {
  departureTime: number;
  arrivalTime: number;
  player: string;
  oldLoc: LocationId;
  newLoc: LocationId;
  maxDist: number;
  shipsMoved: number;
}

export interface ArrivalWithTimer {
  arrivalData: QueuedArrival;
  timer: ReturnType<typeof setTimeout>;
}

export interface PlanetMap {
  [planetId: string]: Planet;
}

export interface PlanetLocationMap {
  [planetId: string]: Location;
}

export interface PlanetArrivalMap {
  [planetId: string]: ArrivalWithTimer[];
}

export interface Player {
  address: EthAddress;
}

export class PlayerMap {
  [playerId: string]: Player;
}

export interface ChunkCoordinates {
  chunkX: number;
  chunkY: number;
}

export interface ExploredChunkData {
  id: {
    chunkX: number;
    chunkY: number;
  };
  planetLocations: Location[];
}

export type BoardData = Array<Array<ExploredChunkData | null | undefined>>;

export interface MinerWorkerMessage {
  chunkX: number;
  chunkY: number;
  planetRarity: number;
}
