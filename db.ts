import mysql from 'mysql2';
//import mariadb from 'mariadb';

export const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "thomas",
  password: "password",
  database: "myIRC",
  port: 3306
});