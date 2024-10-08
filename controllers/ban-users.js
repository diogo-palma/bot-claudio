const db = require("../config/db")

async function salvarBanUser(json) {

  const ban_user = {...json}
  let ban_userDB
  console.log("json",json)
  if (json.id) ban_user.id = json.id  
  try {
    ban_userDB = await db('ban-users')
       .where({id_username: ban_user.id_username}).first() 

    if (json.id)  {
      ban_userDB = await db('ban-users')
        .where({id: ban_user.id}).first()         
    }  

  } catch (msg) {
    return msg
  }

  try {
    var result = '';
    const query = new Promise( ( resolve, reject ) => {
      console.log("ban_userDB", ban_userDB)
       if (ban_userDB){
          db('ban-users')
             .update(ban_user)
             .where({id: ban_userDB.id})
             .then( async ()  => { 
                
                result =  ban_userDB.id
                resolve();
             })
             .catch(err => { return err})
       }else{
          db('ban-users')
             .insert(ban_user)            
             .then( async ()  => { 
                const ban_userDB = await db('ban-users')
                   .where({id_username: ban_user.id_username}).first()
                console.log(ban_userDB.id)
                result =  ban_userDB.id
                resolve();
             })
             .catch(err => { 
                result =  err
                console.log("err", err)
                resolve();
             })
       }
    })
    await query;
    return result

 } catch (error) {
    console.log(error)
 }
}

async function queryUser(json) {
  const groupDB = await db('ban-users')
        .where(json)
        .first()
  
  return groupDB;
}

async function deletarBan(id_user) {
  
  const groupDB = await db('ban-users')
        .where({id_username: id_user}).del()
  
  return groupDB;
}

async function listBanUsers() {
  const groupDB = await db('ban-users')        
  
  return groupDB;
}

module.exports = { salvarBanUser, queryUser, deletarBan, listBanUsers }