'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Calendar,
  Edit,
  Plus,
  BarChart3,
  Users,
  Settings
} from 'lucide-react';
import ExpenseChart from './ExpenseChart';

interface InventoryBalance {
  objectId: string;
  objectName: string;
  objectAddress: string;
  limit: number;
  spent: number;
  balance: number;
  isOverBudget: boolean;
  month: number;
  year: number;
  expensesCount?: number;
}

interface InventoryFinancialReportProps {
  objectId?: string;
}

interface EditLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: InventoryBalance | null;
  onSave: (data: any) => void;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: InventoryBalance | null;
  onSave: (data: any) => void;
}

interface ExpenseChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: InventoryBalance | null;
}

interface BulkLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: InventoryBalance[];
  onSave: (data: BulkLimitData) => void;
}

interface BulkLimitData {
  categoryId: string;
  periodType: 'MONTHLY' | 'DAILY' | 'SEMI_ANNUAL' | 'ANNUAL';
  amount: number;
  objectIds: string[];
  month?: number;
  year?: number;
  startDate?: Date;
  endDate?: Date;
  isRecurring?: boolean;
}

// Модальное окно редактирования лимита
function EditLimitModal({ isOpen, onClose, balance, onSave }: EditLimitModalProps) {
  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState<'DAILY' | 'MONTHLY' | 'SEMI_ANNUAL' | 'ANNUAL'>('MONTHLY');
  const [isRecurring, setIsRecurring] = useState(false);
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    if (balance) {
      setAmount(balance.limit.toString());
    }
    if (isOpen) {
      loadCategories();
      loadUserRole();
    }
  }, [balance, isOpen]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/expense-categories?activeOnly=true');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUserRole = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.user.role);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Введите название категории');
      return;
    }

    setIsCreatingCategory(true);
    try {
      const response = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDescription || null,
          sortOrder: categories.length
        })
      });

      if (response.ok) {
        const data = await response.json();
        await loadCategories();
        setSelectedCategory(data.category.id);
        setShowCreateCategory(false);
        setNewCategoryName('');
        setNewCategoryDescription('');
      } else {
        const data = await response.json();
        alert(data.message || 'Ошибка создания категории');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Ошибка создания категории');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSave = () => {
    if (!selectedCategory) {
      alert('Выберите категорию расходов');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    const saveData: any = {
      objectId: balance?.objectId,
      categoryId: selectedCategory,
      amount: parseFloat(amount),
      periodType,
      isRecurring
    };

    // Для MONTHLY - добавляем месяц и год
    if (periodType === 'MONTHLY') {
      saveData.month = balance?.month;
      saveData.year = balance?.year;
      if (isRecurring && endMonth && endYear) {
        saveData.endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1);
      }
    }

    // Для SEMI_ANNUAL и ANNUAL - добавляем даты
    if (periodType === 'SEMI_ANNUAL' || periodType === 'ANNUAL') {
      if (!startDate || !endDate) {
        alert('Укажите даты начала и окончания периода');
        return;
      }
      saveData.startDate = new Date(startDate);
      saveData.endDate = new Date(endDate);
    }

    onSave(saveData);
    onClose();
    setSelectedCategory('');
    setAmount('');
    setPeriodType('MONTHLY');
    setStartDate('');
    setEndDate('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать лимит - {balance?.objectName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Категория расходов *</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(userRole === 'ADMIN' || userRole === 'DEPUTY_ADMIN') && (
            <div>
              {!showCreateCategory ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateCategory(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Создать новую категорию
                </Button>
              ) : (
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div>
                    <label className="text-sm font-medium">Название категории *</label>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Например: Офисные принадлежности"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Описание</label>
                    <Input
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Краткое описание"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={isCreatingCategory}
                    >
                      {isCreatingCategory ? 'Создание...' : 'Создать'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCreateCategory(false);
                        setNewCategoryName('');
                        setNewCategoryDescription('');
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Тип периода *</label>
            <Select value={periodType} onValueChange={(val: any) => setPeriodType(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип периода" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Ежедневно</SelectItem>
                <SelectItem value="MONTHLY">Ежемесячно</SelectItem>
                <SelectItem value="SEMI_ANNUAL">Раз в 6 месяцев</SelectItem>
                <SelectItem value="ANNUAL">Годовой</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Сумма лимита (руб.) *</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="40000"
            />
          </div>

          {/* Для MONTHLY - показываем месяц/год и повторение */}
          {periodType === 'MONTHLY' && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked === true)}
                />
                <label htmlFor="recurring" className="text-sm">
                  Повторять каждый месяц
                </label>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">До месяца</label>
                    <Select value={endMonth} onValueChange={setEndMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Месяц" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(0, i).toLocaleString('ru', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">До года</label>
                <Select value={endYear} onValueChange={setEndYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Год" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
              )}
            </>
          )}

          {/* Для SEMI_ANNUAL и ANNUAL - показываем даты */}
          {(periodType === 'SEMI_ANNUAL' || periodType === 'ANNUAL') && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Дата начала *</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Дата окончания *</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Для DAILY - показываем чекбокс повторения */}
          {periodType === 'DAILY' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring-daily"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked === true)}
              />
              <label htmlFor="recurring-daily" className="text-sm">
                Повторять ежедневно
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Модальное окно добавления расхода
function AddExpenseModal({ isOpen, onClose, balance, onSave }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setWarning(null);
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/expense-categories?activeOnly=true');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSave = () => {
    if (!amount) {
      alert('Пожалуйста, укажите сумму расхода');
      return;
    }
    
    const expenseData = {
      objectId: balance?.objectId,
      categoryId: selectedCategory || null,
      amount: parseFloat(amount),
      description: '',
      month: balance?.month,
      year: balance?.year
    };
    
    console.log('📝 Данные из модального окна:', expenseData);
    console.log('📊 Balance объект:', balance);
    
    onSave(expenseData);
    
    // Очищаем поля только после успешного сохранения
    setAmount('');
    setSelectedCategory('');
    setWarning(null);
    // onClose() теперь вызывается в handleSaveExpense после успешного ответа
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить расход - {balance?.objectName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {warning && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              ⚠️ {warning}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Категория расходов</label>
            <Select value={selectedCategory || 'none'} onValueChange={(val) => setSelectedCategory(val === 'none' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию (опционально)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без категории</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Сумма расхода (руб.) *</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave}>Добавить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Модальное окно с графиком расходов
function ExpenseChartModal({ isOpen, onClose, balance }: ExpenseChartModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'categories'>('general');
  const [categoryStats, setCategoryStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && balance && activeTab === 'categories') {
      loadCategoryStats();
    }
  }, [isOpen, balance, activeTab]);

  const loadCategoryStats = async () => {
    if (!balance) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/expenses/stats/${balance.objectId}?month=${balance.month}&year=${balance.year}`
      );
      if (response.ok) {
        const data = await response.json();
        setCategoryStats(data);
      }
    } catch (error) {
      console.error('Error loading category stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Детальная аналитика расходов - {balance?.objectName}</DialogTitle>
        </DialogHeader>

        {/* Вкладки */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Общее
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              По статьям
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          {/* Вкладка "Общее" */}
          {activeTab === 'general' && balance && (
            <ExpenseChart 
              objectId={balance.objectId} 
              objectName={balance.objectName}
            />
          )}

          {/* Вкладка "По статьям" */}
          {activeTab === 'categories' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : categoryStats ? (
                <div className="space-y-6">
                  {/* Общая статистика */}
                  {categoryStats.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-600 mb-1">Всего потрачено</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {categoryStats.summary.totalSpent.toLocaleString('ru-RU')} ₽
                          </div>
                        </CardContent>
                      </Card>
                      {categoryStats.summary.totalLimit && (
                        <>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-sm text-gray-600 mb-1">Общий лимит</div>
                              <div className="text-2xl font-bold text-gray-900">
                                {categoryStats.summary.totalLimit.toLocaleString('ru-RU')} ₽
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-sm text-gray-600 mb-1">Остаток</div>
                              <div className={`text-2xl font-bold ${
                                categoryStats.summary.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {categoryStats.summary.totalRemaining.toLocaleString('ru-RU')} ₽
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  )}

                  {/* Карточки по категориям */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryStats.categories?.map((cat: any) => (
                      <Card key={cat.category.id} className={cat.percentage >= 100 ? 'border-red-200 bg-red-50' : ''}>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">{cat.category.name}</h3>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Потрачено:</span>
                              <span className="font-medium">{cat.spent.toLocaleString('ru-RU')} ₽</span>
                            </div>
                            
                            {cat.hasLimit && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Лимит:</span>
                                  <span className="font-medium">{cat.limit?.toLocaleString('ru-RU')} ₽</span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Остаток:</span>
                                  <span className={`font-medium ${
                                    (cat.remaining || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {cat.remaining?.toLocaleString('ru-RU')} ₽
                                  </span>
                                </div>
                                
                                {/* Прогресс-бар */}
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Использовано</span>
                                    <span>{cat.percentage.toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        cat.percentage >= 100
                                          ? 'bg-red-600'
                                          : cat.percentage >= 90
                                          ? 'bg-yellow-600'
                                          : 'bg-green-600'
                                      }`}
                                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                                    />
                                  </div>
                                </div>

                                {cat.percentage >= 100 && (
                                  <div className="mt-2 text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                                    ⚠️ Лимит превышен
                                  </div>
                                )}
                                {cat.percentage >= 90 && cat.percentage < 100 && (
                                  <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                                    ⚠️ Лимит почти исчерпан
                                  </div>
                                )}
                              </>
                            )}

                            {!cat.hasLimit && (
                              <div className="mt-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                Лимит не установлен
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {(!categoryStats.categories || categoryStats.categories.length === 0) && (
                    <div className="text-center py-12 text-gray-500">
                      <p>Нет данных по категориям за выбранный период</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Не удалось загрузить статистику</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Модальное окно массового выставления лимитов
function BulkLimitModal({ isOpen, onClose, balances, onSave }: BulkLimitModalProps) {
  const [categoryId, setCategoryId] = useState('');
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'DAILY' | 'SEMI_ANNUAL' | 'ANNUAL'>('MONTHLY');
  const [amount, setAmount] = useState('');
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/expense-categories?activeOnly=true');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSave = () => {
    if (!categoryId || !amount || selectedObjects.length === 0) {
      alert('Заполните все обязательные поля: категория, сумма и выберите объекты');
      return;
    }

    const data: BulkLimitData = {
      categoryId,
      periodType,
      amount: parseFloat(amount),
      objectIds: selectedObjects
    };

    if (periodType === 'MONTHLY') {
      data.month = month;
      data.year = year;
      data.isRecurring = isRecurring;
    } else if (periodType === 'SEMI_ANNUAL' || periodType === 'ANNUAL') {
      if (!startDate || !endDate) {
        alert('Укажите даты начала и окончания для выбранного типа периода');
        return;
      }
      data.startDate = new Date(startDate);
      data.endDate = new Date(endDate);
    }

    onSave(data);
    
    // Сброс формы
    setCategoryId('');
    setAmount('');
    setSelectedObjects([]);
    setIsRecurring(false);
    setStartDate('');
    setEndDate('');
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Массовое выставление лимитов по категориям</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Выбор категории */}
          <div>
            <label className="text-sm font-medium">Категория расходов *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="">Выберите категорию</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Тип периода */}
          <div>
            <label className="text-sm font-medium">Тип периода *</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="MONTHLY">Ежемесячный</option>
              <option value="DAILY">Ежедневный</option>
              <option value="SEMI_ANNUAL">Полугодовой</option>
              <option value="ANNUAL">Годовой</option>
            </select>
          </div>

          {/* Сумма */}
          <div>
            <label className="text-sm font-medium">Сумма лимита (руб.) *</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
            />
          </div>

          {/* Поля для MONTHLY */}
          {periodType === 'MONTHLY' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Месяц</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    {monthNames.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Год</label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked === true)}
                />
                <label htmlFor="bulk-recurring" className="text-sm">
                  Повторять каждый месяц
                </label>
              </div>
            </>
          )}

          {/* Поля для SEMI_ANNUAL и ANNUAL */}
          {(periodType === 'SEMI_ANNUAL' || periodType === 'ANNUAL') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Дата начала *</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Дата окончания *</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Выбор объектов */}
          <div>
            <label className="text-sm font-medium mb-2 block">Выберите объекты *</label>
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
              {balances.map((balance) => (
                <div key={balance.objectId} className="flex items-center space-x-2">
                  <Checkbox
                    id={balance.objectId}
                    checked={selectedObjects.includes(balance.objectId)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedObjects([...selectedObjects, balance.objectId]);
                      } else {
                        setSelectedObjects(selectedObjects.filter(id => id !== balance.objectId));
                      }
                    }}
                  />
                  <label htmlFor={balance.objectId} className="text-sm">
                    {balance.objectName}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave}>Применить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryFinancialReport({ objectId }: InventoryFinancialReportProps) {
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Модальные окна
  const [editLimitModal, setEditLimitModal] = useState<{isOpen: boolean, balance: InventoryBalance | null}>({
    isOpen: false, balance: null
  });
  const [addExpenseModal, setAddExpenseModal] = useState<{isOpen: boolean, balance: InventoryBalance | null}>({
    isOpen: false, balance: null
  });
  const [chartModal, setChartModal] = useState<{isOpen: boolean, balance: InventoryBalance | null}>({
    isOpen: false, balance: null
  });
  const [bulkLimitModal, setBulkLimitModal] = useState(false);

  useEffect(() => {
    fetchBalances();
  }, [selectedMonth, selectedYear, objectId]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (objectId) {
        params.append('objectId', objectId);
      }
      
      params.append('month', selectedMonth.toString());
      params.append('year', selectedYear.toString());

      const response = await fetch(`/api/inventory/financial-report?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setBalances(data);
      }
    } catch (error) {
      console.error('Error fetching inventory balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  const getBalanceStatus = (balance: InventoryBalance) => {
    if (balance.isOverBudget) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Превышение
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        В пределах лимита
      </Badge>
    );
  };

  const handleSaveLimit = async (data: any) => {
    try {
      // Используем новый API для лимитов по категориям
      const payload: any = {
        categoryId: data.categoryId,
        amount: data.amount,
        periodType: data.periodType,
        isRecurring: data.isRecurring
      };

      // Добавляем поля в зависимости от типа периода
      if (data.periodType === 'MONTHLY') {
        payload.month = data.month;
        payload.year = data.year;
        if (data.endDate) {
          payload.endDate = data.endDate;
        }
      } else if (data.periodType === 'SEMI_ANNUAL' || data.periodType === 'ANNUAL') {
        payload.startDate = data.startDate;
        payload.endDate = data.endDate;
      }

      const response = await fetch(`/api/objects/${data.objectId}/expense-limits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        fetchBalances();
        setEditLimitModal({isOpen: false, balance: null});
        alert('Лимит успешно установлен');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Ошибка: ${errorData.message || 'Не удалось установить лимит'}`);
      }
    } catch (error) {
      console.error('Error saving limit:', error);
      alert('Ошибка сети при установке лимита');
    }
  };

  const handleSaveExpense = async (data: any) => {
    console.log('🔍 Отправляем данные расхода:', data);
    
    try {
      const response = await fetch('/api/inventory/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        fetchBalances();
        setAddExpenseModal({isOpen: false, balance: null});
        
        // Показываем предупреждение если есть
        if (responseData.warning) {
          alert(`✅ Расход добавлен\n\n⚠️ ${responseData.warning}`);
        } else {
          alert('✅ Расход успешно добавлен');
        }
      } else {
        console.error('Error response:', responseData);
        if (responseData.limitExceeded) {
          alert(`❌ Превышен лимит!\n\n${responseData.warning || responseData.message}`);
        } else {
          alert(`Ошибка: ${responseData.error || responseData.message || 'Не удалось создать расход'}`);
        }
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Ошибка сети при создании расхода');
    }
  };

  const handleBulkSave = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/bulk-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        fetchBalances();
        // Закрываем модальное окно
        setBulkLimitModal(false);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Ошибка: ${errorData.error || 'Не удалось установить лимиты'}`);
      }
    } catch (error) {
      console.error('Error saving bulk limits:', error);
      alert('Ошибка сети при установке лимитов');
    }
  };

  const totalLimit = balances.reduce((sum, item) => sum + item.limit, 0);
  const totalSpent = balances.reduce((sum, item) => sum + item.spent, 0);
  const totalBalance = totalLimit - totalSpent;
  const overBudgetCount = balances.filter(item => item.isOverBudget).length;

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Загрузка финансовой отчетности...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">💰 Финансовая отчетность по инвентарю</h1>
          <p className="text-gray-600 mt-1">
            Лимиты, расходы и остатки по объектам
          </p>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          
          <Button
            onClick={() => setBulkLimitModal(true)}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Массовые лимиты
          </Button>
        </div>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Общий лимит</p>
                <p className="text-2xl font-bold">{formatCurrency(totalLimit)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Потрачено</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Остаток</p>
                <p className={`text-2xl font-bold ${totalBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${totalBalance < 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Превышения</p>
                <p className="text-2xl font-bold text-red-600">{overBudgetCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

          {/* Отчет по объектам */}
          {balances.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Данные не найдены
            </h3>
            <p className="text-gray-600 mb-4">
              Нет данных по лимитам и расходам за выбранный период
            </p>
          </CardContent>
        </Card>
          ) : (
            <div className="grid gap-4">
          {balances.map((balance) => (
            <Card key={balance.objectId} className={balance.isOverBudget ? 'border-red-200 bg-red-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg">{balance.objectName}</h3>
                      {getBalanceStatus(balance)}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{balance.objectAddress}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Лимит:</span>
                        <p className="font-medium text-blue-600">{formatCurrency(balance.limit)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Потрачено:</span>
                        <p className="font-medium text-red-600">{formatCurrency(balance.spent)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Остаток:</span>
                        <p className={`font-medium ${balance.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(balance.balance)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Прогресс-бар */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${balance.isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ 
                            width: `${Math.min(100, (balance.spent / balance.limit) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Использовано: {balance.limit > 0 ? Math.round((balance.spent / balance.limit) * 100) : 0}%
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditLimitModal({isOpen: true, balance})}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Лимит
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddExpenseModal({isOpen: true, balance})}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Расход
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setChartModal({isOpen: true, balance})}
                        className="flex items-center gap-1"
                      >
                        <BarChart3 className="w-3 h-3" />
                        Подробно
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Модальные окна */}
      <EditLimitModal
        isOpen={editLimitModal.isOpen}
        onClose={() => setEditLimitModal({isOpen: false, balance: null})}
        balance={editLimitModal.balance}
        onSave={handleSaveLimit}
      />

      <AddExpenseModal
        isOpen={addExpenseModal.isOpen}
        onClose={() => setAddExpenseModal({isOpen: false, balance: null})}
        balance={addExpenseModal.balance}
        onSave={handleSaveExpense}
      />

      <ExpenseChartModal
        isOpen={chartModal.isOpen}
        onClose={() => setChartModal({isOpen: false, balance: null})}
        balance={chartModal.balance}
      />

      <BulkLimitModal
        isOpen={bulkLimitModal}
        onClose={() => setBulkLimitModal(false)}
        balances={balances}
        onSave={handleBulkSave}
      />
    </div>
  );
}
