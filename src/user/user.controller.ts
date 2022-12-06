import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto, RegisterDto } from './dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.userService.register(dto);
  }
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.userService.login(dto);
  }
}
