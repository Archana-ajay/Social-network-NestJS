import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from '../../user/schema/user.schema';

export type PostDocument = mongoose.HydratedDocument<Post>;

@Schema()
export class Post {
  @Prop()
  description: string;

  @Prop()
  image: string;

  @Prop()
  user: string;

  @Prop({ type: Date })
  date: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  postedBy: User;
}

export const PostSchema = SchemaFactory.createForClass(Post);
