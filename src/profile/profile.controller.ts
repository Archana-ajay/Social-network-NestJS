import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
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
};

//conrollers
@UseGuards(JwtGuard)
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}
  //get profile
  @Get(':username')
  getProfile(@GetUser('_id') userId: number, @Param('username') user: string) {
    return this.profileService.getProfile(userId, user);
  }
  //edit profile
  @Patch(':username/edit')
  @UseInterceptors(FileInterceptor('image', storage))
  //image uploading
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000000 }),
          new FileTypeValidator({ fileType: 'jpeg' || 'png' }),
        ],
      }),
    )
    image: Express.Multer.File,
    @Body() dto: profileDto,
    @GetUser('_id') userId: number,
    @Param('username') user: string,
  ) {
    return this.profileService.editProfile(image.filename, dto, userId, user);
  }
  //view image
  @Get('/profileimages/:imagename')
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
