import { BackendAppMidLevelApi } from './backendAppMidLevelApi.js';
import { getRevDateText } from './utils.js'

export class TextMessage {
  telegramUserId = null;
  text = null;
  isHtml = true;
  isDisablePreview = true;
  isSilent = false;
  constructor(telegramUserId, text) {
    this.telegramUserId = telegramUserId;
    this.text = text;
  }
}

export class BackendAppHighLevelApi {
  midLevelApi = new BackendAppMidLevelApi();

  async start() {
    await this.midLevelApi.start();
  }

  async stop() {
    await this.midLevelApi.stop();
  }

  async kill() {
    await this.midLevelApi.kill();
  }
  
  // utils

  async parseWildcard(telegramUserId, params) {
    const wildcard = params[0];
    const telegramUserEntry = await this.midLevelApi.lowLevelApi.getTelegramUser(telegramUserId);
    const watchList = telegramUserEntry.watchList;
    let filteredWatchList;
    if (wildcard === '*' ) {
      filteredWatchList = watchList;
    } else if (wildcard === '+') {
      filteredWatchList = watchList.filter((watchEntity) => {
        return watchEntity.isFavorite;
      });
    } else if (wildcard === '!') {
      filteredWatchList = watchList.filter((watchEntity) => {
        return watchEntity.hasDiff;
      });
    } else {
      return params;
    }
    return filteredWatchList.map((watchEntity) => '#' + (watchEntity.internalIdx + 1))
  }

  getSmartShortNameText(watchEntity) {
    const isJuridistic = !!watchEntity.reference['СвЮЛ']; 
    let shortNameText;
    if (isJuridistic) {
      if (watchEntity.reference['СвЮЛ']['СвНаимЮЛ']['СвНаимЮЛСокр']) {
        shortNameText = watchEntity.reference['СвЮЛ']['СвНаимЮЛ']['СвНаимЮЛСокр']['@attributes']['НаимСокр'];

      } else {
        shortNameText = watchEntity.reference['СвЮЛ']['СвНаимЮЛ']['@attributes']['НаимЮЛСокр'];

      }
    } else {
      shortNameText = 'ИП ' + watchEntity.reference['СвИП']['СвФЛ']['ФИОРус']['@attributes']['Фамилия'];
    }
    return shortNameText;
  }

  getSmartInnText(watchEntity) {
    const isJuridistic = !!watchEntity.reference['СвЮЛ']; 
    let innText;
    if (isJuridistic) {      
      innText = watchEntity.reference['СвЮЛ']['@attributes']['ИНН'];
    } else {
      innText = watchEntity.reference['СвИП']['@attributes']['ИННФЛ'];
    }
    return innText;
  }

  getSmartNameText(watchEntity) {
    let shortNameText = this.getSmartShortNameText(watchEntity);
    let innText = this.getSmartInnText(watchEntity);
    const text = `${shortNameText} ИНН: ${innText}`;
    return text;
  }

  getSmartTimestampDateText(watchEntity) {
    const dateText = watchEntity.reference['@attributes']['ДатаВыг'];
    return dateText;
  } 

  getChangesRevDateText(watchEntity) {
    if (watchEntity.candidateFetchedDate) {
      const revDateText = getRevDateText(new Date(watchEntity.candidateFetchedDate));
      return revDateText;
    } else {
      const revDateText = getRevDateText(new Date(watchEntity.referenceFetchedDate));
      return revDateText;
    }
  }
  
  getDiffText(diff) {
    let text = '';
    if (diff) {
      diff.removed.forEach(element => {
        text += `<b>УДЛ:</b> ${element[0].replace('@attributes.', '<b>').replaceAll('.', ' • ')}</b>  \n`;
        text += `➖ ${element[1]}  \n`;
        text += `\n`;
      });
      diff.added.forEach(element => {
        text += `<b>ДОБ:</b> ${element[0].replace('@attributes.', '<b>').replaceAll('.', ' • ')}</b>  \n`;
        text += `➕ ${element[1]}  \n`;
        text += `\n`;
      });
      diff.edited.forEach(element => {
        text += `<b>ИЗМ:</b> ${element[0].replace('@attributes.', '<b>').replaceAll('.', ' • ')}</b>  \n`;
        text += `➖ ${element[1]}  \n`;
        text += `➕ ${element[2]}  \n`;      
        text += `\n`;
      });
    }
    return text;
  }

  getStatusIconText(status) {
    switch (status) {
      case 'same':
        return '⚪️';        
    
      case 'differs':
        return '🔴';

      case 'new':
        return '🔵';

      case 'approved':
        return '🟢';

      default:
        return '🟣';
    }
  }
      
