import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PaginationParams, updateDto } from './dto';
import { GetUser } from 'src/user/decorator';
import { JwtGuard } from 'src/user/guard';
import { postDto } from './dto';
import { PostService } from './post.service';
import { of } from 'rxjs';
import { join } from 'path';

//image folder and name
export const storage = {
  storage: diskStorage({
    destination: './uploads/posts',
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

@UseGuards(JwtGuard)
@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}
  //get all posts
  @Get()
  getAllPosts(
    @GetUser('_id') userId: number,
    @Query() { page, limit }: PaginationParams,
  ) {
    return this.postService.getAllPost(userId, page, limit);
  }
  //create post
  @UseInterceptors(FileInterceptor('image', storage))
  @Post('create')
  uploadFileAndPassValidation(
    @Body() dto: postDto,
    @GetUser('_id') userId: number,
    @GetUser('username') user: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'jpeg',
        })
        .build({
          fileIsRequired: false,
        }),
    )
    image?: Express.Multer.File,
  ) {
    return this.postService.createPost(image, dto, userId, user);
  }
  //get one post
  @Get('/:id')
  getPostById(@GetUser('_id') userId: number, @Param('id') postId: number) {
    return this.postService.getPostById(userId, postId);
  }
  //update the post
  @Patch('/:id')
  updatePostById(
    @GetUser('_id') userId: number,
    @Param('id') postId: number,
    @Body() dto: updateDto,
  ) {
    return this.postService.updatePostById(userId, postId, dto);
  }
  //delete the post
  @Delete('/:id')
  deletePostById(@GetUser('_id') userId: number, @Param('id') postId: number) {
    return this.postService.deletePostById(userId, postId);
  }
  //view image
  @Get('image/:imagename')
  async findProfileImage(
    @Param('imagename') imagename,
    @Res() res,
  ): Promise<any> {
    return of(res.sendFile(join(process.cwd(), 'uploads/posts/' + imagename)));
  }
}
