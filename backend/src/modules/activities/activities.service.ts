import { awardOnce, lockRewardUser } from '../gamification/reward-store';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityStatus,
  ActivityType,
  NotificationType,
  Prisma,
  QuestionType,
  Role,
  SubmissionStatus,
} from '@prisma/client';
import { createReadStream, existsSync, readFileSync, unlinkSync } from 'fs';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GamificationService } from '../gamification/gamification.service';
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

type Actor = { id: string; role: Role };

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly gamification: GamificationService,
  ) {}

  async create(dto: CreateActivityDto, actor: Actor) {
    await this.ensureCanManageClass(dto.classId, actor);
    this.validateTypeConfiguration(dto.type, dto);

    return this.prisma.activity.create({
      data: {
        classId: dto.classId,
        createdById: actor.id,
        type: dto.type,
        title: dto.title.trim(),
        description: dto.description.trim(),
        maxScore: dto.maxScore ?? 100,
        xpReward: dto.xpReward ?? 0,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        allowLateSubmissions: dto.allowLateSubmissions ?? false,
        allowResubmission: dto.allowResubmission ?? false,
        maxAttempts: dto.maxAttempts ?? 1,
        allowedFileTypes: dto.allowedFileTypes ?? undefined,
        maxFileSize: dto.maxFileSize ?? 10 * 1024 * 1024,
        maxFiles: dto.maxFiles ?? 5,
        showResultsImmediately: dto.showResultsImmediately ?? false,
      },
      include: { class: true, questions: { include: { options: true } } },
    });
  }

  async update(id: string, dto: UpdateActivityDto, actor: Actor) {
    const activity = await this.getManagedActivity(id, actor);
    if (activity.status === ActivityStatus.ARCHIVED) {
      throw new BadRequestException('Atividade arquivada não pode ser alterada');
    }
    if (dto.classId && dto.classId !== activity.classId) {
      await this.ensureCanManageClass(dto.classId, actor);
    }
    this.validateTypeConfiguration(dto.type ?? activity.type, dto);

    return this.prisma.activity.update({
      where: { id },
      data: {
        classId: dto.classId,
        type: dto.type,
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        maxScore: dto.maxScore,
        xpReward: dto.xpReward,
        dueDate: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
        allowLateSubmissions: dto.allowLateSubmissions,
        allowResubmission: dto.allowResubmission,
        maxAttempts: dto.maxAttempts,
        allowedFileTypes: dto.allowedFileTypes,
        maxFileSize: dto.maxFileSize,
        maxFiles: dto.maxFiles,
        showResultsImmediately: dto.showResultsImmediately,
      },
      include: { class: true, questions: { include: { options: true } } },
    });
  }

  async publish(id: string, actor: Actor) {
    const activity = await this.getManagedActivity(id, actor);
    await this.validatePublishable(activity.id, activity.type);
    const updated = await this.prisma.activity.update({
      where: { id },
      data: { status: ActivityStatus.PUBLISHED },
    });
    const students = await this.prisma.classStudent.findMany({
      where: { classId: activity.classId },
      select: { userId: true },
    });
    await this.notifications.createNotificationsForUsers({
      userIds: students.map((item) => item.userId),
      type: NotificationType.SISTEMA,
      title: 'Nova atividade disponível',
      message: activity.title,
    });
    return updated;
  }

  async archive(id: string, actor: Actor) {
    await this.getManagedActivity(id, actor);
    return this.prisma.activity.update({
      where: { id },
      data: { status: ActivityStatus.ARCHIVED },
    });
  }

  async remove(id: string, actor: Actor) {
    const activity = await this.getManagedActivity(id, actor);
    const submissions = await this.prisma.activitySubmission.count({ where: { activityId: id } });
    if (submissions > 0) {
      throw new BadRequestException('Atividade com entregas deve ser arquivada');
    }
    await this.prisma.activity.delete({ where: { id } });
    return { message: `Atividade ${activity.title} removida` };
  }

  async findTeacherActivities(actor: Actor, query: QueryActivitiesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ActivityWhereInput = {
      ...(actor.role === Role.PROFESSOR ? { class: { createdById: actor.id } } : {}),
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { class: true, _count: { select: { submissions: true, questions: true } } },
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findStudentActivities(userId: string, query: QueryActivitiesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ActivityWhereInput = {
      status: ActivityStatus.PUBLISHED,
      class: { students: { some: { userId } } },
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.submissionStatus
        ? { submissions: { some: { userId, status: query.submissionStatus } } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          class: { select: { id: true, name: true, year: true } },
          submissions: {
            where: { userId },
            orderBy: { attemptNumber: 'desc' },
            take: 1,
            select: { id: true, attemptNumber: true, status: true, score: true, submittedAt: true },
          },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, actor: Actor) {
    if (actor.role === Role.ALUNO) {
      return this.getStudentActivity(id, actor.id);
    }
    return this.getManagedActivity(id, actor, true);
  }

  async createQuestion(activityId: string, dto: CreateActivityQuestionDto, actor: Actor) {
    const activity = await this.getManagedActivity(activityId, actor);
    await this.ensureQuestionsEditable(activityId);
    this.validateQuestion(activity.type, dto.type, dto.options);
    return this.prisma.activityQuestion.create({
      data: {
        activityId,
        type: dto.type,
        prompt: dto.prompt.trim(),
        points: dto.points,
        position: dto.position,
        options: dto.options ? { create: dto.options } : undefined,
      },
      include: { options: { orderBy: { position: 'asc' } } },
    });
  }

  async updateQuestion(questionId: string, dto: UpdateActivityQuestionDto, actor: Actor) {
    const question = await this.prisma.activityQuestion.findUnique({
      where: { id: questionId },
      include: { activity: true },
    });
    if (!question) throw new NotFoundException('Questão não encontrada');
    await this.getManagedActivity(question.activityId, actor);
    await this.ensureQuestionsEditable(question.activityId);
    this.validateQuestion(question.activity.type, dto.type ?? question.type, dto.options);
    return this.prisma.$transaction(async (tx) => {
      if (dto.options) await tx.questionOption.deleteMany({ where: { questionId } });
      return tx.activityQuestion.update({
        where: { id: questionId },
        data: {
          type: dto.type,
          prompt: dto.prompt?.trim(),
          points: dto.points,
          position: dto.position,
          options: dto.options ? { create: dto.options } : undefined,
        },
        include: { options: { orderBy: { position: 'asc' } } },
      });
    });
  }

  async removeQuestion(questionId: string, actor: Actor) {
    const question = await this.prisma.activityQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Questão não encontrada');
    await this.getManagedActivity(question.activityId, actor);
    await this.ensureQuestionsEditable(question.activityId);
    await this.prisma.activityQuestion.delete({ where: { id: questionId } });
    return { message: 'Questão removida' };
  }

  async saveDraft(activityId: string, userId: string, dto: SaveSubmissionDto) {
    const activity = await this.getStudentActivity(activityId, userId);
    this.ensureGenericSubmissionType(activity.type);
    const draft = await this.getOrCreateDraft(activity, userId);
    await this.validateAndSaveAnswers(this.prisma, activityId, draft.id, dto.answers ?? []);
    return this.prisma.activitySubmission.update({
      where: { id: draft.id },
      data: { textAnswer: dto.textAnswer },
      include: { attachments: true, answers: true },
    });
  }

  async submit(activityId: string, userId: string, dto: SaveSubmissionDto) {
    const activity = await this.getStudentActivity(activityId, userId);
    this.ensureGenericSubmissionType(activity.type);
    const draft = await this.getOrCreateDraft(activity, userId);
    const late = Boolean(activity.dueDate && activity.dueDate < new Date());
    if (late && !activity.allowLateSubmissions) {
      throw new BadRequestException('Prazo da atividade encerrado');
    }
    await this.validateSubmissionContent(activity, draft.id, dto);

    const submission = await this.prisma.$transaction(async (tx) => {
      await this.validateAndSaveAnswers(tx, activityId, draft.id, dto.answers ?? []);
      return tx.activitySubmission.update({
        where: { id: draft.id },
        data: {
          textAnswer: dto.textAnswer,
          status: late ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
          submittedAt: new Date(),
        },
        include: { attachments: true, answers: true },
      });
    });

    await this.notifications.createNotification({
      userId: activity.createdById,
      type: NotificationType.SISTEMA,
      title: 'Nova entrega recebida',
      message: activity.title,
    });

    const canAutoGrade = activity.type === ActivityType.QUIZ
      && activity.showResultsImmediately
      && activity.questions.every((question) => question.type !== QuestionType.SHORT_ANSWER);
    if (canAutoGrade) {
      const score = submission.answers.reduce((total, answer) => total + (answer.score ?? 0), 0);
      return this.gradeSubmission(
        submission.id,
        { score },
        { id: activity.createdById, role: Role.ADMIN },
      );
    }
    return submission;
  }

  async findMySubmissions(activityId: string, userId: string) {
    await this.getStudentActivity(activityId, userId);
    const submissions = await this.prisma.activitySubmission.findMany({
      where: { activityId, userId },
      orderBy: { attemptNumber: 'desc' },
      include: {
        activity: { select: { showResultsImmediately: true } },
        attachments: true,
        answers: {
          include: {
            question: true,
            selectedOption: { select: { id: true, text: true, position: true } },
          },
        },
      },
    });
    return submissions.map((submission) => ({
      ...submission,
      answers: submission.answers.map((answer) => ({
        ...answer,
        score:
          submission.status === SubmissionStatus.GRADED
          || submission.activity.showResultsImmediately
            ? answer.score
            : null,
      })),
    }));
  }

  async findSubmissions(activityId: string, actor: Actor, query: QueryActivitiesDto) {
    await this.getManagedActivity(activityId, actor);
    const where: Prisma.ActivitySubmissionWhereInput = {
      activityId,
      ...(query.submissionStatus ? { status: query.submissionStatus } : {}),
    };
    return this.prisma.activitySubmission.findMany({
      where,
      orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        attachments: true,
        answers: { include: { question: true, selectedOption: true } },
      },
    });
  }

  async findSubmission(submissionId: string, actor: Actor) {
    const submission = await this.prisma.activitySubmission.findUnique({
      where: { id: submissionId },
      include: {
        activity: { include: { class: true } },
        user: { select: { id: true, name: true, email: true, avatar: true } },
        attachments: true,
        answers: { include: { question: true, selectedOption: true } },
      },
    });
    if (!submission) throw new NotFoundException('Entrega não encontrada');
    if (actor.role === Role.ALUNO && submission.userId !== actor.id) {
      throw new ForbiddenException('Você não pode acessar esta entrega');
    }
    if (actor.role === Role.PROFESSOR && submission.activity.class.createdById !== actor.id) {
      throw new ForbiddenException('Você não pode acessar esta entrega');
    }
    if (actor.role === Role.ALUNO) {
      return {
        ...submission,
        answers: submission.answers.map((answer) => {
          const selectedOption = answer.selectedOption
            ? {
                id: answer.selectedOption.id,
                text: answer.selectedOption.text,
                position: answer.selectedOption.position,
              }
            : null;
          return {
            ...answer,
            selectedOption,
            score:
              submission.status === SubmissionStatus.GRADED
              || submission.activity.showResultsImmediately
                ? answer.score
                : null,
          };
        }),
      };
    }
    return submission;
  }

  async gradeSubmission(submissionId: string, dto: GradeSubmissionDto, actor: Actor) {
    const submission = await this.findSubmission(submissionId, actor);
    if (actor.role === Role.ALUNO) throw new ForbiddenException('Aluno não pode corrigir entrega');
    if (dto.score > submission.activity.maxScore) {
      throw new BadRequestException('Nota não pode ultrapassar a nota máxima');
    }

    let xpToAward = 0;
    const updated = await this.prisma.$transaction(async (tx) => {
      await lockRewardUser(tx, submission.userId);
      const current = await tx.activitySubmission.findUniqueOrThrow({ where: { id: submission.id } });
      xpToAward = dto.score > 0 && current.xpAwarded === 0 ? submission.activity.xpReward : 0;
      if (xpToAward > 0) {
        await awardOnce(tx, {
            userId: submission.userId,
            points: xpToAward,
            source: 'ACTIVITY_GRADE',
            description: `Atividade: ${submission.activity.title}`,
            referenceId: submission.id,
        });
      }
      return tx.activitySubmission.update({
        where: { id: submission.id },
        data: {
          score: dto.score,
          feedback: dto.feedback,
          status: SubmissionStatus.GRADED,
          gradedAt: new Date(),
          gradedById: actor.id,
          xpAwarded: current.xpAwarded + xpToAward,
        },
      });
    });

    if (xpToAward > 0) {
      await this.gamification.refreshProgressionAfterPointsChange(submission.userId);
      await Promise.all([
        this.gamification.updateGlobalRanking(),
        this.gamification.updateClassRanking(submission.activity.classId),
      ]);
    }
    await this.notifyStudent(submission.userId, 'Atividade corrigida', submission.activity.title);
    return updated;
  }

  async returnSubmission(submissionId: string, dto: ReturnSubmissionDto, actor: Actor) {
    const submission = await this.findSubmission(submissionId, actor);
    if (actor.role === Role.ALUNO) throw new ForbiddenException('Aluno não pode devolver entrega');
    const updated = await this.prisma.activitySubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.RETURNED,
        feedback: dto.feedback,
        gradedById: actor.id,
        gradedAt: new Date(),
      },
    });
    await this.notifyStudent(submission.userId, 'Atividade devolvida', submission.activity.title);
    return updated;
  }

  async addAttachments(submissionId: string, files: Express.Multer.File[], userId: string) {
    if (files.length === 0) {
      throw new BadRequestException('Nenhum arquivo válido foi enviado');
    }
    const submission = await this.prisma.activitySubmission.findUnique({
      where: { id: submissionId },
      include: { activity: true, _count: { select: { attachments: true } } },
    });
    if (!submission || submission.userId !== userId) {
      this.cleanupFiles(files);
      throw new NotFoundException('Rascunho não encontrado');
    }
    if (submission.status !== SubmissionStatus.DRAFT) {
      this.cleanupFiles(files);
      throw new BadRequestException('Anexos só podem ser alterados no rascunho');
    }
    if (submission.activity.type !== ActivityType.FILE && submission.activity.type !== ActivityType.TEXT) {
      this.cleanupFiles(files);
      throw new BadRequestException('Este tipo de atividade não aceita anexos');
    }
    if (submission._count.attachments + files.length > submission.activity.maxFiles) {
      this.cleanupFiles(files);
      throw new BadRequestException('Quantidade máxima de arquivos excedida');
    }
    const allowed = (submission.activity.allowedFileTypes as string[] | null) ?? [];
    for (const file of files) {
      if (
        file.size > submission.activity.maxFileSize
        || (allowed.length && !allowed.includes(file.mimetype))
        || !this.hasValidFileSignature(file)
      ) {
        this.cleanupFiles(files);
        throw new BadRequestException('Arquivo fora das regras da atividade');
      }
    }
    return this.prisma.$transaction(
      files.map((file) => this.prisma.submissionAttachment.create({
        data: {
          submissionId,
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
        },
      })),
    );
  }

  async addMaterials(activityId: string, files: Express.Multer.File[], actor: Actor) {
    await this.getManagedActivity(activityId, actor);
    if (files.length === 0 || files.length > 5 || files.some((file) => !this.hasValidFileSignature(file))) {
      this.cleanupFiles(files);
      throw new BadRequestException('Material inválido');
    }
    return this.prisma.$transaction(
      files.map((file) => this.prisma.activityMaterial.create({
        data: {
          activityId,
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
        },
      })),
    );
  }

  async removeMaterial(materialId: string, actor: Actor) {
    const material = await this.prisma.activityMaterial.findUnique({ where: { id: materialId } });
    if (!material) throw new NotFoundException('Material não encontrado');
    await this.getManagedActivity(material.activityId, actor);
    await this.prisma.activityMaterial.delete({ where: { id: materialId } });
    if (existsSync(material.path)) unlinkSync(material.path);
    return { message: 'Material removido' };
  }

  async getMaterial(materialId: string, actor: Actor) {
    const material = await this.prisma.activityMaterial.findUnique({
      where: { id: materialId },
      include: { activity: { include: { class: true } } },
    });
    if (!material) throw new NotFoundException('Material não encontrado');
    const isManager = actor.role === Role.ADMIN
      || (actor.role === Role.PROFESSOR && material.activity.class.createdById === actor.id);
    const isEnrolledStudent = actor.role === Role.ALUNO
      && material.activity.status === ActivityStatus.PUBLISHED
      && Boolean(await this.prisma.classStudent.findUnique({
        where: { classId_userId: { classId: material.activity.classId, userId: actor.id } },
        select: { classId: true },
      }));
    if (!isManager && !isEnrolledStudent) {
      throw new ForbiddenException('Você não pode acessar este material');
    }
    if (!existsSync(material.path)) throw new NotFoundException('Arquivo não encontrado');
    return { material, stream: createReadStream(material.path) };
  }

  async removeAttachment(attachmentId: string, userId: string) {
    const attachment = await this.prisma.submissionAttachment.findUnique({
      where: { id: attachmentId },
      include: { submission: true },
    });
    if (!attachment || attachment.submission.userId !== userId) {
      throw new NotFoundException('Anexo não encontrado');
    }
    if (attachment.submission.status !== SubmissionStatus.DRAFT) {
      throw new BadRequestException('Anexo de entrega enviada não pode ser removido');
    }
    await this.prisma.submissionAttachment.delete({ where: { id: attachmentId } });
    if (existsSync(attachment.path)) unlinkSync(attachment.path);
    return { message: 'Anexo removido' };
  }

  async getAttachment(attachmentId: string, actor: Actor) {
    const attachment = await this.prisma.submissionAttachment.findUnique({
      where: { id: attachmentId },
      include: { submission: { include: { activity: { include: { class: true } } } } },
    });
    if (!attachment) throw new NotFoundException('Anexo não encontrado');
    const canAccess = actor.role === Role.ADMIN
      || attachment.submission.userId === actor.id
      || (actor.role === Role.PROFESSOR
        && attachment.submission.activity.class.createdById === actor.id);
    if (!canAccess) throw new ForbiddenException('Você não pode acessar este anexo');
    if (!existsSync(attachment.path)) throw new NotFoundException('Arquivo não encontrado');
    return { attachment, stream: createReadStream(attachment.path) };
  }

  private async getManagedActivity(id: string, actor: Actor, includeDetails = false) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        class: true,
        questions: includeDetails ? { include: { options: { orderBy: { position: 'asc' } } } } : false,
        materials: includeDetails,
      },
    });
    if (!activity) throw new NotFoundException('Atividade não encontrada');
    if (actor.role === Role.PROFESSOR && activity.class.createdById !== actor.id) {
      throw new ForbiddenException('Você não pode gerenciar esta atividade');
    }
    if (actor.role !== Role.PROFESSOR && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Você não pode gerenciar esta atividade');
    }
    return activity;
  }

  private async getStudentActivity(id: string, userId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id,
        status: ActivityStatus.PUBLISHED,
        class: { students: { some: { userId } } },
      },
      include: {
        class: { select: { id: true, name: true, year: true, createdById: true } },
        materials: true,
        questions: {
          orderBy: { position: 'asc' },
          include: {
            options: {
              orderBy: { position: 'asc' },
              select: { id: true, text: true, position: true },
            },
          },
        },
      },
    });
    if (!activity) throw new NotFoundException('Atividade não encontrada');
    return activity;
  }

  private async ensureCanManageClass(classId: string, actor: Actor) {
    const classroom = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, createdById: true },
    });
    if (!classroom) throw new NotFoundException('Turma não encontrada');
    if (actor.role === Role.PROFESSOR && classroom.createdById !== actor.id) {
      throw new ForbiddenException('Você não pode gerenciar esta turma');
    }
    if (actor.role !== Role.PROFESSOR && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Você não pode gerenciar esta turma');
    }
  }

  private validateTypeConfiguration(type: ActivityType, dto: CreateActivityDto | UpdateActivityDto) {
    if (type === ActivityType.FILE && dto.allowedFileTypes?.length === 0) {
      throw new BadRequestException('Atividade de arquivo precisa aceitar ao menos um tipo');
    }
  }

  private validateQuestion(
    activityType: ActivityType,
    questionType: QuestionType,
    options?: Array<{ isCorrect: boolean }>,
  ) {
    if (activityType !== ActivityType.QUIZ) {
      throw new BadRequestException('Questões só podem ser adicionadas a questionários');
    }
    if (questionType === QuestionType.SHORT_ANSWER) {
      if (options?.length) throw new BadRequestException('Resposta curta não possui alternativas');
      return;
    }
    if (!options || options.filter((option) => option.isCorrect).length !== 1) {
      throw new BadRequestException('Questão objetiva precisa de exatamente uma resposta correta');
    }
    if (questionType === QuestionType.TRUE_FALSE && options.length !== 2) {
      throw new BadRequestException('Questão verdadeiro/falso precisa de duas alternativas');
    }
  }

  private async validatePublishable(activityId: string, type: ActivityType) {
    if (type === ActivityType.QUIZ) {
      const count = await this.prisma.activityQuestion.count({ where: { activityId } });
      if (count === 0) throw new BadRequestException('Questionário precisa de pelo menos uma questão');
    }
  }

  private async ensureQuestionsEditable(activityId: string) {
    const submissions = await this.prisma.activitySubmission.count({ where: { activityId } });
    if (submissions > 0) {
      throw new BadRequestException('Questões não podem ser alteradas após o início das entregas');
    }
  }

  private ensureGenericSubmissionType(type: ActivityType) {
    if (type === ActivityType.CODE) {
      throw new BadRequestException('Atividade de código usa o fluxo do judge');
    }
  }

  private async getOrCreateDraft(
    activity: { id: string; maxAttempts: number; allowResubmission: boolean },
    userId: string,
  ) {
    const existing = await this.prisma.activitySubmission.findFirst({
      where: { activityId: activity.id, userId, status: SubmissionStatus.DRAFT },
      orderBy: { attemptNumber: 'desc' },
    });
    if (existing) return existing;
    const attempts = await this.prisma.activitySubmission.count({
      where: { activityId: activity.id, userId },
    });
    if (attempts > 0 && !activity.allowResubmission) {
      throw new BadRequestException('Reenvio não permitido');
    }
    if (attempts >= activity.maxAttempts) {
      throw new BadRequestException('Limite de tentativas atingido');
    }
    return this.prisma.activitySubmission.create({
      data: { activityId: activity.id, userId, attemptNumber: attempts + 1 },
    });
  }

  private async validateSubmissionContent(
    activity: { type: ActivityType; questions: Array<{ id: string }> },
    submissionId: string,
    dto: SaveSubmissionDto,
  ) {
    if (activity.type === ActivityType.TEXT && !dto.textAnswer?.trim()) {
      throw new BadRequestException('Resposta textual obrigatória');
    }
    if (activity.type === ActivityType.FILE) {
      const count = await this.prisma.submissionAttachment.count({ where: { submissionId } });
      if (count === 0) throw new BadRequestException('Envie ao menos um arquivo');
    }
    if (activity.type === ActivityType.QUIZ) {
      const answered = new Set((dto.answers ?? []).map((answer) => answer.questionId));
      if (activity.questions.some((question) => !answered.has(question.id))) {
        throw new BadRequestException('Responda todas as questões');
      }
    }
  }

  private async validateAndSaveAnswers(
    tx: Prisma.TransactionClient | PrismaService,
    activityId: string,
    submissionId: string,
    answers: SaveSubmissionDto['answers'],
  ) {
    if (!answers?.length) return;
    const questions = await tx.activityQuestion.findMany({
      where: { activityId, id: { in: answers.map((answer) => answer.questionId) } },
      include: { options: true },
    });
    if (questions.length !== answers.length) throw new BadRequestException('Questão inválida');
    for (const answer of answers) {
      const question = questions.find((item) => item.id === answer.questionId)!;
      const option = answer.selectedOptionId
        ? question.options.find((item) => item.id === answer.selectedOptionId)
        : null;
      if (question.type !== QuestionType.SHORT_ANSWER && !option) {
        throw new BadRequestException('Alternativa inválida');
      }
      if (question.type === QuestionType.SHORT_ANSWER && !answer.textAnswer?.trim()) {
        throw new BadRequestException('Resposta curta obrigatória');
      }
      await tx.questionAnswer.upsert({
        where: { submissionId_questionId: { submissionId, questionId: question.id } },
        update: {
          selectedOptionId: option?.id ?? null,
          textAnswer: answer.textAnswer,
          score: option ? (option.isCorrect ? question.points : 0) : null,
        },
        create: {
          submissionId,
          questionId: question.id,
          selectedOptionId: option?.id ?? null,
          textAnswer: answer.textAnswer,
          score: option ? (option.isCorrect ? question.points : 0) : null,
        },
      });
    }
  }

  private notifyStudent(userId: string, title: string, message: string) {
    return this.notifications.createNotification({
      userId,
      type: NotificationType.SISTEMA,
      title,
      message,
    });
  }

  private cleanupFiles(files: Express.Multer.File[]) {
    for (const file of files) {
      if (existsSync(file.path)) unlinkSync(file.path);
    }
  }

  private hasValidFileSignature(file: Express.Multer.File) {
    const bytes = readFileSync(file.path).subarray(0, 8);
    const startsWith = (...signature: number[]) =>
      signature.every((byte, index) => bytes[index] === byte);

    switch (file.mimetype) {
      case 'application/pdf':
        return startsWith(0x25, 0x50, 0x44, 0x46);
      case 'image/jpeg':
        return startsWith(0xff, 0xd8, 0xff);
      case 'image/png':
        return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
      case 'image/webp':
        return startsWith(0x52, 0x49, 0x46, 0x46);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return startsWith(0x50, 0x4b, 0x03, 0x04);
      case 'text/plain':
        return !bytes.includes(0);
      default:
        return false;
    }
  }
}
