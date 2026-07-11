import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, resolve } from 'path';
import { mkdirSync } from 'fs';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActivitiesService } from './activities.service';
import {
  CreateActivityDto,
  CreateActivityQuestionDto,
  GradeSubmissionDto,
  QueryActivitiesDto,
  ReturnSubmissionDto,
  SaveSubmissionDto,
  UpdateActivityDto,
  UpdateActivityQuestionDto,
} from './dto';

const privateUploadDirectory = resolve(
  process.env.PRIVATE_UPLOAD_DIR || resolve(process.cwd(), 'private-uploads'),
  'activity-submissions',
);
const allowedUploadMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Post()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Criar atividade em rascunho' })
  create(@Body() dto: CreateActivityDto, @Request() req: AuthenticatedRequest) {
    return this.activities.create(dto, req.user);
  }

  @Get('teacher')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Listar atividades gerenciadas pelo professor' })
  findTeacher(@Query() query: QueryActivitiesDto, @Request() req: AuthenticatedRequest) {
    return this.activities.findTeacherActivities(req.user, query);
  }

  @Get('my')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Listar atividades publicadas para o aluno' })
  findMine(@Query() query: QueryActivitiesDto, @Request() req: AuthenticatedRequest) {
    return this.activities.findStudentActivities(req.user.id, query);
  }

  @Get('attachments/:attachmentId')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Baixar anexo privado de uma entrega' })
  async downloadAttachment(
    @Param('attachmentId') attachmentId: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const { attachment, stream } = await this.activities.getAttachment(attachmentId, req.user);
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
    );
    res.setHeader('Content-Length', String(attachment.size));
    stream.pipe(res);
  }

  @Get('materials/:materialId')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Baixar material privado da atividade' })
  async downloadMaterial(
    @Param('materialId') materialId: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const { material, stream } = await this.activities.getMaterial(materialId, req.user);
    res.setHeader('Content-Type', material.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(material.originalName)}`,
    );
    res.setHeader('Content-Length', String(material.size));
    stream.pipe(res);
  }

  @Get(':id')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter atividade conforme o perfil autenticado' })
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.activities.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar atividade' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Remover atividade sem entregas' })
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.activities.remove(id, req.user);
  }

  @Post(':id/publish')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Publicar atividade e notificar a turma' })
  publish(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.activities.publish(id, req.user);
  }

  @Post(':id/archive')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Arquivar atividade' })
  archive(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.activities.archive(id, req.user);
  }

  @Post(':id/questions')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Adicionar questão ao questionário' })
  createQuestion(
    @Param('id') id: string,
    @Body() dto: CreateActivityQuestionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.createQuestion(id, dto, req.user);
  }

  @Post(':id/materials')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          mkdirSync(privateUploadDirectory, { recursive: true });
          callback(null, privateUploadDirectory);
        },
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024, files: 5 },
      fileFilter: (_req, file, callback) => callback(null, allowedUploadMimeTypes.has(file.mimetype)),
    }),
  )
  @ApiOperation({ summary: 'Adicionar materiais privados à atividade' })
  uploadMaterials(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.addMaterials(id, files ?? [], req.user);
  }

  @Delete(':id/materials/:materialId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Remover material da atividade' })
  removeMaterial(
    @Param('materialId') materialId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.removeMaterial(materialId, req.user);
  }

  @Patch(':id/questions/:questionId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar questão' })
  updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateActivityQuestionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.updateQuestion(questionId, dto, req.user);
  }

  @Delete(':id/questions/:questionId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Remover questão' })
  removeQuestion(
    @Param('questionId') questionId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.removeQuestion(questionId, req.user);
  }

  @Post(':id/submissions/draft')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Salvar ou criar rascunho da entrega' })
  saveDraft(
    @Param('id') id: string,
    @Body() dto: SaveSubmissionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.saveDraft(id, req.user.id, dto);
  }

  @Post(':id/submissions/submit')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Entregar atividade' })
  submit(
    @Param('id') id: string,
    @Body() dto: SaveSubmissionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.submit(id, req.user.id, dto);
  }

  @Get(':id/submissions/my')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Listar minhas tentativas na atividade' })
  findMySubmissions(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.activities.findMySubmissions(id, req.user.id);
  }

  @Get(':id/submissions')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Listar entregas da atividade' })
  findSubmissions(
    @Param('id') id: string,
    @Query() query: QueryActivitiesDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.findSubmissions(id, req.user, query);
  }

  @Get(':id/submissions/:submissionId')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Abrir uma entrega' })
  findSubmission(
    @Param('submissionId') submissionId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.findSubmission(submissionId, req.user);
  }

  @Patch(':id/submissions/:submissionId/grade')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Corrigir e atribuir nota à entrega' })
  grade(
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.gradeSubmission(submissionId, dto, req.user);
  }

  @Post(':id/submissions/:submissionId/return')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Devolver entrega para o aluno' })
  returnSubmission(
    @Param('submissionId') submissionId: string,
    @Body() dto: ReturnSubmissionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.returnSubmission(submissionId, dto, req.user);
  }

  @Post(':id/submissions/:submissionId/attachments')
  @Roles(Role.ALUNO)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          mkdirSync(privateUploadDirectory, { recursive: true });
          callback(null, privateUploadDirectory);
        },
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024, files: 5 },
      fileFilter: (_req, file, callback) => {
        callback(null, allowedUploadMimeTypes.has(file.mimetype));
      },
    }),
  )
  @ApiOperation({ summary: 'Adicionar anexos privados ao rascunho' })
  uploadAttachments(
    @Param('submissionId') submissionId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.addAttachments(submissionId, files ?? [], req.user.id);
  }

  @Delete(':id/submissions/:submissionId/attachments/:attachmentId')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Remover anexo de um rascunho' })
  removeAttachment(
    @Param('attachmentId') attachmentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.activities.removeAttachment(attachmentId, req.user.id);
  }
}
