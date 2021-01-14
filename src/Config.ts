import * as fs from 'fs';
import * as path from 'path';
import { getPassword, setPassword } from 'keytar';

if (!process.env.HOME) {
  throw new Error('$HOME not set');
}

const SERVICE_NAME = 'spotdjs';
const REFRESH_TOKEN = 'refresh_token';
const CONFIG_DIR = path.join(process.env.HOME, '.config', 'spotdjs');
const CONFIG_FILE = path.join(CONFIG_DIR, 'spotdjs.conf');

export type Credentials = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  port: number;
};

export type CachedCredentials = {
  refreshToken: string;
};

export class Config {
  private credentials: Credentials;
  private cachedCredentials?: CachedCredentials;

  constructor() {
    this.credentials = JSON.parse(fs.readFileSync(CONFIG_FILE).toString());
  }

  async cache(): Promise<CachedCredentials | undefined> {
    if (!this.cachedCredentials) {
      const refreshToken = await getPassword(SERVICE_NAME, REFRESH_TOKEN);
      if (refreshToken) {
        this.cachedCredentials = {
          refreshToken,
        };
      }
    }

    return this.cachedCredentials;
  }

  async config(): Promise<Credentials> {
    if (!this.credentials.clientSecret) {
      let password = await getPassword(SERVICE_NAME, this.credentials.clientId);
      if (!password) {
        throw new Error(
          `Please store the password using secret-tool: secret-tool store --label='spotdjs/${this.credentials.clientId}' service spotdjs account ${this.credentials.clientId}`
        );
      }

      this.credentials.clientSecret = password;
    }

    return this.credentials;
  }

  async storeAuth(requiredAuth: CachedCredentials): Promise<void> {
    this.cachedCredentials = requiredAuth;
    await setPassword(SERVICE_NAME, REFRESH_TOKEN, requiredAuth.refreshToken);
  }
}
