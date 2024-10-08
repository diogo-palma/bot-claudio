exports.up = function(knex, Promise){
  return knex.schema.createTable('ban-users', table => {
      table.increments('id').primary()
      table.dateTime('created_at')
         .notNullable()
         .defaultTo(knex.raw('CURRENT_TIMESTAMP'))
      table.dateTime('updated_at')
         .notNullable()
         .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))   
      table.string('username')
      table.string('id_username')
  }).then( result =>console.log(result))
  .catch(err=>console.log(err))
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ban-users');
};