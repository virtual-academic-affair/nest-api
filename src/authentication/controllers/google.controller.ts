import { Body, Controller, Get, Post } from '@nestjs/common';
import { CodeDto } from '@authentication/dtos/google/code.dto';
import { GoogleService } from '@authentication/services/google.service';

@Controller('authentication/google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get()
  getGoogleUrl() {
    return this.googleService.generateAuthUrl();
  }

  @Post()
  authenticate(@Body() dto: CodeDto) {
    return this.googleService.authenticate(dto);
  }
}
