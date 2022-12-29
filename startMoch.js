
import exitHook from 'async-exit-hook'; 
import { MessageBot } from './messageBot.js';
import { pause } from './utils.js';


const messageBot = new MessageBot();
exitHook(async (done) => {
  console.warn('Killing backend and saving copy of easyDb...');
  await messageBot.kill();
  console.warn('Exiting app...');
  done();
});

function printMessages(messages) {
  messages.forEach(message => {
    console.log('/""""""');
    console.log(message.text);
    console.log('\\______');
  });
}
async function preinit() {
  const telegramUserId = '-1';
  const innText1 = '7730588444'; 
  const innText2 =  '246004351629';
  const innText3 =  '7736207543';
  
  printMessages(await messageBot.addToWatchList(telegramUserId, innText1));
  await pause(3000);
  printMessages(await messageBot.addToWatchList(telegramUserId, innText2));
  await pause(3000);
  printMessages(await messageBot.addToWatchList(telegramUserId, innText3));
  await pause(3000);
  printMessages(await messageBot.updateAllCandidatesInWatchList(telegramUserId));
  await pause(3000);
  printMessages(await messageBot.getWatchList(telegramUserId));
  await pause(3000);
  printMessages(await messageBot.getChanges(telegramUserId, innText2));
  await pause(3000);
  printMessages(await messageBot.getChanges(telegramUserId, innText1));
  await pause(3000);
  printMessages(await messageBot.approveCandidateToReferenceInWatchList(telegramUserId, innText2));
  await pause(3000);
  printMessages(await messageBot.approveCandidateToReferenceInWatchList(telegramUserId, innText1));
  await pause(3000);
  printMessages(await messageBot.getWatchList(telegramUserId));  
}await pause(3000);

await messageBot.start();
await preinit();
