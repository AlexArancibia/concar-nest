import { Module } from "@nestjs/common"
import { PrismaModule } from "./prisma/prisma.module"
import { AuthModule } from "./auth/auth.module"
import { MulterModule } from "@nestjs/platform-express"
import { join } from "path"
import { FILE_UPLOADS_DIR } from "lib/constants"
import { ServeStaticModule } from "@nestjs/serve-static"
import { ConfigModule } from "@nestjs/config"
import { EmailModule } from "./email/email.module"
 

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "files"), // Asegúrate de que la carpeta sea correcta
      serveRoot: "/uploads", // La URL base para acceder a las imágenes
    }),
    PrismaModule,
    AuthModule,
    MulterModule.register({
      dest: FILE_UPLOADS_DIR,
      limits: {
        fileSize: 1000 * 1000 * 10, // 10MB
      },
    }),
 
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    EmailModule,
  ],
})
export class AppModule {}
