import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { MyContext } from '../types';
import isAuth from '../middleware/isAuth';
import { Comment } from '../entities/Comment';

@Resolver(Comment)
export class CommentResolver {
  // get comments
  @Query(() => [Comment])
  async comments(@Arg('postId') postId: number) {
    return Comment.find({
      where: { postId: postId },
      relations: ['creator', 'post'],
    });
  }

  // post comments
  @Mutation(() => Comment)
  @UseMiddleware(isAuth)
  async createComment(
    @Arg('text') text: string,
    @Arg('postId') postId: number,
    @Ctx() { req }: MyContext
  ) {
    const comment = await Comment.create({
      text,
      creatorId: req.session.userId,
      postId: postId,
    }).save();
    return comment;
  }
}