  // high-level api

  async getWatchList(telegramUserId) {
    const telegramUser = await this.midLevelApi.lowLevelApi.getTelegramUser(telegramUserId);
    const watchList = telegramUser.watchList;
    let text = '';
    const watchListValues = Object.values(watchList);
    if (watchListValues.length > 0 ) {
      watchListValues.forEach((watchEntity, index) => {
        const smartName = this.getSmartNameText(watchEntity);
        const status = watchEntity.status === 'differs' ? 'ИЗМЕНИЯ ОБНАРУЖЕНЫ' : watchEntity.status === 'same' ? 'нет изм.' : watchEntity.status === 'new' ? 'впервые' : watchEntity.status === 'approved' ? 'прин.' : watchEntity.status;
        const statusIconText = this.getStatusIconText(watchEntity.status); 
        const favoriteIconText = watchEntity.isFavorite ? ' ⭐' : ''; 
        const candidateRevDateText = this.getChangesRevDateText(watchEntity);
        if (watchEntity.hasDiff) {
          text += '<b>';  
        }
        text += `${index + 1}. ${statusIconText}${favoriteIconText} ${smartName}\n`;
        text += `     2022-12-14 (<i>${status} ${candidateRevDateText}</i>)\n\n`;
        if (watchEntity.hasDiff) {
          text += '</b>';  
        }
      });
    } else {
      text = 'Ваш список организаций пуст. Добавьте первую с помощью комманды /add и далее ИНН, Например: /add 7737117010'
    }
    return [ new TextMessage(telegramUserId, text.trim()) ];
  }

  async getInfo(telegramUserId, watchEntityKey) {
    const watchEntity = await this.midLevelApi.getWatchEntity(telegramUserId, watchEntityKey);
    if (watchEntity) {
      const statusIconText = this.getStatusIconText(watchEntity.status);
      const favoriteIconText = watchEntity.isFavorite ? ' ⭐' : ''; 
      const smartNameText = this.getSmartNameText(watchEntity); 
      const statusText = watchEntity.status === 'differs' ? 'ОБНАРУЖЕНЫ ИЗМЕНЕНИЯ' : watchEntity.status === 'same' ? 'изменений нет' : watchEntity.status === 'new' ? 'впервые на мониторинге' : watchEntity.status === 'approved' ? 'принята новая версия референса' : watchEntity.status;
      const candidateRevDateText = this.getChangesRevDateText(watchEntity);
      const referenceTimestampDateText = this.getSmartTimestampDateText(watchEntity);
      const inn = this.getSmartInnText(watchEntity);
      const url1 = '<a href="https://egrul.itsoft.ru/' + inn + '">egrul.itsoft.ru</a>';
      const url2 = '<a href="https://www.rusprofile.ru/search?query=' + inn + '">rusprofile.ru</a>';
      
      let text = `<b>${statusIconText}${favoriteIconText} ${smartNameText}</b>\nСтатус: ${statusText}\n`;
      
      text += `Дата выписки референс: ${referenceTimestampDateText}\n`;
      
      if (watchEntity.status === 'differs') {
        const candidateTimestampDateText = this.getSmartTimestampDateText(watchEntity);
        text += `Дата новой выписки: ${candidateTimestampDateText}\n`;
      }
      
      text += `Загружено: ${candidateRevDateText}\nСсылки: ${url1} | ${url2}`;
      return [ new TextMessage(telegramUserId, text.trim()) ];
    } else {
      const text = `Организации по ключу ${watchEntityKey} не найдено`;
      return [ new TextMessage(telegramUserId, text.trim()) ];        
    }
     
  }

  async getChanges(telegramUserId, watchEntityKey) {
    const watchEntity = await this.midLevelApi.getWatchEntity(telegramUserId, watchEntityKey);
    if (watchEntity) {
      const diff = watchEntity.diff;
      const smartNameText = this.getSmartNameText(watchEntity); 
      const statusText = watchEntity.status === 'differs' ? 'ОБНАРУЖЕНЫ СЛЕДУЮЩИЕ ИЗМЕНЕНИЯ' : watchEntity.status === 'same' ? 'изменений нет' : watchEntity.status === 'new' ? 'впервые на мониторинге' : watchEntity.status === 'approved' ? 'принята новая версия референса' : watchEntity.status;
      const statusIconText = this.getStatusIconText(watchEntity.status);
      const favoriteIconText = watchEntity.isFavorite ? ' ⭐' : ''; 
      const candidateRevDateText = this.getChangesRevDateText(watchEntity);
      const diffText = this.getDiffText(diff);
        
      const text = `${statusIconText}${favoriteIconText} ${smartNameText}\n${statusText} ${candidateRevDateText}\n\n${diffText}`;
      return [ new TextMessage(telegramUserId, text.trim()) ];
    } else {
      const text = `Организации по ключу ${watchEntityKey} не найдено`;
      return [ new TextMessage(telegramUserId, text.trim()) ];        
    }
  }
 
