import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { profileDto } from './dto';
import { Post, PostDocument } from 'src/post/schema/post.schema';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async editProfile(
    image: Express.Multer.File,
    dto: profileDto,
    userId: number,
    user: string,
  ) {
    try {
      const updateUser = await this.userModel.findOneAndUpdate(
        { username: user, _id: userId },
        {
          image: image.filename,
          desciption: dto.description,
          url: `/uploads/profileimages/${image.filename}`,
        },
        { new: true, runValidators: true },
      );
      if (!updateUser) throw new NotFoundException('user not found');
      return {
        message: 'updated successfully',
        username: updateUser.username,
        image: updateUser.image,
        description: updateUser.desciption,
        url: updateUser.url,
      };
    } catch (error) {
      throw error;
    }
  }

  async getProfile(userId: number, user: string) {
    const findUser = await this.userModel.findOne(
      {
        username: user,
        _id: userId,
      },
      { password: 0, __v: 0 },
    );
    if (!findUser) throw new NotFoundException('user not found');
    const userPosts = await this.postModel
      .find({ _id: { $in: findUser.posts } })
      .sort({ date: -1 });
    return { user: findUser, posts: userPosts };
  }

  async followProfile(userId: number, id: number) {
    const findUser = await this.userModel.findOne({ _id: id });
    if (!findUser) throw new NotFoundException('user not found');
    if (findUser.followers.includes(id as unknown as string)) {
      throw new BadRequestException('Already following the user');
    }
    await this.userModel.findByIdAndUpdate(
      { _id: id },
      { $push: { followers: id } },
      { new: true, runValidators: true },
    );
    const userProfile = await this.userModel.findByIdAndUpdate(
      { _id: userId },
      { $push: { following: id } },
      { new: true, runValidators: true },
    );
    return {
      username: userProfile.username,
      name: userProfile.name,
      image: userProfile.image,
      description: userProfile.desciption,
      posts: userProfile.posts,
      followers: userProfile.followers.length,
      following: userProfile.following.length,
    };
  }

  async unfollowProfile(userId: number, id: number) {
    const findUser = await this.userModel.findOne({ _id: id });
    if (!findUser) throw new NotFoundException('user not found');
    if (!findUser.followers.includes(id as unknown as string)) {
      throw new BadRequestException('Already unfollowing the user');
    }
    await this.userModel.findByIdAndUpdate(
      { _id: id },
      { $pull: { followers: id } },
      { new: true, runValidators: true },
    );
    const userProfile = await this.userModel.findByIdAndUpdate(
      { _id: userId },
      { $pull: { following: id } },
      { new: true, runValidators: true },
    );
    return {
      username: userProfile.username,
      name: userProfile.name,
      image: userProfile.image,
      description: userProfile.desciption,
      posts: userProfile.posts,
      followers: userProfile.followers.length,
      following: userProfile.following.length,
    };
  }
}
