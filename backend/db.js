const mysql = require('mysql2/promise');
const con = await mysql.createConnection({ /* ... */ });


const pool = mysql.createPool({
    host: 'localhost',
    user: 'your_mysql_username',
    password: 'your_mysql_password',
    database: 'campuslink'
});

module.exports = pool.promise();
