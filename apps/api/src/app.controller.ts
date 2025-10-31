import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "API root endpoint" })
  getRoot() {
    return {
      message: "WiserPin API",
      version: "0.0.1",
      docs: "/api",
    };
  }

  @Get("health")
  @ApiOperation({ summary: "Health check endpoint" })
  getHealth() {
    return this.appService.getHealth();
  }
}
