'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, CheckSquare, FileText, MapPin, User, Clock, Plus, Settings, CheckCircle2, Edit, Shield } from 'lucide-react';
import TaskManager from '@/components/TaskManager';
import TestChecklistCreator from '@/components/TestChecklistCreator';
import ChecklistCompletionModal from '@/components/ChecklistCompletionModal';
import CompletionRequirementsManager from '@/components/CompletionRequirementsManager';
import TaskScheduleManager from '@/components/TaskScheduleManager';
import TechCardManager from '@/components/TechCardManager';
import DynamicObjectTree from '@/components/DynamicObjectTree';
import TechTasksPanel from '@/components/TechTasksPanel';
import ObjectEditModal from '@/components/ObjectEditModal';

interface Room {
  id: string;
  name: string;
  description: string;
  area: number;
  techCards: TechCard[];
}

interface TechCard {
  id: string;
  name: string;
  workType: string;
  frequency: string;
  description: string;
}

interface CleaningObject {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  allowManagerEdit?: boolean;
  manager?: { id: string; name: string; email: string; role?: string };
  creator?: { id: string; name: string };
  rooms: Room[];
  sites?: Array<{
    id: string;
    name: string;
    comment?: string;
    manager?: { id: string; name: string; email: string; role?: string };
    seniorManager?: { id: string; name: string; email: string; role?: string };
  }>;
  _count: {
    rooms: number;
    techCards: number;
    checklists: number;
    requests: number;
  };
}

interface Checklist {
  id: string;
  date: string;
  status: string;
  room?: { id: string; name: string };
  completedTasks: number;
  totalTasks: number;
  completedAt?: string;
  object?: {
    id: string;
    name: string;
    address: string;
    requirePhotoForCompletion?: boolean;
  };
  tasks?: Array<{
    id: string;
    description: string;
    status: string;
  }>;
}

