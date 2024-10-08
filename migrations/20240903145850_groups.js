exports.up = function(knex, Promise){
  return knex.schema.createTable('groups', table => {
      table.increments('id').primary()
      table.dateTime('created_at')
         .notNullable()
         .defaultTo(knex.raw('CURRENT_TIMESTAMP'))
      table.dateTime('updated_at')
         .notNullable()
         .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
      table.string('nome')     
      table.string('id_group')
      table.integer('is_priority').defaultTo(0) 
      table.integer('is_group').defaultTo(0) 
      table.string('username')
      table.string('id_username')
  }).then( result =>console.log(result))
  .catch(err=>console.log(err))
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('groups');
};