  async addToWatchList(telegramUserId, watchEntityKey) {
    const isAdded = await this.midLevelApi.addToWatchList(telegramUserId, watchEntityKey);
    if (isAdded) {
      return [ new TextMessage(telegramUserId, `🔵 Добавлен ключ ${watchEntityKey}`) ];
    } else {
      return [ new TextMessage(telegramUserId, `ключ ${watchEntityKey} уже был добавлен в список до этого`) ];  
    }
  }

  async removeFromWatchList(telegramUserId, watchEntityKey) {
    const isRemoved = await this.midLevelApi.removeFromWatchList(telegramUserId, watchEntityKey);
    if (isRemoved) {
      return [ new TextMessage(telegramUserId, `Организация по ключу ${watchEntityKey} убрана из списка и больше не мониторится`) ];    
    } else {
      return [ new TextMessage(telegramUserId, `Организацию по ключу ${watchEntityKey} убрать из списка мониторинга не удалось, скорее всего ее там и не было`) ];
    }
  }

  async updateCandidateInWatchList(telegramUserId, watchEntityKey) {
    const status = await this.midLevelApi.updateCandidateInWatchList(telegramUserId, watchEntityKey);
    if (status) {
    const statusIconText = this.getStatusIconText(status);         
      return [ new TextMessage(telegramUserId, `Выписка по ключу ${watchEntityKey} обновлена. ${statusIconText} ${status === 'same' ? 'Изменений нет' : 'Изменения обнаружены'}`) ];
    } else {
      const text = `Организации по ключу ${watchEntityKey} не найдено`;
      return [ new TextMessage(telegramUserId, text.trim()) ];        
    }
  }

  async approveCandidateToReferenceInWatchList(telegramUserId, watchEntityKey) {
    const isApproved = await this.midLevelApi.approveCandidateToReferenceInWatchList(telegramUserId, watchEntityKey);
    if (isApproved === true) {
      return [ new TextMessage(telegramUserId, `🟢 Измененная выписка по ключу ${watchEntityKey} теперь принята за новый референс`) ];
    } else if (isApproved === false) {
      return [ new TextMessage(telegramUserId, `⚪️ В выписке по ключу ${watchEntityKey} не было зафиксировано измененией, по-этому принятия нового референса не произошло`) ];
    } else {
      return [ new TextMessage(telegramUserId, `🟤 Организации по ключу ${watchEntityKey} не найдено`) ];        
    }
  }
  
  async addToFavorite(telegramUserId, watchEntityKey) {
    const status = await this.midLevelApi.setIsFavorite(telegramUserId, watchEntityKey, true);
    if (status) {
      return [ new TextMessage(telegramUserId, `⭐ Организация по ключу ${watchEntityKey} добавлена в избранное.`) ];
    } else {
      const text = `Организации по ключу ${watchEntityKey} не найдено`;
      return [ new TextMessage(telegramUserId, text.trim()) ];        
    }
  }

  async removeFromFavorite(telegramUserId, watchEntityKey) {
    const status = await this.midLevelApi.setIsFavorite(telegramUserId, watchEntityKey, false);
    if (status) {
      return [ new TextMessage(telegramUserId, `💫 Организация по ключу ${watchEntityKey} убрана из избранного.`) ];
    } else {
      const text = `Организации по ключу ${watchEntityKey} не найдено`;
      return [ new TextMessage(telegramUserId, text.trim()) ];        
    }
  }

  // auto

  async autoupdateAllCandidatesInWatchList(telegramUserId) {
    const statuses = await this.midLevelApi.updateAllCandidatesInWatchList(telegramUserId);
    const status = statuses.includes('differs') ? 'differs' : 'same' ;
    const statusIconText = this.getStatusIconText(status);
    let messageText = ''; 
    messageText += 'Только что были автоматически загружены все выписки \n';
    messageText += statusIconText;
    messageText += (status === 'differs') ? 'ИЗМЕНЕНИЯ ОБНАРУЖЕНЫ' : 'изменений нет';
    const messages = [ new TextMessage(telegramUserId, messageText.trim()) ];
    return messages;
  }
  
}