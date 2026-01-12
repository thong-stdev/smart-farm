import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface WeatherData {
    temp: number;
    humidity: number;
    description: string;
    icon: string;
    windSpeed: number;
    rain?: number;
}

@Injectable()
export class WeatherService {
    private readonly API_KEY = process.env.OPENWEATHER_API_KEY || '';
    private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

    constructor(private prisma: PrismaService) { }

    /**
     * ดึงข้อมูลสภาพอากาศจาก OpenWeatherMap
     */
    async getWeather(lat: number, lng: number): Promise<WeatherData | null> {
        if (!this.API_KEY) {
            // Return mock data if no API key
            return this.getMockWeather();
        }

        try {
            const url = `${this.BASE_URL}?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=metric&lang=th`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error('Weather API error:', response.status);
                return this.getMockWeather();
            }

            const data = await response.json();

            return {
                temp: Math.round(data.main.temp),
                humidity: data.main.humidity,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                windSpeed: data.wind.speed,
                rain: data.rain?.['1h'] || 0,
            };
        } catch (error) {
            console.error('Weather fetch error:', error);
            return this.getMockWeather();
        }
    }

    /**
     * ดึงข้อมูลสภาพอากาศสำหรับแปลง
     */
    async getWeatherForPlot(plotId: string, userId: string): Promise<WeatherData | null> {
        const plot = await this.prisma.plot.findFirst({
            where: { id: plotId, userId, deletedAt: null },
            select: { lat: true, lng: true },
        });

        if (!plot?.lat || !plot?.lng) {
            return null;
        }

        return this.getWeather(plot.lat, plot.lng);
    }

    /**
     * ดึงข้อมูลสภาพอากาศสำหรับหลายแปลง
     */
    async getWeatherForPlots(userId: string): Promise<Map<string, WeatherData>> {
        const plots = await this.prisma.plot.findMany({
            where: { userId, deletedAt: null },
            select: { id: true, lat: true, lng: true },
        });

        const weatherMap = new Map<string, WeatherData>();

        for (const plot of plots) {
            if (plot.lat && plot.lng) {
                const weather = await this.getWeather(plot.lat, plot.lng);
                if (weather) {
                    weatherMap.set(plot.id, weather);
                }
            }
        }

        return weatherMap;
    }

    /**
     * บันทึก weather snapshot
     */
    async saveWeatherSnapshot(plotId: string, weather: WeatherData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await this.prisma.weatherSnapshot.upsert({
            where: {
                plotId_date: { plotId, date: today },
            },
            update: {
                tempMin: weather.temp,
                tempMax: weather.temp,
                humidity: weather.humidity,
                windSpeed: weather.windSpeed,
                rainMm: weather.rain || 0,
                source: 'openweather',
            },
            create: {
                plotId,
                date: today,
                tempMin: weather.temp,
                tempMax: weather.temp,
                humidity: weather.humidity,
                windSpeed: weather.windSpeed,
                rainMm: weather.rain || 0,
                source: 'openweather',
            },
        });
    }

    /**
     * Mock weather data (ใช้เมื่อไม่มี API key)
     */
    private getMockWeather(): WeatherData {
        return {
            temp: 28 + Math.floor(Math.random() * 5),
            humidity: 60 + Math.floor(Math.random() * 20),
            description: 'อากาศแจ่มใส',
            icon: '01d',
            windSpeed: 2 + Math.random() * 3,
            rain: 0,
        };
    }
}
