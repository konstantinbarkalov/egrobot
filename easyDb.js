
import fs from 'fs/promises';
import path from 'path';
import { getDateTimeSignature } from './utils.js';



export class EasyDb {
  path = './db/easyDb.json';
  autosaveIntervalSec = 60 * 60;
  autosaveTimer = null;
  datum = null;
  restartAutosave() {
    if (this.autosaveTimer) {
      this.stopAutosave();
    }
    this.saveToFile();
    this.autosaveTimer = setInterval(() => {
      this.saveToFile();
    }, 1000 * this.autosaveIntervalSec);
  }

  stopAutosave() {
    clearInterval(this.autosaveTimer);
    this.autosaveTimer = null;
  }
  
  async readFromFile() {
    const datumBuffer = await fs.readFile(this.path, {encoding: 'utf8'});
    this.datum = JSON.parse(datumBuffer);
  }

  async saveToFile() {
    const datumText = JSON.stringify(this.datum);
    await fs.writeFile(this.path, datumText, {encoding: 'utf8'});
  }
  
  async saveCopyToFile() {
    const parsedPath = path.parse(this.path);
    delete parsedPath.base;
    const dateSignature = getDateTimeSignature(new Date());
    parsedPath.name += '-copy-' + dateSignature;
    const copyPath = path.format(parsedPath);
    const datumText = JSON.stringify(this.datum);
    await fs.writeFile(copyPath, datumText, {encoding: 'utf8'});
  }
  
  
  
  async createNewDatum(newDatum) {
    this.datum = newDatum;
  }

  async readFromFileOrCreateNew(newDatum) {
    try {
      await this.readFromFile();
    } catch {
      this.createNewDatum(newDatum);
      await this.saveToFile();
    }
  }

  async start(newDatum) {
    await this.readFromFileOrCreateNew(newDatum);
    this.restartAutosave();
  }

  async stop() {
    await this.writeFile();
    this.stopAutosave();
  }
}

