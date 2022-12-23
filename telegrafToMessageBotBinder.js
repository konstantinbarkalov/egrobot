import exitHook from 'async-exit-hook';
import { Telegraf } from 'telegraf';
import { MessageBot } from './messageBot.js';
import { telegramBotToken } from './secret.js';
import fs from 'fs';
const externalHelpText = fs.readFileSync('./help.txt','utf8');

export class TelegrafToMessageBotBinder {
  telegramBot = new Telegraf(telegramBotToken);
  messageBot = new MessageBot();
  welcomeText = externalHelpText;
  helpText = externalHelpText;
  async start() {
    this.telegramBot = new Telegraf(telegramBotToken);
    this.messageBot = new MessageBot();
    
    exitHook(async (done) => {
      console.warn('Killing backend and saving copy of easyDb...');
      await this.kill();
      console.warn('Exiting app...');
      done();
    });

    this.telegramBot.start((ctx) => ctx.replyWithHTML(this.welcomeText));
    this.telegramBot.help((ctx) => ctx.replyWithHTML(this.helpText));

    this.telegramBot.command('list', async (ctx) => {
      const telegramUserId = ctx.chat.id;
      const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
      const replyMessages = await this.messageBot.getWatchList(telegramUserId);
      for (const replyMessage of replyMessages) {
        const replyMessageText = replyMessage.toString();
        if (replyMessageText) {
          await ctx.replyWithHTML(replyMessageText, telegrafExtra);
        }
      }
    });

    this.telegramBot.command('info', async (ctx) => {
      const telegramUserId = ctx.chat.id;
      const telegrafExtra = { disable_web_page_preview: true }; // { disable_web_page_preview: true, reply_to_message_id: ctx.message.message_id };
      let params = ctx.update.message.text.split(' ').slice(1);
      if (params.length > 0) {
        if (params[0] === '*') {
          params = await this.messageBot.getKeys(telegramUserId);
        }
        for (const param of params) {
          const innKey = param;
          const replyMessages = await this.messageBot.getInfo(telegramUserId, innKey);
          for (const replyMessage of replyMessages) {
            const replyMessageText = replyMessage.toString();
            if (replyMessageText) {
              await ctx.replyWithHTML(replyMessageText, telegrafExtra);
            }
          }
        }
      } else {
        await ctx.replyWithHTML('Укажите ИНН или * для информации о предприятии', telegrafExtra);
      }
    });

    this.telegramBot.command('diff', async (ctx) => {
      const telegramUserId = ctx.chat.id;
      const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
      let params = ctx.update.message.text.split(' ').slice(1);
      if (params.length > 0) {
        if (params[0] === '*') {
          params = await this.messageBot.getKeys(telegramUserId);
        }
        for (const param of params) {
          const innKey = param;
          const replyMessages = await this.messageBot.getChanges(telegramUserId, innKey);
          for (const replyMessage of replyMessages) {
            const replyMessageText = replyMessage.toString();
            if (replyMessageText) {
              await ctx.replyWithHTML(replyMessageText, telegrafExtra);
            }
          }
        }
      } else {
        await ctx.replyWithHTML('Укажите ИНН или *', telegrafExtra);
      }
    });

    this.telegramBot.command('add', async (ctx) => {
      const telegramUserId = ctx.chat.id;
      const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
      const params = ctx.update.message.text.split(' ').slice(1);
      if (params.length > 0) {
        for (const param of params) {
          const innKey = param;
          const replyMessages = await this.messageBot.addToWatchList(telegramUserId, innKey);
          for (const replyMessage of replyMessages) {
            const replyMessageText = replyMessage.toString();
            if (replyMessageText) {
              await ctx.replyWithHTML(replyMessageText, telegrafExtra);
            }
          }
        }
      } else {
        await ctx.replyWithHTML('Укажите ИНН для добавления организации', telegrafExtra);
      }
    });

    this.telegramBot.command('remove', async (ctx) => {
      const telegramUserId = ctx.chat.id;
      const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
      let params = ctx.update.message.text.split(' ').slice(1);
      if (params.length > 0) {
        if (params[0] === '*') {
          params = await this.messageBot.getKeys(telegramUserId);
        }
        for (const param of params) {
          const innKey = param;
          const replyMessages = await this.messageBot.removeFromWatchList(telegramUserId, innKey);
          for (const replyMessage of replyMessages) {
            const replyMessageText = replyMessage.toString();
            if (replyMessageText) {
              await ctx.replyWithHTML(replyMessageText, telegrafExtra);
            }
          }
        }
      } else {
        await ctx.replyWithHTML('Укажите ИНН или * для удаления организации', telegrafExtra);
      }
    });

    this.telegramBot.command('update', async (ctx) => {
      const telegramUserId = ctx.chat.id;
      const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
      let params = ctx.update.message.text.split(' ').slice(1);
      if (params.length > 0) {
        if (params[0] === '*') {
          params = await this.messageBot.getKeys(telegramUserId);
        }
        for (const param of params) {
          const innKey = param;
          const replyMessages = await this.messageBot.updateCandidateInWatchList(telegramUserId, innKey);
          for (const replyMessage of replyMessages) {
            const replyMessageText = replyMessage.toString();
            if (replyMessageText) {
              await ctx.replyWithHTML(replyMessageText, telegrafExtra);
            }
          }
        }
      } else {
        await ctx.replyWithHTML('Укажите ИНН или * для загрузки свежей выписки', telegrafExtra);
      }
    });

    this.telegramBot.command('approve', async (ctx) => {
      const telegramUserId = ctx.chat.id;
      const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
      let params = ctx.update.message.text.split(' ').slice(1);
      if (params.length > 0) {
        if (params[0] === '*') {
          params = await this.messageBot.getKeys(telegramUserId);
        }
        for (const param of params) {
          const innKey = param;
          const replyMessages = await this.messageBot.approveCandidateToReferenceInWatchList(telegramUserId, innKey);
          for (const replyMessage of replyMessages) {
            const replyMessageText = replyMessage.toString();
            if (replyMessageText) {
              await ctx.replyWithHTML(replyMessageText, telegrafExtra);
            }
          }
        }
      } else {
        await ctx.replyWithHTML('Укажите ИНН или * для принятия новых данных за образец', telegrafExtra);
      }
    });

    // auto
    async function messageBotAutoupdateAllCandidatesHandler(telegramBot, telegramUserId, messages) {
      for (const message of messages) {
        const messageText = message.toString();
        await telegramBot.telegram.sendMessage(telegramUserId, messageText);
      }
    }

    //start 
    this.messageBot.autoupdateAllCandidatesHandler = async (telegramUserId, messages) => { return await messageBotAutoupdateAllCandidatesHandler(this.telegramBot, telegramUserId, messages); };
    await this.messageBot.start();
    await this.telegramBot.launch();

  }
  
  async stop() {
    await this.messageBot.stop();
    this.telegramBot.stop();
  }
  async kill() {
    await this.messageBot.kill();
    this.telegramBot.stop();
  }
}
