# common notes

1. see mikro-orm.config.ts

    ```ts
    const orm = await MikroORM.init(mikroOrmConfig);
    ```

   1. as const
      we use `'postgresql'` as value of `type`，typescript tread this as string. But in the type declaration, the type was set to `'postgresql'|'sqlite'|....`. Passing string will cause some errors.

      ```ts
      export default {
        dbName: 'lireddit',
        type: 'postgresql',
        debug: !__prod__,
        entities: [Post],
        migrations: {
          path: path.join(__dirname, './migrations'),
          pattern: /^[\w-]+\d+\.[tj]s$/,
        },
      } as const;
      ```

   2. as `Parameters<typeof MikroORM.init>[0]`
      Since this configuration is consumed by `MikroORM.init`, we can get the type which should be passed like this. This will give us auto code completion.

      ```ts
      export default {
        dbName: 'lireddit',
        type: 'postgresql',
        debug: !__prod__,
        entities: [Post],
        migrations: {
          path: path.join(__dirname, './migrations'),
          pattern: /^[\w-]+\d+\.[tj]s$/,
        },
      } as Parameters<typeof MikroORM.init>[0];
      ```

2. add new type to req.session
    If we write something like this `req.session.userId = user.id;`, it will give a error, because there is no `userId` in the `req.session`. The type of `req.session` is set by other libraries, so we need declaration merging to add new types into it. We can write declaration merging like the following code in the file where session is used. The type will be merged into the original type automatically.

    ```ts
    // resolver/user.ts
    declare module 'express-session' {
      interface Session {
        userId: number;
      }
    }
    ```
