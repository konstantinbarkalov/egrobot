import exitHook from 'async-exit-hook';
import { Telegraf, Markup } from 'telegraf';
import { TextMessage } from './backendAppHighLevelApi.js';
import { BackendAppTopLevelApi } from './backendAppTopLevelApi.js';
import { telegramBotToken } from '../../secret/secret.js';

export class BackendApp {
  telegrafBot = new Telegraf(telegramBotToken);
  topLevelApi = new BackendAppTopLevelApi();
  watchIntervalSec = 60 * 60 * 12;
  watchTimer = null;

  async start() {
    exitHook(async (done) => {
      console.warn('Killing backend and saving copy of easyDb...');
      await this.kill();
      console.warn('Exiting app...');
      done();
    });
    this.bindTelegrafToApi();
    await this.topLevelApi.start();
    this.telegrafBot.launch();
    this.restartWatch();
  }    
  
  async stop() {
    this.stopWatch();
    await this.topLevelApi.stop();
    await this.telegrafBot.stop();
  }
  
  async kill() {
    await this.topLevelApi.kill();
    await this.telegrafBot.stop();
  }
  
  restartWatch() {
    if (this.watchTimer) {
      this.stopWatch();
    }
    setTimeout(() => {
      this.autoupdateAllCandidates();
    }, 1000 * 5);
    this.watchTimer = setInterval(() => {
      this.autoupdateAllCandidates();
    }, 1000 * this.watchIntervalSec);
  }

  stopWatch() {
    clearInterval(this.watchTimer);
    this.watchTimer = null;
  }

  async sendMessages(messages) {
    for (const message of messages) {
      if (message instanceof TextMessage) {
        let replyMarkup;
        if (message.buttons && message.buttons.length) {  
          const buttons = message.buttons.map(button => Markup.button.callback(button.text, button.action));        
          replyMarkup = Markup.inlineKeyboard(buttons).reply_markup;     
        } 
        const extra = { 
          parse_mode: message.isHtml ? 'HTML' : undefined, 
          // reply_to_message_id: TODO, 
          reply_markup: replyMarkup, 
          disable_web_page_preview: message.isDisablePreview, 
          disable_notification: message.isSilent
        };
        
        await this.telegrafBot.telegram.sendMessage(message.telegramUserId, message.text, extra);

      } else {
        throw new TypeError('unknown message type');
      }
    }
  }
  commandTextToParams(commandText) {
    const params = commandText.split(' ').slice(1);
    return params;
  }
  async wrapApiToTelegraphCommand(ctx, fn) {
    const telegramUserId = ctx.chat.id;
    const commandText = ctx.update.message.text;
    let params = this.commandTextToParams(commandText);
    let messages = await fn(telegramUserId, params);
    await this.sendMessages(messages);
  }

