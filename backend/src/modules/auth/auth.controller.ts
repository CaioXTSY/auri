import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Registrar novo usuário',
    description: 'Cria uma nova conta de usuário. O role padrão é ALUNO.'
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      aluno: {
        summary: 'Registrar como aluno',
        value: {
          name: 'João Silva',
          email: 'joao@example.com',
          password: 'Senha@123',
          role: 'ALUNO'
        }
      },
      professor: {
        summary: 'Registrar como professor',
        value: {
          name: 'Maria Santos',
          email: 'maria@example.com',
          password: 'Senha@456',
          role: 'PROFESSOR'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuário registrado com sucesso',
    schema: {
      example: {
        user: {
          id: 'uuid-here',
          name: 'João Silva',
          email: 'joao@example.com',
          role: 'ALUNO',
          avatar: null,
          createdAt: '2024-01-26T00:00:00.000Z'
        },
        accessToken: 'jwt-token-here',
        refreshToken: 'refresh-token-here'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'Login de usuário',
    description: 'Autentica usuário com email e senha, retornando tokens JWT'
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      login: {
        summary: 'Login de usuário',
        value: {
          email: 'joao@example.com',
          password: 'Senha@123'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        user: {
          id: 'uuid-here',
          name: 'João Silva',
          email: 'joao@example.com',
          role: 'ALUNO'
        },
        accessToken: 'jwt-token-here',
        refreshToken: 'refresh-token-here'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: 'Renovar access token',
    description: 'Gera novo access token usando refresh token válido'
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      refresh: {
        summary: 'Renovar token',
        value: {
          refreshToken: 'refresh-token-here'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token renovado com sucesso',
    schema: {
      example: {
        accessToken: 'new-jwt-token-here',
        refreshToken: 'new-refresh-token-here'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('forgot-password')
  @ApiOperation({ 
    summary: 'Solicitar recuperação de senha',
    description: 'Envia email com token para redefinição de senha'
  })
  @ApiBody({
    type: ForgotPasswordDto,
    examples: {
      forgot: {
        summary: 'Solicitar reset',
        value: {
          email: 'joao@example.com'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email de recuperação enviado',
    schema: {
      example: {
        message: 'If email exists, password reset instructions have been sent'
      }
    }
  })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ 
    summary: 'Redefinir senha',
    description: 'Redefine senha usando token recebido por email'
  })
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      reset: {
        summary: 'Redefinir senha',
        value: {
          token: 'reset-token-from-email',
          newPassword: 'NovaSenha@123'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Senha redefinida com sucesso',
    schema: {
      example: {
        message: 'Password successfully reset'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Logout de usuário',
    description: 'Invalida refresh token do usuário'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout realizado com sucesso',
    schema: {
      example: {
        message: 'Logged out successfully'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }
}
