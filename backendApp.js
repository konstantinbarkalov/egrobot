import { fetchFromItsoft } from './fetchFromItsoft.js';
import { EasyDb } from './easyDb.js';
import { getDiff as getJsonDiff } from 'json-difference'

export class BackendApp {
  easyDb = new EasyDb();
  watchIntervalSec = 60 * 60 * 12;
  watchTimer = null;
  async start() {
    const newDatum = { telegramUsers: {} };
    await this.easyDb.start(newDatum);
    this.restartWatch();
  }

  async stop() {
    await this.easyDb.stop();
    this.stopWatch();
  }

  async kill() {
    await this.easyDb.saveCopyToFile();
  }

  async fetchEntitySnapshot(inn) {
    const entity = await fetchFromItsoft(inn);
    return entity;
  }

  // low-level api

  
  async getAllTelegramUsers() {
    const telegramUsers = this.easyDb.datum.telegramUsers;
    return telegramUsers;
  }

  async getTelegramUser(telegramUserId) {
    const telegramUser = this.easyDb.datum.telegramUsers[telegramUserId];
    if (!telegramUser) {
      const newTelegramUser = { watchList: {} };
      await this.setTelegramUser(telegramUserId, newTelegramUser);
      return newTelegramUser;
    } else {
      return telegramUser;
    }
  }

  async setTelegramUser(telegramUserId, telegramUser) {
    if (telegramUser) {
      this.easyDb.datum.telegramUsers[telegramUserId.toString()] = telegramUser;
    } else {
      delete this.easyDb.datum.telegramUsers[telegramUserId.toString()];
    }
    await this.easyDb.saveToFile();
  }

  async getWatchEntity(telegramUserId, inn) {
    const telegramUser = await this.getTelegramUser(telegramUserId);
    const watchListEntity = telegramUser.watchList[inn.toString()];
    return watchListEntity;
  }

  async setWatchEntity(telegramUserId, inn, watchListEntity) {
    const telegramUser = await this.getTelegramUser(telegramUserId);
    if (watchListEntity) {
      telegramUser.watchList[inn.toString()] = watchListEntity;
    } else {
      delete telegramUser.watchList[inn.toString()];
    }
    await this.setTelegramUser(telegramUserId, telegramUser);
  }

  // high-level api
  
  async addToWatchList(telegramUserId, inn) {
    const as = await this.getWatchEntity(telegramUserId, inn);
    const isWasBefore = !!(await this.getWatchEntity(telegramUserId, inn));
    if (!isWasBefore) {
      const reference = await this.fetchEntitySnapshot(inn);
      const newWatchListEntity = {
        reference: reference,
        referenceFetchedDate: new Date(),
        candidate: null,
        candidateFetchedDate: null,
        referenceApprovedDate: null,
        diff: null,
        status: 'new',
      }
      await this.setWatchEntity(telegramUserId, inn, newWatchListEntity);
    }
    return !isWasBefore;
  }

  async removeFromWatchList(telegramUserId, inn) {
    const isWasBefore = !!(await this.getWatchEntity(telegramUserId, inn));
    if (isWasBefore) {
      await this.setWatchEntity(telegramUserId, inn, null);
    }
    return isWasBefore;
  }

  async updateCandidateInWatchList(telegramUserId, inn) {
    const watchListEntity = await this.getWatchEntity(telegramUserId, inn);
    const candidate = await this.fetchEntitySnapshot(inn);
    watchListEntity.candidate = candidate;
    watchListEntity.candidateFetchedDate = new Date();
    const diff = getJsonDiff(watchListEntity.reference, watchListEntity.candidate, true);
    const status = (diff.added.length === 0 && diff.edited.length === 0 && diff.removed.length === 0) ? 'same' : 'differs';
    watchListEntity.diff = diff;
    watchListEntity.status = status;
    await this.setWatchEntity(telegramUserId, inn, watchListEntity);
    return status;
  }

  async approveCandidateToReferenceInWatchList(telegramUserId, inn) {
    const watchListEntity = await this.getWatchEntity(telegramUserId, inn);
    const diff = watchListEntity.diff;
    if (diff.added.length !== 0 || diff.edited.length !== 0 || diff.removed.length !== 0) {
      watchListEntity.reference = watchListEntity.candidate;
      watchListEntity.referenceFetchedDate = watchListEntity.candidateFetchedDate;
      watchListEntity.candidate = null;
      watchListEntity.candidateFetchedDate = null;
      watchListEntity.referenceApprovedDate = new Date(),
      watchListEntity.diff = null,
      watchListEntity.status = 'approved',
      await this.setWatchEntity(telegramUserId, inn, watchListEntity);
      return true;
    } else {
      return false;
    }
  }

  async updateAllCandidatesInWatchList(telegramUserId) {
    const telegramUser = await this.getTelegramUser(telegramUserId);
    const promises = Object.keys(telegramUser.watchList).map((innKkey) => { return this.updateCandidateInWatchList(telegramUserId, innKkey)});
    return await Promise.all(promises);
  }

  async autoupdateAllCandidates() {
    const telegramUsers = await this.getAllTelegramUsers();
    for (const telegramUserId in telegramUsers) {
      //const telegramUser = telegramUsers[telegramUserId];
      const updateAllResults = await this.updateAllCandidatesInWatchList(telegramUserId);
      await this.autoupdateAllCandidatesHandler(telegramUserId, updateAllResults);
    }
  }
  async autoupdateAllCandidatesHandler(telegramUserId, updateAllResults) {
    // assign on init 
  }

  restartWatch() {
    if (this.watchTimer) {
      this.stopWatch();
    }
    this.autoupdateAllCandidates();
    this.autosaveTimer = setInterval(() => {
      this.autoupdateAllCandidates();
    }, 1000 * this.watchIntervalSec);
  }

  stopWatch() {
    clearInterval(this.watchTimer);
    this.autosaveTimer = null;
  }

}
