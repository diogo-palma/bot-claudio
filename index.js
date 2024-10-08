const path = require('path')
const fs = require('fs')
const bot = require("./bot/index.js")
const groups = require("./controllers/groups.js")
const cron = require("node-cron")


function mostrarDataHora() {
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  console.log(`\x1b[34mData e Hora atual: ${formattedDate}\x1b[0m`);
}


cron.schedule("0 13,18,20 * * *", async function () {
  listarGrupos()
})

process.on('uncaughtException', function (error) {
  console.log("\x1b[31m", "Exception: ", error, "\x1b[0m");

})
process.on('unhandledRejection', function (error, p) {
	console.log("\x1b[31m","Error: ", error, "\x1b[0m");

})

function listMsg(buttons) {
  return {
    reply_markup: {
      inline_keyboard: buttons.map(buttonPair => buttonPair.map(button => ({
        text: button.text,
        url: button.url
      })))
    }
  };
}

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

const respostas_json = path.resolve(__dirname) + "/textos/respostas_bot.json"

async function listarGrupos() {
  try {
    const groupsDB = await groups.allGroups(50);
    const allGroups = await groups.allGroups2()

    let respostasBot = await lerArquivo(respostas_json);

    if (respostasBot) {
      respostasBot = JSON.parse(respostasBot);
    }

    const buttons = [];
    for (let i = 0; i < groupsDB.length; i += 2) {
      const buttonPair = [];

      let data = await bot.criarLink(groupsDB[i].id_group);
      console.log("data", data);
      if (data.invite_link){
        buttonPair.push({
          text: groupsDB[i].nome,
          url: data.invite_link
        });
      }

      if (groupsDB[i + 1]) {
        try {
          let data = await bot.criarLink(groupsDB[i + 1].id_group);
          if (data.invite_link){
            buttonPair.push({
              text: groupsDB[i + 1].nome,
              url: data.invite_link
            });
          }
        } catch (error) {
          console.error(`Erro ao criar link para o grupo ${groupsDB[i + 1].nome}:`, error);
         
        }
      }

      buttons.push(buttonPair);
    }

    for (let index = 0; index < allGroups.length; index++) {
      const element = allGroups[index];
      try {
        bot.enviarMsg(element.id_group, respostasBot.msg_lista, {
          reply_markup: listMsg(buttons).reply_markup
        });
      }catch(error){
        console.log("erro ao enviar msg", error)
      }
    }
  } catch (error) {
    console.error("Error in listarGrupos:", error);
  }
}
