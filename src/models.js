const Sequelize = require('sequelize');

let sequelize, db_env;
if(process.env.DATABASE_URL) {
  db_env = 'Production';
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: true
    },
    logging: false,
  });
} else {
  db_env = 'Development';
  sequelize = new Sequelize({
    password: null,
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false,
  });
}

const models = {};

models.Users = sequelize.define('users', {
  displayname:         { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  username:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  phone:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  email:               { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  password:            { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  paypal:              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  bio:                 { type: Sequelize.STRING(250), allowNull: true, defaultValue: '' },
  icon_link:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  icon_id:             { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  wallpaper:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  location:            { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  link:                { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  verified:            { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  confirmed:           { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  public:              { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  group:               { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'user',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.UserRatings = sequelize.define('user_ratings', {
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  writer_id:      { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  rating:          { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
  title:           { type: Sequelize.STRING(250), allowNull: true, defaultValue: '' },
  summary:         { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_link:      { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:        { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'user_rating',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.Follows = sequelize.define('follows', {
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  follows_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'follow',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.FollowRequests = sequelize.define('follow_requests', {
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  follows_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'follow_request',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.Recipes = sequelize.define('recipes', {
  creator_id:                  { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  title:                       { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  desc:                        { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
  tags:                        { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
  ingredients:                 { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
  image_link:                  { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:                    { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:                { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                        { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'recipe',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.RecipeLikes = sequelize.define('recipe_likes', {
  recipe_id:       { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Recipes, key: 'id' } },
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'recipe_like',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.RecipeComments = sequelize.define('recipe_comments', {
  recipe_id:       { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Recipes, key: 'id' } },
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  body:            { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
  image_link:      { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:        { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'recipe_comment',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.CommentLikes = sequelize.define('comment_likes', {
  comment_id:      { type: Sequelize.INTEGER, allowNull: false, references: { model: models.RecipeComments, key: 'id' } },
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'comment_like',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.RecipePictures = sequelize.define('recipe_pictures', {
  recipe_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Recipes, key: 'id' } },
  caption:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_link:        { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  image_id:          { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  date_created:      { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:              { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'recipe_picture',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.CookRequests = sequelize.define('cook_requests', {
  recipe_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Recipes, key: 'id' } },
  customer_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  chef_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'cook_request',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.CookRequestUpdates = sequelize.define('cook_request_updates', {
  recipe_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Recipes, key: 'id' } },
  chef_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  message:           { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  icon_link:         { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  icon_id:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:      { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:              { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'cook_request_update',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.CookRequestUpdatePictures = sequelize.define('cook_request_update_pictures', {
  update_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: models.CookRequestUpdates, key: 'id' } },
  caption:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_link:        { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  image_id:          { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  date_created:      { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:              { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'cook_request_update_picture',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.CookRequestDisputes = sequelize.define('cook_request_disputes', {
  recipe_id:       { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Recipes, key: 'id' } },
  user_id:         { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } }, // the user who opened the dispute
  status:          { type: Sequelize.STRING, allowNull: false, defaultValue: 'OPEN' },
  resolution:      { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  image_link:      { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:        { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  title:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:            { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'cook_request_dispute',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.CookRequestDisputePictures = sequelize.define('cook_request_dispute_pictures', {
  dispute_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: models.CookRequestDisputes, key: 'id' } },
  caption:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_link:        { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  image_id:          { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  date_created:      { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:              { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'cook_request_dispute_picture',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.DisputeLogs = sequelize.define('dispute_logs', {
  dispute_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: models.CookRequestDisputes, key: 'id' } },
  user_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  message:           { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  image_link:        { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:          { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:      { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:              { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'dispute_log',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.DisputeLogPictures = sequelize.define('dispute_log_pictures', {
  dispute_log_id:    { type: Sequelize.INTEGER, allowNull: false, references: { model: models.DisputeLogs, key: 'id' } },
  caption:           { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_link:        { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  image_id:          { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  date_created:      { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:              { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'dispute_log_picture',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.Notifications = sequelize.define('notifications', {
  from_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  to_id:               { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  action:              { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  target_type:         { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  target_id:           { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  message:             { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
  link:                { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  read:                { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  image_link:          { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  image_id:            { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'notification',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.Conversations = sequelize.define('conversations', {
  creator_id:        { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  date_created:      { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:              { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'conversation',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.ConversationMembers = sequelize.define('conversation_members', {
  conversation_id:   { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Conversations, key: 'id' } },
  user_id:           { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  date_created:      { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:              { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'conversation_member',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.ConversationMessages = sequelize.define('conversation_messages', {
  conversation_id:    { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Conversations, key: 'id' } },
  user_id:            { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  body:               { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  opened:             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'conversation_message',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.MessageSenders = sequelize.define('message_senders', {
  user_id:            { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  sender_id:          { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'message_sender',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.Messages = sequelize.define('messages', {
  from_id:            { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  to_id:              { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  body:               { type: Sequelize.STRING(500), allowNull: true, defaultValue: '' },
  opened:             { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  date_created:       { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  uuid:               { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'message',
  indexes: [{ unique: true, fields: ['uuid'] }]
});

models.Tokens = sequelize.define('tokens', {
  user_id:             { type: Sequelize.INTEGER, allowNull: false, references: { model: models.Users, key: 'id' } },
  device:              { type: Sequelize.STRING(500), allowNull: false, unique: true },
  token:               { type: Sequelize.STRING(500), allowNull: false, unique: true },
  ip_address:          { type: Sequelize.STRING(500), allowNull: false },
  user_agent:          { type: Sequelize.STRING(500), allowNull: false },
  date_created:        { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  date_last_used:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
  uuid:                { type: Sequelize.STRING, defaultValue: Sequelize.UUIDV1 }
}, {
  freezeTableName: true,
  underscored: true,
  modelName: 'token',
  indexes: [{ unique: true, fields: ['uuid'] }]
});



models.Users.hasMany(models.UserRatings, { as: 'user_reviews_received', foreignKey: 'user_id', sourceKey: 'id' });
models.Users.hasMany(models.UserRatings, { as: 'user_reviews_written', foreignKey: 'writer_id', sourceKey: 'id' });
models.UserRatings.belongsTo(models.Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });
models.UserRatings.belongsTo(models.Users, { as: 'writer', foreignKey: 'writer_id', targetKey: 'id' });

models.Users.hasMany(models.Recipes, { as: 'user_recipes', foreignKey: 'creator_id', sourceKey: 'id' });
models.Users.hasMany(models.Recipes, { as: 'user_helping', foreignKey: 'helper_id', sourceKey: 'id' });
models.Recipes.belongsTo(models.Users, { as: 'creator', foreignKey: 'creator_id', targetKey: 'id' });
models.Recipes.belongsTo(models.Users, { as: 'helper', foreignKey: 'helper_id', targetKey: 'id' });

models.Users.hasMany(models.CookRequests, { as: 'user_cook_requests', foreignKey: 'user_id', sourceKey: 'id' });
models.CookRequests.belongsTo(models.Users, { as: 'user', foreignKey: 'user_id', targetKey: 'id' });

models.Recipes.hasMany(models.CookRequests, { as: 'recipe_cook_requests', foreignKey: 'recipe_id', sourceKey: 'id' });
models.CookRequests.belongsTo(models.Recipes, { as: 'recipe', foreignKey: 'recipe_id', targetKey: 'id' });

models.Users.hasMany(models.Notifications, { as: 'user_to_notifications', foreignKey: 'to_id', sourceKey: 'id' });
models.Notifications.belongsTo(models.Users, { as: 'recipient', foreignKey: 'to_id', targetKey: 'id' });

models.Users.hasMany(models.Notifications, { as: 'user_from_notifications', foreignKey: 'from_id', sourceKey: 'id' });
models.Notifications.belongsTo(models.Users, { as: 'sender', foreignKey: 'from_id', targetKey: 'id' });

models.Users.hasMany(models.Messages, { as: 'user_messages', foreignKey: 'to_id', sourceKey: 'id' });
models.Messages.belongsTo(models.Users, { as: 'user', foreignKey: 'to_id', targetKey: 'id' });

models.Conversations.hasMany(models.ConversationMembers, { as: 'conversation_members', foreignKey: 'conversation_id', sourceKey: 'id' });
models.ConversationMembers.belongsTo(models.Conversations, { as: 'conversation', foreignKey: 'conversation_id', targetKey: 'id' });

models.Conversations.hasMany(models.ConversationMessages, { as: 'conversation_messages', foreignKey: 'conversation_id', sourceKey: 'id' });
models.ConversationMessages.belongsTo(models.Conversations, { as: 'conversation', foreignKey: 'conversation_id', targetKey: 'id' });



sequelize.sync({ force: false })
.then(() => { console.log('Database Initialized! ENV: ' + db_env); })
.catch((error) => { console.log('Database Failed!', error); });

module.exports = {
  sequelize,
  models
}
