import * as fs from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { basicURLParse } from 'whatwg-url';
import { pathToFileURL } from 'url';

export class ImageCache {
  private readonly cacheDir: string;
  constructor() {
    this.cacheDir = path.join(tmpdir(), 'spotdjs');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir);
    }
  }

  async getImageLocation(imageUrl: string): Promise<string | undefined> {
    const uri = basicURLParse(imageUrl);
    if (!uri) {
      return imageUrl;
    }

    const imgName = `spotify-${uri.path[uri.path.length - 1]}.jpeg`;
    const imgPath = path.join(this.cacheDir, imgName);
    if (fs.existsSync(imgPath)) {
      return pathToFileURL(imgPath).toString();
    }

    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(imgPath, new Int8Array(buffer), { encoding: 'binary' });
    return pathToFileURL(imgPath).toString();

    return undefined;
  }
}
