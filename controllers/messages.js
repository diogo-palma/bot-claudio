const db = require("../config/db")

async function salvarMsgs(chatId, messageId){
  try {
    const result = await db('messages').insert({
      chat_id: chatId,
      message_id: messageId,
    });
    return result;
  } catch (error) {
    console.log(error)
  }
}

async function deletarTodasMsgs() {
  try {
    const result = await db('messages').del();    
    return result;
  } catch (error) {
    console.log('Erro ao deletar mensagens:', error);
  }
}

async function allMsgs() {
  const messages = await db('messages')

  return Array.isArray(messages) ? messages : [];
}

module.exports = {  salvarMsgs, deletarTodasMsgs, allMsgs }