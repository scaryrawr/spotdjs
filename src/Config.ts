import fs = require("fs");
import path = require("path");

if (!process.env.HOME) {
  throw new Error("$HOME not set");
}

const CACHE_DIR = path.join(process.env.HOME, ".cache", "spotdjs");
const CONFIG_DIR = path.join(process.env.HOME, ".config", "spotdjs");

const CACHE_FILE = path.join(CACHE_DIR, "spotdjs.conf");
const CONFIG_FILE = path.join(CONFIG_DIR, "spotdjs.conf");

export type Credentials = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  port: number;
};

export type CachedCredentials = {
  authCode: string;
  refreshToken: string;
};

export class Config {
  config: Credentials;
  cache?: CachedCredentials;

  constructor() {
    this.config = JSON.parse(fs.readFileSync(CONFIG_FILE).toString());
    try {
      this.cache = JSON.parse(fs.readFileSync(CACHE_FILE).toString());
    } catch {}
  }

  storeAuth(requiredAuth: CachedCredentials) {
    this.cache = requiredAuth;

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR);
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache));
  }
}
