import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { profileDto } from './dto';
import { GetUser } from 'src/user/decorator';
import { ProfileService } from './profile.service';
import { JwtGuard } from 'src/user/guard';
import { of } from 'rxjs';
import { join } from 'path';

//image folder and name
export const storage = {
  storage: diskStorage({
    destination: './uploads/profileimages',
    filename: (req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}_${file.originalname}`);
    },
  }),
  fileFilter: (req: Request, file, cb) => {
    if (!file.mimetype.startsWith('image')) {
      return cb(new BadRequestException('please upload an image'), false);
    }
    return cb(null, true);
  },
};

//conrollers
@UseGuards(JwtGuard)
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}
  //get all profile
  @Get(':username')
  getProfile(@GetUser('_id') userId: number, @Param('username') user: string) {
    return this.profileService.getProfile(userId, user);
  }
  //edit profile
  @UseInterceptors(FileInterceptor('image', storage))
  @Patch(':username/edit')
  uploadFileAndPassValidation(
    @Body() dto: profileDto,
    @GetUser('_id') userId: number,
    @Param('username') user: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'jpeg',
        })
        .build({
          fileIsRequired: true,
        }),
    )
    image: Express.Multer.File,
  ) {
    return this.profileService.editProfile(image, dto, userId, user);
  }
  //view image
  @Get('/image/:imagename')
  async findProfileImage(
    @Param('imagename') imagename,
    @Res() res,
  ): Promise<any> {
    return of(
      res.sendFile(join(process.cwd(), 'uploads/profileimages/' + imagename)),
    );
  }
  //follow the user
  @Get('follow/:id')
  followProfile(@GetUser('_id') userId: number, @Param('id') id: number) {
    return this.profileService.followProfile(userId, id);
  }
  //unfollow the user
  @Get('unfollow/:id')
  unfollowProfile(@GetUser('_id') userId: number, @Param('id') id: number) {
    return this.profileService.unfollowProfile(userId, id);
  }
}
