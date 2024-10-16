let previousMessageId = null;
const TelegramBot = require('node-telegram-bot-api');
const path = require('path')
const fs = require('fs');

const groups = require('../controllers/groups.js')
const ban_users = require('../controllers/ban-users.js')
const messages = require('../controllers/messages.js')

const token = '7400844145:AAE4RNbnkPExULiK4Um3OAocAnrbUOLaWBY';
const bot = new TelegramBot(token, { polling: true });

const NOME_BOT = 'VexGrupos_bot'

const COMANDOS_BOT = ["/start", "/listar", "/listar_canais", "/listar_grupos", "/banir", "/desbanir" , "/add_exclusivo", "/remover_exclusivo", "/remover", "/listar_bans"]

async function enviarMsg(id_telegram, msg, json) {  
  try {
    if (previousMessageId) {
      await bot.deleteMessage(id_telegram, previousMessageId);
    }
    
    const sentMessage = await bot.sendMessage(id_telegram, msg, json);
    
    previousMessageId = sentMessage.message_id;
    
    await bot.pinChatMessage(id_telegram, previousMessageId);

  } catch (error) {
    console.log("Erro ao enviar mensagem", error);
    return { error: 'Erro ao enviar mensagem' };
  }
}

function containsInArray(value, array) {
  return array.some(cmd => value.includes(cmd)); 
}

bot.setMyCommands([
  { command: 'start', description: 'Iniciar Atendimento' },
])

bot.on('message', async function (msg) {
  if (msg.chat.type === "private") { 
    if (!containsInArray(msg.text, COMANDOS_BOT)) {
      let respostasBot = await lerArquivo(respostas_json);
           
      if (respostasBot) {
        respostasBot = JSON.parse(respostasBot);
      }

      const chatId = msg.chat.id;
      let opts = startMsgs(chatId, msg.message_id);
      bot.sendMessage(chatId, respostasBot.start, opts);
    }
  }
});


const respostas_json = path.resolve(__dirname , '..') + "/textos/respostas_bot.json"

