import { BackendApp } from './backendApp.js';
import { getRevDateText } from './utils.js'
export class AbstractMessage {
}

export class TextMessage extends AbstractMessage {
  text = '';
  constructor(text) {
    super();
    this.text = text;
  }
  toString() {
    return this.text;
  }
}

export class MessageBot {
  backendApp = new BackendApp();

  async start() {
    this.backendApp.autoupdateAllCandidatesHandler = async (telegramUserId, updateAllResults) => { return await this.backendAutoupdateAllCandidatesHandler(this, telegramUserId, updateAllResults); }; 
    await this.backendApp.start();
  }

  async stop() {
    await this.backendApp.stop();
    backendApp.autoupdateAllCandidatesHandler = () => {}; 
  }

  async kill() {
    await this.backendApp.kill();
  }
  async getKeys(telegramUserId) {
    const telegramUserEntry = await this.backendApp.getTelegramUser(telegramUserId);
    const watchList = telegramUserEntry.watchList;
    return Object.keys(watchList);
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
    
  // wrappers for public chat-human-api

  async getWatchList(telegramUserId) {
    const telegramUser = await this.backendApp.getTelegramUser(telegramUserId);
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
        text += `${index + 1}. ${statusIconText}${favoriteIconText} ${smartName} <i>${status} ${candidateRevDateText}</i>\n`;
        if (watchEntity.hasDiff) {
          text += '</b>';  
        }
      });
    } else {
      text = 'Ваш список организаций пуст. Добавьте первую с помощью комманды /add и далее ИНН, Например: /add 7737117010'
    }
    return [ new TextMessage(text.trim()) ];
  }

  async getInfo(telegramUserId, innKey) {
    const telegramUser = await this.backendApp.getTelegramUser(telegramUserId);
    const watchList = telegramUser.watchList;
    
    const watchEntity =  watchList[innKey];
    if (watchEntity) {
      const statusIconText = this.getStatusIconText(watchEntity.status);
      const favoriteIconText = watchEntity.isFavorite ? ' ⭐' : ''; 
      const smartNameText = this.getSmartNameText(watchEntity); 
      const statusText = watchEntity.status === 'differs' ? 'ОБНАРУЖЕНЫ ИЗМЕНЕНИЯ' : watchEntity.status === 'same' ? 'изменений нет' : watchEntity.status === 'new' ? 'впервые на мониторинге' : watchEntity.status === 'approved' ? 'принята новая версия референса' : watchEntity.status;
      const candidateRevDateText = this.getChangesRevDateText(watchEntity);
      const referenceTimestampDateText = this.getSmartTimestampDateText(watchEntity);
      const url1 = '<a href="https://egrul.itsoft.ru/' + innKey + '">egrul.itsoft.ru</a>';
      const url2 = '<a href="https://www.rusprofile.ru/search?query=' + innKey + '">rusprofile.ru</a>';
      
      let text = `<b>${statusIconText}${favoriteIconText} ${smartNameText}</b>\nСтатус: ${statusText}\n`;
      
      text += `Дата выписки референс: ${referenceTimestampDateText}\n`;
      
      if (watchEntity.status === 'differs') {
        const candidateTimestampDateText = this.getSmartTimestampDateText(watchEntity);
        text += `Дата новой выписки: ${candidateTimestampDateText}\n`;
      }
      
      text += `Загружено: ${candidateRevDateText}\nСсылки: ${url1} | ${url2}`;
      return [ new TextMessage(text.trim()) ];
    } else {
      const text = `Организации по ключу ${innKey} не найдено`;
      return [ new TextMessage(text.trim()) ];        
    }
     
  }
 

  async getChanges(telegramUserId, innKey) {
    const telegramUser = await this.backendApp.getTelegramUser(telegramUserId);
    const watchList = telegramUser.watchList;
    
    const watchEntity =  watchList[innKey];
    if (watchEntity) {
      
      const diff = watchEntity.diff;
      const smartNameText = this.getSmartNameText(watchEntity); 
      const statusText = watchEntity.status === 'differs' ? 'ОБНАРУЖЕНЫ СЛЕДУЮЩИЕ ИЗМЕНЕНИЯ' : watchEntity.status === 'same' ? 'изменений нет' : watchEntity.status === 'new' ? 'впервые на мониторинге' : watchEntity.status === 'approved' ? 'принята новая версия референса' : watchEntity.status;
      const statusIconText = this.getStatusIconText(watchEntity.status);
      const favoriteIconText = watchEntity.isFavorite ? ' ⭐' : ''; 
      const candidateRevDateText = this.getChangesRevDateText(watchEntity);
      const diffText = this.getDiffText(diff);
        
      const text = `${statusIconText}${favoriteIconText} ${smartNameText}\n${statusText} ${candidateRevDateText}\n\n${diffText}`;
      return [ new TextMessage(text.trim()) ];
    } else {
      const text = `Организации по ключу ${innKey} не найдено`;
      return [ new TextMessage(text.trim()) ];        
    }
  }

 
  async addToWatchList(telegramUserId, innKey) {
    const isAdded = await this.backendApp.addToWatchList(telegramUserId, innKey);
    if (isAdded) {
      return [ new TextMessage(`🔵 Добавлен ключу ${innKey}`) ];
    } else {
      return [ new TextMessage(`ключу ${innKey} уже был добавлен в список до этого`) ];  
    }
  }

  async removeFromWatchList(telegramUserId, innKey) {
    const isRemoved = await this.backendApp.removeFromWatchList(telegramUserId, innKey);
    if (isRemoved) {
      return [ new TextMessage(`ключу ${innKey} убран из списка и больше не мониторится`) ];    
    } else {
      return [ new TextMessage(`ключу ${innKey} убрать из списка мониторинга не удалось, скорее всего его там и не было`) ];
    }
  }

  async updateCandidateInWatchList(telegramUserId, innKey) {
    const watchEntity = await this.backendApp.getWatchEntity(telegramUserId, innKey);
    if (watchEntity) {
    const status = await this.backendApp.updateCandidateInWatchList(telegramUserId, innKey);
    const statusIconText = this.getStatusIconText(watchEntity.status); 
        
      return [ new TextMessage(`Выписка по ключу ${innKey} обновлена. ${statusIconText} ${status === 'same' ? 'Изменений нет' : 'Изменения обнаружены'}`) ];
    } else {
      const text = `Организации по ключу ${innKey} не найдено`;
      return [ new TextMessage(text.trim()) ];        
    }
  }

  async approveCandidateToReferenceInWatchList(telegramUserId, innKey) {
    const watchEntity = await this.backendApp.getWatchEntity(telegramUserId, innKey);
    if (watchEntity) {
      const isApproved = await this.backendApp.approveCandidateToReferenceInWatchList(telegramUserId, innKey);
      if (isApproved) {
        return [ new TextMessage(`🟢 Измененная выписка по ключу ${innKey} теперь принята за новый референс`) ];
      } else {
        return [ new TextMessage(`⚪️ В выписке по ключу ${innKey} не было зафиксировано измененией, по-этому принятия нового референса не произошло`) ];
      }
    } else {
      const text = `🟤 Организации по ключу ${innKey} не найдено`;
      return [ new TextMessage(text.trim()) ];        
    }
  }

  async updateAllCandidatesInWatchList(telegramUserId) { // deprecared?
    const statuses = await this.backendApp.updateAllCandidatesInWatchList(telegramUserId);
    const isHasDiffers = statuses.includes('differs');
    let messageText = ''; 
    messageText += isHasDiffers ? '🔴 ' : '⚪️ ';
    messageText += 'Все выписки были загружены \n';
    messageText += isHasDiffers ? 'ИЗМЕНЕНИЯ ОБНАРУЖЕНЫ' : 'изменений нет';
  
    return [ new TextMessage(messageText.trim()) ];
  }
  
  async addToFavorite(telegramUserId, innKey) {
    const watchEntity = await this.backendApp.getWatchEntity(telegramUserId, innKey);
    if (watchEntity) {
    const status = await this.backendApp.setIsFavorite(telegramUserId, innKey, true);
      return [ new TextMessage(`⭐ Организация по ключу ${innKey} добавлена в избранное.`) ];
    } else {
      const text = `Организации по ключу ${innKey} не найдено`;
      return [ new TextMessage(text.trim()) ];        
    }
  }

  async removeFromFavorite(telegramUserId, innKey) {
    const watchEntity = await this.backendApp.getWatchEntity(telegramUserId, innKey);
    if (watchEntity) {
    const status = await this.backendApp.setIsFavorite(telegramUserId, innKey, true);
      return [ new TextMessage(`💫 Организация по ключу ${innKey} убрана из избранного.`) ];
    } else {
      const text = `Организации по ключу ${innKey} не найдено`;
      return [ new TextMessage(text.trim()) ];        
    }
  }

  // auto

  async backendAutoupdateAllCandidatesHandler(messageBot, telegramUserId, updateAllResults) {
    const isHasDiffers = updateAllResults.includes('differs');
    let messageText = ''; 
    messageText += 'Только что были автоматически загружены все выписки \n';
    messageText += isHasDiffers ? '🔴 ' : '⚪️ ';
    messageText += isHasDiffers ? 'ИЗМЕНЕНИЯ ОБНАРУЖЕНЫ' : 'изменений нет';
    const messages = [ new TextMessage(messageText.trim()) ];
    await messageBot.autoupdateAllCandidatesHandler(telegramUserId, messages);
    ;
  } 

  async autoupdateAllCandidatesHandler(telegramUserId, messages) {
    // assign on init 
  }
}