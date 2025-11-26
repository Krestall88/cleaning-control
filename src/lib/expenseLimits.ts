import { PrismaClient } from '@prisma/client';

/**
 * Дедупликация лимитов расходов
 * Оставляет только самые свежие записи для каждой комбинации объект+категория+период
 */
export function dedupeLimits<T extends {
  id: string;
  objectId: string;
  categoryId: string;
  periodType: string;
  month?: number | null;
  year?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  updatedAt: Date;
}>(limits: T[]): T[] {
  // Группируем лимиты по уникальному ключу
  const grouped = new Map<string, T[]>();

  for (const limit of limits) {
    let key: string;

    if (limit.periodType === 'MONTHLY') {
      // Для месячных: objectId + categoryId + periodType + month + year
      key = `${limit.objectId}-${limit.categoryId}-${limit.periodType}-${limit.month}-${limit.year}`;
    } else if (limit.periodType === 'DAILY') {
      // Для дневных: objectId + categoryId + periodType
      key = `${limit.objectId}-${limit.categoryId}-${limit.periodType}`;
    } else if (limit.periodType === 'SEMI_ANNUAL' || limit.periodType === 'ANNUAL') {
      // Для полугодовых и годовых: objectId + categoryId + periodType + startDate + endDate
      const startStr = limit.startDate ? limit.startDate.toISOString() : 'null';
      const endStr = limit.endDate ? limit.endDate.toISOString() : 'null';
      key = `${limit.objectId}-${limit.categoryId}-${limit.periodType}-${startStr}-${endStr}`;
    } else {
      // Fallback для неизвестных типов
      key = `${limit.objectId}-${limit.categoryId}-${limit.periodType}`;
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(limit);
  }

  // Для каждой группы оставляем только самый свежий лимит
  const deduped: T[] = [];
  for (const group of grouped.values()) {
    // Сортируем по updatedAt (самый свежий первым)
    group.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    deduped.push(group[0]);
  }

  return deduped;
}

/**
 * Очистка дубликатов лимитов в базе данных
 * Удаляет старые дубликаты, оставляя только самые свежие записи
 */
export async function cleanupExpenseLimitDuplicates(
  prisma: PrismaClient,
  filter?: {
    objectId?: string;
    categoryId?: string;
    periodType?: string;
  }
): Promise<number> {
  try {
    // Получаем все лимиты с учетом фильтра
    const where: any = {};
    if (filter?.objectId) where.objectId = filter.objectId;
    if (filter?.categoryId) where.categoryId = filter.categoryId;
    if (filter?.periodType) where.periodType = filter.periodType;

    const allLimits = await prisma.expenseCategoryLimit.findMany({
      where,
      select: {
        id: true,
        objectId: true,
        categoryId: true,
        periodType: true,
        month: true,
        year: true,
        startDate: true,
        endDate: true,
        updatedAt: true
      }
    });

    // Дедуплицируем
    const validLimits = dedupeLimits(allLimits);
    const validIds = new Set(validLimits.map(l => l.id));

    // Находим ID дубликатов для удаления
    const duplicateIds = allLimits
      .filter(l => !validIds.has(l.id))
      .map(l => l.id);

    if (duplicateIds.length === 0) {
      return 0;
    }

    // Удаляем дубликаты
    const result = await prisma.expenseCategoryLimit.deleteMany({
      where: {
        id: { in: duplicateIds }
      }
    });

    console.log(`🧹 Удалено ${result.count} дубликатов лимитов`);
    return result.count;
  } catch (error) {
    console.error('Ошибка при очистке дубликатов лимитов:', error);
    throw error;
  }
}
