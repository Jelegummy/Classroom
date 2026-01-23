import { Body, Controller, HttpStatus, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SchoolPublicService } from "./public.service";
import { SchoolPublicDto } from "./public.dto";

@ApiTags('School')
@Controller('school/public')
export class SchoolPublicController {
    constructor(private readonly service: SchoolPublicService) { }

    // @Post('/')
    // async createSchool(@Body() args: SchoolPublicDto) {
    //     await this.service.createSchool(args);

    //     return { statusCode: HttpStatus.CREATED }
    // }
}

//Not used yet