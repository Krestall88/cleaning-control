import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Определяем фильтр объектов в зависимости от роли
    let objectFilter: any = {};
    if (user.role === 'MANAGER') {
      const managerObjects = await prisma.cleaningObject.findMany({
        where: { managerId: user.id },
        select: { name: true }
      });
      const objectNames = managerObjects.map(obj => obj.name);
      objectFilter = { objectName: { in: objectNames } };
    }

    // Задачи из календаря (Task - это задачи из чек-листов)
    const calendarTasks = await prisma.task.findMany({
      where: objectFilter,
      select: {
        id: true,
        status: true,
        scheduledStart: true
      }
    });

    // Завершённые статусы для Task: COMPLETED, CLOSED_WITH_PHOTO
    const completedStatuses = ['COMPLETED', 'CLOSED_WITH_PHOTO'];
    const activeStatuses = ['NEW', 'AVAILABLE', 'IN_PROGRESS'];
    
    const calendarStats = {
      total: calendarTasks.length,
      completed: calendarTasks.filter(t => completedStatuses.includes(t.status)).length,
      active: calendarTasks.filter(t => activeStatuses.includes(t.status)).length,
      overdue: calendarTasks.filter(t => t.status === 'OVERDUE' || t.status === 'FAILED').length
    };

    // Дополнительные задачи
    let additionalFilter: any = {};
    if (user.role === 'MANAGER') {
      const managerObjects = await prisma.cleaningObject.findMany({
        where: { managerId: user.id },
        select: { id: true }
      });
      const objectIds = managerObjects.map(obj => obj.id);
      additionalFilter = { objectId: { in: objectIds } };
    }

    const additionalTasks = await prisma.additionalTask.findMany({
      where: additionalFilter,
      select: {
        id: true,
        status: true,
        receivedAt: true
      }
    });

    const additionalStats = {
      total: additionalTasks.length,
      completed: additionalTasks.filter(t => t.status === 'COMPLETED').length,
      active: additionalTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'NEW').length,
      overdue: 0 // У AdditionalTask нет статуса OVERDUE
    };

    // Чек-листы
    let checklistFilter: any = {};
    if (user.role === 'MANAGER') {
      const managerObjects = await prisma.cleaningObject.findMany({
        where: { managerId: user.id },
        select: { id: true }
      });
      const objectIds = managerObjects.map(obj => obj.id);
      checklistFilter = { objectId: { in: objectIds } };
    }

    const checklists = await prisma.checklist.findMany({
      where: checklistFilter,
      select: {
        id: true,
        completedAt: true,
        date: true
      }
    });

    const checklistStats = {
      total: checklists.length,
      completed: checklists.filter(c => c.completedAt !== null).length,
      active: checklists.filter(c => !c.completedAt && new Date(c.date) >= todayStart).length,
      overdue: checklists.filter(c => !c.completedAt && new Date(c.date) < todayStart).length
    };

    const totals = {
      all: calendarStats.total + additionalStats.total + checklistStats.total,
      completed: calendarStats.completed + additionalStats.completed + checklistStats.completed,
      active: calendarStats.active + additionalStats.active + checklistStats.active,
      overdue: calendarStats.overdue + additionalStats.overdue + checklistStats.overdue
    };

    // Логирование для отладки
    console.log('📊 Tasks Stats:', {
      calendar: calendarStats,
      additional: additionalStats,
      checklists: checklistStats,
      totals,
      user: { id: user.id, role: user.role }
    });

    return NextResponse.json({
      calendar: calendarStats,
      additional: additionalStats,
      checklists: checklistStats,
      totals
    });

  } catch (error) {
    console.error('Error fetching tasks stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
