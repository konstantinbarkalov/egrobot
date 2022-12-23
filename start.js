
import exitHook from 'async-exit-hook'; 
import { Telegraf } from 'telegraf';

import { MessageBot } from './messageBot.js';

import { telegramBotToken } from './secret.js';
//const telegramBotToken = require('./secret.json').telegramBotToken;
const telegramBot = new Telegraf(telegramBotToken);
const messageBot = new MessageBot();

exitHook(async (done) => {
  console.warn('Killing backend and saving copy of easyDb...');
  await messageBot.kill();
  telegramBot.stop();
  console.warn('Exiting app...');
  done();
});

telegramBot.start((ctx) => ctx.reply('Welcome'));
telegramBot.help((ctx) => ctx.reply('Send me a sticker'));

telegramBot.command('list', async (ctx) => {
  const telegramUserId = ctx.chat.id;
  const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
  const replyMessages = await messageBot.getWatchList(telegramUserId);
  for (const replyMessage of replyMessages) {
    const replyMessageText = replyMessage.toString();
    if (replyMessageText) {
      await ctx.reply(replyMessageText, telegrafExtra);
    }
  }
})

telegramBot.command('diff', async (ctx) => {
  const telegramUserId = ctx.chat.id;
  const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
  let params = ctx.update.message.text.split(' ').slice(1);
  if (params.length > 0) {
    if (params[0] === '*') {
      params = await messageBot.getKeys(telegramUserId);
    }
    for (const param of params) {
      const innKey = param;
      const replyMessages = await messageBot.getChanges(telegramUserId, innKey);
      for (const replyMessage of replyMessages) {
        const replyMessageText = replyMessage.toString();
        if (replyMessageText) {
          await ctx.reply(replyMessageText, telegrafExtra);
        }
      }
    }      
  } else {
    await ctx.reply('Укажите ИНН или *', telegrafExtra);
  }
})

telegramBot.command('add', async (ctx) => {
  const telegramUserId = ctx.chat.id;
  const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
  const params = ctx.update.message.text.split(' ').slice(1);
  if (params.length > 0) {
    for (const param of params) {
      const innKey = param;
      const replyMessages = await messageBot.addToWatchList(telegramUserId, innKey);
      for (const replyMessage of replyMessages) {
        const replyMessageText = replyMessage.toString();
        if (replyMessageText) {
          await ctx.reply(replyMessageText, telegrafExtra);
        }
      }
    }    
  } else {
    await ctx.reply('Укажите ИНН для добавления организации', telegrafExtra);
  }
})

telegramBot.command('remove', async (ctx) => {
  const telegramUserId = ctx.chat.id;
  const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
  let params = ctx.update.message.text.split(' ').slice(1);
  if (params.length > 0) {
    if (params[0] === '*') {
      params = await messageBot.getKeys(telegramUserId);
    }
    for (const param of params) {
      const innKey = param;
      const replyMessages = await messageBot.removeFromWatchList(telegramUserId, innKey);
      for (const replyMessage of replyMessages) {
        const replyMessageText = replyMessage.toString();
        if (replyMessageText) {
          await ctx.reply(replyMessageText, telegrafExtra);
        }
      }
    }
  } else {
    await ctx.reply('Укажите ИНН или * для удаления организации', telegrafExtra);
  }
})

telegramBot.command('update', async (ctx) => {
  const telegramUserId = ctx.chat.id;
  const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
  let params = ctx.update.message.text.split(' ').slice(1);
  if (params.length > 0) {
    if (params[0] === '*') {
      params = await messageBot.getKeys(telegramUserId);
    }
    for (const param of params) {
      const innKey = param;
      const replyMessages = await messageBot.updateCandidateInWatchList(telegramUserId, innKey);
      for (const replyMessage of replyMessages) {
        const replyMessageText = replyMessage.toString();
        if (replyMessageText) {
          await ctx.reply(replyMessageText, telegrafExtra);
        }
      }
    }
  } else {
    await ctx.reply('Укажите ИНН или * для загрузки свежей выписки', telegrafExtra);
  }
})

telegramBot.command('approve', async (ctx) => {
  const telegramUserId = ctx.chat.id;
  const telegrafExtra = null; // { reply_to_message_id: ctx.message.message_id };
  let params = ctx.update.message.text.split(' ').slice(1);
  if (params.length > 0) {
    if (params[0] === '*') {
      params = await messageBot.getKeys(telegramUserId);
    }
    for (const param of params) {
      const innKey = param;
      const replyMessages = await messageBot.approveCandidateToReferenceInWatchList(telegramUserId, innKey);
      for (const replyMessage of replyMessages) {
        const replyMessageText = replyMessage.toString();
        if (replyMessageText) {
          await ctx.reply(replyMessageText, telegrafExtra);
        }
      }
    }
  } else {
    await ctx.reply('Укажите ИНН или * для принятия новых данных за образец', telegrafExtra);
  }
})

// auto

async function messageBotAutoupdateAllCandidatesHandler(telegramBot, telegramUserId, messages) {
  for (const message of messages) {
    const messageText = message.toString();  
    await telegramBot.telegram.sendMessage(telegramUserId, messageText);
  }
}

//start 

messageBot.autoupdateAllCandidatesHandler = async (telegramUserId, messages) => { return await messageBotAutoupdateAllCandidatesHandler(telegramBot, telegramUserId, messages); }; 
await messageBot.start();
await telegramBot.launch();

