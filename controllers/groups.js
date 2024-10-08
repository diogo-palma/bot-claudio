const db = require("../config/db")

async function salvarGrupo(json) {

  const group = {...json}
  let groupDB
  console.log("json",json)
  if (json.id) group.id = json.id  
  try {
    groupDB = await db('groups')
       .where({id_group: group.id_group}).first() 

    if (json.id)  {
      groupDB = await db('groups')
        .where({id: group.id}).first()         
    }  

  } catch (msg) {
    return msg
  }

  try {
    var result = '';
    const query = new Promise( ( resolve, reject ) => {
      console.log("groupDB", groupDB)
       if (groupDB){
          db('groups')
             .update(group)
             .where({id: groupDB.id})
             .then( async ()  => { 
                
                result =  groupDB.id
                resolve();
             })
             .catch(err => { return err})
       }else{
          db('groups')
             .insert(group)            
             .then( async ()  => { 
                const groupDB = await db('groups')
                   .where({id_group: group.id_group}).first()
                console.log(groupDB.id)
                result =  groupDB.id
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

async function queryGroups(json) {
  const groupDB = await db('groups')
        .where(json)
        .orderBy('id', 'asc');
  
  return Array.isArray(groupDB) ? groupDB : [];
}

async function groupByIdUsername(id_remover) {
   const groupDB = await db('groups')
     .where({ id_username: id_remover })
     .first();
 
   return groupDB || {}; 
 }

async function groupById(id_remover) {
   const groupDB = await db('groups')
     .where({ id: id_remover })
     .first();
 
   return groupDB || {}; 
 }

 async function allGroups(limit) {
   const groupDB = await db('groups')
     .orderBy('is_priority', 'desc')
     .orderByRaw('RAND()')
     .limit(limit);
 
   return Array.isArray(groupDB) ? groupDB : [];
 }

 async function allGroups2() {
  const groupDB = await db('groups')

  return Array.isArray(groupDB) ? groupDB : [];
}

async function searchGroups(term) {
      
   const groupDB = await db('groups')
      .whereRaw('nome COLLATE utf8mb4_general_ci LIKE ?', [`%${term}%`])
      .orWhereRaw('LOWER(username) LIKE LOWER(?)', [`%${term}%`])
      .orWhereRaw('LOWER(id_username) LIKE LOWER(?)', [`%${term}%`])
      
   
 
   return Array.isArray(groupDB) ? groupDB : [];
 }

async function deletarGroup(id_group) {
  
  const groupDB = await db('groups')
        .where({id_group: id_group}).del()
  
  return groupDB;
}

module.exports = { salvarGrupo, queryGroups, deletarGroup, allGroups, searchGroups, groupById, groupByIdUsername, allGroups2 };
