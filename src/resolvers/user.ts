import { User } from '../entities/User';
import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { UsernamePasswordInput, UserResponse } from './UsernamePasswordInput';
import { validateRegister } from '../utils/validateRegister';
import { sendEmail } from '../utils/sendEmail';
import { v4 } from 'uuid';

declare module 'express-session' {
  interface Session {
    userId: number;
    isAdmin: Boolean;
  }
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // this is the current user and it's ok to show them their own email
    if (req.session.userId === user.id) {
      return user.email;
    }
    // current user wants to see someone else's email
    return '';
  }

  // used to check whether the user is logged in.
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    return User.findOne(req.session.userId);
  }

  // register new users. Currently, password hashing is disabled since it will cause some errors during development.
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ) {
    const errors = validateRegister(options);
    if (errors) return { errors };
    // const hashPassword = await argon2.hash(options.password);
    const hashPassword = options.password;
    try {
      const user = await User.create({
        username: options.username,
        password: hashPassword,
        email: options.email,
        isAdmin: false,
      }).save();
      // login after register
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;

      return { user };
    } catch (err) {
      console.log('err:' + err);
      if (err.code === '23505') {
        return {
          errors: [
            {
              field: 'username',
              message: 'username already exist',
            },
          ],
        };
      }
      return {
        errors: [
          {
            field: 'user',
            message: 'unknown error',
          },
        ],
      };
    }
  }

  // login
  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ) {
    const user = await User.findOne(
      usernameOrEmail.includes('@')
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    if (!user) {
      return {
        errors: [
          {
            field: 'usernameOrEmail',
            message: "username or email doesn't exist",
          },
        ],
      };
    }
    // const valid = await argon2.verify(user.password, password);
    const valid = user.password === password;

    if (!valid) {
      return {
        errors: [{ field: 'password', message: 'incorrect password' }],
      };
    }
    req.session.userId = user.id;
    req.session.isAdmin = user.isAdmin;
    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }

  // (probably not working, there are some bugs with sending emails) forgot password
  @Mutation(() => Boolean)
  async forgotPassword(
    @Ctx() { redis }: MyContext,
    @Arg('email') email: string
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return true;
    }
    const token = v4();
    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24 * 7
    );
    await sendEmail(
      email,
      `<a href="http://localhost:3000/changePassword/${token}">reset password</a>`
    );

    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: MyContext
  ) {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'length must be greater than 2',
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      };
    }

    const user = await User.findOne(+userId);

    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no longer exists',
          },
        ],
      };
    }

    await User.update(
      { id: +userId },
      // { password: await argon2.hash(newPassword) }
      { password: newPassword }
    );

    await redis.del(key);

    // login after change password
    req.session.userId = user.id;
    req.session.isAdmin = user.isAdmin;

    return { user };
  }
}
