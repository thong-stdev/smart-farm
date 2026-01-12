import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeatherService } from './weather.service';

@ApiTags('สภาพอากาศ')
@Controller('weather')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WeatherController {
    constructor(private readonly weatherService: WeatherService) { }

    @Get('plot/:plotId')
    @ApiOperation({ summary: 'ดึงข้อมูลสภาพอากาศของแปลง' })
    async getPlotWeather(@Param('plotId') plotId: string, @Request() req: any) {
        const userId = req.user.sub;
        const weather = await this.weatherService.getWeatherForPlot(plotId, userId);

        if (!weather) {
            return {
                success: false,
                message: 'ไม่พบข้อมูลตำแหน่งของแปลง'
            };
        }

        return { success: true, data: weather };
    }

    @Get('plots')
    @ApiOperation({ summary: 'ดึงข้อมูลสภาพอากาศของทุกแปลง' })
    async getAllPlotsWeather(@Request() req: any) {
        const userId = req.user.sub;
        const weatherMap = await this.weatherService.getWeatherForPlots(userId);

        // Convert Map to object
        const weatherData: Record<string, any> = {};
        weatherMap.forEach((value, key) => {
            weatherData[key] = value;
        });

        return { success: true, data: weatherData };
    }

    @Get('location/:lat/:lng')
    @ApiOperation({ summary: 'ดึงข้อมูลสภาพอากาศตามพิกัด' })
    async getWeatherByLocation(
        @Param('lat') lat: string,
        @Param('lng') lng: string
    ) {
        const weather = await this.weatherService.getWeather(
            parseFloat(lat),
            parseFloat(lng)
        );

        if (!weather) {
            return { success: false, message: 'ไม่สามารถดึงข้อมูลสภาพอากาศได้' };
        }

        return { success: true, data: weather };
    }
}
