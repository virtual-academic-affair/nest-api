import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CodeDto } from '@authentication/dtos/google/code.dto';
import { GoogleService } from '@authentication/services/google.service';

@Controller('authentication/google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get()
  getGoogleUrl(@Query('redirectUrl') redirectUrl?: string) {
    return this.googleService.generateAuthUrl(redirectUrl);
  }

  @Post()
  authenticate(@Body() dto: CodeDto) {
    return this.googleService.authenticate(dto);
  }
}
