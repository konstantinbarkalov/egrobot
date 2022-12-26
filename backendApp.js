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

  async fetchEntitySnapshot(innKey) {
    const entity = await fetchFromItsoft(innKey);
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
      this.easyDb.datum.telegramUsers[telegramUserId] = telegramUser;
    } else {
      delete this.easyDb.datum.telegramUsers[telegramUserId];
    }
    await this.easyDb.saveToFile();
  }

  async getWatchEntity(telegramUserId, innKey) {
    const telegramUser = await this.getTelegramUser(telegramUserId);
    const watchEntity = telegramUser.watchList[innKey];
    return watchEntity;
  }

  async setWatchEntity(telegramUserId, innKey, watchEntity) {
    const telegramUser = await this.getTelegramUser(telegramUserId);
    if (watchEntity) {
      telegramUser.watchList[innKey] = watchEntity;
    } else {
      delete telegramUser.watchList[innKey];
    }
    await this.setTelegramUser(telegramUserId, telegramUser);
  }

  // high-level api
  
  async addToWatchList(telegramUserId, innKey) {
    const isWasBefore = !!(await this.getWatchEntity(telegramUserId, innKey));
    if (!isWasBefore) {
      const reference = await this.fetchEntitySnapshot(innKey);
      const newWatchEntity = {
        reference: reference,
        referenceFetchedDate: new Date(),
        candidate: null,
        candidateFetchedDate: null,
        referenceApprovedDate: null,
        diff: null,
        hasDiff: false,
        status: 'new',
        isFavorite: false,
      }
      await this.setWatchEntity(telegramUserId, innKey, newWatchEntity);
    }
    return !isWasBefore;
  }

  async removeFromWatchList(telegramUserId, innKey) {
    const isWasBefore = !!(await this.getWatchEntity(telegramUserId, innKey));
    if (isWasBefore) {
      await this.setWatchEntity(telegramUserId, innKey, null);
    }
    return isWasBefore;
  }

  async updateCandidateInWatchList(telegramUserId, innKey) {
    const watchEntity = await this.getWatchEntity(telegramUserId, innKey);
    const candidate = await this.fetchEntitySnapshot(innKey);
    watchEntity.candidate = candidate;
    watchEntity.candidateFetchedDate = new Date();
    const diff = getJsonDiff(watchEntity.reference, watchEntity.candidate, true);
    const hasDiff = diff.added.length > 0 || diff.removed.length > 0 || diff.edited.length > 0;
    const status = (hasDiff) ? 'differs' : 'same';
    watchEntity.diff = diff;
    watchEntity.hasDiff = hasDiff;
    watchEntity.status = status;
    await this.setWatchEntity(telegramUserId, innKey, watchEntity);
    return status;
  }

  async approveCandidateToReferenceInWatchList(telegramUserId, innKey) {
    const watchEntity = await this.getWatchEntity(telegramUserId, innKey);
    const hasDiff = watchEntity.hasDiff;
    if (hasDiff) {
      watchEntity.reference = watchEntity.candidate;
      watchEntity.referenceFetchedDate = watchEntity.candidateFetchedDate;
      watchEntity.candidate = null;
      watchEntity.candidateFetchedDate = null;
      watchEntity.referenceApprovedDate = new Date(),
      watchEntity.diff = null,
      watchEntity.hasDiff = false,
      watchEntity.status = 'approved',
      await this.setWatchEntity(telegramUserId, innKey, watchEntity);
      return true;
    } else {
      return false;
    }
  }

  async setIsFavorite(telegramUserId, innKey, isFavorite) {
    const watchEntity = await this.getWatchEntity(telegramUserId, innKey);
    watchEntity.isFavorite = isFavorite;
    await this.setWatchEntity(telegramUserId, innKey, watchEntity);
  }

  async updateAllCandidatesInWatchList(telegramUserId) {
    const telegramUser = await this.getTelegramUser(telegramUserId);
    const promises = Object.keys(telegramUser.watchList).map((innKey) => { return this.updateCandidateInWatchList(telegramUserId, innKey)});
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
