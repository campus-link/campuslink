const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'bnfuvfykpblxvmxhzra3-mysql.services.clever-cloud.com',
  user: 'ueqbbytylfviajmw',
  password: 'F6EXr9bTBprzeTO8jG93', // paste actual password
  database: 'bnfuvfykpblxvmxhzra3',
  port: 3306
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL database on Clever Cloud.');
});

module.exports = connection;
