# common notes

1. see mikro-orm.config.ts

    ```ts
    const orm = await MikroORM.init(mikroOrmConfig);
    ```

   1. 为什么要写 as const
      因为type写的是'postgresql'， typescript默认把这个当成字符串，但是类型声明中写的是'postgresql'|'sqlite'|....。传string出现类型错误。所以要加as const

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

   2. `Parameters<typeof MikroORM.init>[0]`是什么
      这个配置是给MikroORM.init使用的。可以通过这个方法来获取MikroORM.init的parameters

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

2. req.session有声明好的类型
    `req.session.userId = user.id;`
    typescript默认报错，因为声明里没有userid
    需要使用declaration merging解决，在当前文件的开头写declaration, 声明会自动合并

    ```ts
    declare module 'express-session' {
      interface Session {
        userId: number;
      }
    }
    ```