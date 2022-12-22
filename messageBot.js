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
  constructor() {
  }
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
  getSmartNameText(watchListEntity) {
    const isJuridistic = !!watchListEntity.reference['СвЮЛ']; 
    let shortName;
    let inn;
    if (isJuridistic) {
      shortName = watchListEntity.reference['СвЮЛ']['СвНаимЮЛ']['СвНаимЮЛСокр']['@attributes']['НаимСокр'];
      inn = watchListEntity.reference['СвЮЛ']['@attributes']['ИНН'];
    } else {
      shortName = 'ИП ' + watchListEntity.reference['СвИП']['СвФЛ']['ФИОРус']['@attributes']['Фамилия'];
      inn = watchListEntity.reference['СвИП']['@attributes']['ИННФЛ'];
    }
    const text = `${shortName} ${inn}`;
    return text;
  }
  
  getChangesRevDateText(watchListEntity) {
    if (watchListEntity.candidateFetchedDate) {
      const revDateText = getRevDateText(new Date(watchListEntity.candidateFetchedDate));
      return revDateText;
    } else {
      const revDateText = getRevDateText(new Date(watchListEntity.referenceFetchedDate));
      return revDateText;
    }
  }
  
  getDiffText(diff) {
    let text = '';
    if (diff) {
      diff.removed.forEach(element => {
        text += `Удалено: ${element[0]}  \n`;
        text += `Было: ${element[1]}  \n`;
        text += `\n`;
      });
      diff.added.forEach(element => {
        text += `Добавлено: ${element[0]}  \n`;
        text += `Стало: ${element[1]}  \n`;
        text += `\n`;
      });
      diff.edited.forEach(element => {
        text += `Изменено: ${element[0]}  \n`;
        text += `Было: ${element[1]}  \n`;
        text += `Стало: ${element[2]}  \n`;      
        text += `\n`;
      });
    }
    return text;
  }


  // wrappers for public chat-human-api

  async addToWatchList(telegramUserId, innKey) {
    const isAdded = await this.backendApp.addToWatchList(telegramUserId, innKey);
    if (isAdded) {
      return [ new TextMessage(`Добавлен инн ${innKey}`) ];
    } else {
      return [ new TextMessage(`Инн ${innKey} уже был добавлен в список до этого`) ];  
    }
  }

  async removeFromWatchList(telegramUserId, innKey) {
    const isRemoved = await this.backendApp.removeFromWatchList(telegramUserId, innKey);
    if (isRemoved) {
      return [ new TextMessage(`Инн ${innKey} убран из списка и больше не мониторится`) ];    
    } else {
      return [ new TextMessage(`Инн ${innKey} убрать из списка мониторинга не удалось, скорее всего его там и не было`) ];
    }
  }

  async updateCandidateInWatchList(telegramUserId, innKey) {
    const status = await this.backendApp.updateCandidateInWatchList(telegramUserId, innKey);
    return [ new TextMessage(`Выписка по инн ${innKey} обновлена. ${status === 'same' ? 'Изменений нет' : 'Изменения обнаружены'}`) ];
  }

  async approveCandidateToReferenceInWatchList(telegramUserId, innKey) {
    const isApproved = await this.backendApp.approveCandidateToReferenceInWatchList(telegramUserId, innKey);
    if (isApproved) {
      return [ new TextMessage(`Измененная выписка по Инн ${innKey} теперь принята за новый референс`) ];
    } else {
      return [ new TextMessage(`В выписке по Инн ${innKey} не было зафиксировано измененией, по-этому принятия нового референса не произошло`) ];
    }
  }

  async updateAllCandidatesInWatchList(telegramUserId) {
    const statuses = await this.backendApp.updateAllCandidatesInWatchList(telegramUserId);
    const isAllSame = !statuses.includes('differs');
    return [ new TextMessage(`Все выписки обновлены. ${isAllSame ? 'Изменений нет нигде' : 'Изменения обнаружены'}`) ];
  }
  
  async getWatchList(telegramUserId) {
    const telegramUser = await this.backendApp.getTelegramUser(telegramUserId);
    const watchList = telegramUser.watchList;
    let text = '';
    Object.values(watchList).forEach((watchListEntity, index) => {
      const smartName = this.getSmartNameText(watchListEntity); 
      const status = watchListEntity.status === 'differs' ? 'ИЗМЕНИЯ ОБНАРУЖЕНЫ' : watchListEntity.status === 'same' ? 'нет изм.' : watchListEntity.status === 'new' ? 'впервые' : watchListEntity.status === 'approved' ? 'прин.' : watchListEntity.status;
      const candidateRevDateText = this.getChangesRevDateText(watchListEntity);
      text += `${index + 1}. ${smartName} ${status} ${candidateRevDateText}\n`;
    });
    return [ new TextMessage(text.trim()) ];
  }
  

  async getChanges(telegramUserId, innKey) {
    const telegramUser = await this.backendApp.getTelegramUser(telegramUserId);
    const watchList = telegramUser.watchList;
    
    const watchListEntity =  watchList[innKey];
    const diff = watchListEntity.diff;
    const smartName = this.getSmartNameText(watchListEntity); 
    const status = watchListEntity.status === 'differs' ? 'ОБНАРУЖЕНЫ СЛЕДУЮЩИЕ ИЗМЕНЕНИЯ' : watchListEntity.status === 'same' ? 'изменений нет' : watchListEntity.status === 'new' ? 'впервые на мониторинге' : watchListEntity.status === 'approved' ? 'принята новая версия референса' : watchListEntity.status;
    const candidateRevDateText = this.getChangesRevDateText(watchListEntity);
    const diffText = this.getDiffText(diff);
      
    let text = `${smartName}\n${status}  ${candidateRevDateText}\n${diffText}`;
    return [ new TextMessage(text.trim()) ];
  }

  // auto

  async backendAutoupdateAllCandidatesHandler(messageBot, telegramUserId, updateAllResults) {
    let messageText = ''; 
    messageText += 'Были автоматически загружены все выписки \n';
    messageText += updateAllResults.includes('differs') ? 'ИЗМЕНЕНИЯ ОБНАРУЖЕНЫ' : 'изменений нет';
    const messages = [ new TextMessage(messageText.trim()) ];
    await messageBot.autoupdateAllCandidatesHandler(telegramUserId, messages);
    ;
  } 

  async autoupdateAllCandidatesHandler(telegramUserId, messages) {
    // assign on init 
  }
}