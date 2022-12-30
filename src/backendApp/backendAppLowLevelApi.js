import { EasyDb } from './../easyDb.js';
export class BackendAppError extends Error {

}
export class BackendAppLowLevelApiError extends BackendAppError {

}

export class EntityExistanceError extends BackendAppLowLevelApiError{

}


export class BackendAppLowLevelApi {
  easyDb = new EasyDb();
  async start() {
    const newDatum = { telegramUsers: {} };
    await this.easyDb.start(newDatum);
  }

  async stop() {
    await this.easyDb.stop();
  }

  async kill() {
    this.easyDb.saveCopyToFileSync();
  }

  // low-level api
  
  async getAllTelegramUsers() {
    const telegramUsers = this.easyDb.datum.telegramUsers;
    return telegramUsers;
  }

  async getTelegramUser(telegramUserId) {
    const telegramUser = this.easyDb.datum.telegramUsers[telegramUserId];
    if (!telegramUser) {
      const newTelegramUser = { watchList: [] };
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

  
  async getWatchEntity(telegramUserId, internalIdx) {
    const telegramUser = await this.getTelegramUser(telegramUserId);
    const watchEntity = telegramUser.watchList[internalIdx];
    return watchEntity;
  }

  async updateWatchEntity(telegramUserId, watchEntity) {
    const watchEntityInList = await this.getWatchEntity(telegramUserId, watchEntity.internalIdx);
    if (watchEntity && watchEntityInList
      && watchEntity.innKey === watchEntityInList.innKey
      && watchEntity.ogrnKey === watchEntityInList.ogrnKey
      && watchEntity.internalIdx === watchEntityInList.internalIdx) {
      const telegramUser = await this.getTelegramUser(telegramUserId);
      if (telegramUser.watchList.length > watchEntity.internalIdx) {
        telegramUser.watchList[watchEntity.internalIdx] = watchEntity;
      } else {
        throw new EntityExistanceError();
      }
      telegramUser.watchList[watchEntity.internalIdx] = watchEntity;
      await this.setTelegramUser(telegramUserId, telegramUser);
    } else {
      throw new EntityExistanceError();
    }
  }

  async addWatchEntity(telegramUserId, watchEntity) {
    const isInListAlready = !!await this.getWatchEntity(telegramUserId, watchEntity.internalIdx);
    if (watchEntity && !isInListAlready) {
      let newInternalIdx;
      const telegramUser = await this.getTelegramUser(telegramUserId);
      newInternalIdx = telegramUser.watchList.length;
      watchEntity.internalIdx = newInternalIdx;
      telegramUser.watchList[newInternalIdx] = watchEntity;
      await this.setTelegramUser(telegramUserId, telegramUser);
      return newInternalIdx;
    } else {
      throw new EntityExistanceError();
    }

  }

  async deleteWatchEntity(telegramUserId, internalIdx) {
    const telegramUser = await this.getTelegramUser(telegramUserId);
    const watchEntity = await this.getWatchEntity(telegramUserId, watchEntity.internalIdx);
    if (watchEntity) {
      delete telegramUser.watchList[internalIdx];
      telegramUser.watchList.forEach((watchEntity, idx) => watchEntity.internalIdx = idx);
    } else {
      throw new EntityExistanceError();
    }
    await this.setTelegramUser(telegramUserId, telegramUser);
  }

  

}
