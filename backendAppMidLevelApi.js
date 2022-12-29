import { fetchFromItsoft } from './fetchFromItsoft.js';
import { getDiff as getJsonDiff } from 'json-difference'
import { BackendAppError, BackendAppLowLevelApi } from './backendAppLowLevelApi.js';

export class BackendAppMidLevelApiError extends BackendAppError {
}

export class UnknownKeyTypeError extends BackendAppMidLevelApiError {
}

export class BackendAppMidLevelApi {
  lowLevelApi = new BackendAppLowLevelApi();


  async start() {
    this.lowLevelApi.start();
  }

  async stop() {
    await this.lowLevelApi.stop();
  }

  async kill() {
    await this.lowLevelApi.kill();
  }


  // utils 
  
  getWatchEntityKeyType(watchEntityKey) {
    if (watchEntityKey.length === 10 || watchEntityKey.length === 12) {
      return 'inn';
    } else if (watchEntityKey.length === 13) {
      return 'ogrn';
    } else if (watchEntityKey[0] === "#") {
      return 'internal';
    } else {
      throw new UnknownKeyTypeError();
    }
  }

  async getWatchEntityInternalIdx(telegramUserId, watchEntityKey) {
    const telegramUser = await this.lowLevelApi.getTelegramUser(telegramUserId);
    const watchEntityKeyType = this.getWatchEntityKeyType(watchEntityKey);
    let watchEntity;
    if (watchEntityKeyType === 'inn') {
      watchEntity = telegramUser.watchList.find(watchEntity => watchEntity.innKey === watchEntityKey);
    } else if (watchEntityKeyType === 'ogrn') {
      watchEntity = telegramUser.watchList.find(watchEntity => watchEntity.ogrnKey === watchEntityKey);
    } else if (watchEntityKeyType === 'internal') {
      const watchEntityInternalIdx = parseInt(watchEntityKey.slice(1)) - 1;
      watchEntity = telegramUser.watchList[watchEntityInternalIdx];
    }
    return watchEntity ? watchEntity.internalIdx : -1;
  }

  getIsJuridisticFromReference(reference) {
    const isJuridistic = !!reference['СвЮЛ'];
    return isJuridistic;
  }

  getInnKeyFromReference(reference) {
    const isJuridistic = this.getIsJuridisticFromReference(reference);
    let innKey;
    if (isJuridistic) {
      innKey = reference['СвЮЛ']['@attributes']['ИНН'];
    } else {
      innKey = reference['СвИП']['@attributes']['ИННФЛ'];
    }
    return innKey;
  }

  getOgrnKeyFromReference(reference) {
    const isJuridistic = this.getIsJuridisticFromReference(reference);
    let ogrnKey;
    if (isJuridistic) {
      ogrnKey = reference['СвЮЛ']['@attributes']['ОГРН'];
    } else {
      ogrnKey = reference['СвИП']['@attributes']['ОГРНФЛ'];
    }
    return ogrnKey;
  }

  // fetch wrapper

  async fetchEntitySnapshot(innOrOgrnKey) {
    const entity = await fetchFromItsoft(innOrOgrnKey);
    return entity;
  }

  // mid-level api

  async getWatchEntity(telegramUserId, watchEntityKey) {
    const watchEntityInternalIdx = await this.getWatchEntityInternalIdx(telegramUserId, watchEntityKey);     
    const isInListAlready = watchEntityInternalIdx >= 0;
    if (isInListAlready) {
      const watchEntity = this.lowLevelApi.getWatchEntity(telegramUserId, watchEntityInternalIdx);
      return watchEntity;
    } else {
      return false;
    }
  }
  
  async addToWatchList(telegramUserId, innOrOgrnKey) {
    const watchEntityInternalIdx = await this.getWatchEntityInternalIdx(telegramUserId, innOrOgrnKey);     
    const isInListAlready = watchEntityInternalIdx >= 0;
    if (!isInListAlready) {
      const reference = await this.fetchEntitySnapshot(innOrOgrnKey);
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
        innKey: this.getInnKeyFromReference(reference),
        ogrnKey: this.getOgrnKeyFromReference(reference),
        internalIdx: null, // to be set at addWatchEntity()
      }      
      await this.lowLevelApi.addWatchEntity(telegramUserId, newWatchEntity);
    }
    return !isInListAlready;
  }

  async removeFromWatchList(telegramUserId, watchEntityKey) {
    const watchEntityInternalIdx = await this.getWatchEntityInternalIdx(telegramUserId, watchEntityKey);     
    const isInListAlready = watchEntityInternalIdx >= 0;
    if (isInListAlready) {
      await this.lowLevelApi.deleteWatchEntity(telegramUserId, watchEntityInternalIdx);
    }
    return isInListAlready;
  }

  async updateCandidateInWatchList(telegramUserId, watchEntityKey) {
    const watchEntityInternalIdx = await this.getWatchEntityInternalIdx(telegramUserId, watchEntityKey);
    const isInListAlready = watchEntityInternalIdx >= 0;
    if (isInListAlready) {    
      const watchEntity = await this.lowLevelApi.getWatchEntity(telegramUserId, watchEntityInternalIdx);
      const innKey = watchEntity.innKey;
      const candidate = await this.fetchEntitySnapshot(innKey);
      watchEntity.candidate = candidate;
      watchEntity.candidateFetchedDate = new Date();
      const diff = getJsonDiff(watchEntity.reference, watchEntity.candidate, true);
      const hasDiff = diff.added.length > 0 || diff.removed.length > 0 || diff.edited.length > 0;
      const status = (hasDiff) ? 'differs' : 'same';
      watchEntity.diff = diff;
      watchEntity.hasDiff = hasDiff;
      watchEntity.status = status;
      await this.lowLevelApi.updateWatchEntity(telegramUserId, watchEntity);
      return status;
    } else {
      return false;
    }
  }

  async approveCandidateToReferenceInWatchList(telegramUserId, watchEntityKey) {
    const watchEntityInternalIdx = await this.getWatchEntityInternalIdx(telegramUserId, watchEntityKey);
    const isInListAlready = watchEntityInternalIdx >= 0;
    if (isInListAlready) {    
      const watchEntity = await this.lowLevelApi.getWatchEntity(telegramUserId, watchEntityInternalIdx);
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
        await this.lowLevelApi.updateWatchEntity(telegramUserId, watchEntity);
        return true;
      } else {
        return false;
      }
    } else {
      return null;
    }
  }

  async setIsFavorite(telegramUserId, watchEntityKey, isFavorite) {
    const watchEntityInternalIdx = await this.getWatchEntityInternalIdx(telegramUserId, watchEntityKey);
    const isInListAlready = watchEntityInternalIdx >= 0;
    if (isInListAlready) {    
      const watchEntity = await this.lowLevelApi.getWatchEntity(telegramUserId, watchEntityInternalIdx);
      const isChanged = watchEntity.isFavorite !== isFavorite;
      watchEntity.isFavorite = isFavorite;
      await this.lowLevelApi.updateWatchEntity(telegramUserId, watchEntity);
      return isChanged;
    } else {
      return null;
    }
  }

  // auto

  async updateAllCandidatesInWatchList(telegramUserId) {
    const telegramUser = await this.lowLevelApi.getTelegramUser(telegramUserId);
    const promises = telegramUser.watchList.map((watchEntity) => { 
      const watchEntityKey = '#' + (watchEntity.internalIdx + 1);
      return this.updateCandidateInWatchList(telegramUserId, watchEntityKey)
    });
    return await Promise.all(promises);
  }

}