export default function ObjectDetailClientPage() {
  const { id } = useParams();
  const router = useRouter();
  const [object, setObject] = useState<CleaningObject | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRequirementsManager, setShowRequirementsManager] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [showTechCardManager, setShowTechCardManager] = useState(false);
  const [selectedChecklistForCompletion, setSelectedChecklistForCompletion] = useState<any>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [isEditingManagers, setIsEditingManagers] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [siteManagers, setSiteManagers] = useState<{[key: string]: string}>({});
  const [selectedTechTasks, setSelectedTechTasks] = useState<any[]>([]);
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  const fetchObjectData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/objects/${id}`);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить данные объекта');
      }
      
      const data = await response.json();
      console.log('🏢 Загружен объект:', data);
      console.log('🏠 Помещения:', data.rooms);
      console.log('📋 Общее количество техкарт:', data._count?.techCards);
      
      setObject(data);
      
      // Выбираем первое помещение по умолчанию
      if (data.rooms && data.rooms.length > 0) {
        console.log('🎯 Выбрано помещение:', data.rooms[0].name, 'Техкарт:', data.rooms[0].techCards?.length);
        setSelectedRoom(data.rooms[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки объекта:', error);
      setError('Не удалось загрузить данные объекта');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChecklists = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/checklists?objectId=${id}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setChecklists(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки чек-листов:', error);
    }
  };

  const fetchChecklistDetails = async (checklistId: string) => {
    try {
      const response = await fetch(`/api/checklists/${checklistId}`);
      if (response.ok) {
        const checklist = await response.json();
        return {
          ...checklist,
          object: object || checklist.object,
        };
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей чек-листа:', error);
    }
    return null;
  };

  const handleCompleteChecklist = async (checklistId: string) => {
    const checklistDetails = await fetchChecklistDetails(checklistId);
    if (checklistDetails && checklistDetails.object) {
      setSelectedChecklistForCompletion(checklistDetails);
      setShowCompletionModal(true);
    }
  };

  const handleCompletionSuccess = () => {
    fetchChecklists(); // Обновляем список чек-листов
    setSelectedChecklistForCompletion(null);
    setShowCompletionModal(false);
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/users?role=MANAGER');
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки менеджеров:', error);
    }
  };

  const updateManager = async (managerId: string) => {
    try {
      const response = await fetch(`/api/objects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managerId }),
      });

      if (response.ok) {
        const updatedObject = await response.json();
        setObject(updatedObject);
        setIsEditingManagers(false);
      }
    } catch (error) {
      console.error('Ошибка обновления менеджера:', error);
    }
  };

  const saveAllManagers = async () => {
    try {
      // Сохраняем основного менеджера
      if (selectedManagerId !== (object?.manager?.id || '')) {
        const response = await fetch(`/api/objects/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ managerId: selectedManagerId || null }),
        });
        
        if (!response.ok) {
          throw new Error('Ошибка обновления основного менеджера');
        }
      }

      // Сохраняем менеджеров и старших менеджеров участков
      for (const [key, managerId] of Object.entries(siteManagers)) {
        // Проверяем, это старший менеджер или обычный
        const isSenior = key.startsWith('senior_');
        const siteId = isSenior ? key.replace('senior_', '') : key;
        
        const currentSite = object?.sites?.find(s => s.id === siteId);
        if (currentSite) {
          const currentValue = isSenior ? currentSite.seniorManager?.id : currentSite.manager?.id;
          
          if (managerId !== (currentValue || '')) {
            const body = isSenior 
              ? { seniorManagerId: managerId || null }
              : { managerId: managerId || null };
            
            const response = await fetch(`/api/sites/${siteId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(body),
            });
            
            if (!response.ok) {
              throw new Error(`Ошибка обновления ${isSenior ? 'старшего менеджера' : 'менеджера'} участка ${currentSite.name}`);
            }
          }
        }
      }

      // Обновляем данные объекта
      await fetchObjectData();
      setIsEditingManagers(false);
      setSiteManagers({});
      
    } catch (error) {
      console.error('Ошибка сохранения менеджеров:', error);
      alert(`Ошибка сохранения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const startEditingManagers = () => {
    setIsEditingManagers(true);
    setSelectedManagerId(object?.manager?.id || '');
    
    // Инициализируем менеджеров и старших менеджеров участков
    const initialSiteManagers: {[key: string]: string} = {};
    object?.sites?.forEach(site => {
      if (site.manager) {
        initialSiteManagers[site.id] = site.manager.id;
      }
      if (site.seniorManager) {
        initialSiteManagers[`senior_${site.id}`] = site.seniorManager.id;
      }
    });
    setSiteManagers(initialSiteManagers);
  };

  const cancelEditingManagers = () => {
    setIsEditingManagers(false);
    setSelectedManagerId(object?.manager?.id || '');
    setSiteManagers({});
  };

  const handleSelectTechTasks = (techTasks: any[], context: string) => {
    setSelectedTechTasks(techTasks);
    setSelectedContext(context);
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUserRole(userData.user.role);
      }
    } catch (error) {
      console.error('Ошибка получения информации о пользователе:', error);
    }
  };

  const toggleManagerEditPermission = async () => {
    if (!object) return;
    
    try {
      const response = await fetch(`/api/objects/${object.id}/manager-edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allowManagerEdit: !object.allowManagerEdit
        }),
      });

      if (response.ok) {
        const updatedObject = await response.json();
        setObject(updatedObject);
      } else {
        console.error('Ошибка обновления разрешения редактирования');
      }
    } catch (error) {
      console.error('Ошибка при обновлении разрешения:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchObjectData();
    fetchChecklists();
    fetchManagers();
  }, [id]);

  const handleCreateChecklist = async (roomId?: string) => {
    console.log('🏗️ Создание чек-листа для объекта:', {
      objectId: id,
      roomId: roomId || null,
      roomName: selectedRoom?.name,
    });

    try {
      const response = await fetch('/api/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objectId: id,
          roomId: roomId || null,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      console.log('📡 Ответ сервера:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Ошибка от сервера:', errorData);
        throw new Error(errorData.message || 'Не удалось создать чек-лист');
      }

      const result = await response.json();
      console.log('✅ Создан чек-лист:', result);
      
      if (result.checklists && result.checklists.length > 0) {
        alert(`Успешно создано ${result.count} чек-листов для ${roomId ? selectedRoom?.name : 'всего объекта'}! Всего задач: ${result.totalTasks}`);
      } else {
        alert(`Чек-лист успешно создан для ${roomId ? selectedRoom?.name : 'всего объекта'}!`);
      }
      fetchChecklists();
      
      // Перенаправляем на страницу чек-листов
      router.push('/checklists');
    } catch (error) {
      console.error('❌ Ошибка создания чек-листа:', error);
      alert(`Не удалось создать чек-лист: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Загрузка данных объекта...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  if (!object) {
    return <div className="text-center py-8">Объект не найден</div>;
  }

  return (
    <div className="space-y-6">
      {/* Навигация */}
      <div className="flex items-center">
        <Button 
          onClick={() => router.push('/objects')} 
          variant="outline" 
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          К списку объектов
        </Button>
      </div>

      {/* Заголовок объекта */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex flex-col gap-3">
            <div className="w-full">
              <h1 className="text-base sm:text-2xl font-bold mb-2 break-words">{object.name}</h1>
              <div className="flex items-start text-gray-600">
                <div className="flex items-start gap-1">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-base break-words">{object.address}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full">
              {/* Кнопка редактирования - для админов/заместителей или менеджеров с разрешением */}
              {(userRole !== 'MANAGER' || (userRole === 'MANAGER' && object?.allowManagerEdit)) && (
                <Button
                  onClick={() => setShowEditModal(true)}
                  size="sm"
                  variant="default"
                  className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm flex items-center gap-1 bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">Редактировать</span>
                </Button>
              )}
              
              {/* Настройки завершения и расписание - только для админов/заместителей */}
              {userRole !== 'MANAGER' && (
                <>
                  <Button
                    onClick={() => setShowRequirementsManager(true)}
                    size="sm"
                    variant="outline"
                    className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm flex items-center gap-1 flex-1 sm:flex-none"
                  >
                    <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate hidden sm:inline">Настройки</span>
                    <span className="truncate sm:hidden">Настр.</span>
                  </Button>
                  <Button
                    onClick={() => setShowScheduleManager(true)}
                    size="sm"
                    variant="outline"
                    className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm flex items-center gap-1 flex-1 sm:flex-none"
                  >
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">Расписание</span>
                  </Button>
                </>
              )}
                
            </div>
              
            {/* Ползунок разрешения редактирования для менеджера - только для админов */}
            {userRole === 'ADMIN' && object?.manager && (
              <div className="flex flex-col gap-2 bg-gray-50 p-2 sm:p-3 rounded-lg border w-full">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-gray-700">
                    Разрешить менеджеру редактировать:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] sm:text-sm ${!object.allowManagerEdit ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    Нет
                  </span>
                  <button
                    onClick={toggleManagerEditPermission}
                    className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      object.allowManagerEdit ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                        object.allowManagerEdit ? 'translate-x-4 sm:translate-x-6' : 'translate-x-0.5 sm:translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-[10px] sm:text-sm ${object.allowManagerEdit ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    Да
                  </span>
                </div>
              </div>
            )}
            
            <div className="text-xs sm:text-sm text-gray-500 text-right">
              Создан: {new Date(object.createdAt).toLocaleDateString('ru-RU')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Менеджеры объекта - КОМПАКТНЫЙ ДИЗАЙН */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-600" />
                  Менеджеры
                </h3>
                {!isEditingManagers && userRole !== 'MANAGER' ? (
                  <Button
                    onClick={startEditingManagers}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Изменить
                  </Button>
                ) : isEditingManagers ? (
                  <div className="flex space-x-1">
                    <Button
                      onClick={cancelEditingManagers}
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs"
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={saveAllManagers}
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Сохранить
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-1">
                {/* Старший менеджер - показываем если есть */}
                {(() => {
                  // Ищем участок со старшим менеджером
                  const siteWithSeniorManager = object.sites?.find(site => site.seniorManager);
                  const seniorManager = siteWithSeniorManager?.seniorManager;
                  
                  // В режиме редактирования показываем всегда (для возможности назначения)
                  if (isEditingManagers || seniorManager) {
                    return (
                      <div className="flex items-center justify-between p-2 bg-purple-50 rounded border-l-2 border-purple-500">
                        <div className="flex items-center flex-1">
                          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-bold">👔</span>
                          </div>
                          <div className="flex-1">
                            {isEditingManagers ? (
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-purple-700">
                                  Старший менеджер:
                                </label>
                                <select
                                  value={seniorManager?.id || ''}
                                  onChange={(e) => {
                                    const managerId = e.target.value;
                                    // Находим виртуальный участок или первый участок для назначения старшего менеджера
                                    const virtualSite = object.sites?.find(s => s.name.includes('__VIRTUAL__'));
                                    const targetSite = virtualSite || object.sites?.[0];
                                    
                                    if (targetSite) {
                                      setSiteManagers(prev => ({
                                        ...prev,
                                        [`senior_${targetSite.id}`]: managerId
                                      }));
                                    }
                                  }}
                                  className="w-full p-1 text-sm border border-purple-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                >
                                  <option value="">-- Выберите старшего менеджера --</option>
                                  {managers.filter(m => m.role === 'SENIOR_MANAGER').map((manager) => (
                                    <option key={manager.id} value={manager.id}>
                                      {manager.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div>
                                <span className="text-sm font-medium text-purple-900">{seniorManager?.name}</span>
                                <span className="text-xs text-purple-600 block">Старший менеджер</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Менеджеры участков - показываем всех с их участками */}
                {(() => {
                  // Получаем всех менеджеров с участками
                  const managersWithSites = object.sites
                    ?.filter(site => site.manager && !site.name.includes('__VIRTUAL__'))
                    .map(site => ({ ...site, isVirtual: false })) || [];
                  
                  // Получаем менеджеров с виртуальных участков
                  const managersFromVirtual = object.sites
                    ?.filter(site => site.manager && site.name.includes('__VIRTUAL__'))
                    .map(site => ({ ...site, isVirtual: true })) || [];
                  
                  const allManagers = [...managersWithSites, ...managersFromVirtual];
                  
                  // Если только один менеджер и он на виртуальном участке - не показываем участок
                  const showSiteName = allManagers.length > 1 || (allManagers.length === 1 && !allManagers[0].isVirtual);
                  
                  return allManagers.map((site) => (
                    <div key={site.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                      <div className="flex items-center flex-1">
                        <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs">●</span>
                        </div>
                        <div className="flex-1">
                          {isEditingManagers ? (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-700">
                                {showSiteName && !site.isVirtual && site.comment ? `${site.comment}:` : 'Менеджер:'}
                              </label>
                              <select
                                value={siteManagers[site.id] || ''}
                                onChange={(e) => setSiteManagers(prev => ({
                                  ...prev,
                                  [site.id]: e.target.value
                                }))}
                                className="w-full p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">-- Выберите менеджера --</option>
                                {managers.map((manager) => (
                                  <option key={manager.id} value={manager.id}>
                                    {manager.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <span className="text-sm font-medium text-gray-800">{site.manager?.name}</span>
                              {site.manager?.role === 'SENIOR_MANAGER' && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Старший</span>
                              )}
                              {showSiteName && !site.isVirtual && (
                                <span className="text-xs text-gray-600 block">
                                  Участок: {site.comment || site.name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}

                {/* Если нет ни одного менеджера */}
                {(!object.sites || object.sites.filter(s => s.manager).length === 0) && 
                 !object.sites?.find(s => s.seniorManager) && (
                  <div className="p-2 bg-gray-50 rounded border-l-2 border-gray-300 text-center">
                    <span className="text-sm text-gray-500">Менеджеры не назначены</span>
                  </div>
                )}

              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Новый двухколоночный дизайн */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левая колонка - Иерархия объекта */}
        <div>
          <Card className="h-[700px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Структура объекта
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DynamicObjectTree 
                objectId={object.id} 
                onSelectTechTasks={handleSelectTechTasks}
              />
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка - Техзадания */}
        <div>
          <TechTasksPanel 
            techTasks={selectedTechTasks}
            context={selectedContext}
          />
        </div>
      </div>


      {/* Модальное окно управления техкартами */}
      {showTechCardManager && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Управление техкартами</h2>
              <Button
                onClick={() => setShowTechCardManager(false)}
                variant="outline"
                size="sm"
              >
                ✕ Закрыть
              </Button>
            </div>
            
            <TechCardManager 
              roomId={selectedRoom.id}
              roomName={selectedRoom.name}
              objectId={object?.id || ''}
            />
          </div>
        </div>
      )}

      {/* Модальное окно завершения чек-листа */}
      <ChecklistCompletionModal
        checklist={selectedChecklistForCompletion}
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          setSelectedChecklistForCompletion(null);
        }}
        onComplete={handleCompletionSuccess}
      />

      {/* Модальное окно настроек требований к завершению */}
      <CompletionRequirementsManager
        isOpen={showRequirementsManager}
        onClose={() => setShowRequirementsManager(false)}
        objectId={object.id}
      />

      {/* Модальное окно управления расписанием задач */}
      <TaskScheduleManager
        isOpen={showScheduleManager}
        onClose={() => setShowScheduleManager(false)}
        objectId={object.id}
      />

      {/* Модальное окно редактирования объекта */}
      <ObjectEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        objectId={object.id}
        onUpdate={() => {
          fetchObjectData();
          setShowEditModal(false);
        }}
      />
    </div>
  );
}
