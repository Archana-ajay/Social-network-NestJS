import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schema/user.schema';
import { postDto, updateDto } from './dto';
import { Post, PostDocument } from './schema/post.schema';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async createPost(
    image: Express.Multer.File,
    dto: postDto,
    userId: number,
    user: string,
  ) {
    try {
      const post = new this.postModel({
        image: image?.filename,
        description: dto.description,
        date: new Date(),
        postedBy: userId,
        user: user,
      });
      await post.save();
      await this.userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { posts: post._id } },
        { new: true, runValidators: true },
      );
      return {
        _id: post._id,
        image: post.image,
        description: post.description,
        date: post.date,
        postedBy: post.postedBy,
        user: post.user,
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllPost(userId: number, page?: number, limit?: number) {
    const pages = page || 1;
    const limits = limit || 5;
    const skips = (pages - 1) * limits;
    const posts = this.postModel
      .find({ postedBy: userId }, { __v: 0 })
      .skip(skips)
      .limit(limits);
    return posts;
  }

  async getPostById(userId: number, postId: number) {
    const post = await this.postModel.findOne(
      {
        _id: postId,
        postedBy: userId,
      },
      { __v: 0 },
    );
    if (!post) {
      throw new NotFoundException(`No post with id ${postId}`);
    }
    return post;
  }

  async updatePostById(userId: number, postId: number, dto: updateDto) {
    const post = await this.postModel.findOneAndUpdate(
      {
        _id: postId,
        postedBy: userId,
      },
      dto,
      { new: true, runValidators: true },
    );
    if (!post) {
      throw new NotFoundException(`No post with id ${postId}`);
    }
    return post;
  }

  async deletePostById(userId: number, postId: number) {
    const post = await this.postModel.findOneAndDelete({
      _id: postId,
      postedBy: userId,
    });
    if (!post) {
      throw new NotFoundException(`No post with id ${postId}`);
    }
    await this.userModel.findOneAndUpdate(
      { _id: userId },
      { $pull: { posts: post._id } },
      { new: true, runValidators: true },
    );
    return post;
  }
}
