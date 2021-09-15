# sqlite

## Add mock data into sqlite using typeorm

1. run command `npx typeorm migration:create -n FakePosts`
   This will create a blank migration file.

2. Get mock data from mockaroo
   set the format to sql, set the table name to the correct one. Last, download the sql file.

3. modify sql file
   sqlite have different insert style compared to other databases. So we have to modify the sql file.
   Some rules we can use:
   1. replace `INSERT INTO artists (name) VALUES` to blank, then add it at start.

   2. replace `;` to `,`. Don't forget to add `;` in the end.

   sqlite

   ```sql
      INSERT INTO artists (name)
      VALUES
      ("Buddy Rich"),
      ("Candido"),
      ("Charlie Byrd");
   ```

   others

   ```sql
      INSERT INTO artists (name) VALUES ("Buddy Rich");
      INSERT INTO artists (name) VALUES ("Candido");
      INSERT INTO artists (name) VALUES ("Charlie Byrd");
   ```

4. create migration folder and move file into it

5. add configuration in index
   add `await connection.runMigrations();`
   then add `migrations: [path.join(__dirname, './migrations/*')]` in the connection option

6. run npm start and check if there is any error