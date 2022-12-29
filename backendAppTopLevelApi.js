import { BackendAppHighLevelApi, TextMessage } from './backendAppHighLevelApi.js';
import fs from 'fs';
const externalHelpText = fs.readFileSync('./help.txt','utf8');

export class BackendAppTopLevelApi {
  highLevelApi = new BackendAppHighLevelApi();
  welcomeText = externalHelpText;
  helpText = externalHelpText;


  async start() {  
    await this.highLevelApi.start();
  }
  
  async stop() {
    await this.highLevelApi.stop();
  }

  async kill() {
    await this.highLevelApi.kill();
  }

  //utils
  
  async wrapToMultientity(telegramUserId, params, notFoundText, fn) {
    
    if (params.length > 0) {
      params = await this.highLevelApi.parseWildcard(telegramUserId, params);
      const allReplyMessages = await Promise.all(params.map((watchEntityKey) => fn(telegramUserId, watchEntityKey)));
      return allReplyMessages.flat();
    } else {
      return [new TextMessage(telegramUserId, notFoundText)];
    }
  }

  // top-level api

  async list(telegramUserId) {
    // no multientry
    const replyMessages = await this.highLevelApi.getWatchList(telegramUserId);
    return replyMessages;
  };

  async info(telegramUserId, params) {
    return await this.wrapToMultientity(telegramUserId, params,
      'Укажите ИНН или * для информации о предприятии',
      (telegramUserId, watchEntityKey) => this.highLevelApi.getInfo(telegramUserId, watchEntityKey));    
  };

  async diff(telegramUserId, params) {
    return await this.wrapToMultientity(telegramUserId, params,
      'Укажите ИНН или *',
      (telegramUserId, watchEntityKey) => this.highLevelApi.getChanges(telegramUserId, watchEntityKey));    
  };
  
  async add(telegramUserId, params) {
    return await this.wrapToMultientity(telegramUserId, params,
      'Укажите ИНН для добавления организации',
      (telegramUserId, watchEntityKey) => this.highLevelApi.addToWatchList(telegramUserId, watchEntityKey));    
  };
  
  async remove(telegramUserId, params) {
    return await this.wrapToMultientity(telegramUserId, params,
      'Укажите ИНН или * для удаления организации',
      (telegramUserId, watchEntityKey) => this.highLevelApi.removeFromWatchList(telegramUserId, watchEntityKey));    
  };
  
  async update(telegramUserId, params) {
    return await this.wrapToMultientity(telegramUserId, params,
      'Укажите ИНН или * для загрузки свежей выписки',
      (telegramUserId, watchEntityKey) => this.highLevelApi.updateCandidateInWatchList(telegramUserId, watchEntityKey));    
  };
  
  async approve(telegramUserId, params) {
    return await this.wrapToMultientity(telegramUserId, params,
      'Укажите ИНН или * для принятия новых данных за образец',
      (telegramUserId, watchEntityKey) => this.highLevelApi.approveCandidateToReferenceInWatchList(telegramUserId, watchEntityKey));    
  };
  
  async fav(telegramUserId, params) {
    return await this.wrapToMultientity(telegramUserId, params,
      'Укажите ИНН или * для добавления в избранное',
      (telegramUserId, watchEntityKey) => this.highLevelApi.addToFavorite(telegramUserId, watchEntityKey));    
  };
  
  async unfav(telegramUserId, params) {
    return await this.wrapToMultientity(telegramUserId, params,
      'Укажите ИНН или * для удаления из избранного',
      (telegramUserId, watchEntityKey) => this.highLevelApi.removeFromFavorite(telegramUserId, watchEntityKey));    
  };
  
  async welcome(telegramUserId) {
    return [new TextMessage(telegramUserId, this.welcomeText)];    
  };

  async help(telegramUserId) {
    return [new TextMessage(telegramUserId, this.helpText)];    
  };
  // auto

  async autoupdateAllCandidatesInWatchList(telegramUserId) {
    // no multientry
    const autoMessages = await this.highLevelApi.autoupdateAllCandidatesInWatchList(telegramUserId);
    return autoMessages;
  }

  // async autoupdateAllCandidates() {
  //   const telegramUsers = this.highLevelApi.midLevelApi.lowLevelApi.getAllTelegramUsers();
  //   const telegramUserIds = Object.keys(telegramUsers);
  //   const allMessages = {};
  //   for (const telegramUserId of telegramUserIds) {      
  //     const messages = await this.highLevelApi.autoupdateAllCandidatesInWatchList(telegramUserId);
  //     allMessages.push(messages);
  //   }
  //   return allMessages.flat();
  // }
}
