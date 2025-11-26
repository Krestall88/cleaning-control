import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Определяем фильтр объектов в зависимости от роли
    let objectFilter: any = {};
    let objectIds: string[] = [];
    
    if (user.role === 'MANAGER') {
      const managerObjects = await prisma.cleaningObject.findMany({
        where: { managerId: user.id },
        select: { id: true, name: true }
      });
      objectIds = managerObjects.map(obj => obj.id);
      const objectNames = managerObjects.map(obj => obj.name);
      objectFilter = { objectName: { in: objectNames } };
    }

    // Задачи из календаря (Task)
    const calendarTasks = await prisma.task.findMany({
      where: objectFilter,
      select: {
        status: true
      }
    });

    // Завершённые статусы для Task: COMPLETED, CLOSED_WITH_PHOTO
    const completedStatuses = ['COMPLETED', 'CLOSED_WITH_PHOTO'];
    const calendarTotal = calendarTasks.length;
    const calendarCompleted = calendarTasks.filter(t => completedStatuses.includes(t.status)).length;
    const calendarRate = calendarTotal > 0 ? (calendarCompleted / calendarTotal) * 100 : 0;

    // Дополнительные задачи
    const additionalTasks = await prisma.additionalTask.findMany({
      where: user.role === 'MANAGER' ? { objectId: { in: objectIds } } : {},
      select: {
        status: true
      }
    });

    const additionalTotal = additionalTasks.length;
    const additionalCompleted = additionalTasks.filter(t => t.status === 'COMPLETED').length;
    const additionalRate = additionalTotal > 0 ? (additionalCompleted / additionalTotal) * 100 : 0;

    // Чек-листы
    const checklists = await prisma.checklist.findMany({
      where: user.role === 'MANAGER' ? { objectId: { in: objectIds } } : {},
      select: {
        completedAt: true
      }
    });

    const checklistTotal = checklists.length;
    const checklistCompleted = checklists.filter(c => c.completedAt !== null).length;
    const checklistRate = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;

    // Общая статистика
    const overallTotal = calendarTotal + additionalTotal + checklistTotal;
    const overallCompleted = calendarCompleted + additionalCompleted + checklistCompleted;
    const overallRate = overallTotal > 0 ? (overallCompleted / overallTotal) * 100 : 0;

    // Логирование для отладки
    console.log('📈 Completion Stats:', {
      calendar: { total: calendarTotal, completed: calendarCompleted, rate: calendarRate.toFixed(1) },
      additional: { total: additionalTotal, completed: additionalCompleted, rate: additionalRate.toFixed(1) },
      checklists: { total: checklistTotal, completed: checklistCompleted, rate: checklistRate.toFixed(1) },
      overall: { total: overallTotal, completed: overallCompleted, rate: overallRate.toFixed(1) },
      user: { id: user.id, role: user.role }
    });

    // Динамика за последние 7 дней
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(23, 59, 59, 999);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      // Задачи на эту дату
      const [dayCalendar, dayAdditional, dayChecklist] = await Promise.all([
        prisma.task.findMany({
          where: {
            ...objectFilter,
            createdAt: { lte: date }
          },
          select: { status: true }
        }),
        prisma.additionalTask.findMany({
          where: {
            ...(user.role === 'MANAGER' ? { objectId: { in: objectIds } } : {}),
            createdAt: { lte: date }
          },
          select: { status: true }
        }),
        prisma.checklist.findMany({
          where: {
            ...(user.role === 'MANAGER' ? { objectId: { in: objectIds } } : {}),
            createdAt: { lte: date }
          },
          select: { completedAt: true }
        })
      ]);

      const dayTotal = dayCalendar.length + dayAdditional.length + dayChecklist.length;
      const dayCompleted = 
        dayCalendar.filter(t => completedStatuses.includes(t.status)).length +
        dayAdditional.filter(t => t.status === 'COMPLETED').length +
        dayChecklist.filter(c => c.completedAt !== null).length;

      const dayRate = dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0;

      trend.push({
        date: date.toISOString(),
        rate: dayRate
      });
    }

    return NextResponse.json({
      calendar: {
        total: calendarTotal,
        completed: calendarCompleted,
        rate: calendarRate
      },
      additional: {
        total: additionalTotal,
        completed: additionalCompleted,
        rate: additionalRate
      },
      checklists: {
        total: checklistTotal,
        completed: checklistCompleted,
        rate: checklistRate
      },
      overall: {
        total: overallTotal,
        completed: overallCompleted,
        rate: overallRate
      },
      trend
    });

  } catch (error) {
    console.error('Error fetching completion stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