async function lerArquivo(caminho) {
  return new Promise((resolve, reject) => {
    fs.readFile(caminho, 'utf8', function (err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}
async function setHook(params) {
  await bot.setWebHook("https://bot-claudio.vercel.app/webhook",{allowed_updates: JSON.stringify(["message", "edited_channel_post", "callback_query", "message_reaction", "message_reaction_count", "chat_member", "my_chat_member", "channel_post", "new_chat_members", "new_chat_member"])}) 

}

setHook()

bot.on('polling_error', (error) => {
  console.log(error.code);  
});

bot.on('webhook_error', (error) => {
  console.log(error.code);  
});


bot.on('my_chat_member', async (msg) => {
  console.log("msg", msg)
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;

  const newStatus = msg.new_chat_member.status;
  const oldStatus = msg.old_chat_member.status;

  
  if (newStatus !== 'administrator'){
    await groups.deletarGroup(chatId)
    return
  }

  

  if (chatType === 'group' || chatType === 'supergroup' || chatType === 'channel') {

    let respostasBot = await lerArquivo(respostas_json)

    
         
    if (respostasBot){
      respostasBot = JSON.parse(respostasBot)
    }
   
    setTimeout(async () => {
      const memberCount = await bot.getChatMemberCount(chatId);  
      if (memberCount < respostasBot.LIMITE_MEMBROS) {    
        let chatTypePT = "grupo"
        if (chatType == "channel"){
          chatTypePT = "canal"
        }
        bot.sendMessage(chatId, `❌ Não foi possível dar continuidade, seu ${chatTypePT} não atende nosso requisito de ter pelo menos ${respostasBot.LIMITE_MEMBROS} membros. Agradecemos o seu interesse, até logo!`);
        bot.leaveChat(chatId);
      }else{
        const data = {
          nome: msg.chat.title,
          id_group: msg.chat.id,
          is_group: msg.chat.type == 'channel' ? 0 : 1,
          username: msg.from.username,
          id_username: msg.from.id,
        }
       
       
        const idGroup = await groups.salvarGrupo(data)
        console.log("idGroup", idGroup)

        const chat_link = await bot.createChatInviteLink(msg.chat.id)
        await bot.sendMessage(1401722757, `Novo canal/grupo adicionado:\n\nNome: ${msg.chat.title}\n\nUsuário: ${msg.from.username} - Id: ${msg.from.id}\n\nLink: ${chat_link.invite_link}`, {
          reply_markup: {
            inline_keyboard: [
                [
                    {
                      text: 'X Remover',  
                      callback_data: 
                        JSON.stringify({
                          command: "rmv_c", 
                          id_remover: msg.chat.id,
                          id_group: idGroup
                        })
                    },
                ]
            ]
          }
        })

        
      }

    }, 1000);
  
  }
})


bot.onText(/\/adicionar/, (msg) => {
  const chatId = msg.chat.id;

  console.log("bot", bot)

  bot.sendMessage(chatId, 'Clique no botão abaixo para adicionar o bot a um grupo:', {
      reply_markup: {
          inline_keyboard: [
              [
                  {
                      text: 'Adicionar a Grupo',
                      url: `https://t.me/VexGrupos_bot?startgroup=true&admin=post_messages+delete_messages+edit_messages+invite_users+pin_messages`
                  }
              ]
          ]
      }
  });
});


function startMsgs(chatId, msgId) {

  return {
    reply_markup: {
      inline_keyboard: [
          [
              {
                text: '🗂 Meus Grupos',  
                callback_data: 
                  JSON.stringify({
                    command: "grupos", 
                    message_id: msgId,
                    chat_id: chatId
                  })
              },
              {
                text: '🔈 Meus Canais',  
                callback_data: 
                  JSON.stringify({
                    command: "canais",
                    message_id: msgId,
                    chat_id: chatId
                  })
              }
          ],
          [
            {
              text: '📥 Participar da lista',  
              callback_data: 
                JSON.stringify({
                  command: "participar",
                  message_id: msgId,
                  chat_id: chatId
                })
            }
          ],
          [
            {
              text: '⭐ Participantes exclusivos',  
              callback_data: 
                JSON.stringify({
                  command: "exclusivos",
                  message_id: msgId,
                  chat_id: chatId
                })
            }
          ],
          [
            {
              text: 'Suporte & Dicas',  
              url: 'https://t.me/luxmakerofc'
            }
          ]
      ]
    }
  }
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  console.log("msg", msg)

  let respostasBot = await lerArquivo(respostas_json)
         
  if (respostasBot){
    respostasBot = JSON.parse(respostasBot)
  }
  let opts = startMsgs(chatId, msg.message_id)
  bot.sendMessage(chatId, respostasBot.start, opts )
})


function valdarAdmin(admin) {
  let validar = false
  if (admin == "diogopalma93" ) validar = true
  if (admin == "luxmakerofc" ) validar = true
  if (admin == "Tr1v0" ) validar = true
  return validar
}

bot.onText(/\/add_exclusivo/, async (msg) => {
  const chatId = msg.chat.id;
  if (!valdarAdmin(msg.chat.username)) return
  
  console.log("msg", msg)

  let id_remover = msg.text.replace("/add_exclusivo", "").trim()
  if (!id_remover){
    bot.sendMessage(chatId, "Informe o id, exemplo: /add_exclusivo 1234")
    return
  }
  id_remover = Number(id_remover)
  console.log({id: id_remover})

  const group = await groups.groupById(id_remover)

  console.log("group", group)
  if (group){
    const data = {
      ...group,
      is_priority: 1
    }    
    await groups.salvarGrupo(data)
    bot.sendMessage(chatId, `${group.nome} adicionado ao exclusivo`)
  }else{
    bot.sendMessage(chatId, `Canal/grupo com id: ${id_remover} não encontado`)
  }

})

bot.onText(/\/banir/, async (msg) => {
  const chatId = msg.chat.id;
  if (!valdarAdmin(msg.chat.username)) return
  
  console.log("msg", msg)

  let id_remover = msg.text.replace("/banir", "").trim()
  if (!id_remover){
    bot.sendMessage(chatId, "Informe o id, exemplo: /banir 1234")
    return
  }
  id_remover = Number(id_remover)
  console.log({id: id_remover})

  const group = await groups.groupByIdUsername(id_remover)

  console.log("group", group)
  if (group){
    const data = {
      username: group.username,
      id_username: id_remover
    }    
    await ban_users.salvarBanUser(data)
    bot.sendMessage(chatId, `${group.id_username} adicionado a lista de ban`)
  }else{
    bot.sendMessage(chatId, `Usuário com id: ${id_remover} não encontado`)
  }

})

bot.onText(/\/desbanir/, async (msg) => {
  const chatId = msg.chat.id;
  if (!valdarAdmin(msg.chat.username)) return
  
  console.log("msg", msg)

  let id_remover = msg.text.replace("/desbanir", "").trim()
  if (!id_remover){
    bot.sendMessage(chatId, "Informe o id, exemplo: /desbanir 1234")
    return
  }
  id_remover = Number(id_remover)
  console.log({id: id_remover})

  const user = await ban_users.queryUser({id_username: id_remover})

  
  if (user){     
    await ban_users.deletarBan(id_remover)
    bot.sendMessage(chatId, `${user.id_username} removido da lista de ban`)
  }else{
    bot.sendMessage(chatId, `Usuário com id: ${id_remover} não encontado`)
  }

})

bot.onText(/\/remover_exclusivo/, async (msg) => {
  const chatId = msg.chat.id;
  if (!valdarAdmin(msg.chat.username)) return
  
  console.log("msg", msg)

  let id_remover = msg.text.replace("/remover_exclusivo", "").trim()
  if (!id_remover){
    bot.sendMessage(chatId, "Informe o id, exemplo: /remover_exclusivo 1234")
    return
  }
  
  id_remover = Number(id_remover)
  console.log({id: id_remover})

  const group = await groups.groupById(id_remover)

  
  if (group){
    const data = {
      ...group,
      is_priority: 0
    }
    console.log("data", data)
    await groups.salvarGrupo(data)
    bot.sendMessage(chatId, `${group.nome} removido do exclusivo`)
  }else{
    bot.sendMessage(chatId, `Canal/grupo com id: ${id_remover} não encontado`)
  }

})

bot.onText(/\/remover/, async (msg) => {
  const chatId = msg.chat.id;
  if (!valdarAdmin(msg.chat.username)) return
  
  console.log("msg", msg)

  let id_remover = msg.text.replace("/remover", "").trim()

  if (!id_remover){
    bot.sendMessage(chatId, "Informe o id, exemplo: /remover 1234")
    return
  }
  
  id_remover = Number(id_remover)
  console.log({id: id_remover})

  const group = await groups.groupById( id_remover)

  console.log("group", group)
  if (group && Object.keys(group).length > 0) {
    await groups.deletarGroup(id_remover)
    bot.leaveChat(group.id_group)
    bot.sendMessage(chatId, `${group.nome} removido da lista `)
  }else{
    bot.sendMessage(chatId, `Id: ${id_remover} não encontado`)
  }

})

function listaGroup(elem, index){
  let msg = '#⃣ ' + (+index + +1) + '\n'
  msg += `🆔 ${elem.id}\n`
  if (elem.is_group == 1){
    msg += `🟠 ${elem.nome} \n`
  }else{
    msg += `🔴 ${elem.nome} \n`
  }
    
  msg += `👤 @${elem.username}\n`
  msg += `🚹 ${elem.id_username}`
  if (elem.is_priority == 1){
    msg += `\n⭐ Exclusivo`
  }
  return msg
}

bot.onText(/\/listar_grupos/, async (msg) => {
  const chatId = msg.chat.id;
  if (!valdarAdmin(msg.chat.username)) return
  
  console.log("msg", msg)
  
  const groupsDB = await groups.queryGroups({is_group: 1})

  for (let index = 0; index < groupsDB.length; index++) {
    const element = groupsDB[index];
    let msg = listaGroup(element, index)
    await bot.sendMessage(chatId, msg)
  }

})

bot.onText(/\/listar_canais/, async (msg) => {
  const chatId = msg.chat.id;
  if (!valdarAdmin(msg.chat.username)) return
  
  console.log("msg", msg)
  
  const groupsDB = await groups.queryGroups({is_group: 0})

  for (let index = 0; index < groupsDB.length; index++) {
    const element = groupsDB[index];
    let msg = listaGroup(element, index)
    await bot.sendMessage(chatId, msg)
  }

})

bot.onText(/\/listar_exclusivos/, async (msg) => {
  const chatId = msg.chat.id;
  if (!valdarAdmin(msg.chat.username)) return
  
  console.log("msg", msg)
  
  const groupsDB = await groups.queryGroups({is_priority: 1})

  for (let index = 0; index < groupsDB.length; index++) {
    const element = groupsDB[index];
    let msg = listaGroup(element, index)
    await bot.sendMessage(chatId, msg)
  }

})


bot.onText(/\/listar_bans/, async (msg) => {
  const chatId = msg.chat.id;
  if (!valdarAdmin(msg.chat.username)) return
  
  console.log("msg", msg)
  
  const users = await ban_users.listBanUsers()

  if (users.length){
    for (let index = 0; index < users.length; index++) {
      const element = users[index];
      let msg = `👤 ${element.username}\n`
      msg += `🚹 ${element.id_username}`
      bot.sendMessage(chatId, msg)
    }
  }else{
    bot.sendMessage(chatId, "Lista vazia")
  }

})

bot.onText(/\/listar/, async (msg) => {
  const chatId = msg.chat.id;
  if (!valdarAdmin(msg.chat.username)) return
  
  console.log("msg", msg)

  let term = msg.text.replace("/listar", "").trim()

  console.log("term", term)
  
  const groupsDB = await groups.searchGroups(term)

  console.log("groupsDB", groupsDB)
  if (groupsDB.length){
    for (let index = 0; index < groupsDB.length; index++) {
      const element = groupsDB[index];

      let msg = ''
      
      if (element.is_group == 1){
        msg += '#⃣ ' + (+index + +1) + ' - Grupo\n'
        msg += `🟠 ${element.nome} \n`
      }else{
        msg += '#⃣ ' + (+index + +1) + ' - Canal\n'
        msg += `🔴 ${element.nome} \n`
      }
      msg += `🆔 ${element.id}\n`
      
      msg += `👤 @${element.username}\n`
      msg += `🚹 ${element.id_username}`

      if (element.is_priority == 1){
        msg += `\n⭐ Exclusivo`
      }
      
      await bot.sendMessage(chatId, msg)    
    }
  }else{
    await bot.sendMessage(chatId, "Sem resultados")    
  }


})

bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
  console.log("callbackQuery callback", callbackQuery.data)

  let data = JSON.parse(callbackQuery.data)

  let respostasBot = await lerArquivo(respostas_json)
         
  if (respostasBot){
    respostasBot = JSON.parse(respostasBot)
  }

  if (data.command == "rmv_c") {    
    console.log("data", data)
    await groups.deletarGroup(data.id_remover)
    await bot.leaveChat(data.id_remover)
    await bot.sendMessage(1401722757, "Removido")
    return
  }

  const user = await ban_users.queryUser({id_username: data.chat_id})
  
  

  if (data.command == "voltar") {
    let opts = startMsgs(data.chat_id, data.message_id)
    console.log("opts", opts)
    bot.editMessageText(respostasBot.start, 
      {
        chat_id: data.chat_id, 
        message_id: callbackQuery.message.message_id, 
        reply_markup: opts.reply_markup
      })
      return
  }

  

  if (user){
    bot.editMessageText(respostasBot.usuario_banido, 
      {
        chat_id: data.chat_id, 
        message_id: callbackQuery.message.message_id, 
        reply_markup: {
          inline_keyboard: [
              
            [
              { 
                text: '⬅ Voltar', 
                callback_data: 
                  JSON.stringify({
                    command: "voltar",
                    message_id: data.message_id,
                    chat_id: data.chat_id
                  })
              }
            ]
          ]
        }     
      })
    return
  }

  if (data.command == "grupos") {
    const resp = await groups.queryGroups({id_username: data.chat_id, is_group: 1})
    console.log("groups", resp)
    if (resp.length){
      let html = respostasBot.grupos + "\n\n"
      for (let index = 0; index < resp.length; index++) {
        const element = resp[index];
        html += index+1 + '. ' + element.nome + "\n"
      }
      await bot.editMessageText(html, {
        chat_id: data.chat_id,
        message_id: callbackQuery.message.message_id, 
        reply_markup: {
            inline_keyboard: [
                
              [
                { 
                  text: '⬅ Voltar', 
                  callback_data: 
                    JSON.stringify({
                      command: "voltar",
                      message_id: data.message_id,
                      chat_id: data.chat_id
                    })
                }
              ]
            ]
        }        
      });
    }else{
      await bot.editMessageText(respostasBot.nenhum_grupo, {
        chat_id: data.chat_id,
        message_id: callbackQuery.message.message_id, 
        reply_markup: {
            inline_keyboard: [
                
              [
                { 
                  text: '⬅ Voltar', 
                  callback_data: 
                    JSON.stringify({
                      command: "voltar",
                      message_id: data.message_id,
                      chat_id: data.chat_id
                    })
                }
              ]
            ]
          }
      });
    }
    
  }

  if (data.command == "canais") {

    const resp = await groups.queryGroups({id_username: data.chat_id, is_group: 0})
    console.log("groups", resp)
    if (resp.length){
      let html = respostasBot.canais + "\n\n"
      for (let index = 0; index < resp.length; index++) {
        const element = resp[index];
        html += index+1 + '. ' + element.nome + "\n"
      }
      await bot.editMessageText(html, {
        chat_id: data.chat_id,
        message_id: callbackQuery.message.message_id, 
        reply_markup: {
            inline_keyboard: [
                
              [
                { 
                  text: '⬅ Voltar', 
                  callback_data: 
                    JSON.stringify({
                      command: "voltar",
                      message_id: data.message_id,
                      chat_id: data.chat_id
                    })
                }
              ]
            ]
        }        
      });
    }else{
      await bot.editMessageText(respostasBot.nenhum_canal, {
        chat_id: data.chat_id,
        message_id: callbackQuery.message.message_id, 
        reply_markup: {
            inline_keyboard: [
                
              [
                { 
                  text: '⬅ Voltar', 
                  callback_data: 
                    JSON.stringify({
                      command: "voltar",
                      message_id: data.message_id,
                      chat_id: data.chat_id
                    })
                }
              ]
            ]
          }
      });
    }
  }

  if (data.command == "participar") {
    await bot.editMessageText(respostasBot.participar, {
      chat_id: data.chat_id,
      message_id: callbackQuery.message.message_id, 
      reply_markup: {
          inline_keyboard: [
            [
              { 
                text: '➕ Adicionar Grupo 🟠', 
                url: "https://t.me/VexGrupos_bot/?startgroup=added_as_admin&admin=post_messages+delete_messages+edit_messages+invite_users+pin_messages"
              }
            ],
            [
              { 
                text: '➕ Adicionar Canal 🔴', 
                url : "https://t.me/VexGrupos_bot/?startchannel=added_as_admin&admin=post_messages+delete_messages+edit_messages+invite_users+pin_messages"
              }
            ],
            [
              { 
                text: '⬅ Voltar', 
                callback_data: 
                  JSON.stringify({
                    command: "voltar",
                    message_id: data.message_id,
                    chat_id: data.chat_id
                  })
              }
            ]
          ]
        }
    });
  }

  if (data.command == "exclusivos") {
    await bot.editMessageText(respostasBot.participantes_exclusivos, {
      chat_id: data.chat_id,
      message_id: callbackQuery.message.message_id, 
      reply_markup: {
          inline_keyboard: [
            [
              { 
                text: respostasBot.nome_exclusivo, 
                url: respostasBot.link_exclusivo
              }
            ],           
            [
              { 
                text: '⬅ Voltar', 
                callback_data: 
                  JSON.stringify({
                    command: "voltar",
                    message_id: data.message_id,
                    chat_id: data.chat_id
                  })
              }
            ]
          ]
        }
    });
  }

})

async function criarLink(id_grupo) {  
  try {
    const data = await bot.createChatInviteLink(id_grupo);
    return data;
  } catch (error) {
    console.error(`Erro ao criar link para o grupo ${id_grupo}:`, error);    
    return { error: 'Erro ao gerar link' };
  }
}

async function enviarMsg(id_telegram, msg, json) {  
  try {
    const result = await bot.sendMessage(id_telegram, msg, json);  
    return result;
  } catch (error) {
    console.log("error enviar msg", error)
    return { error: 'erro ao enviar msg' };
  }
  
  
}

async function pinChatMessage(id_telegram, msg, json) {  
  try {
    await bot.pinChatMessage(id_telegram, msg, json);  
  } catch (error) {
    console.log("error enviar msg", error)
    return { error: 'erro ao enviar msg' };
  }
  
  
}

async function deleteMessages () {
  try {
    const messagesDB = await messages.allMsgs()
    for (let index = 0; index < messagesDB.length; index++) {
      const element = messagesDB[index];
      try {        
        await bot.deleteMessage(element.chat_id, element.message_id);
        console.log(`Mensagem ${element.message_id} deletada do chat ${element.chat_id}`);
      } catch (error) {
        
        console.error(`Erro ao deletar mensagem ${element.message_id} do chat ${element.chat_id}:`, error);
      }
    }
   
    await messages.deletarTodasMsgs()
    console.log('Mensagens deletadas com sucesso');
  } catch (error) {
    console.error('Erro ao deletar mensagem:', error);
  }
};

module.exports = { criarLink, enviarMsg, pinChatMessage, deleteMessages };