  async wrapApiToTelegraphAction(ctx, fn) {
    const telegramUserId = ctx.chat.id;
    const commandText = ctx.update.callback_query.data;
    let params = this.commandTextToParams(commandText);
    let messages = await fn(telegramUserId, params);
    await this.sendMessages(messages);
    await ctx.answerCbQuery();
    
  }
  async bindTelegrafToApi() {
    this.telegrafBot.start((ctx) => { this.wrapApiToTelegraphCommand(ctx, (telegramUserId) => this.topLevelApi.welcome(telegramUserId)) });
    this.telegrafBot.help((ctx) => { this.wrapApiToTelegraphCommand(ctx, (telegramUserId) => this.topLevelApi.help(telegramUserId)) });

    this.telegrafBot.command('list', (ctx) => this.wrapApiToTelegraphCommand(ctx, (telegramUserId) => this.topLevelApi.list(telegramUserId)));
    this.telegrafBot.command('info', (ctx) => this.wrapApiToTelegraphCommand(ctx, (telegramUserId, params) => this.topLevelApi.info(telegramUserId, params)));
    this.telegrafBot.command('diff', (ctx) => this.wrapApiToTelegraphCommand(ctx, (telegramUserId, params) => this.topLevelApi.diff(telegramUserId, params)));
    this.telegrafBot.command('add', (ctx) => this.wrapApiToTelegraphCommand(ctx, (telegramUserId, params) => this.topLevelApi.add(telegramUserId, params)));
    this.telegrafBot.command('remove', (ctx) => this.wrapApiToTelegraphCommand(ctx, (telegramUserId, params) => this.topLevelApi.remove(telegramUserId, params)));
    this.telegrafBot.command('update', (ctx) => this.wrapApiToTelegraphCommand(ctx, (telegramUserId, params) => this.topLevelApi.update(telegramUserId, params)));
    this.telegrafBot.command('approve', (ctx) => this.wrapApiToTelegraphCommand(ctx, (telegramUserId, params) => this.topLevelApi.approve(telegramUserId, params)));
    this.telegrafBot.command('fav', (ctx) => this.wrapApiToTelegraphCommand(ctx, (telegramUserId, params) => this.topLevelApi.fav(telegramUserId, params)));
    this.telegrafBot.command('unfav', (ctx) => this.wrapApiToTelegraphCommand(ctx, (telegramUserId, params) => this.topLevelApi.unfav(telegramUserId, params)));
    this.telegrafBot.command('version', (ctx) => this.wrapApiToTelegraphCommand(ctx, (telegramUserId) => this.topLevelApi.version(telegramUserId)));

    
    this.telegrafBot.action(/list+/, (ctx) => this.wrapApiToTelegraphAction(ctx, (telegramUserId) => this.topLevelApi.list(telegramUserId)));
    this.telegrafBot.action(/info+/, (ctx) => this.wrapApiToTelegraphAction(ctx, (telegramUserId, params) => this.topLevelApi.info(telegramUserId, params)));
    this.telegrafBot.action(/diff+/, (ctx) => this.wrapApiToTelegraphAction(ctx, (telegramUserId, params) => this.topLevelApi.diff(telegramUserId, params)));
    this.telegrafBot.action(/add+/, (ctx) => this.wrapApiToTelegraphAction(ctx, (telegramUserId, params) => this.topLevelApi.add(telegramUserId, params)));
    this.telegrafBot.action(/remove+/, (ctx) => this.wrapApiToTelegraphAction(ctx, (telegramUserId, params) => this.topLevelApi.remove(telegramUserId, params)));
    this.telegrafBot.action(/update+/, (ctx) => this.wrapApiToTelegraphAction(ctx, (telegramUserId, params) => this.topLevelApi.update(telegramUserId, params)));
    this.telegrafBot.action(/approve+/, (ctx) => this.wrapApiToTelegraphAction(ctx, (telegramUserId, params) => this.topLevelApi.approve(telegramUserId, params)));
    this.telegrafBot.action(/fav+/, (ctx) => this.wrapApiToTelegraphAction(ctx, (telegramUserId, params) => this.topLevelApi.fav(telegramUserId, params)));
    this.telegrafBot.action(/unfav+/, (ctx) => this.wrapApiToTelegraphAction(ctx, (telegramUserId, params) => this.topLevelApi.unfav(telegramUserId, params)));
    this.telegrafBot.action(/version+/, (ctx) => this.wrapApiToTelegraphAction(ctx, (telegramUserId, params) => this.topLevelApi.version(telegramUserId, params)));
    
  
  }
  
  // auto

  async autoupdateAllCandidates() {
    const telegramUsers = await this.topLevelApi.highLevelApi.midLevelApi.lowLevelApi.getAllTelegramUsers();
    const telegramUserIds = Object.keys(telegramUsers);
    for (const telegramUserId of telegramUserIds) {      
      const messages = await this.topLevelApi.autoupdateAllCandidatesInWatchList(telegramUserId);
      await this.sendMessages(messages);
    }
  }  
  
}
