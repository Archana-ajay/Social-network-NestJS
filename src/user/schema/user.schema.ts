import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  name: string;

  @Prop({ unique: true })
  username: string;

  @Prop({ unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop({ default: ' ' })
  url: string;

  @Prop({ default: 'default.png' })
  image: string;

  @Prop({ default: ' ' })
  desciption: string;

  @Prop()
  posts: string[];

  @Prop()
  followers: string[];

  @Prop()
  following: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
