import { Body, Controller, Post } from '@nestjs/common';
import type { LoginPayload, LoginResponse } from './login.types';
import { LoginService } from './login.service';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  login(@Body() credentials: LoginPayload): Promise<LoginResponse> {
    return this.loginService.login(credentials);
  }
}
