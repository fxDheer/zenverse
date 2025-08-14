module.exports = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || 5000,
  
  // MongoDB Atlas Connection String (you'll need to create this)
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://your_username:your_password@your_cluster.mongodb.net/zenverse?retryWrites=true&w=majority',
  
  // JWT Secret (change this to a strong secret)
  JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production',
  
  // CORS Origins (your frontend domain)
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://your-frontend-domain.onrender.com',
  
  // File Upload Settings
  UPLOAD_PATH: './uploads',
  MAX_FILE_SIZE: 5242880
};
