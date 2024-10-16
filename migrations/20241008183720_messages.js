
exports.up = function(knex) {
  return knex.schema.createTable('messages', table => {
    table.increments('id').primary()
    table.dateTime('created_at')
       .notNullable()
       .defaultTo(knex.raw('CURRENT_TIMESTAMP'))
    table.dateTime('updated_at')
       .notNullable()
       .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))   
    table.string('chat_id')
    table.string('message_id')
  }).then( result =>console.log(result))
  .catch(err=>console.log(err))
};


exports.down = function(knex) {
  return knex.schema.dropTableIfExists('messages');
};
