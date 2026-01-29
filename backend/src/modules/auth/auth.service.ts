import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { GamificationService } from '../gamification/gamification.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private gamificationService: GamificationService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // Verificar conquistas de login
    await this.gamificationService.checkLoginAchievements(user.id);

    return {
      ...tokens,
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const { password, ...result } = user;
    
    const tokens = await this.generateTokens(result);
    await this.updateRefreshToken(result.id, tokens.refresh_token);

    return {
      ...tokens,
      user: result,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findByIdWithTokens(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Token inválido');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshTokenDto.refreshToken,
        user.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Token inválido');
      }

      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refresh_token);

      return tokens;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Por segurança, não revelar se o email existe
      return { message: 'Se o email existir, um link de recuperação será enviado' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await this.usersService.updateResetToken(user.id, hashedToken, expires);

    // TODO: Enviar email com o resetToken
    // Por enquanto, retornar o token (APENAS PARA DESENVOLVIMENTO)
    console.log('Reset token:', resetToken);

    return { 
      message: 'Se o email existir, um link de recuperação será enviado',
      // TODO: Remover em produção
      resetToken: resetToken, 
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken();
    
    if (!user) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const validUsers = [];
    for (const u of user) {
      if (u.resetToken && u.resetTokenExpires) {
        const tokenMatches = await bcrypt.compare(
          resetPasswordDto.token,
          u.resetToken,
        );
        
        if (tokenMatches && u.resetTokenExpires > new Date()) {
          validUsers.push(u);
        }
      }
    }

    if (validUsers.length === 0) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const validUser = validUsers[0];
    await this.usersService.updatePassword(validUser.id, resetPasswordDto.newPassword);
    await this.usersService.clearResetToken(validUser.id);

    return { message: 'Senha alterada com sucesso' };
  }

  async logout(userId: string) {
    await this.usersService.clearRefreshToken(userId);
    return { message: 'Logout realizado com sucesso' };
  }

  private async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedToken);
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}

