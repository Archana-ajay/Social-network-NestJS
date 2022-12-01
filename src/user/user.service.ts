import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { LoginDto, RegisterDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwt: JwtService,
    private config: ConfigService,
    private mailService: MailerService,
  ) {}
  async register(dto: RegisterDto) {
    //conform password
    if (dto.password !== dto.password_confirmation) {
      throw new BadRequestException('password not match');
    }
    //generate salt
    const salt = await bcrypt.genSalt();
    //generate hash password
    const hash = await bcrypt.hash(dto.password, salt);
    try {
      const user = new this.userModel({
        email: dto.email,
        name: dto.name,
        username: dto.username,
        password: hash,
      });
      await user.save();
      const message = await this.sendMail(user.email, user.name);
      const token = await this.signToken(user.id, user.email);
      return { name: user.name, email: user.email, token, message };
    } catch (error) {
      if (error.code === 11000) {
        throw new ForbiddenException('Credentials taken');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    // find the user by email
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new ForbiddenException('Credentials incorrect');
    // compare password
    const pwMatches = await bcrypt.compare(dto.password, user.password);
    // if password incorrect throw exception
    if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

    const token = await this.signToken(user.id, user.email);
    return { name: user.name, token, message: 'login successful' };
  }

  //send mail to registered user
  async sendMail(email: string, user: string): Promise<string> {
    await this.mailService.sendMail({
      to: email,
      from: '"ADMIN" <socialnetwork@gmail.com>',
      subject: 'Welcome to Social network',
      html: `<p>Hi, ${user}! </p>
      <p>Welcome to Nest js social network!!!</p>
      <p>Thank you for register to social network</p>
      <p>Login to network and start posting..</p>
      <p>Thank you</p>`,
    });
    const message = `send mail to ${user} successfully`;
    return message;
  }

  //create token
  async signToken(userId: number, email: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');

    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '20d',
      secret: secret,
    });
    return access_token;
  }
}
