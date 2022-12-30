import exitHook from 'async-exit-hook';
import { Telegraf, Markup } from 'telegraf';
import { TextMessage } from './backendAppHighLevelApi.js';
import { BackendAppTopLevelApi } from './backendAppTopLevelApi.js';
import { telegramBotToken } from './secret.js';

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

  async wrapApiToTelegraph(ctx, fn) {
    const telegramUserId = ctx.chat.id;
    const message = ctx.update.message ? ctx.update.message.text : ctx.update.callback_query.data;
    let params = message.split(' ').slice(1);
    let messages = await fn(telegramUserId, params);
    await this.sendMessages(messages);
    if (ctx.update.callback_query) {
      await ctx.answerCbQuery();
    }
  }

  async bindTelegrafToApi() {
    this.telegrafBot.start((ctx) => { this.wrapApiToTelegraph(ctx, (telegramUserId) => this.topLevelApi.welcome(telegramUserId)) });
    this.telegrafBot.help((ctx) => { this.wrapApiToTelegraph(ctx, (telegramUserId) => this.topLevelApi.help(telegramUserId)) });

    this.telegrafBot.command('list', (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId) => this.topLevelApi.list(telegramUserId)));
    this.telegrafBot.command('info', (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.info(telegramUserId, params)));
    this.telegrafBot.command('diff', (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.diff(telegramUserId, params)));
    this.telegrafBot.command('add', (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.add(telegramUserId, params)));
    this.telegrafBot.command('remove', (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.remove(telegramUserId, params)));
    this.telegrafBot.command('update', (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.update(telegramUserId, params)));
    this.telegrafBot.command('approve', (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.approve(telegramUserId, params)));
    this.telegrafBot.command('fav', (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.fav(telegramUserId, params)));
    this.telegrafBot.command('unfav', (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.unfav(telegramUserId, params)));
        
    this.telegrafBot.action(/list+/, (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId) => this.topLevelApi.list(telegramUserId)));
    this.telegrafBot.action(/info+/, (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.info(telegramUserId, params)));
    this.telegrafBot.action(/diff+/, (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.diff(telegramUserId, params)));
    this.telegrafBot.action(/add+/, (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.add(telegramUserId, params)));
    this.telegrafBot.action(/remove+/, (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.remove(telegramUserId, params)));
    this.telegrafBot.action(/update+/, (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.update(telegramUserId, params)));
    this.telegrafBot.action(/approve+/, (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.approve(telegramUserId, params)));
    this.telegrafBot.action(/fav+/, (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.fav(telegramUserId, params)));
    this.telegrafBot.action(/unfav+/, (ctx) => this.wrapApiToTelegraph(ctx, (telegramUserId, params) => this.topLevelApi.unfav(telegramUserId, params)));
    
  
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
